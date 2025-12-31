import { ChevronRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { IOSHeader } from "@/components/IOSHeader";
import { PILLARS, QUESTIONS, type Question } from "@/lib/questions";
import { cn } from "@/lib/utils";

function getPillarBadgeColor(pillar: string): string {
  switch (pillar) {
    case 'god': return 'bg-state-growth/20 text-state-growth';
    case 'neighbor': return 'bg-state-attention/20 text-state-attention';
    case 'self': return 'bg-state-peace/20 text-state-peace';
    default: return 'bg-muted text-muted-foreground';
  }
}

function getPillarLabel(pillar: string): string {
  const found = PILLARS.find(p => p.id === pillar);
  return found?.label || pillar;
}

export function SinsPage() {
  return (
    <div className="min-h-screen bg-background">
      <IOSHeader 
        title="Todos los pecados" 
        rightAction={
          <Link 
            to="/sins/new" 
            className="text-accent active:opacity-70 transition-opacity touch-target"
          >
            <Plus className="w-6 h-6" />
          </Link>
        }
      />
      
      <div className="divide-y divide-border">
        {QUESTIONS.map((question: Question) => (
          <Link
            key={question.id}
            to={`/sins/${question.id}`}
            className="flex items-center gap-3 px-4 py-3 active:bg-muted/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-ios-body text-foreground truncate">
                {question.text}
              </p>
              <span className={cn(
                "inline-block mt-1 px-2 py-0.5 rounded-full text-ios-caption2",
                getPillarBadgeColor(question.pillar)
              )}>
                {getPillarLabel(question.pillar)}
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
          </Link>
        ))}
      </div>
      
      {QUESTIONS.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <p className="text-ios-body text-muted-foreground mb-4">
            No hay preguntas de examen
          </p>
          <Link 
            to="/sins/new"
            className="text-accent text-ios-body"
          >
            Añadir primera pregunta
          </Link>
        </div>
      )}
    </div>
  );
}

export default SinsPage;
