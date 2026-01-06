import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IOSHeader } from '@/components/IOSHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VIRTUDES_ANEXAS_POR_CARDINAL, ALL_VIRTUDES_ANEXAS } from '@/lib/virtudesAnexas';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function VirtudesAnexasPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get selected values and callback from navigation state
  const { selected = [], onSelect } = (location.state as { 
    selected?: string[]; 
    onSelect?: (values: string[]) => void 
  }) || {};
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>(selected);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newVirtud, setNewVirtud] = useState('');
  const [customVirtudes, setCustomVirtudes] = useState<string[]>([]);

  // Filter virtudes by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return VIRTUDES_ANEXAS_POR_CARDINAL;
    }
    
    const query = searchQuery.toLowerCase();
    return VIRTUDES_ANEXAS_POR_CARDINAL.map(group => ({
      ...group,
      virtudes: group.virtudes.filter(v => v.toLowerCase().includes(query)),
    })).filter(group => group.virtudes.length > 0);
  }, [searchQuery]);

  const filteredCustom = useMemo(() => {
    if (!searchQuery.trim()) return customVirtudes;
    const query = searchQuery.toLowerCase();
    return customVirtudes.filter(v => v.toLowerCase().includes(query));
  }, [searchQuery, customVirtudes]);

  const toggleVirtud = (virtud: string) => {
    setSelectedValues(prev => 
      prev.includes(virtud) 
        ? prev.filter(v => v !== virtud)
        : [...prev, virtud]
    );
  };

  const handleAddCustom = () => {
    const trimmed = newVirtud.trim();
    if (!trimmed) return;
    if (ALL_VIRTUDES_ANEXAS.includes(trimmed) || customVirtudes.includes(trimmed)) return;
    
    setCustomVirtudes(prev => [...prev, trimmed]);
    setSelectedValues(prev => [...prev, trimmed]);
    setNewVirtud('');
    setShowAddDialog(false);
  };

  const handleConfirm = () => {
    if (onSelect) {
      onSelect(selectedValues);
    }
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <IOSHeader 
        title="Virtud moral anexa (principales)" 
        onBack={() => navigate(-1)}
        rightAction={
          <Button size="sm" onClick={handleConfirm}>
            <Check className="h-4 w-4 mr-1" />
            Confirmar
          </Button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar virtud..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Selected count */}
        {selectedValues.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-ios-caption text-muted-foreground">
              {selectedValues.length} seleccionada(s)
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedValues([])}
              className="text-muted-foreground"
            >
              Limpiar
            </Button>
          </div>
        )}

        {/* Add new */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Añadir nueva virtud
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva virtud moral anexa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Nombre de la virtud"
                value={newVirtud}
                onChange={(e) => setNewVirtud(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCustom();
                }}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowAddDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddCustom}>
                  Añadir
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Custom virtudes */}
        {filteredCustom.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-ios-subhead font-semibold text-foreground">
              Personalizadas
            </h3>
            <div className="flex flex-wrap gap-2">
              {filteredCustom.map(virtud => (
                <Badge
                  key={virtud}
                  variant={selectedValues.includes(virtud) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all py-1.5 px-3",
                    selectedValues.includes(virtud) 
                      ? "bg-accent text-accent-foreground" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => toggleVirtud(virtud)}
                >
                  {virtud}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Grouped virtudes */}
        {filteredGroups.map(group => (
          <div key={group.cardinal} className="space-y-2">
            <h3 className="text-ios-subhead font-semibold text-foreground sticky top-0 bg-background py-2 border-b border-border">
              {group.cardinal}
            </h3>
            <div className="flex flex-wrap gap-2">
              {group.virtudes.map(virtud => (
                <Badge
                  key={virtud}
                  variant={selectedValues.includes(virtud) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all py-1.5 px-3",
                    selectedValues.includes(virtud) 
                      ? "bg-accent text-accent-foreground" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => toggleVirtud(virtud)}
                >
                  {virtud}
                </Badge>
              ))}
            </div>
          </div>
        ))}

        {filteredGroups.length === 0 && filteredCustom.length === 0 && (
          <div className="text-center py-8">
            <p className="text-ios-body text-muted-foreground">
              No se encontraron virtudes
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
