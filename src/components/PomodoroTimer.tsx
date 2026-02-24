import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Coffee, Brain, SkipForward, Volume2, VolumeX, Wind, Waves, TreePine, Plus, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';
type AmbientSound = 'none' | 'rain' | 'forest' | 'waves';

interface PomodoroTimerProps {
  onSessionComplete?: (minutes: number) => void;
}

const MODE_CONFIG: Record<TimerMode, { label: string; minutes: number; icon: React.ReactNode }> = {
  work: { label: 'Deep Focus', minutes: 25, icon: <Brain className="w-5 h-5" /> },
  shortBreak: { label: 'Short Break', minutes: 5, icon: <Coffee className="w-5 h-5" /> },
  longBreak: { label: 'Long Break', minutes: 15, icon: <Coffee className="w-5 h-5" /> },
};

const AMBIENT_SOUNDS: { key: AmbientSound; label: string; icon: React.ReactNode }[] = [
  { key: 'none', label: 'Off', icon: <VolumeX className="w-4 h-4" /> },
  { key: 'rain', label: 'Rain', icon: <Wind className="w-4 h-4" /> },
  { key: 'forest', label: 'Forest', icon: <TreePine className="w-4 h-4" /> },
  { key: 'waves', label: 'Waves', icon: <Waves className="w-4 h-4" /> },
];

// White noise generator
function createAmbientNoise(ctx: AudioContext, type: AmbientSound): AudioNode | null {
  if (type === 'none') return null;
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.15;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  gain.gain.value = 0.08;

  if (type === 'rain') {
    filter.type = 'lowpass';
    filter.frequency.value = 800;
  } else if (type === 'forest') {
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 0.5;
  } else {
    filter.type = 'lowpass';
    filter.frequency.value = 400;
  }

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
  return source;
}

