import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import { ContextSelector } from "@/components/ContextSelector";
import { ExaminationFlow } from "@/components/ExaminationFlow";
import { IOSHeader } from "@/components/IOSHeader";
import { 
  getUserState, 
  getMinutesSinceLastExam, 
  formatTimeAgo, 
  getExamState,
  type ExamState 
} from "@/lib/storage";
import { getSins } from "@/lib/sins.storage";
import { cn } from "@/lib/utils";

type Screen = 'home' | 'examination';

interface ExamContext {
  personTypes: string[];
  activities: string[];
  sinsToShow: string[];
}

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

export function HomePage() {
  const [screen, setScreen] = useState<Screen>('home');
  const [examContext, setExamContext] = useState<ExamContext | null>(null);
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
  
  const handleGenerate = (personTypes: string[], activities: string[]) => {
    const allSins = getSins();
    
    let sinsToShow: string[];
    
    if (personTypes.length === 0 && activities.length === 0) {
      // No selection = show all sins
      sinsToShow = allSins.map(s => s.id);
    } else {
      // Union (OR) of sins matching any selected personType OR any selected activity
      const sinIdsSet = new Set<string>();
      
      allSins.forEach(sin => {
        // Check if sin is associated with any selected personType
        const matchesPersonType = personTypes.some(pt => 
          sin.involvedPersonTypes.includes(pt)
        );
        
        // Check if sin is associated with any selected activity
        const matchesActivity = activities.some(act => 
          sin.associatedActivities.includes(act)
        );
        
        if (matchesPersonType || matchesActivity) {
          sinIdsSet.add(sin.id);
        }
      });
      
      sinsToShow = Array.from(sinIdsSet);
    }
    
    setExamContext({
      personTypes,
      activities,
      sinsToShow
    });
    setScreen('examination');
  };
  
  const handleBack = () => {
    setScreen('home');
    setExamContext(null);
  };
  
  const handleComplete = () => {
    setScreen('home');
    setExamContext(null);
    setUserState(getUserState()); // Refresh state
  };
  
  if (screen === 'examination' && examContext) {
    return (
      <ExaminationFlow
        personTypes={examContext.personTypes}
        activities={examContext.activities}
        sinsToShow={examContext.sinsToShow}
        onBack={handleBack}
        onComplete={handleComplete}
      />
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <IOSHeader 
        title="MAGIS" 
        rightAction={
          <Link 
            to="/settings" 
            className="text-muted-foreground active:opacity-70 transition-opacity touch-target"
          >
            <Settings className="w-6 h-6" />
          </Link>
        }
      />
      
      <div className="flex-1 py-6 space-y-4 overflow-auto">
        {/* State indicator */}
        <div className="animate-fade-in">
          <StateIndicator state={examState} timeAgo={timeAgo} />
        </div>
        
        {/* Context selector with multi-selection */}
        <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <ContextSelector onGenerate={handleGenerate} />
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
    </div>
  );
}

export default HomePage;
