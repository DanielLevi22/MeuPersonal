import { scheduleStreakReminder } from '@/services/notificationService';
import { supabase } from '@meupersonal/supabase';
import { create } from 'zustand';
import { Achievement, DailyGoal, gamificationService, StudentStreak } from '../services/gamification';

interface GamificationState {
  dailyGoal: DailyGoal | null;
  weeklyGoals: DailyGoal[];
  streak: StudentStreak | null;
  achievements: Achievement[];
  isLoading: boolean;
  showConfetti: boolean;
  
  fetchDailyData: (date: string) => Promise<void>;
  updateMealProgress: (completed: number) => Promise<void>;
  updateWorkoutProgress: (completed: number) => Promise<void>;
  setShowConfetti: (show: boolean) => void;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  dailyGoal: null,
  weeklyGoals: [],
  streak: null,
  achievements: [],
  isLoading: false,
  showConfetti: false,

  fetchDailyData: async (date: string) => {
    set({ isLoading: true });
    try {
      // Ensure goals exist/are up to date for today
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          await gamificationService.calculateDailyGoals(user.id, date);
        } catch (error) {
          console.warn('Error calculating daily goals:', error);
          // Continue execution to fetch existing data
        }
      }

      // Calculate start of week (7 days ago)
      const endDate = date;
      const startDateObj = new Date(date);
      startDateObj.setDate(startDateObj.getDate() - 6);
      const startDate = startDateObj.toISOString().split('T')[0];

      const [dailyGoal, weeklyGoals, streak, achievements] = await Promise.all([
        gamificationService.getDailyGoal(date),
        gamificationService.getWeeklyGoals(startDate, endDate),
        gamificationService.getStreak(),
        gamificationService.getAchievements(),
      ]);
      
      // Schedule daily streak reminder
      await scheduleStreakReminder();
      
      set({ dailyGoal, weeklyGoals, streak, achievements });
    } catch (error) {
      console.error('Error fetching gamification data:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateMealProgress: async (completed: number) => {
    const { dailyGoal } = get();
    if (!dailyGoal) return;

    try {
      await gamificationService.updateMealProgress(dailyGoal.id, completed);
      set((state) => ({
        dailyGoal: state.dailyGoal 
          ? { ...state.dailyGoal, meals_completed: completed }
          : null
      }));
    } catch (error) {
      console.error('Error updating meal progress:', error);
    }
  },

  updateWorkoutProgress: async (completed: number) => {
    const { dailyGoal } = get();
    if (!dailyGoal) return;

    try {
      await gamificationService.updateWorkoutProgress(dailyGoal.id, completed);
      set((state) => ({
        dailyGoal: state.dailyGoal 
          ? { ...state.dailyGoal, workout_completed: completed }
          : null
      }));
    } catch (error) {
      console.error('Error updating workout progress:', error);
    }
  },

  setShowConfetti: (show: boolean) => set({ showConfetti: show }),
}));
