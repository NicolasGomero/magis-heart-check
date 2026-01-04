// Sin CRUD operations and storage
// Offline-first with localStorage persistence

import type { Sin, SinNote } from './sins.types';
import { createDefaultSin } from './sins.types';
import { generateId } from './storage';

const STORAGE_KEY = 'magis_sins';

// ========== Get all sins ==========

export function getSins(): Sin[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.error('Error reading sins:', e);
  }
  return [];
}

function saveSins(sins: Sin[]): void {
  console.log('[sins.storage] saveSins called with', sins.length, 'sins');
  try {
    const json = JSON.stringify(sins);
    localStorage.setItem(STORAGE_KEY, json);
    console.log('[sins.storage] localStorage.setItem SUCCESS');
    
    // Dispatch custom event to notify listeners
    console.log('[sins.storage] Dispatching sins-updated event');
    window.dispatchEvent(new CustomEvent('sins-updated'));
    console.log('[sins.storage] Event dispatched');
  } catch (e) {
    console.error('[sins.storage] Error saving sins:', e);
  }
}

// ========== CRUD Operations ==========

export function getSin(id: string): Sin | null {
  const sins = getSins();
  const found = sins.find(s => s.id === id);
  if (!found) return null;
  
  // Merge with defaults to ensure all fields exist (handles old sins missing new fields)
  return {
    ...createDefaultSin(found.id),
    ...found,
  };
}

export function createSin(data: Partial<Sin>): Sin {
  const sins = getSins();
  const id = generateId();
  const newSin: Sin = {
    ...createDefaultSin(id),
    ...data,
    id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  sins.push(newSin);
  saveSins(sins);
  return newSin;
}

export function updateSin(id: string, updates: Partial<Sin>): Sin | null {
  const sins = getSins();
  const index = sins.findIndex(s => s.id === id);
  
  if (index === -1) return null;
  
  sins[index] = {
    ...sins[index],
    ...updates,
    id, // Preserve original ID
    updatedAt: Date.now(),
  };
  
  saveSins(sins);
  return sins[index];
}

export function deleteSin(id: string): boolean {
  const sins = getSins();
  const sin = sins.find(s => s.id === id);
  
  // Cannot delete default sins
  if (sin?.isDefault) return false;
  
  const filtered = sins.filter(s => s.id !== id);
  if (filtered.length === sins.length) return false;
  
  saveSins(filtered);
  return true;
}

// ========== Notes Operations ==========

export function addSinNote(sinId: string, text: string): SinNote | null {
  const sins = getSins();
  const index = sins.findIndex(s => s.id === sinId);
  
  if (index === -1) return null;
  
  const note: SinNote = {
    noteId: generateId(),
    text: text.trim(),
    createdAt: Date.now(),
  };
  
  sins[index].notes.push(note);
  sins[index].updatedAt = Date.now();
  saveSins(sins);
  
  return note;
}

export function updateSinNote(sinId: string, noteId: string, text: string): boolean {
  const sins = getSins();
  const sinIndex = sins.findIndex(s => s.id === sinId);
  
  if (sinIndex === -1) return false;
  
  const noteIndex = sins[sinIndex].notes.findIndex(n => n.noteId === noteId);
  if (noteIndex === -1) return false;
  
  sins[sinIndex].notes[noteIndex].text = text.trim();
  sins[sinIndex].updatedAt = Date.now();
  saveSins(sins);
  
  return true;
}

export function hideSinNote(sinId: string, noteId: string): boolean {
  const sins = getSins();
  const sinIndex = sins.findIndex(s => s.id === sinId);
  
  if (sinIndex === -1) return false;
  
  const noteIndex = sins[sinIndex].notes.findIndex(n => n.noteId === noteId);
  if (noteIndex === -1) return false;
  
  sins[sinIndex].notes[noteIndex].cycleHidden = true;
  sins[sinIndex].updatedAt = Date.now();
  saveSins(sins);
  
  return true;
}

// ========== Toggle Disabled ==========

export function toggleSinDisabled(id: string): boolean {
  const sins = getSins();
  const index = sins.findIndex(s => s.id === id);
  
  if (index === -1) return false;
  
  sins[index].isDisabled = !sins[index].isDisabled;
  sins[index].updatedAt = Date.now();
  saveSins(sins);
  
  return true;
}

// ========== Filtering ==========

export function getSinsByTerm(term: string): Sin[] {
  return getSins().filter(s => s.terms.includes(term as any));
}

export function getSinsByGravity(gravity: string): Sin[] {
  return getSins().filter(s => s.gravities.includes(gravity as any));
}

export function getSinsByTag(tag: string): Sin[] {
  return getSins().filter(s => s.tags.includes(tag));
}

export function getSinsByPersonType(personTypeId: string): Sin[] {
  return getSins().filter(s => s.involvedPersonTypes.includes(personTypeId));
}

export function getSinsByActivity(activityId: string): Sin[] {
  return getSins().filter(s => s.associatedActivities.includes(activityId));
}

// ========== Tags Management ==========

export function getAllTags(): string[] {
  const sins = getSins();
  const tagsSet = new Set<string>();
  
  sins.forEach(sin => {
    sin.tags.forEach(tag => tagsSet.add(tag));
  });
  
  return Array.from(tagsSet).sort();
}

// ========== Custom Values Management ==========

export function getAllOppositeVirtues(): string[] {
  const sins = getSins();
  const virtuesSet = new Set<string>();
  
  sins.forEach(sin => {
    sin.oppositeVirtues.forEach(v => virtuesSet.add(v));
  });
  
  return Array.from(virtuesSet).sort();
}

export function getAllSpiritualAspects(): string[] {
  const sins = getSins();
  const aspectsSet = new Set<string>();
  
  sins.forEach(sin => {
    sin.spiritualAspects.forEach(a => aspectsSet.add(a));
  });
  
  return Array.from(aspectsSet).sort();
}

// ========== Batch Operations ==========

export function importSins(newSins: Partial<Sin>[]): number {
  const existingSins = getSins();
  let imported = 0;
  
  newSins.forEach(sinData => {
    if (!sinData.name) return;
    
    const id = generateId();
    const newSin: Sin = {
      ...createDefaultSin(id),
      ...sinData,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefault: false,
    };
    
    existingSins.push(newSin);
    imported++;
  });
  
  saveSins(existingSins);
  return imported;
}

export function exportSins(): Sin[] {
  return getSins();
}

// ========== Reset Cycle Helpers ==========

export function hideNotesForCycleReset(sinId: string): void {
  const sins = getSins();
  const index = sins.findIndex(s => s.id === sinId);
  
  if (index === -1) return;
  
  sins[index].notes = sins[index].notes.map(note => ({
    ...note,
    cycleHidden: true,
  }));
  sins[index].updatedAt = Date.now();
  
  saveSins(sins);
}

export function getVisibleNotes(sin: Sin): SinNote[] {
  return sin.notes.filter(n => !n.cycleHidden);
}

export function getAllNotes(sin: Sin): SinNote[] {
  return sin.notes;
}

export function getNotesByDateRange(sin: Sin, startDate: number, endDate: number): SinNote[] {
  return sin.notes.filter(n => n.createdAt >= startDate && n.createdAt <= endDate);
}
