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

// ========== Main BuenaObra Entity ==========

export interface BuenaObra {
  id: string;
  
  // A) Identidad
  name: string;
  shortDescription: string;
  extraInfo: string;
  tags: string[];
  
  // B) Clasificación
  category: string[]; // multi, editable
  theologicalAxis: string[]; // multi, editable
  relatedVirtues: string[]; // multi, editable
  
  // C) Contexto sugerido
  involvedPersonTypes: string[]; // IDs de PersonType
  associatedActivities: string[]; // IDs de Activity
  
  // D) Condicionantes
  condicionantes: string[]; // para amplificación selectiva
  
  // E) Coste/cantidad
  sacrificioRelativo: SacrificioRelativo;
  timeEstimateMin?: number; // minutos estimados
  visibility?: string; // opcional
  
  // F) Ponderación interna (avanzado)
  baseGoodOverride?: number;
  unitPerTap: number;
  maxPerSession?: number;
  
  // G) Notas
  notes: BuenaObraNote[];
  
  // Purity of intention config
  purityOfIntention: PurityOfIntention; // valor por defecto cuando se registra
  showPurityInExam: boolean; // si mostrar selector en examen
  
  // Legacy fields (for compatibility)
  terms: BuenaObraTerm[]; // mapped from theologicalAxis
  virtues: string[]; // alias for relatedVirtues
  spiritualAspects: string[]; // deprecated, use category
  
  // Metadata
  createdAt: number;
  updatedAt: number;
  isDefault?: boolean;
  isDisabled?: boolean;
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
    category: [],
    theologicalAxis: [],
    relatedVirtues: [],
    involvedPersonTypes: [],
    associatedActivities: [],
    condicionantes: [],
    sacrificioRelativo: 'medio',
    unitPerTap: 1,
    notes: [],
    purityOfIntention: 'virtual',
    showPurityInExam: false,
    terms: [],
    virtues: [],
    spiritualAspects: [],
    createdAt: now,
    updatedAt: now,
    isDisabled: false,
  };
}
