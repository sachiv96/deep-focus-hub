import { useState } from 'react';
import { format } from 'date-fns';
import { BookOpen, CheckSquare, BarChart3, Target, Flame } from 'lucide-react';
import { useStudyTracker } from '@/hooks/useStudyTracker';
import { DailyLog } from '@/components/DailyLog';
import { HabitTracker } from '@/components/HabitTracker';
import { Dashboard } from '@/components/Dashboard';
import { Progression } from '@/components/Progression';
import { TabType } from '@/lib/types';

const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
  { key: 'daily', label: 'Daily Log', icon: <BookOpen className="w-4 h-4" /> },
  { key: 'habits', label: 'Habits', icon: <CheckSquare className="w-4 h-4" /> },
  { key: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
  { key: 'progression', label: 'Progression', icon: <Target className="w-4 h-4" /> },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const tracker = useStudyTracker();
  const today = format(new Date(), 'yyyy-MM-dd');
  const dailyTotal = tracker.getDailyTotalHours(today);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-10 bg-background/80">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Flame className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Deep Work Tracker</h1>
              <p className="text-xs text-muted-foreground">Real study hours only</p>
            </div>
          </div>
          <div className="flex items-center gap-2 glass-card px-3 py-2">
            <span className="text-xs text-muted-foreground">Today:</span>
            <span className="font-mono font-bold text-primary">{dailyTotal}h</span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="border-b border-border/30">
        <div className="max-w-4xl mx-auto px-4 flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'daily' && (
          <DailyLog
            sessions={tracker.sessions}
            onAddSession={tracker.addSession}
            onDeleteSession={tracker.deleteSession}
            dailyTotal={dailyTotal}
          />
        )}
        {activeTab === 'habits' && (
          <HabitTracker
            habits={tracker.getHabitsForDate(today)}
            onUpdate={tracker.updateHabits}
            streaks={tracker.getHabitStreaks()}
            monthlyCompletion={tracker.getMonthlyHabitCompletion()}
          />
        )}
        {activeTab === 'dashboard' && (
          <Dashboard tracker={tracker} />
        )}
        {activeTab === 'progression' && (
          <Progression tracker={tracker} />
        )}
      </main>
    </div>
  );
};

export default Index;
