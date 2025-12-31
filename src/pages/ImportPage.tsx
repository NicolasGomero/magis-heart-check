import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IOSHeader } from "@/components/IOSHeader";
import { Upload } from "lucide-react";

export function ImportPage() {
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);
  
  const handleImport = () => {
    // Placeholder for import logic
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      navigate("/sins");
    }, 1000);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <IOSHeader 
        title="Importar pecados"
        onBack={() => navigate(-1)}
      />
      
      <div className="p-6 space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-ios-title text-foreground mb-2">
            Importar preguntas
          </h2>
          <p className="text-ios-body text-muted-foreground">
            Importa preguntas de examen desde un archivo JSON o CSV
          </p>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-ios-subhead text-muted-foreground mb-4">
            Formato esperado:
          </p>
          <pre className="text-ios-caption text-foreground bg-muted p-3 rounded-lg overflow-x-auto">
{`[
  {
    "text": "¿He...?",
    "pillar": "god|neighbor|self",
    "contexts": ["general", "work"]
  }
]`}
          </pre>
        </div>
        
        <button
          onClick={handleImport}
          disabled={importing}
          className="w-full py-4 bg-accent text-accent-foreground rounded-xl text-ios-body font-medium active:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {importing ? "Importando..." : "Seleccionar archivo"}
        </button>
      </div>
    </div>
  );
}

export default ImportPage;
