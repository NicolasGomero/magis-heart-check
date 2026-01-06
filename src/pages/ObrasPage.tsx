import { Sparkles, Flame, ChevronRight, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
const FOLDERS = [{
  to: "/obras/buenas",
  icon: Sparkles,
  label: "Buenas obras",
  description: "Virtudes y acciones positivas"
}, {
  to: "/obras/pecados",
  icon: Flame,
  label: "Pecados",
  description: "Faltas y áreas de mejora"
}] as const;
export default function ObrasPage() {
  return <div className="flex flex-col min-h-full pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between h-11 px-4">
          <div className="w-10" /> {/* Spacer */}
          <h1 className="text-ios-headline font-semibold text-foreground">Obras</h1>
          <Link to="/settings" className="text-muted-foreground active:opacity-70 transition-opacity touch-target">
            <Settings className="w-6 h-6 py-0 my-[9px]" />
          </Link>
        </div>
      </header>

      {/* Folders */}
      <div className="px-4 pt-6">
        <div className="bg-card rounded-xl overflow-hidden card-elevated">
          {FOLDERS.map(({
          to,
          icon: Icon,
          label,
          description
        }, index) => <Link key={to} to={to} className={cn("flex items-center gap-4 px-4 py-4", "border-b border-border/50 last:border-b-0", "transition-colors active:bg-muted/50")}>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-ios-body font-medium text-foreground">{label}</p>
                <p className="text-ios-caption text-muted-foreground">{description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>)}
        </div>
      </div>
    </div>;
}