import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { IOSHeader } from "@/components/IOSHeader";
import { getBuenaObra, createBuenaObra, updateBuenaObra, deleteBuenaObra } from "@/lib/buenasObras.storage";
import { toast } from "sonner";
import { getPersonTypes, getActivities } from "@/lib/entities";
import {
  createDefaultBuenaObra,
  BUENA_OBRA_TERM_LABELS,
  PURITY_LABELS,
  MANIFESTACION_LABELS,
  RESET_CYCLE_LABELS,
  COLOR_PALETTES,
  type BuenaObraTerm,
  type PurityOfIntention,
  type BuenaObraManifestacion,
  type ResetCycle,
  type ColorPalette,
  type BuenaObra,
} from "@/lib/buenasObras.types";
import { VIRTUES_TEOLOGALES, VIRTUES_CARDINALES, DEFAULT_CAPITAL_SINS, DEFAULT_VOWS } from "@/lib/sins.types";
import { VIRTUDES_ANEXAS_PRINCIPALES } from "@/lib/virtudesAnexas";
import { MEDIOS_ESPIRITUALES_INICIAL, ALL_MEDIOS_ESPIRITUALES } from "@/lib/mediosEspirituales";
import { SEED_CONDICIONANTES } from "@/lib/condicionantes";
import { cn } from "@/lib/utils";

// Storage keys for temporary selection persistence
const MEDIOS_SELECTION_KEY = 'magis_medios_selection';
const VIRTUDES_SELECTION_KEY = 'magis_virtudes_selection';

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

// ========== Navigable Multi-select Component ==========

interface NavigableMultiSelectProps {
  label: string;
  initialOptions: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  navigateTo: string;
  storageKey: string;
  allowCustom?: boolean;
}

