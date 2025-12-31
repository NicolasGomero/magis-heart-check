// User preferences storage and management
// Handles theme, metrics calibration, and app settings

export type ThemeMode = 'light' | 'dark' | 'system';
export type WeekStartDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
export type TimeFormat = '12h' | '24h';
export type ChartType = 'bars' | 'lines' | 'area';
export type DuplicateStrategy = 'skip' | 'overwrite' | 'merge';

export interface SleepWindow {
  startHour: number; // 0-23
  endHour: number; // 0-23
}

export interface MetricsCalibration {
  targetGrade: number; // default 15.5
  calibrationWindowDays: number; // default 14
  autoCalibrate: boolean; // default true
  passRateMax: number; // default 50
  useActiveHoursOnly: boolean; // default true
  sleepWindow: SleepWindow; // if useActiveHoursOnly is false
}

export interface CountingOperation {
  batchCreationEnabled: boolean;
  soundEnabled: boolean;
}

export interface UserPreferences {
  // General
  theme: ThemeMode;
  weekStartDay: WeekStartDay;
  timeFormat: TimeFormat;
  chartType: ChartType;
  lockEnabled: boolean;
  language: string;
  
  // Counting operation
  countingOperation: CountingOperation;
  
  // Metrics calibration
  metricsCalibration: MetricsCalibration;
  
  // Import settings
  defaultDuplicateStrategy: DuplicateStrategy;
  
  // Metadata
  lastUpdated: number;
}

const STORAGE_KEY = 'magis_preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  weekStartDay: 1, // Monday
  timeFormat: '24h',
  chartType: 'area',
  lockEnabled: false,
  language: 'es',
  countingOperation: {
    batchCreationEnabled: false,
    soundEnabled: true,
  },
  metricsCalibration: {
    targetGrade: 15.5,
    calibrationWindowDays: 14,
    autoCalibrate: true,
    passRateMax: 50,
    useActiveHoursOnly: true,
    sleepWindow: {
      startHour: 23,
      endHour: 7,
    },
  },
  defaultDuplicateStrategy: 'skip',
  lastUpdated: Date.now(),
};

export function getPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all fields exist
      return {
        ...DEFAULT_PREFERENCES,
        ...parsed,
        countingOperation: {
          ...DEFAULT_PREFERENCES.countingOperation,
          ...parsed.countingOperation,
        },
        metricsCalibration: {
          ...DEFAULT_PREFERENCES.metricsCalibration,
          ...parsed.metricsCalibration,
          sleepWindow: {
            ...DEFAULT_PREFERENCES.metricsCalibration.sleepWindow,
            ...parsed.metricsCalibration?.sleepWindow,
          },
        },
      };
    }
  } catch (e) {
    console.error('Error reading preferences:', e);
  }
  return { ...DEFAULT_PREFERENCES };
}

export function savePreferences(prefs: Partial<UserPreferences>): UserPreferences {
  const current = getPreferences();
  const updated: UserPreferences = {
    ...current,
    ...prefs,
    countingOperation: prefs.countingOperation 
      ? { ...current.countingOperation, ...prefs.countingOperation }
      : current.countingOperation,
    metricsCalibration: prefs.metricsCalibration
      ? { 
          ...current.metricsCalibration, 
          ...prefs.metricsCalibration,
          sleepWindow: prefs.metricsCalibration.sleepWindow
            ? { ...current.metricsCalibration.sleepWindow, ...prefs.metricsCalibration.sleepWindow }
            : current.metricsCalibration.sleepWindow,
        }
      : current.metricsCalibration,
    lastUpdated: Date.now(),
  };
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Apply theme immediately
    applyTheme(updated.theme);
  } catch (e) {
    console.error('Error saving preferences:', e);
  }
  
  return updated;
}

export function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement;
  
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}

// Initialize theme on load
export function initializeTheme(): void {
  const prefs = getPreferences();
  applyTheme(prefs.theme);
  
  // Listen for system theme changes if using system theme
  if (prefs.theme === 'system') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const currentPrefs = getPreferences();
      if (currentPrefs.theme === 'system') {
        document.documentElement.classList.toggle('dark', e.matches);
      }
    });
  }
}

// Auto-calibration logic
export function calculateAutoCalibration(): number | null {
  // This would analyze the last 14 days of approved sessions
  // to calculate the optimal PASS_RATE_MAX
  // For now, return null to indicate insufficient data
  
  const prefs = getPreferences();
  const { targetGrade, calibrationWindowDays } = prefs.metricsCalibration;
  
  // p_target = (20 - NotaObjetivo) / 9.5
  const pTarget = (20 - targetGrade) / 9.5;
  
  // Would need to calculate venialRate_normal from actual data
  // venialRate_normal = median of venialRate per day for approved days
  // PASS_RATE_MAX = venialRate_normal / p_target
  
  // Placeholder: return current value if can't calculate
  return null;
}

// Day labels for week start selector
export const WEEK_DAY_LABELS: Record<WeekStartDay, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

export const CHART_TYPE_LABELS: Record<ChartType, string> = {
  bars: 'Barras',
  lines: 'Líneas',
  area: 'Área',
};

export const LANGUAGE_LABELS: Record<string, string> = {
  es: 'Español',
  en: 'English',
  la: 'Latina',
};
