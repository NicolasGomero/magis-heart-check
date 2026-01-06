// Single source of truth for dimensions across the app
// Used by both FilterBuilder and DimensionTabs

import {
  Term,
  Gravity,
  Manifestation,
  Mode,
  MateriaTipo,
  TERM_LABELS,
  GRAVITY_LABELS,
  MANIFESTATION_LABELS,
  MODE_LABELS,
  MATERIA_TIPO_LABELS,
  DEFAULT_CAPITAL_SINS,
  VIRTUES_TEOLOGALES,
  VIRTUES_CARDINALES,
  DEFAULT_VOWS,
} from './sins.types';
import {
  PurityOfIntention,
  CharityLevel,
  Quality,
  Circunstancias,
  PURITY_LABELS,
  CHARITY_LABELS,
  QUALITY_LABELS,
  CIRCUNSTANCIAS_LABELS,
} from './buenasObras.types';
import { VIRTUDES_ANEXAS_PRINCIPALES } from './virtudesAnexas';
import { SEED_CONDICIONANTES } from './condicionantes';
import { MEDIOS_ESPIRITUALES_INICIAL } from './mediosEspirituales';
import { getPersonTypes, getActivities } from './entities';
import { MetricFilter } from './metricsCalculations';

// ========== Dimension Order (single source of truth) ==========

export const DIMENSION_ORDER = [
  'term',           // Término
  'personType',     // Prójimo implicado
  'gravity',        // Gravedad
  'capitalSin',     // Pecado capital
  'virtudeTeologal',// Virtud teologal
  'virtudeCardinal',// Virtud moral cardinal
  'virtudeAnexa',   // Virtud moral anexa (principales)
  'vow',            // Voto
  'activity',       // Actividad
  'attention',      // Atención
  'motive',         // Motivo
  'materiaTipo',    // Tipo de materia
  'purityOfIntention', // Intención
  'manifestation',  // Manifestación
  'mode',           // Modo
  'charityLevel',   // Caridad
  'quality',        // Calidad
  'circunstancias', // Circunstancias
  'condicionante',  // Condicionantes
  'spiritualMean',  // Medios espirituales
] as const;

export type DimensionKey = typeof DIMENSION_ORDER[number];

// ========== Dimension Labels ==========

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
  purityOfIntention: 'Intención',
  manifestation: 'Manifestación',
  mode: 'Modo',
  charityLevel: 'Caridad',
  quality: 'Calidad',
  circunstancias: 'Circunstancias',
  condicionante: 'Condicionantes',
  spiritualMean: 'Medios espirituales',
};

// ========== Attention and Motive Labels ==========

export const ATTENTION_LABELS: Record<string, string> = {
  deliberado: 'Deliberado',
  semideliberado: 'Semideliberado',
};

export const MOTIVE_LABELS: Record<string, string> = {
  fragilidad: 'Fragilidad',
  malicia: 'Malicia',
  ignorancia: 'Ignorancia',
};

// ========== Filter Section Interface ==========

export interface FilterSection {
  key: keyof MetricFilter;
  dimensionKey: DimensionKey;
  label: string;
  options: { value: string; label: string }[];
  hasVerMas?: boolean; // For medios espirituales
}

// ========== Get Filter Sections ==========

