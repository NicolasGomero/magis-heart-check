import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IOSHeader } from "@/components/IOSHeader";
import { PeriodSelector } from "@/components/metrics/PeriodSelector";
import { TrajectoryChart } from "@/components/metrics/TrajectoryChart";
import { VariationBadge } from "@/components/metrics/VariationBadge";
import { PeriodNotes } from "@/components/metrics/PeriodNotes";
import { getBuenaObra, getBuenasObras } from "@/lib/buenasObras.storage";
import { getPersonTypes, getActivities } from "@/lib/entities";
import { 
  getPeriodConfig, 
  type PeriodConfig,
  type VariationResult,
} from "@/lib/metricsCalculations";
import type { BuenaObra, BuenaObraTerm } from "@/lib/buenasObras.types";
import { cn } from "@/lib/utils";

interface CharacteristicData {
  name: string;
  totalEvents: number;
  itemEvents: number;
  itemPercentage: number;
  variation: VariationResult | null;
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
  
  // TODO: Implement actual metrics calculation when buenas obras events are tracked
  const metricsData = useMemo(() => {
    if (!buenaObra) return null;
    
    // Placeholder data until buenas obras tracking is implemented
    const characteristics: CharacteristicData[] = [];
    
    // By Term
    const termLabels: Record<BuenaObraTerm, string> = {
      'hacia_dios': 'Hacia Dios',
      'hacia_projimo': 'Hacia el Prójimo',
      'hacia_si_mismo': 'Hacia uno mismo',
    };
    
    for (const term of buenaObra.terms) {
      characteristics.push({
        name: `Término: ${termLabels[term]}`,
        totalEvents: 0,
        itemEvents: 0,
        itemPercentage: 0,
        variation: null,
      });
    }
    
    // By Person Type
    for (const ptId of buenaObra.involvedPersonTypes) {
      const pt = personTypes.find(p => p.id === ptId);
      if (!pt) continue;
      
      characteristics.push({
        name: `Prójimo: ${pt.name}`,
        totalEvents: 0,
        itemEvents: 0,
        itemPercentage: 0,
        variation: null,
      });
    }
    
    // By Activity
    for (const actId of buenaObra.associatedActivities) {
      const act = activities.find(a => a.id === actId);
      if (!act) continue;
      
      characteristics.push({
        name: `Actividad: ${act.name}`,
        totalEvents: 0,
        itemEvents: 0,
        itemPercentage: 0,
        variation: null,
      });
    }
    
    return {
      trajectory: null,
      characteristics,
      totalEvents: 0,
      totalScore: 0,
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
              <p className="text-ios-caption text-muted-foreground">Ejecuciones en el periodo</p>
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
        
        {/* Trajectory Chart - placeholder */}
        <section className="bg-card rounded-xl p-4 border border-border">
          <div className="text-center py-8">
            <p className="text-ios-body text-muted-foreground">
              El seguimiento de buenas obras estará disponible próximamente
            </p>
          </div>
        </section>
        
        {/* Characteristics Table */}
        {metricsData && metricsData.characteristics.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-ios-headline text-foreground">Características asociadas</h2>
            
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {metricsData.characteristics.map((char, index) => (
                <div 
                  key={index}
                  className={cn(
                    "px-4 py-3",
                    index !== metricsData.characteristics.length - 1 && "border-b border-border/50"
                  )}
                >
                  <p className="text-ios-body text-foreground">{char.name}</p>
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
