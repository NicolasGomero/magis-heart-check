import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Filter, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { MetricFilter } from '@/lib/metricsCalculations';
import { getFilterSections, FilterSection } from '@/lib/dimensions';

// Storage key for medios espirituales filter selection
const MEDIOS_FILTER_SELECTION_KEY = 'magis_medios_filter_selection';

interface FilterBuilderProps {
  value: MetricFilter;
  onChange: (filter: MetricFilter) => void;
}

export function FilterBuilder({ value, onChange }: FilterBuilderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  // Get filter sections from single source of truth
  const sections = getFilterSections();

  // Listen for medios espirituales selection from dedicated page
  useEffect(() => {
    const storedSelection = localStorage.getItem(MEDIOS_FILTER_SELECTION_KEY);
    if (storedSelection) {
      try {
        const parsed = JSON.parse(storedSelection);
        if (Array.isArray(parsed)) {
          onChange({
            ...value,
            spiritualMeans: parsed.length > 0 ? parsed : undefined,
          });
        }
      } catch (e) {
        // Ignore parse errors
      }
      localStorage.removeItem(MEDIOS_FILTER_SELECTION_KEY);
    }
  }, [location.pathname]);

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

  const handleVerMas = (section: FilterSection) => {
    // For medios espirituales, navigate to selection page
    if (section.key === 'spiritualMeans') {
      const currentSelection = (value.spiritualMeans as string[]) || [];
      // Store return path for filter context
      localStorage.setItem('magis_medios_return_path', location.pathname);
      navigate('/medios-espirituales', { 
        state: { 
          selected: currentSelection,
          returnPath: location.pathname,
          storageKey: MEDIOS_FILTER_SELECTION_KEY
        }
      });
    }
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
                  <div className="flex items-center justify-between">
                    <p className="text-ios-caption text-muted-foreground font-medium">
                      {section.label}
                    </p>
                    {section.hasVerMas && (
                      <button
                        onClick={() => handleVerMas(section)}
                        className="text-accent text-ios-caption flex items-center gap-1 py-1 px-2 active:opacity-70 transition-opacity"
                      >
                        Ver más
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
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
                    {/* Show selected values not in initial options (from "Ver más") */}
                    {section.hasVerMas && sectionValues
                      .filter(v => !section.options.find(o => o.value === v))
                      .map(v => (
                        <button
                          key={v}
                          onClick={() => toggleFilter(section.key, v)}
                          className="px-3 py-1.5 rounded-full text-sm bg-primary text-primary-foreground"
                        >
                          {v}
                        </button>
                      ))
                    }
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