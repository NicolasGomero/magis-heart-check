import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { IOSHeader } from "@/components/IOSHeader";
import { getBuenaObra, createBuenaObra, updateBuenaObra, deleteBuenaObra } from "@/lib/buenasObras.storage";
import { toast } from "sonner";
import { getPersonTypes, getActivities } from "@/lib/entities";
import {
  createDefaultBuenaObra,
  BUENA_OBRA_TERM_LABELS,
  type BuenaObraTerm,
  type BuenaObra,
} from "@/lib/buenasObras.types";
import { DEFAULT_OPPOSITE_VIRTUES, DEFAULT_SPIRITUAL_ASPECTS } from "@/lib/sins.types";
import { cn } from "@/lib/utils";

// ========== Multi-select Component ==========

interface MultiSelectProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (selected: T[]) => void;
  allowCustom?: boolean;
}

function MultiSelect<T extends string>({ 
  label, 
  options, 
  selected, 
  onChange,
  allowCustom = false,
}: MultiSelectProps<T>) {
  const [customValue, setCustomValue] = useState('');
  
  const toggle = (value: T) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };
  
  const addCustom = () => {
    if (customValue.trim() && !selected.includes(customValue.trim() as T)) {
      onChange([...selected, customValue.trim() as T]);
      setCustomValue('');
    }
  };
  
  return (
    <div>
      <label className="text-ios-caption text-muted-foreground uppercase tracking-wide block mb-2">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={cn(
              "py-1.5 px-3 rounded-full text-ios-subhead transition-colors",
              selected.includes(opt.value)
                ? "bg-accent text-accent-foreground"
                : "bg-card border border-border text-foreground active:bg-muted/50"
            )}
          >
            {opt.label}
          </button>
        ))}
        {selected
          .filter(v => !options.find(o => o.value === v))
          .map(v => (
            <button
              key={v}
              type="button"
              onClick={() => toggle(v)}
              className="py-1.5 px-3 rounded-full text-ios-subhead bg-accent text-accent-foreground"
            >
              {v}
            </button>
          ))}
      </div>
      {allowCustom && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="Añadir nuevo..."
            className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-ios-subhead text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
          />
          <button
            type="button"
            onClick={addCustom}
            className="px-3 py-2 bg-accent text-accent-foreground rounded-lg"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ========== Main Component ==========

export function BuenaObraEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id || id === "new";
  
  const [buenaObra, setBuenaObra] = useState<BuenaObra>(() => {
    if (isNew) {
      return createDefaultBuenaObra('temp');
    }
    return getBuenaObra(id!) || createDefaultBuenaObra('temp');
  });
  
  const [personTypes] = useState(getPersonTypes);
  const [activities] = useState(getActivities);
  
  const updateField = <K extends keyof BuenaObra>(field: K, value: BuenaObra[K]) => {
    setBuenaObra(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSave = () => {
    if (!buenaObra.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    
    if (isNew) {
      createBuenaObra(buenaObra);
      toast.success(`Buena obra "${buenaObra.name}" guardada`);
    } else {
      updateBuenaObra(id!, buenaObra);
      toast.success(`Buena obra "${buenaObra.name}" actualizada`);
    }
    
    setTimeout(() => {
      navigate("/obras/buenas");
    }, 100);
  };
  
  const handleDelete = () => {
    if (!isNew && confirm('¿Eliminar esta buena obra?')) {
      deleteBuenaObra(id!);
      navigate("/obras/buenas");
    }
  };
  
  return (
    <div className="min-h-screen bg-background pb-8">
      <IOSHeader 
        title={isNew ? "Nueva buena obra" : "Editar buena obra"}
        onBack={() => navigate(-1)}
        rightAction={
          <button 
            type="button"
            onClick={handleSave}
            disabled={!buenaObra.name.trim()}
            className="text-accent text-ios-body font-medium disabled:opacity-50 disabled:cursor-not-allowed py-2 px-3 -mr-3 active:opacity-70 transition-opacity"
          >
            Guardar
          </button>
        }
      />
      
      <div className="p-4 space-y-6">
        {/* Basic info */}
        <section className="space-y-4">
          <h2 className="text-ios-headline text-foreground">Información básica</h2>
          
          <div>
            <label className="text-ios-caption text-muted-foreground uppercase tracking-wide block mb-2">
              Nombre *
            </label>
            <input
              value={buenaObra.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Nombre de la buena obra"
              className="w-full bg-card border border-border rounded-xl p-4 text-ios-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          
          <div>
            <label className="text-ios-caption text-muted-foreground uppercase tracking-wide block mb-2">
              Descripción corta
            </label>
            <input
              value={buenaObra.shortDescription}
              onChange={(e) => updateField('shortDescription', e.target.value)}
              placeholder="Breve descripción"
              className="w-full bg-card border border-border rounded-xl p-4 text-ios-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          
          <div>
            <label className="text-ios-caption text-muted-foreground uppercase tracking-wide block mb-2">
              Información adicional
            </label>
            <textarea
              value={buenaObra.extraInfo}
              onChange={(e) => updateField('extraInfo', e.target.value)}
              placeholder="Información extendida..."
              rows={3}
              className="w-full bg-card border border-border rounded-xl p-4 text-ios-body text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
        </section>
        
        {/* Classification */}
        <section className="space-y-4">
          <h2 className="text-ios-headline text-foreground">Clasificación</h2>
          
          <MultiSelect
            label="Término"
            options={Object.entries(BUENA_OBRA_TERM_LABELS).map(([value, label]) => ({ 
              value: value as BuenaObraTerm, 
              label 
            }))}
            selected={buenaObra.terms}
            onChange={(v) => updateField('terms', v)}
          />
        </section>
        
        {/* Characteristics */}
        <section className="space-y-4">
          <h2 className="text-ios-headline text-foreground">Características</h2>
          
          <MultiSelect
            label="Virtudes"
            options={DEFAULT_OPPOSITE_VIRTUES.map(v => ({ value: v, label: v }))}
            selected={buenaObra.virtues}
            onChange={(v) => updateField('virtues', v)}
            allowCustom
          />
          
          <MultiSelect
            label="Aspectos espirituales"
            options={DEFAULT_SPIRITUAL_ASPECTS.map(v => ({ value: v, label: v }))}
            selected={buenaObra.spiritualAspects}
            onChange={(v) => updateField('spiritualAspects', v)}
            allowCustom
          />
        </section>
        
        {/* Relations */}
        <section className="space-y-4">
          <h2 className="text-ios-headline text-foreground">Relaciones</h2>
          
          <MultiSelect
            label="Prójimo implicado"
            options={personTypes.map(p => ({ value: p.id, label: p.name }))}
            selected={buenaObra.involvedPersonTypes}
            onChange={(v) => updateField('involvedPersonTypes', v)}
          />
          
          <div>
            <label className="text-ios-caption text-muted-foreground uppercase tracking-wide block mb-2">
              Actividades asociadas
            </label>
            <div className="flex flex-wrap gap-2">
              {activities.map(a => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    const newSelected = buenaObra.associatedActivities.includes(a.id)
                      ? buenaObra.associatedActivities.filter(v => v !== a.id)
                      : [...buenaObra.associatedActivities, a.id];
                    updateField('associatedActivities', newSelected);
                  }}
                  className={cn(
                    "py-1.5 px-3 rounded-full text-ios-subhead transition-colors",
                    buenaObra.associatedActivities.includes(a.id)
                      ? "bg-accent text-accent-foreground"
                      : "bg-card border border-border text-foreground active:bg-muted/50"
                  )}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>
          
          <MultiSelect
            label="Etiquetas"
            options={[]}
            selected={buenaObra.tags}
            onChange={(v) => updateField('tags', v)}
            allowCustom
          />
        </section>
        
        {/* Disabled state */}
        <section className="space-y-4">
          <h2 className="text-ios-headline text-foreground">Estado</h2>
          
          <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
            <div>
              <span className="text-ios-body text-foreground">Deshabilitado</span>
              <p className="text-ios-caption text-muted-foreground">No aparecerá en exámenes</p>
            </div>
            <button
              type="button"
              onClick={() => updateField('isDisabled', !buenaObra.isDisabled)}
              className={cn(
                "w-12 h-7 rounded-full transition-colors relative",
                buenaObra.isDisabled ? "bg-destructive" : "bg-muted"
              )}
            >
              <div className={cn(
                "absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform",
                buenaObra.isDisabled ? "translate-x-6" : "translate-x-1"
              )} />
            </button>
          </div>
        </section>
        
        {/* Alternative save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!buenaObra.name.trim()}
          className="w-full py-4 bg-accent text-accent-foreground rounded-xl text-ios-body font-medium flex items-center justify-center gap-2 active:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Guardar buena obra
        </button>
        
        {/* Delete button */}
        {!isNew && (
          <button
            type="button"
            onClick={handleDelete}
            className="w-full py-4 bg-destructive/10 text-destructive rounded-xl text-ios-body font-medium flex items-center justify-center gap-2 active:opacity-90 transition-opacity"
          >
            <Trash2 className="w-5 h-5" />
            Eliminar buena obra
          </button>
        )}
      </div>
    </div>
  );
}

export default BuenaObraEditPage;
