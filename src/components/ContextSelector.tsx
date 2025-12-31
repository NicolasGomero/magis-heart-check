import { CONTEXTS, type Context } from "@/lib/questions";
import { ChevronRight } from "lucide-react";

interface ContextSelectorProps {
  onSelect: (context: Context) => void;
}

export function ContextSelector({ onSelect }: ContextSelectorProps) {
  return (
    <div className="flex flex-col">
      <div className="px-4 py-2">
        <p className="text-ios-footnote text-muted-foreground uppercase tracking-wide">
          ¿Dónde estás ahora?
        </p>
      </div>
      
      <div className="bg-card rounded-xl mx-4 overflow-hidden card-elevated">
        {CONTEXTS.map((context, index) => (
          <button
            key={context.id}
            onClick={() => onSelect(context.id)}
            className="ios-list-item w-full text-left"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl" role="img" aria-label={context.label}>
                {context.icon}
              </span>
              <span className="text-ios-body text-foreground">{context.label}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        ))}
      </div>
      
      <p className="px-4 py-3 text-ios-caption text-muted-foreground text-center">
        Selecciona tu contexto actual para recibir preguntas relevantes
      </p>
    </div>
  );
}
