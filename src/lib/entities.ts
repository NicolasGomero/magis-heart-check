// CRUD operations for support entities (PersonType, Activity)
// Offline-first with localStorage persistence

import type { PersonType, Activity } from './types';
export type { PersonType, Activity };
import { generateId } from './storage';

// ========== Storage Keys ==========

const STORAGE_KEYS = {
  PERSON_TYPES: 'magis_person_types',
  ACTIVITIES: 'magis_activities',
} as const;

// ========== Default Data ==========

const DEFAULT_PERSON_TYPES: PersonType[] = [
  { id: 'pt-1', name: '👔 Superiores', isDefault: true },
  { id: 'pt-2', name: '🙏 Hermanos de religión', isDefault: true },
  { id: 'pt-3', name: '👨‍👩‍👧‍👦 Familiares', isDefault: true },
  { id: 'pt-4', name: '⛪ Laicos de la pastoral', isDefault: true },
  { id: 'pt-5', name: '🤲 Necesitados', isDefault: true },
  { id: 'pt-6', name: '🤝 Amigos', isDefault: true },
  { id: 'pt-7', name: '👋 Conocidos', isDefault: true },
  { id: 'pt-8', name: '👤 Desconocidos', isDefault: true },
  { id: 'pt-9', name: '💼 Compañeros de trabajo', isDefault: true },
];

const DEFAULT_ACTIVITIES: Activity[] = [
  { id: 'act-1', name: '📚 Estudio', isDefault: true },
  { id: 'act-2', name: '💻 Trabajo individual', isDefault: true },
  { id: 'act-3', name: '👥 Trabajo con equipo', isDefault: true },
  { id: 'act-4', name: '🎓 Clase', isDefault: true },
  { id: 'act-5', name: '🕊️ Pastoral', isDefault: true },
  { id: 'act-6', name: '⛪ Misa', isDefault: true },
  { id: 'act-7', name: '📿 Rosario', isDefault: true },
  { id: 'act-8', name: '🙏 Oración', isDefault: true },
  { id: 'act-9', name: '🏃 Deporte', isDefault: true },
  { id: 'act-10', name: '🚗 Traslados', isDefault: true },
  { id: 'act-11', name: '🍽️ Comidas', isDefault: true },
  { id: 'act-12', name: '📋 Planificación', isDefault: true },
  { id: 'act-13', name: '🧴 Cuidado personal', isDefault: true },
  { id: 'act-14', name: '🏠 Cargos de casa', isDefault: true },
  { id: 'act-15', name: '📝 Gestiones extraordinarias', isDefault: true },
];

// ========== PersonType CRUD ==========

export function getPersonTypes(): PersonType[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PERSON_TYPES);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading person types:', e);
  }
  
  // Initialize with defaults
  savePersonTypes(DEFAULT_PERSON_TYPES);
  return DEFAULT_PERSON_TYPES;
}

export function savePersonTypes(types: PersonType[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PERSON_TYPES, JSON.stringify(types));
  } catch (e) {
    console.error('Error saving person types:', e);
  }
}

export function createPersonType(name: string): PersonType {
  const types = getPersonTypes();
  const newType: PersonType = {
    id: generateId(),
    name: name.trim(),
    isDefault: false,
  };
  types.push(newType);
  savePersonTypes(types);
  return newType;
}

export function updatePersonType(id: string, name: string): PersonType | null {
  const types = getPersonTypes();
  const index = types.findIndex(t => t.id === id);
  if (index === -1) return null;
  
  types[index] = { ...types[index], name: name.trim() };
  savePersonTypes(types);
  return types[index];
}

export function deletePersonType(id: string): boolean {
  const types = getPersonTypes();
  const type = types.find(t => t.id === id);
  
  // Cannot delete default types
  if (type?.isDefault) return false;
  
  const filtered = types.filter(t => t.id !== id);
  if (filtered.length === types.length) return false;
  
  savePersonTypes(filtered);
  return true;
}

// ========== Activity CRUD ==========

export function getActivities(): Activity[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading activities:', e);
  }
  
  // Initialize with defaults
  saveActivities(DEFAULT_ACTIVITIES);
  return DEFAULT_ACTIVITIES;
}

export function saveActivities(activities: Activity[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  } catch (e) {
    console.error('Error saving activities:', e);
  }
}

export function createActivity(name: string): Activity {
  const activities = getActivities();
  const newActivity: Activity = {
    id: generateId(),
    name: name.trim(),
    isDefault: false,
  };
  activities.push(newActivity);
  saveActivities(activities);
  return newActivity;
}

export function updateActivity(id: string, name: string): Activity | null {
  const activities = getActivities();
  const index = activities.findIndex(a => a.id === id);
  if (index === -1) return null;
  
  activities[index] = { ...activities[index], name: name.trim() };
  saveActivities(activities);
  return activities[index];
}

export function deleteActivity(id: string): boolean {
  const activities = getActivities();
  const activity = activities.find(a => a.id === id);
  
  // Cannot delete default activities
  if (activity?.isDefault) return false;
  
  const filtered = activities.filter(a => a.id !== id);
  if (filtered.length === activities.length) return false;
  
  saveActivities(filtered);
  return true;
}

// ========== Reset to defaults ==========

export function resetPersonTypesToDefaults(): void {
  savePersonTypes(DEFAULT_PERSON_TYPES);
}

export function resetActivitiesToDefaults(): void {
  saveActivities(DEFAULT_ACTIVITIES);
}
