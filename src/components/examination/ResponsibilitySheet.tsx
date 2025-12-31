import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SinEvent } from "@/lib/types";
import type { Sin } from "@/lib/sins.types";

interface ResponsibilitySheetProps {
  open: boolean;
  onClose: () => void;
  events: SinEvent[];
  sins: Sin[];
  onUpdateEvent: (eventId: string, responsibility: 'formal' | 'material') => void;
  onConfirm: () => void;
}

export function ResponsibilitySheet({ 
  open, 
  onClose, 
  events, 
  sins,
  onUpdateEvent,
  onConfirm 
}: ResponsibilitySheetProps) {
  const getSinName = (sinId: string) => {
    return sins.find(s => s.id === sinId)?.name || 'Pecado desconocido';
  };

  // Group events by sinId and sum counts
  const groupedEvents = events.reduce((acc, event) => {
    const existing = acc.find(e => e.sinId === event.sinId);
    if (existing) {
      existing.count += event.countIncrement;
      existing.eventIds.push(event.id);
    } else {
      acc.push({
        sinId: event.sinId,
        count: event.countIncrement,
        responsibility: event.responsibility,
        eventIds: [event.id],
      });
    }
    return acc;
  }, [] as { sinId: string; count: number; responsibility: 'formal' | 'material'; eventIds: string[] }[]);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh] overflow-auto">
        <SheetHeader>
          <SheetTitle>Revisar responsabilidad</SheetTitle>
        </SheetHeader>

        <div className="space-y-3 pt-4">
          <p className="text-ios-caption text-muted-foreground">
            Marca como "Material" los eventos donde faltó plena advertencia o consentimiento.
          </p>

          {groupedEvents.length === 0 ? (
            <p className="text-ios-body text-muted-foreground text-center py-4">
              No hay eventos registrados
            </p>
          ) : (
            <div className="space-y-2">
              {groupedEvents.map((group) => (
                <div 
                  key={group.sinId}
                  className="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-ios-body text-foreground truncate block">
                      {getSinName(group.sinId)}
                    </span>
                    <span className="text-ios-caption text-muted-foreground">
                      {group.count}x
                    </span>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => group.eventIds.forEach(id => onUpdateEvent(id, 'formal'))}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-ios-caption transition-colors",
                        group.responsibility === 'formal'
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      Formal
                    </button>
                    <button
                      onClick={() => group.eventIds.forEach(id => onUpdateEvent(id, 'material'))}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-ios-caption transition-colors",
                        group.responsibility === 'material'
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      Material
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button onClick={onConfirm} className="w-full mt-4">
            Confirmar y guardar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
