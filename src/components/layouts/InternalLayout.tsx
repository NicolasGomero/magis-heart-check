import { Outlet, useNavigate } from "react-router-dom";
import { IOSHeader } from "@/components/IOSHeader";

interface InternalLayoutProps {
  title: string;
  subtitle?: string;
}

export function InternalLayout({ title, subtitle }: InternalLayoutProps) {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      <IOSHeader 
        title={title} 
        subtitle={subtitle}
        onBack={() => navigate(-1)} 
      />
      <Outlet />
    </div>
  );
}
