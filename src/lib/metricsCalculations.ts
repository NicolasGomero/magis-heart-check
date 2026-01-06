// Advanced metrics calculations for examination data
// Includes period grades (1-10), variations, and trajectory analysis

import { Sin, Term, Gravity, MateriaTipo, Manifestation, Mode } from './sins.types';
import { BuenaObra, PurityOfIntention, CharityLevel, Quality, Circunstancias } from './buenasObras.types';
import { ExamSession, SinEvent, BuenaObraEvent, AttentionLevel, MotiveType, ResponsibilityType } from './types';
import { getEventScore, calculateEventScore, calculateAggregation, ScoreBreakdown } from './scoring';
import { getSins } from './sins.storage';
import { getBuenasObras } from './buenasObras.storage';
import { getExamSessions } from './examSessions';
import { getPersonTypes, getActivities } from './entities';
import { getPreferences, calculateCondicionantesFactor } from './preferences';

// ========== Constants ==========

const PASS_RATE_MAX = 50; // Calibrable parameter for venial rate
const EPSILON = 0.001;

// ========== Period Types ==========

export type PeriodPreset = '7d' | '30d' | '90d' | '1y' | 'custom';

export interface PeriodConfig {
  preset: PeriodPreset;
  startDate: number;
  endDate: number;
  label: string;
}

export function getPeriodConfig(preset: PeriodPreset, customStart?: Date, customEnd?: Date): PeriodConfig {
  const now = Date.now();
  const endDate = customEnd?.getTime() ?? now;
  
  switch (preset) {
    case '7d':
      return {
        preset,
        startDate: now - 7 * 24 * 60 * 60 * 1000,
        endDate: now,
        label: '7 días',
      };
    case '30d':
      return {
        preset,
        startDate: now - 30 * 24 * 60 * 60 * 1000,
        endDate: now,
        label: '30 días',
      };
    case '90d':
      return {
        preset,
        startDate: now - 90 * 24 * 60 * 60 * 1000,
        endDate: now,
        label: '90 días',
      };
    case '1y':
      return {
        preset,
        startDate: now - 365 * 24 * 60 * 60 * 1000,
        endDate: now,
        label: '1 año',
      };
    case 'custom':
      return {
        preset,
        startDate: customStart?.getTime() ?? now - 7 * 24 * 60 * 60 * 1000,
        endDate,
        label: 'Personalizado',
      };
  }
}

// ========== Filter Types ==========

export interface MetricFilter {
  // Only for trayectorias, NOT for filtros combinables
  sinIds?: string[];
  buenaObraIds?: string[];
  // Dimensions in order
  terms?: Term[];
  personTypeIds?: string[];
  gravities?: Gravity[];
  capitalSins?: string[];
  virtudesTeologales?: string[];
  virtudesCardinales?: string[];
  virtudesAnexas?: string[];
  vows?: string[];
  activityIds?: string[];
  attentions?: AttentionLevel[];
  motives?: MotiveType[];
  materiaTipos?: MateriaTipo[];
  purityOfIntentions?: PurityOfIntention[];
  manifestations?: Manifestation[];
  modes?: Mode[];
  charityLevels?: CharityLevel[];
  qualities?: Quality[];
  circunstancias?: Circunstancias[];
  condicionantes?: string[];
  spiritualMeans?: string[];
}

// ========== Enriched Events ==========

export interface EnrichedSinEvent {
  event: SinEvent;
  sin: Sin;
  score: number;
  breakdown: ScoreBreakdown;
  isMortalImputable: boolean;
}

export interface EnrichedBuenaObraEvent {
  event: BuenaObraEvent;
  buenaObra: BuenaObra;
  score: number;
}

function enrichSinEvents(sessions: ExamSession[], sins: Sin[]): EnrichedSinEvent[] {
  const sinMap = new Map(sins.map(s => [s.id, s]));
  const enriched: EnrichedSinEvent[] = [];
  
  for (const session of sessions) {
    for (const event of session.events) {
      const sin = sinMap.get(event.sinId);
      if (!sin) continue;
      
      const breakdown = calculateEventScore(sin, event);
      const isMortalImputable = 
        sin.gravities.includes('mortal') &&
        event.attention === 'deliberado' &&
        event.responsibility === 'formal' &&
        event.motive !== 'ignorancia';
      
      enriched.push({
        event,
        sin,
        score: breakdown.normalizedScore,
        breakdown,
        isMortalImputable,
      });
    }
  }
  
  return enriched;
}

