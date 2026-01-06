import { useEffect, useState, useCallback } from "react";
import { Plus, MoreVertical, EyeOff, Eye, Minus, Pencil, Trash2, StickyNote } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { IOSHeader } from "@/components/IOSHeader";
import { getBuenasObras, toggleBuenaObraDisabled, deleteBuenaObra } from "@/lib/buenasObras.storage";
import type { BuenaObra, BuenaObraTerm } from "@/lib/buenasObras.types";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

function getTermBadgeColor(term: BuenaObraTerm) {
  switch (term) {
    case 'hacia_dios': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'hacia_projimo': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'hacia_si_mismo': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    default: return 'bg-muted text-muted-foreground';
  }
}

export default function BuenasObrasPage() {
  const navigate = useNavigate();
  const [buenasObras, setBuenasObras] = useState<BuenaObra[]>([]);

  const refresh = useCallback(() => {
    setBuenasObras(getBuenasObras());
  }, []);

  useEffect(() => {
    refresh();
    
    const handleUpdate = () => {
      refresh();
    };
    
    window.addEventListener('buenas-obras-updated', handleUpdate);
    return () => window.removeEventListener('buenas-obras-updated', handleUpdate);
  }, [refresh]);

  const handleToggleDisabled = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBuenaObraDisabled(id);
  };

  const handleDiscount = (id: string) => {
    toast.info("Funcionalidad de descontar próximamente");
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Eliminar la buena obra "${name}"?`)) {
      deleteBuenaObra(id);
      toast.success(`Buena obra "${name}" eliminada`);
    }
  };

  const getPrimaryTerm = (buenaObra: BuenaObra): BuenaObraTerm | null => buenaObra.terms[0] || null;

  return (
    <div className="flex flex-col min-h-full pb-20">
      <IOSHeader 
        title="Todas las buenas obras" 
        onBack={() => navigate("/obras")}
        rightAction={
          <Link to="/obras/buenas/new" className="text-primary active:opacity-70">
            <Plus className="w-6 h-6" />
          </Link>
        }
      />

      {buenasObras.length > 0 ? (
        <div className="bg-card rounded-xl mx-4 mt-4 overflow-hidden card-elevated">
          {buenasObras.map((buenaObra) => {
            const primaryTerm = getPrimaryTerm(buenaObra);
            const isDisabled = buenaObra.isDisabled ?? false;
            
            return (
              <div
                key={buenaObra.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  "border-b border-border/50 last:border-b-0",
                  isDisabled && "opacity-50"
                )}
              >
                {/* Toggle disabled button */}
                <button
                  onClick={(e) => handleToggleDisabled(e, buenaObra.id)}
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
                  onClick={() => navigate(`/obras/buenas/${buenaObra.id}/detalle`)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="text-ios-body font-medium text-foreground truncate">
                    {buenaObra.name}
                  </p>
                  {buenaObra.shortDescription && (
                    <p className="text-ios-caption text-muted-foreground truncate">
                      {buenaObra.shortDescription}
                    </p>
                  )}
                  {primaryTerm && (
                    <div className="flex gap-2 mt-1">
                      <span className={cn(
                        "text-ios-caption2 px-2 py-0.5 rounded-full",
                        getTermBadgeColor(primaryTerm)
                      )}>
                        {primaryTerm === 'hacia_dios' ? 'Dios' : 
                         primaryTerm === 'hacia_projimo' ? 'Prójimo' : 'Uno mismo'}
                      </span>
                    </div>
                  )}
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
                    <DropdownMenuItem onClick={() => handleDiscount(buenaObra.id)}>
                      <Minus className="w-4 h-4 mr-2" />
                      Descontar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/obras/buenas/${buenaObra.id}`)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar buena obra
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/notas/${buenaObra.id}?type=goodWork&return=/obras/buenas`)}>
                      <StickyNote className="w-4 h-4 mr-2" />
                      Notas
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(buenaObra.id, buenaObra.name)}
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
            Aún no has registrado buenas obras.
          </p>
          <Link 
            to="/obras/buenas/new"
            className="text-primary text-ios-body font-medium"
          >
            Añadir la primera
          </Link>
        </div>
      )}
    </div>
  );
}
