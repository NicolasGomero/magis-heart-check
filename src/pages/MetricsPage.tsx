import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Settings, MessageSquare } from 'lucide-react';
import { PeriodSelector } from '@/components/metrics/PeriodSelector';
import { PeriodGradeCard } from '@/components/metrics/PeriodGradeCard';
import { TrajectoryChart } from '@/components/metrics/TrajectoryChart';
import { FilterBuilder } from '@/components/metrics/FilterBuilder';
import { DimensionTabs } from '@/components/metrics/DimensionTabs';
import { 
  PeriodConfig, 
  MetricFilter,
  getPeriodConfig,
  calculateMetrics,
} from '@/lib/metricsCalculations';
import { getExamSessions } from '@/lib/examSessions';

export function MetricsPage() {
  const [periodConfig, setPeriodConfig] = useState<PeriodConfig>(getPeriodConfig('7d'));
  const [filter, setFilter] = useState<MetricFilter>({});
  
  const sessions = getExamSessions();
  
  const metrics = useMemo(() => {
    return calculateMetrics(periodConfig, filter);
  }, [periodConfig, filter]);

  const hasFilters = Object.values(filter).some(v => v?.length);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between h-11 px-4">
          <div className="w-10" /> {/* Spacer */}
          <h1 className="text-ios-headline font-semibold text-foreground">Avance</h1>
          <Link 
            to="/settings" 
            className="text-muted-foreground active:opacity-70 transition-opacity touch-target"
          >
            <Settings className="w-6 h-6" />
          </Link>
        </div>
      </header>
      
      <div className="p-4 space-y-6">
        {/* Period Selector */}
        <PeriodSelector value={periodConfig} onChange={setPeriodConfig} />
        
        {/* Period Grade Card */}
        <PeriodGradeCard grade={metrics.periodGrade} />
        
        {/* Total Trajectories (4 series) */}
        <div className="space-y-4">
          <h2 className="text-ios-headline font-semibold text-foreground">
            Tendencias generales
          </h2>
          
          {/* Grade trajectory */}
          <TrajectoryChart 
            data={metrics.totalTrajectories.grade} 
            title="Calificación del periodo"
            showVariation
            color="hsl(var(--primary))"
          />
          
          {/* Buenas obras trajectory */}
          <TrajectoryChart 
            data={metrics.totalTrajectories.buenasObras} 
            title="Buenas obras"
            color="hsl(142, 70%, 45%)"
          />
          
          {/* Mortal sins trajectory */}
          <TrajectoryChart 
            data={metrics.totalTrajectories.mortalSins} 
            title="Pecados mortales"
            color="hsl(0, 70%, 50%)"
          />
          
          {/* Venial sins trajectory */}
          <TrajectoryChart 
            data={metrics.totalTrajectories.venialSins} 
            title="Pecados veniales"
            color="hsl(45, 70%, 50%)"
          />
        </div>

        {/* Filter Builder */}
        <FilterBuilder value={filter} onChange={setFilter} />

        {/* Filtered Trajectory */}
        {hasFilters && metrics.filteredTrajectory && (
          <div className="space-y-2">
            <h2 className="text-ios-headline font-semibold text-foreground">
              Trayectoria filtrada
            </h2>
            <TrajectoryChart 
              data={metrics.filteredTrajectory} 
              title="Filtro aplicado"
              color="hsl(280, 70%, 50%)"
            />
          </div>
        )}

        {/* Dimension Tabs */}
        <div className="space-y-2">
          <h2 className="text-ios-headline font-semibold text-foreground">
            Tendencias por dimensión
          </h2>
          <DimensionTabs metrics={metrics} />
        </div>

        {/* Notes panel */}
        {metrics.notesInPeriod.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-ios-headline font-semibold text-foreground">
              Notas del periodo
            </h2>
            <div className="bg-card rounded-xl border border-border divide-y divide-border">
              {metrics.notesInPeriod.map((note, idx) => (
                <div key={idx} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-ios-caption text-muted-foreground">
                      {note.name}
                    </span>
                    <span className="text-ios-caption text-muted-foreground">•</span>
                    <span className="text-ios-caption text-muted-foreground">
                      {new Date(note.createdAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <p className="text-ios-body text-foreground">{note.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {sessions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-ios-body text-muted-foreground">
              Realiza tu primer examen para ver métricas detalladas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricsPage;
