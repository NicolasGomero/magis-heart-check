import { useState, useCallback, useMemo } from "react";
import { IOSHeader } from "./IOSHeader";
import { createExamSession, addSinEvent, completeExamSession } from "@/lib/examSessions";
import { getSins } from "@/lib/sins.storage";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExaminationFlowProps {
  personTypes: string[];
  activities: string[];
  sinsToShow: string[];
  onBack: () => void;
  onComplete: () => void;
}

const TERM_LABELS: Record<string, { icon: string; label: string }> = {
  'contra_dios': { icon: '🙏', label: 'Dios' },
  'contra_projimo': { icon: '👥', label: 'Prójimo' },
  'contra_si_mismo': { icon: '🪞', label: 'Yo mismo' },
};

export function ExaminationFlow({ 
  personTypes, 
  activities, 
  sinsToShow, 
  onBack, 
  onComplete 
}: ExaminationFlowProps) {
  const allSins = useMemo(() => getSins(), []);
  
  // Filter sins to show based on sinsToShow ids
  const sins = useMemo(() => {
    if (sinsToShow.length === 0) return allSins;
    return allSins.filter(s => sinsToShow.includes(s.id));
  }, [allSins, sinsToShow]);
  
  // Group sins by term (pillar)
  const sinsByTerm = useMemo(() => {
    const grouped: Record<string, typeof sins> = {
      'contra_dios': [],
      'contra_projimo': [],
      'contra_si_mismo': [],
    };
    
    sins.forEach(sin => {
      sin.terms.forEach(term => {
        if (grouped[term]) {
          grouped[term].push(sin);
        }
      });
    });
    
    return grouped;
  }, [sins]);
  
  const [markedSins, setMarkedSins] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [sessionId] = useState<string | null>(() => {
    // Create session immediately
    const session = createExamSession(personTypes, activities, sinsToShow);
    return session.id;
  });
  
  const toggleSin = useCallback((sinId: string) => {
    setMarkedSins(prev => {
      const next = new Set(prev);
      if (next.has(sinId)) {
        next.delete(sinId);
      } else {
        next.add(sinId);
      }
      return next;
    });
  }, []);
  
  const handleSave = useCallback(() => {
    if (!sessionId) return;
    
    setIsSaving(true);
    
    // Add events for all marked sins
    markedSins.forEach(sinId => {
      addSinEvent(sessionId, sinId);
    });
    
    // Complete the session
    completeExamSession(sessionId);
    
    // Brief delay for visual feedback
    setTimeout(() => {
      onComplete();
    }, 400);
  }, [sessionId, markedSins, onComplete]);
  
  const markedCount = markedSins.size;
  
  // Build subtitle showing context
  const contextParts: string[] = [];
  if (personTypes.length > 0) contextParts.push(`${personTypes.length} personas`);
  if (activities.length > 0) contextParts.push(`${activities.length} actividades`);
  const subtitle = contextParts.length > 0 ? contextParts.join(', ') : 'Examen completo';
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <IOSHeader
        title="Examen"
        subtitle={subtitle}
        onBack={onBack}
      />
      
      <div className="flex-1 px-4 py-4 space-y-6 animate-fade-in overflow-auto pb-28">
        <p className="text-ios-footnote text-muted-foreground text-center">
          Toca los que apliquen a esta última hora
        </p>
        
        {sins.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-ios-body text-muted-foreground">
              No hay pecados configurados para este contexto
            </p>
            <p className="text-ios-caption text-muted-foreground/60 mt-2">
              Añade pecados desde el catálogo
            </p>
          </div>
        ) : (
          Object.entries(sinsByTerm).map(([term, termSins]) => {
            if (termSins.length === 0) return null;
            const termInfo = TERM_LABELS[term];
            
            return (
              <div key={term} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-lg">{termInfo.icon}</span>
                  <h3 className="text-ios-subhead text-muted-foreground uppercase tracking-wide">
                    {termInfo.label}
                  </h3>
                </div>
                
                <div className="bg-card rounded-xl overflow-hidden card-elevated">
                  {termSins.map((sin, index) => (
                    <button
                      key={sin.id}
                      onClick={() => toggleSin(sin.id)}
                      className={cn(
                        "w-full text-left px-4 py-3 flex items-center justify-between",
                        "border-b border-border/50 last:border-b-0",
                        "transition-colors duration-150",
                        markedSins.has(sin.id) && "bg-destructive/10"
                      )}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-ios-body text-foreground block truncate">
                          {sin.name}
                        </span>
                        {sin.shortDescription && (
                          <span className="text-ios-caption text-muted-foreground block truncate">
                            {sin.shortDescription}
                          </span>
                        )}
                      </div>
                      {markedSins.has(sin.id) && (
                        <div className="w-6 h-6 rounded-full bg-destructive flex items-center justify-center ml-3 flex-shrink-0">
                          <Check className="w-4 h-4 text-destructive-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Save button - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8 safe-bottom">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "w-full py-4 rounded-xl text-ios-headline font-semibold",
            "flex items-center justify-center gap-2",
            "transition-all duration-200 active:scale-[0.98] shadow-lg",
            isSaving 
              ? 'bg-state-peace text-primary-foreground' 
              : 'bg-primary text-primary-foreground'
          )}
        >
          {isSaving ? (
            <>
              <Check className="w-5 h-5 animate-check-mark" />
              Guardado
            </>
          ) : (
            <>
              Guardar
              {markedCount > 0 && (
                <span className="bg-primary-foreground/20 px-2 py-0.5 rounded-full text-ios-caption">
                  {markedCount}
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
