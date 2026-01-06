import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IOSHeader } from '@/components/IOSHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MEDIOS_ESPIRITUALES_BLOQUES, ALL_MEDIOS_ESPIRITUALES } from '@/lib/mediosEspirituales';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Storage keys for temporary selection persistence
const MEDIOS_SELECTION_KEY = 'magis_medios_selection';
const MEDIOS_RETURN_PATH_KEY = 'magis_medios_return_path';

export default function MediosEspiritualesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get selected values from navigation state
  // storageKey can be customized for different contexts (form vs filter)
  const { selected = [], returnPath, storageKey } = (location.state as { 
    selected?: string[]; 
    returnPath?: string;
    storageKey?: string;
  }) || {};
  
  // Use custom storage key if provided, otherwise default
  const effectiveStorageKey = storageKey || MEDIOS_SELECTION_KEY;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>(selected);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMedio, setNewMedio] = useState('');
  const [customMedios, setCustomMedios] = useState<string[]>([]);

  // Store return path on mount
  useEffect(() => {
    if (returnPath) {
      localStorage.setItem(MEDIOS_RETURN_PATH_KEY, returnPath);
    }
  }, [returnPath]);

  // Filter medios by search query
  const filteredBloques = useMemo(() => {
    if (!searchQuery.trim()) {
      return MEDIOS_ESPIRITUALES_BLOQUES;
    }
    
    const query = searchQuery.toLowerCase();
    return MEDIOS_ESPIRITUALES_BLOQUES.map(bloque => ({
      ...bloque,
      medios: bloque.medios.filter(m => m.toLowerCase().includes(query)),
    })).filter(bloque => bloque.medios.length > 0);
  }, [searchQuery]);

  const filteredCustom = useMemo(() => {
    if (!searchQuery.trim()) return customMedios;
    const query = searchQuery.toLowerCase();
    return customMedios.filter(m => m.toLowerCase().includes(query));
  }, [searchQuery, customMedios]);

  const toggleMedio = (medio: string) => {
    setSelectedValues(prev => 
      prev.includes(medio) 
        ? prev.filter(m => m !== medio)
        : [...prev, medio]
    );
  };

  const handleAddCustom = () => {
    const trimmed = newMedio.trim();
    if (!trimmed) return;
    if (ALL_MEDIOS_ESPIRITUALES.includes(trimmed) || customMedios.includes(trimmed)) return;
    
    setCustomMedios(prev => [...prev, trimmed]);
    setSelectedValues(prev => [...prev, trimmed]);
    setNewMedio('');
    setShowAddDialog(false);
  };

  const handleConfirm = () => {
    // Save selection to localStorage for the form/filter to pick up
    localStorage.setItem(effectiveStorageKey, JSON.stringify(selectedValues));
    
    // Navigate back
    const storedReturnPath = localStorage.getItem(MEDIOS_RETURN_PATH_KEY);
    if (storedReturnPath) {
      navigate(storedReturnPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <IOSHeader 
        title="Medios espirituales" 
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
            placeholder="Buscar medio espiritual..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Selected count */}
        {selectedValues.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-ios-caption text-muted-foreground">
              {selectedValues.length} seleccionado(s)
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
              Añadir nuevo medio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo medio espiritual</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Nombre del medio espiritual"
                value={newMedio}
                onChange={(e) => setNewMedio(e.target.value)}
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

        {/* Custom medios */}
        {filteredCustom.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-ios-subhead font-semibold text-foreground">
              Personalizados
            </h3>
            <div className="flex flex-wrap gap-2">
              {filteredCustom.map(medio => (
                <Badge
                  key={medio}
                  variant={selectedValues.includes(medio) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all py-1.5 px-3",
                    selectedValues.includes(medio) 
                      ? "bg-accent text-accent-foreground" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => toggleMedio(medio)}
                >
                  {medio}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Bloques de medios */}
        {filteredBloques.map(bloque => (
          <div key={bloque.titulo} className="space-y-2">
            <h3 className="text-ios-subhead font-semibold text-foreground sticky top-0 bg-background py-2 border-b border-border">
              {bloque.titulo}
            </h3>
            <div className="flex flex-wrap gap-2">
              {bloque.medios.map(medio => (
                <Badge
                  key={medio}
                  variant={selectedValues.includes(medio) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all py-1.5 px-3",
                    selectedValues.includes(medio) 
                      ? "bg-accent text-accent-foreground" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => toggleMedio(medio)}
                >
                  {medio}
                </Badge>
              ))}
            </div>
          </div>
        ))}

        {filteredBloques.length === 0 && filteredCustom.length === 0 && (
          <div className="text-center py-8">
            <p className="text-ios-body text-muted-foreground">
              No se encontraron medios espirituales
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
