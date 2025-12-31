import { useState, useEffect } from "react";
import { ContextSelector } from "./ContextSelector";
import { ExaminationFlow } from "./ExaminationFlow";
import { IOSHeader } from "./IOSHeader";
import { 
  getUserState, 
  getMinutesSinceLastExam, 
  formatTimeAgo, 
  getExamState,
  type ExamState 
} from "@/lib/storage";
import type { Context } from "@/lib/questions";
import { cn } from "@/lib/utils";

type Screen = 'home' | 'examination';

function StateIndicator({ state, timeAgo }: { state: ExamState; timeAgo: string }) {
  const stateConfig = {
    peace: {
      bg: 'bg-peace',
      text: 'Paz interior',
      description: 'Continúa en la presencia',
      borderColor: 'border-state-peace/30',
    },
    attention: {
      bg: 'bg-attention',
      text: 'Momento de pausa',
      description: 'Buen momento para recentrarte',
      borderColor: 'border-state-attention/30',
    },
    growth: {
      bg: 'bg-gradient-to-br from-state-growth/20 to-state-growth/5',
      text: 'Invitación',
      description: 'Un nuevo examen te espera',
      borderColor: 'border-state-growth/30',
    },
  };
  
  const config = stateConfig[state];
  
  return (
    <div className={cn(
      "mx-4 p-5 rounded-2xl border-2",
      config.bg,
      config.borderColor
    )}>
      <div className="text-center">
        <p className="text-ios-subhead text-muted-foreground mb-1">{timeAgo}</p>
        <h2 className="text-ios-title text-foreground mb-1">{config.text}</h2>
        <p className="text-ios-callout text-muted-foreground">{config.description}</p>
      </div>
    </div>
  );
}

export function HomeScreen() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedContext, setSelectedContext] = useState<Context | null>(null);
  const [userState, setUserState] = useState(getUserState);
  
  // Refresh state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setUserState(getUserState());
    }, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, []);
  
  const minutesSinceLastExam = getMinutesSinceLastExam();
  const examState = getExamState(minutesSinceLastExam);
  const timeAgo = formatTimeAgo(minutesSinceLastExam);
  
  const handleContextSelect = (context: Context) => {
    setSelectedContext(context);
    setScreen('examination');
  };
  
  const handleBack = () => {
    setScreen('home');
    setSelectedContext(null);
  };
  
  const handleComplete = () => {
    setScreen('home');
    setSelectedContext(null);
    setUserState(getUserState()); // Refresh state
  };
  
  if (screen === 'examination' && selectedContext) {
    return (
      <ExaminationFlow
        context={selectedContext}
        onBack={handleBack}
        onComplete={handleComplete}
      />
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <IOSHeader title="MAGIS" />
      
      <div className="flex-1 py-6 space-y-6">
        {/* State indicator */}
        <div className="animate-fade-in">
          <StateIndicator state={examState} timeAgo={timeAgo} />
        </div>
        
        {/* Context selector */}
        <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <ContextSelector onSelect={handleContextSelect} />
        </div>
        
        {/* Subtle count - only if there have been examinations today */}
        {userState.todayCount > 0 && (
          <div className="text-center animate-fade-in" style={{ animationDelay: '200ms' }}>
            <p className="text-ios-caption text-muted-foreground/60">
              {userState.todayCount} {userState.todayCount === 1 ? 'examen' : 'exámenes'} hoy
            </p>
          </div>
        )}
      </div>
      
      {/* Footer quote */}
      <footer className="px-6 py-4 text-center safe-bottom">
        <p className="text-ios-caption text-muted-foreground/70 italic">
          "En todo amar y servir"
        </p>
      </footer>
    </div>
  );
}
