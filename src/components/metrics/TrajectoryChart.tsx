import { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrajectoryData } from '@/lib/metricsCalculations';
import { VariationBadge } from './VariationBadge';

export interface TrajectoryChartProps {
  data: TrajectoryData;
  title: string;
  color?: string;
  showVariation?: boolean;
  showTitle?: boolean;
}

export function TrajectoryChart({ 
  data, 
  title, 
  color = 'hsl(var(--primary))',
  showVariation = true,
  showTitle = true,
}: TrajectoryChartProps) {
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
    </div>
  );
}
