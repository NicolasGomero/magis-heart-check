import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNotesForTarget, type NoteTargetType } from "@/lib/notes.storage";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PeriodNotesProps {
  targetId: string;
  targetType: NoteTargetType;
  startDate: number;
  endDate: number;
  returnPath: string;
}

export function PeriodNotes({ 
  targetId, 
  targetType, 
  startDate, 
  endDate,
  returnPath 
}: PeriodNotesProps) {
  const navigate = useNavigate();
  
  const allNotes = useMemo(() => 
    getNotesForTarget(targetType, targetId),
    [targetType, targetId]
  );
  
  const periodNotes = useMemo(() => 
    allNotes.filter(n => n.createdAt >= startDate && n.createdAt <= endDate),
    [allNotes, startDate, endDate]
  );
  
  const formatDateTime = (timestamp: number) => {
    return format(new Date(timestamp), "d MMM yyyy, HH:mm", { locale: es });
  };
  
  const handleViewAll = () => {
    navigate(`/notas/${targetId}?type=${targetType}&return=${encodeURIComponent(returnPath)}`);
  };
  
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <StickyNote className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-ios-headline text-foreground">Notas</h2>
        <span className="text-ios-caption text-muted-foreground">
          ({periodNotes.length} en el periodo)
        </span>
      </div>
      
      {periodNotes.length > 0 ? (
        <div className="space-y-2">
          {periodNotes.map((note) => (
            <div 
              key={note.id} 
              className="bg-card rounded-xl p-4 border border-border"
            >
              <p className="text-ios-body text-foreground whitespace-pre-wrap">
                {note.text}
              </p>
              <p className="text-ios-caption2 text-muted-foreground mt-2">
                {formatDateTime(note.createdAt)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl p-4 border border-border text-center">
          <p className="text-ios-body text-muted-foreground">
            No hay notas en este periodo
          </p>
        </div>
      )}
      
      {/* Ver todas las notas button */}
      <Button 
        variant="outline" 
        onClick={handleViewAll}
        className="w-full"
      >
        Ver todas las notas ({allNotes.length})
      </Button>
    </section>
  );
}
