import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, Info, ChevronRight } from "lucide-react";
import { IOSHeader } from "@/components/IOSHeader";
import { getSin, createSin, updateSin, deleteSin } from "@/lib/sins.storage";
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
  VIRTUES_TEOLOGALES,
  VIRTUES_CARDINALES,
  VIRTUES_ANEXAS_INICIAL,
  VIRTUES_ANEXAS_COMPLETA,
  DEFAULT_CAPITAL_SINS,
  DEFAULT_VOWS,
  DEFAULT_SPIRITUAL_MEANS,
  DEFAULT_CONDICIONANTES,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// ========== Multi-select Component ==========

interface MultiSelectProps<T extends string> {
  label: string;
  labelIcon?: React.ReactNode;
  onInfoClick?: () => void;
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (selected: T[]) => void;
  allowCustom?: boolean;
}

function MultiSelect<T extends string>({ 
  label, 
  labelIcon,
  onInfoClick,
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
      <div className="flex items-center gap-2 mb-2">
        <label className="text-ios-caption text-muted-foreground uppercase tracking-wide">
          {label}
        </label>
        {labelIcon}
        {onInfoClick && (
          <button 
            type="button" 
            onClick={onInfoClick}
            className="text-primary"
          >
            <Info className="w-4 h-4" />
          </button>
        )}
      </div>
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

// ========== Expandable Multi-select with "Ver más" ==========

interface ExpandableMultiSelectProps {
  label: string;
  initialOptions: string[];
  allOptions: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  allowCustom?: boolean;
  sheetTitle: string;
}

function ExpandableMultiSelect({
  label,
  initialOptions,
  allOptions,
  selected,
  onChange,
  allowCustom = false,
  sheetTitle,
}: ExpandableMultiSelectProps) {
  const [showSheet, setShowSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customValue, setCustomValue] = useState('');
  
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };
  
  const addCustom = () => {
    if (customValue.trim() && !selected.includes(customValue.trim())) {
      onChange([...selected, customValue.trim()]);
      setCustomValue('');
    }
  };
  
  const filteredOptions = allOptions.filter(opt =>
    opt.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div>
      <label className="text-ios-caption text-muted-foreground uppercase tracking-wide block mb-2">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {initialOptions.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={cn(
              "py-1.5 px-3 rounded-full text-ios-subhead transition-colors",
              selected.includes(opt)
                ? "bg-accent text-accent-foreground"
                : "bg-card border border-border text-foreground active:bg-muted/50"
            )}
          >
            {opt}
          </button>
        ))}
        {/* Show selected values not in initial options */}
        {selected
          .filter(v => !initialOptions.includes(v))
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
      
      <button
        type="button"
        onClick={() => setShowSheet(true)}
        className="flex items-center gap-1 mt-2 text-primary text-ios-caption"
      >
        Ver más <ChevronRight className="w-3 h-3" />
      </button>
      
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
      
      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>{sheetTitle}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-ios-body text-foreground placeholder:text-muted-foreground/50"
            />
            <div className="flex flex-wrap gap-2 max-h-[50vh] overflow-auto">
              {filteredOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggle(opt)}
                  className={cn(
                    "py-1.5 px-3 rounded-full text-ios-subhead transition-colors",
                    selected.includes(opt)
                      ? "bg-accent text-accent-foreground"
                      : "bg-card border border-border text-foreground"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ========== Main Component ==========

export function SinEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id || id === "new";
  
  const [sin, setSin] = useState<Sin>(() => {
    if (isNew) {
      return createDefaultSin('temp');
    }
    return getSin(id!) || createDefaultSin('temp');
  });
  
  const [personTypes] = useState(getPersonTypes);
  const [activities] = useState(getActivities);
  const [showMateriaInfo, setShowMateriaInfo] = useState(false);
  
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
    
    if (isNew) {
      createSin(sin);
      toast.success(`Pecado "${sin.name}" guardado`);
    } else {
      updateSin(id!, sin);
      toast.success(`Pecado "${sin.name}" actualizado`);
    }
    
    setTimeout(() => {
      navigate("/obras/pecados");
    }, 100);
  };
  
  const handleDelete = () => {
    if (!isNew && confirm('¿Eliminar este pecado?')) {
      deleteSin(id!);
      navigate("/obras/pecados");
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
            onClick={handleSave}
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
            onInfoClick={() => setShowMateriaInfo(true)}
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
        
        {/* Virtues - split into 3 categories */}
        <section className="space-y-4">
          <h2 className="text-ios-headline text-foreground">Virtudes opuestas</h2>
          
          <MultiSelect
            label="Virtud teologal"
            options={VIRTUES_TEOLOGALES.map(v => ({ value: v, label: v }))}
            selected={sin.oppositeVirtues.filter(v => VIRTUES_TEOLOGALES.includes(v))}
            onChange={(v) => {
              const otherVirtues = sin.oppositeVirtues.filter(ov => !VIRTUES_TEOLOGALES.includes(ov));
              updateField('oppositeVirtues', [...v, ...otherVirtues]);
            }}
          />
          
          <MultiSelect
            label="Virtud moral cardinal"
            options={VIRTUES_CARDINALES.map(v => ({ value: v, label: v }))}
            selected={sin.oppositeVirtues.filter(v => VIRTUES_CARDINALES.includes(v))}
            onChange={(v) => {
              const otherVirtues = sin.oppositeVirtues.filter(ov => !VIRTUES_CARDINALES.includes(ov));
              updateField('oppositeVirtues', [...otherVirtues, ...v]);
            }}
          />
          
          <ExpandableMultiSelect
            label="Virtud moral anexa"
            initialOptions={VIRTUES_ANEXAS_INICIAL}
            allOptions={VIRTUES_ANEXAS_COMPLETA}
            selected={sin.oppositeVirtues.filter(v => 
              !VIRTUES_TEOLOGALES.includes(v) && !VIRTUES_CARDINALES.includes(v)
            )}
            onChange={(v) => {
              const teologales = sin.oppositeVirtues.filter(ov => VIRTUES_TEOLOGALES.includes(ov));
              const cardinales = sin.oppositeVirtues.filter(ov => VIRTUES_CARDINALES.includes(ov));
              updateField('oppositeVirtues', [...teologales, ...cardinales, ...v]);
            }}
            allowCustom
            sheetTitle="Virtudes morales anexas"
          />
        </section>
        
        {/* Other characteristics */}
        <section className="space-y-4">
          <h2 className="text-ios-headline text-foreground">Características</h2>
          
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
          
          <ExpandableMultiSelect
            label="Medios espirituales"
            initialOptions={DEFAULT_SPIRITUAL_MEANS.slice(0, 10)}
            allOptions={DEFAULT_SPIRITUAL_MEANS}
            selected={sin.spiritualAspects}
            onChange={(v) => updateField('spiritualAspects', v)}
            allowCustom
            sheetTitle="Medios espirituales"
          />
          
          <MultiSelect
            label="Condicionantes"
            options={DEFAULT_CONDICIONANTES.map(v => ({ value: v, label: v }))}
            selected={sin.condicionantes}
            onChange={(v) => updateField('condicionantes', v)}
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
            label="Prójimo implicado"
            options={personTypes.map(p => ({ value: p.id, label: p.name }))}
            selected={sin.involvedPersonTypes}
            onChange={(v) => updateField('involvedPersonTypes', v)}
          />
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-ios-caption text-muted-foreground uppercase tracking-wide">
                Actividades asociadas
              </label>
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
              onClick={() => updateField('isDisabled', !sin.isDisabled)}
              className={cn(
                "w-12 h-7 rounded-full transition-colors relative",
                sin.isDisabled ? "bg-destructive" : "bg-muted"
              )}
            >
              <div className={cn(
                "absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform",
                sin.isDisabled ? "translate-x-6" : "translate-x-1"
              )} />
            </button>
          </div>
        </section>
        
        {/* Alternative save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!sin.name.trim()}
          className="w-full py-4 bg-accent text-accent-foreground rounded-xl text-ios-body font-medium flex items-center justify-center gap-2 active:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Guardar pecado
        </button>
        
        {/* Delete button */}
        {!isNew && (
          <button
            type="button"
            onClick={handleDelete}
            className="w-full py-4 bg-destructive/10 text-destructive rounded-xl text-ios-body font-medium flex items-center justify-center gap-2 active:opacity-90 transition-opacity"
          >
            <Trash2 className="w-5 h-5" />
            Eliminar pecado
          </button>
        )}
      </div>
      
      {/* Materia Info Dialog */}
      <Dialog open={showMateriaInfo} onOpenChange={setShowMateriaInfo}>
        <DialogContent className="bg-popover">
          <DialogHeader>
            <DialogTitle>Tipo de materia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-ios-body text-foreground">
            <div>
              <p className="font-semibold">Grave ex toto</p>
              <p className="text-muted-foreground text-ios-caption">
                La materia es siempre grave, sin posibilidad de parvedad. Cualquier acto voluntario constituye materia grave.
              </p>
            </div>
            <div>
              <p className="font-semibold">Grave ex genere</p>
              <p className="text-muted-foreground text-ios-caption">
                Por su naturaleza es materia grave, pero admite parvedad según la cantidad o circunstancias. Ej: hurto de cantidad pequeña.
              </p>
            </div>
            <div>
              <p className="font-semibold">Venial de propio género</p>
              <p className="text-muted-foreground text-ios-caption">
                Por su naturaleza solo es materia leve. No puede convertirse en pecado mortal por acumulación de materia.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SinEditPage;
