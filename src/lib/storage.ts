// Offline-first local storage utilities for MAGIS

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

export interface UserState {
  lastExamination: number | null;
  todayCount: number;
  lastResetDate: string;
}

const STORAGE_KEYS = {
  EXAMINATIONS: 'magis_examinations',
  USER_STATE: 'magis_user_state',
} as const;

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get today's date string
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

// Get user state with auto-reset for new day
export function getUserState(): UserState {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_STATE);
    if (stored) {
      const state: UserState = JSON.parse(stored);
      const today = getTodayString();
      
      // Reset count if it's a new day
      if (state.lastResetDate !== today) {
        state.todayCount = 0;
        state.lastResetDate = today;
        saveUserState(state);
      }
      
      return state;
    }
  } catch (e) {
    console.error('Error reading user state:', e);
  }
  
  return {
    lastExamination: null,
    todayCount: 0,
    lastResetDate: getTodayString(),
  };
}

export function saveUserState(state: UserState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_STATE, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving user state:', e);
  }
}

// Get all examinations
export function getExaminations(): ExaminationEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.EXAMINATIONS);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error reading examinations:', e);
    return [];
  }
}

// Save a new examination
export function saveExamination(entry: ExaminationEntry): void {
  try {
    const examinations = getExaminations();
    examinations.unshift(entry); // Add to beginning
    
    // Keep only last 100 entries to prevent storage bloat
    const trimmed = examinations.slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.EXAMINATIONS, JSON.stringify(trimmed));
    
    // Update user state
    const state = getUserState();
    state.lastExamination = entry.timestamp;
    state.todayCount += 1;
    saveUserState(state);
  } catch (e) {
    console.error('Error saving examination:', e);
  }
}

// Get time since last examination in minutes
export function getMinutesSinceLastExam(): number | null {
  const state = getUserState();
  if (!state.lastExamination) return null;
  
  const now = Date.now();
  const diff = now - state.lastExamination;
  return Math.floor(diff / 60000);
}

// Format time ago for display
export function formatTimeAgo(minutes: number | null): string {
  if (minutes === null) return 'Primera vez';
  if (minutes < 1) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} min`;
  
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return 'Hace 1 hora';
  if (hours < 24) return `Hace ${hours} horas`;
  
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  return `Hace ${days} días`;
}

// Get visual state based on time since last exam
export type ExamState = 'peace' | 'attention' | 'growth';

export function getExamState(minutes: number | null): ExamState {
  if (minutes === null) return 'growth'; // First time
  if (minutes <= 60) return 'peace'; // Within recommended interval
  if (minutes <= 120) return 'attention'; // Getting close
  return 'growth'; // Time to examine
}
