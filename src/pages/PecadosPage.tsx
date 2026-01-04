import { useEffect, useState, useCallback } from "react";
import { Plus, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { IOSHeader } from "@/components/IOSHeader";
import { getSins } from "@/lib/sins.storage";
import type { Sin, Term, Gravity } from "@/lib/sins.types";
import { cn } from "@/lib/utils";

function getTermBadgeColor(term: Term) {
  switch (term) {
    case 'contra_dios': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'contra_projimo': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'contra_si_mismo': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    default: return 'bg-muted text-muted-foreground';
  }
}

function getGravityBadgeColor(gravity: Gravity) {
  switch (gravity) {
    case 'mortal': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'venial': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    default: return 'bg-muted text-muted-foreground';
  }
}

export default function PecadosPage() {
  const navigate = useNavigate();
  const [sins, setSins] = useState<Sin[]>([]);

  const refreshSins = useCallback(() => {
    setSins(getSins());
  }, []);

  useEffect(() => {
    refreshSins();
    
    const handleSinsUpdate = () => {
      refreshSins();
    };
    
    window.addEventListener('sins-updated', handleSinsUpdate);
    return () => window.removeEventListener('sins-updated', handleSinsUpdate);
  }, [refreshSins]);

  // Get primary term and gravity for display (first in arrays)
  const getPrimaryTerm = (sin: Sin): Term | null => sin.terms[0] || null;
  const getPrimaryGravity = (sin: Sin): Gravity | null => sin.gravities[0] || null;

  return (
    <div className="flex flex-col min-h-full pb-20">
      <IOSHeader 
        title="Todos los pecados" 
        onBack={() => navigate("/obras")}
        rightAction={
          <Link to="/sins/new" className="text-primary active:opacity-70">
            <Plus className="w-6 h-6" />
          </Link>
        }
      />

      {sins.length > 0 ? (
        <div className="bg-card rounded-xl mx-4 mt-4 overflow-hidden card-elevated">
          {sins.map((sin) => {
            const primaryTerm = getPrimaryTerm(sin);
            const primaryGravity = getPrimaryGravity(sin);
            
            return (
              <Link
                key={sin.id}
                to={`/sins/${sin.id}`}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  "border-b border-border/50 last:border-b-0",
                  "transition-colors active:bg-muted/50"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-ios-body font-medium text-foreground truncate">
                    {sin.name}
                  </p>
                  {sin.shortDescription && (
                    <p className="text-ios-caption text-muted-foreground truncate">
                      {sin.shortDescription}
                    </p>
                  )}
                  <div className="flex gap-2 mt-1">
                    {primaryTerm && (
                      <span className={cn(
                        "text-ios-caption2 px-2 py-0.5 rounded-full",
                        getTermBadgeColor(primaryTerm)
                      )}>
                        {primaryTerm === 'contra_dios' ? 'Dios' : 
                         primaryTerm === 'contra_projimo' ? 'Prójimo' : 'Uno mismo'}
                      </span>
                    )}
                    {primaryGravity && (
                      <span className={cn(
                        "text-ios-caption2 px-2 py-0.5 rounded-full",
                        getGravityBadgeColor(primaryGravity)
                      )}>
                        {primaryGravity === 'mortal' ? 'Mortal' : 'Venial'}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <p className="text-ios-body text-muted-foreground mb-4">
            Aún no has registrado pecados.
          </p>
          <Link 
            to="/sins/new"
            className="text-primary text-ios-body font-medium"
          >
            Añadir el primero
          </Link>
        </div>
      )}
    </div>
  );
}
