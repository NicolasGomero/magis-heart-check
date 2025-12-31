import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { IOSHeader } from "./IOSHeader";
import { SinCard } from "./examination/SinCard";
import { AddFreeformSinSheet } from "./examination/AddFreeformSinSheet";
import { ResponsibilitySheet } from "./examination/ResponsibilitySheet";
import { DeleteSinDialog } from "./examination/DeleteSinDialog";
import { 
  createExamSession, 
  addSinEvent, 
  updateSinEvent,
  removeSinEvent,
  completeExamSession,
  addFreeformSin,
  getExamSession
} from "@/lib/examSessions";
import { getSins, deleteSin, createSin } from "@/lib/sins.storage";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Sin, Term } from "@/lib/sins.types";
import type { SinEvent } from "@/lib/types";

interface ExaminationFlowProps {
  personTypes: string[];
  activities: string[];
  sinsToShow: string[];
  onBack: () => void;
  onComplete: () => void;
}

// Priority order for terms (lower index = higher priority)
const TERM_PRIORITY: Term[] = ['contra_dios', 'contra_projimo', 'contra_si_mismo'];

const TERM_LABELS: Record<Term, { icon: string; label: string }> = {
  'contra_dios': { icon: '🙏', label: 'Contra Dios' },
  'contra_projimo': { icon: '👥', label: 'Contra el Prójimo' },
  'contra_si_mismo': { icon: '🪞', label: 'Contra uno mismo' },
};

// State for each sin's quick menu settings
interface SinState {
  attention: 'deliberado' | 'semideliberado';
  motive: 'fragilidad' | 'malicia' | 'ignorancia';
}

