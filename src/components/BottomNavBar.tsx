import { ClipboardCheck, List, TrendingUp } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
const NAV_ITEMS = [{
  to: "/examen",
  icon: ClipboardCheck,
  label: "Examen"
}, {
  to: "/obras",
  icon: List,
  label: "Obras"
}, {
  to: "/avance",
  icon: TrendingUp,
  label: "Avance"
}] as const;
export function BottomNavBar() {
  return <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border safe-bottom mt-[2px] pb-0 py-[5px] pt-[5px] my-0 mb-0">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {NAV_ITEMS.map(({
        to,
        icon: Icon,
        label
      }) => <NavLink key={to} to={to} end={to === "/obras"} className="flex flex-col items-center justify-center flex-1 h-full touch-target">
            {({
          isActive
        }) => <div className={cn("flex flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1 transition-colors", isActive ? "text-accent" : "text-muted-foreground active:text-accent/70")}>
                <Icon className="w-6 h-6" />
                <span className="text-ios-caption2">{label}</span>
              </div>}
          </NavLink>)}
      </div>
    </nav>;
}