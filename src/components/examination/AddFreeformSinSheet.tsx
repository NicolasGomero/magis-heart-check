import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { Term } from "@/lib/sins.types";

interface AddFreeformSinSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (text: string, term: Term, addToCatalog: boolean) => void;
}

const TERMS: { id: Term; icon: string; label: string }[] = [
  { id: 'contra_dios', icon: '🙏', label: 'Dios' },
  { id: 'contra_projimo', icon: '👥', label: 'Prójimo' },
  { id: 'contra_si_mismo', icon: '🪞', label: 'Yo mismo' },
];

export function AddFreeformSinSheet({ open, onClose, onAdd }: AddFreeformSinSheetProps) {
  const [text, setText] = useState("");
  const [selectedTerm, setSelectedTerm] = useState<Term>('contra_dios');
  const [addToCatalog, setAddToCatalog] = useState(false);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onAdd(text.trim(), selectedTerm, addToCatalog);
    setText("");
    setSelectedTerm('contra_dios');
    setAddToCatalog(false);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Añadir pecado</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pt-4">
          {/* Text input */}
          <div className="space-y-2">
            <Label htmlFor="sin-text">Descripción</Label>
            <Input
              id="sin-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe brevemente el pecado..."
              autoFocus
            />
          </div>

          {/* Term selector */}
          <div className="space-y-2">
            <Label>Pilar</Label>
            <div className="flex gap-2">
              {TERMS.map((term) => (
                <button
                  key={term.id}
                  onClick={() => setSelectedTerm(term.id)}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-ios-caption flex items-center justify-center gap-1.5 transition-colors",
                    selectedTerm === term.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <span>{term.icon}</span>
                  <span>{term.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add to catalog toggle */}
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="add-catalog" className="cursor-pointer">
              Añadir al catálogo global
            </Label>
            <Switch
              id="add-catalog"
              checked={addToCatalog}
              onCheckedChange={setAddToCatalog}
            />
          </div>

          {/* Submit button */}
          <Button 
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="w-full"
          >
            Añadir al examen
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
