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
    <div className="space-y-6">
      {/* Current Target */}
      <div className="glass-card p-6 glow-primary">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-semibold">Weekly Target</h2>
        </div>
        <div className="grid grid-cols-3 gap-6 mb-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Target / Day</p>
            <p className="stat-value text-primary">{currentTarget.targetHours}h</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Achieved</p>
            <p className="stat-value text-foreground">{Math.round(totalThisWeek * 10) / 10}h</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
            {isOnTrack ? (
              <CheckCircle2 className="w-8 h-8 text-success mx-auto" />
            ) : (
              <XCircle className="w-8 h-8 text-destructive mx-auto" />
            )}
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all duration-700"
            style={{
              width: `${progressPercent}%`,
              background: progressPercent >= 80
                ? 'hsl(var(--success))'
                : progressPercent >= 50
                  ? 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--warning)))'
                  : 'hsl(var(--destructive))',
            }}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2 text-center">{progressPercent}% of weekly goal</p>
      </div>

      {/* Daily Breakdown */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">This Week's Breakdown</h3>
        </div>
        <div className="space-y-3">
          {last7Days.map(day => {
            const target = currentTarget.targetHours;
            const percent = Math.min(100, Math.round((day.hours / target) * 100));
            return (
              <div key={day.fullDate} className="flex items-center gap-3">
                <span className="w-10 text-sm font-mono text-muted-foreground">{day.date}</span>
                <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                  <div
                    className="h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                    style={{
                      width: `${Math.max(percent, 2)}%`,
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
                  </div>
                </div>
                <span className="w-16 text-right text-xs text-muted-foreground">{percent}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progression Info */}
      <div className="glass-card p-6">
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
      </div>
    </div>
  );
}
