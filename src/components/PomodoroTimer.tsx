import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, Brain, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroTimerProps {
  onSessionComplete?: (minutes: number) => void;
}

const MODE_CONFIG: Record<TimerMode, { label: string; minutes: number; color: string; icon: React.ReactNode }> = {
  work: { label: 'Deep Work', minutes: 25, color: 'hsl(var(--primary))', icon: <Brain className="w-5 h-5" /> },
  shortBreak: { label: 'Short Break', minutes: 5, color: 'hsl(var(--success))', icon: <Coffee className="w-5 h-5" /> },
  longBreak: { label: 'Long Break', minutes: 15, color: 'hsl(var(--chart-3))', icon: <Coffee className="w-5 h-5" /> },
};

export function PomodoroTimer({ onSessionComplete }: PomodoroTimerProps) {
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(MODE_CONFIG.work.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessions] = useState(0);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const config = MODE_CONFIG[mode];
  const totalSeconds = config.minutes * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  const playSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.3;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  }, [soundEnabled]);

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(MODE_CONFIG[newMode].minutes * 60);
    setIsRunning(false);
  }, []);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          playSound();

          if (mode === 'work') {
            const newCount = sessionsCompleted + 1;
            setSessions(newCount);
            setTotalFocusMinutes(prev => prev + MODE_CONFIG.work.minutes);
            onSessionComplete?.(MODE_CONFIG.work.minutes);
            // Auto-switch to break
            const nextMode = newCount % 4 === 0 ? 'longBreak' : 'shortBreak';
            setTimeout(() => switchMode(nextMode), 500);
          } else {
            setTimeout(() => switchMode('work'), 500);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode, sessionsCompleted, onSessionComplete, playSound, switchMode]);

  const reset = () => {
    setIsRunning(false);
    setTimeLeft(totalSeconds);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Mode Selector */}
      <div className="glass-card p-2 flex gap-1">
        {(Object.keys(MODE_CONFIG) as TimerMode[]).map(m => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-all duration-300 ${
              mode === m
                ? 'bg-primary/20 text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {MODE_CONFIG[m].icon}
            <span className="hidden sm:inline">{MODE_CONFIG[m].label}</span>
          </button>
        ))}
      </div>

      {/* Timer Circle */}
      <div className="glass-card p-8 flex flex-col items-center">
        <div className="relative w-64 h-64 mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 260 260">
            {/* Background circle */}
            <circle
              cx="130" cy="130" r="120"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="6"
            />
            {/* Progress circle */}
            <motion.circle
              cx="130" cy="130" r="120"
              fill="none"
              stroke={config.color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              initial={false}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ filter: `drop-shadow(0 0 8px ${config.color})` }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={timeLeft}
                initial={{ scale: 0.95, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <span className="font-mono text-6xl font-bold tracking-tight text-foreground">
                  {String(minutes).padStart(2, '0')}
                </span>
                <span className="font-mono text-6xl font-bold text-muted-foreground mx-1">:</span>
                <span className="font-mono text-6xl font-bold tracking-tight text-foreground">
                  {String(seconds).padStart(2, '0')}
                </span>
              </motion.div>
            </AnimatePresence>
            <p className="text-sm text-muted-foreground mt-2 font-medium">{config.label}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={reset} className="rounded-full w-12 h-12">
            <RotateCcw className="w-5 h-5" />
          </Button>

          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => setIsRunning(!isRunning)}
              className="rounded-full w-16 h-16 text-lg shadow-lg"
              style={{ background: config.color }}
            >
              {isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
            </Button>
          </motion.div>

          <Button variant="outline" size="icon" onClick={() => {
            if (mode === 'work') switchMode('shortBreak');
            else switchMode('work');
          }} className="rounded-full w-12 h-12">
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          className="glass-card p-4 text-center"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sessions</p>
          <p className="stat-value text-2xl text-primary">{sessionsCompleted}</p>
        </motion.div>
        <motion.div
          className="glass-card p-4 text-center"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Focus Time</p>
          <p className="stat-value text-2xl text-foreground">{totalFocusMinutes}m</p>
        </motion.div>
        <motion.div
          className="glass-card p-4 text-center"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sound</p>
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="mx-auto mt-1">
            {soundEnabled ? <Volume2 className="w-6 h-6 text-primary" /> : <VolumeX className="w-6 h-6 text-muted-foreground" />}
          </button>
        </motion.div>
      </div>

      {/* Session Dots */}
      {sessionsCompleted > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-4 flex items-center justify-center gap-2 flex-wrap"
        >
          <span className="text-xs text-muted-foreground mr-2">Pomodoros:</span>
          {Array.from({ length: sessionsCompleted }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`w-3 h-3 rounded-full ${
                (i + 1) % 4 === 0 ? 'bg-success' : 'bg-primary'
              }`}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
