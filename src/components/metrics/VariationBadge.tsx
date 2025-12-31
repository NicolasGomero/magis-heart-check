import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VariationResult, VariationType } from '@/lib/metricsCalculations';

interface VariationBadgeProps {
  variation: VariationResult | null;
  showPercentage?: boolean;
  size?: 'sm' | 'md';
}

const VARIATION_CONFIG: Record<VariationType, {
  label: string;
  icon: typeof TrendingUp;
  colorClass: string;
  bgClass: string;
}> = {
  progress: {
    label: 'Progreso',
    icon: TrendingDown,
    colorClass: 'text-green-500',
    bgClass: 'bg-green-500/10',
  },
  regression: {
    label: 'Regresión',
    icon: TrendingUp,
    colorClass: 'text-red-500',
    bgClass: 'bg-red-500/10',
  },
  stable: {
    label: 'Sin cambio',
    icon: Minus,
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-muted/30',
  },
};

export function VariationBadge({ variation, showPercentage = true, size = 'md' }: VariationBadgeProps) {
  if (!variation) return null;

  const config = VARIATION_CONFIG[variation.type];
  const Icon = config.icon;

  return (
    <div className={cn(
      "inline-flex items-center gap-1 rounded-full",
      config.bgClass,
      size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1'
    )}>
      <Icon className={cn(
        config.colorClass,
        size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
      )} />
      <span className={cn(
        "font-medium",
        config.colorClass,
        size === 'sm' ? 'text-xs' : 'text-sm'
      )}>
        {config.label}
        {showPercentage && variation.type !== 'stable' && (
          <span className="ml-1">
            ({variation.percentage > 0 ? '+' : ''}{variation.percentage.toFixed(0)}%)
          </span>
        )}
      </span>
    </div>
  );
}
