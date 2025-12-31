// Advanced metrics calculations for examination data
// Includes period grades, variations, and trajectory analysis

import { Sin, Term, Gravity, MateriaTipo, Manifestation, Mode } from './sins.types';
import { ExamSession, SinEvent, AttentionLevel, MotiveType, ResponsibilityType } from './types';
import { getEventScore, calculateEventScore, calculateAggregation, ScoreBreakdown } from './scoring';
import { getSins } from './sins.storage';
import { getExamSessions } from './examSessions';
import { getPersonTypes, getActivities } from './entities';

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
  sinIds?: string[];
  terms?: Term[];
  gravities?: Gravity[];
  personTypeIds?: string[];
  activityIds?: string[];
  capitalSins?: string[];
  manifestations?: Manifestation[];
  modes?: Mode[];
  materiaTipos?: MateriaTipo[];
}

// ========== Event Enrichment ==========

export interface EnrichedEvent {
  event: SinEvent;
  sin: Sin;
  score: number;
  breakdown: ScoreBreakdown;
  isMortalImputable: boolean;
}

function enrichEvents(sessions: ExamSession[], sins: Sin[]): EnrichedEvent[] {
  const sinMap = new Map(sins.map(s => [s.id, s]));
  const enriched: EnrichedEvent[] = [];
  
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

// ========== Filter Application ==========

function applyFilters(events: EnrichedEvent[], filter: MetricFilter): EnrichedEvent[] {
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
    return true;
  });
}

// ========== Period Grade (Nota del Periodo) ==========

export interface PeriodGrade {
  passed: boolean;
  grade: number;
  venialLoad: number;
  venialRate: number;
  mortalCount: number;
  mortalPeak: number;
  aggregationsCrossed: number;
  periodHours: number;
  explanation: string;
}

export function calculatePeriodGrade(
  sessions: ExamSession[],
  sins: Sin[],
  periodConfig: PeriodConfig
): PeriodGrade {
  const periodEvents = sessions
    .filter(s => s.startedAt >= periodConfig.startDate && s.startedAt <= periodConfig.endDate)
    .flatMap(s => s.events);
  
  const enriched = enrichEvents([{ events: periodEvents } as ExamSession], sins);
  
  // Calculate mortal imputables
  const mortalImputables = enriched.filter(e => e.isMortalImputable);
  const mortalCount = mortalImputables.length;
  const mortalPeak = mortalImputables.length > 0 
    ? Math.max(...mortalImputables.map(e => e.score))
    : 0;
  
  // Check aggregations that crossed threshold
  const aggregableSins = sins.filter(s => s.canAggregateToMortal);
  let aggregationsCrossed = 0;
  
  for (const sin of aggregableSins) {
    const sinEvents = periodEvents.filter(e => e.sinId === sin.id);
    const totalUnits = sinEvents.reduce((sum, e) => sum + e.countIncrement * sin.unitPerTap, 0);
    if (totalUnits >= sin.mortalThresholdUnits) {
      aggregationsCrossed++;
    }
  }
  
  // Determine pass/fail
  const failed = mortalCount > 0 || aggregationsCrossed > 0;
  
  // Calculate venial load (non-mortal-imputable events)
  const nonMortalEvents = enriched.filter(e => !e.isMortalImputable);
  const venialLoad = nonMortalEvents.reduce((sum, e) => sum + e.score, 0);
  
  // Period duration in hours
  const periodHours = (periodConfig.endDate - periodConfig.startDate) / (1000 * 60 * 60);
  const venialRate = venialLoad / Math.max(1, periodHours);
  
  let grade: number;
  let explanation: string;
  
  if (!failed) {
    // Passed: range 10.5 - 20
    const p = Math.min(venialRate / PASS_RATE_MAX, 1);
    grade = 20 - 9.5 * p;
    explanation = `Aprobado. Carga venial: ${venialLoad.toFixed(1)}, Tasa: ${venialRate.toFixed(2)}/h`;
  } else {
    // Failed: range 1 - 10.4
    const f = Math.min(
      0.55 * (mortalPeak / 100) + 
      0.35 * Math.min(1, mortalCount / 3) + 
      0.10 * Math.min(1, venialRate / PASS_RATE_MAX),
      1
    );
    grade = 10.4 - 9.4 * f;
    explanation = mortalCount > 0 
      ? `Desaprobado por ${mortalCount} pecado(s) mortal(es) imputable(s)`
      : `Desaprobado por ${aggregationsCrossed} acumulación(es) que alcanzó materia grave`;
  }
  
  return {
    passed: !failed,
    grade: Math.round(grade * 10) / 10,
    venialLoad,
    venialRate,
    mortalCount,
    mortalPeak,
    aggregationsCrossed,
    periodHours,
    explanation,
  };
}

