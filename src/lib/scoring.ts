// Internal scoring system for sin events
// Score is used for metrics and trends, NOT shown to users as a number

import { Sin, Term, Gravity, MateriaTipo, Manifestation } from './sins.types';
import { SinEvent, AttentionLevel, MotiveType, ResponsibilityType, OptionalFlags } from './types';
import { getPreferences, calculateCondicionantesFactor } from './preferences';

// ========== Constants ==========

const MIN_RAW = 4.2;  // Lightest recordable venial (semi-deliberate, ignorance, formal)
const MAX_RAW = 165;  // Worst possible sin (impenitence, against Holy Spirit, deliberate, malice, formal)

// ========== P_base Calculation ==========

function calculatePBase(sin: Sin): number {
  // If manual override exists, use it
  if (sin.manualWeightOverride !== undefined && sin.manualWeightOverride > 0) {
    return sin.manualWeightOverride;
  }

  const isMortal = sin.gravities.includes('mortal');
  const isVenial = sin.gravities.includes('venial');
  
  if (isMortal) {
    if (sin.materiaTipo.includes('ex_toto')) {
      return 80;
    }
    if (sin.materiaTipo.includes('ex_genere')) {
      return 60;
    }
    // Mortal without specific materiaTipo defaults to ex_genere
    return 60;
  }
  
  if (isVenial || sin.materiaTipo.includes('venial_propio_genero')) {
    return 10;
  }
  
  // Default to venial if no gravity specified
  return 10;
}

// ========== Term Factor ==========

const TERM_FACTORS: Record<Term, number> = {
  contra_dios: 1.10,
  contra_projimo: 1.05,
  contra_si_mismo: 1.00,
};

function calculateTermFactor(terms: Term[]): number {
  if (terms.length === 0) return 1.00;
  
  // Use highest priority term factor
  if (terms.includes('contra_dios')) return TERM_FACTORS.contra_dios;
  if (terms.includes('contra_projimo')) return TERM_FACTORS.contra_projimo;
  return TERM_FACTORS.contra_si_mismo;
}

// ========== Special Factor ==========

// Priority: contra Espíritu Santo > clama al cielo > capital sin
// We multiply with a cap to avoid inflation

interface SpecialFactorResult {
  factor: number;
  reasons: string[];
}

function calculateSpecialFactor(sin: Sin): SpecialFactorResult {
  const reasons: string[] = [];
  let factor = 1.00;
  
  // Check for sins against the Holy Spirit (highest priority)
  const isAgainstHolySpirit = sin.tags.some(tag => 
    tag.toLowerCase().includes('espíritu santo') || 
    tag.toLowerCase().includes('impenitencia') ||
    tag.toLowerCase().includes('presunción') ||
    tag.toLowerCase().includes('desesperación')
  );
  
  // Check for sins that cry to heaven
  const criestoHeaven = sin.tags.some(tag => 
    tag.toLowerCase().includes('clama al cielo') ||
    tag.toLowerCase().includes('sangre inocente') ||
    tag.toLowerCase().includes('opresión')
  );
  
  // Check for capital sin
  const hasCapitalSin = sin.capitalSins.length > 0;
  
  // Apply factors with priority (multiply but cap)
  if (isAgainstHolySpirit) {
    factor *= 1.50;
    reasons.push('contra Espíritu Santo');
  }
  
  if (criestoHeaven) {
    factor *= 1.35;
    reasons.push('clama al cielo');
  }
  
  if (hasCapitalSin) {
    factor *= 1.10;
    reasons.push('pecado capital');
  }
  
  // Cap the special factor to avoid extreme inflation
  // Max combined: 1.50 * 1.35 * 1.10 = 2.2275, cap at 2.0
  factor = Math.min(factor, 2.0);
  
  return { factor, reasons };
}

// ========== Manifestation Factor ==========

const MANIFESTATION_FACTORS: Record<Manifestation, number> = {
  interno: 1.00,
  externo: 1.35,
};

function calculateManifestationFactor(manifestations: Manifestation[]): number {
  if (manifestations.length === 0) return 1.00;
  
  // If both, use external (higher)
  if (manifestations.includes('externo')) {
    return MANIFESTATION_FACTORS.externo;
  }
  return MANIFESTATION_FACTORS.interno;
}

// ========== Subjective Factors ==========

const ATTENTION_FACTORS: Record<AttentionLevel, number> = {
  deliberado: 1.00,
  semideliberado: 0.60,
};