export function getFilterSections(): FilterSection[] {
  const personTypes = getPersonTypes();
  const activities = getActivities();

  return [
    {
      key: 'terms',
      dimensionKey: 'term',
      label: DIMENSION_LABELS.term,
      options: Object.entries(TERM_LABELS).map(([v, l]) => ({ value: v, label: l })),
    },
    {
      key: 'personTypeIds',
      dimensionKey: 'personType',
      label: DIMENSION_LABELS.personType,
      options: personTypes.map(p => ({ value: p.id, label: p.name })),
    },
    {
      key: 'gravities',
      dimensionKey: 'gravity',
      label: DIMENSION_LABELS.gravity,
      options: Object.entries(GRAVITY_LABELS).map(([v, l]) => ({ value: v, label: l })),
    },
    {
      key: 'capitalSins',
      dimensionKey: 'capitalSin',
      label: DIMENSION_LABELS.capitalSin,
      options: DEFAULT_CAPITAL_SINS.map(c => ({ value: c, label: c })),
    },
    {
      key: 'virtudesTeologales',
      dimensionKey: 'virtudeTeologal',
      label: DIMENSION_LABELS.virtudeTeologal,
      options: VIRTUES_TEOLOGALES.map(v => ({ value: v, label: v })),
    },
    {
      key: 'virtudesCardinales',
      dimensionKey: 'virtudeCardinal',
      label: DIMENSION_LABELS.virtudeCardinal,
      options: VIRTUES_CARDINALES.map(v => ({ value: v, label: v })),
    },
    {
      key: 'virtudesAnexas',
      dimensionKey: 'virtudeAnexa',
      label: DIMENSION_LABELS.virtudeAnexa,
      options: VIRTUDES_ANEXAS_PRINCIPALES.map(v => ({ value: v, label: v })),
    },
    {
      key: 'vows',
      dimensionKey: 'vow',
      label: DIMENSION_LABELS.vow,
      options: DEFAULT_VOWS.map(v => ({ value: v, label: v })),
    },
    {
      key: 'activityIds',
      dimensionKey: 'activity',
      label: DIMENSION_LABELS.activity,
      options: activities.map(a => ({ value: a.id, label: a.name })),
    },
    {
      key: 'attentions',
      dimensionKey: 'attention',
      label: DIMENSION_LABELS.attention,
      options: Object.entries(ATTENTION_LABELS).map(([v, l]) => ({ value: v, label: l })),
    },
    {
      key: 'motives',
      dimensionKey: 'motive',
      label: DIMENSION_LABELS.motive,
      options: Object.entries(MOTIVE_LABELS).map(([v, l]) => ({ value: v, label: l })),
    },
    {
      key: 'materiaTipos',
      dimensionKey: 'materiaTipo',
      label: DIMENSION_LABELS.materiaTipo,
      options: Object.entries(MATERIA_TIPO_LABELS).map(([v, l]) => ({ value: v, label: l })),
    },
    {
      key: 'purityOfIntentions',
      dimensionKey: 'purityOfIntention',
      label: DIMENSION_LABELS.purityOfIntention,
      options: Object.entries(PURITY_LABELS).map(([v, l]) => ({ value: v, label: l })),
    },
    {
      key: 'manifestations',
      dimensionKey: 'manifestation',
      label: DIMENSION_LABELS.manifestation,
      options: Object.entries(MANIFESTATION_LABELS).map(([v, l]) => ({ value: v, label: l })),
    },
    {
      key: 'modes',
      dimensionKey: 'mode',
      label: DIMENSION_LABELS.mode,
      options: Object.entries(MODE_LABELS).map(([v, l]) => ({ value: v, label: l })),
    },
    {
      key: 'charityLevels',
      dimensionKey: 'charityLevel',
      label: DIMENSION_LABELS.charityLevel,
      options: Object.entries(CHARITY_LABELS).map(([v, l]) => ({ value: v, label: l })),
    },
    {
      key: 'qualities',
      dimensionKey: 'quality',
      label: DIMENSION_LABELS.quality,
      options: Object.entries(QUALITY_LABELS).map(([v, l]) => ({ value: v, label: l })),
    },
    {
      key: 'circunstancias',
      dimensionKey: 'circunstancias',
      label: DIMENSION_LABELS.circunstancias,
      options: Object.entries(CIRCUNSTANCIAS_LABELS).map(([v, l]) => ({ value: v, label: l })),
    },
    {
      key: 'condicionantes',
      dimensionKey: 'condicionante',
      label: DIMENSION_LABELS.condicionante,
      options: SEED_CONDICIONANTES.map(c => ({ value: c, label: c })),
    },
    {
      key: 'spiritualMeans',
      dimensionKey: 'spiritualMean',
      label: DIMENSION_LABELS.spiritualMean,
      options: MEDIOS_ESPIRITUALES_INICIAL.map(m => ({ value: m, label: m })),
      hasVerMas: true,
    },
  ];
}

// ========== Format Percentage ==========

/**
 * Format percentage with 1 decimal place
 * Avoids -0.0% by treating values with abs < 0.05 as 0.0
 */
export function formatPercentage(value: number): string {
  if (Math.abs(value) < 0.05) {
    return '0,0%';
  }
  return value.toFixed(1).replace('.', ',') + '%';
}
