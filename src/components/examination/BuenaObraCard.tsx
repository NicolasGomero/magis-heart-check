import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, MoreVertical, Minus, Pencil, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BuenaObra } from "@/lib/buenasObras.types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Green color palette for buenas obras (positive progression)
const BUENA_OBRA_COLORS: Record<number, string> = {
  1: '#22c55e',   // green-500 (base)
  2: '#16a34a',   // green-600
  3: '#15803d',   // green-700
  4: '#166534',   // green-800
  5: '#14532d',   // green-900
};

function getBuenaObraColor(count: number): string {
  if (count <= 0) return 'transparent';
  if (count >= 5) return BUENA_OBRA_COLORS[5];
  return BUENA_OBRA_COLORS[count] || BUENA_OBRA_COLORS[1];
}

interface BuenaObraCardProps {
  buenaObra: BuenaObra;
  count: number;
  purity: 'actual' | 'virtual' | 'habitual';
  onTap: () => void;
  onDiscount: () => void;
  onPurityChange?: (purity: 'actual' | 'virtual' | 'habitual') => void;
  onEdit: () => void;
}

export function BuenaObraCard({
  buenaObra,
  count,
  purity,
  onTap,
  onDiscount,
  onPurityChange,
  onEdit,
}: BuenaObraCardProps) {
  const navigate = useNavigate();
  const [showDescription, setShowDescription] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isLongPress = useRef(false);

  // Get level color based on count
  const levelColor = count > 0 ? getBuenaObraColor(count) : undefined;

  // Handle touch start for long press detection
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    isLongPress.current = false;
    
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      // Trigger haptic feedback if available
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    if (isLongPress.current) {
      // Long press detected - context menu handled by DropdownMenu
      return;
    }

    // Check tap position for left edge peek
    const touch = e.changedTouches[0];
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relativeX = touch.clientX - rect.left;
    
    if (relativeX < 50 && buenaObra.shortDescription) {
      // Left edge tap - toggle description
      setShowDescription(prev => !prev);
      return;
    }

    // Center tap - register event
    onTap();
  }, [buenaObra.shortDescription, onTap]);

  const handleTouchMove = useCallback(() => {
    // Cancel long press if finger moves
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  }, []);

  // Cleanup on unmount
  const handleTouchCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  }, []);

  // Check if we should show purity selector (based on buenaObra.showPurityInExam)
  const showPuritySelector = buenaObra.showPurityInExam === true && onPurityChange;

  return (
    <div
      className={cn(
        "relative bg-card rounded-xl overflow-hidden transition-all duration-200",
        "border border-border/50",
        count > 0 && "ring-2",
        showQuickMenu && "ring-2 ring-green-500/30"
      )}
      style={{
        borderLeftWidth: count > 0 ? '4px' : undefined,
        borderLeftColor: levelColor,
        boxShadow: count > 0 ? `0 0 0 2px ${levelColor}20` : undefined,
      }}
    >
      {/* Main touchable area */}
      <div
        className="flex items-center px-4 py-3 cursor-pointer active:bg-muted/50 transition-colors"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onTouchCancel={handleTouchCancel}
        onClick={(e) => {
          // Desktop click support
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const relativeX = e.clientX - rect.left;
          
          if (relativeX < 50 && buenaObra.shortDescription) {
            setShowDescription(prev => !prev);
            return;
          }
          onTap();
        }}
      >
        {/* Left peek indicator */}
        {buenaObra.shortDescription && (
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-muted/30 flex items-center justify-center">
            <div className="w-0.5 h-8 bg-muted-foreground/20 rounded-full" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 pl-1">
          <div className="flex items-center gap-2">
            <span className="text-ios-body text-foreground truncate">
              {buenaObra.name}
            </span>
            {count > 0 && (
              <span 
                className="text-ios-caption font-medium px-1.5 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: `${levelColor}20`,
                  color: levelColor 
                }}
              >
                {count}
              </span>
            )}
          </div>
        </div>

        {/* Quick menu toggle - only show if purity selector is enabled */}
        {showPuritySelector && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowQuickMenu(prev => !prev);
            }}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showQuickMenu ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Three dots context menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-popover z-50">
            <DropdownMenuItem 
              onSelect={(e) => {
                e.preventDefault();
                onDiscount();
              }}
              disabled={count === 0}
              className={count === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            >
              <Minus className="w-4 h-4 mr-2" />
              Descontar
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Editar obra
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate(`/notas/${buenaObra.id}?type=goodWork&return=/examen`)}>
              <StickyNote className="w-4 h-4 mr-2" />
              Notas
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Description peek */}
      {showDescription && buenaObra.shortDescription && (
        <div className="px-4 pb-3 pt-0 animate-fade-in">
          <p className="text-ios-caption text-muted-foreground">
            {buenaObra.shortDescription}
          </p>
        </div>
      )}

      {/* Quick menu for purity of intention */}
      {showQuickMenu && showPuritySelector && (
        <div className="px-4 pb-3 border-t border-border/30 pt-3 animate-fade-in">
          <div className="flex flex-wrap gap-2">
            {/* Purity toggles */}
            <div className="flex gap-1">
              <button
                onClick={() => onPurityChange?.('actual')}
                className={cn(
                  "px-2 py-1 rounded-md text-ios-caption transition-colors",
                  purity === 'actual'
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                Actual
              </button>
              <button
                onClick={() => onPurityChange?.('virtual')}
                className={cn(
                  "px-2 py-1 rounded-md text-ios-caption transition-colors",
                  purity === 'virtual'
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                Virtual
              </button>
              <button
                onClick={() => onPurityChange?.('habitual')}
                className={cn(
                  "px-2 py-1 rounded-md text-ios-caption transition-colors",
                  purity === 'habitual'
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                Habitual
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
