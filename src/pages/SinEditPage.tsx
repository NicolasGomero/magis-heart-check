import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { IOSHeader } from "@/components/IOSHeader";
import { getSin, createSin, updateSin, deleteSin, getSins } from "@/lib/sins.storage";
import { toast } from "sonner";
import { getPersonTypes, getActivities } from "@/lib/entities";
import {
  createDefaultSin,
  TERM_LABELS,
  GRAVITY_LABELS,
  MATERIA_TIPO_LABELS,
  MANIFESTATION_LABELS,
  OBJECT_TYPE_LABELS,
  MODE_LABELS,
  RESET_CYCLE_LABELS,
  DEFAULT_OPPOSITE_VIRTUES,
  DEFAULT_CAPITAL_SINS,
  DEFAULT_VOWS,
  DEFAULT_SPIRITUAL_ASPECTS,
  COLOR_PALETTES,
  deduceAdmiteParvedad,
  type Term,
  type Gravity,
  type MateriaTipo,
  type Manifestation,
  type ObjectType,
  type Mode,
  type ResetCycle,
  type Sin,
} from "@/lib/sins.types";
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
        {/* Show custom values not in options */}
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

export function SinEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = id === "new";
  
  const [sin, setSin] = useState<Sin>(() => {
    if (isNew) {
      return createDefaultSin('temp');
    }
    return getSin(id!) || createDefaultSin('temp');
  });
  
  const [personTypes] = useState(getPersonTypes);
  const [activities] = useState(getActivities);
  
  const updateField = <K extends keyof Sin>(field: K, value: Sin[K]) => {
    setSin(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-deduce admiteParvedad when materiaTipo changes
      if (field === 'materiaTipo') {
        updated.admiteParvedad = deduceAdmiteParvedad(value as MateriaTipo[]);
      }
      
      return updated;
    });
  };
  
  const handleSave = () => {
    if (!sin.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    
    console.log('[SinEditPage] handleSave called, sin name:', sin.name);
    
    if (isNew) {
      const created = createSin(sin);
      console.log('[SinEditPage] Sin created:', created.id, created.name);
      toast.success(`Pecado "${sin.name}" guardado`);
    } else {
      updateSin(id!, sin);
      toast.success(`Pecado "${sin.name}" actualizado`);
    }
    
    // Verify it was saved
    const allSins = getSins();
    console.log('[SinEditPage] After save, total sins:', allSins.length, allSins.map(s => s.name));
    
    navigate("/sins");
  };
  
  const handleDelete = () => {
    if (!isNew && confirm('¿Eliminar este pecado?')) {
      deleteSin(id!);
      navigate("/sins");
    }
  };
  
  return (
    <div className="min-h-screen bg-background pb-8">
      <IOSHeader 
        title={isNew ? "Nuevo pecado" : "Editar pecado"}
        onBack={() => navigate(-1)}
        rightAction={
          <button 
            type="button"
            onClick={() => {
              console.log('[SinEditPage] Save button clicked');
              handleSave();
            }}
            disabled={!sin.name.trim()}
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
              value={sin.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Nombre del pecado"
              className="w-full bg-card border border-border rounded-xl p-4 text-ios-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          
          <div>
            <label className="text-ios-caption text-muted-foreground uppercase tracking-wide block mb-2">
              Descripción corta
            </label>
            <input
              value={sin.shortDescription}
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
              value={sin.extraInfo}
              onChange={(e) => updateField('extraInfo', e.target.value)}
              placeholder="Información extendida..."
              rows={3}
              className="w-full bg-card border border-border rounded-xl p-4 text-ios-body text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
        </section>
        
        {/* Moral classification */}
        <section className="space-y-4">
          <h2 className="text-ios-headline text-foreground">Clasificación moral</h2>
          
          <MultiSelect
            label="Término"
            options={Object.entries(TERM_LABELS).map(([value, label]) => ({ 
              value: value as Term, 
              label 
            }))}
            selected={sin.terms}
            onChange={(v) => updateField('terms', v)}
          />
          
          <MultiSelect
            label="Gravedad"
            options={Object.entries(GRAVITY_LABELS).map(([value, label]) => ({ 
              value: value as Gravity, 
              label 
            }))}
            selected={sin.gravities}
            onChange={(v) => updateField('gravities', v)}
          />
          
          <MultiSelect
            label="Tipo de materia"
            options={Object.entries(MATERIA_TIPO_LABELS).map(([value, label]) => ({ 
              value: value as MateriaTipo, 
              label 
            }))}
            selected={sin.materiaTipo}
            onChange={(v) => updateField('materiaTipo', v)}
          />
          
          <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
            <span className="text-ios-body text-foreground">Admite parvedad</span>
            <button
              type="button"
              onClick={() => updateField('admiteParvedad', !sin.admiteParvedad)}
              className={cn(
                "w-12 h-7 rounded-full transition-colors relative",
                sin.admiteParvedad ? "bg-accent" : "bg-muted"
              )}
            >
              <div className={cn(
                "absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform",
                sin.admiteParvedad ? "translate-x-6" : "translate-x-1"
              )} />
            </button>
          </div>
        </section>
        
        {/* Other characteristics */}
        <section className="space-y-4">
          <h2 className="text-ios-headline text-foreground">Características</h2>
          
          <MultiSelect
            label="Virtudes opuestas"
            options={DEFAULT_OPPOSITE_VIRTUES.map(v => ({ value: v, label: v }))}
            selected={sin.oppositeVirtues}
            onChange={(v) => updateField('oppositeVirtues', v)}
            allowCustom
          />
          
          <MultiSelect
            label="Pecado capital"
            options={DEFAULT_CAPITAL_SINS.map(v => ({ value: v, label: v }))}
            selected={sin.capitalSins}
            onChange={(v) => updateField('capitalSins', v)}
          />
          
          <MultiSelect
            label="Voto"
            options={DEFAULT_VOWS.map(v => ({ value: v, label: v }))}
            selected={sin.vows}
            onChange={(v) => updateField('vows', v)}
          />
          
          <MultiSelect
            label="Aspectos espirituales"
            options={DEFAULT_SPIRITUAL_ASPECTS.map(v => ({ value: v, label: v }))}
            selected={sin.spiritualAspects}
            onChange={(v) => updateField('spiritualAspects', v)}
            allowCustom
          />
          
          <MultiSelect
            label="Manifestación"
            options={Object.entries(MANIFESTATION_LABELS).map(([value, label]) => ({ 
              value: value as Manifestation, 
              label 
            }))}
            selected={sin.manifestations}
            onChange={(v) => updateField('manifestations', v)}
          />
          
          <MultiSelect
            label="Tipo de objeto"
            options={Object.entries(OBJECT_TYPE_LABELS).map(([value, label]) => ({ 
              value: value as ObjectType, 
              label 
            }))}
            selected={sin.objectTypes}
            onChange={(v) => updateField('objectTypes', v)}
          />
          
          <MultiSelect
            label="Modo"
            options={Object.entries(MODE_LABELS).map(([value, label]) => ({ 
              value: value as Mode, 
              label 
            }))}
            selected={sin.modes}
            onChange={(v) => updateField('modes', v)}
          />
        </section>
        
        {/* Relations */}
        <section className="space-y-4">
          <h2 className="text-ios-headline text-foreground">Relaciones</h2>
          
          <MultiSelect
            label="Tipos de persona involucrados"
            options={personTypes.map(p => ({ value: p.id, label: p.name }))}
            selected={sin.involvedPersonTypes}
            onChange={(v) => updateField('involvedPersonTypes', v)}
          />
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-ios-caption text-muted-foreground uppercase tracking-wide">
                Actividades asociadas
              </label>
              <button
                type="button"
                onClick={() => {/* TODO: navigate to create activity */}}
                className="text-accent text-ios-caption flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Nueva
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activities.map(a => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    const newSelected = sin.associatedActivities.includes(a.id)
                      ? sin.associatedActivities.filter(v => v !== a.id)
                      : [...sin.associatedActivities, a.id];
                    updateField('associatedActivities', newSelected);
                  }}
                  className={cn(
                    "py-1.5 px-3 rounded-full text-ios-subhead transition-colors",
                    sin.associatedActivities.includes(a.id)
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
            selected={sin.tags}
            onChange={(v) => updateField('tags', v)}
            allowCustom
          />
        </section>
        
        {/* Settings */}
        <section className="space-y-4">
          <h2 className="text-ios-headline text-foreground">Configuración</h2>
          
          <MultiSelect
            label="Ciclo de reinicio"
            options={Object.entries(RESET_CYCLE_LABELS).map(([value, label]) => ({ 
              value: value as ResetCycle, 
              label 
            }))}
            selected={[sin.resetCycle]}
            onChange={(v) => updateField('resetCycle', v[v.length - 1] || 'no')}
          />
          
          <div>
            <label className="text-ios-caption text-muted-foreground uppercase tracking-wide block mb-2">
              Paleta de colores
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(COLOR_PALETTES).map(([key, palette]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateField('colorPaletteKey', key)}
                  className={cn(
                    "py-2 px-3 rounded-xl transition-colors flex items-center gap-2",
                    sin.colorPaletteKey === key
                      ? "bg-accent text-accent-foreground"
                      : "bg-card border border-border text-foreground"
                  )}
                >
                  <div className="flex gap-0.5">
                    {palette.colors.map((color, i) => (
                      <div 
                        key={i} 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: color }} 
                      />
                    ))}
                  </div>
                  <span className="text-ios-caption">{palette.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
        
        {/* Aggregation */}
        <section className="space-y-4">
          <h2 className="text-ios-headline text-foreground">Acumulación</h2>
          
          <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
            <span className="text-ios-body text-foreground">Puede acumular a mortal</span>
            <button
              type="button"
              onClick={() => updateField('canAggregateToMortal', !sin.canAggregateToMortal)}
              className={cn(
                "w-12 h-7 rounded-full transition-colors relative",
                sin.canAggregateToMortal ? "bg-accent" : "bg-muted"
              )}
            >
              <div className={cn(
                "absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform",
                sin.canAggregateToMortal ? "translate-x-6" : "translate-x-1"
              )} />
            </button>
          </div>
          
          {sin.canAggregateToMortal && (
            <div>
              <label className="text-ios-caption text-muted-foreground uppercase tracking-wide block mb-2">
                Umbral para mortal (unidades)
              </label>
              <input
                type="number"
                value={sin.mortalThresholdUnits}
                onChange={(e) => updateField('mortalThresholdUnits', parseInt(e.target.value) || 10)}
                min={1}
                className="w-full bg-card border border-border rounded-xl p-4 text-ios-body text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          )}
          
          <div>
            <label className="text-ios-caption text-muted-foreground uppercase tracking-wide block mb-2">
              Unidades por toque
            </label>
            <input
              type="number"
              value={sin.unitPerTap}
              onChange={(e) => updateField('unitPerTap', parseInt(e.target.value) || 1)}
              min={1}
              className="w-full bg-card border border-border rounded-xl p-4 text-ios-body text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          
          <div>
            <label className="text-ios-caption text-muted-foreground uppercase tracking-wide block mb-2">
              Peso manual (opcional)
            </label>
            <input
              type="number"
              value={sin.manualWeightOverride ?? ''}
              onChange={(e) => updateField('manualWeightOverride', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Dejar vacío para peso automático"
              className="w-full bg-card border border-border rounded-xl p-4 text-ios-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
        </section>
        
        {/* Delete button */}
        {!isNew && (
          <button
            onClick={handleDelete}
            className="w-full py-4 bg-destructive/10 text-destructive rounded-xl text-ios-body font-medium flex items-center justify-center gap-2 active:opacity-90 transition-opacity"
          >
            <Trash2 className="w-5 h-5" />
            Eliminar pecado
          </button>
        )}
      </div>
    </div>
  );
}

export default SinEditPage;
