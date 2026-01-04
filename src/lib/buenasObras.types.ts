// BuenaObra (Good Deed) entity - data model

// ========== Enums and Types ==========

export type BuenaObraTerm = 'hacia_dios' | 'hacia_projimo' | 'hacia_si_mismo';

// ========== Labels for UI ==========

export const BUENA_OBRA_TERM_LABELS: Record<BuenaObraTerm, string> = {
  hacia_dios: 'Hacia Dios',
  hacia_projimo: 'Hacia el Prójimo',
  hacia_si_mismo: 'Hacia uno mismo',
};

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
  
  // Basic info
  name: string;
  shortDescription: string;
  extraInfo: string;
  notes: BuenaObraNote[];
  
  // Classification
  terms: BuenaObraTerm[];
  
  // Relations (multi-select, stores IDs)
  involvedPersonTypes: string[];
  associatedActivities: string[];
  
  // Associated virtues
  virtues: string[];
  spiritualAspects: string[];
  
  // Tags
  tags: string[];
  
  // Metadata
  createdAt: number;
  updatedAt: number;
  isDefault?: boolean;
  isDisabled?: boolean; // If true, won't appear in exams
}

// ========== Helper Functions ==========

export function createDefaultBuenaObra(id: string): BuenaObra {
  const now = Date.now();
  return {
    id,
    name: '',
    shortDescription: '',
    extraInfo: '',
    notes: [],
    terms: [],
    involvedPersonTypes: [],
    associatedActivities: [],
    virtues: [],
    spiritualAspects: [],
    tags: [],
    createdAt: now,
    updatedAt: now,
    isDisabled: false,
  };
}
