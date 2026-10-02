export const CAPACITY = 50;

export interface Achievement {
  id: number;
  name: string;
  category: string;
  description: string;
  version: string;
}

export interface AchievementStats {
  achievement_id: number;
  total: number;
  views: number;
  rate: number | null;
  votes: number;
  dailySubmitted: number;
  dailyLimit: number;
  recordsVersion: string;
}

export interface Distribution {
  rate: number;
  count: number;
}

export interface Submission {
  id: number;
  rate: number;
  evidence_id: string;
  created_at: number;
}

export interface Page<T> {
  items: T[];
  nextCursor: number | null;
}
