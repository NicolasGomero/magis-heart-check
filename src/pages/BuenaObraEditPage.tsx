import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { IOSHeader } from "@/components/IOSHeader";
import { getBuenaObra, createBuenaObra, updateBuenaObra, deleteBuenaObra } from "@/lib/buenasObras.storage";
import { toast } from "sonner";
import { getPersonTypes, getActivities } from "@/lib/entities";
import {
  createDefaultBuenaObra,
  BUENA_OBRA_TERM_LABELS,
  SACRIFICIO_LABELS,
  PURITY_LABELS,
  DEFAULT_CATEGORIES,
  DEFAULT_THEOLOGICAL_AXES,
  DEFAULT_BUENA_OBRA_VIRTUES,
  DEFAULT_BUENA_OBRA_CONDICIONANTES,
  type BuenaObraTerm,
  type SacrificioRelativo,
  type PurityOfIntention,
  type BuenaObra,
} from "@/lib/buenasObras.types";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

// ========== Single Select Component ==========

interface SingleSelectProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  selected: T;
  onChange: (selected: T) => void;
}

function SingleSelect<T extends string>({ 
  label, 
  options, 
  selected, 
  onChange,
}: SingleSelectProps<T>) {
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
            onClick={() => onChange(opt.value)}
            className={cn(
              "py-1.5 px-3 rounded-full text-ios-subhead transition-colors",
              selected === opt.value
                ? "bg-accent text-accent-foreground"
                : "bg-card border border-border text-foreground active:bg-muted/50"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
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
        {/* A) Identidad */}
        <section className="space-y-4">
          <h2 className="text-ios-headline text-foreground">Identidad</h2>
          
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
          
          <MultiSelect
            label="Etiquetas"
            options={[]}
            selected={buenaObra.tags}
            onChange={(v) => updateField('tags', v)}
            allowCustom
          />
        </section>
        
        {/* B) Clasificación */}
        <section className="space-y-4">
          <h2 className="text-ios-headline text-foreground">Clasificación</h2>
          
          <MultiSelect
            label="Categoría"
            options={DEFAULT_CATEGORIES.map(c => ({ value: c, label: c }))}
            selected={buenaObra.category}
            onChange={(v) => updateField('category', v)}
            allowCustom
          />
          
          <MultiSelect
            label="Eje teológico"
            options={DEFAULT_THEOLOGICAL_AXES.map(a => ({ value: a, label: a }))}
            selected={buenaObra.theologicalAxis}
            onChange={(v) => updateField('theologicalAxis', v)}
            allowCustom
          />
          
          <MultiSelect
            label="Virtudes relacionadas"
            options={DEFAULT_BUENA_OBRA_VIRTUES.map(v => ({ value: v, label: v }))}
            selected={buenaObra.relatedVirtues}
            onChange={(v) => updateField('relatedVirtues', v)}
            allowCustom
          />
        </section>
        
        {/* C) Contexto sugerido */}
        <section className="space-y-4">
          <h2 className="text-ios-headline text-foreground">Contexto sugerido</h2>
          
          <MultiSelect
            label="Prójimo implicado"
            options={personTypes.map(p => ({ value: p.id, label: p.name }))}
            selected={buenaObra.involvedPersonTypes}
            onChange={(v) => updateField('involvedPersonTypes', v)}
          />
          
          <MultiSelect
            label="Actividades asociadas"
            options={activities.map(a => ({ value: a.id, label: a.name }))}
            selected={buenaObra.associatedActivities}
            onChange={(v) => updateField('associatedActivities', v)}
          />
        </section>
        
        {/* D) Condicionantes */}
        <section className="space-y-4">
          <h2 className="text-ios-headline text-foreground">Condicionantes</h2>
          <p className="text-ios-caption text-muted-foreground -mt-2">
            Marcar con qué condicionantes del sujeto es compatible (amplificación selectiva)
          </p>
          
          <MultiSelect
            label="Condicionantes compatibles"
            options={DEFAULT_BUENA_OBRA_CONDICIONANTES.map(c => ({ value: c, label: c }))}
            selected={buenaObra.condicionantes}
            onChange={(v) => updateField('condicionantes', v)}
            allowCustom
          />
        </section>
        
        {/* E) Coste/cantidad */}
        <section className="space-y-4">
          <h2 className="text-ios-headline text-foreground">Coste / cantidad</h2>
          
          <SingleSelect
            label="Sacrificio relativo"
            options={Object.entries(SACRIFICIO_LABELS).map(([value, label]) => ({
              value: value as SacrificioRelativo,
              label,
            }))}
            selected={buenaObra.sacrificioRelativo}
            onChange={(v) => updateField('sacrificioRelativo', v)}
          />
          
          <div>
            <label className="text-ios-caption text-muted-foreground uppercase tracking-wide block mb-2">
              Tiempo estimado (minutos)
            </label>
            <input
              type="number"
              value={buenaObra.timeEstimateMin ?? ''}
              onChange={(e) => updateField('timeEstimateMin', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Opcional"
              min={1}
              className="w-full bg-card border border-border rounded-xl p-4 text-ios-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          
          <div>
            <label className="text-ios-caption text-muted-foreground uppercase tracking-wide block mb-2">
              Visibilidad
            </label>
            <input
              value={buenaObra.visibility ?? ''}
              onChange={(e) => updateField('visibility', e.target.value || undefined)}
              placeholder="Opcional (ej: Pública, Privada...)"
              className="w-full bg-card border border-border rounded-xl p-4 text-ios-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
        </section>
        
        {/* F) Ponderación interna (avanzado) */}
        <section className="space-y-4">
          <h2 className="text-ios-headline text-foreground">Ponderación interna</h2>
          <p className="text-ios-caption text-muted-foreground -mt-2">
            Configuración avanzada
          </p>
          
          <div>
            <label className="text-ios-caption text-muted-foreground uppercase tracking-wide block mb-2">
              Base good override
            </label>
            <input
              type="number"
              value={buenaObra.baseGoodOverride ?? ''}
              onChange={(e) => updateField('baseGoodOverride', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Dejar vacío para valor automático"
              className="w-full bg-card border border-border rounded-xl p-4 text-ios-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          
          <div>
            <label className="text-ios-caption text-muted-foreground uppercase tracking-wide block mb-2">
              Unidades por toque
            </label>
            <input
              type="number"
              value={buenaObra.unitPerTap}
              onChange={(e) => updateField('unitPerTap', parseInt(e.target.value) || 1)}
              min={1}
              className="w-full bg-card border border-border rounded-xl p-4 text-ios-body text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          
          <div>
            <label className="text-ios-caption text-muted-foreground uppercase tracking-wide block mb-2">
              Máximo por sesión
            </label>
            <input
              type="number"
              value={buenaObra.maxPerSession ?? ''}
              onChange={(e) => updateField('maxPerSession', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Sin límite"
              min={1}
              className="w-full bg-card border border-border rounded-xl p-4 text-ios-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
        </section>
        
        {/* Purity of intention */}
        <section className="space-y-4">
          <h2 className="text-ios-headline text-foreground">Pureza de intención</h2>
          
          <SingleSelect
            label="Valor por defecto"
            options={Object.entries(PURITY_LABELS).map(([value, label]) => ({
              value: value as PurityOfIntention,
              label,
            }))}
            selected={buenaObra.purityOfIntention}
            onChange={(v) => updateField('purityOfIntention', v)}
          />
          
          <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
            <div>
              <span className="text-ios-body text-foreground">Mostrar en examen</span>
              <p className="text-ios-caption text-muted-foreground">
                Permitir seleccionar pureza al registrar
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateField('showPurityInExam', !buenaObra.showPurityInExam)}
              className={cn(
                "w-12 h-7 rounded-full transition-colors relative",
                buenaObra.showPurityInExam ? "bg-accent" : "bg-muted"
              )}
            >
              <div className={cn(
                "absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform",
                buenaObra.showPurityInExam ? "translate-x-6" : "translate-x-1"
              )} />
            </button>
          </div>
        </section>
        
        {/* H) Estado */}
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
        
        {/* Save button */}
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
