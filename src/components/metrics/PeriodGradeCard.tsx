import { CheckCircle2, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PeriodGrade } from '@/lib/metricsCalculations';

interface PeriodGradeCardProps {
  grade: PeriodGrade;
}

export function PeriodGradeCard({ grade }: PeriodGradeCardProps) {
  const gradeColor = grade.passed
    ? grade.grade >= 16 ? 'text-green-500' : 'text-emerald-400'
    : grade.grade <= 5 ? 'text-red-500' : 'text-orange-500';

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-ios-caption text-muted-foreground mb-1">Nota del periodo</p>
          <div className="flex items-center gap-3">
            {grade.passed ? (
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            ) : (
              <XCircle className="h-8 w-8 text-red-500" />
            )}
            <div>
              <span className={cn("text-3xl font-bold", gradeColor)}>
                {grade.grade.toFixed(1)}
              </span>
              <span className="text-lg text-muted-foreground">/20</span>
            </div>
          </div>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-sm font-medium",
          grade.passed 
            ? "bg-green-500/10 text-green-500" 
            : "bg-red-500/10 text-red-500"
        )}>
          {grade.passed ? 'Aprobado' : 'Desaprobado'}
        </div>
      </div>

      <p className="text-ios-subhead text-muted-foreground mb-4">
        {grade.explanation}
      </p>

      <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-ios-caption text-muted-foreground">
          No se desaprueba salvo pecado mortal en el periodo o acumulación que alcance materia grave.
        </p>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">{grade.mortalCount}</p>
          <p className="text-ios-caption text-muted-foreground">Mortales</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">{grade.aggregationsCrossed}</p>
          <p className="text-ios-caption text-muted-foreground">Acumulaciones</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">{grade.venialLoad.toFixed(0)}</p>
          <p className="text-ios-caption text-muted-foreground">Carga venial</p>
        </div>
      </div>
    </div>
  );
}
