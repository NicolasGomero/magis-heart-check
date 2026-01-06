// Unified Condicionantes source of truth
// This is THE single source for all condicionantes in the app

// ========== Seed Condicionantes (canonical list) ==========
// These are the predefined condicionantes that must always exist

export const SEED_CONDICIONANTES = [
  'Inmadurez afectiva',
  'Trastornos psíquicos',
  'Educación gravemente deficiente',
  'Contextos culturales deformados',
  'Estrés o sufrimiento prolongados',
  'Hábito arraigado o adicción',
  'Economía doméstica precaria',
  'Crisis económica',
  'Excesiva carga laboral justificada',
  'Salud crónica',
  'Temperamento desfavorable',
] as const;

export type SeedCondicionante = typeof SEED_CONDICIONANTES[number];

// ========== Migration Map ==========
// Maps old condicionante names to their canonical names for migration

const CONDICIONANTES_MIGRATION_MAP: Record<string, string> = {
  // From sins.types.ts DEFAULT_CONDICIONANTES
  'Fatiga': 'Estrés o sufrimiento prolongados',
  'Enfermedad': 'Salud crónica',
  'Estrés': 'Estrés o sufrimiento prolongados',
  'Falta de sueño': 'Estrés o sufrimiento prolongados',
  'Hambre': 'Economía doméstica precaria',
  'Prisa': 'Excesiva carga laboral justificada',
  'Miedo': 'Trastornos psíquicos',
  'Ira previa': 'Temperamento desfavorable',
  'Tristeza': 'Estrés o sufrimiento prolongados',
  'Soledad': 'Estrés o sufrimiento prolongados',
  'Tentación fuerte': 'Hábito arraigado o adicción',
  'Costumbre arraigada': 'Hábito arraigado o adicción',
  // From buenasObras.types.ts DEFAULT_BUENA_OBRA_CONDICIONANTES
  'Dificultad externa': 'Contextos culturales deformados',
  'Incomprensión': 'Contextos culturales deformados',
  // Old name migration
  'Estados prolongados de estrés o sufrimiento': 'Estrés o sufrimiento prolongados',
};

// ========== Migration Function ==========

/**
 * Migrate a list of condicionantes from old format to canonical format
 * - Maps known old names to their canonical equivalents
 * - Preserves custom condicionantes that don't match seeds
 * - Removes duplicates
 */
export function migrateCondicionantes(oldCondicionantes: string[]): string[] {
  const migrated = new Set<string>();
  
  for (const cond of oldCondicionantes) {
    // Check if it's a seed condicionante (already canonical)
    if (SEED_CONDICIONANTES.includes(cond as SeedCondicionante)) {
      migrated.add(cond);
    } 
    // Check if it needs migration
    else if (CONDICIONANTES_MIGRATION_MAP[cond]) {
      migrated.add(CONDICIONANTES_MIGRATION_MAP[cond]);
    }
    // Preserve as custom if not recognized
    else {
      migrated.add(cond);
    }
  }
  
  return Array.from(migrated);
}

// ========== Get All Condicionantes ==========

/**
 * Get all available condicionantes (seeds + custom from user profile)
 * This should be used everywhere in the app to get the condicionantes list
 */
export function getAllCondicionantes(customCondicionantes: string[] = []): string[] {
  // Start with seeds (cast to mutable array)
  const all: string[] = [...SEED_CONDICIONANTES];
  
  // Add custom condicionantes that aren't already in seeds
  for (const custom of customCondicionantes) {
    if (!all.includes(custom)) {
      all.push(custom);
    }
  }
  
  return all;
}

// ========== Calculate Condicionantes Factor ==========

export interface CondicionantesResult {
  appliedCondicionantes: string[];
  k: number;
  factor: number;
}

/**
 * Calculate condicionantes factor for scoring
 * @param subjectCondicionantes - Active condicionantes of the subject (from user profile)
 * @param itemCondicionantes - Compatible condicionantes of the item (Sin or BuenaObra)
 * @param type - 'sin' for attenuation (0.80^k), 'buenaObra' for amplification (1.20^k)
 */
export function calculateCondicionantesFactor(
  subjectCondicionantes: string[],
  itemCondicionantes: string[],
  type: 'sin' | 'buenaObra'
): CondicionantesResult {
  // Intersection between subject's active condicionantes and item's compatible condicionantes
  const appliedCondicionantes = subjectCondicionantes.filter(c => 
    itemCondicionantes.includes(c)
  );
  
  const k = appliedCondicionantes.length;
  
  // Base factor: 0.80 for sins (attenuation), 1.20 for buenas obras (amplification)
  const baseFactor = type === 'sin' ? 0.80 : 1.20;
  const factor = k > 0 ? Math.pow(baseFactor, k) : 1.0;
  
  return { appliedCondicionantes, k, factor };
}
