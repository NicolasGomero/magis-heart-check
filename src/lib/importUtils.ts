// CSV/XLSX import utilities for sins

import { Sin, Term, Gravity, MateriaTipo, Manifestation, ObjectType, Mode, ResetCycle } from './sins.types';
import { createSin, updateSin, getSins } from './sins.storage';
import { DuplicateStrategy } from './preferences';
import { generateId } from './storage';

export interface ImportColumnMapping {
  name: string;
  shortDescription?: string;
  extraInfo?: string;
  terms?: string;
  gravities?: string;
  materiaTipo?: string;
  admiteParvedad?: string;
  oppositeVirtues?: string;
  capitalSins?: string;
  vows?: string;
  spiritualAspects?: string;
  manifestations?: string;
  objectTypes?: string;
  modes?: string;
  involvedPersonTypes?: string;
  associatedActivities?: string;
  resetCycle?: string;
  colorPaletteKey?: string;
  tags?: string;
  canAggregateToMortal?: string;
  mortalThresholdUnits?: string;
  unitPerTap?: string;
  manualWeightOverride?: string;
}

export interface ParsedRow {
  rowNumber: number;
  data: Record<string, string>;
  errors: string[];
  warnings: string[];
}

export interface ImportPreview {
  headers: string[];
  rows: ParsedRow[];
  totalRows: number;
  validRows: number;
  errorRows: number;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  updated: number;
  merged: number;
  errors: { row: number; message: string }[];
}

// Parse CSV content
export function parseCSV(content: string): ImportPreview {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  
  if (lines.length === 0) {
    return { headers: [], rows: [], totalRows: 0, validRows: 0, errorRows: 0 };
  }
  
  // Detect delimiter (comma or semicolon)
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';
  
  // Parse headers
  const headers = parseCSVLine(lines[0], delimiter);
  
  // Parse rows
  const rows: ParsedRow[] = [];
  let validRows = 0;
  let errorRows = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter);
    const data: Record<string, string> = {};
    const errors: string[] = [];
    const warnings: string[] = [];
    
    headers.forEach((header, idx) => {
      data[header] = values[idx] || '';
    });
    
    // Validate required fields
    if (!data[headers[0]] || data[headers[0]].trim() === '') {
      errors.push('Falta el campo nombre');
      errorRows++;
    } else {
      validRows++;
    }
    
    rows.push({
      rowNumber: i + 1,
      data,
      errors,
      warnings,
    });
  }
  
  return {
    headers,
    rows,
    totalRows: rows.length,
    validRows,
    errorRows,
  };
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Parse multi-value fields (separated by ;)
function parseMultiValue(value: string): string[] {
  if (!value) return [];
  return value.split(';').map(v => v.trim()).filter(Boolean);
}

// Parse boolean field
function parseBoolean(value: string): boolean {
  if (!value) return false;
  const lower = value.toLowerCase().trim();
  return ['true', 'si', 'sí', '1', 'yes', 'verdadero'].includes(lower);
}

// Parse number field
function parseNumber(value: string, defaultValue: number): number {
  if (!value) return defaultValue;
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
}

// Validate term value
function validateTerm(value: string): Term | null {
  const termMap: Record<string, Term> = {
    'contra_dios': 'contra_dios',
    'contra dios': 'contra_dios',
    'dios': 'contra_dios',
    'contra_projimo': 'contra_projimo',
    'contra projimo': 'contra_projimo',
    'contra el prójimo': 'contra_projimo',
    'projimo': 'contra_projimo',
    'prójimo': 'contra_projimo',
    'contra_si_mismo': 'contra_si_mismo',
    'contra si mismo': 'contra_si_mismo',
    'contra uno mismo': 'contra_si_mismo',
    'si mismo': 'contra_si_mismo',
  };
  return termMap[value.toLowerCase().trim()] || null;
}

// Validate gravity value
function validateGravity(value: string): Gravity | null {
  const gravityMap: Record<string, Gravity> = {
    'mortal': 'mortal',
    'venial': 'venial',
  };
  return gravityMap[value.toLowerCase().trim()] || null;
}

