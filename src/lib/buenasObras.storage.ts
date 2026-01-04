// BuenaObra CRUD operations and storage
// Offline-first with localStorage persistence

import type { BuenaObra, BuenaObraNote } from './buenasObras.types';
import { createDefaultBuenaObra } from './buenasObras.types';
import { generateId } from './storage';

const STORAGE_KEY = 'magis_buenas_obras';

// ========== Get all buenas obras ==========

export function getBuenasObras(): BuenaObra[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.error('Error reading buenas obras:', e);
  }
  return [];
}

function saveBuenasObras(buenasObras: BuenaObra[]): void {
  try {
    const json = JSON.stringify(buenasObras);
    localStorage.setItem(STORAGE_KEY, json);
    window.dispatchEvent(new CustomEvent('buenas-obras-updated'));
  } catch (e) {
    console.error('Error saving buenas obras:', e);
  }
}

// ========== CRUD Operations ==========

export function getBuenaObra(id: string): BuenaObra | null {
  const buenasObras = getBuenasObras();
  return buenasObras.find(b => b.id === id) || null;
}

export function createBuenaObra(data: Partial<BuenaObra>): BuenaObra {
  const buenasObras = getBuenasObras();
  const id = generateId();
  const newBuenaObra: BuenaObra = {
    ...createDefaultBuenaObra(id),
    ...data,
    id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  buenasObras.push(newBuenaObra);
  saveBuenasObras(buenasObras);
  return newBuenaObra;
}

export function updateBuenaObra(id: string, updates: Partial<BuenaObra>): BuenaObra | null {
  const buenasObras = getBuenasObras();
  const index = buenasObras.findIndex(b => b.id === id);
  
  if (index === -1) return null;
  
  buenasObras[index] = {
    ...buenasObras[index],
    ...updates,
    id,
    updatedAt: Date.now(),
  };
  
  saveBuenasObras(buenasObras);
  return buenasObras[index];
}

export function deleteBuenaObra(id: string): boolean {
  const buenasObras = getBuenasObras();
  const buenaObra = buenasObras.find(b => b.id === id);
  
  if (buenaObra?.isDefault) return false;
  
  const filtered = buenasObras.filter(b => b.id !== id);
  if (filtered.length === buenasObras.length) return false;
  
  saveBuenasObras(filtered);
  return true;
}

// ========== Toggle Disabled ==========

export function toggleBuenaObraDisabled(id: string): boolean {
  const buenasObras = getBuenasObras();
  const index = buenasObras.findIndex(b => b.id === id);
  
  if (index === -1) return false;
  
  buenasObras[index].isDisabled = !buenasObras[index].isDisabled;
  buenasObras[index].updatedAt = Date.now();
  saveBuenasObras(buenasObras);
  
  return true;
}
