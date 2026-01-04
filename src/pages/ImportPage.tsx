import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IOSHeader } from '@/components/IOSHeader';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  parseCSV,
  ImportColumnMapping,
  ImportPreview,
  importSins,
  ImportResult,
} from '@/lib/importUtils';
import { getPreferences } from '@/lib/preferences';
import { DuplicateStrategy } from '@/lib/preferences';

type ImportStep = 'upload' | 'preview' | 'mapping' | 'result';

const MAPPABLE_FIELDS: { key: keyof ImportColumnMapping; label: string; required?: boolean }[] = [
  { key: 'name', label: 'Nombre', required: true },
  { key: 'shortDescription', label: 'Descripción corta' },
  { key: 'extraInfo', label: 'Información extra' },
  { key: 'terms', label: 'Términos (contra Dios/Prójimo/Sí mismo)' },
  { key: 'gravities', label: 'Gravedad (mortal/venial)' },
  { key: 'materiaTipo', label: 'Tipo de materia' },
  { key: 'admiteParvedad', label: 'Admite parvedad' },
  { key: 'oppositeVirtues', label: 'Virtudes opuestas' },
  { key: 'capitalSins', label: 'Pecados capitales' },
  { key: 'vows', label: 'Votos' },
  { key: 'spiritualAspects', label: 'Aspectos espirituales' },
  { key: 'manifestations', label: 'Manifestación (externo/interno)' },
  { key: 'objectTypes', label: 'Tipo objeto (carnal/espiritual)' },
  { key: 'modes', label: 'Modo (comisión/omisión)' },
  { key: 'involvedPersonTypes', label: 'Prójimo implicado' },
  { key: 'associatedActivities', label: 'Actividades asociadas' },
  { key: 'resetCycle', label: 'Ciclo de reseteo' },
  { key: 'colorPaletteKey', label: 'Paleta de colores' },
  { key: 'tags', label: 'Etiquetas' },
  { key: 'canAggregateToMortal', label: 'Puede agregar a mortal' },
  { key: 'mortalThresholdUnits', label: 'Umbral mortal (unidades)' },
  { key: 'unitPerTap', label: 'Unidades por tap' },
  { key: 'manualWeightOverride', label: 'Peso manual' },
];

const DUPLICATE_LABELS: Record<DuplicateStrategy, string> = {
  skip: 'Omitir duplicados',
  overwrite: 'Sobrescribir duplicados',
  merge: 'Fusionar (solo campos vacíos)',
};

