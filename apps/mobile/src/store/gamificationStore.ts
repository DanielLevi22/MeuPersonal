import { scheduleStreakReminder } from '@/services/notificationService';
import { supabase } from '@meupersonal/supabase';
import { create } from 'zustand';
import { Achievement, DailyGoal, gamificationService, StudentStreak } from '../services/gamification';

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
    // Silent load or specific loading state? Reusing isLoading is okay for now.
    // But better not to flicker the whole screen.
    // I won't set isLoading here to avoid disrupting main dashboard if used in background/tab.
    try {
        const today = new Date();
        const endDate = today.toISOString().split('T')[0];
        
        const startDateObj = new Date();
        startDateObj.setDate(today.getDate() - days);
        const startDate = startDateObj.toISOString().split('T')[0];

        const data = await gamificationService.getWeeklyGoals(startDate, endDate);
        set({ history: data || [] });
    } catch (error) {
        console.error('Error fetching history:', error);
    }
  },

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

  updateMealProgress: async (completed: number, date?: string) => {
    let targetGoal = get().dailyGoal;
    
    // If we have a specific date and it differs from current loaded goal, or if no goal loaded
    if (date && (!targetGoal || targetGoal.date !== date)) {
        try {
            // fast fetch/ensure
            const { data: user } = await supabase.auth.getUser();
            if (user.user) {
                // Ensure goal exists
                await gamificationService.calculateDailyGoals(user.user.id, date);
                // Fetch it
                targetGoal = await gamificationService.getDailyGoal(date);
            }
        } catch (e) {
            console.error("Error ensuring daily goal for update:", e);
        }
    }

    if (!targetGoal) {
        return;
    }

    try {
      await gamificationService.updateMealProgress(targetGoal.id, completed);
      
      // Only update local state if it matches the target goal
      set((state) => {
          if (state.dailyGoal && state.dailyGoal.id === targetGoal?.id) {
              return {
                 dailyGoal: { ...state.dailyGoal, meals_completed: completed }
              };
          }
          return {};
      });
    } catch (error) {
      console.error('Error updating meal progress:', error);
    }
  },

  updateWorkoutProgress: async (completed: number, date?: string) => {
    let targetGoal = get().dailyGoal;
    
    // If we have a specific date and it differs from current loaded goal, or if no goal loaded
    if (date && (!targetGoal || targetGoal.date !== date)) {
        try {
             const { data: user } = await supabase.auth.getUser();
            if (user.user) {
                await gamificationService.calculateDailyGoals(user.user.id, date);
                targetGoal = await gamificationService.getDailyGoal(date);
            }
        } catch (e) {
            console.error("Error ensuring daily goal for update:", e);
        }
    }

    if (!targetGoal) {
         return;
    }

    try {
      await gamificationService.updateWorkoutProgress(targetGoal.id, completed);
       set((state) => {
          if (state.dailyGoal && state.dailyGoal.id === targetGoal?.id) {
              return {
                 dailyGoal: { ...state.dailyGoal, workout_completed: completed }
              };
          }
          return {};
      });
    } catch (error) {
      console.error('Error updating workout progress:', error);
    }
  },

  setShowConfetti: (show: boolean) => set({ showConfetti: show }),

  useStreakFreeze: async () => {
    const { streak } = get();
    if (!streak || streak.freeze_available <= 0) return;

    try {
      await gamificationService.useStreakFreeze(streak.student_id);
      
      const today = new Date().toISOString().split('T')[0];
      
      set((state) => ({
        streak: state.streak 
          ? { 
              ...state.streak, 
              freeze_available: state.streak.freeze_available - 1,
              last_freeze_date: today
            }
          : null
      }));
    } catch (error) {
      console.error('Error using streak freeze:', error);
    }
  },
}));
