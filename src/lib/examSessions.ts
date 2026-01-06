// ExamSession storage and operations
// Offline-first with localStorage persistence

import type { ExamSession, SinEvent, BuenaObraEvent, FreeformSin, FreeformBuenaObra, UserState } from './types';
import { generateId } from './storage';

const STORAGE_KEYS = {
  EXAM_SESSIONS: 'magis_exam_sessions',
  USER_STATE: 'magis_user_state',
} as const;

// ========== Exam Sessions ==========

export function getExamSessions(): ExamSession[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.EXAM_SESSIONS);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error reading exam sessions:', e);
    return [];
  }
}

function saveExamSessions(sessions: ExamSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.error('Error saving exam sessions:', e);
  }
}

export function createExamSession(
  personTypes: string[],
  activities: string[],
  sinsShown: string[],
  buenasObrasShown: string[] = []
): ExamSession {
  const session: ExamSession = {
    id: generateId(),
    startedAt: Date.now(),
    endedAt: null,
    selectedPersonTypes: personTypes,
    selectedActivities: activities,
    sinsShown: [...new Set(sinsShown)], // Deduplicate
    buenasObrasShown: [...new Set(buenasObrasShown)],
    events: [],
    buenaObraEvents: [],
    freeformAddedSins: [],
    freeformAddedBuenasObras: [],
  };
  
  const sessions = getExamSessions();
  sessions.unshift(session);
  saveExamSessions(sessions);
  
  return session;
}

export function getExamSession(id: string): ExamSession | null {
  const sessions = getExamSessions();
  return sessions.find(s => s.id === id) || null;
}

export function updateExamSession(session: ExamSession): void {
  const sessions = getExamSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  
  if (index !== -1) {
    sessions[index] = session;
    saveExamSessions(sessions);
  }
}

export function completeExamSession(sessionId: string): void {
  const sessions = getExamSessions();
  const index = sessions.findIndex(s => s.id === sessionId);
  
  if (index !== -1) {
    sessions[index].endedAt = Date.now();
    saveExamSessions(sessions);
    
    // Update user state
    updateUserStateAfterExam();
  }
}

// ========== Sin Events ==========

export function addSinEvent(
  sessionId: string,
  sinId: string,
  options?: Partial<Omit<SinEvent, 'id' | 'sinId' | 'timestamp'>>
): SinEvent | null {
  const sessions = getExamSessions();
  const index = sessions.findIndex(s => s.id === sessionId);
  
  if (index === -1) return null;
  
  const event: SinEvent = {
    id: generateId(),
    sinId,
    timestamp: Date.now(),
    countIncrement: options?.countIncrement ?? 1,
    attention: options?.attention ?? 'deliberado',
    motive: options?.motive ?? 'fragilidad',
    responsibility: options?.responsibility ?? 'formal',
    optionalFlags: options?.optionalFlags,
    appliedCondicionantes: options?.appliedCondicionantes,
    condicionantesK: options?.condicionantesK,
    condicionantesFactor: options?.condicionantesFactor,
  };
  
  sessions[index].events.push(event);
  saveExamSessions(sessions);
  
  return event;
}

export function updateSinEvent(
  sessionId: string,
  eventId: string,
  updates: Partial<Omit<SinEvent, 'id' | 'sinId' | 'timestamp'>>
): SinEvent | null {
  const sessions = getExamSessions();
  const sessionIndex = sessions.findIndex(s => s.id === sessionId);
  
  if (sessionIndex === -1) return null;
  
  const eventIndex = sessions[sessionIndex].events.findIndex(e => e.id === eventId);
  if (eventIndex === -1) return null;
  
  sessions[sessionIndex].events[eventIndex] = {
    ...sessions[sessionIndex].events[eventIndex],
    ...updates,
  };
  
  saveExamSessions(sessions);
  return sessions[sessionIndex].events[eventIndex];
}

