// Base storage utilities for MAGIS
// Re-exports from specialized modules for backward compatibility

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Re-export everything from examSessions for backward compatibility
export {
  getExamSessions as getExaminations,
  getUserState,
  getMinutesSinceLastExam,
  formatTimeAgo,
  getExamState,
  type ExamState,
} from './examSessions';

// Legacy types for backward compatibility
export interface ExaminationEntry {
  id: string;
  timestamp: number;
  context: string;
  responses: ExaminationResponse[];
}

export interface ExaminationResponse {
  questionId: string;
  pillar: 'god' | 'neighbor' | 'self';
  marked: boolean;
}

// Legacy save function - converts to new format
export function saveExamination(entry: ExaminationEntry): void {
  // This is kept for backward compatibility
  // New code should use examSessions.createExamSession
  console.warn('saveExamination is deprecated, use createExamSession instead');
}
