import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronRight, Search, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { formatPercentage } from "@/lib/dimensions";

export interface DetailItem {
  id: string;
  name: string;
  count: number;
  points: number;
  percentage: number;
  type: 'sin' | 'goodWork';
}

interface ChartDetailSheetProps {
  title: string;
  sins: DetailItem[];
  goodWorks: DetailItem[];
  totalPoints: number;
  metricType?: 'points' | 'events'; // What the percentage is based on
}

const INLINE_THRESHOLD = 10;

function DetailItemRow({ item }: { item: DetailItem }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-border/50 last:border-b-0">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-ios-body text-foreground truncate">{item.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-ios-caption text-muted-foreground">
            {item.count} {item.count === 1 ? 'vez' : 'veces'}
          </span>
          <span className="text-ios-caption text-muted-foreground">•</span>
          <span className={cn(
            "text-ios-caption font-medium",
            item.type === 'sin' ? "text-red-500" : "text-emerald-500"
          )}>
            {item.type === 'sin' ? '-' : '+'}{item.points.toFixed(1)} pts
          </span>
        </div>
      </div>
      <div className={cn(
        "text-ios-subhead font-semibold px-2 py-1 rounded-lg",
        item.type === 'sin' 
          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      )}>
        {formatPercentage(item.percentage)}
      </div>
    </div>
  );
}

function InlineDetail({ sins, goodWorks }: { sins: DetailItem[]; goodWorks: DetailItem[] }) {
  return (
    <div className="space-y-3 mt-3">
      {/* Sins that subtracted */}
      {sins.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-ios-caption font-medium text-muted-foreground">
              Pecados que restaron
            </span>
          </div>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {sins.map(item => (
              <DetailItemRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
      
      {/* Good works that added */}
      {goodWorks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-ios-caption font-medium text-muted-foreground">
              Buenas obras que sumaron
            </span>
          </div>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {goodWorks.map(item => (
              <DetailItemRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
      
      {sins.length === 0 && goodWorks.length === 0 && (
        <p className="text-ios-caption text-muted-foreground text-center py-4">
          No hay datos de detalle para esta gráfica
        </p>
      )}
    </div>
  );
}

function FullScreenDetail({ 
  title, 
  sins, 
  goodWorks 
}: { 
  title: string;
  sins: DetailItem[]; 
  goodWorks: DetailItem[]; 
}) {
  const [search, setSearch] = useState("");
  
  const filterItems = (items: DetailItem[]) => 
    items.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  
  const filteredSins = filterItems(sins);
  const filteredGoodWorks = filterItems(goodWorks);
  
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar ítem..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <InlineDetail sins={filteredSins} goodWorks={filteredGoodWorks} />
    </div>
  );
}

export function ChartDetailSheet({ 
  title, 
  sins, 
  goodWorks, 
  totalPoints,
  metricType = 'points'
}: ChartDetailSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showInline, setShowInline] = useState(false);
  
  const totalItems = sins.length + goodWorks.length;
  const shouldShowFullScreen = totalItems > INLINE_THRESHOLD;
  
  // Sort by contribution (percentage/points)
  const sortedSins = [...sins].sort((a, b) => b.percentage - a.percentage);
  const sortedGoodWorks = [...goodWorks].sort((a, b) => b.percentage - a.percentage);
  
  if (totalItems === 0) {
    return null;
  }
  
  // For many items, use sheet
  if (shouldShowFullScreen) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary h-auto py-1 px-2"
          >
            Ver detalle
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh]">
          <SheetHeader>
            <SheetTitle>Detalle de la gráfica</SheetTitle>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto max-h-[calc(85vh-80px)]">
            <FullScreenDetail 
              title={title}
              sins={sortedSins} 
              goodWorks={sortedGoodWorks} 
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }
  
  // For few items, toggle inline
  return (
    <div>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-primary h-auto py-1 px-2"
        onClick={() => setShowInline(!showInline)}
      >
        {showInline ? 'Ocultar detalle' : 'Ver detalle'}
        <ChevronRight className={cn(
          "w-4 h-4 ml-1 transition-transform",
          showInline && "rotate-90"
        )} />
      </Button>
      
      {showInline && (
        <InlineDetail sins={sortedSins} goodWorks={sortedGoodWorks} />
      )}
    </div>
  );
}