export function ExaminationFlow({ 
  personTypes, 
  activities, 
  sinsToShow, 
  onBack, 
  onComplete 
}: ExaminationFlowProps) {
  const navigate = useNavigate();
  const [allSins, setAllSins] = useState(() => getSins());
  
  // Filter and deduplicate sins - each sin appears only in its highest priority term
  const sinsByTerm = useMemo(() => {
    const sinsToDisplay = sinsToShow.length === 0 
      ? allSins 
      : allSins.filter(s => sinsToShow.includes(s.id));
    
    const grouped: Record<Term, Sin[]> = {
      'contra_dios': [],
      'contra_projimo': [],
      'contra_si_mismo': [],
    };
    
    const assignedSinIds = new Set<string>();
    
    // Process terms in priority order
    TERM_PRIORITY.forEach(term => {
      sinsToDisplay.forEach(sin => {
        if (assignedSinIds.has(sin.id)) return;
        if (sin.terms.includes(term)) {
          grouped[term].push(sin);
          assignedSinIds.add(sin.id);
        }
      });
    });
    
    return grouped;
  }, [allSins, sinsToShow]);
  
  // Session management
  const [sessionId] = useState<string>(() => {
    const session = createExamSession(personTypes, activities, sinsToShow);
    return session.id;
  });
  
  // Track events per sin (for count display)
  const [sinCounts, setSinCounts] = useState<Record<string, number>>({});
  
  // Track sin states (attention/motive settings)
  const [sinStates, setSinStates] = useState<Record<string, SinState>>({});
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [showFreeformSheet, setShowFreeformSheet] = useState(false);
  const [showResponsibilitySheet, setShowResponsibilitySheet] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; sin: Sin | null }>({ 
    open: false, 
    sin: null 
  });
  
  // Get current session events
  const getCurrentEvents = useCallback((): SinEvent[] => {
    const session = getExamSession(sessionId);
    return session?.events || [];
  }, [sessionId]);
  
  // Get sin state or defaults
  const getSinState = useCallback((sinId: string): SinState => {
    return sinStates[sinId] || { attention: 'deliberado', motive: 'fragilidad' };
  }, [sinStates]);
  
  // Handle tap on sin card (register event)
  const handleTap = useCallback((sinId: string) => {
    const state = getSinState(sinId);
    
    addSinEvent(sessionId, sinId, {
      attention: state.attention,
      motive: state.motive,
    });
    
    setSinCounts(prev => ({
      ...prev,
      [sinId]: (prev[sinId] || 0) + 1,
    }));
  }, [sessionId, getSinState]);
  
  // Update attention for a sin
  const handleAttentionChange = useCallback((sinId: string, attention: 'deliberado' | 'semideliberado') => {
    setSinStates(prev => ({
      ...prev,
      [sinId]: { ...getSinState(sinId), attention },
    }));
  }, [getSinState]);
  
  // Update motive for a sin
  const handleMotiveChange = useCallback((sinId: string, motive: 'fragilidad' | 'malicia' | 'ignorancia') => {
    setSinStates(prev => ({
      ...prev,
      [sinId]: { ...getSinState(sinId), motive },
    }));
  }, [getSinState]);
  
  // Handle edit navigation
  const handleEdit = useCallback((sinId: string) => {
    navigate(`/sins/${sinId}`);
  }, [navigate]);
  
  // Handle delete
  const handleDeleteConfirm = useCallback(() => {
    if (!deleteDialog.sin) return;
    
    const sinId = deleteDialog.sin.id;
    
    // Remove any events for this sin from the session
    const events = getCurrentEvents();
    events.filter(e => e.sinId === sinId).forEach(e => {
      removeSinEvent(sessionId, e.id);
    });
    
    // Delete from catalog
    deleteSin(sinId);
    
    // Update local state
    setAllSins(getSins());
    setSinCounts(prev => {
      const next = { ...prev };
      delete next[sinId];
      return next;
    });
    
    setDeleteDialog({ open: false, sin: null });
  }, [deleteDialog.sin, sessionId, getCurrentEvents]);
  
  // Handle freeform sin addition
  const handleAddFreeform = useCallback((text: string, term: Term, addToCatalog: boolean) => {
    // Add to session's freeform list
    const termMap: Record<Term, 'god' | 'neighbor' | 'self'> = {
      'contra_dios': 'god',
      'contra_projimo': 'neighbor',
      'contra_si_mismo': 'self',
    };
    addFreeformSin(sessionId, text, termMap[term]);
    
    // Optionally add to global catalog
    if (addToCatalog) {
      createSin({
        name: text,
        terms: [term],
      });
      setAllSins(getSins());
    }
  }, [sessionId]);
  
  // Handle responsibility update
  const handleUpdateResponsibility = useCallback((eventId: string, responsibility: 'formal' | 'material') => {
    updateSinEvent(sessionId, eventId, { responsibility });
  }, [sessionId]);
  
  // Handle save
  const handleSave = useCallback(() => {
    const events = getCurrentEvents();
    
    // If there are events, show responsibility review first
    if (events.length > 0 && !showResponsibilitySheet) {
      setShowResponsibilitySheet(true);
      return;
    }
    
    setIsSaving(true);
    completeExamSession(sessionId);
    
    setTimeout(() => {
      onComplete();
    }, 400);
  }, [sessionId, getCurrentEvents, showResponsibilitySheet, onComplete]);
  
  // Handle final confirm after responsibility review
  const handleConfirmSave = useCallback(() => {
    setShowResponsibilitySheet(false);
    setIsSaving(true);
    completeExamSession(sessionId);
    
    setTimeout(() => {
      onComplete();
    }, 400);
  }, [sessionId, onComplete]);
  
  const markedCount = Object.values(sinCounts).reduce((sum, c) => sum + c, 0);
  
  // Build subtitle showing context
  const contextParts: string[] = [];
  if (personTypes.length > 0) contextParts.push(`${personTypes.length} personas`);
  if (activities.length > 0) contextParts.push(`${activities.length} actividades`);
  const subtitle = contextParts.length > 0 ? contextParts.join(', ') : 'Examen completo';
  
  const hasSins = Object.values(sinsByTerm).some(arr => arr.length > 0);
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <IOSHeader
        title="Examen"
        subtitle={subtitle}
        onBack={onBack}
      />
      
      <div className="flex-1 px-4 py-4 space-y-6 animate-fade-in overflow-auto pb-32">
        <p className="text-ios-footnote text-muted-foreground text-center">
          Toca para marcar • Mantén presionado para opciones • Borde izquierdo para descripción
        </p>
        
        {!hasSins ? (
          <div className="text-center py-8">
            <p className="text-ios-body text-muted-foreground">
              No hay pecados configurados para este contexto
            </p>
            <p className="text-ios-caption text-muted-foreground/60 mt-2">
              Añade pecados desde el catálogo o usa el botón "+"
            </p>
          </div>
        ) : (
          TERM_PRIORITY.map(term => {
            const termSins = sinsByTerm[term];
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
                
                <div className="space-y-2">
                  {termSins.map((sin, index) => (
                    <div 
                      key={sin.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <SinCard
                        sin={sin}
                        count={sinCounts[sin.id] || 0}
                        attention={getSinState(sin.id).attention}
                        motive={getSinState(sin.id).motive}
                        onTap={() => handleTap(sin.id)}
                        onAttentionChange={(att) => handleAttentionChange(sin.id, att)}
                        onMotiveChange={(mot) => handleMotiveChange(sin.id, mot)}
                        onEdit={() => handleEdit(sin.id)}
                        onDelete={() => setDeleteDialog({ open: true, sin })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8 safe-bottom">
        <div className="flex gap-3">
          {/* Add freeform sin button */}
          <button
            onClick={() => setShowFreeformSheet(true)}
            className="p-4 rounded-xl bg-secondary text-secondary-foreground shadow-lg active:scale-[0.98] transition-transform"
          >
            <Plus className="w-5 h-5" />
          </button>
          
          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "flex-1 py-4 rounded-xl text-ios-headline font-semibold",
              "flex items-center justify-center gap-2",
              "transition-all duration-200 active:scale-[0.98] shadow-lg",
              isSaving 
                ? 'bg-state-peace text-primary-foreground' 
                : 'bg-primary text-primary-foreground'
            )}
          >
            {isSaving ? (
              <>
                <Check className="w-5 h-5 animate-scale-in" />
                Guardado
              </>
            ) : (
              <>
                Guardar y cerrar
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
      
      {/* Freeform sin sheet */}
      <AddFreeformSinSheet
        open={showFreeformSheet}
        onClose={() => setShowFreeformSheet(false)}
        onAdd={handleAddFreeform}
      />
      
      {/* Responsibility review sheet */}
      <ResponsibilitySheet
        open={showResponsibilitySheet}
        onClose={() => setShowResponsibilitySheet(false)}
        events={getCurrentEvents()}
        sins={allSins}
        onUpdateEvent={handleUpdateResponsibility}
        onConfirm={handleConfirmSave}
      />
      
      {/* Delete confirmation dialog */}
      <DeleteSinDialog
        open={deleteDialog.open}
        sinName={deleteDialog.sin?.name || ''}
        onClose={() => setDeleteDialog({ open: false, sin: null })}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
