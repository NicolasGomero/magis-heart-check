import { useState, useMemo } from 'react';
import { IOSHeader } from '@/components/IOSHeader';
import { PeriodSelector } from '@/components/metrics/PeriodSelector';
import { PeriodGradeCard } from '@/components/metrics/PeriodGradeCard';
import { TrajectoryChart } from '@/components/metrics/TrajectoryChart';
import { FilterBuilder } from '@/components/metrics/FilterBuilder';
import { DimensionTabs } from '@/components/metrics/DimensionTabs';
import { VariationBadge } from '@/components/metrics/VariationBadge';
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
      <IOSHeader title="Métricas" />
      
      <div className="p-4 space-y-6">
        {/* Period Selector */}
        <PeriodSelector value={periodConfig} onChange={setPeriodConfig} />
        
        {/* Period Grade Card */}
        <PeriodGradeCard grade={metrics.periodGrade} />
        
        {/* Total Trajectory */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-ios-headline font-semibold text-foreground">
              Trayectoria total
            </h2>
            <VariationBadge variation={metrics.totalTrajectory.variation} />
          </div>
          <TrajectoryChart 
            data={metrics.totalTrajectory} 
            title="Score agregado"
            showVariation={false}
          />
        </div>

        {/* Comparison with previous period */}
        {metrics.totalTrajectory.variation && (
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-ios-caption text-muted-foreground mb-2">
              vs periodo anterior ({periodConfig.label})
            </p>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-semibold text-foreground">
                  {metrics.totalTrajectory.totalScore.toFixed(1)}
                </span>
                <span className="text-muted-foreground ml-2">actual</span>
              </div>
              <div className="text-right">
                <span className="text-lg text-muted-foreground">
                  {metrics.totalTrajectory.variation.previousValue.toFixed(1)}
                </span>
                <span className="text-muted-foreground ml-2">anterior</span>
              </div>
            </div>
            <div className="mt-2">
              <VariationBadge variation={metrics.totalTrajectory.variation} />
            </div>
          </div>
        )}

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
            Trayectorias por dimensión
          </h2>
          <DimensionTabs 
            bySin={metrics.bySin}
            byTerm={metrics.byTerm}
            byPersonType={metrics.byPersonType}
            byActivity={metrics.byActivity}
            byCapitalSin={metrics.byCapitalSin}
            byGravity={metrics.byGravity}
            byManifestation={metrics.byManifestation}
            byMode={metrics.byMode}
          />
        </div>

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
