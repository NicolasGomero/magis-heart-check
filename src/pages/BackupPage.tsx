import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IOSHeader } from "@/components/IOSHeader";
import { Download, Upload, AlertTriangle } from "lucide-react";
import { getExamSessions, getUserState } from "@/lib/examSessions";
import { getPersonTypes, getActivities } from "@/lib/entities";

export function BackupPage() {
  const navigate = useNavigate();
  const [restoring, setRestoring] = useState(false);
  
  const handleExport = () => {
    const data = {
      examSessions: getExamSessions(),
      userState: getUserState(),
      personTypes: getPersonTypes(),
      activities: getActivities(),
      exportedAt: new Date().toISOString(),
      version: "2.0.0",
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `magis-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleRestore = () => {
    // Placeholder for restore logic
    setRestoring(true);
    setTimeout(() => {
      setRestoring(false);
    }, 1000);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <IOSHeader 
        title="Copia de seguridad"
        onBack={() => navigate(-1)}
      />
      
      <div className="p-6 space-y-6">
        {/* Export section */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-state-peace/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-state-peace" />
            </div>
            <div className="flex-1">
              <h3 className="text-ios-headline text-foreground">Exportar datos</h3>
              <p className="text-ios-subhead text-muted-foreground mt-1">
                Descarga todos tus exámenes y configuración en un archivo
              </p>
            </div>
          </div>
          <button
            onClick={handleExport}
            className="w-full py-3 bg-accent text-accent-foreground rounded-xl text-ios-body font-medium active:opacity-90 transition-opacity"
          >
            Descargar copia
          </button>
        </div>
        
        {/* Restore section */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-state-attention/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Upload className="w-5 h-5 text-state-attention" />
            </div>
            <div className="flex-1">
              <h3 className="text-ios-headline text-foreground">Restaurar datos</h3>
              <p className="text-ios-subhead text-muted-foreground mt-1">
                Restaura desde una copia de seguridad anterior
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2 p-3 bg-state-attention/10 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-state-attention flex-shrink-0 mt-0.5" />
            <p className="text-ios-caption text-state-attention">
              Esto reemplazará todos los datos actuales
            </p>
          </div>
          
          <button
            onClick={handleRestore}
            disabled={restoring}
            className="w-full py-3 bg-muted text-foreground rounded-xl text-ios-body font-medium active:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {restoring ? "Restaurando..." : "Seleccionar archivo"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BackupPage;
