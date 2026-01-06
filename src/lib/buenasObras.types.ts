// BuenaObra (Good Deed) entity - data model

// ========== Enums and Types ==========

export type BuenaObraTerm = 'hacia_dios' | 'hacia_projimo' | 'hacia_si_mismo';
export type SacrificioRelativo = 'bajo' | 'medio' | 'alto';
export type PurityOfIntention = 'actual' | 'virtual' | 'habitual';
export type CharityLevel = 'amor_explicito' | 'sin_amor_explicito';
export type Quality = 'correcta' | 'defectuosa';
export type Circunstancias = 'favorables' | 'desfavorables';

// ========== Labels for UI ==========

export const BUENA_OBRA_TERM_LABELS: Record<BuenaObraTerm, string> = {
  hacia_dios: 'Hacia Dios',
  hacia_projimo: 'Hacia el Prójimo',
  hacia_si_mismo: 'Hacia uno mismo',
};

export const SACRIFICIO_LABELS: Record<SacrificioRelativo, string> = {
  bajo: 'Bajo',
  medio: 'Medio',
  alto: 'Alto',
};

export const PURITY_LABELS: Record<PurityOfIntention, string> = {
  actual: 'Actual',
  virtual: 'Virtual',
  habitual: 'Habitual',
};

export const CHARITY_LABELS: Record<CharityLevel, string> = {
  amor_explicito: 'Con amor explícito',
  sin_amor_explicito: 'Sin amor explícito',
};

export const QUALITY_LABELS: Record<Quality, string> = {
  correcta: 'Correcta',
  defectuosa: 'Defectuosa',
};

export const CIRCUNSTANCIAS_LABELS: Record<Circunstancias, string> = {
  favorables: 'Favorables',
  desfavorables: 'Desfavorables',
};

// ========== Default Values ==========

export const DEFAULT_CATEGORIES = [
  'Oración',
  'Caridad corporal',
  'Caridad espiritual',
  'Mortificación',
  'Apostolado',
  'Formación',
  'Servicio',
  'Liturgia',
];

export const DEFAULT_THEOLOGICAL_AXES = [
  'Fe',
  'Esperanza',
  'Caridad',
  'Religión',
  'Piedad',
];

export const DEFAULT_BUENA_OBRA_VIRTUES = [
  'Prudencia',
  'Justicia',
  'Fortaleza',
  'Templanza',
  'Humildad',
  'Paciencia',
  'Mansedumbre',
  'Castidad',
  'Obediencia',
  'Pobreza',
];

// Condicionantes - NOW IMPORTED FROM UNIFIED MODULE
// Re-export for backwards compatibility
export { SEED_CONDICIONANTES as DEFAULT_BUENA_OBRA_CONDICIONANTES } from './condicionantes';

// ========== Note Interface ==========

export interface BuenaObraNote {
  noteId: string;
  text: string;
  createdAt: number;
  cycleHidden?: boolean;
}

// ========== Manifestation for BuenaObra ==========

export type BuenaObraManifestacion = 'externa' | 'interna';

export const MANIFESTACION_LABELS: Record<BuenaObraManifestacion, string> = {
  externa: 'Externa',
  interna: 'Interna',
};

// Reset cycle (same as Sin)
export type ResetCycle = 'no' | 'diario' | 'semanal' | 'mensual' | 'anual' | 'personalizado';

export const RESET_CYCLE_LABELS: Record<ResetCycle, string> = {
  no: 'No',
  diario: 'Diario',
  semanal: 'Semanal',
  mensual: 'Mensual',
  anual: 'Anual',
  personalizado: 'Personalizado',
};

// Color palettes
export const COLOR_PALETTES = [
  'blue',
  'green', 
  'purple',
  'orange',
  'pink',
  'teal',
] as const;

export type ColorPalette = typeof COLOR_PALETTES[number];

// ========== Main BuenaObra Entity ==========

export interface BuenaObra {
  id: string;
  
  // A) Identidad
  name: string;
  shortDescription: string;
  extraInfo: string;
  tags: string[];
  
  // B) Clasificación - ahora separada por tipo de virtud
  terms: BuenaObraTerm[];
  virtudesTeologales: string[];
  virtudesCardinales: string[];
  virtudesAnexas: string[];
  vows: string[];
  capitalSins: string[];
  mediosEspirituales: string[];
  manifestaciones: BuenaObraManifestacion[];
  
  // C) Contexto sugerido
  involvedPersonTypes: string[]; // IDs de PersonType
  associatedActivities: string[]; // IDs de Activity
  
  // D) Condicionantes
  condicionantes: string[]; // para amplificación selectiva
  
  // E) Configuración de examen
  purityOfIntention: PurityOfIntention; // valor por defecto cuando se registra
  showPurityInExam: boolean; // si mostrar selector en examen
  unitPerTap: number;
  resetCycle: ResetCycle;
  colorPalette: ColorPalette;
  isDisabled: boolean;
  
  // G) Notas
  notes: BuenaObraNote[];
  
  // Legacy fields (for compatibility)
  category: string[];
  theologicalAxis: string[];
  relatedVirtues: string[];
  virtues: string[];
  spiritualAspects: string[];
  sacrificioRelativo: SacrificioRelativo;
  timeEstimateMin?: number;
  visibility?: string;
  baseGoodOverride?: number;
  maxPerSession?: number;
  
  // Metadata
  createdAt: number;
  updatedAt: number;
  isDefault?: boolean;
}

// ========== Defaults aplicados en examen (no configurables en pantalla) ==========
// Estos se aplican automáticamente al registrar si el usuario no cambia nada:
// - intentionDefault: 'virtual'
// - charityLevelDefault: 'sin_amor_explicito'
// - quality: 'correcta'
// - circunstancias: 'favorables'

export const EXAM_DEFAULTS = {
  intention: 'virtual' as PurityOfIntention,
  charityLevel: 'sin_amor_explicito' as CharityLevel,
  quality: 'correcta' as Quality,
  circunstancias: 'favorables' as Circunstancias,
};

// ========== Helper Functions ==========

export function createDefaultBuenaObra(id: string): BuenaObra {
  const now = Date.now();
  return {
    id,
    name: '',
    shortDescription: '',
    extraInfo: '',
    tags: [],
    terms: [],
    virtudesTeologales: [],
    virtudesCardinales: [],
    virtudesAnexas: [],
    vows: [],
    capitalSins: [],
    mediosEspirituales: [],
    manifestaciones: [],
    involvedPersonTypes: [],
    associatedActivities: [],
    condicionantes: [],
    purityOfIntention: 'virtual',
    showPurityInExam: false,
    unitPerTap: 1,
    resetCycle: 'no',
    colorPalette: 'blue',
    isDisabled: false,
    notes: [],
    // Legacy fields
    category: [],
    theologicalAxis: [],
    relatedVirtues: [],
    virtues: [],
    spiritualAspects: [],
    sacrificioRelativo: 'medio',
    createdAt: now,
    updatedAt: now,
  };
}
