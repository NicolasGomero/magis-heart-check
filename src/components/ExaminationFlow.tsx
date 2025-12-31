import { useState, useCallback } from "react";
import { QuestionCard } from "./QuestionCard";
import { IOSHeader } from "./IOSHeader";
import { CONTEXTS, getQuestionsForContext, type Context, type Question } from "@/lib/questions";
import { saveExamination, generateId, type ExaminationResponse } from "@/lib/storage";
import { Check } from "lucide-react";

interface ExaminationFlowProps {
  context: Context;
  onBack: () => void;
  onComplete: () => void;
}

export function ExaminationFlow({ context, onBack, onComplete }: ExaminationFlowProps) {
  const [questions] = useState<Question[]>(() => getQuestionsForContext(context));
  const [responses, setResponses] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  const contextInfo = CONTEXTS.find(c => c.id === context);
  
  const toggleQuestion = useCallback((questionId: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  }, []);
  
  const handleSave = useCallback(() => {
    setIsSaving(true);
    
    // Build examination entry
    const entry = {
      id: generateId(),
      timestamp: Date.now(),
      context,
      responses: questions.map(q => ({
        questionId: q.id,
        pillar: q.pillar,
        marked: responses[q.id] || false,
      })) as ExaminationResponse[],
    };
    
    // Save to local storage
    saveExamination(entry);
    
    // Brief delay for visual feedback
    setTimeout(() => {
      onComplete();
    }, 400);
  }, [context, questions, responses, onComplete]);
  
  const markedCount = Object.values(responses).filter(Boolean).length;
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <IOSHeader
        title="Examen"
        subtitle={`${contextInfo?.icon} ${contextInfo?.label}`}
        onBack={onBack}
      />
      
      <div className="flex-1 px-4 py-4 space-y-3 animate-fade-in">
        <p className="text-ios-footnote text-muted-foreground text-center mb-4">
          Toca las que apliquen a esta última hora
        </p>
        
        {questions.map((question, index) => (
          <div 
            key={question.id} 
            className="animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <QuestionCard
              question={question}
              isMarked={responses[question.id] || false}
              onToggle={() => toggleQuestion(question.id)}
            />
          </div>
        ))}
      </div>
      
      {/* Save button - fixed at bottom */}
      <div className="sticky bottom-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8 safe-bottom">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`
            w-full py-4 rounded-xl text-ios-headline font-semibold
            flex items-center justify-center gap-2
            transition-all duration-200 active:scale-[0.98]
            ${isSaving 
              ? 'bg-state-peace text-primary-foreground' 
              : 'bg-primary text-primary-foreground'
            }
          `}
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
