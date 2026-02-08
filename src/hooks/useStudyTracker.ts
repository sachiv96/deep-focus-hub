import { useState, useEffect, useCallback } from 'react';
import { StudySession, DailyHabits, WeeklyTarget } from '@/lib/types';
import { format, startOfWeek, endOfWeek, parseISO, isWithinInterval, subWeeks, differenceInMinutes, parse } from 'date-fns';

const SESSIONS_KEY = 'deepwork-sessions';
const HABITS_KEY = 'deepwork-habits';
const TARGETS_KEY = 'deepwork-targets';

function loadFromStorage<T>(key: string, fallback: T[]): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function useStudyTracker() {
  const [sessions, setSessions] = useState<StudySession[]>(() => loadFromStorage(SESSIONS_KEY, []));
  const [habits, setHabits] = useState<DailyHabits[]>(() => loadFromStorage(HABITS_KEY, []));
  const [targets, setTargets] = useState<WeeklyTarget[]>(() => loadFromStorage(TARGETS_KEY, []));

  useEffect(() => saveToStorage(SESSIONS_KEY, sessions), [sessions]);
  useEffect(() => saveToStorage(HABITS_KEY, habits), [habits]);
  useEffect(() => saveToStorage(TARGETS_KEY, targets), [targets]);

  const addSession = useCallback((session: Omit<StudySession, 'id' | 'durationMinutes'>) => {
    const start = parse(session.startTime, 'HH:mm', new Date());
    const end = parse(session.endTime, 'HH:mm', new Date());
    const durationMinutes = differenceInMinutes(end, start);
    if (durationMinutes <= 0) return;

    const newSession: StudySession = {
      ...session,
      id: crypto.randomUUID(),
      durationMinutes,
    };
    setSessions(prev => [...prev, newSession]);
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  }, []);

  const updateHabits = useCallback((dailyHabits: DailyHabits) => {
    setHabits(prev => {
      const existing = prev.findIndex(h => h.date === dailyHabits.date);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = dailyHabits;
        return updated;
      }
      return [...prev, dailyHabits];
    });
  }, []);

  const getHabitsForDate = useCallback((date: string): DailyHabits | undefined => {
    return habits.find(h => h.date === date);
  }, [habits]);

  const getSessionsForDate = useCallback((date: string): StudySession[] => {
    return sessions.filter(s => s.date === date);
  }, [sessions]);

  const getDailyTotalHours = useCallback((date: string): number => {
    const daySessions = getSessionsForDate(date);
    const totalMinutes = daySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    return Math.round((totalMinutes / 60) * 100) / 100;
  }, [getSessionsForDate]);

  const getWeeklyStats = useCallback((weekStart: Date) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const weekSessions = sessions.filter(s => {
      const d = parseISO(s.date);
      return isWithinInterval(d, { start: weekStart, end: weekEnd });
    });
    const totalMinutes = weekSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const totalHours = totalMinutes / 60;
    const avgFocus = weekSessions.length > 0
      ? weekSessions.reduce((sum, s) => sum + s.focusQuality, 0) / weekSessions.length
      : 0;

    // Subject distribution
    const subjectMap: Record<string, number> = {};
    weekSessions.forEach(s => {
      subjectMap[s.subject] = (subjectMap[s.subject] || 0) + s.durationMinutes;
    });

    return { totalHours, avgFocus, subjectMap, sessionCount: weekSessions.length };
  }, [sessions]);

  // Initialize current week target on mount / when targets change
  useEffect(() => {
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const existing = targets.find(t => t.weekStart === weekStart);
    if (!existing) {
      const prevWeekStart = format(startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const prevTarget = targets.find(t => t.weekStart === prevWeekStart);
      const baseTarget = prevTarget ? Math.min(prevTarget.targetHours + 0.5, 10) : 5;
      setTargets(prev => [...prev, {
        weekStart,
        targetHours: Math.round(baseTarget * 10) / 10,
        actualHours: 0,
        met: false,
      }]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getCurrentWeekTarget = useCallback((): WeeklyTarget => {
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const existing = targets.find(t => t.weekStart === weekStart);
    if (existing) return existing;
    return { weekStart, targetHours: 5, actualHours: 0, met: false };
  }, [targets]);

  const getHabitStreaks = useCallback(() => {
    const sortedHabits = [...habits].sort((a, b) => a.date.localeCompare(b.date));
    const habitKeys = ['wakeUpOnTime', 'sleepEnough', 'exercise', 'englishPractice', 'noPorn', 'noSocialMedia'] as const;
    
    const streaks: Record<string, number> = {};
    habitKeys.forEach(key => {
      let streak = 0;
      for (let i = sortedHabits.length - 1; i >= 0; i--) {
        if (sortedHabits[i][key]) streak++;
        else break;
      }
      streaks[key] = streak;
    });
    return streaks;
  }, [habits]);

  const getMonthlyHabitCompletion = useCallback(() => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const monthHabits = habits.filter(h => h.date.startsWith(currentMonth));
    if (monthHabits.length === 0) return { overall: 0, english: 0 };

    const total = monthHabits.length * 6;
    const completed = monthHabits.reduce((sum, h) => {
      return sum + (h.wakeUpOnTime ? 1 : 0) + (h.sleepEnough ? 1 : 0) + (h.exercise ? 1 : 0) +
        (h.englishPractice ? 1 : 0) + (h.noPorn ? 1 : 0) + (h.noSocialMedia ? 1 : 0);
    }, 0);

    const englishDays = monthHabits.filter(h => h.englishPractice).length;
    return {
      overall: Math.round((completed / total) * 100),
      english: Math.round((englishDays / monthHabits.length) * 100),
    };
  }, [habits]);

  const getLast7DaysData = useCallback(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      data.push({
        date: format(date, 'EEE'),
        fullDate: dateStr,
        hours: getDailyTotalHours(dateStr),
        sessions: getSessionsForDate(dateStr),
      });
    }
    return data;
  }, [getDailyTotalHours, getSessionsForDate]);

  return {
    sessions, habits, targets,
    addSession, deleteSession, updateHabits,
    getHabitsForDate, getSessionsForDate, getDailyTotalHours,
    getWeeklyStats, getCurrentWeekTarget, getHabitStreaks,
    getMonthlyHabitCompletion, getLast7DaysData,
  };
}
