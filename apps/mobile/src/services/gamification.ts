import { supabase } from '@meupersonal/supabase';

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
  type: 'streak' | 'milestone' | 'challenge';
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
}

export const gamificationService = {
  async getDailyGoal(date: string) {
    const { data, error } = await supabase
      .from('daily_goals')
      .select('*')
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as DailyGoal | null;
  },

  async getStreak() {
    const { data, error } = await supabase
      .from('streaks')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as StudentStreak | null;
  },

  async getAchievements() {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('earned_at', { ascending: false });

    if (error) throw error;
    if (error) throw error;
    return data as Achievement[];
  },

  async getWeeklyGoals(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('daily_goals')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data as DailyGoal[];
  },

  async updateMealProgress(goalId: string, completed: number) {
    const { error } = await supabase
      .from('daily_goals')
      .update({ meals_completed: completed })
      .eq('id', goalId);

    if (error) throw error;
  },

  async updateWorkoutProgress(goalId: string, completed: number) {
    const { error } = await supabase
      .from('daily_goals')
      .update({ workout_completed: completed })
      .eq('id', goalId);

    if (error) throw error;
  },

  async calculateDailyGoals(studentId: string, date: string) {
    const { error } = await supabase.rpc('calculate_daily_goals', {
      p_student_id: studentId,
      p_date: date
    });

    if (error) throw error;
  }
};