function enrichBuenaObraEvents(sessions: ExamSession[], buenasObras: BuenaObra[]): EnrichedBuenaObraEvent[] {
  const boMap = new Map(buenasObras.map(b => [b.id, b]));
  const enriched: EnrichedBuenaObraEvent[] = [];
  const prefs = getPreferences();
  
  for (const session of sessions) {
    const events = session.buenaObraEvents || [];
    for (const event of events) {
      const buenaObra = boMap.get(event.buenaObraId);
      if (!buenaObra) continue;
      
      // Base score for buena obra
      let baseScore = buenaObra.baseGoodOverride || 10;
      
      // Apply sacrificio modifier
      const sacrificioMod = buenaObra.sacrificioRelativo === 'alto' ? 1.5 
        : buenaObra.sacrificioRelativo === 'bajo' ? 0.7 : 1.0;
      
      // Apply condicionantes factor (amplifier)
      let condFactor = 1.0;
      if (event.condicionantesFactor) {
        condFactor = event.condicionantesFactor;
      } else if (buenaObra.condicionantes?.length > 0) {
        const result = calculateCondicionantesFactor(
          prefs.subjectProfile.condicionantesActivos,
          buenaObra.condicionantes,
          'buenaObra'
        );
        condFactor = result.factor;
      }
      
      const score = baseScore * sacrificioMod * condFactor * event.countIncrement;
      
      enriched.push({
        event,
        buenaObra,
        score,
      });
    }
  }
  
  return enriched;
}

// ========== Filter Application ==========

function applySinFilters(events: EnrichedSinEvent[], filter: MetricFilter): EnrichedSinEvent[] {
  return events.filter(e => {
    if (filter.sinIds?.length && !filter.sinIds.includes(e.sin.id)) return false;
    if (filter.terms?.length && !e.sin.terms.some(t => filter.terms!.includes(t))) return false;
    if (filter.gravities?.length && !e.sin.gravities.some(g => filter.gravities!.includes(g))) return false;
    if (filter.personTypeIds?.length && !e.sin.involvedPersonTypes.some(p => filter.personTypeIds!.includes(p))) return false;
    if (filter.activityIds?.length && !e.sin.associatedActivities.some(a => filter.activityIds!.includes(a))) return false;
    if (filter.capitalSins?.length && !e.sin.capitalSins.some(c => filter.capitalSins!.includes(c))) return false;
    if (filter.manifestations?.length && !e.sin.manifestations.some(m => filter.manifestations!.includes(m))) return false;
    if (filter.modes?.length && !e.sin.modes.some(m => filter.modes!.includes(m))) return false;
    if (filter.materiaTipos?.length && !e.sin.materiaTipo.some(m => filter.materiaTipos!.includes(m))) return false;
    if (filter.attentions?.length && !filter.attentions.includes(e.event.attention)) return false;
    if (filter.motives?.length && !filter.motives.includes(e.event.motive)) return false;
    if (filter.vows?.length && !e.sin.vows.some(v => filter.vows!.includes(v))) return false;
    if (filter.condicionantes?.length && !e.sin.condicionantes?.some(c => filter.condicionantes!.includes(c))) return false;
    if (filter.spiritualMeans?.length && !e.sin.spiritualAspects?.some(s => filter.spiritualMeans!.includes(s))) return false;
    return true;
  });
}

// ========== Period Grade (Nota del Periodo) - Scale 1-10 ==========

export interface ItemDetail {
  id: string;
  name: string;
  count: number;
  points: number;
}

export interface PeriodGrade {
  passed: boolean;
  grade: number; // 1-10 scale
  positivePoints: number; // Buenas obras
  negativePoints: number; // Pecados
  mortalCount: number;
  mortalPeak: number;
  aggregationsCrossed: number;
  periodHours: number;
  explanation: string;
  // Detail lists
  buenasObrasDetail: ItemDetail[];
  pecadosDetail: ItemDetail[];
}

