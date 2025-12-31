import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrajectoryChart } from './TrajectoryChart';
import { TrajectoryData } from '@/lib/metricsCalculations';
import { 
  Term, 
  Gravity, 
  Manifestation, 
  Mode,
  TERM_LABELS,
  GRAVITY_LABELS,
  MANIFESTATION_LABELS,
  MODE_LABELS,
} from '@/lib/sins.types';
import { getSins } from '@/lib/sins.storage';
import { getPersonTypes, getActivities } from '@/lib/entities';

interface DimensionTabsProps {
  bySin: Map<string, TrajectoryData>;
  byTerm: Map<Term, TrajectoryData>;
  byPersonType: Map<string, TrajectoryData>;
  byActivity: Map<string, TrajectoryData>;
  byCapitalSin: Map<string, TrajectoryData>;
  byGravity: Map<Gravity, TrajectoryData>;
  byManifestation: Map<Manifestation, TrajectoryData>;
  byMode: Map<Mode, TrajectoryData>;
}

const DIMENSION_COLORS: Record<string, string> = {
  contra_dios: 'hsl(280, 70%, 50%)',
  contra_projimo: 'hsl(200, 70%, 50%)',
  contra_si_mismo: 'hsl(160, 70%, 50%)',
  mortal: 'hsl(0, 70%, 50%)',
  venial: 'hsl(45, 70%, 50%)',
  externo: 'hsl(340, 70%, 50%)',
  interno: 'hsl(180, 70%, 50%)',
  comision: 'hsl(30, 70%, 50%)',
  omision: 'hsl(220, 70%, 50%)',
};

export function DimensionTabs({
  bySin,
  byTerm,
  byPersonType,
  byActivity,
  byCapitalSin,
  byGravity,
  byManifestation,
  byMode,
}: DimensionTabsProps) {
  const sins = getSins();
  const personTypes = getPersonTypes();
  const activities = getActivities();

  const getSinName = (id: string) => sins.find(s => s.id === id)?.name || id;
  const getPersonTypeName = (id: string) => personTypes.find(p => p.id === id)?.name || id;
  const getActivityName = (id: string) => activities.find(a => a.id === id)?.name || id;

  return (
    <Tabs defaultValue="term" className="w-full">
      <TabsList className="w-full flex overflow-x-auto no-scrollbar bg-muted/50">
        <TabsTrigger value="term" className="flex-1 min-w-fit">Término</TabsTrigger>
        <TabsTrigger value="gravity" className="flex-1 min-w-fit">Gravedad</TabsTrigger>
        <TabsTrigger value="sin" className="flex-1 min-w-fit">Pecado</TabsTrigger>
        <TabsTrigger value="person" className="flex-1 min-w-fit">Persona</TabsTrigger>
        <TabsTrigger value="activity" className="flex-1 min-w-fit">Actividad</TabsTrigger>
        <TabsTrigger value="more" className="flex-1 min-w-fit">Más</TabsTrigger>
      </TabsList>

      <TabsContent value="term" className="space-y-3 mt-4">
        {Array.from(byTerm.entries()).map(([term, data]) => (
          <TrajectoryChart
            key={term}
            data={data}
            title={TERM_LABELS[term]}
            color={DIMENSION_COLORS[term]}
          />
        ))}
        {byTerm.size === 0 && (
          <p className="text-ios-body text-muted-foreground text-center py-8">
            No hay datos para mostrar
          </p>
        )}
      </TabsContent>

      <TabsContent value="gravity" className="space-y-3 mt-4">
        {Array.from(byGravity.entries()).map(([gravity, data]) => (
          <TrajectoryChart
            key={gravity}
            data={data}
            title={GRAVITY_LABELS[gravity]}
            color={DIMENSION_COLORS[gravity]}
          />
        ))}
      </TabsContent>

      <TabsContent value="sin" className="space-y-3 mt-4">
        {Array.from(bySin.entries())
          .sort((a, b) => b[1].totalScore - a[1].totalScore)
          .slice(0, 10)
          .map(([sinId, data]) => (
            <TrajectoryChart
              key={sinId}
              data={data}
              title={getSinName(sinId)}
            />
          ))}
        {bySin.size === 0 && (
          <p className="text-ios-body text-muted-foreground text-center py-8">
            No hay datos para mostrar
          </p>
        )}
        {bySin.size > 10 && (
          <p className="text-ios-caption text-muted-foreground text-center">
            Mostrando los 10 con mayor score
          </p>
        )}
      </TabsContent>

      <TabsContent value="person" className="space-y-3 mt-4">
        {Array.from(byPersonType.entries()).map(([ptId, data]) => (
          <TrajectoryChart
            key={ptId}
            data={data}
            title={getPersonTypeName(ptId)}
          />
        ))}
        {byPersonType.size === 0 && (
          <p className="text-ios-body text-muted-foreground text-center py-8">
            No hay datos para mostrar
          </p>
        )}
      </TabsContent>

      <TabsContent value="activity" className="space-y-3 mt-4">
        {Array.from(byActivity.entries()).map(([actId, data]) => (
          <TrajectoryChart
            key={actId}
            data={data}
            title={getActivityName(actId)}
          />
        ))}
        {byActivity.size === 0 && (
          <p className="text-ios-body text-muted-foreground text-center py-8">
            No hay datos para mostrar
          </p>
        )}
      </TabsContent>

      <TabsContent value="more" className="space-y-6 mt-4">
        {/* Capital sins */}
        {byCapitalSin.size > 0 && (
          <div className="space-y-3">
            <h4 className="text-ios-subhead font-medium text-foreground">Pecados capitales</h4>
            {Array.from(byCapitalSin.entries()).map(([capital, data]) => (
              <TrajectoryChart
                key={capital}
                data={data}
                title={capital}
                color="hsl(0, 60%, 50%)"
              />
            ))}
          </div>
        )}

        {/* Manifestation */}
        <div className="space-y-3">
          <h4 className="text-ios-subhead font-medium text-foreground">Manifestación</h4>
          {Array.from(byManifestation.entries()).map(([manif, data]) => (
            <TrajectoryChart
              key={manif}
              data={data}
              title={MANIFESTATION_LABELS[manif]}
              color={DIMENSION_COLORS[manif]}
            />
          ))}
        </div>

        {/* Mode */}
        <div className="space-y-3">
          <h4 className="text-ios-subhead font-medium text-foreground">Modo</h4>
          {Array.from(byMode.entries()).map(([mode, data]) => (
            <TrajectoryChart
              key={mode}
              data={data}
              title={MODE_LABELS[mode]}
              color={DIMENSION_COLORS[mode]}
            />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
