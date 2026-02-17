import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { startOfWeek } from 'date-fns';
import { useStudyTracker } from '@/hooks/useStudyTracker';

interface DashboardProps {
  tracker: ReturnType<typeof useStudyTracker>;
}

const COLORS = ['hsl(38, 92%, 55%)', 'hsl(142, 60%, 45%)', 'hsl(200, 70%, 55%)', 'hsl(280, 60%, 60%)', 'hsl(0, 72%, 55%)', 'hsl(170, 60%, 50%)'];

const TOOLTIP_STYLE = {
  background: 'hsl(220, 18%, 10%)',
  border: '1px solid hsl(220, 14%, 20%)',
  borderRadius: '10px',
  color: 'hsl(40, 20%, 95%)',
  boxShadow: '0 8px 32px hsl(0 0% 0% / 0.4)',
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

export function Dashboard({ tracker }: DashboardProps) {
  const last7Days = tracker.getLast7DaysData();
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weeklyStats = tracker.getWeeklyStats(weekStart);
  const monthlyCompletion = tracker.getMonthlyHabitCompletion();

  const subjectData = useMemo(() => {
    return Object.entries(weeklyStats.subjectMap).map(([name, minutes]) => ({
      name,
      value: Math.round(minutes / 60 * 10) / 10,
    }));
  }, [weeklyStats.subjectMap]);

  const habitData = useMemo(() => {
    const labels = ['Wake Up', 'Sleep', 'Exercise', 'English', 'No Porn', 'No Social'];
    const keys = ['wakeUpOnTime', 'sleepEnough', 'exercise', 'englishPractice', 'noPorn', 'noSocialMedia'] as const;
    return labels.map((label, i) => {
      const streak = tracker.getHabitStreaks()[keys[i]] || 0;
      return { name: label, streak };
    });
  }, [tracker]);

  const focusData = useMemo(() => {
    return last7Days.map(d => ({
      date: d.date,
      focus: d.sessions.length > 0
        ? Math.round(d.sessions.reduce((s, sess) => s + sess.focusQuality, 0) / d.sessions.length * 10) / 10
        : 0,
    }));
  }, [last7Days]);

  const avgDailyHours = useMemo(() => {
    const total = last7Days.reduce((s, d) => s + d.hours, 0);
    return Math.round(total / 7 * 10) / 10;
  }, [last7Days]);

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Weekly Total', value: `${Math.round(weeklyStats.totalHours * 10) / 10}h`, style: 'text-gradient-primary' },
          { label: 'Daily Average', value: `${avgDailyHours}h`, style: 'text-foreground' },
          { label: 'Avg Focus', value: '★'.repeat(Math.round(weeklyStats.avgFocus)), style: 'text-primary' },
          { label: 'Habit Score', value: `${monthlyCompletion.overall}%`, style: 'text-success' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.03, y: -2 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="glass-card p-5 text-center"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{card.label}</p>
            <p className={`stat-value ${card.style}`}>{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Study Hours Chart */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">Daily Study Hours (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={last7Days}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
            <XAxis dataKey="date" stroke="hsl(220, 10%, 50%)" fontSize={12} />
            <YAxis stroke="hsl(220, 10%, 50%)" fontSize={12} domain={[0, 12]} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="hours" stroke="hsl(38, 92%, 55%)" strokeWidth={3} dot={{ fill: 'hsl(38, 92%, 55%)', r: 5, strokeWidth: 2, stroke: 'hsl(220, 18%, 10%)' }} activeDot={{ r: 7 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Subject Distribution */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">Subject Distribution</h3>
          {subjectData.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={subjectData} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" label={({ name, value }) => `${name}: ${value}h`}>
                  {subjectData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Habit Streaks */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">Habit Streaks</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={habitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
              <XAxis dataKey="name" stroke="hsl(220, 10%, 50%)" fontSize={10} />
              <YAxis stroke="hsl(220, 10%, 50%)" fontSize={12} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="streak" fill="hsl(142, 60%, 45%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Focus Trend */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">Focus Quality Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={focusData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
            <XAxis dataKey="date" stroke="hsl(220, 10%, 50%)" fontSize={12} />
            <YAxis stroke="hsl(220, 10%, 50%)" fontSize={12} domain={[0, 5]} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="focus" stroke="hsl(200, 70%, 55%)" strokeWidth={3} dot={{ fill: 'hsl(200, 70%, 55%)', r: 5, strokeWidth: 2, stroke: 'hsl(220, 18%, 10%)' }} activeDot={{ r: 7 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
