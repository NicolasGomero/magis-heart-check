import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IOSHeader } from "@/components/IOSHeader";
import { PeriodSelector } from "@/components/metrics/PeriodSelector";
import { TrajectoryChart } from "@/components/metrics/TrajectoryChart";
import { VariationBadge } from "@/components/metrics/VariationBadge";
import { PeriodNotes } from "@/components/metrics/PeriodNotes";
import { getBuenaObra, getBuenasObras } from "@/lib/buenasObras.storage";
import { getExamSessions } from "@/lib/examSessions";
import { getPersonTypes, getActivities } from "@/lib/entities";
import { getPreferences, calculateCondicionantesFactor } from "@/lib/preferences";
import { 
  getPeriodConfig, 
  calculateVariation,
  type PeriodConfig,
  type VariationResult,
  type TrajectoryPoint,
  type TrajectoryData,
} from "@/lib/metricsCalculations";
import type { BuenaObra, BuenaObraTerm } from "@/lib/buenasObras.types";
import type { ExamSession, BuenaObraEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CharacteristicData {
  name: string;
  totalEvents: number;
  itemEvents: number;
  itemPercentage: number;
  variation: VariationResult | null;
}

interface EnrichedBuenaObraEvent {
  event: BuenaObraEvent;
  buenaObra: BuenaObra;
  score: number;
}

function enrichBuenaObraEvents(sessions: ExamSession[], buenasObras: BuenaObra[]): EnrichedBuenaObraEvent[] {
  const boMap = new Map(buenasObras.map(b => [b.id, b]));
  const enriched: EnrichedBuenaObraEvent[] = [];
  const prefs = getPreferences();
  
  for (const session of sessions) {
    const events = session.buenaObraEvents || [];
    for (const event of events) {
      const buenaObra = boMap.get(event.buenaObraId);
      if (!buenaObra) continue;
      
      // Base score for buena obra
      let baseScore = buenaObra.baseGoodOverride || 10;
      
      // Apply sacrificio modifier
      const sacrificioMod = buenaObra.sacrificioRelativo === 'alto' ? 1.5 
        : buenaObra.sacrificioRelativo === 'bajo' ? 0.7 : 1.0;
      
      // Apply condicionantes factor (amplifier)
      let condFactor = 1.0;
      if (event.condicionantesFactor) {
        condFactor = event.condicionantesFactor;
      } else if (buenaObra.condicionantes?.length > 0) {
        const result = calculateCondicionantesFactor(
          prefs.subjectProfile.condicionantesActivos,
          buenaObra.condicionantes,
          'buenaObra'
        );
        condFactor = result.factor;
      }
      
      const score = baseScore * sacrificioMod * condFactor * event.countIncrement;
      
      enriched.push({
        event,
        buenaObra,
        score,
      });
    }
  }
  
  return enriched;
}

function getGranularity(periodDays: number): 'day' | 'week' {
  return periodDays <= 14 ? 'day' : 'week';
}

function getBucketKey(timestamp: number, granularity: 'day' | 'week'): string {
  const date = new Date(timestamp);
  if (granularity === 'day') {
    return date.toISOString().split('T')[0];
  }
  const weekStart = new Date(timestamp);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  return weekStart.toISOString().split('T')[0];
}

function getDateLabel(timestamp: number, granularity: 'day' | 'week'): string {
  const date = new Date(timestamp);
  if (granularity === 'day') {
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
  const weekStart = new Date(timestamp);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  return `Sem. ${weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;
}

export default function BuenaObraDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const buenaObra = getBuenaObra(id || '');
  
  const [periodConfig, setPeriodConfig] = useState<PeriodConfig>(() => 
    getPeriodConfig('30d')
  );
  
  const buenasObras = useMemo(() => getBuenasObras(), []);
  const personTypes = useMemo(() => getPersonTypes(), []);
  const activities = useMemo(() => getActivities(), []);
  
  // Calculate real metrics from exam sessions
  const metricsData = useMemo(() => {
    if (!buenaObra) return null;
    
    const sessions = getExamSessions();
    
    // Filter sessions by period
    const periodSessions = sessions.filter(
      s => s.startedAt >= periodConfig.startDate && s.startedAt <= periodConfig.endDate
    );
    
    // Calculate previous period
    const periodDuration = periodConfig.endDate - periodConfig.startDate;
    const previousPeriodConfig: PeriodConfig = {
      ...periodConfig,
      startDate: periodConfig.startDate - periodDuration,
      endDate: periodConfig.startDate,
    };
    
    const previousSessions = sessions.filter(
      s => s.startedAt >= previousPeriodConfig.startDate && s.startedAt <= previousPeriodConfig.endDate
    );
    
    // Enrich all events
    const allEnrichedEvents = enrichBuenaObraEvents(periodSessions, buenasObras);
    const previousAllEnrichedEvents = enrichBuenaObraEvents(previousSessions, buenasObras);
    
    // Filter events for this specific buena obra
    const obraEvents = allEnrichedEvents.filter(e => e.buenaObra.id === buenaObra.id);
    const previousObraEvents = previousAllEnrichedEvents.filter(e => e.buenaObra.id === buenaObra.id);
    
    // Calculate trajectory
    const periodDays = (periodConfig.endDate - periodConfig.startDate) / (1000 * 60 * 60 * 24);
    const granularity = getGranularity(periodDays);
    
    const buckets = new Map<string, { score: number; count: number; timestamp: number }>();
    
    // Initialize all buckets in the period
    const bucketCount = granularity === 'day' ? Math.ceil(periodDays) : Math.ceil(periodDays / 7);
    for (let i = 0; i < bucketCount; i++) {
      const bucketTime = periodConfig.startDate + i * (granularity === 'day' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000);
      const key = getBucketKey(bucketTime, granularity);
      if (!buckets.has(key)) {
        buckets.set(key, { score: 0, count: 0, timestamp: bucketTime });
      }
    }
    
    // Fill with actual data from this obra
    for (const e of obraEvents) {
      const key = getBucketKey(e.event.timestamp, granularity);
      const bucket = buckets.get(key) || { score: 0, count: 0, timestamp: e.event.timestamp };
      bucket.score += e.score;
      bucket.count += 1;
      buckets.set(key, bucket);
    }
    
    const points: TrajectoryPoint[] = Array.from(buckets.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .map(([, bucket]) => ({
        timestamp: bucket.timestamp,
        label: getDateLabel(bucket.timestamp, granularity),
        value: bucket.score,
        eventCount: bucket.count,
      }));
    
    const totalScore = obraEvents.reduce((sum, e) => sum + e.score, 0);
    const totalEvents = obraEvents.reduce((sum, e) => sum + e.event.countIncrement, 0);
    
    // Calculate variation vs previous period
    const previousTotal = previousObraEvents.reduce((sum, e) => sum + e.score, 0);
    const variation = previousTotal > 0 ? calculateVariation(totalScore, previousTotal) : null;
    
    // Adjust variation type for buenas obras (more = progress, less = regression)
    let adjustedVariation = variation;
    if (variation) {
      adjustedVariation = {
        ...variation,
        type: variation.delta > 0.1 * Math.max(0.001, previousTotal) ? 'progress' 
            : variation.delta < -0.1 * Math.max(0.001, previousTotal) ? 'regression' 
            : 'stable',
      };
    }
    
    const trajectory: TrajectoryData = {
      points,
      totalScore,
      eventCount: obraEvents.length,
      variation: adjustedVariation,
    };
    
    // Calculate characteristics breakdown
    const characteristics: CharacteristicData[] = [];
    
    // By Term
    const termLabels: Record<BuenaObraTerm, string> = {
      'hacia_dios': 'Hacia Dios',
      'hacia_projimo': 'Hacia el Prójimo',
      'hacia_si_mismo': 'Hacia uno mismo',
    };
    
    for (const term of buenaObra.terms) {
      const allTermEvents = allEnrichedEvents.filter(e => e.buenaObra.terms.includes(term));
      const prevTermEvents = previousAllEnrichedEvents.filter(e => e.buenaObra.terms.includes(term));
      const obraTermEvents = obraEvents.filter(e => e.buenaObra.terms.includes(term));
      
      const totalCurrent = allTermEvents.reduce((sum, e) => sum + e.score, 0);
      const totalPrevious = prevTermEvents.reduce((sum, e) => sum + e.score, 0);
      const itemCurrent = obraTermEvents.reduce((sum, e) => sum + e.score, 0);
      
      characteristics.push({
        name: termLabels[term],
        totalEvents: allTermEvents.length,
        itemEvents: obraTermEvents.length,
        itemPercentage: totalCurrent > 0 ? (itemCurrent / totalCurrent) * 100 : 0,
        variation: totalPrevious > 0 ? {
          currentValue: totalCurrent,
          previousValue: totalPrevious,
          delta: totalCurrent - totalPrevious,
          percentage: ((totalCurrent - totalPrevious) / totalPrevious) * 100,
          // For buenas obras: more = progress
          type: totalCurrent > totalPrevious * 1.1 ? 'progress' : 
                totalCurrent < totalPrevious * 0.9 ? 'regression' : 'stable',
        } : null,
      });
    }
    
    // By Person Type
    for (const ptId of buenaObra.involvedPersonTypes) {
      const pt = personTypes.find(p => p.id === ptId);
      if (!pt) continue;
      
      const allPtEvents = allEnrichedEvents.filter(e => e.buenaObra.involvedPersonTypes.includes(ptId));
      const prevPtEvents = previousAllEnrichedEvents.filter(e => e.buenaObra.involvedPersonTypes.includes(ptId));
      const obraPtEvents = obraEvents.filter(e => e.buenaObra.involvedPersonTypes.includes(ptId));
      
      const totalCurrent = allPtEvents.reduce((sum, e) => sum + e.score, 0);
      const totalPrevious = prevPtEvents.reduce((sum, e) => sum + e.score, 0);
      const itemCurrent = obraPtEvents.reduce((sum, e) => sum + e.score, 0);
      
      characteristics.push({
        name: pt.name,
        totalEvents: allPtEvents.length,
        itemEvents: obraPtEvents.length,
        itemPercentage: totalCurrent > 0 ? (itemCurrent / totalCurrent) * 100 : 0,
        variation: totalPrevious > 0 ? {
          currentValue: totalCurrent,
          previousValue: totalPrevious,
          delta: totalCurrent - totalPrevious,
          percentage: ((totalCurrent - totalPrevious) / totalPrevious) * 100,
          type: totalCurrent > totalPrevious * 1.1 ? 'progress' : 
                totalCurrent < totalPrevious * 0.9 ? 'regression' : 'stable',
        } : null,
      });
    }
    
    // By Activity
    for (const actId of buenaObra.associatedActivities) {
      const act = activities.find(a => a.id === actId);
      if (!act) continue;
      
      const allActEvents = allEnrichedEvents.filter(e => e.buenaObra.associatedActivities.includes(actId));
      const prevActEvents = previousAllEnrichedEvents.filter(e => e.buenaObra.associatedActivities.includes(actId));
      const obraActEvents = obraEvents.filter(e => e.buenaObra.associatedActivities.includes(actId));
      
      const totalCurrent = allActEvents.reduce((sum, e) => sum + e.score, 0);
      const totalPrevious = prevActEvents.reduce((sum, e) => sum + e.score, 0);
      const itemCurrent = obraActEvents.reduce((sum, e) => sum + e.score, 0);
      
      characteristics.push({
        name: act.name,
        totalEvents: allActEvents.length,
        itemEvents: obraActEvents.length,
        itemPercentage: totalCurrent > 0 ? (itemCurrent / totalCurrent) * 100 : 0,
        variation: totalPrevious > 0 ? {
          currentValue: totalCurrent,
          previousValue: totalPrevious,
          delta: totalCurrent - totalPrevious,
          percentage: ((totalCurrent - totalPrevious) / totalPrevious) * 100,
          type: totalCurrent > totalPrevious * 1.1 ? 'progress' : 
                totalCurrent < totalPrevious * 0.9 ? 'regression' : 'stable',
        } : null,
      });
    }
    
    return {
      trajectory,
      characteristics,
      totalEvents,
      totalScore,
    };
  }, [buenaObra, periodConfig, buenasObras, personTypes, activities]);
  
  if (!buenaObra) {
    return (
      <div className="min-h-screen bg-background">
        <IOSHeader title="No encontrado" onBack={() => navigate(-1)} />
        <div className="p-4 text-center text-muted-foreground">
          Buena obra no encontrada
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background pb-8">
      <IOSHeader 
        title={buenaObra.name} 
        subtitle="Métricas históricas"
        onBack={() => navigate("/obras/buenas")}
      />
      
      <div className="p-4 space-y-6">
        {/* Period Selector */}
        <section>
          <PeriodSelector value={periodConfig} onChange={setPeriodConfig} />
        </section>
        
        {/* Summary */}
        <section className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-ios-caption text-muted-foreground">
                Registros del ítem
              </p>
              <p className="text-ios-title2 font-semibold text-foreground">
                {metricsData?.totalEvents || 0}
              </p>
            </div>
            <div className="text-right">
              <p className="text-ios-caption text-muted-foreground">
                Puntos en el periodo
              </p>
              <p className="text-ios-title2 font-semibold text-foreground">
                {metricsData?.totalScore.toFixed(1) || '0.0'}
              </p>
            </div>
          </div>
        </section>
        
        {/* Trajectory Chart */}
        {metricsData?.trajectory && metricsData.totalEvents > 0 && (
          <section>
            <TrajectoryChart 
              data={metricsData.trajectory} 
              title="Trayectoria histórica"
              color="hsl(142, 76%, 36%)"
              showVariation={true}
            />
          </section>
        )}
        
        {/* Placeholder when no data */}
        {metricsData && metricsData.totalEvents === 0 && (
          <section className="bg-card rounded-xl p-4 border border-border">
            <div className="text-center py-8">
              <p className="text-ios-body text-muted-foreground">
                No hay registros para este periodo
              </p>
            </div>
          </section>
        )}
        
        {/* Characteristics Table */}
        {metricsData && metricsData.characteristics.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-ios-subhead text-foreground leading-tight">
              Impacto de la obra en la variación agregada de sus características
            </h2>
            
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 text-ios-caption text-muted-foreground font-medium">
                <div className="col-span-5">Característica</div>
                <div className="col-span-3 text-right">Variación</div>
                <div className="col-span-4 text-right">% Atribuible</div>
              </div>
              
              {metricsData.characteristics.map((char, index) => (
                <div 
                  key={index}
                  className={cn(
                    "grid grid-cols-12 gap-2 px-4 py-3 items-start",
                    index !== metricsData.characteristics.length - 1 && "border-b border-border/50"
                  )}
                >
                  <div className="col-span-5 text-ios-subhead text-foreground break-words">
                    {char.name}
                  </div>
                  <div className="col-span-3 flex justify-end">
                    {char.variation ? (
                      <VariationBadge variation={char.variation} size="sm" />
                    ) : (
                      <span className="text-ios-caption text-muted-foreground">—</span>
                    )}
                  </div>
                  <div className="col-span-4 text-right">
                    <span className="text-ios-subhead text-foreground font-medium">
                      {char.itemPercentage.toFixed(1)}%
                    </span>
                    <span className="text-ios-caption text-muted-foreground ml-1">
                      ({char.itemEvents}/{char.totalEvents})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* Notes Section */}
        <PeriodNotes
          targetId={buenaObra.id}
          targetType="goodWork"
          startDate={periodConfig.startDate}
          endDate={periodConfig.endDate}
          returnPath={`/obras/buenas/${buenaObra.id}/detalle`}
        />
        
        {/* No characteristics message */}
        {metricsData && metricsData.characteristics.length === 0 && (
          <div className="text-center py-8">
            <p className="text-ios-body text-muted-foreground">
              Esta buena obra no tiene características configuradas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
