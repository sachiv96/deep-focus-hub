import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';
import { StudySession, EnergyLevel } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DailyLogProps {
  sessions: StudySession[];
  onAddSession: (session: Omit<StudySession, 'id' | 'durationMinutes'>) => void;
  onDeleteSession: (id: string) => void;
  dailyTotal: number;
}

export function DailyLog({ sessions, onAddSession, onDeleteSession, dailyTotal }: DailyLogProps) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [subject, setSubject] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [focusQuality, setFocusQuality] = useState('3');
  const [distractionCount, setDistractionCount] = useState('0');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('medium');
  const [notes, setNotes] = useState('');

  const todaySessions = sessions.filter(s => s.date === today);

  const handleAdd = () => {
    if (!subject || !startTime || !endTime) return;
    onAddSession({
      date: today,
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

  const getEnergyColor = (level: EnergyLevel) => {
    switch (level) {
      case 'high': return 'text-success';
      case 'medium': return 'text-warning';
      case 'low': return 'text-destructive';
    }
  };

  return (
    <div className="space-y-6">
      {/* Today's Summary */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Today — {format(new Date(), 'EEEE, MMM d')}</h2>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Real Study:</span>
            <span className={`stat-value text-2xl ${dailyTotal >= 8 ? 'text-success' : dailyTotal >= 5 ? 'text-primary' : 'text-destructive'}`}>
              {dailyTotal}h
            </span>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-2 mt-3">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min((dailyTotal / 10) * 100, 100)}%`,
              background: `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--success)))`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>0h</span><span>5h</span><span>10h</span>
        </div>
      </div>

      {/* Add Session Form */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Log Study Session</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Input
            placeholder="Subject / Task"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="col-span-2 bg-muted/50 border-border"
          />
          <Input
            type="time"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            className="bg-muted/50 border-border"
          />
          <Input
            type="time"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            className="bg-muted/50 border-border"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Select value={focusQuality} onValueChange={setFocusQuality}>
            <SelectTrigger className="bg-muted/50 border-border">
              <SelectValue placeholder="Focus (1-5)" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map(n => (
                <SelectItem key={n} value={String(n)}>Focus: {'★'.repeat(n)}{'☆'.repeat(5 - n)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min="0"
            placeholder="Distractions"
            value={distractionCount}
            onChange={e => setDistractionCount(e.target.value)}
            className="bg-muted/50 border-border"
          />
          <Select value={energyLevel} onValueChange={(v) => setEnergyLevel(v as EnergyLevel)}>
            <SelectTrigger className="bg-muted/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">⚡ High Energy</SelectItem>
              <SelectItem value="medium">🔋 Medium Energy</SelectItem>
              <SelectItem value="low">🪫 Low Energy</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Notes (optional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="bg-muted/50 border-border"
          />
        </div>
        <Button onClick={handleAdd} className="w-full" disabled={!subject || !startTime || !endTime}>
          <Plus className="w-4 h-4 mr-2" /> Log Session
        </Button>
      </div>

      {/* Sessions List */}
      <div className="space-y-2">
        {todaySessions.length === 0 ? (
          <div className="glass-card p-8 text-center text-muted-foreground">
            No sessions logged today. Start your deep work! 🎯
          </div>
        ) : (
          todaySessions.map(session => (
            <div key={session.id} className="glass-card p-4 flex items-center justify-between group">
              <div className="flex-1 grid grid-cols-2 md:grid-cols-6 gap-2 items-center">
                <span className="font-medium text-foreground">{session.subject}</span>
                <span className="font-mono text-sm text-muted-foreground">
                  {session.startTime} → {session.endTime}
                </span>
                <span className="font-mono text-primary font-semibold">
                  {Math.floor(session.durationMinutes / 60)}h {session.durationMinutes % 60}m
                </span>
                <span className="text-sm">{'★'.repeat(session.focusQuality)}{'☆'.repeat(5 - session.focusQuality)}</span>
                <span className={`text-sm ${getEnergyColor(session.energyLevel)}`}>
                  {session.energyLevel === 'high' ? '⚡' : session.energyLevel === 'medium' ? '🔋' : '🪫'} {session.energyLevel}
                </span>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteSession(session.id)}
                    className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
