import { useState } from 'react';

import { TrajectoryChart } from './TrajectoryChart';
import { MetricsResult, TrajectoryData } from '@/lib/metricsCalculations';
import { 
  Term, 
  Gravity, 
  Manifestation, 
  Mode,
  MateriaTipo,
  TERM_LABELS,
  GRAVITY_LABELS,
  MANIFESTATION_LABELS,
  MODE_LABELS,
  MATERIA_TIPO_LABELS,
} from '@/lib/sins.types';
import { getSins } from '@/lib/sins.storage';
import { getBuenasObras } from '@/lib/buenasObras.storage';
import { getPersonTypes, getActivities } from '@/lib/entities';
import { ChevronDown, ChevronUp, Percent } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { DIMENSION_ORDER, DIMENSION_LABELS, ATTENTION_LABELS, MOTIVE_LABELS, formatPercentage } from '@/lib/dimensions';

interface DimensionTabsProps {
  metrics: MetricsResult;
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
  deliberado: 'hsl(0, 60%, 50%)',
  semideliberado: 'hsl(45, 60%, 50%)',
  fragilidad: 'hsl(200, 60%, 50%)',
  malicia: 'hsl(0, 70%, 45%)',
  ignorancia: 'hsl(45, 70%, 45%)',
};

function ContributionBadge({ percent }: { percent?: number }) {
  if (percent === undefined) return null;
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
      <Percent className="h-3 w-3" />
      <span>{formatPercentage(percent)}</span>
    </div>
  );
}

