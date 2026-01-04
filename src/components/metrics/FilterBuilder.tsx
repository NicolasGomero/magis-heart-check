import { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { MetricFilter } from '@/lib/metricsCalculations';
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
  DEFAULT_CAPITAL_SINS,
  VIRTUES_TEOLOGALES,
  VIRTUES_CARDINALES,
  VIRTUES_ANEXAS_INICIAL,
  DEFAULT_VOWS,
  DEFAULT_SPIRITUAL_MEANS,
  DEFAULT_CONDICIONANTES,
} from '@/lib/sins.types';
import { 
  PurityOfIntention, 
  CharityLevel, 
  Quality, 
  Circunstancias,
  PURITY_LABELS,
  CHARITY_LABELS,
  QUALITY_LABELS,
  CIRCUNSTANCIAS_LABELS,
} from '@/lib/buenasObras.types';
import { getPersonTypes, getActivities } from '@/lib/entities';

interface FilterBuilderProps {
  value: MetricFilter;
  onChange: (filter: MetricFilter) => void;
}

interface FilterSection {
  key: keyof MetricFilter;
  label: string;
  options: { value: string; label: string }[];
}

const ATTENTION_LABELS: Record<string, string> = {
  deliberado: 'Deliberado',
  semideliberado: 'Semideliberado',
};

const MOTIVE_LABELS: Record<string, string> = {
  fragilidad: 'Fragilidad',
  malicia: 'Malicia',
  ignorancia: 'Ignorancia',
};

export function FilterBuilder({ value, onChange }: FilterBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const personTypes = getPersonTypes();
  const activities = getActivities();

  // Dimensions in specified order (excluding "Pecado específico" from filters)
  const sections: FilterSection[] = [
    {
      key: 'terms',
      label: 'Término',
      options: Object.entries(TERM_LABELS).map(([v, l]) => ({ value: v, label: l })),
    },
    {
      key: 'personTypeIds',
      label: 'Prójimo implicado',
      options: personTypes.map(p => ({ value: p.id, label: p.name })),
    },
    {
      key: 'gravities',
      label: 'Gravedad',
      options: Object.entries(GRAVITY_LABELS).map(([v, l]) => ({ value: v, label: l })),
    },
    {
      key: 'capitalSins',
      label: 'Pecado capital',
      options: DEFAULT_CAPITAL_SINS.map(c => ({ value: c, label: c })),
    },
    {
      key: 'virtudesTeologales',
      label: 'Virtud teologal',
      options: VIRTUES_TEOLOGALES.map(v => ({ value: v, label: v })),
    },
    {
      key: 'virtudesCardinales',
      label: 'Virtud moral cardinal',
      options: VIRTUES_CARDINALES.map(v => ({ value: v, label: v })),
    },
    {
      key: 'virtudesAnexas',
      label: 'Virtud moral anexa',
      options: VIRTUES_ANEXAS_INICIAL.map(v => ({ value: v, label: v })),
    },
    {
      key: 'vows',
      label: 'Voto',
      options: DEFAULT_VOWS.map(v => ({ value: v, label: v })),
    },
    {
      key: 'activityIds',
      label: 'Actividad',
      options: activities.map(a => ({ value: a.id, label: a.name })),
    },
    {
      key: 'attentions',
      label: 'Atención',
      options: Object.entries(ATTENTION_LABELS).map(([v, l]) => ({ value: v, label: l })),
    },
    {
      key: 'motives',
      label: 'Motivo',
      options: Object.entries(MOTIVE_LABELS).map(([v, l]) => ({ value: v, label: l })),
    },
    {
      key: 'materiaTipos',
      label: 'Tipo de materia',
      options: Object.entries(MATERIA_TIPO_LABELS).map(([v, l]) => ({ value: v, label: l })),
    },
    {
      key: 'purityOfIntentions',
      label: 'Intención de la buena obra',
      options: Object.entries(PURITY_LABELS).map(([v, l]) => ({ value: v, label: l })),
    },
    {
      key: 'manifestations',
      label: 'Manifestación',
      options: Object.entries(MANIFESTATION_LABELS).map(([v, l]) => ({ value: v, label: l })),
    },
    {
      key: 'modes',
      label: 'Modo',
      options: Object.entries(MODE_LABELS).map(([v, l]) => ({ value: v, label: l })),
    },
    {
      key: 'charityLevels',
      label: 'Caridad',
      options: Object.entries(CHARITY_LABELS).map(([v, l]) => ({ value: v, label: l })),
    },
    {
      key: 'qualities',
      label: 'Calidad de la obra',
      options: Object.entries(QUALITY_LABELS).map(([v, l]) => ({ value: v, label: l })),
    },
    {
      key: 'circunstancias',
      label: 'Circunstancias de la buena obra',
      options: Object.entries(CIRCUNSTANCIAS_LABELS).map(([v, l]) => ({ value: v, label: l })),
    },
    {
      key: 'condicionantes',
      label: 'Condicionantes',
      options: DEFAULT_CONDICIONANTES.map(c => ({ value: c, label: c })),
    },
    {
      key: 'spiritualMeans',
      label: 'Medios espirituales',
      options: DEFAULT_SPIRITUAL_MEANS.map(m => ({ value: m, label: m })),
    },
  ];

  const activeFilterCount = Object.values(value).filter(v => v?.length).length;

  const toggleFilter = (key: keyof MetricFilter, optionValue: string) => {
    const current = (value[key] as string[] | undefined) || [];
    const updated = current.includes(optionValue)
      ? current.filter(v => v !== optionValue)
      : [...current, optionValue];
    
    onChange({
      ...value,
      [key]: updated.length > 0 ? updated : undefined,
    });
  };

  const clearFilters = () => {
    onChange({});
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-ios-body font-medium text-foreground">
                Filtros combinables
              </span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )} />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            {activeFilterCount > 0 && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpiar filtros
                </Button>
              </div>
            )}

            {sections.map(section => {
              if (section.options.length === 0) return null;
              const sectionValues = (value[section.key] as string[] | undefined) || [];
              
              return (
                <div key={section.key} className="space-y-2">
                  <p className="text-ios-caption text-muted-foreground font-medium">
                    {section.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {section.options.map(option => {
                      const isSelected = sectionValues.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          onClick={() => toggleFilter(section.key, option.value)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm transition-colors",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/50 text-foreground hover:bg-muted"
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <p className="text-ios-caption text-muted-foreground pt-2 border-t border-border">
              Los filtros se combinan con lógica AND: se mostrarán eventos que cumplan todos los filtros seleccionados.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
