import { ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { IOSHeader } from "@/components/IOSHeader";

interface SettingsItemProps {
  label: string;
  to: string;
  value?: string;
}

function SettingsItem({ label, to, value }: SettingsItemProps) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between px-4 py-3 active:bg-muted/50 transition-colors"
    >
      <span className="text-ios-body text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {value && (
          <span className="text-ios-body text-muted-foreground">{value}</span>
        )}
        <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
      </div>
    </Link>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      <IOSHeader 
        title="Configuración" 
        onBack={() => navigate("/")}
      />
      
      <div className="py-4">
        {/* Data section */}
        <div className="mb-6">
          <p className="text-ios-caption text-muted-foreground uppercase tracking-wide px-4 py-2">
            Datos
          </p>
          <div className="bg-card border-y border-border divide-y divide-border">
            <SettingsItem label="Importar pecados" to="/settings/import" />
            <SettingsItem label="Copia de seguridad" to="/settings/backup" />
          </div>
        </div>
        
        {/* About section */}
        <div>
          <p className="text-ios-caption text-muted-foreground uppercase tracking-wide px-4 py-2">
            Información
          </p>
          <div className="bg-card border-y border-border divide-y divide-border">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-ios-body text-foreground">Versión</span>
              <span className="text-ios-body text-muted-foreground">1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