function DimensionSection({ 
  title, 
  children, 
  defaultOpen = false 
}: { 
  title: string; 
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between py-2 px-1 hover:bg-muted/30 rounded-lg transition-colors">
        <h4 className="text-ios-subhead font-medium text-foreground">{title}</h4>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function DimensionTabs({ metrics }: DimensionTabsProps) {
  const sins = getSins();
  const buenasObras = getBuenasObras();
  const personTypes = getPersonTypes();
  const activities = getActivities();

  const getSinName = (id: string) => sins.find(s => s.id === id)?.name || id;
  const getBuenaObraName = (id: string) => buenasObras.find(b => b.id === id)?.name || id;
  const getPersonTypeName = (id: string) => personTypes.find(p => p.id === id)?.name || id;
  const getActivityName = (id: string) => activities.find(a => a.id === id)?.name || id;

  return (
    <div className="w-full space-y-4">
        {/* Término */}
        <DimensionSection title={DIMENSION_LABELS.term} defaultOpen>
          {Array.from(metrics.byTerm.entries()).map(([term, data]) => (
            <div key={term} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-ios-caption text-muted-foreground">{TERM_LABELS[term]}</span>
                <ContributionBadge percent={data.contributionPercent} />
              </div>
              <TrajectoryChart data={data} title={TERM_LABELS[term]} color={DIMENSION_COLORS[term]} showTitle={false} />
            </div>
          ))}
          {metrics.byTerm.size === 0 && <p className="text-ios-caption text-muted-foreground">Sin datos</p>}
        </DimensionSection>

        {/* Prójimo implicado */}
        <DimensionSection title={DIMENSION_LABELS.personType}>
          {Array.from(metrics.byPersonType.entries()).map(([ptId, data]) => (
            <div key={ptId} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-ios-caption text-muted-foreground">{getPersonTypeName(ptId)}</span>
                <ContributionBadge percent={data.contributionPercent} />
              </div>
              <TrajectoryChart data={data} title={getPersonTypeName(ptId)} showTitle={false} />
            </div>
          ))}
          {metrics.byPersonType.size === 0 && <p className="text-ios-caption text-muted-foreground">Sin datos</p>}
        </DimensionSection>

        {/* Gravedad */}
        <DimensionSection title={DIMENSION_LABELS.gravity}>
          {Array.from(metrics.byGravity.entries()).map(([gravity, data]) => (
            <div key={gravity} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-ios-caption text-muted-foreground">{GRAVITY_LABELS[gravity]}</span>
                <ContributionBadge percent={data.contributionPercent} />
              </div>
              <TrajectoryChart data={data} title={GRAVITY_LABELS[gravity]} color={DIMENSION_COLORS[gravity]} showTitle={false} />
            </div>
          ))}
        </DimensionSection>

        {/* Pecado capital */}
        {metrics.byCapitalSin.size > 0 && (
          <DimensionSection title={DIMENSION_LABELS.capitalSin}>
            {Array.from(metrics.byCapitalSin.entries()).map(([capital, data]) => (
              <div key={capital} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-ios-caption text-muted-foreground">{capital}</span>
                  <ContributionBadge percent={data.contributionPercent} />
                </div>
                <TrajectoryChart data={data} title={capital} color="hsl(0, 60%, 50%)" showTitle={false} />
              </div>
            ))}
          </DimensionSection>
        )}

        {/* Virtud teologal */}
        {metrics.byVirtudeTeologal.size > 0 && (
          <DimensionSection title={DIMENSION_LABELS.virtudeTeologal}>
            {Array.from(metrics.byVirtudeTeologal.entries()).map(([virtue, data]) => (
              <div key={virtue} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-ios-caption text-muted-foreground">{virtue}</span>
                  <ContributionBadge percent={data.contributionPercent} />
                </div>
                <TrajectoryChart data={data} title={virtue} showTitle={false} />
              </div>
            ))}
          </DimensionSection>
        )}

        {/* Virtud moral cardinal */}
        {metrics.byVirtudeCardinal.size > 0 && (
          <DimensionSection title={DIMENSION_LABELS.virtudeCardinal}>
            {Array.from(metrics.byVirtudeCardinal.entries()).map(([virtue, data]) => (
              <div key={virtue} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-ios-caption text-muted-foreground">{virtue}</span>
                  <ContributionBadge percent={data.contributionPercent} />
                </div>
                <TrajectoryChart data={data} title={virtue} showTitle={false} />
              </div>
            ))}
          </DimensionSection>
        )}

        {/* Virtud moral anexa (principales) */}
        {metrics.byVirtudeAnexa.size > 0 && (
          <DimensionSection title={DIMENSION_LABELS.virtudeAnexa}>
            {Array.from(metrics.byVirtudeAnexa.entries()).map(([virtue, data]) => (
              <div key={virtue} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-ios-caption text-muted-foreground">{virtue}</span>
                  <ContributionBadge percent={data.contributionPercent} />
                </div>
                <TrajectoryChart data={data} title={virtue} showTitle={false} />
              </div>
            ))}
          </DimensionSection>
        )}

        {/* Voto */}
        {metrics.byVow.size > 0 && (
          <DimensionSection title={DIMENSION_LABELS.vow}>
            {Array.from(metrics.byVow.entries()).map(([vow, data]) => (
              <div key={vow} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-ios-caption text-muted-foreground">{vow}</span>
                  <ContributionBadge percent={data.contributionPercent} />
                </div>
                <TrajectoryChart data={data} title={vow} showTitle={false} />
              </div>
            ))}
          </DimensionSection>
        )}

        {/* Actividad */}
        <DimensionSection title={DIMENSION_LABELS.activity}>
          {Array.from(metrics.byActivity.entries()).map(([actId, data]) => (
            <div key={actId} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-ios-caption text-muted-foreground">{getActivityName(actId)}</span>
                <ContributionBadge percent={data.contributionPercent} />
              </div>
              <TrajectoryChart data={data} title={getActivityName(actId)} showTitle={false} />
            </div>
          ))}
          {metrics.byActivity.size === 0 && <p className="text-ios-caption text-muted-foreground">Sin datos</p>}
        </DimensionSection>

        {/* Atención */}
        <DimensionSection title={DIMENSION_LABELS.attention}>
          {Array.from(metrics.byAttention.entries()).map(([attention, data]) => (
            <div key={attention} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-ios-caption text-muted-foreground">{ATTENTION_LABELS[attention]}</span>
                <ContributionBadge percent={data.contributionPercent} />
              </div>
              <TrajectoryChart data={data} title={ATTENTION_LABELS[attention]} color={DIMENSION_COLORS[attention]} showTitle={false} />
            </div>
          ))}
        </DimensionSection>

        {/* Motivo */}
        <DimensionSection title={DIMENSION_LABELS.motive}>
          {Array.from(metrics.byMotive.entries()).map(([motive, data]) => (
            <div key={motive} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-ios-caption text-muted-foreground">{MOTIVE_LABELS[motive]}</span>
                <ContributionBadge percent={data.contributionPercent} />
              </div>
              <TrajectoryChart data={data} title={MOTIVE_LABELS[motive]} color={DIMENSION_COLORS[motive]} showTitle={false} />
            </div>
          ))}
        </DimensionSection>

        {/* Tipo de materia */}
        <DimensionSection title={DIMENSION_LABELS.materiaTipo}>
          {Array.from(metrics.byMateriaTipo.entries()).map(([mt, data]) => (
            <div key={mt} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-ios-caption text-muted-foreground">{MATERIA_TIPO_LABELS[mt]}</span>
                <ContributionBadge percent={data.contributionPercent} />
              </div>
              <TrajectoryChart data={data} title={MATERIA_TIPO_LABELS[mt]} showTitle={false} />
            </div>
          ))}
        </DimensionSection>

        {/* Manifestación */}
        <DimensionSection title={DIMENSION_LABELS.manifestation}>
          {Array.from(metrics.byManifestation.entries()).map(([manif, data]) => (
            <div key={manif} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-ios-caption text-muted-foreground">{MANIFESTATION_LABELS[manif]}</span>
                <ContributionBadge percent={data.contributionPercent} />
              </div>
              <TrajectoryChart data={data} title={MANIFESTATION_LABELS[manif]} color={DIMENSION_COLORS[manif]} showTitle={false} />
            </div>
          ))}
        </DimensionSection>

        {/* Modo */}
        <DimensionSection title={DIMENSION_LABELS.mode}>
          {Array.from(metrics.byMode.entries()).map(([mode, data]) => (
            <div key={mode} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-ios-caption text-muted-foreground">{MODE_LABELS[mode]}</span>
                <ContributionBadge percent={data.contributionPercent} />
              </div>
              <TrajectoryChart data={data} title={MODE_LABELS[mode]} color={DIMENSION_COLORS[mode]} showTitle={false} />
            </div>
          ))}
        </DimensionSection>

        {/* Condicionantes */}
        {metrics.byCondicionante.size > 0 && (
          <DimensionSection title={DIMENSION_LABELS.condicionante}>
            {Array.from(metrics.byCondicionante.entries()).map(([cond, data]) => (
              <div key={cond} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-ios-caption text-muted-foreground">{cond}</span>
                  <ContributionBadge percent={data.contributionPercent} />
                </div>
                <TrajectoryChart data={data} title={cond} showTitle={false} />
              </div>
            ))}
          </DimensionSection>
        )}

        {/* Medios espirituales */}
        {metrics.bySpiritualMean.size > 0 && (
          <DimensionSection title={DIMENSION_LABELS.spiritualMean}>
            {Array.from(metrics.bySpiritualMean.entries()).map(([mean, data]) => (
              <div key={mean} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-ios-caption text-muted-foreground">{mean}</span>
                  <ContributionBadge percent={data.contributionPercent} />
                </div>
                <TrajectoryChart data={data} title={mean} showTitle={false} />
              </div>
            ))}
          </DimensionSection>
        )}
    </div>
  );
}