// ========== Variations (Progress/Regression) ==========

export type VariationType = 'progress' | 'regression' | 'stable';

export interface VariationResult {
  currentValue: number;
  previousValue: number;
  delta: number;
  percentage: number;
  type: VariationType;
}

export function calculateVariation(currentValue: number, previousValue: number): VariationResult {
  const delta = currentValue - previousValue;
  const percentage = delta / Math.max(EPSILON, previousValue) * 100;
  
  let type: VariationType = 'stable';
  if (delta < -0.1 * Math.max(EPSILON, previousValue)) {
    type = 'progress'; // Less score = progress
  } else if (delta > 0.1 * Math.max(EPSILON, previousValue)) {
    type = 'regression'; // More score = regression
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

export function calculateTrajectory(
  enrichedEvents: EnrichedEvent[],
  periodConfig: PeriodConfig,
  previousPeriodEvents?: EnrichedEvent[]
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
  
  const totalScore = enrichedEvents
    .filter(e => e.event.timestamp >= periodConfig.startDate && e.event.timestamp <= periodConfig.endDate)
    .reduce((sum, e) => sum + e.score, 0);
  
  const eventCount = enrichedEvents
    .filter(e => e.event.timestamp >= periodConfig.startDate && e.event.timestamp <= periodConfig.endDate)
    .length;
  
  // Calculate variation vs previous period
  let variation: VariationResult | null = null;
  if (previousPeriodEvents) {
    const previousTotal = previousPeriodEvents.reduce((sum, e) => sum + e.score, 0);
    variation = calculateVariation(totalScore, previousTotal);
  }
  
  return {
    points,
    totalScore,
    eventCount,
    variation,
  };
}

// ========== Main Metrics Calculation ==========

export interface MetricsResult {
  periodGrade: PeriodGrade;
  totalTrajectory: TrajectoryData;
  bySin: Map<string, TrajectoryData>;
  byTerm: Map<Term, TrajectoryData>;
  byPersonType: Map<string, TrajectoryData>;
  byActivity: Map<string, TrajectoryData>;
  byCapitalSin: Map<string, TrajectoryData>;
  byGravity: Map<Gravity, TrajectoryData>;
  byManifestation: Map<Manifestation, TrajectoryData>;
  byMode: Map<Mode, TrajectoryData>;
  filteredTrajectory: TrajectoryData | null;
}

export function calculateMetrics(
  periodConfig: PeriodConfig,
  filter?: MetricFilter
): MetricsResult {
  const sessions = getExamSessions();
  const sins = getSins();
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
  const enrichedEvents = enrichEvents(periodSessions, sins);
  const previousEnrichedEvents = enrichEvents(previousSessions, sins);
  
  // Period grade
  const periodGrade = calculatePeriodGrade(sessions, sins, periodConfig);
  
  // Total trajectory
  const totalTrajectory = calculateTrajectory(enrichedEvents, periodConfig, previousEnrichedEvents);
  
  // Trajectories by dimension
  const bySin = new Map<string, TrajectoryData>();
  for (const sin of sins) {
    const sinEvents = enrichedEvents.filter(e => e.sin.id === sin.id);
    const prevSinEvents = previousEnrichedEvents.filter(e => e.sin.id === sin.id);
    if (sinEvents.length > 0 || prevSinEvents.length > 0) {
      bySin.set(sin.id, calculateTrajectory(sinEvents, periodConfig, prevSinEvents));
    }
  }
  
  const byTerm = new Map<Term, TrajectoryData>();
  for (const term of ['contra_dios', 'contra_projimo', 'contra_si_mismo'] as Term[]) {
    const termEvents = enrichedEvents.filter(e => e.sin.terms.includes(term));
    const prevTermEvents = previousEnrichedEvents.filter(e => e.sin.terms.includes(term));
    byTerm.set(term, calculateTrajectory(termEvents, periodConfig, prevTermEvents));
  }
  
  const byPersonType = new Map<string, TrajectoryData>();
  for (const pt of personTypes) {
    const ptEvents = enrichedEvents.filter(e => e.sin.involvedPersonTypes.includes(pt.id));
    const prevPtEvents = previousEnrichedEvents.filter(e => e.sin.involvedPersonTypes.includes(pt.id));
    if (ptEvents.length > 0 || prevPtEvents.length > 0) {
      byPersonType.set(pt.id, calculateTrajectory(ptEvents, periodConfig, prevPtEvents));
    }
  }
  
  const byActivity = new Map<string, TrajectoryData>();
  for (const act of activities) {
    const actEvents = enrichedEvents.filter(e => e.sin.associatedActivities.includes(act.id));
    const prevActEvents = previousEnrichedEvents.filter(e => e.sin.associatedActivities.includes(act.id));
    if (actEvents.length > 0 || prevActEvents.length > 0) {
      byActivity.set(act.id, calculateTrajectory(actEvents, periodConfig, prevActEvents));
    }
  }
  
  const byCapitalSin = new Map<string, TrajectoryData>();
  const allCapitalSins = new Set<string>();
  sins.forEach(s => s.capitalSins.forEach(c => allCapitalSins.add(c)));
  for (const capital of allCapitalSins) {
    const capEvents = enrichedEvents.filter(e => e.sin.capitalSins.includes(capital));
    const prevCapEvents = previousEnrichedEvents.filter(e => e.sin.capitalSins.includes(capital));
    if (capEvents.length > 0 || prevCapEvents.length > 0) {
      byCapitalSin.set(capital, calculateTrajectory(capEvents, periodConfig, prevCapEvents));
    }
  }
  
  const byGravity = new Map<Gravity, TrajectoryData>();
  for (const gravity of ['mortal', 'venial'] as Gravity[]) {
    const gravEvents = enrichedEvents.filter(e => e.sin.gravities.includes(gravity));
    const prevGravEvents = previousEnrichedEvents.filter(e => e.sin.gravities.includes(gravity));
    byGravity.set(gravity, calculateTrajectory(gravEvents, periodConfig, prevGravEvents));
  }
  
  const byManifestation = new Map<Manifestation, TrajectoryData>();
  for (const manif of ['externo', 'interno'] as Manifestation[]) {
    const manifEvents = enrichedEvents.filter(e => e.sin.manifestations.includes(manif));
    const prevManifEvents = previousEnrichedEvents.filter(e => e.sin.manifestations.includes(manif));
    byManifestation.set(manif, calculateTrajectory(manifEvents, periodConfig, prevManifEvents));
  }
  
  const byMode = new Map<Mode, TrajectoryData>();
  for (const mode of ['comision', 'omision'] as Mode[]) {
    const modeEvents = enrichedEvents.filter(e => e.sin.modes.includes(mode));
    const prevModeEvents = previousEnrichedEvents.filter(e => e.sin.modes.includes(mode));
    byMode.set(mode, calculateTrajectory(modeEvents, periodConfig, prevModeEvents));
  }
  
  // Filtered trajectory
  let filteredTrajectory: TrajectoryData | null = null;
  if (filter && Object.values(filter).some(v => v?.length)) {
    const filtered = applyFilters(enrichedEvents, filter);
    const prevFiltered = applyFilters(previousEnrichedEvents, filter);
    filteredTrajectory = calculateTrajectory(filtered, periodConfig, prevFiltered);
  }
  
  return {
    periodGrade,
    totalTrajectory,
    bySin,
    byTerm,
    byPersonType,
    byActivity,
    byCapitalSin,
    byGravity,
    byManifestation,
    byMode,
    filteredTrajectory,
  };
}
