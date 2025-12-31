import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  Palette, 
  Calculator, 
  Calendar, 
  Clock, 
  BarChart3, 
  Lock, 
  Link2, 
  Globe,
  Target,
  Gauge,
  Timer,
  Moon,
  Download,
  Upload,
  Volume2,
  Layers,
  Info
} from 'lucide-react';
import { IOSHeader } from '@/components/IOSHeader';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  getPreferences,
  savePreferences,
  ThemeMode,
  WeekStartDay,
  TimeFormat,
  ChartType,
  WEEK_DAY_LABELS,
  CHART_TYPE_LABELS,
  LANGUAGE_LABELS,
  applyTheme,
} from '@/lib/preferences';

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
  onClick?: () => void;
  showChevron?: boolean;
  children?: React.ReactNode;
}

function SettingsRow({ icon, label, value, onClick, showChevron = true, children }: SettingsRowProps) {
  const content = (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
          {icon}
        </div>
        <span className="text-ios-body text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-ios-body text-muted-foreground">{value}</span>}
        {children}
        {showChevron && onClick && (
          <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="w-full text-left active:bg-muted/50 transition-colors"
      >
        {content}
      </button>
    );
  }

  return content;
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-ios-caption text-muted-foreground uppercase tracking-wide px-4 py-2">
        {title}
      </p>
      <div className="bg-card border-y border-border divide-y divide-border">
        {children}
      </div>
    </div>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState(getPreferences());
  const [showUrlScheme, setShowUrlScheme] = useState(false);

  useEffect(() => {
    setPrefs(getPreferences());
  }, []);

  const updatePref = <K extends keyof typeof prefs>(key: K, value: typeof prefs[K]) => {
    const updated = savePreferences({ [key]: value });
    setPrefs(updated);
  };

  const updateMetrics = <K extends keyof typeof prefs.metricsCalibration>(
    key: K,
    value: typeof prefs.metricsCalibration[K]
  ) => {
    const updated = savePreferences({
      metricsCalibration: {
        ...prefs.metricsCalibration,
        [key]: value,
      },
    });
    setPrefs(updated);
  };

  const updateCounting = <K extends keyof typeof prefs.countingOperation>(
    key: K,
    value: typeof prefs.countingOperation[K]
  ) => {
    const updated = savePreferences({
      countingOperation: {
        ...prefs.countingOperation,
        [key]: value,
      },
    });
    setPrefs(updated);
  };

  const handleThemeChange = (theme: ThemeMode) => {
    updatePref('theme', theme);
    applyTheme(theme);
  };

  const themeLabels: Record<ThemeMode, string> = {
    light: 'Claro',
    dark: 'Oscuro',
    system: 'Automático',
  };

  const appScheme = 'magis://';

  return (
    <div className="min-h-screen bg-background pb-24">
      <IOSHeader title="Configuración" onBack={() => navigate('/')} />

      <div className="py-4">
        {/* GENERAL */}
        <SettingsSection title="General">
          {/* Theme */}
          <div className="px-4 py-3.5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <Palette className="w-4 h-4" />
              </div>
              <span className="text-ios-body text-foreground">Tema</span>
            </div>
            <div className="grid grid-cols-3 gap-2 ml-10">
              {(['light', 'dark', 'system'] as ThemeMode[]).map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleThemeChange(theme)}
                  className={cn(
                    "py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                    prefs.theme === theme
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted/50 text-foreground hover:bg-muted"
                  )}
                >
                  {themeLabels[theme]}
                </button>
              ))}
            </div>
          </div>

          {/* Counting Operation */}
          <SettingsRow
            icon={<Calculator className="w-4 h-4" />}
            label="Operación de conteo"
            onClick={() => navigate('/settings/counting')}
          />

          {/* Week start */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-ios-body text-foreground">Semana comienza</span>
            </div>
            <Select
              value={prefs.weekStartDay.toString()}
              onValueChange={(v) => updatePref('weekStartDay', parseInt(v) as WeekStartDay)}
            >
              <SelectTrigger className="w-32 bg-muted/50 border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {Object.entries(WEEK_DAY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time format */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-ios-body text-foreground">Formato hora</span>
            </div>
            <Select
              value={prefs.timeFormat}
              onValueChange={(v) => updatePref('timeFormat', v as TimeFormat)}
            >
              <SelectTrigger className="w-24 bg-muted/50 border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="12h">12h</SelectItem>
                <SelectItem value="24h">24h</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Chart type */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="text-ios-body text-foreground">Tipo de gráfica</span>
            </div>
            <Select
              value={prefs.chartType}
              onValueChange={(v) => updatePref('chartType', v as ChartType)}
            >
              <SelectTrigger className="w-28 bg-muted/50 border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {Object.entries(CHART_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lock */}
          <SettingsRow
            icon={<Lock className="w-4 h-4" />}
            label="Código & Touch ID"
            showChevron={false}
          >
            <Switch
              checked={prefs.lockEnabled}
              onCheckedChange={(checked) => updatePref('lockEnabled', checked)}
            />
          </SettingsRow>

          {/* URL Scheme */}
          <SettingsRow
            icon={<Link2 className="w-4 h-4" />}
            label="URL Scheme"
            value={showUrlScheme ? undefined : appScheme}
            onClick={() => setShowUrlScheme(!showUrlScheme)}
          />
          {showUrlScheme && (
            <div className="px-4 py-3 bg-muted/30 ml-10 mr-4 mb-3 rounded-lg">
              <p className="text-ios-caption text-muted-foreground mb-2">Deep links:</p>
              <code className="text-xs text-foreground block">{appScheme}exam</code>
              <code className="text-xs text-foreground block">{appScheme}sins</code>
              <code className="text-xs text-foreground block">{appScheme}metrics</code>
            </div>
          )}

          {/* Language */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-ios-body text-foreground">Idioma</span>
            </div>
            <Select
              value={prefs.language}
              onValueChange={(v) => updatePref('language', v)}
            >
              <SelectTrigger className="w-28 bg-muted/50 border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SettingsSection>

        {/* METRICS */}
        <SettingsSection title="Métricas">
          {/* Target grade */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <Target className="w-4 h-4" />
              </div>
              <span className="text-ios-body text-foreground">Nota objetivo</span>
            </div>
            <Input
              type="number"
              step="0.5"
              min="10.5"
              max="20"
              value={prefs.metricsCalibration.targetGrade}
              onChange={(e) => updateMetrics('targetGrade', parseFloat(e.target.value) || 15.5)}
              className="w-20 text-center bg-muted/50 border-0"
            />
          </div>

          {/* Calibration window */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <Timer className="w-4 h-4" />
              </div>
              <span className="text-ios-body text-foreground">Ventana calibración</span>
            </div>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min="7"
                max="90"
                value={prefs.metricsCalibration.calibrationWindowDays}
                onChange={(e) => updateMetrics('calibrationWindowDays', parseInt(e.target.value) || 14)}
                className="w-16 text-center bg-muted/50 border-0"
              />
              <span className="text-ios-caption text-muted-foreground">días</span>
            </div>
          </div>

          {/* Auto-calibrate */}
          <SettingsRow
            icon={<Gauge className="w-4 h-4" />}
            label="Auto-calibrar"
            showChevron={false}
          >
            <Switch
              checked={prefs.metricsCalibration.autoCalibrate}
              onCheckedChange={(checked) => updateMetrics('autoCalibrate', checked)}
            />
          </SettingsRow>

          {/* PASS_RATE_MAX */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="text-ios-body text-foreground">PASS_RATE_MAX</span>
            </div>
            <Input
              type="number"
              step="1"
              min="10"
              max="200"
              value={prefs.metricsCalibration.passRateMax}
              onChange={(e) => updateMetrics('passRateMax', parseFloat(e.target.value) || 50)}
              className="w-20 text-center bg-muted/50 border-0"
              disabled={prefs.metricsCalibration.autoCalibrate}
            />
          </div>

          {/* Active hours */}
          <SettingsRow
            icon={<Clock className="w-4 h-4" />}
            label="Horas activas"
            showChevron={false}
          >
            <Switch
              checked={prefs.metricsCalibration.useActiveHoursOnly}
              onCheckedChange={(checked) => updateMetrics('useActiveHoursOnly', checked)}
            />
          </SettingsRow>

          {/* Sleep window (only if active hours OFF) */}
          {!prefs.metricsCalibration.useActiveHoursOnly && (
            <div className="px-4 py-3.5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                  <Moon className="w-4 h-4" />
                </div>
                <span className="text-ios-body text-foreground">Franja de sueño</span>
              </div>
              <div className="flex items-center gap-2 ml-10">
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={prefs.metricsCalibration.sleepWindow.startHour}
                  onChange={(e) => updateMetrics('sleepWindow', {
                    ...prefs.metricsCalibration.sleepWindow,
                    startHour: parseInt(e.target.value) || 23,
                  } as any)}
                  className="w-16 text-center bg-muted/50 border-0"
                />
                <span className="text-muted-foreground">—</span>
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={prefs.metricsCalibration.sleepWindow.endHour}
                  onChange={(e) => updateMetrics('sleepWindow', {
                    ...prefs.metricsCalibration.sleepWindow,
                    endHour: parseInt(e.target.value) || 7,
                  } as any)}
                  className="w-16 text-center bg-muted/50 border-0"
                />
                <span className="text-ios-caption text-muted-foreground">h</span>
              </div>
            </div>
          )}

          {/* Info about calibration */}
          <div className="px-4 py-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-ios-caption text-muted-foreground">
              La auto-calibración ajusta PASS_RATE_MAX basándose en la mediana de tu carga venial 
              en los últimos {prefs.metricsCalibration.calibrationWindowDays} días aprobados.
            </p>
          </div>
        </SettingsSection>

        {/* COUNTING OPERATION */}
        <SettingsSection title="Operación de conteo">
          <SettingsRow
            icon={<Layers className="w-4 h-4" />}
            label="Creación en lote"
            showChevron={false}
          >
            <Switch
              checked={prefs.countingOperation.batchCreationEnabled}
              onCheckedChange={(checked) => updateCounting('batchCreationEnabled', checked)}
            />
          </SettingsRow>

          <SettingsRow
            icon={<Volume2 className="w-4 h-4" />}
            label="Sonido"
            showChevron={false}
          >
            <Switch
              checked={prefs.countingOperation.soundEnabled}
              onCheckedChange={(checked) => updateCounting('soundEnabled', checked)}
            />
          </SettingsRow>

          {prefs.countingOperation.batchCreationEnabled && (
            <div className="px-4 py-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-ios-caption text-muted-foreground">
                El botón "+" mostrará opciones para crear manualmente o importar desde archivo.
              </p>
            </div>
          )}
        </SettingsSection>

        {/* BACKUP & RESTORE */}
        <SettingsSection title="Copia y restauración">
          <SettingsRow
            icon={<Download className="w-4 h-4" />}
            label="Exportar datos"
            onClick={() => navigate('/settings/backup')}
          />
          <SettingsRow
            icon={<Upload className="w-4 h-4" />}
            label="Importar pecados"
            onClick={() => navigate('/settings/import')}
          />
        </SettingsSection>

        {/* INFO */}
        <SettingsSection title="Información">
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-ios-body text-foreground">Versión</span>
            <span className="text-ios-body text-muted-foreground">2.0.0</span>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}

export default SettingsPage;
