import { Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { IOSHeader } from "@/components/IOSHeader";

export default function BuenasObrasPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-full pb-20">
      <IOSHeader 
        title="Todas las buenas obras" 
        onBack={() => navigate("/obras")}
        rightAction={
          <Link to="/obras/buenas/new" className="text-primary active:opacity-70">
            <Plus className="w-6 h-6" />
          </Link>
        }
      />

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <p className="text-ios-body text-muted-foreground mb-4">
          Aún no has registrado buenas obras.
        </p>
        <Link 
          to="/obras/buenas/new"
          className="text-primary text-ios-body font-medium"
        >
          Añadir la primera
        </Link>
      </div>
    </div>
  );
}
