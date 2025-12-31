import { useState, useEffect } from "react";
import { Check, Plus, ChevronRight, ChevronLeft } from "lucide-react";
import { getPersonTypes, getActivities, type PersonType, type Activity } from "@/lib/entities";
import { cn } from "@/lib/utils";

type Step = 'persons' | 'activities';

interface ContextSelectorProps {
  onGenerate: (personTypes: string[], activities: string[]) => void;
}

export function ContextSelector({ onGenerate }: ContextSelectorProps) {
  const [step, setStep] = useState<Step>('persons');
  const [personTypes, setPersonTypes] = useState<PersonType[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedPersonTypes, setSelectedPersonTypes] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  useEffect(() => {
    setPersonTypes(getPersonTypes());
    setActivities(getActivities());
  }, []);

  const togglePersonType = (id: string) => {
    setSelectedPersonTypes(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleActivity = (id: string) => {
    setSelectedActivities(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleGenerate = () => {
    onGenerate(selectedPersonTypes, selectedActivities);
  };

  const handleNext = () => {
    setStep('activities');
  };

  const handleBack = () => {
    setStep('persons');
  };

  const hasSelection = selectedPersonTypes.length > 0 || selectedActivities.length > 0;

  return (
    <div className="flex flex-col pb-24">
      {step === 'persons' && (
        <>
          {/* PersonTypes Section */}
          <div className="px-4 py-2">
            <p className="text-ios-footnote text-muted-foreground uppercase tracking-wide">
              ¿Con qué personas has interactuado?
            </p>
          </div>
          
          <div className="bg-card rounded-xl mx-4 overflow-hidden card-elevated mb-4">
            {personTypes.map((pt, index) => (
              <button
                key={pt.id}
                onClick={() => togglePersonType(pt.id)}
                className={cn(
                  "w-full text-left px-4 py-3 flex items-center justify-between",
                  "border-b border-border/50 last:border-b-0",
                  "transition-colors duration-150",
                  selectedPersonTypes.includes(pt.id) && "bg-primary/10"
                )}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <span className="text-ios-body text-foreground">{pt.name}</span>
                {selectedPersonTypes.includes(pt.id) && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </button>
            ))}
          </div>

          <p className="px-4 py-3 text-ios-caption text-muted-foreground text-center">
            {selectedPersonTypes.length > 0 
              ? `${selectedPersonTypes.length} persona${selectedPersonTypes.length > 1 ? 's' : ''} seleccionada${selectedPersonTypes.length > 1 ? 's' : ''}`
              : "Sin selección = todas las personas"
            }
          </p>

          {/* Next Button */}
          <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent pt-8 safe-bottom z-10">
            <button
              onClick={handleNext}
              className="w-full py-4 rounded-xl text-ios-headline font-semibold bg-primary text-primary-foreground flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] shadow-lg"
            >
              Siguiente
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </>
      )}

      {step === 'activities' && (
        <>
          {/* Back link */}
          <button
            onClick={handleBack}
            className="flex items-center gap-1 px-4 py-2 text-primary active:opacity-70 transition-opacity self-start"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-ios-body">Personas</span>
          </button>

          {/* Activities Section */}
          <div className="px-4 py-2">
            <p className="text-ios-footnote text-muted-foreground uppercase tracking-wide">
              ¿Qué actividades has realizado?
            </p>
          </div>
          
          <div className="bg-card rounded-xl mx-4 overflow-hidden card-elevated">
            {activities.map((activity, index) => (
              <button
                key={activity.id}
                onClick={() => toggleActivity(activity.id)}
                className={cn(
                  "w-full text-left px-4 py-3 flex items-center justify-between",
                  "border-b border-border/50 last:border-b-0",
                  "transition-colors duration-150",
                  selectedActivities.includes(activity.id) && "bg-primary/10"
                )}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <span className="text-ios-body text-foreground">{activity.name}</span>
                {selectedActivities.includes(activity.id) && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </button>
            ))}
          </div>

          <p className="px-4 py-3 text-ios-caption text-muted-foreground text-center">
            {hasSelection 
              ? `${selectedPersonTypes.length} persona${selectedPersonTypes.length !== 1 ? 's' : ''}, ${selectedActivities.length} actividad${selectedActivities.length !== 1 ? 'es' : ''}`
              : "Sin selección = examen completo"
            }
          </p>

          {/* Generate Button */}
          <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent pt-8 safe-bottom z-10">
            <button
              onClick={handleGenerate}
              className="w-full py-4 rounded-xl text-ios-headline font-semibold bg-primary text-primary-foreground flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] shadow-lg"
            >
              <Plus className="w-5 h-5" />
              {hasSelection ? "Generar examen" : "Examen completo"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
