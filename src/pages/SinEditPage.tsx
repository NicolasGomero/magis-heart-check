import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IOSHeader } from "@/components/IOSHeader";
import { PILLARS, CONTEXTS, QUESTIONS, type Pillar, type Context } from "@/lib/questions";
import { cn } from "@/lib/utils";

export function SinEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = id === "new";
  
  const existingQuestion = !isNew 
    ? QUESTIONS.find(q => q.id === id) 
    : null;
  
  const [text, setText] = useState(existingQuestion?.text || "");
  const [pillar, setPillar] = useState<Pillar>(existingQuestion?.pillar || "god");
  const [selectedContexts, setSelectedContexts] = useState<Context[]>(
    existingQuestion?.contexts || ["general"]
  );
  
  const toggleContext = (ctx: Context) => {
    setSelectedContexts(prev => 
      prev.includes(ctx)
        ? prev.filter(c => c !== ctx)
        : [...prev, ctx]
    );
  };
  
  const handleSave = () => {
    // In a real app, this would save to storage
    // For now, just navigate back
    navigate("/sins");
  };
  
  return (
    <div className="min-h-screen bg-background">
      <IOSHeader 
        title={isNew ? "Nueva pregunta" : "Editar pregunta"}
        onBack={() => navigate(-1)}
        rightAction={
          <button 
            onClick={handleSave}
            disabled={!text.trim() || selectedContexts.length === 0}
            className="text-accent text-ios-body disabled:opacity-50 disabled:cursor-not-allowed touch-target"
          >
            Guardar
          </button>
        }
      />
      
      <div className="p-4 space-y-6">
        {/* Text input */}
        <div>
          <label className="text-ios-caption text-muted-foreground uppercase tracking-wide block mb-2">
            Pregunta
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="¿He...?"
            className="w-full bg-card border border-border rounded-xl p-4 text-ios-body text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
            rows={3}
          />
        </div>
        
        {/* Pillar selection */}
        <div>
          <label className="text-ios-caption text-muted-foreground uppercase tracking-wide block mb-2">
            Pilar
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PILLARS.map(p => (
              <button
                key={p.id}
                onClick={() => setPillar(p.id)}
                className={cn(
                  "py-3 px-4 rounded-xl text-ios-subhead transition-colors",
                  pillar === p.id
                    ? "bg-accent text-accent-foreground"
                    : "bg-card border border-border text-foreground active:bg-muted/50"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Context selection */}
        <div>
          <label className="text-ios-caption text-muted-foreground uppercase tracking-wide block mb-2">
            Contextos
          </label>
          <div className="flex flex-wrap gap-2">
            {CONTEXTS.map(ctx => (
              <button
                key={ctx.id}
                onClick={() => toggleContext(ctx.id)}
                className={cn(
                  "py-2 px-3 rounded-full text-ios-subhead transition-colors",
                  selectedContexts.includes(ctx.id)
                    ? "bg-accent text-accent-foreground"
                    : "bg-card border border-border text-foreground active:bg-muted/50"
                )}
              >
                {ctx.icon} {ctx.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SinEditPage;
