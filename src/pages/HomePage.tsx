import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import { ContextSelector } from "@/components/ContextSelector";
import { ExaminationFlow } from "@/components/ExaminationFlow";
import { getUserState, getMinutesSinceLastExam, formatTimeAgo, getExamState, type ExamState } from "@/lib/storage";
import { getSins } from "@/lib/sins.storage";
import { cn } from "@/lib/utils";
type Screen = 'home' | 'examination';
interface ExamContext {
  personTypes: string[];
  activities: string[];
  sinsToShow: string[];
}
function StateIndicator({
  state,
  timeAgo
}: {
  state: ExamState;
  timeAgo: string;
}) {
  const stateConfig = {
    peace: {
      bg: 'bg-peace',
      text: 'Paz interior',
      description: 'Continúa en la presencia',
      borderColor: 'border-state-peace/30'
    },
    attention: {
      bg: 'bg-attention',
      text: 'Momento de pausa',
      description: 'Buen momento para recentrarte',
      borderColor: 'border-state-attention/30'
    },
    growth: {
      bg: 'bg-gradient-to-br from-state-growth/20 to-state-growth/5',
      text: 'Invitación',
      description: 'Un nuevo examen te espera',
      borderColor: 'border-state-growth/30'
    }
  };
  const config = stateConfig[state];
  return <div className={cn("mx-4 p-5 rounded-2xl border-2", config.bg, config.borderColor)}>
      <div className="text-center">
        <h1 className="font-bold text-foreground mb-1 text-4xl">MAGIS</h1>
        <p className="text-ios-footnote text-muted-foreground mb-3">Mira dentro de ti y dispón tu corazón 
hacia un mayor amor.</p>
        <p className="text-ios-subhead text-muted-foreground/70">{timeAgo}</p>
      </div>
    </div>;
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
    // Get only enabled sins (not disabled)
    const allSins = getSins().filter(s => !s.isDisabled);
    const hasPersonTypes = personTypes.length > 0;
    const hasActivities = activities.length > 0;
    let sinsToShow: string[];
    if (!hasPersonTypes && !hasActivities) {
      // No selection = show all enabled sins
      sinsToShow = allSins.map(s => s.id);
    } else {
      // Filter with strict AND logic
      const filtered = allSins.filter(sin => {
        // Must match selected person types (if any are selected)
        const matchesPersonType = !hasPersonTypes || personTypes.some(pt => sin.involvedPersonTypes.includes(pt));

        // Must match selected activities (if any are selected)
        const matchesActivity = !hasActivities || activities.some(act => sin.associatedActivities.includes(act));

        // BOTH conditions must be satisfied
        return matchesPersonType && matchesActivity;
      });
      sinsToShow = filtered.map(s => s.id);
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
    return <ExaminationFlow personTypes={examContext.personTypes} activities={examContext.activities} sinsToShow={examContext.sinsToShow} onBack={handleBack} onComplete={handleComplete} />;
  }
  return <div className="flex flex-col min-h-full pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between h-11 px-4">
          <div className="w-10" /> {/* Spacer */}
          <h1 className="text-ios-headline font-semibold text-foreground">Examen</h1>
          <Link to="/settings" className="text-muted-foreground active:opacity-70 transition-opacity touch-target">
            <Settings className="w-6 h-6 my-[9px]" />
          </Link>
        </div>
      </header>
      
      <div className="flex-1 py-4 space-y-4 overflow-auto">
        {/* State indicator */}
        <div className="animate-fade-in">
          <StateIndicator state={examState} timeAgo={timeAgo} />
        </div>
        
        {/* Context selector with multi-selection */}
        <div className="animate-fade-in" style={{
        animationDelay: '100ms'
      }}>
          <ContextSelector onGenerate={handleGenerate} />
        </div>
        
        {/* Subtle count - only if there have been examinations today */}
        {userState.todayCount > 0 && <div className="text-center animate-fade-in" style={{
        animationDelay: '200ms'
      }}>
            <p className="text-ios-caption text-muted-foreground/60">
              {userState.todayCount} {userState.todayCount === 1 ? 'examen' : 'exámenes'} hoy
            </p>
          </div>}
      </div>
    </div>;
}
export default HomePage;