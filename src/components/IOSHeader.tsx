import { ChevronLeft } from "lucide-react";

interface IOSHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function IOSHeader({ title, subtitle, onBack, rightAction }: IOSHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm safe-top">
      <div className="flex items-center justify-between px-4 py-3 min-h-[44px]">
        <div className="w-20 flex-shrink-0 flex items-center relative z-10">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-accent active:opacity-70 transition-opacity touch-target -ml-2 px-2 pointer-events-auto"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-ios-body">Atrás</span>
            </button>
          )}
        </div>
        
        <div className="flex-1 text-center min-w-0 pointer-events-none">
          <h1 className="text-ios-headline text-foreground truncate">{title}</h1>
          {subtitle && (
            <p className="text-ios-caption text-muted-foreground">{subtitle}</p>
          )}
        </div>
        
        <div className="w-20 flex-shrink-0 flex justify-end pointer-events-auto relative z-10">
          {rightAction}
        </div>
      </div>
      
      <div className="h-px bg-border" />
    </header>
  );
}