export function calculatePeriodGrade(
  sessions: ExamSession[],
  sins: Sin[],
  buenasObras: BuenaObra[],
  periodConfig: PeriodConfig
): PeriodGrade {
  const periodSessions = sessions.filter(
    s => s.startedAt >= periodConfig.startDate && s.startedAt <= periodConfig.endDate
  );
  
  // Enrich events
  const sinEvents = enrichSinEvents(periodSessions, sins);
  const boEvents = enrichBuenaObraEvents(periodSessions, buenasObras);
  
  // Calculate mortal imputables
  const mortalImputables = sinEvents.filter(e => e.isMortalImputable);
  const mortalCount = mortalImputables.length;
  const mortalPeak = mortalImputables.length > 0 
    ? Math.max(...mortalImputables.map(e => e.score))
    : 0;
  
  // Check aggregations that crossed threshold
  const aggregableSins = sins.filter(s => s.canAggregateToMortal);
  let aggregationsCrossed = 0;
  
  for (const sin of aggregableSins) {
    const events = periodSessions.flatMap(s => s.events).filter(e => e.sinId === sin.id);
    const totalUnits = events.reduce((sum, e) => sum + e.countIncrement * sin.unitPerTap, 0);
    if (totalUnits >= sin.mortalThresholdUnits) {
      aggregationsCrossed++;
    }
  }
  
  // Determine pass/fail
  const hasMortalSin = mortalCount > 0 || aggregationsCrossed > 0;
  
  // Calculate points
  const negativePoints = sinEvents.reduce((sum, e) => sum + e.score, 0) / 10; // Normalize to 1-10 scale contribution
  const positivePoints = boEvents.reduce((sum, e) => sum + e.score, 0) / 10;
  
  // Period duration in hours
  const periodHours = (periodConfig.endDate - periodConfig.startDate) / (1000 * 60 * 60);
  
  // Calculate grade: Start from 10, subtract negative points
  // Positive points only apply if grade dropped below 10
  let grade = 10 - negativePoints;
  
  // Apply positive points only if there were discounts
  if (grade < 10 && positivePoints > 0) {
    grade = Math.min(10, grade + positivePoints);
  }
  
  // If mortal sin: max grade is 4.9, state is failed
  if (hasMortalSin) {
    grade = Math.min(4.9, grade);
  }
  
  // Clamp grade to 1-10
  grade = Math.max(1, Math.min(10, grade));
  
  let explanation: string;
  if (!hasMortalSin) {
    explanation = `Puntos negativos: ${negativePoints.toFixed(1)}, Puntos positivos: ${positivePoints.toFixed(1)}`;
  } else {
    explanation = mortalCount > 0 
      ? `Desaprobado por ${mortalCount} pecado(s) mortal(es) imputable(s)`
      : `Desaprobado por ${aggregationsCrossed} acumulación(es) que alcanzó materia grave`;
  }
  
  // Build detail lists
  const pecadosDetailMap = new Map<string, ItemDetail>();
  for (const e of sinEvents) {
    const existing = pecadosDetailMap.get(e.sin.id);
    if (existing) {
      existing.count += e.event.countIncrement;
      existing.points += e.score / 10;
    } else {
      pecadosDetailMap.set(e.sin.id, {
        id: e.sin.id,
        name: e.sin.name,
        count: e.event.countIncrement,
        points: e.score / 10,
      });
    }
  }
  
  const buenasObrasDetailMap = new Map<string, ItemDetail>();
  for (const e of boEvents) {
    const existing = buenasObrasDetailMap.get(e.buenaObra.id);
    if (existing) {
      existing.count += e.event.countIncrement;
      existing.points += e.score / 10;
    } else {
      buenasObrasDetailMap.set(e.buenaObra.id, {
        id: e.buenaObra.id,
        name: e.buenaObra.name,
        count: e.event.countIncrement,
        points: e.score / 10,
      });
    }
  }
  
  return {
    passed: !hasMortalSin,
    grade: Math.round(grade * 10) / 10,
    positivePoints: Math.round(positivePoints * 10) / 10,
    negativePoints: Math.round(negativePoints * 10) / 10,
    mortalCount,
    mortalPeak,
    aggregationsCrossed,
    periodHours,
    explanation,
    buenasObrasDetail: Array.from(buenasObrasDetailMap.values())
      .sort((a, b) => b.points - a.points),
    pecadosDetail: Array.from(pecadosDetailMap.values())
      .sort((a, b) => b.points - a.points),
  };
}

// ========== Variations (Progress/Regression) ==========

export type VariationType = 'progress' | 'regression' | 'stable';

export interface VariationResult {
  currentValue: number;
  previousValue: number;
  delta: number;
  percentage: number; // Rounded to 1 decimal
  type: VariationType;
}

export function calculateVariation(currentValue: number, previousValue: number): VariationResult {
  const delta = currentValue - previousValue;
  const percentage = Math.round((delta / Math.max(EPSILON, previousValue) * 100) * 10) / 10; // Round to 1 decimal
  
  let type: VariationType = 'stable';
  if (delta < -0.1 * Math.max(EPSILON, previousValue)) {
    type = 'progress'; // Less score = progress for sins
  } else if (delta > 0.1 * Math.max(EPSILON, previousValue)) {
    type = 'regression'; // More score = regression for sins
  }
  
  return {
    currentValue,
    previousValue,
    delta,
    percentage,
    type,
  };
}

// ========== Trajectory Data ==========

export interface TrajectoryPoint {
  timestamp: number;
  label: string;
  value: number;
  eventCount: number;
}

export interface TrajectoryData {
  points: TrajectoryPoint[];
  totalScore: number;
  eventCount: number;
  variation: VariationResult | null;
  contributionPercent?: number; // % of total
  itemDetails?: ItemDetail[];
}

type GranularityType = 'day' | 'week';

function getGranularity(periodDays: number): GranularityType {
  return periodDays <= 14 ? 'day' : 'week';
}

