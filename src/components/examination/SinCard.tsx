import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, MoreVertical, Minus, Pencil, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Sin } from "@/lib/sins.types";
import { getLevelColor } from "@/lib/sins.types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SinCardProps {
  sin: Sin;
  count: number;
  attention: 'deliberado' | 'semideliberado';
  motive: 'fragilidad' | 'malicia' | 'ignorancia';
  onTap: () => void;
  onDiscount: () => void;
  onAttentionChange: (attention: 'deliberado' | 'semideliberado') => void;
  onMotiveChange: (motive: 'fragilidad' | 'malicia' | 'ignorancia') => void;
  onEdit: () => void;
}

export function SinCard({
  sin,
  count,
  attention,
  motive,
  onTap,
  onDiscount,
  onAttentionChange,
  onMotiveChange,
  onEdit,
}: SinCardProps) {
  const navigate = useNavigate();
  const [showDescription, setShowDescription] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isLongPress = useRef(false);

  // Get level color based on count
  const levelColor = count > 0 
    ? getLevelColor(sin.colorPaletteKey, count, sin.mortalThresholdUnits)
    : undefined;

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
    
    if (relativeX < 50 && sin.shortDescription) {
      // Left edge tap - toggle description
      setShowDescription(prev => !prev);
      return;
    }

    // Center tap - register event
    onTap();
  }, [sin.shortDescription, onTap]);

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

  return (
    <div
      className={cn(
        "relative bg-card rounded-xl overflow-hidden transition-all duration-200",
        "border border-border/50",
        count > 0 && "ring-2",
        showQuickMenu && "ring-2 ring-primary/30"
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
          
          if (relativeX < 50 && sin.shortDescription) {
            setShowDescription(prev => !prev);
            return;
          }
          onTap();
        }}
      >
        {/* Left peek indicator */}
        {sin.shortDescription && (
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-muted/30 flex items-center justify-center">
            <div className="w-0.5 h-8 bg-muted-foreground/20 rounded-full" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 pl-1">
          <div className="flex items-center gap-2">
            <span className="text-ios-body text-foreground truncate">
              {sin.name}
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

        {/* Quick menu toggle */}
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
          <DropdownMenuContent align="end" className="w-48 bg-popover">
            <DropdownMenuItem 
              onClick={onDiscount}
              disabled={count === 0}
              className={count === 0 ? "opacity-50" : ""}
            >
              <Minus className="w-4 h-4 mr-2" />
              Descontar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Editar pecado
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/notas/${sin.id}?type=sin&return=/examen`)}>
              <StickyNote className="w-4 h-4 mr-2" />
              Notas
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Description peek */}
      {showDescription && sin.shortDescription && (
        <div className="px-4 pb-3 pt-0 animate-fade-in">
          <p className="text-ios-caption text-muted-foreground">
            {sin.shortDescription}
          </p>
        </div>
      )}

      {/* Quick menu for attention/motive (accessible alternative to gestures) */}
      {showQuickMenu && (
        <div className="px-4 pb-3 border-t border-border/30 pt-3 animate-fade-in">
          <div className="flex flex-wrap gap-2">
            {/* Attention toggles */}
            <div className="flex gap-1">
              <button
                onClick={() => onAttentionChange('deliberado')}
                className={cn(
                  "px-2 py-1 rounded-md text-ios-caption transition-colors",
                  attention === 'deliberado'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                Deliberado
              </button>
              <button
                onClick={() => onAttentionChange('semideliberado')}
                className={cn(
                  "px-2 py-1 rounded-md text-ios-caption transition-colors",
                  attention === 'semideliberado'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                Semidelib.
              </button>
            </div>

            {/* Motive toggles */}
            <div className="flex gap-1">
              <button
                onClick={() => onMotiveChange('fragilidad')}
                className={cn(
                  "px-2 py-1 rounded-md text-ios-caption transition-colors",
                  motive === 'fragilidad'
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                Fragilidad
              </button>
              <button
                onClick={() => onMotiveChange('malicia')}
                className={cn(
                  "px-2 py-1 rounded-md text-ios-caption transition-colors",
                  motive === 'malicia'
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                Malicia
              </button>
              <button
                onClick={() => onMotiveChange('ignorancia')}
                className={cn(
                  "px-2 py-1 rounded-md text-ios-caption transition-colors",
                  motive === 'ignorancia'
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                Ignorancia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
