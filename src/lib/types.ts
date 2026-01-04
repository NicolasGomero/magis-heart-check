// Core data model types for MAGIS

// ========== Support Entities ==========

export interface PersonType {
  id: string;
  name: string;
  isDefault?: boolean; // Built-in types that can be hidden but not deleted
}

export interface Activity {
  id: string;
  name: string;
  isDefault?: boolean;
}

// ========== Sin Event (marking) ==========

export type AttentionLevel = 'deliberado' | 'semideliberado';
export type MotiveType = 'fragilidad' | 'malicia' | 'ignorancia';
export type ResponsibilityType = 'formal' | 'material';

export interface OptionalFlags {
  escandaloGrave?: boolean;
  finGravementeMalo?: boolean;
  desprecioFormalLey?: boolean;
  peligroProximo?: boolean;
}

export interface SinEvent {
  id: string;
  sinId: string;
  timestamp: number;
  countIncrement: number; // +1 normally
  attention: AttentionLevel;
  motive: MotiveType;
  responsibility: ResponsibilityType;
  optionalFlags?: OptionalFlags;
  // Condicionantes applied at the time of event
  appliedCondicionantes?: string[];
  condicionantesK?: number; // Number of condicionantes applied
  condicionantesFactor?: number; // 0.80^k factor applied
}

// ========== BuenaObra Event ==========

export interface BuenaObraEvent {
  id: string;
  buenaObraId: string;
  timestamp: number;
  countIncrement: number;
  purityOfIntention?: 'actual' | 'virtual' | 'habitual';
  // Condicionantes applied at the time of event
  appliedCondicionantes?: string[];
  condicionantesK?: number; // Number of condicionantes applied
  condicionantesFactor?: number; // 1.20^k factor applied
}

// ========== Exam Session ==========

export interface FreeformSin {
  id: string;
  text: string;
  pillar: 'god' | 'neighbor' | 'self';
}

export interface FreeformBuenaObra {
  id: string;
  text: string;
  pillar: 'god' | 'neighbor' | 'self';
}

export interface ExamSession {
  id: string;
  startedAt: number;
  endedAt: number | null;
  selectedPersonTypes: string[]; // IDs, can be empty, 1, or many
  selectedActivities: string[]; // IDs, can be empty, 1, or many
  sinsShown: string[]; // Deduplicated list of sinIds shown
  buenasObrasShown: string[]; // Deduplicated list of buenaObraIds shown
  events: SinEvent[];
  buenaObraEvents: BuenaObraEvent[];
  freeformAddedSins: FreeformSin[]; // Sins added ad-hoc for this session
  freeformAddedBuenasObras: FreeformBuenaObra[]; // Buenas obras added ad-hoc
}

// ========== User State ==========

export interface UserState {
  lastExamination: number | null;
  todayCount: number;
  lastResetDate: string;
}
