import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, TrendingDown, TrendingUp } from "lucide-react";
import { IOSHeader } from "@/components/IOSHeader";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatPercentage } from "@/lib/dimensions";

interface DetailItem {
  id: string;
  name: string;
  count: number;
  points: number;
  percentage: number;
  type: 'sin' | 'goodWork';
}

function DetailItemRow({ item }: { item: DetailItem }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-border/50 last:border-b-0">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-ios-body text-foreground break-words">{item.name}</p>
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
        "text-ios-subhead font-semibold px-2 py-1 rounded-lg flex-shrink-0",
        item.type === 'sin' 
          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      )}>
        {formatPercentage(item.percentage)}
      </div>
    </div>
  );
}

export default function ChartDetailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  
  // Parse data from URL params (stored in sessionStorage for large data)
  const chartTitle = searchParams.get('title') || 'Detalle de la gráfica';
  const returnPath = searchParams.get('return') || '/avance';
  
  const { sins, goodWorks } = useMemo(() => {
    const storedData = sessionStorage.getItem('chartDetailData');
    if (!storedData) {
      return { sins: [], goodWorks: [] };
    }
    try {
      const parsed = JSON.parse(storedData);
      return {
        sins: (parsed.sins || []) as DetailItem[],
        goodWorks: (parsed.goodWorks || []) as DetailItem[],
      };
    } catch {
      return { sins: [], goodWorks: [] };
    }
  }, []);
  
  const filterItems = (items: DetailItem[]) => 
    items.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  
  const filteredSins = filterItems(sins).sort((a, b) => b.percentage - a.percentage);
  const filteredGoodWorks = filterItems(goodWorks).sort((a, b) => b.percentage - a.percentage);
  
  return (
    <div className="min-h-screen bg-background pb-8">
      <IOSHeader 
        title={chartTitle}
        subtitle="Desglose por ítems"
        onBack={() => {
          sessionStorage.removeItem('chartDetailData');
          navigate(returnPath);
        }}
      />
      
      <div className="p-4 space-y-4">
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
        
        {/* Sins that subtracted */}
        {filteredSins.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-ios-caption font-medium text-muted-foreground">
                Pecados que restaron ({filteredSins.length})
              </span>
            </div>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {filteredSins.map(item => (
                <DetailItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
        
        {/* Good works that added */}
        {filteredGoodWorks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-ios-caption font-medium text-muted-foreground">
                Buenas obras que sumaron ({filteredGoodWorks.length})
              </span>
            </div>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {filteredGoodWorks.map(item => (
                <DetailItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
        
        {filteredSins.length === 0 && filteredGoodWorks.length === 0 && (
          <p className="text-ios-body text-muted-foreground text-center py-8">
            {search ? 'No se encontraron ítems' : 'No hay datos de detalle para esta gráfica'}
          </p>
        )}
      </div>
    </div>
  );
}
