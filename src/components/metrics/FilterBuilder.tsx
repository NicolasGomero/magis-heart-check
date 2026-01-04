import { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { 
  MetricFilter,
} from '@/lib/metricsCalculations';
import { 
  Term, 
  Gravity, 
  Manifestation, 
  Mode,
  TERM_LABELS,
  GRAVITY_LABELS,
  MANIFESTATION_LABELS,
  MODE_LABELS,
  DEFAULT_CAPITAL_SINS,
} from '@/lib/sins.types';
import { getSins } from '@/lib/sins.storage';
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

export function FilterBuilder({ value, onChange }: FilterBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const sins = getSins();
  const personTypes = getPersonTypes();
  const activities = getActivities();

  const sections: FilterSection[] = [
    {
      key: 'terms',
      label: 'Término',
      options: Object.entries(TERM_LABELS).map(([v, l]) => ({ value: v, label: l })),
    },
    {
      key: 'gravities',
      label: 'Gravedad',
      options: Object.entries(GRAVITY_LABELS).map(([v, l]) => ({ value: v, label: l })),
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
      key: 'capitalSins',
      label: 'Pecado capital',
      options: DEFAULT_CAPITAL_SINS.map(c => ({ value: c, label: c })),
    },
    {
      key: 'sinIds',
      label: 'Pecado específico',
      options: sins.map(s => ({ value: s.id, label: s.name })),
    },
    {
      key: 'personTypeIds',
      label: 'Prójimo implicado',
      options: personTypes.map(p => ({ value: p.id, label: p.name })),
    },
    {
      key: 'activityIds',
      label: 'Actividad',
      options: activities.map(a => ({ value: a.id, label: a.name })),
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
