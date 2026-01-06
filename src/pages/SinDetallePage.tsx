import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IOSHeader } from "@/components/IOSHeader";
import { PeriodSelector } from "@/components/metrics/PeriodSelector";
import { TrajectoryChart } from "@/components/metrics/TrajectoryChart";
import { VariationBadge } from "@/components/metrics/VariationBadge";
import { PeriodNotes } from "@/components/metrics/PeriodNotes";
import { getSin } from "@/lib/sins.storage";
import { getExamSessions } from "@/lib/examSessions";
import { getSins } from "@/lib/sins.storage";
import { getPersonTypes, getActivities } from "@/lib/entities";
import { 
  getPeriodConfig, 
  calculateSinTrajectory,
  type PeriodConfig,
  type EnrichedSinEvent,
  type TrajectoryData,
  type VariationResult,
} from "@/lib/metricsCalculations";
import { calculateEventScore } from "@/lib/scoring";
import type { Sin, Term, Gravity } from "@/lib/sins.types";
import type { SinEvent, ExamSession } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CharacteristicData {
  name: string;
  totalEvents: number;
  itemEvents: number;
  itemPercentage: number;
  variation: VariationResult | null;
}

function enrichEventsForSin(sessions: ExamSession[], sins: Sin[]): EnrichedSinEvent[] {
  const sinMap = new Map(sins.map(s => [s.id, s]));
  const enriched: EnrichedSinEvent[] = [];
  
  for (const session of sessions) {
    for (const event of session.events) {
      const sin = sinMap.get(event.sinId);
      if (!sin) continue;
      
      const breakdown = calculateEventScore(sin, event);
      const isMortalImputable = 
        sin.gravities.includes('mortal') &&
        event.attention === 'deliberado' &&
        event.responsibility === 'formal' &&
        event.motive !== 'ignorancia';
      
      enriched.push({
        event,
        sin,
        score: breakdown.normalizedScore,
        breakdown,
        isMortalImputable,
      });
    }
  }
  
  return enriched;
}