const MOTIVE_FACTORS: Record<MotiveType, number> = {
  fragilidad: 1.00,
  ignorancia: 0.70,
  malicia: 1.25,
};

const RESPONSIBILITY_FACTORS: Record<ResponsibilityType, number> = {
  formal: 1.00,
  material: 0.25,
};

// ========== Optional Flags Factors ==========

interface FlagFactors {
  escandaloGrave: number;
  finGravementeMalo: number;
  desprecioFormalLey: number;
  peligroProximo: number;
}

const FLAG_FACTORS: FlagFactors = {
  escandaloGrave: 1.20,
  finGravementeMalo: 1.30,
  desprecioFormalLey: 1.30,
  peligroProximo: 1.15,
};

function calculateFlagsFactor(flags?: OptionalFlags): number {
  if (!flags) return 1.00;
  
  let factor = 1.00;
  
  if (flags.escandaloGrave) factor *= FLAG_FACTORS.escandaloGrave;
  if (flags.finGravementeMalo) factor *= FLAG_FACTORS.finGravementeMalo;
  if (flags.desprecioFormalLey) factor *= FLAG_FACTORS.desprecioFormalLey;
  if (flags.peligroProximo) factor *= FLAG_FACTORS.peligroProximo;
  
  return factor;
}

// ========== Main Scoring Function ==========

export interface ScoreBreakdown {
  pBase: number;
  termFactor: number;
  specialFactor: number;
  specialReasons: string[];
  manifestationFactor: number;
  attentionFactor: number;
  motiveFactor: number;
  responsibilityFactor: number;
  flagsFactor: number;
  condicionantesFactor: number;
  appliedCondicionantes: string[];
  condicionantesK: number;
  rawScore: number;
  cappedScore: number;
  normalizedScore: number;
}

export function calculateEventScore(sin: Sin, event: SinEvent): ScoreBreakdown {
  const pBase = calculatePBase(sin);
  const termFactor = calculateTermFactor(sin.terms);
  const { factor: specialFactor, reasons: specialReasons } = calculateSpecialFactor(sin);
  const manifestationFactor = calculateManifestationFactor(sin.manifestations);
  const attentionFactor = ATTENTION_FACTORS[event.attention];
  const motiveFactor = MOTIVE_FACTORS[event.motive];
  const responsibilityFactor = RESPONSIBILITY_FACTORS[event.responsibility];
  const flagsFactor = calculateFlagsFactor(event.optionalFlags);
  
  // Get condicionantes factor (use stored values if available, else calculate)
  let condicionantesFactor = 1.0;
  let appliedCondicionantes: string[] = [];
  let condicionantesK = 0;
  
  if (event.condicionantesFactor !== undefined) {
    // Use stored values from event
    condicionantesFactor = event.condicionantesFactor;
    appliedCondicionantes = event.appliedCondicionantes || [];
    condicionantesK = event.condicionantesK || 0;
  } else if (sin.condicionantes && sin.condicionantes.length > 0) {
    // Calculate from current subject profile
    const prefs = getPreferences();
    const result = calculateCondicionantesFactor(
      prefs.subjectProfile.condicionantesActivos,
      sin.condicionantes,
      'sin'
    );
    condicionantesFactor = result.factor;
    appliedCondicionantes = result.appliedCondicionantes;
    condicionantesK = result.k;
  }
  
  // Calculate raw score
  const rawScore = pBase 
    * termFactor 
    * specialFactor 
    * manifestationFactor 
    * attentionFactor 
    * motiveFactor 
    * responsibilityFactor 
    * flagsFactor
    * condicionantesFactor;
  
  // Cap the raw score
  const cappedScore = Math.min(rawScore, MAX_RAW);
  
  // Normalize to 0-100
  const normalizedScore = clamp(
    100 * (cappedScore - MIN_RAW) / (MAX_RAW - MIN_RAW),
    0,
    100
  );
  
  return {
    pBase,
    termFactor,
    specialFactor,
    specialReasons,
    manifestationFactor,
    attentionFactor,
    motiveFactor,
    responsibilityFactor,
    flagsFactor,
    condicionantesFactor,
    appliedCondicionantes,
    condicionantesK,
    rawScore,
    cappedScore,
    normalizedScore,
  };
}

// ========== Simplified Score Function ==========

export function getEventScore(sin: Sin, event: SinEvent): number {
  return calculateEventScore(sin, event).normalizedScore;
}

// ========== Aggregation Logic ==========

