// Sin (Pecado) entity - complete data model

// ========== Enums and Types ==========

export type Term = 'contra_dios' | 'contra_projimo' | 'contra_si_mismo';
export type Gravity = 'mortal' | 'venial';
export type MateriaTipo = 'ex_toto' | 'ex_genere' | 'venial_propio_genero';
export type Manifestation = 'externo' | 'interno';
export type ObjectType = 'carnal' | 'espiritual';
export type Mode = 'comision' | 'omision';
export type ResetCycle = 'no' | 'diario' | 'semanal' | 'mensual' | 'anual' | 'personalizado';

// ========== Labels for UI ==========

export const TERM_LABELS: Record<Term, string> = {
  contra_dios: 'Contra Dios',
  contra_projimo: 'Contra el Prójimo',
  contra_si_mismo: 'Contra uno mismo',
};

export const GRAVITY_LABELS: Record<Gravity, string> = {
  mortal: 'Mortal',
  venial: 'Venial',
};

export const MATERIA_TIPO_LABELS: Record<MateriaTipo, string> = {
  ex_toto: 'Grave ex toto',
  ex_genere: 'Grave ex genere',
  venial_propio_genero: 'Venial de propio género',
};

export const MANIFESTATION_LABELS: Record<Manifestation, string> = {
  externo: 'Externo',
  interno: 'Interno',
};

export const OBJECT_TYPE_LABELS: Record<ObjectType, string> = {
  carnal: 'Carnal',
  espiritual: 'Espiritual',
};

export const MODE_LABELS: Record<Mode, string> = {
  comision: 'Comisión',
  omision: 'Omisión',
};

export const RESET_CYCLE_LABELS: Record<ResetCycle, string> = {
  no: 'No',
  diario: 'Diario',
  semanal: 'Semanal',
  mensual: 'Mensual',
  anual: 'Anual',
  personalizado: 'Personalizado',
};

// ========== Default Values for Multi-select ==========

// Virtudes divididas por categorías
export const VIRTUES_TEOLOGALES = ['Fe', 'Esperanza', 'Caridad'];

export const VIRTUES_CARDINALES = ['Prudencia', 'Justicia', 'Fortaleza', 'Templanza'];

export const VIRTUES_ANEXAS_INICIAL = [
  'Religión',
  'Magnanimidad',
  'Paciencia',
  'Humildad',
  'Honestidad',
];

export const VIRTUES_ANEXAS_COMPLETA = [
  'Religión',
  'Magnanimidad',
  'Paciencia',
  'Humildad',
  'Honestidad',
  'Piedad',
  'Mansedumbre',
  'Castidad',
  'Pobreza',
  'Obediencia',
  'Estudiosidad',
  'Modestia',
  'Abstinencia',
  'Sobriedad',
  'Liberalidad',
  'Afabilidad',
  'Veracidad',
  'Eutrapelia',
  'Perseverancia',
  'Continencia',
];

// Legacy - para compatibilidad
export const DEFAULT_OPPOSITE_VIRTUES = [
  ...VIRTUES_TEOLOGALES,
  ...VIRTUES_CARDINALES,
  ...VIRTUES_ANEXAS_COMPLETA,
];

// Pecados capitales en orden correcto
export const DEFAULT_CAPITAL_SINS = [
  'Vanagloria',
  'Avaricia',
  'Lujuria',
  'Ira',
  'Gula',
  'Envidia',
  'Acidia',
];

// Votos (sin "Ninguno")
export const DEFAULT_VOWS = [
  'Pobreza',
  'Castidad',
  'Obediencia',
];

// Medios espirituales (renombrado desde aspectos espirituales)
export const DEFAULT_SPIRITUAL_MEANS = [
  'Abnegación',
  'María',
  'Liturgia',
  'Oración',
  'Espíritu de Vigilancia',
  'Amigo del Saber',
  'Caridad fraterna',
  'Espíritu de Servicio',
  'Mortificación',
  'Silencio',
];

// Legacy alias
export const DEFAULT_SPIRITUAL_ASPECTS = DEFAULT_SPIRITUAL_MEANS;

// Condicionantes del sujeto
export const DEFAULT_CONDICIONANTES = [
  'Fatiga',
  'Enfermedad',
  'Estrés',
  'Falta de sueño',
  'Hambre',
  'Prisa',
  'Miedo',
  'Ira previa',
  'Tristeza',
  'Soledad',
  'Tentación fuerte',
  'Costumbre arraigada',
];