function getDateLabel(timestamp: number, granularity: GranularityType): string {
  const date = new Date(timestamp);
  if (granularity === 'day') {
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
  const weekStart = new Date(timestamp);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  return `Sem. ${weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;
}

function getBucketKey(timestamp: number, granularity: GranularityType): string {
  const date = new Date(timestamp);
  if (granularity === 'day') {
    return date.toISOString().split('T')[0];
  }
  const weekStart = new Date(timestamp);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  return weekStart.toISOString().split('T')[0];
}

export function calculateSinTrajectory(
  enrichedEvents: EnrichedSinEvent[],
  periodConfig: PeriodConfig,
  previousPeriodEvents?: EnrichedSinEvent[],
  totalNegativePoints?: number
): TrajectoryData {
  const periodDays = (periodConfig.endDate - periodConfig.startDate) / (1000 * 60 * 60 * 24);
  const granularity = getGranularity(periodDays);
  
  // Group events by bucket
  const buckets = new Map<string, { score: number; count: number; timestamp: number }>();
  
  // Initialize all buckets in the period
  const bucketCount = granularity === 'day' ? Math.ceil(periodDays) : Math.ceil(periodDays / 7);
  for (let i = 0; i < bucketCount; i++) {
    const bucketTime = periodConfig.startDate + i * (granularity === 'day' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000);
    const key = getBucketKey(bucketTime, granularity);
    if (!buckets.has(key)) {
      buckets.set(key, { score: 0, count: 0, timestamp: bucketTime });
    }
  }
  
  // Fill with actual data
  for (const e of enrichedEvents) {
    if (e.event.timestamp < periodConfig.startDate || e.event.timestamp > periodConfig.endDate) continue;
    const key = getBucketKey(e.event.timestamp, granularity);
    const bucket = buckets.get(key) || { score: 0, count: 0, timestamp: e.event.timestamp };
    bucket.score += e.score;
    bucket.count += 1;
    buckets.set(key, bucket);
  }
  
  // Convert to points array
  const points: TrajectoryPoint[] = Array.from(buckets.entries())
    .sort((a, b) => a[1].timestamp - b[1].timestamp)
    .map(([, bucket]) => ({
      timestamp: bucket.timestamp,
      label: getDateLabel(bucket.timestamp, granularity),
      value: bucket.score,
      eventCount: bucket.count,
    }));
  
  const periodEvents = enrichedEvents.filter(
    e => e.event.timestamp >= periodConfig.startDate && e.event.timestamp <= periodConfig.endDate
  );
  
  const totalScore = periodEvents.reduce((sum, e) => sum + e.score, 0);
  const eventCount = periodEvents.length;
  
  // Calculate variation vs previous period
  let variation: VariationResult | null = null;
  if (previousPeriodEvents) {
    const previousTotal = previousPeriodEvents.reduce((sum, e) => sum + e.score, 0);
    variation = calculateVariation(totalScore, previousTotal);
  }
  
  // Calculate contribution percentage
  let contributionPercent: number | undefined;
  if (totalNegativePoints !== undefined && totalNegativePoints > 0) {
    contributionPercent = Math.round((totalScore / totalNegativePoints * 100) * 10) / 10;
  }
  
  return {
    points,
    totalScore,
    eventCount,
    variation,
    contributionPercent,
  };
}

// ========== Dimension Keys ==========

export const DIMENSION_KEYS = [
  'term',           // Término
  'personType',     // Prójimo implicado
  'gravity',        // Gravedad
  'capitalSin',     // Pecado capital
  'virtudeTeologal',// Virtud teologal
  'virtudeCardinal',// Virtud moral cardinal
  'virtudeAnexa',   // Virtud moral anexa
  'vow',            // Voto
  'activity',       // Actividad
  'attention',      // Atención
  'motive',         // Motivo
  'materiaTipo',    // Tipo de materia
  'purityOfIntention', // Intención de la buena obra
  'manifestation',  // Manifestación
  'mode',           // Modo
  'charityLevel',   // Caridad
  'quality',        // Calidad de la obra
  'circunstancias', // Circunstancias de la buena obra
  'condicionante',  // Condicionantes
  'spiritualMean',  // Medios espirituales
] as const;

export type DimensionKey = typeof DIMENSION_KEYS[number];

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  term: 'Término',
  personType: 'Prójimo implicado',
  gravity: 'Gravedad',
  capitalSin: 'Pecado capital',
  virtudeTeologal: 'Virtud teologal',
  virtudeCardinal: 'Virtud moral cardinal',
  virtudeAnexa: 'Virtud moral anexa (principales)',
  vow: 'Voto',
  activity: 'Actividad',
  attention: 'Atención',
  motive: 'Motivo',
  materiaTipo: 'Tipo de materia',
  purityOfIntention: 'Intención de la buena obra',
  manifestation: 'Manifestación',
  mode: 'Modo',
  charityLevel: 'Caridad',
  quality: 'Calidad de la obra',
  circunstancias: 'Circunstancias de la buena obra',
  condicionante: 'Condicionantes',
  spiritualMean: 'Medios espirituales',
};

// ========== Main Metrics Calculation ==========

export interface TotalTrajectories {
  grade: TrajectoryData;
  buenasObras: TrajectoryData;
  mortalSins: TrajectoryData;
  venialSins: TrajectoryData;
}

export interface MetricsResult {
  periodGrade: PeriodGrade;
  totalTrajectories: TotalTrajectories;
  // By dimension
  bySin: Map<string, TrajectoryData>;
  byBuenaObra: Map<string, TrajectoryData>;
  byTerm: Map<Term, TrajectoryData>;
  byPersonType: Map<string, TrajectoryData>;
  byGravity: Map<Gravity, TrajectoryData>;
  byCapitalSin: Map<string, TrajectoryData>;
  byVirtudeTeologal: Map<string, TrajectoryData>;
  byVirtudeCardinal: Map<string, TrajectoryData>;
  byVirtudeAnexa: Map<string, TrajectoryData>;
  byVow: Map<string, TrajectoryData>;
  byActivity: Map<string, TrajectoryData>;
  byAttention: Map<AttentionLevel, TrajectoryData>;
  byMotive: Map<MotiveType, TrajectoryData>;
  byMateriaTipo: Map<MateriaTipo, TrajectoryData>;
  byManifestation: Map<Manifestation, TrajectoryData>;
  byMode: Map<Mode, TrajectoryData>;
  byCondicionante: Map<string, TrajectoryData>;
  bySpiritualMean: Map<string, TrajectoryData>;
  // Filtered
  filteredTrajectory: TrajectoryData | null;
  // Notes in period
  notesInPeriod: Array<{ sinId?: string; buenaObraId?: string; name: string; note: string; createdAt: number }>;
}

export function calculateMetrics(
  periodConfig: PeriodConfig,
  filter?: MetricFilter
): MetricsResult {
  const sessions = getExamSessions();
  const sins = getSins();
  const buenasObras = getBuenasObras();
  const personTypes = getPersonTypes();
  const activities = getActivities();
  
  // Filter sessions by period
  const periodSessions = sessions.filter(
    s => s.startedAt >= periodConfig.startDate && s.startedAt <= periodConfig.endDate
  );
  
  // Calculate previous period for comparison
  const periodDuration = periodConfig.endDate - periodConfig.startDate;
  const previousPeriodConfig: PeriodConfig = {
    ...periodConfig,
    startDate: periodConfig.startDate - periodDuration,
    endDate: periodConfig.startDate,
  };
  
  const previousSessions = sessions.filter(
    s => s.startedAt >= previousPeriodConfig.startDate && s.startedAt <= previousPeriodConfig.endDate
  );
  
  // Enrich all events
  const sinEvents = enrichSinEvents(periodSessions, sins);
  const previousSinEvents = enrichSinEvents(previousSessions, sins);
  const boEvents = enrichBuenaObraEvents(periodSessions, buenasObras);
  
  // Period grade
  const periodGrade = calculatePeriodGrade(sessions, sins, buenasObras, periodConfig);
  
  // Total negative/positive for contribution calc
  const totalNegative = sinEvents.reduce((sum, e) => sum + e.score, 0);
  const totalPositive = boEvents.reduce((sum, e) => sum + e.score, 0);
  
  // Total trajectories (4 series)
  const mortalEvents = sinEvents.filter(e => e.isMortalImputable);
  const venialEvents = sinEvents.filter(e => !e.isMortalImputable);
  const prevMortalEvents = previousSinEvents.filter(e => e.isMortalImputable);
  const prevVenialEvents = previousSinEvents.filter(e => !e.isMortalImputable);
  
  const totalTrajectories: TotalTrajectories = {
    grade: calculateGradeTrajectory(sessions, sins, buenasObras, periodConfig, previousPeriodConfig),
    buenasObras: calculateBuenaObraTrajectory(boEvents, periodConfig),
    mortalSins: calculateSinTrajectory(mortalEvents, periodConfig, prevMortalEvents),
    venialSins: calculateSinTrajectory(venialEvents, periodConfig, prevVenialEvents),
  };
  
  // === Trajectories by dimension ===
  
  // By Sin
  const bySin = new Map<string, TrajectoryData>();
  for (const sin of sins) {
    const events = sinEvents.filter(e => e.sin.id === sin.id);
    const prevEvents = previousSinEvents.filter(e => e.sin.id === sin.id);
    if (events.length > 0 || prevEvents.length > 0) {
      bySin.set(sin.id, calculateSinTrajectory(events, periodConfig, prevEvents, totalNegative));
    }
  }
  
  // By BuenaObra
  const byBuenaObra = new Map<string, TrajectoryData>();
  for (const bo of buenasObras) {
    const events = boEvents.filter(e => e.buenaObra.id === bo.id);
    if (events.length > 0) {
      const totalScore = events.reduce((sum, e) => sum + e.score, 0);
      const contributionPercent = totalPositive > 0 
        ? Math.round((totalScore / totalPositive * 100) * 10) / 10 
        : 0;
      byBuenaObra.set(bo.id, {
        points: [],
        totalScore,
        eventCount: events.length,
        variation: null,
        contributionPercent,
      });
    }
  }
  
  // By Term
  const byTerm = new Map<Term, TrajectoryData>();
  for (const term of ['contra_dios', 'contra_projimo', 'contra_si_mismo'] as Term[]) {
    const events = sinEvents.filter(e => e.sin.terms.includes(term));
    const prevEvents = previousSinEvents.filter(e => e.sin.terms.includes(term));
    byTerm.set(term, calculateSinTrajectory(events, periodConfig, prevEvents, totalNegative));
  }
  
  // By PersonType
  const byPersonType = new Map<string, TrajectoryData>();
  for (const pt of personTypes) {
    const events = sinEvents.filter(e => e.sin.involvedPersonTypes.includes(pt.id));
    const prevEvents = previousSinEvents.filter(e => e.sin.involvedPersonTypes.includes(pt.id));
    if (events.length > 0 || prevEvents.length > 0) {
      byPersonType.set(pt.id, calculateSinTrajectory(events, periodConfig, prevEvents, totalNegative));
    }
  }
  
  // By Gravity
  const byGravity = new Map<Gravity, TrajectoryData>();
  for (const gravity of ['mortal', 'venial'] as Gravity[]) {
    const events = sinEvents.filter(e => e.sin.gravities.includes(gravity));
    const prevEvents = previousSinEvents.filter(e => e.sin.gravities.includes(gravity));
    byGravity.set(gravity, calculateSinTrajectory(events, periodConfig, prevEvents, totalNegative));
  }
  
  // By Capital Sin
  const byCapitalSin = new Map<string, TrajectoryData>();
  const allCapitalSins = new Set<string>();
  sins.forEach(s => s.capitalSins.forEach(c => allCapitalSins.add(c)));
  for (const capital of allCapitalSins) {
    const events = sinEvents.filter(e => e.sin.capitalSins.includes(capital));
    const prevEvents = previousSinEvents.filter(e => e.sin.capitalSins.includes(capital));
    if (events.length > 0 || prevEvents.length > 0) {
      byCapitalSin.set(capital, calculateSinTrajectory(events, periodConfig, prevEvents, totalNegative));
    }
  }
  
  // By Virtudes
  const byVirtudeTeologal = new Map<string, TrajectoryData>();
  const byVirtudeCardinal = new Map<string, TrajectoryData>();
  const byVirtudeAnexa = new Map<string, TrajectoryData>();
  
  const TEOLOGALES = ['Fe', 'Esperanza', 'Caridad'];
  const CARDINALES = ['Prudencia', 'Justicia', 'Fortaleza', 'Templanza'];
  
  for (const sin of sins) {
    for (const virtue of sin.oppositeVirtues || []) {
      const events = sinEvents.filter(e => e.sin.id === sin.id);
      const prevEvents = previousSinEvents.filter(e => e.sin.id === sin.id);
      
      if (TEOLOGALES.includes(virtue)) {
        const existing = byVirtudeTeologal.get(virtue);
        if (!existing && (events.length > 0 || prevEvents.length > 0)) {
          byVirtudeTeologal.set(virtue, calculateSinTrajectory(
            sinEvents.filter(e => e.sin.oppositeVirtues?.includes(virtue)),
            periodConfig,
            previousSinEvents.filter(e => e.sin.oppositeVirtues?.includes(virtue)),
            totalNegative
          ));
        }
      } else if (CARDINALES.includes(virtue)) {
        if (!byVirtudeCardinal.has(virtue)) {
          byVirtudeCardinal.set(virtue, calculateSinTrajectory(
            sinEvents.filter(e => e.sin.oppositeVirtues?.includes(virtue)),
            periodConfig,
            previousSinEvents.filter(e => e.sin.oppositeVirtues?.includes(virtue)),
            totalNegative
          ));
        }
      } else {
        if (!byVirtudeAnexa.has(virtue)) {
          byVirtudeAnexa.set(virtue, calculateSinTrajectory(
            sinEvents.filter(e => e.sin.oppositeVirtues?.includes(virtue)),
            periodConfig,
            previousSinEvents.filter(e => e.sin.oppositeVirtues?.includes(virtue)),
            totalNegative
          ));
        }
      }
    }
  }
  
  // By Vow
  const byVow = new Map<string, TrajectoryData>();
  const allVows = new Set<string>();
  sins.forEach(s => s.vows?.forEach(v => allVows.add(v)));
  for (const vow of allVows) {
    const events = sinEvents.filter(e => e.sin.vows?.includes(vow));
    const prevEvents = previousSinEvents.filter(e => e.sin.vows?.includes(vow));
    if (events.length > 0 || prevEvents.length > 0) {
      byVow.set(vow, calculateSinTrajectory(events, periodConfig, prevEvents, totalNegative));
    }
  }
  
  // By Activity
  const byActivity = new Map<string, TrajectoryData>();
  for (const act of activities) {
    const events = sinEvents.filter(e => e.sin.associatedActivities.includes(act.id));
    const prevEvents = previousSinEvents.filter(e => e.sin.associatedActivities.includes(act.id));
    if (events.length > 0 || prevEvents.length > 0) {
      byActivity.set(act.id, calculateSinTrajectory(events, periodConfig, prevEvents, totalNegative));
    }
  }
  
  // By Attention
  const byAttention = new Map<AttentionLevel, TrajectoryData>();
  for (const attention of ['deliberado', 'semideliberado'] as AttentionLevel[]) {
    const events = sinEvents.filter(e => e.event.attention === attention);
    const prevEvents = previousSinEvents.filter(e => e.event.attention === attention);
    byAttention.set(attention, calculateSinTrajectory(events, periodConfig, prevEvents, totalNegative));
  }
  
  // By Motive
  const byMotive = new Map<MotiveType, TrajectoryData>();
  for (const motive of ['fragilidad', 'malicia', 'ignorancia'] as MotiveType[]) {
    const events = sinEvents.filter(e => e.event.motive === motive);
    const prevEvents = previousSinEvents.filter(e => e.event.motive === motive);
    byMotive.set(motive, calculateSinTrajectory(events, periodConfig, prevEvents, totalNegative));
  }
  
  // By MateriaTipo
  const byMateriaTipo = new Map<MateriaTipo, TrajectoryData>();
  for (const mt of ['ex_toto', 'ex_genere', 'venial_propio_genero'] as MateriaTipo[]) {
    const events = sinEvents.filter(e => e.sin.materiaTipo.includes(mt));
    const prevEvents = previousSinEvents.filter(e => e.sin.materiaTipo.includes(mt));
    byMateriaTipo.set(mt, calculateSinTrajectory(events, periodConfig, prevEvents, totalNegative));
  }
  
  // By Manifestation
  const byManifestation = new Map<Manifestation, TrajectoryData>();
  for (const manif of ['externo', 'interno'] as Manifestation[]) {
    const events = sinEvents.filter(e => e.sin.manifestations.includes(manif));
    const prevEvents = previousSinEvents.filter(e => e.sin.manifestations.includes(manif));
    byManifestation.set(manif, calculateSinTrajectory(events, periodConfig, prevEvents, totalNegative));
  }
  
  // By Mode
  const byMode = new Map<Mode, TrajectoryData>();
  for (const mode of ['comision', 'omision'] as Mode[]) {
    const events = sinEvents.filter(e => e.sin.modes.includes(mode));
    const prevEvents = previousSinEvents.filter(e => e.sin.modes.includes(mode));
    byMode.set(mode, calculateSinTrajectory(events, periodConfig, prevEvents, totalNegative));
  }
  
  // By Condicionante
  const byCondicionante = new Map<string, TrajectoryData>();
  const allCondicionantes = new Set<string>();
  sins.forEach(s => s.condicionantes?.forEach(c => allCondicionantes.add(c)));
  for (const cond of allCondicionantes) {
    const events = sinEvents.filter(e => e.sin.condicionantes?.includes(cond));
    const prevEvents = previousSinEvents.filter(e => e.sin.condicionantes?.includes(cond));
    if (events.length > 0 || prevEvents.length > 0) {
      byCondicionante.set(cond, calculateSinTrajectory(events, periodConfig, prevEvents, totalNegative));
    }
  }
  
  // By Spiritual Mean
  const bySpiritualMean = new Map<string, TrajectoryData>();
  const allMeans = new Set<string>();
  sins.forEach(s => s.spiritualAspects?.forEach(m => allMeans.add(m)));
  for (const mean of allMeans) {
    const events = sinEvents.filter(e => e.sin.spiritualAspects?.includes(mean));
    const prevEvents = previousSinEvents.filter(e => e.sin.spiritualAspects?.includes(mean));
    if (events.length > 0 || prevEvents.length > 0) {
      bySpiritualMean.set(mean, calculateSinTrajectory(events, periodConfig, prevEvents, totalNegative));
    }
  }
  
  // Filtered trajectory
  let filteredTrajectory: TrajectoryData | null = null;
  if (filter && Object.values(filter).some(v => v?.length)) {
    const filtered = applySinFilters(sinEvents, filter);
    const prevFiltered = applySinFilters(previousSinEvents, filter);
    filteredTrajectory = calculateSinTrajectory(filtered, periodConfig, prevFiltered, totalNegative);
  }
  
  // Collect notes in period
  const notesInPeriod: MetricsResult['notesInPeriod'] = [];
  for (const sin of sins) {
    for (const note of sin.notes || []) {
      if (note.createdAt >= periodConfig.startDate && note.createdAt <= periodConfig.endDate) {
        notesInPeriod.push({
          sinId: sin.id,
          name: sin.name,
          note: note.text,
          createdAt: note.createdAt,
        });
      }
    }
  }
  for (const bo of buenasObras) {
    for (const note of bo.notes || []) {
      if (note.createdAt >= periodConfig.startDate && note.createdAt <= periodConfig.endDate) {
        notesInPeriod.push({
          buenaObraId: bo.id,
          name: bo.name,
          note: note.text,
          createdAt: note.createdAt,
        });
      }
    }
  }
  notesInPeriod.sort((a, b) => b.createdAt - a.createdAt);
  
  return {
    periodGrade,
    totalTrajectories,
    bySin,
    byBuenaObra,
    byTerm,
    byPersonType,
    byGravity,
    byCapitalSin,
    byVirtudeTeologal,
    byVirtudeCardinal,
    byVirtudeAnexa,
    byVow,
    byActivity,
    byAttention,
    byMotive,
    byMateriaTipo,
    byManifestation,
    byMode,
    byCondicionante,
    bySpiritualMean,
    filteredTrajectory,
    notesInPeriod,
  };
}

// Helper for grade trajectory
function calculateGradeTrajectory(
  sessions: ExamSession[],
  sins: Sin[],
  buenasObras: BuenaObra[],
  periodConfig: PeriodConfig,
  previousPeriodConfig: PeriodConfig
): TrajectoryData {
  const periodDays = (periodConfig.endDate - periodConfig.startDate) / (1000 * 60 * 60 * 24);
  const granularity = getGranularity(periodDays);
  
  const points: TrajectoryPoint[] = [];
  const bucketCount = granularity === 'day' ? Math.ceil(periodDays) : Math.ceil(periodDays / 7);
  
  for (let i = 0; i < bucketCount; i++) {
    const bucketStart = periodConfig.startDate + i * (granularity === 'day' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000);
    const bucketEnd = bucketStart + (granularity === 'day' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000);
    
    const bucketConfig: PeriodConfig = {
      ...periodConfig,
      startDate: bucketStart,
      endDate: Math.min(bucketEnd, periodConfig.endDate),
    };
    
    const grade = calculatePeriodGrade(sessions, sins, buenasObras, bucketConfig);
    
    points.push({
      timestamp: bucketStart,
      label: getDateLabel(bucketStart, granularity),
      value: grade.grade,
      eventCount: 1,
    });
  }
  
  const currentGrade = calculatePeriodGrade(sessions, sins, buenasObras, periodConfig);
  const previousGrade = calculatePeriodGrade(sessions, sins, buenasObras, previousPeriodConfig);
  
  const variation = calculateVariation(currentGrade.grade, previousGrade.grade);
  // For grades, higher is better, so invert the type
  variation.type = variation.delta > 0 ? 'progress' : variation.delta < 0 ? 'regression' : 'stable';
  
  return {
    points,
    totalScore: currentGrade.grade,
    eventCount: points.length,
    variation,
  };
}

// Helper for buena obra trajectory
function calculateBuenaObraTrajectory(
  boEvents: EnrichedBuenaObraEvent[],
  periodConfig: PeriodConfig
): TrajectoryData {
  const periodDays = (periodConfig.endDate - periodConfig.startDate) / (1000 * 60 * 60 * 24);
  const granularity = getGranularity(periodDays);
  
  const buckets = new Map<string, { score: number; count: number; timestamp: number }>();
  
  const bucketCount = granularity === 'day' ? Math.ceil(periodDays) : Math.ceil(periodDays / 7);
  for (let i = 0; i < bucketCount; i++) {
    const bucketTime = periodConfig.startDate + i * (granularity === 'day' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000);
    const key = getBucketKey(bucketTime, granularity);
    if (!buckets.has(key)) {
      buckets.set(key, { score: 0, count: 0, timestamp: bucketTime });
    }
  }
  
  for (const e of boEvents) {
    if (e.event.timestamp < periodConfig.startDate || e.event.timestamp > periodConfig.endDate) continue;
    const key = getBucketKey(e.event.timestamp, granularity);
    const bucket = buckets.get(key) || { score: 0, count: 0, timestamp: e.event.timestamp };
    bucket.score += e.score;
    bucket.count += 1;
    buckets.set(key, bucket);
  }
  
  const points: TrajectoryPoint[] = Array.from(buckets.entries())
    .sort((a, b) => a[1].timestamp - b[1].timestamp)
    .map(([, bucket]) => ({
      timestamp: bucket.timestamp,
      label: getDateLabel(bucket.timestamp, granularity),
      value: bucket.score,
      eventCount: bucket.count,
    }));
  
  const totalScore = boEvents
    .filter(e => e.event.timestamp >= periodConfig.startDate && e.event.timestamp <= periodConfig.endDate)
    .reduce((sum, e) => sum + e.score, 0);
  
  return {
    points,
    totalScore,
    eventCount: boEvents.length,
    variation: null,
  };
}
