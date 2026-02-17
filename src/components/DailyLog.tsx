import { useState } from 'react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { Plus, Trash2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudySession, EnergyLevel } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DailyLogProps {
  sessions: StudySession[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onAddSession: (session: Omit<StudySession, 'id' | 'durationMinutes'>) => void;
  onDeleteSession: (id: string) => void;
  dailyTotal: number;
}

export function DailyLog({ sessions, selectedDate, onDateChange, onAddSession, onDeleteSession, dailyTotal }: DailyLogProps) {
  const [subject, setSubject] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [focusQuality, setFocusQuality] = useState('3');
  const [distractionCount, setDistractionCount] = useState('0');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('medium');
  const [notes, setNotes] = useState('');

  const daySessions = sessions.filter(s => s.date === selectedDate);
  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');

  const handleAdd = () => {
    if (!subject || !startTime || !endTime) return;
    onAddSession({
      date: selectedDate,
      subject,
      startTime,
      endTime,
      focusQuality: parseInt(focusQuality),
      distractionCount: parseInt(distractionCount),
      energyLevel,
      notes,
    });
    setSubject('');
    setStartTime('');
    setEndTime('');
    setNotes('');
    setDistractionCount('0');
  };

  const navigateDate = (dir: number) => {
    const d = dir > 0 ? addDays(parseISO(selectedDate), 1) : subDays(parseISO(selectedDate), 1);
    onDateChange(format(d, 'yyyy-MM-dd'));
  };

  const getEnergyColor = (level: EnergyLevel) => {
    switch (level) {
      case 'high': return 'text-success';
      case 'medium': return 'text-warning';
      case 'low': return 'text-destructive';
    }
  };

  const totalMinutes = daySessions.reduce((s, sess) => s + sess.durationMinutes, 0);

  return (
    <div className="space-y-5">
      {/* Date Navigation */}
      <motion.div
        className="glass-card p-4 flex items-center justify-between"
        whileHover={{ scale: 1.005 }}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        <button onClick={() => navigateDate(-1)} className="p-2 rounded-lg hover:bg-muted/80 transition-colors">
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-primary" />
          <div className="text-center">
            <h2 className="font-semibold">
              {isToday ? 'Today' : format(parseISO(selectedDate), 'EEEE')} — {format(parseISO(selectedDate), 'MMM d, yyyy')}
            </h2>
          </div>
          {!isToday && (
            <button
              onClick={() => onDateChange(format(new Date(), 'yyyy-MM-dd'))}
              className="text-xs text-primary hover:underline ml-2"
            >
              Go to Today
            </button>
          )}
        </div>
        <button onClick={() => navigateDate(1)} className="p-2 rounded-lg hover:bg-muted/80 transition-colors">
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </motion.div>

      {/* Today's Summary */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm text-muted-foreground">{daySessions.length} session{daySessions.length !== 1 ? 's' : ''} logged</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Real Study</span>
              <span className={`stat-value text-2xl ${dailyTotal >= 8 ? 'text-success' : dailyTotal >= 5 ? 'text-gradient-primary' : dailyTotal > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
              </span>
            </div>
          </div>
        </div>
        <div className="w-full bg-muted/60 rounded-full h-2.5 mt-3 overflow-hidden">
          <motion.div
            className="h-2.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((dailyTotal / 10) * 100, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              background: dailyTotal >= 8
                ? 'hsl(var(--success))'
                : dailyTotal >= 5
                  ? 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--success)))'
                  : 'hsl(var(--primary))',
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
          <span>0h</span>
          <span className="text-primary font-medium">Target: 5-10h</span>
          <span>10h</span>
        </div>
      </motion.div>

      {/* Add Session Form */}
      <motion.div
        className="glass-card p-6 space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Log Deep Work Session</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Input
            placeholder="Subject / Task"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="col-span-2 bg-muted/30 border-border/50"
          />
          <div className="relative">
            <Input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="bg-muted/30 border-border/50"
            />
            <span className="absolute -top-2 left-2 text-[10px] text-muted-foreground bg-card px-1">Start</span>
          </div>
          <div className="relative">
            <Input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="bg-muted/30 border-border/50"
            />
            <span className="absolute -top-2 left-2 text-[10px] text-muted-foreground bg-card px-1">End</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Select value={focusQuality} onValueChange={setFocusQuality}>
            <SelectTrigger className="bg-muted/30 border-border/50">
              <SelectValue placeholder="Focus (1-5)" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map(n => (
                <SelectItem key={n} value={String(n)}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={distractionCount}
              onChange={e => setDistractionCount(e.target.value)}
              className="bg-muted/30 border-border/50"
            />
            <span className="absolute -top-2 left-2 text-[10px] text-muted-foreground bg-card px-1">Distractions</span>
          </div>
          <Select value={energyLevel} onValueChange={(v) => setEnergyLevel(v as EnergyLevel)}>
            <SelectTrigger className="bg-muted/30 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">⚡ High</SelectItem>
              <SelectItem value="medium">🔋 Medium</SelectItem>
              <SelectItem value="low">🪫 Low</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Notes (optional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="bg-muted/30 border-border/50"
          />
        </div>
        <Button onClick={handleAdd} className="w-full" disabled={!subject || !startTime || !endTime}>
          <Plus className="w-4 h-4 mr-2" /> Log Session
        </Button>
      </motion.div>

      {/* Sessions List */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider px-1">Sessions</h3>
        {daySessions.length === 0 ? (
          <motion.div
            className="glass-card p-10 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-4xl mb-3">🎯</p>
            <p className="text-muted-foreground">No sessions logged{isToday ? ' yet' : ''}.</p>
            {isToday && <p className="text-sm text-muted-foreground mt-1">Start your deep work and log it above!</p>}
          </motion.div>
        ) : (
          <AnimatePresence>
            {daySessions.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card-hover p-4 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-foreground">{session.subject}</span>
                      <span className="font-mono text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                        {session.startTime} → {session.endTime}
                      </span>
                      <span className="font-mono text-sm text-primary font-bold">
                        {Math.floor(session.durationMinutes / 60)}h {session.durationMinutes % 60}m
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{'★'.repeat(session.focusQuality)}{'☆'.repeat(5 - session.focusQuality)}</span>
                      {session.distractionCount > 0 && (
                        <span className="text-destructive">⚠ {session.distractionCount} distraction{session.distractionCount > 1 ? 's' : ''}</span>
                      )}
                      <span className={getEnergyColor(session.energyLevel)}>
                        {session.energyLevel === 'high' ? '⚡' : session.energyLevel === 'medium' ? '🔋' : '🪫'} {session.energyLevel}
                      </span>
                      {session.notes && <span className="italic">"{session.notes}"</span>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteSession(session.id)}
                    className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive shrink-0 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