export default function SinDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const sin = getSin(id || '');
  
  const [periodConfig, setPeriodConfig] = useState<PeriodConfig>(() => 
    getPeriodConfig('30d')
  );
  
  const sins = useMemo(() => getSins(), []);
  const personTypes = useMemo(() => getPersonTypes(), []);
  const activities = useMemo(() => getActivities(), []);
  
  // Calculate metrics for this specific sin
  const metricsData = useMemo(() => {
    if (!sin) return null;
    
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
    const allEnrichedEvents = enrichEventsForSin(periodSessions, sins);
    const previousAllEnrichedEvents = enrichEventsForSin(previousSessions, sins);
    
    // Filter events for this sin
    const sinEvents = allEnrichedEvents.filter(e => e.sin.id === sin.id);
    const previousSinEvents = previousAllEnrichedEvents.filter(e => e.sin.id === sin.id);
    
    // Calculate trajectory for this sin
    const trajectory = calculateSinTrajectory(sinEvents, periodConfig, previousSinEvents);
    
    // Calculate characteristics breakdown
    const characteristics: CharacteristicData[] = [];
    
    // By Term
    const termLabels: Record<Term, string> = {
      'contra_dios': 'Contra Dios',
      'contra_projimo': 'Contra el Prójimo',
      'contra_si_mismo': 'Contra uno mismo',
    };
    
    for (const term of sin.terms) {
      const allTermEvents = allEnrichedEvents.filter(e => e.sin.terms.includes(term));
      const prevTermEvents = previousAllEnrichedEvents.filter(e => e.sin.terms.includes(term));
      const sinTermEvents = sinEvents.filter(e => e.sin.terms.includes(term));
      
      const totalCurrent = allTermEvents.reduce((sum, e) => sum + e.score, 0);
      const totalPrevious = prevTermEvents.reduce((sum, e) => sum + e.score, 0);
      const itemCurrent = sinTermEvents.reduce((sum, e) => sum + e.score, 0);
      
      characteristics.push({
        name: `Término: ${termLabels[term]}`,
        totalEvents: allTermEvents.length,
        itemEvents: sinTermEvents.length,
        itemPercentage: totalCurrent > 0 ? (itemCurrent / totalCurrent) * 100 : 0,
        variation: totalPrevious > 0 ? {
          currentValue: totalCurrent,
          previousValue: totalPrevious,
          delta: totalCurrent - totalPrevious,
          percentage: ((totalCurrent - totalPrevious) / totalPrevious) * 100,
          type: totalCurrent < totalPrevious * 0.9 ? 'progress' : 
                totalCurrent > totalPrevious * 1.1 ? 'regression' : 'stable',
        } : null,
      });
    }
    
    // By Gravity
    const gravityLabels: Record<Gravity, string> = {
      'mortal': 'Mortal',
      'venial': 'Venial',
    };
    
    for (const gravity of sin.gravities) {
      const allGravEvents = allEnrichedEvents.filter(e => e.sin.gravities.includes(gravity));
      const prevGravEvents = previousAllEnrichedEvents.filter(e => e.sin.gravities.includes(gravity));
      const sinGravEvents = sinEvents.filter(e => e.sin.gravities.includes(gravity));
      
      const totalCurrent = allGravEvents.reduce((sum, e) => sum + e.score, 0);
      const totalPrevious = prevGravEvents.reduce((sum, e) => sum + e.score, 0);
      const itemCurrent = sinGravEvents.reduce((sum, e) => sum + e.score, 0);
      
      characteristics.push({
        name: `Gravedad: ${gravityLabels[gravity]}`,
        totalEvents: allGravEvents.length,
        itemEvents: sinGravEvents.length,
        itemPercentage: totalCurrent > 0 ? (itemCurrent / totalCurrent) * 100 : 0,
        variation: totalPrevious > 0 ? {
          currentValue: totalCurrent,
          previousValue: totalPrevious,
          delta: totalCurrent - totalPrevious,
          percentage: ((totalCurrent - totalPrevious) / totalPrevious) * 100,
          type: totalCurrent < totalPrevious * 0.9 ? 'progress' : 
                totalCurrent > totalPrevious * 1.1 ? 'regression' : 'stable',
        } : null,
      });
    }
    
    // By Person Type
    for (const ptId of sin.involvedPersonTypes) {
      const pt = personTypes.find(p => p.id === ptId);
      if (!pt) continue;
      
      const allPtEvents = allEnrichedEvents.filter(e => e.sin.involvedPersonTypes.includes(ptId));
      const prevPtEvents = previousAllEnrichedEvents.filter(e => e.sin.involvedPersonTypes.includes(ptId));
      const sinPtEvents = sinEvents.filter(e => e.sin.involvedPersonTypes.includes(ptId));
      
      const totalCurrent = allPtEvents.reduce((sum, e) => sum + e.score, 0);
      const totalPrevious = prevPtEvents.reduce((sum, e) => sum + e.score, 0);
      const itemCurrent = sinPtEvents.reduce((sum, e) => sum + e.score, 0);
      
      characteristics.push({
        name: `Prójimo: ${pt.name}`,
        totalEvents: allPtEvents.length,
        itemEvents: sinPtEvents.length,
        itemPercentage: totalCurrent > 0 ? (itemCurrent / totalCurrent) * 100 : 0,
        variation: totalPrevious > 0 ? {
          currentValue: totalCurrent,
          previousValue: totalPrevious,
          delta: totalCurrent - totalPrevious,
          percentage: ((totalCurrent - totalPrevious) / totalPrevious) * 100,
          type: totalCurrent < totalPrevious * 0.9 ? 'progress' : 
                totalCurrent > totalPrevious * 1.1 ? 'regression' : 'stable',
        } : null,
      });
    }
    
    // By Activity
    for (const actId of sin.associatedActivities) {
      const act = activities.find(a => a.id === actId);
      if (!act) continue;
      
      const allActEvents = allEnrichedEvents.filter(e => e.sin.associatedActivities.includes(actId));
      const prevActEvents = previousAllEnrichedEvents.filter(e => e.sin.associatedActivities.includes(actId));
      const sinActEvents = sinEvents.filter(e => e.sin.associatedActivities.includes(actId));
      
      const totalCurrent = allActEvents.reduce((sum, e) => sum + e.score, 0);
      const totalPrevious = prevActEvents.reduce((sum, e) => sum + e.score, 0);
      const itemCurrent = sinActEvents.reduce((sum, e) => sum + e.score, 0);
      
      characteristics.push({
        name: `Actividad: ${act.name}`,
        totalEvents: allActEvents.length,
        itemEvents: sinActEvents.length,
        itemPercentage: totalCurrent > 0 ? (itemCurrent / totalCurrent) * 100 : 0,
        variation: totalPrevious > 0 ? {
          currentValue: totalCurrent,
          previousValue: totalPrevious,
          delta: totalCurrent - totalPrevious,
          percentage: ((totalCurrent - totalPrevious) / totalPrevious) * 100,
          type: totalCurrent < totalPrevious * 0.9 ? 'progress' : 
                totalCurrent > totalPrevious * 1.1 ? 'regression' : 'stable',
        } : null,
      });
    }
    
    // By Capital Sin
    for (const capital of sin.capitalSins) {
      const allCapEvents = allEnrichedEvents.filter(e => e.sin.capitalSins.includes(capital));
      const prevCapEvents = previousAllEnrichedEvents.filter(e => e.sin.capitalSins.includes(capital));
      const sinCapEvents = sinEvents.filter(e => e.sin.capitalSins.includes(capital));
      
      const totalCurrent = allCapEvents.reduce((sum, e) => sum + e.score, 0);
      const totalPrevious = prevCapEvents.reduce((sum, e) => sum + e.score, 0);
      const itemCurrent = sinCapEvents.reduce((sum, e) => sum + e.score, 0);
      
      characteristics.push({
        name: `Pecado capital: ${capital}`,
        totalEvents: allCapEvents.length,
        itemEvents: sinCapEvents.length,
        itemPercentage: totalCurrent > 0 ? (itemCurrent / totalCurrent) * 100 : 0,
        variation: totalPrevious > 0 ? {
          currentValue: totalCurrent,
          previousValue: totalPrevious,
          delta: totalCurrent - totalPrevious,
          percentage: ((totalCurrent - totalPrevious) / totalPrevious) * 100,
          type: totalCurrent < totalPrevious * 0.9 ? 'progress' : 
                totalCurrent > totalPrevious * 1.1 ? 'regression' : 'stable',
        } : null,
      });
    }
    
    return {
      trajectory,
      characteristics,
      totalEvents: sinEvents.length,
      totalScore: sinEvents.reduce((sum, e) => sum + e.score, 0),
    };
  }, [sin, periodConfig, sins, personTypes, activities]);
  
  if (!sin) {
    return (
      <div className="min-h-screen bg-background">
        <IOSHeader title="No encontrado" onBack={() => navigate(-1)} />
        <div className="p-4 text-center text-muted-foreground">
          Pecado no encontrado
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background pb-8">
      <IOSHeader 
        title={sin.name} 
        subtitle="Métricas históricas"
        onBack={() => navigate("/obras/pecados")}
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
              <p className="text-ios-caption text-muted-foreground">Eventos en el periodo</p>
              <p className="text-ios-title2 font-semibold text-foreground">
                {metricsData?.totalEvents || 0}
              </p>
            </div>
            <div className="text-right">
              <p className="text-ios-caption text-muted-foreground">Score total</p>
              <p className="text-ios-title2 font-semibold text-foreground">
                {metricsData?.totalScore.toFixed(1) || '0.0'}
              </p>
            </div>
          </div>
        </section>
        
        {/* Trajectory Chart */}
        {metricsData?.trajectory && (
          <section>
            <TrajectoryChart 
              data={metricsData.trajectory} 
              title="Trayectoria histórica"
              showVariation={true}
            />
          </section>
        )}
        
        {/* Characteristics Table */}
        {metricsData && metricsData.characteristics.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-ios-headline text-foreground">Desglose por características</h2>
            
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
                    "grid grid-cols-12 gap-2 px-4 py-3 items-center",
                    index !== metricsData.characteristics.length - 1 && "border-b border-border/50"
                  )}
                >
                  <div className="col-span-5 text-ios-subhead text-foreground truncate">
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
          targetId={sin.id}
          targetType="sin"
          startDate={periodConfig.startDate}
          endDate={periodConfig.endDate}
          returnPath={`/obras/pecados/${sin.id}/detalle`}
        />
        
        {/* No data message */}
        {metricsData && metricsData.totalEvents === 0 && (
          <div className="text-center py-8">
            <p className="text-ios-body text-muted-foreground">
              No hay datos para este periodo
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
