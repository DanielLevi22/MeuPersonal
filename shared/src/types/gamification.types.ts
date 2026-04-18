export interface DailyGoal {
  id: string;
  student_id: string;
  date: string;
  meals_target: number;
  meals_completed: number;
  workout_target: number;
  workout_completed: number;
  completed: boolean;
  completion_percentage: number;
}

export interface Achievement {
  id: string;
  student_id: string;
  type: "streak" | "milestone" | "challenge";
  title: string;
  description: string;
  icon: string;
  earned_at: string;
  points: number;
}

export interface StudentStreak {
  id: string;
  student_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  freeze_available: number;
  last_freeze_date: string | null;
}

export interface LeaderboardEntry {
  student_id: string;
  name: string;
  points: number;
  avatar_url: string | undefined;
  rank: number;
  phone: string | undefined;
}

export type LeaderboardPeriod = "weekly" | "monthly" | "custom";
export type LeaderboardScope = "global" | "my_students";
