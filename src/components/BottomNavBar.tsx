import { List, BarChart3, Plus } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/sins", icon: List, label: "Pecados" },
  { to: "/metrics", icon: BarChart3, label: "Métricas" },
  { to: "/sins/new", icon: Plus, label: "Añadir" },
] as const;

export function BottomNavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors touch-target",
                isActive
                  ? "text-accent"
                  : "text-muted-foreground active:text-accent/70"
              )
            }
          >
            <Icon className="w-6 h-6" />
            <span className="text-ios-caption2">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