export function ImportPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<ImportStep>('upload');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mapping, setMapping] = useState<ImportColumnMapping>({ name: '' });
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>(
    getPreferences().defaultDuplicateStrategy
  );
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showAllRows, setShowAllRows] = useState(false);
  const [showAllErrors, setShowAllErrors] = useState(false);
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseCSV(content);
      setPreview(parsed);
      
      // Auto-map columns by name similarity
      const autoMapping: ImportColumnMapping = { name: '' };
      for (const field of MAPPABLE_FIELDS) {
        const matchingHeader = parsed.headers.find(h => 
          h.toLowerCase().includes(field.key.toLowerCase()) ||
          field.label.toLowerCase().includes(h.toLowerCase())
        );
        if (matchingHeader) {
          autoMapping[field.key] = matchingHeader;
        }
      }
      // Try to find name column
      const nameHeader = parsed.headers.find(h => 
        ['name', 'nombre', 'title', 'titulo', 'título'].includes(h.toLowerCase())
      );
      if (nameHeader) autoMapping.name = nameHeader;
      
      setMapping(autoMapping);
      setStep('preview');
    };
    reader.readAsText(file);
  };
  
  const handleImport = () => {
    if (!preview) return;
    
    const importResult = importSins(preview.rows, mapping, duplicateStrategy);
    setResult(importResult);
    setStep('result');
  };
  
  const displayedRows = useMemo(() => {
    if (!preview) return [];
    return showAllRows ? preview.rows : preview.rows.slice(0, 5);
  }, [preview, showAllRows]);
  
  const displayedErrors = useMemo(() => {
    if (!result) return [];
    return showAllErrors ? result.errors : result.errors.slice(0, 5);
  }, [result, showAllErrors]);
  
  const isValidMapping = mapping.name && mapping.name.length > 0;
  
  return (
    <div className="min-h-screen bg-background pb-24">
      <IOSHeader title="Importar pecados" onBack={() => navigate(-1)} />
      
      <div className="p-4 space-y-6">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          {(['upload', 'preview', 'mapping', 'result'] as ImportStep[]).map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                step === s 
                  ? "bg-accent text-accent-foreground"
                  : i < ['upload', 'preview', 'mapping', 'result'].indexOf(step)
                    ? "bg-green-500/20 text-green-500"
                    : "bg-muted text-muted-foreground"
              )}>
                {i + 1}
              </div>
              {i < 3 && (
                <ArrowRight className="w-4 h-4 text-muted-foreground mx-1" />
              )}
            </div>
          ))}
        </div>
        
        {/* STEP 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-ios-title text-foreground mb-2">Seleccionar archivo</h2>
              <p className="text-ios-body text-muted-foreground">
                Importa pecados desde CSV o XLSX
              </p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-6"
            >
              <Upload className="w-5 h-5 mr-2" />
              Seleccionar archivo
            </Button>
            
            {/* Format info */}
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-ios-subhead text-foreground font-medium mb-2">Formato esperado:</p>
              <ul className="text-ios-caption text-muted-foreground space-y-1">
                <li>• Primera fila: nombres de columnas</li>
                <li>• Columna "nombre" o "name" requerida</li>
                <li>• Campos múltiples separados por ";"</li>
                <li>• Valores booleanos: si/no, true/false</li>
              </ul>
            </div>
          </div>
        )}
        
        {/* STEP 2: Preview */}
        {step === 'preview' && preview && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-ios-headline text-foreground">Vista previa</h3>
                <div className="flex gap-2 text-ios-caption">
                  <span className="text-green-500">{preview.validRows} válidas</span>
                  {preview.errorRows > 0 && (
                    <span className="text-red-500">{preview.errorRows} errores</span>
                  )}
                </div>
              </div>
              
              {/* Headers */}
              <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                {preview.headers.map(h => (
                  <span key={h} className="px-2 py-1 bg-muted/50 rounded text-ios-caption text-foreground whitespace-nowrap">
                    {h}
                  </span>
                ))}
              </div>
              
              {/* Rows preview */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {displayedRows.map(row => (
                  <div 
                    key={row.rowNumber}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg text-ios-caption",
                      row.errors.length > 0 ? "bg-red-500/10" : "bg-muted/30"
                    )}
                  >
                    <span className="text-muted-foreground w-6">{row.rowNumber}</span>
                    <span className="truncate flex-1">
                      {Object.values(row.data).slice(0, 3).join(' | ')}
                    </span>
                    {row.errors.length > 0 && (
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
              
              {preview.rows.length > 5 && (
                <button
                  onClick={() => setShowAllRows(!showAllRows)}
                  className="flex items-center gap-1 text-ios-caption text-accent mt-2"
                >
                  {showAllRows ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showAllRows ? 'Ver menos' : `Ver todas (${preview.rows.length})`}
                </button>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('upload')} className="flex-1">
                Atrás
              </Button>
              <Button onClick={() => setStep('mapping')} className="flex-1">
                Mapear columnas
              </Button>
            </div>
          </div>
        )}
        
        {/* STEP 3: Mapping */}
        {step === 'mapping' && preview && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-ios-headline text-foreground mb-4">Mapeo de columnas</h3>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {MAPPABLE_FIELDS.map(field => (
                  <div key={field.key} className="flex items-center justify-between gap-2">
                    <span className={cn(
                      "text-ios-body",
                      field.required ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </span>
                    <Select
                      value={mapping[field.key] || '_none'}
                      onValueChange={(v) => setMapping({
                        ...mapping,
                        [field.key]: v === '_none' ? '' : v,
                      })}
                    >
                      <SelectTrigger className="w-40 bg-muted/50 border-0">
                        <SelectValue placeholder="No mapear" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="_none">No mapear</SelectItem>
                        {preview.headers.map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Duplicate strategy */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-ios-headline text-foreground mb-3">Duplicados</h3>
              <div className="space-y-2">
                {(['skip', 'overwrite', 'merge'] as DuplicateStrategy[]).map(strategy => (
                  <button
                    key={strategy}
                    onClick={() => setDuplicateStrategy(strategy)}
                    className={cn(
                      "w-full p-3 rounded-lg text-left transition-colors",
                      duplicateStrategy === strategy
                        ? "bg-accent/10 border border-accent"
                        : "bg-muted/30 border border-transparent"
                    )}
                  >
                    <span className="text-ios-body text-foreground">
                      {DUPLICATE_LABELS[strategy]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('preview')} className="flex-1">
                Atrás
              </Button>
              <Button 
                onClick={handleImport} 
                className="flex-1"
                disabled={!isValidMapping}
              >
                Importar
              </Button>
            </div>
          </div>
        )}
        
        {/* STEP 4: Result */}
        {step === 'result' && result && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                result.errors.length === 0 ? "bg-green-500/10" : "bg-amber-500/10"
              )}>
                {result.errors.length === 0 ? (
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                )}
              </div>
              <h2 className="text-ios-title text-foreground mb-2">
                Importación completada
              </h2>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-semibold text-green-500">{result.imported}</p>
                  <p className="text-ios-caption text-muted-foreground">Importados</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-semibold text-blue-500">{result.updated}</p>
                  <p className="text-ios-caption text-muted-foreground">Actualizados</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-semibold text-amber-500">{result.merged}</p>
                  <p className="text-ios-caption text-muted-foreground">Fusionados</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-semibold text-muted-foreground">{result.skipped}</p>
                  <p className="text-ios-caption text-muted-foreground">Omitidos</p>
                </div>
              </div>
            </div>
            
            {/* Errors log */}
            {result.errors.length > 0 && (
              <div className="bg-card border border-red-500/30 rounded-xl p-4">
                <h3 className="text-ios-headline text-red-500 mb-3">
                  Errores ({result.errors.length})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {displayedErrors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2 text-ios-caption">
                      <span className="text-red-500">Fila {err.row}:</span>
                      <span className="text-muted-foreground">{err.message}</span>
                    </div>
                  ))}
                </div>
                {result.errors.length > 5 && (
                  <button
                    onClick={() => setShowAllErrors(!showAllErrors)}
                    className="flex items-center gap-1 text-ios-caption text-accent mt-2"
                  >
                    {showAllErrors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showAllErrors ? 'Ver menos' : `Ver todos (${result.errors.length})`}
                  </button>
                )}
              </div>
            )}
            
            <Button onClick={() => navigate('/sins')} className="w-full">
              Ir al catálogo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImportPage;
