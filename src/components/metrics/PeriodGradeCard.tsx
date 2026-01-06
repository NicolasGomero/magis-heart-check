import { useState } from 'react';
import { CheckCircle2, XCircle, Info, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PeriodGrade, ItemDetail } from '@/lib/metricsCalculations';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface PeriodGradeCardProps {
  grade: PeriodGrade;
}

export function PeriodGradeCard({ grade }: PeriodGradeCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  
  const gradeColor = grade.passed
    ? grade.grade >= 8 ? 'text-green-500' : 'text-emerald-400'
    : grade.grade <= 3 ? 'text-red-500' : 'text-orange-500';

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-ios-caption text-muted-foreground mb-1">Calificación del periodo</p>
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
              <span className="text-lg text-muted-foreground">/10</span>
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

      {/* Points summary */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-green-500/10 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-ios-caption text-green-600 dark:text-green-400">Buenas obras</span>
          </div>
          <span className="text-xl font-semibold text-green-600 dark:text-green-400">
            +{grade.positivePoints.toFixed(1)}
          </span>
        </div>
        <div className="bg-red-500/10 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <span className="text-ios-caption text-red-600 dark:text-red-400">Pecados</span>
          </div>
          <span className="text-xl font-semibold text-red-600 dark:text-red-400">
            -{grade.negativePoints.toFixed(1)}
          </span>
        </div>
      </div>

      <p className="text-ios-subhead text-muted-foreground mb-4">
        {grade.explanation}
      </p>

      {/* Ver detalle */}
      <Collapsible open={showDetail} onOpenChange={setShowDetail}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
            <span className="text-ios-body font-medium text-foreground">Ver detalle</span>
            {showDetail ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 space-y-4">
            {/* Buenas obras detail */}
            {grade.buenasObrasDetail.length > 0 && (
              <div>
                <h4 className="text-ios-caption text-green-600 dark:text-green-400 font-medium mb-2">
                  Buenas obras ({grade.buenasObrasDetail.length})
                </h4>
                <div className="space-y-2">
                  {grade.buenasObrasDetail.map((item) => (
                    <ItemDetailRow key={item.id} item={item} type="positive" />
                  ))}
                </div>
              </div>
            )}
            
            {/* Pecados detail */}
            {grade.pecadosDetail.length > 0 && (
              <div>
                <h4 className="text-ios-caption text-red-600 dark:text-red-400 font-medium mb-2">
                  Pecados ({grade.pecadosDetail.length})
                </h4>
                <div className="space-y-2">
                  {grade.pecadosDetail.map((item) => (
                    <ItemDetailRow key={item.id} item={item} type="negative" />
                  ))}
                </div>
              </div>
            )}
            
            {grade.buenasObrasDetail.length === 0 && grade.pecadosDetail.length === 0 && (
              <p className="text-ios-caption text-muted-foreground text-center py-4">
                No hay datos para mostrar
              </p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg mt-4">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-ios-caption text-muted-foreground">
          La calificación parte de 10. Los puntos negativos restan; los positivos solo suman si hubo descuentos. 
          Con pecado mortal imputable, máximo 4.9.
        </p>
      </div>
    </div>
  );
}

function ItemDetailRow({ item, type }: { item: ItemDetail; type: 'positive' | 'negative' }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-background rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-ios-body text-foreground">{item.name}</span>
        <span className="text-ios-caption text-muted-foreground">×{item.count}</span>
      </div>
      <span className={cn(
        "text-ios-body font-medium",
        type === 'positive' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
      )}>
        {type === 'positive' ? '+' : '-'}{item.points.toFixed(1)}
      </span>
    </div>
  );
}
