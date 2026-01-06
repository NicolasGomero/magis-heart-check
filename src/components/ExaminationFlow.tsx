import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IOSHeader } from "./IOSHeader";
import { SinCard } from "./examination/SinCard";
import { AddFreeformSinSheet } from "./examination/AddFreeformSinSheet";
import { ResponsibilitySheet } from "./examination/ResponsibilitySheet";
import { createExamSession, addSinEvent, updateSinEvent, removeSinEvent, completeExamSession, addFreeformSin, getExamSession, getExamSessions, removeLastSinEventForSin, getEventCountForSin } from "@/lib/examSessions";
import { getSins, createSin } from "@/lib/sins.storage";
import { getPreferences } from "@/lib/preferences";
import { calculateCondicionantesFactor } from "@/lib/condicionantes";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Sin, Term, ResetCycle } from "@/lib/sins.types";
import type { SinEvent } from "@/lib/types";
import { toast } from "sonner";
interface ExaminationFlowProps {
  personTypes: string[];
  activities: string[];
  sinsToShow: string[];
  onBack: () => void;
  onComplete: () => void;
}

// Priority order for terms (lower index = higher priority)
const TERM_PRIORITY: Term[] = ['contra_dios', 'contra_projimo', 'contra_si_mismo'];
const TERM_LABELS: Record<Term, {
  icon: string;
  label: string;
}> = {
  'contra_dios': {
    icon: '🙏',
    label: 'Contra Dios'
  },
  'contra_projimo': {
    icon: '👥',
    label: 'Contra el Prójimo'
  },
  'contra_si_mismo': {
    icon: '🪞',
    label: 'Contra uno mismo'
  }
};

// State for each sin's quick menu settings
interface SinState {
  attention: 'deliberado' | 'semideliberado';
  motive: 'fragilidad' | 'malicia' | 'ignorancia';
}

// Calculate if a reset cycle has elapsed
function shouldResetCount(sin: Sin, lastEventTime: number | null): boolean {
  if (!lastEventTime) return false;
  if (sin.resetCycle === 'no') return false;
  const now = Date.now();
  const elapsed = now - lastEventTime;
  switch (sin.resetCycle) {
    case 'diario':
      // Check if we crossed midnight
      const lastDate = new Date(lastEventTime).toDateString();
      const nowDate = new Date(now).toDateString();
      return lastDate !== nowDate;
    case 'semanal':
      return elapsed >= 7 * 24 * 60 * 60 * 1000;
    case 'mensual':
      return elapsed >= 30 * 24 * 60 * 60 * 1000;
    case 'anual':
      return elapsed >= 365 * 24 * 60 * 60 * 1000;
    case 'personalizado':
      if (sin.customResetRule) {
        const {
          type,
          value
        } = sin.customResetRule;
        let thresholdMs = 0;
        switch (type) {
          case 'days':
            thresholdMs = value * 24 * 60 * 60 * 1000;
            break;
          case 'weeks':
            thresholdMs = value * 7 * 24 * 60 * 60 * 1000;
            break;
          case 'months':
            thresholdMs = value * 30 * 24 * 60 * 60 * 1000;
            break;
        }
        return elapsed >= thresholdMs;
      }
      return false;
    default:
      return false;
  }
}