export function removeSinEvent(sessionId: string, eventId: string): boolean {
  const sessions = getExamSessions();
  const sessionIndex = sessions.findIndex(s => s.id === sessionId);
  
  if (sessionIndex === -1) return false;
  
  const originalLength = sessions[sessionIndex].events.length;
  sessions[sessionIndex].events = sessions[sessionIndex].events.filter(e => e.id !== eventId);
  
  if (sessions[sessionIndex].events.length === originalLength) return false;
  
  saveExamSessions(sessions);
  return true;
}

// ========== Freeform Sins ==========

export function addFreeformSin(
  sessionId: string,
  text: string,
  pillar: 'god' | 'neighbor' | 'self'
): FreeformSin | null {
  const sessions = getExamSessions();
  const index = sessions.findIndex(s => s.id === sessionId);
  
  if (index === -1) return null;
  
  const freeformSin: FreeformSin = {
    id: generateId(),
    text: text.trim(),
    pillar,
  };
  
  sessions[index].freeformAddedSins.push(freeformSin);
  saveExamSessions(sessions);
  
  return freeformSin;
}

// ========== User State ==========

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

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

function saveUserState(state: UserState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_STATE, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving user state:', e);
  }
}

function updateUserStateAfterExam(): void {
  const state = getUserState();
  state.lastExamination = Date.now();
  state.todayCount += 1;
  saveUserState(state);
}

// ========== Utility Functions ==========

export function getMinutesSinceLastExam(): number | null {
  const state = getUserState();
  if (!state.lastExamination) return null;
  
  const now = Date.now();
  const diff = now - state.lastExamination;
  return Math.floor(diff / 60000);
}

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

export type ExamState = 'peace' | 'attention' | 'growth';

export function getExamState(minutes: number | null): ExamState {
  if (minutes === null) return 'growth';
  if (minutes <= 60) return 'peace';
  if (minutes <= 120) return 'attention';
  return 'growth';
}

// ========== Cross-Session Operations ==========

/**
 * Remove the most recent event for a specific sin across all sessions
 * @returns true if an event was removed, false if no events found
 */
export function removeLastSinEventForSin(sinId: string): boolean {
  const sessions = getExamSessions();
  
  // Find the most recent event for this sin across COMPLETED sessions only
  let lastEventInfo: { sessionIndex: number; eventId: string; timestamp: number } | null = null;
  
  sessions.forEach((session, sessionIndex) => {
    if (!session.endedAt) return; // Only search in completed sessions
    
    for (const event of session.events) {
      if (event.sinId === sinId) {
        if (!lastEventInfo || event.timestamp > lastEventInfo.timestamp) {
          lastEventInfo = { sessionIndex, eventId: event.id, timestamp: event.timestamp };
        }
      }
    }
  });
  
  if (!lastEventInfo) return false;
  
  // Remove the event from the session
  const { sessionIndex, eventId } = lastEventInfo;
  sessions[sessionIndex].events = sessions[sessionIndex].events.filter(e => e.id !== eventId);
  saveExamSessions(sessions);
  
  // Dispatch event to notify UI components
  window.dispatchEvent(new CustomEvent('exam-sessions-updated'));
  
  return true;
}

/**
 * Count total events for a specific sin across all sessions
 */
export function getEventCountForSin(sinId: string): number {
  const sessions = getExamSessions();
  let count = 0;
  for (const session of sessions) {
    if (!session.endedAt) continue; // Only count from completed sessions
    count += session.events.filter(e => e.sinId === sinId).length;
  }
  return count;
}

// ========== Analytics ==========

export function getSessionStats(sessionId: string): {
  totalEvents: number;
  byPillar: Record<string, number>;
  byAttention: Record<string, number>;
} | null {
  const session = getExamSession(sessionId);
  if (!session) return null;
  
  const byPillar: Record<string, number> = { god: 0, neighbor: 0, self: 0 };
  const byAttention: Record<string, number> = { deliberado: 0, semideliberado: 0 };
  
  // This would need access to sin pillar data - simplified for now
  session.events.forEach(event => {
    byAttention[event.attention] = (byAttention[event.attention] || 0) + event.countIncrement;
  });
  
  return {
    totalEvents: session.events.reduce((sum, e) => sum + e.countIncrement, 0),
    byPillar,
    byAttention,
  };
}