// ========== Note Interface ==========

export interface SinNote {
  noteId: string;
  text: string;
  createdAt: number;
  cycleHidden?: boolean; // Hidden in UI when cycle resets, but never deleted
}

// ========== Custom Reset Rule ==========

export interface CustomResetRule {
  type: 'days' | 'weeks' | 'months';
  value: number;
  startDate?: number; // Optional start date for the cycle
}

// ========== Main Sin Entity ==========

export interface Sin {
  id: string;
  
  // Basic info
  name: string;
  shortDescription: string;
  extraInfo: string;
  notes: SinNote[];
  
  // Moral classification (all multi-select)
  terms: Term[];
  gravities: Gravity[];
  materiaTipo: MateriaTipo[];
  admiteParvedad: boolean;
  
  // Other characteristics
  oppositeVirtues: string[]; // Allows custom values
  capitalSins: string[]; // From default list
  vows: string[]; // Multi-select
  spiritualAspects: string[]; // Medios espirituales - allows custom values
  manifestations: Manifestation[];
  objectTypes: ObjectType[];
  modes: Mode[];
  condicionantes: string[]; // Condicionantes del sujeto
  
  // Relations (multi-select, stores IDs)
  involvedPersonTypes: string[];
  associatedActivities: string[];
  
  // Reset and display
  resetCycle: ResetCycle;
  customResetRule?: CustomResetRule; // Only when resetCycle === 'personalizado'
  colorPaletteKey: string; // Key for level color progression
  tags: string[];
  
  // Aggregation and control
  canAggregateToMortal: boolean;
  mortalThresholdUnits: number;
  unitPerTap: number;
  manualWeightOverride?: number;
  
  // Metadata
  createdAt: number;
  updatedAt: number;
  isDefault?: boolean; // Built-in sins
  isDisabled?: boolean; // If true, won't appear in exams
}

// ========== Color Palettes ==========

export const COLOR_PALETTES: Record<string, { name: string; colors: string[] }> = {
  standard: {
    name: 'Estándar',
    colors: ['#3B82F6', '#22C55E', '#EAB308', '#F97316', '#EF4444'], // blue -> green -> yellow -> orange -> red
  },
  cool: {
    name: 'Frío',
    colors: ['#06B6D4', '#10B981', '#84CC16', '#FBBF24', '#F87171'],
  },
  warm: {
    name: 'Cálido',
    colors: ['#8B5CF6', '#EC4899', '#F43F5E', '#FB923C', '#DC2626'],
  },
  muted: {
    name: 'Suave',
    colors: ['#94A3B8', '#6EE7B7', '#FDE047', '#FDBA74', '#FCA5A5'],
  },
};

// ========== Helper Functions ==========

// Deduce admiteParvedad from materiaTipo
export function deduceAdmiteParvedad(materiaTipo: MateriaTipo[]): boolean {
  // ex_genere admits parvedad, others don't
  if (materiaTipo.includes('ex_genere')) return true;
  if (materiaTipo.includes('ex_toto')) return false;
  if (materiaTipo.includes('venial_propio_genero')) return false;
  return false;
}

// Get color for a specific level based on palette
export function getLevelColor(
  paletteKey: string, 
  level: number, 
  maxLevel: number = 10
): string {
  const palette = COLOR_PALETTES[paletteKey] || COLOR_PALETTES.standard;
  const index = Math.min(
    Math.floor((level / maxLevel) * (palette.colors.length - 1)),
    palette.colors.length - 1
  );
  return palette.colors[Math.max(0, index)];
}

// Create default/empty Sin
export function createDefaultSin(id: string): Sin {
  const now = Date.now();
  return {
    id,
    name: '',
    shortDescription: '',
    extraInfo: '',
    notes: [],
    terms: [],
    gravities: [],
    materiaTipo: [],
    admiteParvedad: false,
    oppositeVirtues: [],
    capitalSins: [],
    vows: [],
    spiritualAspects: [],
    manifestations: [],
    objectTypes: [],
    modes: [],
    condicionantes: [],
    involvedPersonTypes: [],
    associatedActivities: [],
    resetCycle: 'no',
    colorPaletteKey: 'standard',
    tags: [],
    canAggregateToMortal: false,
    mortalThresholdUnits: 10,
    unitPerTap: 1,
    createdAt: now,
    updatedAt: now,
    isDisabled: false,
  };
}
