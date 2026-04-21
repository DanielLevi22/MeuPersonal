import {
  type Achievement,
  createGamificationService,
  type DailyGoal,
  type StudentStreak,
} from '@elevapro/shared';
import { supabase } from '@elevapro/supabase';
import { create } from 'zustand';

const gamificationService = createGamificationService(supabase);

interface GamificationState {
  dailyGoal: DailyGoal | null;
  weeklyGoals: DailyGoal[];
  history: DailyGoal[];
  streak: StudentStreak | null;
  achievements: Achievement[];
  isLoading: boolean;
  showConfetti: boolean;

  fetchDailyData: (date: string) => Promise<void>;
  fetchHistory: (days: number) => Promise<void>;
  updateMealProgress: (completed: number, date?: string) => Promise<void>;
  updateWorkoutProgress: (completed: number, date?: string) => Promise<void>;
  incrementWorkoutProgress: (date?: string) => Promise<void>;
  setShowConfetti: (show: boolean) => void;
  useStreakFreeze: () => Promise<void>;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  dailyGoal: null,
  weeklyGoals: [],
  history: [],
  streak: null,
  achievements: [],
  isLoading: false,
  showConfetti: false,

  fetchHistory: async (days: number) => {
    try {
      const today = new Date();
      const endDate = today.toISOString().split('T')[0];
      const startDateObj = new Date();
      startDateObj.setDate(today.getDate() - days);
      const startDate = startDateObj.toISOString().split('T')[0];
      const data = await gamificationService.getWeeklyGoals(startDate, endDate);
      set({ history: data });
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  },

  fetchDailyData: async (date: string) => {
    set({ isLoading: true });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        try {
          await gamificationService.calculateDailyGoals(user.id, date);
        } catch (error) {
          console.warn('Error calculating daily goals:', error);
        }
      }

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

      set({ dailyGoal, weeklyGoals, streak, achievements });
    } catch (error) {
      console.error('Error fetching gamification data:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateMealProgress: async (completed: number, date?: string) => {
    let targetGoal = get().dailyGoal;

    if (date && (!targetGoal || targetGoal.date !== date)) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await gamificationService.calculateDailyGoals(user.id, date);
          targetGoal = await gamificationService.getDailyGoal(date);
        }
      } catch (e) {
        console.error('Error ensuring daily goal for update:', e);
      }
    }

    if (!targetGoal) return;

    try {
      await gamificationService.updateMealProgress(targetGoal.id, completed);
      set((state) => {
        if (state.dailyGoal?.id === targetGoal?.id) {
          return { dailyGoal: { ...state.dailyGoal, meals_completed: completed } };
        }
        return {};
      });
    } catch (error) {
      console.error('Error updating meal progress:', error);
    }
  },

  updateWorkoutProgress: async (completed: number, date?: string) => {
    let targetGoal = get().dailyGoal;

    if (date && (!targetGoal || targetGoal.date !== date)) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await gamificationService.calculateDailyGoals(user.id, date);
          targetGoal = await gamificationService.getDailyGoal(date);
        }
      } catch (e) {
        console.error('Error ensuring daily goal for update:', e);
      }
    }

    if (!targetGoal) return;

    try {
      await gamificationService.updateWorkoutProgress(targetGoal.id, completed);
      set((state) => {
        if (state.dailyGoal?.id === targetGoal?.id) {
          return { dailyGoal: { ...state.dailyGoal, workout_completed: completed } };
        }
        return {};
      });
    } catch (error) {
      console.error('Error updating workout progress:', error);
    }
  },

  incrementWorkoutProgress: async (date?: string) => {
    let targetGoal = get().dailyGoal;

    if (date && (!targetGoal || targetGoal.date !== date)) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await gamificationService.calculateDailyGoals(user.id, date);
          targetGoal = await gamificationService.getDailyGoal(date);
        }
      } catch (e) {
        console.error('Error fetching goal for increment:', e);
      }
    }

    if (!targetGoal) {
      const today = date || new Date().toISOString().split('T')[0];
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) targetGoal = await gamificationService.getDailyGoal(today);
      } catch {}
    }

    if (!targetGoal) return;
    const newCount = (targetGoal.workout_completed || 0) + 1;
    await get().updateWorkoutProgress(newCount, date);
  },

  setShowConfetti: (show: boolean) => set({ showConfetti: show }),

  useStreakFreeze: async () => {
    const { streak } = get();
    if (!streak || streak.freeze_available <= 0) return;
    try {
      // biome-ignore lint/correctness/useHookAtTopLevel: service method, not a React hook
      await gamificationService.useStreakFreeze(streak.student_id);
      const today = new Date().toISOString().split('T')[0];
      set((state) => ({
        streak: state.streak
          ? {
              ...state.streak,
              freeze_available: state.streak.freeze_available - 1,
              last_freeze_date: today,
            }
          : null,
      }));
    } catch (error) {
      console.error('Error using streak freeze:', error);
    }
  },
}));