// Validate materiaTipo value
function validateMateriaTipo(value: string): MateriaTipo | null {
  const materiaMap: Record<string, MateriaTipo> = {
    'ex_toto': 'ex_toto',
    'ex toto': 'ex_toto',
    'extoto': 'ex_toto',
    'ex_genere': 'ex_genere',
    'ex genere': 'ex_genere',
    'exgenere': 'ex_genere',
    'venial_propio_genero': 'venial_propio_genero',
    'venial propio genero': 'venial_propio_genero',
    'venial propio género': 'venial_propio_genero',
  };
  return materiaMap[value.toLowerCase().trim()] || null;
}

// Validate manifestation value
function validateManifestation(value: string): Manifestation | null {
  const manifMap: Record<string, Manifestation> = {
    'externo': 'externo',
    'interno': 'interno',
  };
  return manifMap[value.toLowerCase().trim()] || null;
}

// Validate objectType value
function validateObjectType(value: string): ObjectType | null {
  const objMap: Record<string, ObjectType> = {
    'carnal': 'carnal',
    'espiritual': 'espiritual',
  };
  return objMap[value.toLowerCase().trim()] || null;
}

// Validate mode value
function validateMode(value: string): Mode | null {
  const modeMap: Record<string, Mode> = {
    'comision': 'comision',
    'comisión': 'comision',
    'omision': 'omision',
    'omisión': 'omision',
  };
  return modeMap[value.toLowerCase().trim()] || null;
}

// Validate resetCycle value
function validateResetCycle(value: string): ResetCycle | null {
  const cycleMap: Record<string, ResetCycle> = {
    'no': 'no',
    'diario': 'diario',
    'semanal': 'semanal',
    'mensual': 'mensual',
    'anual': 'anual',
    'personalizado': 'personalizado',
  };
  return cycleMap[value.toLowerCase().trim()] || null;
}

// Convert parsed row to Sin object
export function rowToSin(row: ParsedRow, mapping: ImportColumnMapping): Partial<Sin> | null {
  const data = row.data;
  
  const nameValue = mapping.name ? data[mapping.name] : '';
  if (!nameValue) return null;
  
  const sin: Partial<Sin> = {
    name: nameValue.trim(),
  };
  
  if (mapping.shortDescription && data[mapping.shortDescription]) {
    sin.shortDescription = data[mapping.shortDescription].trim();
  }
  
  if (mapping.extraInfo && data[mapping.extraInfo]) {
    sin.extraInfo = data[mapping.extraInfo].trim();
  }
  
  if (mapping.terms && data[mapping.terms]) {
    const terms = parseMultiValue(data[mapping.terms])
      .map(validateTerm)
      .filter((t): t is Term => t !== null);
    if (terms.length > 0) sin.terms = terms;
  }
  
  if (mapping.gravities && data[mapping.gravities]) {
    const gravities = parseMultiValue(data[mapping.gravities])
      .map(validateGravity)
      .filter((g): g is Gravity => g !== null);
    if (gravities.length > 0) sin.gravities = gravities;
  }
  
  if (mapping.materiaTipo && data[mapping.materiaTipo]) {
    const materias = parseMultiValue(data[mapping.materiaTipo])
      .map(validateMateriaTipo)
      .filter((m): m is MateriaTipo => m !== null);
    if (materias.length > 0) sin.materiaTipo = materias;
  }
  
  if (mapping.admiteParvedad && data[mapping.admiteParvedad]) {
    sin.admiteParvedad = parseBoolean(data[mapping.admiteParvedad]);
  }
  
  if (mapping.oppositeVirtues && data[mapping.oppositeVirtues]) {
    sin.oppositeVirtues = parseMultiValue(data[mapping.oppositeVirtues]);
  }
  
  if (mapping.capitalSins && data[mapping.capitalSins]) {
    sin.capitalSins = parseMultiValue(data[mapping.capitalSins]);
  }
  
  if (mapping.vows && data[mapping.vows]) {
    sin.vows = parseMultiValue(data[mapping.vows]);
  }
  
  if (mapping.spiritualAspects && data[mapping.spiritualAspects]) {
    sin.spiritualAspects = parseMultiValue(data[mapping.spiritualAspects]);
  }
  
  if (mapping.manifestations && data[mapping.manifestations]) {
    const manifestations = parseMultiValue(data[mapping.manifestations])
      .map(validateManifestation)
      .filter((m): m is Manifestation => m !== null);
    if (manifestations.length > 0) sin.manifestations = manifestations;
  }
  
  if (mapping.objectTypes && data[mapping.objectTypes]) {
    const objectTypes = parseMultiValue(data[mapping.objectTypes])
      .map(validateObjectType)
      .filter((o): o is ObjectType => o !== null);
    if (objectTypes.length > 0) sin.objectTypes = objectTypes;
  }
  
  if (mapping.modes && data[mapping.modes]) {
    const modes = parseMultiValue(data[mapping.modes])
      .map(validateMode)
      .filter((m): m is Mode => m !== null);
    if (modes.length > 0) sin.modes = modes;
  }
  
  if (mapping.involvedPersonTypes && data[mapping.involvedPersonTypes]) {
    sin.involvedPersonTypes = parseMultiValue(data[mapping.involvedPersonTypes]);
  }
  
  if (mapping.associatedActivities && data[mapping.associatedActivities]) {
    sin.associatedActivities = parseMultiValue(data[mapping.associatedActivities]);
  }
  
  if (mapping.resetCycle && data[mapping.resetCycle]) {
    const cycle = validateResetCycle(data[mapping.resetCycle]);
    if (cycle) sin.resetCycle = cycle;
  }
  
  if (mapping.colorPaletteKey && data[mapping.colorPaletteKey]) {
    sin.colorPaletteKey = data[mapping.colorPaletteKey].trim();
  }
  
  if (mapping.tags && data[mapping.tags]) {
    sin.tags = parseMultiValue(data[mapping.tags]);
  }
  
  if (mapping.canAggregateToMortal && data[mapping.canAggregateToMortal]) {
    sin.canAggregateToMortal = parseBoolean(data[mapping.canAggregateToMortal]);
  }
  
  if (mapping.mortalThresholdUnits && data[mapping.mortalThresholdUnits]) {
    sin.mortalThresholdUnits = parseNumber(data[mapping.mortalThresholdUnits], 10);
  }
  
  if (mapping.unitPerTap && data[mapping.unitPerTap]) {
    sin.unitPerTap = parseNumber(data[mapping.unitPerTap], 1);
  }
  
  if (mapping.manualWeightOverride && data[mapping.manualWeightOverride]) {
    const weight = parseNumber(data[mapping.manualWeightOverride], 0);
    if (weight > 0) sin.manualWeightOverride = weight;
  }
  
  return sin;
}

