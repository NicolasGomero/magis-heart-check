import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ChevronRight, ChevronDown, TrendingDown, TrendingUp } from 'lucide-react';
import { TrajectoryData, ItemDetail } from '@/lib/metricsCalculations';
import { VariationBadge } from './VariationBadge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPercentage } from '@/lib/dimensions';

export interface TrajectoryChartProps {
  data: TrajectoryData;
  title: string;
  color?: string;
  showVariation?: boolean;
  showTitle?: boolean;
}

const INLINE_THRESHOLD = 10;

interface DetailRowProps {
  item: ItemDetail & { percentage: number; type: 'sin' | 'goodWork' };
}

function DetailRow({ item }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between py-2 px-3 border-b border-border/50 last:border-b-0">
      <div className="flex-1 min-w-0 pr-3">
        <p className="text-ios-caption text-foreground truncate">{item.name}</p>
        <div className="flex items-center gap-2">
          <span className="text-ios-caption2 text-muted-foreground">
            {item.count}x
          </span>
          <span className={cn(
            "text-ios-caption2 font-medium",
            item.type === 'sin' ? "text-red-500" : "text-emerald-500"
          )}>
            {item.type === 'sin' ? '-' : '+'}{item.points.toFixed(1)} pts
          </span>
        </div>
      </div>
      <div className={cn(
        "text-ios-caption2 font-semibold px-1.5 py-0.5 rounded",
        item.type === 'sin' 
          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      )}>
        {formatPercentage(item.percentage)}
      </div>
    </div>
  );
}

export function TrajectoryChart({ 
  data, 
  title, 
  color = 'hsl(var(--primary))',
  showVariation = true,
  showTitle = true,
}: TrajectoryChartProps) {
  const navigate = useNavigate();
  const [showDetail, setShowDetail] = useState(false);
  
  const chartData = useMemo(() => {
    return data.points.map(p => ({
      label: p.label,
      value: Math.round(p.value * 10) / 10,
      events: p.eventCount,
    }));
  }, [data.points]);

  const maxValue = useMemo(() => {
    const values = chartData.map(d => d.value);
    return Math.max(...values, 10);
  }, [chartData]);
  
  // Prepare detail items with percentages
  const { sinsWithPercent, goodWorksWithPercent, totalItems } = useMemo(() => {
    const sinDetails = data.sinDetails || [];
    const boDetails = data.buenaObraDetails || [];
    
    const totalSinPoints = sinDetails.reduce((sum, d) => sum + d.points, 0);
    const totalBoPoints = boDetails.reduce((sum, d) => sum + d.points, 0);
    const grandTotal = totalSinPoints + totalBoPoints;
    
    const sinsWithPercent = sinDetails.map(d => ({
      ...d,
      percentage: grandTotal > 0 ? (d.points / grandTotal) * 100 : 0,
      type: 'sin' as const,
    })).sort((a, b) => b.percentage - a.percentage);
    
    const goodWorksWithPercent = boDetails.map(d => ({
      ...d,
      percentage: grandTotal > 0 ? (d.points / grandTotal) * 100 : 0,
      type: 'goodWork' as const,
    })).sort((a, b) => b.percentage - a.percentage);
    
    return { 
      sinsWithPercent, 
      goodWorksWithPercent, 
      totalItems: sinsWithPercent.length + goodWorksWithPercent.length 
    };
  }, [data.sinDetails, data.buenaObraDetails]);
  
  const hasDetails = totalItems > 0;
  const shouldUseFullScreen = totalItems > INLINE_THRESHOLD;
  
  const handleViewDetail = () => {
    if (shouldUseFullScreen) {
      // Store data in sessionStorage and navigate
      sessionStorage.setItem('chartDetailData', JSON.stringify({
        sins: sinsWithPercent.map(s => ({
          id: s.id,
          name: s.name,
          count: s.count,
          points: s.points,
          percentage: s.percentage,
          type: s.type,
        })),
        goodWorks: goodWorksWithPercent.map(g => ({
          id: g.id,
          name: g.name,
          count: g.count,
          points: g.points,
          percentage: g.percentage,
          type: g.type,
        })),
      }));
      navigate(`/avance/detalle?title=${encodeURIComponent(title)}&return=/avance`);
    } else {
      setShowDetail(!showDetail);
    }
  };

  return (
    <div className="bg-card rounded-xl p-4 border border-border">
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-ios-body font-medium text-foreground">{title}</h3>
            <p className="text-ios-caption text-muted-foreground">
              {data.eventCount} eventos · Score total: {data.totalScore.toFixed(1)}
            </p>
          </div>
          {showVariation && <VariationBadge variation={data.variation} size="sm" />}
        </div>
      )}

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
            />
            <YAxis 
              domain={[0, maxValue]}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number, name: string) => [
                `${value.toFixed(1)}`,
                name === 'value' ? 'Score' : name,
              ]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${title})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Ver detalle button */}
      {hasDetails && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary h-auto py-1 px-2 -ml-2"
            onClick={handleViewDetail}
          >
            {showDetail && !shouldUseFullScreen ? 'Ocultar detalle' : 'Ver detalle'}
            {shouldUseFullScreen ? (
              <ChevronRight className="w-4 h-4 ml-1" />
            ) : (
              <ChevronDown className={cn(
                "w-4 h-4 ml-1 transition-transform",
                showDetail && "rotate-180"
              )} />
            )}
          </Button>
          
          {/* Inline detail (for <=10 items) */}
          {showDetail && !shouldUseFullScreen && (
            <div className="space-y-3 mt-3">
              {sinsWithPercent.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5 px-1">
                    <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-ios-caption2 font-medium text-muted-foreground">
                      Pecados que restaron
                    </span>
                  </div>
                  <div className="bg-muted/30 rounded-lg overflow-hidden">
                    {sinsWithPercent.map(item => (
                      <DetailRow key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              )}
              
              {goodWorksWithPercent.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5 px-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-ios-caption2 font-medium text-muted-foreground">
                      Buenas obras que sumaron
                    </span>
                  </div>
                  <div className="bg-muted/30 rounded-lg overflow-hidden">
                    {goodWorksWithPercent.map(item => (
                      <DetailRow key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

