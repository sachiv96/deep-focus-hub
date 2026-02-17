export interface StudySession {
  id: string;
  date: string;
  subject: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  focusQuality: number; // 1-5
  distractionCount: number;
  energyLevel: 'low' | 'medium' | 'high';
  notes: string;
}

export interface DailyHabits {
  date: string;
  wakeUpOnTime: boolean;
  sleepEnough: boolean;
  exercise: boolean;
  englishPractice: boolean;
  noPorn: boolean;
  noSocialMedia: boolean;
}

export interface WeeklyTarget {
  weekStart: string;
  targetHours: number;
  actualHours: number;
  met: boolean;
}

export type EnergyLevel = 'low' | 'medium' | 'high';
export type TabType = 'daily' | 'habits' | 'dashboard' | 'progression' | 'timer';
