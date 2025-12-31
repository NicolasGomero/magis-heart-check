import { useMemo } from "react";
import { IOSHeader } from "@/components/IOSHeader";
import { getExamSessions } from "@/lib/examSessions";
import type { ExamSession } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PeriodStats {
  totalExams: number;
  totalEvents: number;
  averagePerDay: number;
}

function calculateStats(sessions: ExamSession[], days: number): PeriodStats {
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  
  const filtered = sessions.filter(s => s.startedAt >= cutoff);
  
  let totalEvents = 0;
  filtered.forEach(session => {
    session.events.forEach(event => {
      totalEvents += event.countIncrement;
    });
  });
  
  return {
    totalExams: filtered.length,
    totalEvents,
    averagePerDay: filtered.length / days,
  };
}

function getStateLabel(examCount: number): { text: string; color: string } {
  if (examCount >= 7) return { text: 'Constante', color: 'text-state-peace' };
  if (examCount >= 4) return { text: 'En camino', color: 'text-state-attention' };
  if (examCount >= 1) return { text: 'Iniciando', color: 'text-foreground' };
  return { text: 'Sin exámenes', color: 'text-muted-foreground' };
}

export function MetricsPage() {
  const sessions = getExamSessions();
  
  const weekStats = useMemo(() => calculateStats(sessions, 7), [sessions]);
  
  const stateLabel = getStateLabel(weekStats.totalExams);
  
  return (
    <div className="min-h-screen bg-background">
      <IOSHeader title="Métricas" />
      
      <div className="p-4 space-y-6">
        {/* Period overview */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <p className="text-ios-caption text-muted-foreground mb-2">Últimos 7 días</p>
          <div className="flex items-baseline gap-2 mb-1">
            <span className={cn("text-3xl font-semibold", stateLabel.color)}>
              {stateLabel.text}
            </span>
          </div>
          <p className="text-ios-subhead text-muted-foreground">
            {weekStats.totalExams} exámenes · {weekStats.averagePerDay.toFixed(1)} por día
          </p>
          {weekStats.totalEvents > 0 && (
            <p className="text-ios-caption text-muted-foreground/70 mt-1">
              {weekStats.totalEvents} marcaciones totales
            </p>
          )}
        </div>
        
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-ios-caption text-muted-foreground">Exámenes</p>
            <p className="text-2xl font-semibold text-foreground">{weekStats.totalExams}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-ios-caption text-muted-foreground">Marcaciones</p>
            <p className="text-2xl font-semibold text-foreground">{weekStats.totalEvents}</p>
          </div>
        </div>
        
        {sessions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-ios-body text-muted-foreground">
              Realiza tu primer examen para ver métricas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricsPage;
