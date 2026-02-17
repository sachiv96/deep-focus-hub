import { useState } from 'react';
import { format } from 'date-fns';
import { BookOpen, CheckSquare, BarChart3, Target, Flame, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudyTracker } from '@/hooks/useStudyTracker';
import { DailyLog } from '@/components/DailyLog';
import { HabitTracker } from '@/components/HabitTracker';
import { Dashboard } from '@/components/Dashboard';
import { Progression } from '@/components/Progression';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { TabType } from '@/lib/types';

const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
  { key: 'daily', label: 'Daily Log', icon: <BookOpen className="w-4 h-4" /> },
  { key: 'timer', label: 'Timer', icon: <Timer className="w-4 h-4" /> },
  { key: 'habits', label: 'Habits', icon: <CheckSquare className="w-4 h-4" /> },
  { key: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
  { key: 'progression', label: 'Goals', icon: <Target className="w-4 h-4" /> },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const tracker = useStudyTracker();
  const today = format(new Date(), 'yyyy-MM-dd');
  const dailyTotal = tracker.getDailyTotalHours(today);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-xl sticky top-0 z-10 bg-background/80">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <Flame className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Deep Work</h1>
              <p className="text-[11px] text-muted-foreground leading-tight">Real hours only</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="glass-card px-3 py-1.5 flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Today</span>
              <span className="font-mono font-bold text-primary text-lg">{dailyTotal}h</span>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="border-b border-border/30 bg-background/60 backdrop-blur-xl sticky top-[61px] z-10">
        <div className="max-w-4xl mx-auto px-4 flex">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {activeTab === tab.key && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'daily' && (
              <DailyLog
                sessions={tracker.sessions}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onAddSession={tracker.addSession}
                onDeleteSession={tracker.deleteSession}
                dailyTotal={tracker.getDailyTotalHours(selectedDate)}
              />
            )}
            {activeTab === 'timer' && <PomodoroTimer />}
            {activeTab === 'habits' && (
              <HabitTracker
                habits={tracker.getHabitsForDate(today)}
                onUpdate={tracker.updateHabits}
                streaks={tracker.getHabitStreaks()}
                monthlyCompletion={tracker.getMonthlyHabitCompletion()}
              />
            )}
            {activeTab === 'dashboard' && <Dashboard tracker={tracker} />}
            {activeTab === 'progression' && <Progression tracker={tracker} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;