// Get persisted count for a sin from all sessions
function getPersistedCount(sinId: string, sin: Sin): {
  count: number;
  lastEventTime: number | null;
} {
  const sessions = getExamSessions();
  let count = 0;
  let lastEventTime: number | null = null;

  // Gather all events for this sin from completed sessions
  for (const session of sessions) {
    if (!session.endedAt) continue; // Skip incomplete sessions

    for (const event of session.events) {
      if (event.sinId === sinId) {
        // Track the most recent event time
        if (!lastEventTime || event.timestamp > lastEventTime) {
          lastEventTime = event.timestamp;
        }
        count += event.countIncrement;
      }
    }
  }

  // Check if reset cycle has elapsed
  if (shouldResetCount(sin, lastEventTime)) {
    return {
      count: 0,
      lastEventTime: null
    };
  }
  return {
    count,
    lastEventTime
  };
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
    // Always filter by sinsToShow - an empty array means no sins match the filter
    const sinsToDisplay = allSins.filter(s => sinsToShow.includes(s.id));
    const grouped: Record<Term, Sin[]> = {
      'contra_dios': [],
      'contra_projimo': [],
      'contra_si_mismo': []
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

  // Verify session exists on mount
  useEffect(() => {
    const session = getExamSession(sessionId);
    if (!session) {
      console.error('[ExamFlow] Session not found in storage!');
      toast.error("Error: La sesión no se guardó correctamente");
    }
  }, [sessionId]);

  // Track events per sin (for count display) - initialize with persisted counts
  const [sinCounts, setSinCounts] = useState<Record<string, number>>(() => {
    const initialCounts: Record<string, number> = {};
    const sins = getSins();
    for (const sinId of sinsToShow) {
      const sin = sins.find(s => s.id === sinId);
      if (sin) {
        const {
          count
        } = getPersistedCount(sinId, sin);
        if (count > 0) {
          initialCounts[sinId] = count;
        }
      }
    }
    return initialCounts;
  });

  // Sync sinCounts when exam sessions are updated externally (e.g., historical discount)
  useEffect(() => {
    const handleSessionsUpdated = () => {
      const sins = getSins();
      const newCounts: Record<string, number> = {};
      
      // Recalculate using getPersistedCount (respects completed sessions + resetCycle)
      for (const sinId of sinsToShow) {
        const sin = sins.find(s => s.id === sinId);
        if (sin) {
          const { count } = getPersistedCount(sinId, sin);
          if (count > 0) {
            newCounts[sinId] = count;
          }
        }
      }
      
      // Add back current session counts (not yet completed)
      const currentSession = getExamSession(sessionId);
      if (currentSession) {
        for (const event of currentSession.events) {
          newCounts[event.sinId] = (newCounts[event.sinId] || 0) + 1;
        }
      }
      
      setSinCounts(newCounts);
    };

    window.addEventListener('exam-sessions-updated', handleSessionsUpdated);
    return () => {
      window.removeEventListener('exam-sessions-updated', handleSessionsUpdated);
    };
  }, [sinsToShow, sessionId]);

  // Track session-specific counts (for discount functionality)
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({});

  // Track sin states (attention/motive settings)
  const [sinStates, setSinStates] = useState<Record<string, SinState>>({});

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [showFreeformSheet, setShowFreeformSheet] = useState(false);
  const [showResponsibilitySheet, setShowResponsibilitySheet] = useState(false);

  // Get current session events
  const getCurrentEvents = useCallback((): SinEvent[] => {
    const session = getExamSession(sessionId);
    return session?.events || [];
  }, [sessionId]);

  // Get sin state or defaults
  const getSinState = useCallback((sinId: string): SinState => {
    return sinStates[sinId] || {
      attention: 'deliberado',
      motive: 'fragilidad'
    };
  }, [sinStates]);

  // Handle tap on sin card (register event)
  const handleTap = useCallback((sinId: string) => {
    const state = getSinState(sinId);
    const sin = allSins.find(s => s.id === sinId);

    // Calculate condicionantes factor at event time
    const prefs = getPreferences();
    const condicionantesResult = sin && sin.condicionantes?.length > 0 ? calculateCondicionantesFactor(prefs.subjectProfile.condicionantesActivos, sin.condicionantes, 'sin') : {
      appliedCondicionantes: [],
      k: 0,
      factor: 1.0
    };
    
    // Verify event was added successfully before updating counts
    const event = addSinEvent(sessionId, sinId, {
      attention: state.attention,
      motive: state.motive,
      appliedCondicionantes: condicionantesResult.appliedCondicionantes,
      condicionantesK: condicionantesResult.k,
      condicionantesFactor: condicionantesResult.factor
    });
    
    if (event) {
      setSinCounts(prev => ({
        ...prev,
        [sinId]: (prev[sinId] || 0) + 1
      }));
      setSessionCounts(prev => ({
        ...prev,
        [sinId]: (prev[sinId] || 0) + 1
      }));
    } else {
      toast.error("No se pudo registrar el evento");
    }
  }, [sessionId, getSinState, allSins]);

  // Handle discount (remove last event for this sin - prioritize current session, then historical)
  const handleDiscount = useCallback((sinId: string) => {
    const sessionCount = sessionCounts[sinId] || 0;

    // First, try to discount from current session
    if (sessionCount > 0) {
      const events = getCurrentEvents();
      const sinEvents = events.filter(e => e.sinId === sinId);
      if (sinEvents.length > 0) {
        const lastEvent = sinEvents[sinEvents.length - 1];
        
        // Verify event was removed successfully before updating counts
        const success = removeSinEvent(sessionId, lastEvent.id);
        
        if (success) {
          setSinCounts(prev => ({
            ...prev,
            [sinId]: Math.max(0, (prev[sinId] || 0) - 1)
          }));
          setSessionCounts(prev => ({
            ...prev,
            [sinId]: Math.max(0, (prev[sinId] || 0) - 1)
          }));
          toast.success("Marca descontada de esta sesión");
        } else {
          toast.error("No se pudo descontar la marca");
        }
        return;
      }
    }

    // If no events in current session, try to discount from historical data
    const totalCount = getEventCountForSin(sinId);
    if (totalCount === 0) {
      toast.info("No hay registros para descontar");
      return;
    }

    const success = removeLastSinEventForSin(sinId);
    if (success) {
      setSinCounts(prev => ({
        ...prev,
        [sinId]: Math.max(0, (prev[sinId] || 0) - 1)
      }));
      toast.success("Registro histórico descontado");
    } else {
      toast.error("No se pudo descontar el registro");
    }
  }, [sessionId, sessionCounts, getCurrentEvents]);

  // Update attention for a sin
  const handleAttentionChange = useCallback((sinId: string, attention: 'deliberado' | 'semideliberado') => {
    setSinStates(prev => ({
      ...prev,
      [sinId]: {
        ...getSinState(sinId),
        attention
      }
    }));
  }, [getSinState]);

  // Update motive for a sin
  const handleMotiveChange = useCallback((sinId: string, motive: 'fragilidad' | 'malicia' | 'ignorancia') => {
    setSinStates(prev => ({
      ...prev,
      [sinId]: {
        ...getSinState(sinId),
        motive
      }
    }));
  }, [getSinState]);

  // Handle edit navigation
  const handleEdit = useCallback((sinId: string) => {
    navigate(`/sins/${sinId}`);
  }, [navigate]);

  // Handle freeform sin addition
  const handleAddFreeform = useCallback((text: string, term: Term, addToCatalog: boolean) => {
    // Add to session's freeform list
    const termMap: Record<Term, 'god' | 'neighbor' | 'self'> = {
      'contra_dios': 'god',
      'contra_projimo': 'neighbor',
      'contra_si_mismo': 'self'
    };
    addFreeformSin(sessionId, text, termMap[term]);

    // Optionally add to global catalog
    if (addToCatalog) {
      createSin({
        name: text,
        terms: [term]
      });
      setAllSins(getSins());
    }
  }, [sessionId]);

  // Handle responsibility update
  const handleUpdateResponsibility = useCallback((eventId: string, responsibility: 'formal' | 'material') => {
    updateSinEvent(sessionId, eventId, {
      responsibility
    });
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
  const markedCount = Object.values(sessionCounts).reduce((sum, c) => sum + c, 0);

  // Build subtitle showing context
  const contextParts: string[] = [];
  if (personTypes.length > 0) contextParts.push(`${personTypes.length} personas`);
  if (activities.length > 0) contextParts.push(`${activities.length} actividades`);
  const subtitle = contextParts.length > 0 ? contextParts.join(', ') : 'Examen completo';
  const hasSins = Object.values(sinsByTerm).some(arr => arr.length > 0);
  return <div className="min-h-screen bg-background flex flex-col">
      <IOSHeader title="Examen" subtitle={subtitle} onBack={onBack} />
      
      <div className="flex-1 px-4 py-4 space-y-6 animate-fade-in overflow-auto pb-40">
        <p className="text-ios-footnote text-muted-foreground text-center">
          Toca para marcar • Mantén presionado para opciones • Borde izquierdo para descripción
        </p>
        
        {!hasSins ? <div className="text-center py-8">
            <p className="text-ios-body text-muted-foreground">
              No hay pecados configurados para este contexto
            </p>
            <p className="text-ios-caption text-muted-foreground/60 mt-2">
              Añade pecados desde el catálogo o usa el botón "+"
            </p>
          </div> : TERM_PRIORITY.map(term => {
        const termSins = sinsByTerm[term];
        if (termSins.length === 0) return null;
        const termInfo = TERM_LABELS[term];
        return <div key={term} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-lg">{termInfo.icon}</span>
                  <h3 className="text-ios-subhead text-muted-foreground uppercase tracking-wide">
                    {termInfo.label}
                  </h3>
                </div>
                
                <div className="space-y-2">
                  {termSins.map((sin, index) => <div key={sin.id} className="animate-fade-in" style={{
              animationDelay: `${index * 30}ms`
            }}>
                      <SinCard sin={sin} count={sinCounts[sin.id] || 0} attention={getSinState(sin.id).attention} motive={getSinState(sin.id).motive} onTap={() => handleTap(sin.id)} onDiscount={() => handleDiscount(sin.id)} onAttentionChange={att => handleAttentionChange(sin.id, att)} onMotiveChange={mot => handleMotiveChange(sin.id, mot)} onEdit={() => handleEdit(sin.id)} />
                    </div>)}
                </div>
              </div>;
      })}
      </div>
      
      {/* Bottom actions - increased bottom padding for safe area */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-background via-background to-transparent safe-bottom pt-0 mb-20">
        <div className="flex gap-3 mb-4">
          {/* Add freeform sin button */}
          <button onClick={() => setShowFreeformSheet(true)} className="p-4 rounded-xl bg-secondary text-secondary-foreground shadow-lg active:scale-[0.98] transition-transform">
            <Plus className="w-5 h-5" />
          </button>
          
          {/* Save button */}
          <button onClick={handleSave} disabled={isSaving} className={cn("flex-1 py-4 rounded-xl text-ios-headline font-semibold", "flex items-center justify-center gap-2", "transition-all duration-200 active:scale-[0.98] shadow-lg", isSaving ? 'bg-state-peace text-primary-foreground' : 'bg-primary text-primary-foreground')}>
            {isSaving ? <>
                <Check className="w-5 h-5 animate-scale-in" />
                Guardado
              </> : <>
                Guardar y cerrar
                {markedCount > 0 && <span className="bg-primary-foreground/20 px-2 py-0.5 rounded-full text-ios-caption">
                    {markedCount}
                  </span>}
              </>}
          </button>
        </div>
      </div>
      
      {/* Freeform sin sheet */}
      <AddFreeformSinSheet open={showFreeformSheet} onClose={() => setShowFreeformSheet(false)} onAdd={handleAddFreeform} />
      
      {/* Responsibility review sheet */}
      <ResponsibilitySheet open={showResponsibilitySheet} onClose={() => setShowResponsibilitySheet(false)} events={getCurrentEvents()} sins={allSins} onUpdateEvent={handleUpdateResponsibility} onConfirm={handleConfirmSave} />
    </div>;
}