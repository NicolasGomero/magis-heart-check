import { useEffect, useState, useCallback } from "react";
import { Plus, MoreVertical, EyeOff, Eye, Minus, Pencil, Trash2, StickyNote } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { IOSHeader } from "@/components/IOSHeader";
import { getSins, toggleSinDisabled, deleteSin } from "@/lib/sins.storage";
import type { Sin, Term, Gravity } from "@/lib/sins.types";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

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

  const handleToggleDisabled = (e: React.MouseEvent, sinId: string) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSinDisabled(sinId);
  };

  const handleDiscount = (sinId: string) => {
    // TODO: Implement discount functionality
    toast.info("Funcionalidad de descontar próximamente");
  };

  const handleDelete = (sinId: string, sinName: string) => {
    if (confirm(`¿Eliminar el pecado "${sinName}"?`)) {
      deleteSin(sinId);
      toast.success(`Pecado "${sinName}" eliminado`);
    }
  };

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
            const isDisabled = sin.isDisabled ?? false;
            
            return (
              <div
                key={sin.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  "border-b border-border/50 last:border-b-0",
                  isDisabled && "opacity-50"
                )}
              >
                {/* Toggle disabled button */}
                <button
                  onClick={(e) => handleToggleDisabled(e, sin.id)}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    "transition-colors active:scale-95",
                    isDisabled 
                      ? "bg-muted text-muted-foreground" 
                      : "bg-primary/10 text-primary"
                  )}
                  aria-label={isDisabled ? "Habilitar" : "Deshabilitar"}
                >
                  {isDisabled ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>

                {/* Main content - clickable to detail/metrics */}
                <button
                  onClick={() => navigate(`/obras/pecados/${sin.id}/detalle`)}
                  className="flex-1 min-w-0 text-left"
                >
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
                </button>

                {/* Three dots menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button 
                      className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem onClick={() => handleDiscount(sin.id)}>
                      <Minus className="w-4 h-4 mr-2" />
                      Descontar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/sins/${sin.id}`)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar pecado
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/notas/${sin.id}?type=sin&return=/obras/pecados`)}>
                      <StickyNote className="w-4 h-4 mr-2" />
                      Notas
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(sin.id, sin.name)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
