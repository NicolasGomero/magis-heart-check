import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IOSHeader } from '@/components/IOSHeader';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle2,
  FileJson,
  Calendar,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getExamSessions, getUserState } from '@/lib/examSessions';
import { getPersonTypes, getActivities, savePersonTypes, saveActivities } from '@/lib/entities';
import { getSins } from '@/lib/sins.storage';
import { getPreferences, savePreferences } from '@/lib/preferences';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
interface BackupData {
  version: string;
  exportedAt: string;
  examSessions: ReturnType<typeof getExamSessions>;
  userState: ReturnType<typeof getUserState>;
  personTypes: ReturnType<typeof getPersonTypes>;
  activities: ReturnType<typeof getActivities>;
  sins: ReturnType<typeof getSins>;
  preferences: ReturnType<typeof getPreferences>;
}

export function BackupPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const [restoreData, setRestoreData] = useState<BackupData | null>(null);
  const [restoreResult, setRestoreResult] = useState<'success' | 'error' | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  
  const handleExport = () => {
    const data: BackupData = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      examSessions: getExamSessions(),
      userState: getUserState(),
      personTypes: getPersonTypes(),
      activities: getActivities(),
      sins: getSins(),
      preferences: getPreferences(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `magis-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as BackupData;
        if (!data.version || !data.exportedAt) {
          throw new Error('Invalid backup format');
        }
        setRestoreData(data);
        setShowConfirmRestore(true);
      } catch (err) {
        setRestoreResult('error');
        setTimeout(() => setRestoreResult(null), 3000);
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };
  
  const handleRestore = () => {
    if (!restoreData) return;
    
    try {
      // Restore all data
      if (restoreData.examSessions) {
        localStorage.setItem('magis_exam_sessions', JSON.stringify(restoreData.examSessions));
      }
      if (restoreData.userState) {
        localStorage.setItem('magis_user_state', JSON.stringify(restoreData.userState));
      }
      if (restoreData.personTypes) {
        savePersonTypes(restoreData.personTypes);
      }
      if (restoreData.activities) {
        saveActivities(restoreData.activities);
      }
      if (restoreData.sins) {
        localStorage.setItem('magis_sins', JSON.stringify(restoreData.sins));
      }
      if (restoreData.preferences) {
        savePreferences(restoreData.preferences);
      }
      
      setRestoreResult('success');
      setShowConfirmRestore(false);
      setRestoreData(null);
      
      // Reload after a delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setRestoreResult('error');
      setShowConfirmRestore(false);
    }
  };
  
  const getBackupStats = (data: BackupData) => {
    return {
      sessions: data.examSessions?.length || 0,
      sins: data.sins?.length || 0,
      personTypes: data.personTypes?.length || 0,
      activities: data.activities?.length || 0,
    };
  };
  
  return (
    <div className="min-h-screen bg-background">
      <IOSHeader title="Copia de seguridad" onBack={() => navigate(-1)} />
      
      <div className="p-6 space-y-6">
        {/* Export section */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
              exportSuccess ? "bg-green-500/20" : "bg-accent/10"
            )}>
              {exportSuccess ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <Download className="w-5 h-5 text-accent" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-ios-headline text-foreground">Exportar datos</h3>
              <p className="text-ios-subhead text-muted-foreground mt-1">
                Descarga todos tus datos y configuración en un archivo JSON
              </p>
            </div>
          </div>
          
          {/* Current data summary */}
          <div className="grid grid-cols-2 gap-2 py-2">
            <div className="flex items-center gap-2 text-ios-caption text-muted-foreground">
              <Database className="w-4 h-4" />
              {getExamSessions().length} exámenes
            </div>
            <div className="flex items-center gap-2 text-ios-caption text-muted-foreground">
              <FileJson className="w-4 h-4" />
              {getSins().length} pecados
            </div>
          </div>
          
          <Button onClick={handleExport} className="w-full">
            {exportSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Descargado
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Descargar copia
              </>
            )}
          </Button>
        </div>
        
        {/* Restore section */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
              restoreResult === 'success' ? "bg-green-500/20" :
              restoreResult === 'error' ? "bg-red-500/20" :
              "bg-amber-500/10"
            )}>
              {restoreResult === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : restoreResult === 'error' ? (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              ) : (
                <Upload className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-ios-headline text-foreground">Restaurar datos</h3>
              <p className="text-ios-subhead text-muted-foreground mt-1">
                Restaura desde una copia de seguridad anterior
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-ios-caption text-amber-600 dark:text-amber-400">
              Esto reemplazará todos los datos actuales. Esta acción no se puede deshacer.
            </p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Seleccionar archivo
          </Button>
          
          {restoreResult === 'success' && (
            <p className="text-ios-caption text-green-500 text-center">
              ¡Restauración completada! Recargando...
            </p>
          )}
          
          {restoreResult === 'error' && (
            <p className="text-ios-caption text-red-500 text-center">
              Error al leer el archivo. Verifica que sea una copia válida.
            </p>
          )}
        </div>
      </div>
      
      {/* Confirm restore dialog */}
      <AlertDialog open={showConfirmRestore} onOpenChange={setShowConfirmRestore}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Restaurar copia de seguridad?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Esta acción reemplazará todos tus datos actuales con los de la copia.
              </p>
              
              {restoreData && (
                <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-ios-caption text-foreground">
                    <Calendar className="w-4 h-4" />
                    Exportado: {format(new Date(restoreData.exportedAt), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-ios-caption text-muted-foreground">
                    <span>{getBackupStats(restoreData).sessions} exámenes</span>
                    <span>{getBackupStats(restoreData).sins} pecados</span>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRestore}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default BackupPage;
