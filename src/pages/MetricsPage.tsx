import { useMemo } from "react";
import { IOSHeader } from "@/components/IOSHeader";
import { getExaminations, type ExaminationEntry } from "@/lib/storage";
import { PILLARS } from "@/lib/questions";
import { cn } from "@/lib/utils";

interface PeriodStats {
  totalExams: number;
  byPillar: Record<string, { marked: number; total: number }>;
  averagePerDay: number;
}

function calculateStats(examinations: ExaminationEntry[], days: number): PeriodStats {
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  
  const filtered = examinations.filter(e => e.timestamp >= cutoff);
  
  const byPillar: Record<string, { marked: number; total: number }> = {
    god: { marked: 0, total: 0 },
    neighbor: { marked: 0, total: 0 },
    self: { marked: 0, total: 0 },
  };
  
  filtered.forEach(exam => {
    exam.responses.forEach(r => {
      if (byPillar[r.pillar]) {
        byPillar[r.pillar].total += 1;
        if (r.marked) byPillar[r.pillar].marked += 1;
      }
    });
  });
  
  return {
    totalExams: filtered.length,
    byPillar,
    averagePerDay: filtered.length / days,
  };
}

function getPillarColor(pillar: string): string {
  switch (pillar) {
    case 'god': return 'bg-state-growth';
    case 'neighbor': return 'bg-state-attention';
    case 'self': return 'bg-state-peace';
    default: return 'bg-muted';
  }
}

function getStateLabel(percentage: number): { text: string; color: string } {
  if (percentage >= 80) return { text: 'Excelente', color: 'text-state-peace' };
  if (percentage >= 60) return { text: 'Bien', color: 'text-state-attention' };
  if (percentage >= 40) return { text: 'En progreso', color: 'text-foreground' };
  return { text: 'Necesita atención', color: 'text-state-growth' };
}

export function MetricsPage() {
  const examinations = getExaminations();
  
  const weekStats = useMemo(() => calculateStats(examinations, 7), [examinations]);
  
  const overallPercentage = useMemo(() => {
    const totals = Object.values(weekStats.byPillar);
    const totalMarked = totals.reduce((acc, p) => acc + p.marked, 0);
    const totalCount = totals.reduce((acc, p) => acc + p.total, 0);
    return totalCount > 0 ? Math.round((totalMarked / totalCount) * 100) : 0;
  }, [weekStats]);
  
  const stateLabel = getStateLabel(overallPercentage);
  
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
        </div>
        
        {/* By pillar */}
        <div className="space-y-3">
          <h2 className="text-ios-headline text-foreground px-1">Por pilar</h2>
          
          {PILLARS.map(pillar => {
            const stats = weekStats.byPillar[pillar.id];
            const percentage = stats.total > 0 
              ? Math.round((stats.marked / stats.total) * 100) 
              : 0;
            
            return (
              <div 
                key={pillar.id}
                className="bg-card rounded-xl p-4 border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-ios-body text-foreground">{pillar.label}</span>
                  <span className="text-ios-subhead text-muted-foreground">
                    {stats.marked}/{stats.total}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full transition-all", getPillarColor(pillar.id))}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        {examinations.length === 0 && (
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
