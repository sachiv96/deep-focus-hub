import { motion } from 'framer-motion';
import { useStudyTracker } from '@/hooks/useStudyTracker';
import { Target, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';

interface ProgressionProps {
  tracker: ReturnType<typeof useStudyTracker>;
}

export function Progression({ tracker }: ProgressionProps) {
  const currentTarget = tracker.getCurrentWeekTarget();
  const last7Days = tracker.getLast7DaysData();
  const totalThisWeek = last7Days.reduce((s, d) => s + d.hours, 0);
  const dailyAvgNeeded = Math.max(0, (currentTarget.targetHours * 7 - totalThisWeek) / Math.max(1, 7 - last7Days.filter(d => d.hours > 0).length || 1));

  const progressPercent = Math.min(100, Math.round((totalThisWeek / (currentTarget.targetHours * 7)) * 100));
  const isOnTrack = progressPercent >= 50;

  return (
    <div className="space-y-5">
      {/* Current Target */}
      <motion.div
        className="glass-card p-6 glow-primary"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-semibold">Weekly Target</h2>
        </div>
        <div className="grid grid-cols-3 gap-6 mb-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Target / Day</p>
            <p className="stat-value text-gradient-primary">{currentTarget.targetHours}h</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Achieved</p>
            <p className="stat-value text-foreground">{Math.round(totalThisWeek * 10) / 10}h</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {isOnTrack ? (
                <CheckCircle2 className="w-8 h-8 text-success mx-auto" />
              ) : (
                <XCircle className="w-8 h-8 text-destructive mx-auto" />
              )}
            </motion.div>
          </div>
        </div>
        <div className="w-full bg-muted/60 rounded-full h-3 overflow-hidden">
          <motion.div
            className="h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              background: progressPercent >= 80
                ? 'hsl(var(--success))'
                : progressPercent >= 50
                  ? 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--warning)))'
                  : 'hsl(var(--destructive))',
            }}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2 text-center">{progressPercent}% of weekly goal</p>
      </motion.div>

      {/* Daily Breakdown */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">This Week's Breakdown</h3>
        </div>
        <div className="space-y-3">
          {last7Days.map((day, i) => {
            const target = currentTarget.targetHours;
            const percent = Math.min(100, Math.round((day.hours / target) * 100));
            return (
              <motion.div
                key={day.fullDate}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
              >
                <span className="w-10 text-sm font-mono text-muted-foreground">{day.date}</span>
                <div className="flex-1 bg-muted/40 rounded-full h-6 relative overflow-hidden">
                  <motion.div
                    className="h-6 rounded-full flex items-center justify-end pr-2"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(percent, 2)}%` }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.05, ease: 'easeOut' }}
                    style={{
                      background: percent >= 100
                        ? 'hsl(var(--success))'
                        : percent >= 60
                          ? 'hsl(var(--primary))'
                          : percent > 0
                            ? 'hsl(var(--warning))'
                            : 'transparent',
                    }}
                  >
                    {day.hours > 0 && (
                      <span className="text-xs font-mono font-semibold text-primary-foreground">{day.hours}h</span>
                    )}
                  </motion.div>
                </div>
                <span className="w-16 text-right text-xs text-muted-foreground">{percent}%</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Progression Info */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">How Progression Works</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• Your target starts at <span className="text-primary font-semibold">5 hours/day</span> and increases gradually.</p>
          <p>• Each week, if you meet your target, it increases by <span className="text-primary font-semibold">30 minutes</span>.</p>
          <p>• Maximum target is <span className="text-primary font-semibold">10 hours/day</span> of real deep work.</p>
          <p>• Only <span className="text-foreground font-semibold">focused study time</span> counts — no breaks, no distractions.</p>
          {dailyAvgNeeded > 0 && (
            <p className="text-foreground mt-3">
              📊 To stay on track, aim for <span className="text-primary font-semibold font-mono">{Math.round(dailyAvgNeeded * 10) / 10}h/day</span> for the rest of this week.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
