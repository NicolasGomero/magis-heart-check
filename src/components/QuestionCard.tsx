import { useState } from "react";
import { Check } from "lucide-react";
import { PILLARS, type Question, type Pillar } from "@/lib/questions";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  question: Question;
  isMarked: boolean;
  onToggle: () => void;
}

function getPillarStyles(pillar: Pillar): { bg: string; border: string; badge: string } {
  switch (pillar) {
    case 'god':
      return {
        bg: 'bg-state-growth/10',
        border: 'border-state-growth/30',
        badge: 'bg-state-growth/20 text-state-growth',
      };
    case 'neighbor':
      return {
        bg: 'bg-state-attention/10',
        border: 'border-state-attention/30',
        badge: 'bg-state-attention/20 text-state-attention',
      };
    case 'self':
      return {
        bg: 'bg-state-peace/10',
        border: 'border-state-peace/30',
        badge: 'bg-state-peace/20 text-state-peace',
      };
  }
}

export function QuestionCard({ question, isMarked, onToggle }: QuestionCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const pillar = PILLARS.find(p => p.id === question.pillar);
  const styles = getPillarStyles(question.pillar);
  
  return (
    <button
      onClick={onToggle}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={cn(
        "w-full text-left p-4 rounded-xl border-2 transition-all duration-200",
        "active:scale-[0.98]",
        isMarked 
          ? `${styles.bg} ${styles.border}` 
          : "bg-card border-transparent card-elevated",
        isPressed && !isMarked && "bg-muted"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div
          className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
            isMarked 
              ? `bg-state-${question.pillar === 'god' ? 'growth' : question.pillar === 'neighbor' ? 'attention' : 'peace'} border-transparent` 
              : "border-muted-foreground/40"
          )}
        >
          {isMarked && (
            <Check className="w-4 h-4 text-primary-foreground animate-check-mark" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Pillar badge */}
          <span className={cn(
            "inline-block px-2 py-0.5 rounded-full text-ios-caption font-medium mb-2",
            styles.badge
          )}>
            {pillar?.label}
          </span>
          
          {/* Question text */}
          <p className={cn(
            "text-ios-body leading-relaxed",
            isMarked ? "text-foreground" : "text-foreground"
          )}>
            {question.text}
          </p>
        </div>
      </div>
    </button>
  );
}
