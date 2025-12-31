import { useState, useEffect, useCallback } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { IOSHeader } from "@/components/IOSHeader";
import { getSins } from "@/lib/sins.storage";
import { TERM_LABELS, GRAVITY_LABELS, type Term, type Gravity } from "@/lib/sins.types";
import { cn } from "@/lib/utils";

function getTermBadgeColor(term: Term): string {
  switch (term) {
    case 'contra_dios': return 'bg-state-growth/20 text-state-growth';
    case 'contra_projimo': return 'bg-state-attention/20 text-state-attention';
    case 'contra_si_mismo': return 'bg-state-peace/20 text-state-peace';
    default: return 'bg-muted text-muted-foreground';
  }
}

function getGravityBadgeColor(gravity: Gravity): string {
  switch (gravity) {
    case 'mortal': return 'bg-destructive/20 text-destructive';
    case 'venial': return 'bg-muted text-muted-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
}

export function SinsPage() {
  const [sins, setSins] = useState(() => getSins());
  
  const refreshSins = useCallback(() => {
    const updatedSins = getSins();
    console.log('[SinsPage] refreshSins called, count:', updatedSins.length);
    setSins(updatedSins);
  }, []);
  
  // Refresh sins on mount and when sins are updated
  useEffect(() => {
    console.log('[SinsPage] useEffect mount, initial sins:', sins.length);
    refreshSins();
    
    const handleSinsUpdated = () => {
      console.log('[SinsPage] sins-updated event received');
      refreshSins();
    };
    window.addEventListener('sins-updated', handleSinsUpdated);
    
    return () => {
      window.removeEventListener('sins-updated', handleSinsUpdated);
    };
  }, [refreshSins]);
  
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
        {sins.map((sin) => (
          <Link
            key={sin.id}
            to={`/sins/${sin.id}`}
            className="flex items-center gap-3 px-4 py-3 active:bg-muted/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-ios-body text-foreground truncate">
                {sin.name}
              </p>
              {sin.shortDescription && (
                <p className="text-ios-caption text-muted-foreground truncate mt-0.5">
                  {sin.shortDescription}
                </p>
              )}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {sin.terms.slice(0, 1).map(term => (
                  <span 
                    key={term}
                    className={cn(
                      "inline-block px-2 py-0.5 rounded-full text-ios-caption2",
                      getTermBadgeColor(term)
                    )}
                  >
                    {TERM_LABELS[term]}
                  </span>
                ))}
                {sin.gravities.slice(0, 1).map(gravity => (
                  <span 
                    key={gravity}
                    className={cn(
                      "inline-block px-2 py-0.5 rounded-full text-ios-caption2",
                      getGravityBadgeColor(gravity)
                    )}
                  >
                    {GRAVITY_LABELS[gravity]}
                  </span>
                ))}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
          </Link>
        ))}
      </div>
      
      {sins.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <p className="text-ios-body text-muted-foreground mb-4">
            No hay pecados configurados
          </p>
          <Link 
            to="/sins/new"
            className="text-accent text-ios-body"
          >
            Añadir primer pecado
          </Link>
        </div>
      )}
    </div>
  );
}

export default SinsPage;
