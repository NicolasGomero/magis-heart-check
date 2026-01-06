import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { IOSHeader } from "@/components/IOSHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getNotesForTarget, createNote, deleteNote, type Note, type NoteTargetType } from "@/lib/notes.storage";
import { getSin } from "@/lib/sins.storage";
import { getBuenaObra } from "@/lib/buenasObras.storage";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function NotasPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const targetType = (searchParams.get('type') as NoteTargetType) || 'sin';
  const returnPath = searchParams.get('return') || '/';
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [targetName, setTargetName] = useState("");
  
  const refresh = useCallback(() => {
    if (!id) return;
    setNotes(getNotesForTarget(targetType, id));
  }, [id, targetType]);
  
  useEffect(() => {
    if (!id) return;
    
    // Get target name
    if (targetType === 'sin') {
      const sin = getSin(id);
      setTargetName(sin?.name || 'Pecado');
    } else {
      const buenaObra = getBuenaObra(id);
      setTargetName(buenaObra?.name || 'Buena obra');
    }
    
    refresh();
    
    const handleUpdate = () => refresh();
    window.addEventListener('notes-updated', handleUpdate);
    return () => window.removeEventListener('notes-updated', handleUpdate);
  }, [id, targetType, refresh]);
  
  const handleSaveNote = () => {
    if (!id || !newNoteText.trim()) return;
    
    createNote(targetType, id, newNoteText);
    setNewNoteText("");
    toast.success("Nota guardada");
  };
  
  const handleDeleteNote = (noteId: string) => {
    if (confirm("¿Eliminar esta nota?")) {
      deleteNote(noteId);
      toast.success("Nota eliminada");
    }
  };
  
  const formatDateTime = (timestamp: number) => {
    return format(new Date(timestamp), "d MMM yyyy, HH:mm", { locale: es });
  };
  
  return (
    <div className="flex flex-col min-h-full pb-20">
      <IOSHeader 
        title="Notas" 
        onBack={() => navigate(returnPath)}
      />
      
      <div className="px-4 pt-4 space-y-4">
        {/* Target name */}
        <div className="text-center">
          <p className="text-ios-body font-medium text-foreground">{targetName}</p>
          <p className="text-ios-caption text-muted-foreground">
            {targetType === 'sin' ? 'Pecado' : 'Buena obra'}
          </p>
        </div>
        
        {/* New note input */}
        <div className="bg-card rounded-xl p-4 card-elevated space-y-3">
          <Textarea
            placeholder="Escribe una nueva nota..."
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          <Button 
            onClick={handleSaveNote}
            disabled={!newNoteText.trim()}
            className="w-full"
          >
            Guardar nota
          </Button>
        </div>
        
        {/* Notes list */}
        {notes.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-ios-caption font-medium text-muted-foreground uppercase tracking-wide px-1">
              Notas guardadas ({notes.length})
            </h3>
            {notes.map((note) => (
              <div 
                key={note.id} 
                className="bg-card rounded-xl p-4 card-elevated relative"
              >
                <p className="text-ios-body text-foreground whitespace-pre-wrap pr-8">
                  {note.text}
                </p>
                <p className="text-ios-caption2 text-muted-foreground mt-2">
                  {formatDateTime(note.createdAt)}
                </p>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="absolute top-3 right-3 p-2 text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Eliminar nota"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-ios-body text-muted-foreground">
              No hay notas para este ítem.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
