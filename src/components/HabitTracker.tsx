import { format } from 'date-fns';
import { DailyHabits } from '@/lib/types';
import { Check, X, Flame } from 'lucide-react';

interface HabitTrackerProps {
  habits: DailyHabits | undefined;
  onUpdate: (habits: DailyHabits) => void;
  streaks: Record<string, number>;
  monthlyCompletion: { overall: number; english: number };
}

const HABIT_CONFIG = [
  { key: 'wakeUpOnTime' as const, label: 'Wake Up On Time', icon: '🌅' },
  { key: 'sleepEnough' as const, label: 'Sleep ≥ 7 Hours', icon: '😴' },
  { key: 'exercise' as const, label: 'Exercise / Walk', icon: '🏃' },
  { key: 'englishPractice' as const, label: 'English Practice (1hr)', icon: '📖' },
  { key: 'noPorn' as const, label: 'No Porn', icon: '🛡️' },
  { key: 'noSocialMedia' as const, label: 'No Social Media', icon: '📵' },
];

export function HabitTracker({ habits, onUpdate, streaks, monthlyCompletion }: HabitTrackerProps) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const currentHabits: DailyHabits = habits || {
    date: today,
    wakeUpOnTime: false,
    sleepEnough: false,
    exercise: false,
    englishPractice: false,
    noPorn: false,
    noSocialMedia: false,
  };

  const toggleHabit = (key: keyof DailyHabits) => {
    if (key === 'date') return;
    onUpdate({ ...currentHabits, date: today, [key]: !currentHabits[key] });
  };

  const completedCount = HABIT_CONFIG.filter(h => currentHabits[h.key]).length;
  const completionPercent = Math.round((completedCount / HABIT_CONFIG.length) * 100);

  return (
    <div className="space-y-6">
      {/* Today's Overview */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Today's Habits</h2>
          <div className="flex items-center gap-2">
            <span className={`stat-value text-2xl ${completionPercent === 100 ? 'text-success' : completionPercent >= 50 ? 'text-primary' : 'text-destructive'}`}>
              {completionPercent}%
            </span>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: `${completionPercent}%`,
              background: completionPercent === 100
                ? `hsl(var(--success))`
                : `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))`,
            }}
          />
        </div>
      </div>

      {/* Habit Toggles */}
      <div className="grid gap-3">
        {HABIT_CONFIG.map(habit => {
          const isChecked = currentHabits[habit.key];
          const streak = streaks[habit.key] || 0;
          return (
            <button
              key={habit.key}
              onClick={() => toggleHabit(habit.key)}
              className={`glass-card p-4 flex items-center justify-between transition-all duration-200 hover:border-primary/30 ${
                isChecked ? 'border-success/30 glow-primary' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{habit.icon}</span>
                <span className={`font-medium ${isChecked ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {habit.label}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {streak > 0 && (
                  <div className="flex items-center gap-1 text-primary text-sm">
                    <Flame className="w-4 h-4" />
                    <span className="font-mono font-semibold">{streak}</span>
                  </div>
                )}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isChecked ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {isChecked ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Monthly Consistency</p>
          <p className="stat-value text-primary">{monthlyCompletion.overall}%</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">English Practice</p>
          <p className="stat-value text-primary">{monthlyCompletion.english}%</p>
        </div>
      </div>
    </div>
  );
}