function NavigableMultiSelect({
  label,
  initialOptions,
  selected,
  onChange,
  navigateTo,
  storageKey,
  allowCustom = false,
}: NavigableMultiSelectProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [customValue, setCustomValue] = useState('');
  
  // Check for updates from the selection page on mount and location changes
  useEffect(() => {
    const storedSelection = localStorage.getItem(storageKey);
    if (storedSelection) {
      try {
        const parsed = JSON.parse(storedSelection);
        if (Array.isArray(parsed)) {
          onChange(parsed);
        }
      } catch (e) {
        // Ignore parse errors
      }
      // Clear the storage after reading
      localStorage.removeItem(storageKey);
    }
  }, [location.pathname, storageKey]);
  
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
  
  // Combine initial options with any selected values not in initial
  const allVisibleOptions = [
    ...initialOptions.slice(0, 10),
    ...selected.filter(s => !initialOptions.slice(0, 10).includes(s))
  ];
  
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-ios-caption text-muted-foreground uppercase tracking-wide">
          {label}
        </label>
        <button
          type="button"
          onClick={() => navigate(navigateTo, { state: { selected, returnPath: location.pathname } })}
          className="text-accent text-ios-subhead flex items-center gap-1 py-2 px-3 -mr-3 active:opacity-70 transition-opacity"
        >
          Ver más
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {allVisibleOptions.map(opt => (
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
    const existing = getBuenaObra(id!);
    if (existing) {
      // Merge with defaults to ensure all new fields exist
      return { ...createDefaultBuenaObra(id!), ...existing };
    }
    return createDefaultBuenaObra('temp');
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
        {/* 1. Nombre */}
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
        
        {/* 2. Descripción corta */}
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
        
        {/* 3. Información adicional */}
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
        
        {/* 4. Término */}
        <MultiSelect
          label="Término"
          options={Object.entries(BUENA_OBRA_TERM_LABELS).map(([value, label]) => ({
            value: value as BuenaObraTerm,
            label,
          }))}
          selected={buenaObra.terms}
          onChange={(v) => updateField('terms', v)}
        />
        
        {/* 5. Prójimo implicado */}
        <MultiSelect
          label="Prójimo implicado"
          options={personTypes.map(p => ({ value: p.id, label: p.name }))}
          selected={buenaObra.involvedPersonTypes}
          onChange={(v) => updateField('involvedPersonTypes', v)}
        />
        
        {/* 6. Virtud teologal */}
        <MultiSelect
          label="Virtud teologal"
          options={VIRTUES_TEOLOGALES.map(v => ({ value: v, label: v }))}
          selected={buenaObra.virtudesTeologales}
          onChange={(v) => updateField('virtudesTeologales', v)}
        />
        
        {/* 7. Virtud moral cardinal */}
        <MultiSelect
          label="Virtud moral cardinal"
          options={VIRTUES_CARDINALES.map(v => ({ value: v, label: v }))}
          selected={buenaObra.virtudesCardinales}
          onChange={(v) => updateField('virtudesCardinales', v)}
        />
        
        {/* 8. Virtud moral anexa (principales) */}
        <NavigableMultiSelect
          label="Virtud moral anexa (principales)"
          initialOptions={VIRTUDES_ANEXAS_PRINCIPALES}
          selected={buenaObra.virtudesAnexas}
          onChange={(v) => updateField('virtudesAnexas', v)}
          navigateTo="/virtudes-anexas"
          storageKey={VIRTUDES_SELECTION_KEY}
          allowCustom
        />
        
        {/* 9. Voto */}
        <MultiSelect
          label="Voto"
          options={DEFAULT_VOWS.map(v => ({ value: v, label: v }))}
          selected={buenaObra.vows}
          onChange={(v) => updateField('vows', v)}
        />
        
        {/* 10. Pecado capital */}
        <MultiSelect
          label="Pecado capital"
          options={DEFAULT_CAPITAL_SINS.map(v => ({ value: v, label: v }))}
          selected={buenaObra.capitalSins}
          onChange={(v) => updateField('capitalSins', v)}
        />
        
        {/* 11. Medios espirituales */}
        <NavigableMultiSelect
          label="Medios espirituales"
          initialOptions={MEDIOS_ESPIRITUALES_INICIAL}
          selected={buenaObra.mediosEspirituales}
          onChange={(v) => updateField('mediosEspirituales', v)}
          navigateTo="/medios-espirituales"
          storageKey={MEDIOS_SELECTION_KEY}
          allowCustom
        />
        
        {/* 12. Manifestación */}
        <MultiSelect
          label="Manifestación"
          options={Object.entries(MANIFESTACION_LABELS).map(([value, label]) => ({
            value: value as BuenaObraManifestacion,
            label,
          }))}
          selected={buenaObra.manifestaciones}
          onChange={(v) => updateField('manifestaciones', v)}
        />
        
        {/* 13. Condicionantes compatibles */}
        <MultiSelect
          label="CONDICIONANTES COMPATIBLES"
          options={[...SEED_CONDICIONANTES].map(c => ({ value: c, label: c }))}
          selected={buenaObra.condicionantes}
          onChange={(v) => updateField('condicionantes', v)}
          allowCustom
        />
        
        {/* 14. Actividades asociadas */}
        <MultiSelect
          label="Actividades asociadas"
          options={activities.map(a => ({ value: a.id, label: a.name }))}
          selected={buenaObra.associatedActivities}
          onChange={(v) => updateField('associatedActivities', v)}
        />
        
        {/* 15. Etiquetas */}
        <MultiSelect
          label="Etiquetas"
          options={[]}
          selected={buenaObra.tags}
          onChange={(v) => updateField('tags', v)}
          allowCustom
        />
        
        {/* 16. Pureza de intención */}
        <SingleSelect
          label="Pureza de intención"
          options={Object.entries(PURITY_LABELS).map(([value, label]) => ({
            value: value as PurityOfIntention,
            label,
          }))}
          selected={buenaObra.purityOfIntention}
          onChange={(v) => updateField('purityOfIntention', v)}
        />
        
        {/* 17. Mostrar en examen */}
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
        
        {/* 18. Unidades por toque */}
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
        
        {/* 19. Ciclo de reinicio */}
        <SingleSelect
          label="Ciclo de reinicio"
          options={Object.entries(RESET_CYCLE_LABELS).map(([value, label]) => ({
            value: value as ResetCycle,
            label,
          }))}
          selected={buenaObra.resetCycle}
          onChange={(v) => updateField('resetCycle', v)}
        />
        
        {/* 20. Paleta de colores */}
        <div>
          <label className="text-ios-caption text-muted-foreground uppercase tracking-wide block mb-2">
            Paleta de colores
          </label>
          <div className="flex flex-wrap gap-3">
            {COLOR_PALETTES.map(palette => (
              <button
                key={palette}
                type="button"
                onClick={() => updateField('colorPalette', palette)}
                className={cn(
                  "w-10 h-10 rounded-full border-2 transition-all",
                  palette === 'blue' && "bg-blue-500",
                  palette === 'green' && "bg-green-500",
                  palette === 'purple' && "bg-purple-500",
                  palette === 'orange' && "bg-orange-500",
                  palette === 'pink' && "bg-pink-500",
                  palette === 'teal' && "bg-teal-500",
                  buenaObra.colorPalette === palette
                    ? "border-foreground scale-110"
                    : "border-transparent"
                )}
              />
            ))}
          </div>
        </div>
        
        {/* 21. Deshabilitado */}
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