export interface AggregationResult {
  totalUnits: number;
  threshold: number;
  hasReachedMortal: boolean;
  percentageToMortal: number;
}

export function calculateAggregation(
  sin: Sin,
  events: SinEvent[]
): AggregationResult {
  if (!sin.canAggregateToMortal) {
    return {
      totalUnits: 0,
      threshold: 0,
      hasReachedMortal: false,
      percentageToMortal: 0,
    };
  }
  
  // Sum up all units for this sin in the given events
  const totalUnits = events
    .filter(e => e.sinId === sin.id)
    .reduce((sum, e) => sum + e.countIncrement * sin.unitPerTap, 0);
  
  const threshold = sin.mortalThresholdUnits;
  const hasReachedMortal = totalUnits >= threshold;
  const percentageToMortal = threshold > 0 
    ? Math.min((totalUnits / threshold) * 100, 100) 
    : 0;
  
  return {
    totalUnits,
    threshold,
    hasReachedMortal,
    percentageToMortal,
  };
}

// ========== Session Score ==========

export interface SessionScoreResult {
  totalScore: number;
  eventCount: number;
  averageScore: number;
  maxScore: number;
  minScore: number;
}

export function calculateSessionScore(
  sins: Sin[],
  events: SinEvent[]
): SessionScoreResult {
  if (events.length === 0) {
    return {
      totalScore: 0,
      eventCount: 0,
      averageScore: 0,
      maxScore: 0,
      minScore: 0,
    };
  }
  
  const sinMap = new Map(sins.map(s => [s.id, s]));
  const scores: number[] = [];
  
  for (const event of events) {
    const sin = sinMap.get(event.sinId);
    if (sin) {
      scores.push(getEventScore(sin, event));
    }
  }
  
  if (scores.length === 0) {
    return {
      totalScore: 0,
      eventCount: 0,
      averageScore: 0,
      maxScore: 0,
      minScore: 0,
    };
  }
  
  const totalScore = scores.reduce((a, b) => a + b, 0);
  
  return {
    totalScore,
    eventCount: scores.length,
    averageScore: totalScore / scores.length,
    maxScore: Math.max(...scores),
    minScore: Math.min(...scores),
  };
}

// ========== Period Score (for trends) ==========

export interface PeriodScoreResult {
  totalScore: number;
  eventCount: number;
  averagePerDay: number;
  trend: 'improving' | 'stable' | 'worsening';
}

export function calculatePeriodScore(
  sins: Sin[],
  sessions: { events: SinEvent[]; startedAt: number }[],
  periodDays: number
): PeriodScoreResult {
  const now = Date.now();
  const periodStart = now - periodDays * 24 * 60 * 60 * 1000;
  
  // Filter sessions in period
  const periodSessions = sessions.filter(s => s.startedAt >= periodStart);
  
  // Collect all events
  const allEvents = periodSessions.flatMap(s => s.events);
  
  const sessionScore = calculateSessionScore(sins, allEvents);
  
  // Calculate average per day
  const averagePerDay = periodDays > 0 
    ? sessionScore.totalScore / periodDays 
    : 0;
  
  // Simple trend calculation: compare first half vs second half
  const midPoint = periodStart + (now - periodStart) / 2;
  const firstHalfEvents = allEvents.filter(e => e.timestamp < midPoint);
  const secondHalfEvents = allEvents.filter(e => e.timestamp >= midPoint);
  
  const firstHalfScore = calculateSessionScore(sins, firstHalfEvents).totalScore;
  const secondHalfScore = calculateSessionScore(sins, secondHalfEvents).totalScore;
  
  let trend: 'improving' | 'stable' | 'worsening' = 'stable';
  const threshold = 0.1; // 10% difference threshold
  
  if (firstHalfScore > 0) {
    const change = (secondHalfScore - firstHalfScore) / firstHalfScore;
    if (change < -threshold) trend = 'improving';
    else if (change > threshold) trend = 'worsening';
  }
  
  return {
    totalScore: sessionScore.totalScore,
    eventCount: sessionScore.eventCount,
    averagePerDay,
    trend,
  };
}

// ========== Utility Functions ==========

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Export constants for reference
export const SCORING_CONSTANTS = {
  MIN_RAW,
  MAX_RAW,
  TERM_FACTORS,
  MANIFESTATION_FACTORS,
  ATTENTION_FACTORS,
  MOTIVE_FACTORS,
  RESPONSIBILITY_FACTORS,
  FLAG_FACTORS,
};
