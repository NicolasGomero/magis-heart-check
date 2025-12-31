import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { PeriodPreset, PeriodConfig, getPeriodConfig } from '@/lib/metricsCalculations';

interface PeriodSelectorProps {
  value: PeriodConfig;
  onChange: (config: PeriodConfig) => void;
}

const PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: '7d', label: '7 días' },
  { value: '30d', label: '30 días' },
  { value: '90d', label: '90 días' },
  { value: '1y', label: '1 año' },
  { value: 'custom', label: 'Personalizado' },
];

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const [showCustom, setShowCustom] = useState(value.preset === 'custom');
  const [customStart, setCustomStart] = useState<Date>(new Date(value.startDate));
  const [customEnd, setCustomEnd] = useState<Date>(new Date(value.endDate));

  const handlePresetChange = (preset: PeriodPreset) => {
    if (preset === 'custom') {
      setShowCustom(true);
      onChange(getPeriodConfig('custom', customStart, customEnd));
    } else {
      setShowCustom(false);
      onChange(getPeriodConfig(preset));
    }
  };

  const handleCustomDateChange = (start: Date, end: Date) => {
    setCustomStart(start);
    setCustomEnd(end);
    onChange(getPeriodConfig('custom', start, end));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 bg-card">
            {PRESETS.find(p => p.value === value.preset)?.label || value.label}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-popover z-50">
          {PRESETS.map(preset => (
            <DropdownMenuItem
              key={preset.value}
              onClick={() => handlePresetChange(preset.value)}
              className={cn(value.preset === preset.value && 'bg-accent')}
            >
              {preset.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {showCustom && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-card">
                <CalendarIcon className="h-4 w-4" />
                {format(customStart, 'dd MMM', { locale: es })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
              <Calendar
                mode="single"
                selected={customStart}
                onSelect={(date) => date && handleCustomDateChange(date, customEnd)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          
          <span className="text-muted-foreground">—</span>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-card">
                <CalendarIcon className="h-4 w-4" />
                {format(customEnd, 'dd MMM', { locale: es })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
              <Calendar
                mode="single"
                selected={customEnd}
                onSelect={(date) => date && handleCustomDateChange(customStart, date)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