// Import sins with duplicate handling
export function importSins(
  rows: ParsedRow[],
  mapping: ImportColumnMapping,
  strategy: DuplicateStrategy
): ImportResult {
  const result: ImportResult = {
    imported: 0,
    skipped: 0,
    updated: 0,
    merged: 0,
    errors: [],
  };
  
  const existingSins = getSins();
  const existingByName = new Map(existingSins.map(s => [s.name.toLowerCase(), s]));
  
  for (const row of rows) {
    if (row.errors.length > 0) {
      result.errors.push({ row: row.rowNumber, message: row.errors.join(', ') });
      continue;
    }
    
    const sinData = rowToSin(row, mapping);
    if (!sinData || !sinData.name) {
      result.errors.push({ row: row.rowNumber, message: 'Datos inválidos o falta nombre' });
      continue;
    }
    
    const existing = existingByName.get(sinData.name.toLowerCase());
    
    if (existing) {
      switch (strategy) {
        case 'skip':
          result.skipped++;
          break;
          
        case 'overwrite':
          updateSin(existing.id, sinData);
          result.updated++;
          break;
          
        case 'merge':
          // Only fill empty fields
          const mergeData: Partial<Sin> = {};
          for (const [key, value] of Object.entries(sinData)) {
            const existingValue = (existing as any)[key];
            if (
              existingValue === undefined ||
              existingValue === null ||
              existingValue === '' ||
              (Array.isArray(existingValue) && existingValue.length === 0)
            ) {
              (mergeData as any)[key] = value;
            }
          }
          if (Object.keys(mergeData).length > 0) {
            updateSin(existing.id, mergeData);
            result.merged++;
          } else {
            result.skipped++;
          }
          break;
      }
    } else {
      createSin(sinData);
      result.imported++;
    }
  }
  
  return result;
}
