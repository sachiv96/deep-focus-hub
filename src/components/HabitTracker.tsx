import { format } from 'date-fns';
import { motion } from 'framer-motion';
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
    <div className="space-y-5">
      {/* Today's Overview */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Today's Habits</h2>
          <div className="flex items-center gap-2">
            <span className={`stat-value text-2xl ${completionPercent === 100 ? 'text-success' : completionPercent >= 50 ? 'text-gradient-primary' : 'text-destructive'}`}>
              {completionPercent}%
            </span>
          </div>
        </div>
        <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              background: completionPercent === 100
                ? `hsl(var(--success))`
                : `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))`,
            }}
          />
        </div>
      </motion.div>

      {/* Habit Toggles */}
      <div className="grid gap-3">
        {HABIT_CONFIG.map((habit, i) => {
          const isChecked = currentHabits[habit.key];
          const streak = streaks[habit.key] || 0;
          return (
            <motion.button
              key={habit.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleHabit(habit.key)}
              className={`glass-card-hover p-4 flex items-center justify-between text-left ${
                isChecked ? 'border-success/30 glow-success' : ''
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
                <motion.div
                  animate={{
                    scale: isChecked ? [1, 1.2, 1] : 1,
                    backgroundColor: isChecked ? 'hsl(142, 60%, 45%)' : 'hsl(220, 14%, 14%)',
                  }}
                  transition={{ duration: 0.3 }}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                >
                  {isChecked ? <Check className="w-4 h-4 text-success-foreground" /> : <X className="w-4 h-4 text-muted-foreground" />}
                </motion.div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          className="glass-card p-5 text-center"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Monthly Consistency</p>
          <p className="stat-value text-gradient-primary">{monthlyCompletion.overall}%</p>
        </motion.div>
        <motion.div
          className="glass-card p-5 text-center"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">English Practice</p>
          <p className="stat-value text-gradient-primary">{monthlyCompletion.english}%</p>
        </motion.div>
      </div>
    </div>
  );
}