export function PomodoroTimer({ onSessionComplete }: PomodoroTimerProps) {
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(MODE_CONFIG.work.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessions] = useState(0);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ambientSound, setAmbientSound] = useState<AmbientSound>('none');
  const [currentTask, setCurrentTask] = useState('');
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [dailyGoal] = useState(8); // 8 pomodoros
  const [breathePhase, setBreathePhase] = useState<'in' | 'hold' | 'out'>('in');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ambientRef = useRef<{ ctx: AudioContext; source: AudioNode } | null>(null);

  const config = MODE_CONFIG[mode];
  const totalSeconds = config.minutes * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds);

  // Breathing animation during breaks
  useEffect(() => {
    if (mode !== 'work' && isRunning) {
      const phases: ('in' | 'hold' | 'out')[] = ['in', 'hold', 'out'];
      let idx = 0;
      const interval = setInterval(() => {
        idx = (idx + 1) % 3;
        setBreathePhase(phases[idx]);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [mode, isRunning]);

  // Ambient sound
  useEffect(() => {
    if (ambientSound !== 'none' && isRunning) {
      try {
        const ctx = new AudioContext();
        const source = createAmbientNoise(ctx, ambientSound);
        if (source) {
          ambientRef.current = { ctx, source };
        }
      } catch {}
    }
    return () => {
      if (ambientRef.current) {
        ambientRef.current.ctx.close();
        ambientRef.current = null;
      }
    };
  }, [ambientSound, isRunning]);

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
            setTotalFocusMinutes(p => p + MODE_CONFIG.work.minutes);
            onSessionComplete?.(MODE_CONFIG.work.minutes);
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
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, mode, sessionsCompleted, onSessionComplete, playSound, switchMode]);

  const reset = () => { setIsRunning(false); setTimeLeft(totalSeconds); };
  const toggleTimer = () => setIsRunning(!isRunning);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Clock calculations
  const minuteHandAngle = (progress * 360);
  const tickMarks = Array.from({ length: 60 }, (_, i) => i);
  const goalProgress = Math.min(sessionsCompleted / dailyGoal, 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Mode Selector */}
      <div className="glass-card p-1.5 flex gap-1">
        {(Object.keys(MODE_CONFIG) as TimerMode[]).map(m => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-300 ${
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

      {/* Task Label */}
      <div className="glass-card p-3">
        <AnimatePresence mode="wait">
          {showTaskInput ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2"
            >
              <input
                autoFocus
                value={currentTask}
                onChange={e => setCurrentTask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setShowTaskInput(false)}
                placeholder="What are you working on?"
                className="flex-1 bg-transparent border-b border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary py-1 px-1"
              />
              <button onClick={() => setShowTaskInput(false)}>
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTaskInput(true)}
              className="w-full flex items-center gap-2 text-sm"
            >
              {currentTask ? (
                <span className="text-foreground font-medium truncate">{currentTask}</span>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Add task label...</span>
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Analog Clock Timer */}
      <div className="glass-card p-6 sm:p-8 flex flex-col items-center">
        <div
          className="relative w-56 h-56 sm:w-72 sm:h-72 cursor-pointer select-none"
          onClick={toggleTimer}
        >
          <svg className="w-full h-full" viewBox="0 0 300 300">
            {/* Outer ring glow */}
            <circle
              cx="150" cy="150" r="145"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="1"
              opacity="0.3"
            />

            {/* Tick marks */}
            {tickMarks.map(i => {
              const angle = (i / 60) * 360 - 90;
              const rad = (angle * Math.PI) / 180;
              const isMajor = i % 5 === 0;
              const innerR = isMajor ? 118 : 124;
              const outerR = 132;
              const elapsed = progress >= i / 60;
              return (
                <line
                  key={i}
                  x1={150 + innerR * Math.cos(rad)}
                  y1={150 + innerR * Math.sin(rad)}
                  x2={150 + outerR * Math.cos(rad)}
                  y2={150 + outerR * Math.sin(rad)}
                  stroke={elapsed ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                  strokeWidth={isMajor ? 2.5 : 1}
                  opacity={elapsed ? 1 : 0.25}
                  className="transition-all duration-300"
                />
              );
            })}

            {/* Progress arc */}
            <motion.circle
              cx="150" cy="150" r="138"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 138}
              strokeDashoffset={2 * Math.PI * 138 * (1 - progress)}
              transform="rotate(-90 150 150)"
              style={{ filter: 'drop-shadow(0 0 6px hsl(var(--primary) / 0.4))' }}
              initial={false}
              animate={{ strokeDashoffset: 2 * Math.PI * 138 * (1 - progress) }}
              transition={{ duration: 0.5 }}
            />

            {/* Clock hand */}
            <motion.line
              x1="150" y1="150"
              x2="150" y2="40"
              stroke="hsl(var(--primary))"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={false}
              animate={{ rotate: minuteHandAngle }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ transformOrigin: '150px 150px', filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.5))' }}
            />

            {/* Center dot */}
            <circle cx="150" cy="150" r="5" fill="hsl(var(--primary))" />
            <circle cx="150" cy="150" r="2.5" fill="hsl(var(--background))" />
          </svg>

          {/* Digital time overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <motion.div
              className="text-center mt-8"
              initial={false}
              animate={{ scale: isRunning ? 1 : 1.02 }}
              transition={{ duration: 0.8, repeat: isRunning ? 0 : Infinity, repeatType: 'reverse' }}
            >
              <span className="font-mono text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
                {String(minutes).padStart(2, '0')}
                <span className="text-muted-foreground mx-0.5">:</span>
                {String(seconds).padStart(2, '0')}
              </span>
            </motion.div>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium uppercase tracking-widest">
              {isRunning ? config.label : 'Tap to start'}
            </p>
          </div>

          {/* Pulsing ring when running */}
          {isRunning && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/20"
              animate={{ scale: [1, 1.04, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>

        {/* Breathing guide during breaks */}
        {mode !== 'work' && isRunning && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex flex-col items-center gap-2"
          >
            <motion.div
              className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30"
              animate={{
                scale: breathePhase === 'in' ? 1.5 : breathePhase === 'hold' ? 1.5 : 1,
                opacity: breathePhase === 'hold' ? 0.7 : 1,
              }}
              transition={{ duration: 2.5, ease: 'easeInOut' }}
            />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Breathe {breathePhase === 'in' ? 'In' : breathePhase === 'hold' ? 'Hold' : 'Out'}
            </span>
          </motion.div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3 mt-5">
          <Button variant="outline" size="icon" onClick={reset} className="rounded-full w-11 h-11 border-border/50">
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => {
            if (mode === 'work') switchMode('shortBreak');
            else switchMode('work');
          }} className="rounded-full w-11 h-11 border-border/50">
            <SkipForward className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="rounded-full w-11 h-11 border-border/50"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Ambient Sounds */}
      <div className="glass-card p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Ambient Sound</p>
        <div className="flex gap-2">
          {AMBIENT_SOUNDS.map(s => (
            <button
              key={s.key}
              onClick={() => setAmbientSound(s.key)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                ambientSound === s.key
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent'
              }`}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          className="glass-card p-4 text-center"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Sessions</p>
          <p className="stat-value text-2xl text-primary">{sessionsCompleted}</p>
        </motion.div>
        <motion.div
          className="glass-card p-4 text-center"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Focus Time</p>
          <p className="stat-value text-2xl text-foreground">{totalFocusMinutes}m</p>
        </motion.div>
      </div>

      {/* Daily Goal Progress */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Daily Goal</p>
          </div>
          <span className="text-sm font-mono font-bold text-foreground">
            {sessionsCompleted}/{dailyGoal}
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${goalProgress * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{ boxShadow: '0 0 8px hsl(var(--primary) / 0.4)' }}
          />
        </div>
        {sessionsCompleted >= dailyGoal && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-primary font-medium mt-2 text-center"
          >
            🔥 Daily goal reached!
          </motion.p>
        )}
      </div>

      {/* Session Dots */}
      {sessionsCompleted > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-4 flex items-center justify-center gap-2 flex-wrap"
        >
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-2">Pomodoros</span>
          {Array.from({ length: sessionsCompleted }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05, type: 'spring' }}
              className={`w-3 h-3 rounded-full ${
                (i + 1) % 4 === 0 ? 'bg-success' : 'bg-primary'
              }`}
              style={{ boxShadow: `0 0 6px ${(i + 1) % 4 === 0 ? 'hsl(var(--success) / 0.5)' : 'hsl(var(--primary) / 0.4)'}` }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
