import { cancelPlanNotifications, scheduleMealNotifications } from '@/services/notificationService';
import type {
    DailyLog,
    DietMeal,
    DietMealItem,
    DietPlan,
    Food
} from '@meupersonal/core';
import { supabase } from '@meupersonal/supabase';
import { create } from 'zustand';
import { useAuthStore } from './authStore';

interface NutritionStore {
  // Foods
  foods: Food[];
  searchFoods: (query: string) => Promise<Food[]>;
  createCustomFood: (food: Omit<Food, 'id' | 'is_custom' | 'created_by'>) => Promise<void>;
  
  // Diet Plans
  currentDietPlan: DietPlan | null;
  dietPlanHistory: DietPlan[];
  fetchDietPlan: (studentId: string) => Promise<void>;
  fetchDietPlanHistory: (studentId: string) => Promise<void>;
  createDietPlan: (plan: Omit<DietPlan, 'id' | 'version' | 'is_active' | 'status'>, sourcePlanId?: string) => Promise<void>;
  finishDietPlan: (planId: string) => Promise<void>;
  checkPlanExpiration: (studentId: string) => Promise<void>;
  updateDietPlan: (id: string, updates: Partial<DietPlan>) => Promise<void>;
  
  // Meals
  meals: DietMeal[];
  fetchMeals: (dietPlanId: string) => Promise<void>;
  addMeal: (meal: Omit<DietMeal, 'id'>) => Promise<void>;
  updateMeal: (id: string, updates: Partial<DietMeal>) => Promise<void>;
  
  // Meal Items
  mealItems: Record<string, DietMealItem[]>; // Keyed by meal_id
  fetchMealItems: (mealId: string) => Promise<void>;
  addFoodToMeal: (mealId: string, foodId: string, quantity: number, unit: string) => Promise<void>;
  updateMealItem: (itemId: string, updates: Partial<DietMealItem>) => Promise<void>;
  removeFoodFromMeal: (itemId: string) => Promise<void>;
  
  // Day Operations
  copiedDay: { meals: DietMeal[]; items: Record<string, DietMealItem[]> } | null;
  copyDay: (dayOfWeek: number) => Promise<void>;
  pasteDay: (targetDay: number) => Promise<void>;
  clearDay: (dayOfWeek: number) => Promise<void>;
  
  // Daily Logs
  dailyLogs: Record<string, DailyLog>; // Keyed by meal_id
  fetchDailyLogs: (studentId: string, date: string) => Promise<void>;
  toggleMealCompletion: (mealId: string, date: string, isCompleted: boolean) => Promise<void>;

  // Loading states
  isLoading: boolean;
  
  // Reset
  reset: () => void; // Clear all state on logout
}

export interface DailyLog {
  id: string;
  student_id: string;
  diet_plan_id?: string;
  diet_meal_id?: string;
  logged_date: string;
  completed: boolean;
  actual_items?: any;
  notes?: string;
  photo_url?: string;
}

export const useNutritionStore = create<NutritionStore>((set, get) => ({
  foods: [],
  currentDietPlan: null,
  dietPlanHistory: [],
  meals: [],
  mealItems: {},
  isLoading: false,
  copiedDay: null,
  dailyLogs: {},

  // ... (existing actions)

  // Fetch daily logs
  fetchDailyLogs: async (studentId: string, date: string) => {
    try {
      const { data, error } = await supabase
        .from('diet_logs')
        .select('*')
        .eq('student_id', studentId)
        .eq('logged_date', date);

      if (error) throw error;

      // Convert array to record keyed by diet_meal_id
      const logsRecord: Record<string, DailyLog> = {};
      data?.forEach((log) => {
        if (log.diet_meal_id) {
          logsRecord[log.diet_meal_id] = log;
        }
      });

      set({ dailyLogs: logsRecord });
    } catch (error) {
      console.error('Error fetching daily logs:', error);
    }
  },

  // Toggle meal completion
  toggleMealCompletion: async (mealId: string, date: string, isCompleted: boolean) => {
    const { currentDietPlan, dailyLogs } = get();
    if (!currentDietPlan) return;

    try {
      // Optimistic update
      const existingLog = dailyLogs[mealId];
      const optimisticLog = {
        ...existingLog,
        diet_meal_id: mealId,
        logged_date: date,
        completed: isCompleted,
        student_id: currentDietPlan.student_id,
      } as DailyLog;

      set((state) => ({
        dailyLogs: {
          ...state.dailyLogs,
          [mealId]: optimisticLog
        }
      }));

      // Check if log exists
      if (existingLog?.id) {
        // Update
        const { error } = await supabase
          .from('diet_logs')
          .update({ completed: isCompleted })
          .eq('id', existingLog.id);

        if (error) throw error;
      } else {
        // Insert
        const { data, error } = await supabase
          .from('diet_logs')
          .insert({
            student_id: currentDietPlan.student_id,
            diet_plan_id: currentDietPlan.id,
            diet_meal_id: mealId,
            logged_date: date,
            completed: isCompleted
          })
          .select()
          .single();

        if (error) throw error;

        // Update with real ID
        set((state) => ({
          dailyLogs: {
            ...state.dailyLogs,
            [mealId]: data
          }
        }));
      }
    } catch (error) {
      console.error('Error toggling meal completion:', error);
      // Revert on error (could be improved)
      get().fetchDailyLogs(currentDietPlan.student_id, date);
    }
  },

  // Copy Day
  copyDay: async (dayOfWeek: number) => {
    const { meals, mealItems } = get();
    const dayMeals = meals.filter(m => m.day_of_week === dayOfWeek);
    
    // Ensure we have items for these meals
    const dayItems: Record<string, DietMealItem[]> = {};
    for (const meal of dayMeals) {
      if (mealItems[meal.id]) {
        dayItems[meal.id] = mealItems[meal.id];
      }
    }

    set({ copiedDay: { meals: dayMeals, items: dayItems } });
  },

  // Paste Day
  pasteDay: async (targetDay: number) => {
    const { copiedDay, currentDietPlan, clearDay } = get();
    if (!copiedDay || !currentDietPlan) return;

    set({ isLoading: true });
    try {
      // 1. Clear target day first
      await clearDay(targetDay);

      // 2. Re-create meals and items
      for (const sourceMeal of copiedDay.meals) {
        // Create meal
        const { data: newMeal, error: mealError } = await supabase
          .from('diet_meals')
          .insert({
            diet_plan_id: currentDietPlan.id,
            day_of_week: targetDay,
            meal_type: sourceMeal.meal_type,
            meal_order: sourceMeal.meal_order,
            name: sourceMeal.name,
            target_calories: sourceMeal.target_calories,
            meal_time: sourceMeal.meal_time
          })
          .select()
          .single();

        if (mealError) throw mealError;

        // Create items for this meal
        const sourceItems = copiedDay.items[sourceMeal.id] || [];
        if (sourceItems.length > 0) {
          const itemsToInsert = sourceItems.map(item => ({
            diet_meal_id: newMeal.id,
            food_id: item.food_id,
            quantity: item.quantity,
            unit: item.unit,
            order_index: item.order_index
          }));

          const { error: itemsError } = await supabase
            .from('diet_meal_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }
      }

      // Refresh meals
      await get().fetchMeals(currentDietPlan.id);
      
      // Refresh items for the new meals (optional, but good for consistency)
      // We can just let the UI fetch them when needed or fetch all now.
      // For simplicity, we'll let the UI fetch or just rely on fetchMeals for the structure.
      // Actually, fetchMeals updates 'meals', but 'mealItems' might be empty for the new meals.
      // Let's fetch items for the newly created meals to be safe.
      const { data: newMeals } = await supabase
        .from('diet_meals')
        .select('id')
        .eq('diet_plan_id', currentDietPlan.id)
        .eq('day_of_week', targetDay);
        
      if (newMeals) {
        for (const meal of newMeals) {
          await get().fetchMealItems(meal.id);
        }
      }

    } catch (error) {
      console.error('Error pasting day:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Clear Day
  clearDay: async (dayOfWeek: number) => {
    const { currentDietPlan } = get();
    if (!currentDietPlan) return;

    try {
      // Delete all meals for this day (Cascade should handle items)
      const { error } = await supabase
        .from('diet_meals')
        .delete()
        .eq('diet_plan_id', currentDietPlan.id)
        .eq('day_of_week', dayOfWeek);

      if (error) throw error;

      // Update local state
      set(state => ({
        meals: state.meals.filter(m => m.day_of_week !== dayOfWeek),
        // We could clean up mealItems but it's not strictly necessary and complex to filter by day here
      }));
    } catch (error) {
      console.error('Error clearing day:', error);
      throw error;
    }
  },

  // Search foods with full-text search
  searchFoods: async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .or(`name.ilike.%${query}%,search_vector.fts.${query}`)
        .limit(20);

      if (error) throw error;
      
      set({ foods: data || [] });
      return data || [];
    } catch (error) {
      console.error('Error searching foods:', error);
      return [];
    }
  },

  // Create custom food
  createCustomFood: async (food) => {
    try {
      const { data, error } = await supabase
        .from('foods')
        .insert({
          ...food,
          is_custom: true,
          source: 'Manual'
        })
        .select()
        .single();

      if (error) throw error;
      
      // Add to local state
      set((state) => ({
        foods: [...state.foods, data]
      }));
    } catch (error) {
      console.error('Error creating custom food:', error);
      throw error;
    }
  },

  // Fetch diet plan for a student
  fetchDietPlan: async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('diet_plans')
        .select('*')
        .eq('student_id', studentId)
        .eq('status', 'active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          set({ currentDietPlan: null });
          return;
        }
        throw error;
      }
      
      set({ currentDietPlan: data });

      // Schedule notifications for this student's diet plan on THEIR device
      // CRITICAL: Only schedule if the current user is the student (not the professor viewing the plan)
      const currentUser = useAuthStore.getState().user;
      
      // Debounce scheduling: Don't schedule if we just did it in the last 5 seconds
      const lastScheduled = (get() as any).lastNotificationSchedule || 0;
      const now = Date.now();
      
      if (data?.id && currentUser?.id === studentId && (now - lastScheduled > 5000)) {
        // Update timestamp immediately to prevent race conditions
        set({ lastNotificationSchedule: now } as any);

        const { data: mealsWithTimes } = await supabase
          .from('diet_meals')
          .select(`
            id, 
            name, 
            meal_time, 
            day_of_week,
            diet_meal_items (
              food:foods (
                name
              )
            )
          `)
          .eq('diet_plan_id', data.id)
          .not('meal_time', 'is', null);

        if (mealsWithTimes && mealsWithTimes.length > 0) {
          const mealNotifications = mealsWithTimes.map(meal => {
            // Extract food names safely
            const foodNames = meal.diet_meal_items
              ?.map((item: any) => item.food?.name)
              .filter((name: any) => !!name) || [];

            return {
              mealId: meal.id,
              mealName: meal.name || 'Refeição',
              mealTime: meal.meal_time,
              dayOfWeek: Number(meal.day_of_week),
              foodNames
            };
          });

          await scheduleMealNotifications(data.id, mealNotifications);
          console.log(`✅ Scheduled ${mealNotifications.length} notifications for student's diet plan ${data.id}`);
        }
      }
    } catch (error) {
      console.error('Error fetching diet plan:', error);
      set({ currentDietPlan: null });
    }
  },

  // Fetch diet plan history
  fetchDietPlanHistory: async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('diet_plans')
        .select('*')
        .eq('student_id', studentId)
        .neq('status', 'active')
        .order('end_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      set({ dietPlanHistory: data || [] });
    } catch (error) {
      console.error('Error fetching diet plan history:', error);
      set({ dietPlanHistory: [] });
    }
  },

  // Create new diet plan
  createDietPlan: async (plan, sourcePlanId) => {
    try {
      // Check if there's already an active plan
      const { data: existingActive } = await supabase
        .from('diet_plans')
        .select('id')
        .eq('student_id', plan.student_id)
        .eq('status', 'active')
        .single();

      if (existingActive) {
        throw new Error('Já existe um plano ativo para este aluno. Finalize o plano atual antes de criar um novo.');
      }

      // Create new plan
      const { data: newPlan, error } = await supabase
        .from('diet_plans')
        .insert({
          ...plan,
          version: 1,
          is_active: true,
          status: 'active',
          plan_type: plan.plan_type || 'cyclic'
        })
        .select()
        .single();

      if (error) throw error;

      // If sourcePlanId is provided, clone meals and items
      if (sourcePlanId) {
        // 1. Fetch source meals
        const { data: sourceMeals, error: mealsError } = await supabase
          .from('diet_meals')
          .select('*')
          .eq('diet_plan_id', sourcePlanId);

        if (mealsError) throw mealsError;

        if (sourceMeals && sourceMeals.length > 0) {
          for (const sourceMeal of sourceMeals) {
            // 2. Create new meal
            const { data: newMeal, error: newMealError } = await supabase
              .from('diet_meals')
              .insert({
                diet_plan_id: newPlan.id,
                day_of_week: sourceMeal.day_of_week,
                meal_type: sourceMeal.meal_type,
                meal_order: sourceMeal.meal_order,
                name: sourceMeal.name,
                target_calories: sourceMeal.target_calories,
                meal_time: sourceMeal.meal_time
              })
              .select()
              .single();

            if (newMealError) throw newMealError;

            // 3. Fetch source items for this meal
            const { data: sourceItems, error: itemsError } = await supabase
              .from('diet_meal_items')
              .select('*')
              .eq('diet_meal_id', sourceMeal.id);

            if (itemsError) throw itemsError;

            if (sourceItems && sourceItems.length > 0) {
              // 4. Create new items
              const itemsToInsert = sourceItems.map(item => ({
                diet_meal_id: newMeal.id,
                food_id: item.food_id,
                quantity: item.quantity,
                unit: item.unit,
                order_index: item.order_index
              }));

              const { error: insertItemsError } = await supabase
                .from('diet_meal_items')
                .insert(itemsToInsert);

              if (insertItemsError) throw insertItemsError;
            }
          }
        }
      }
      
      // NOTE: Notifications are NOT scheduled here because this runs on the professor's device.
      // Notifications will be scheduled on the STUDENT'S device when they fetch their diet plan.
      
      set({ currentDietPlan: newPlan });
    } catch (error) {
      console.error('Error creating diet plan:', error);
      throw error;
    }
  },

  // Finish diet plan manually
  finishDietPlan: async (planId: string) => {
    try {
      // Cancel all notifications for this plan
      await cancelPlanNotifications(planId);
      console.log(`✅ Cancelled notifications for diet plan ${planId}`);

      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('diet_plans')
        .update({ 
          status: 'finished',
          is_active: false,
          end_date: today
        })
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;
      
      set((state) => ({
        currentDietPlan: state.currentDietPlan?.id === planId ? null : state.currentDietPlan,
        dietPlanHistory: [data, ...state.dietPlanHistory]
      }));
    } catch (error) {
      console.error('Error finishing diet plan:', error);
      throw error;
    }
  },

  // Check and update expired plans
  checkPlanExpiration: async (studentId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: expiredPlans, error } = await supabase
        .from('diet_plans')
        .select('id')
        .eq('student_id', studentId)
        .eq('status', 'active')
        .lt('end_date', today);

      if (error) throw error;

      if (expiredPlans && expiredPlans.length > 0) {
        const { error: updateError } = await supabase
          .from('diet_plans')
          .update({ 
            status: 'completed',
            is_active: false
          })
          .in('id', expiredPlans.map(p => p.id));

        if (updateError) throw updateError;

        await get().fetchDietPlan(studentId);
      }
    } catch (error) {
      console.error('Error checking plan expiration:', error);
    }
  },

  // Update diet plan
  updateDietPlan: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('diet_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      set({ currentDietPlan: data });
    } catch (error) {
      console.error('Error updating diet plan:', error);
      throw error;
    }
  },

  // Fetch meals for a diet plan
  fetchMeals: async (dietPlanId: string) => {
    try {
      const { data, error } = await supabase
        .from('diet_meals')
        .select('*')
        .eq('diet_plan_id', dietPlanId)
        .order('day_of_week', { ascending: true })
        .order('meal_order', { ascending: true });

      if (error) throw error;
      
      set({ meals: data || [] });
    } catch (error) {
      console.error('Error fetching meals:', error);
    }
  },

  // Update meal
  updateMeal: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('diet_meals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      set((state) => ({
        meals: state.meals.map((meal) => 
          meal.id === id ? { ...meal, ...data } : meal
        )
      }));

      // NOTE: Notifications are NOT re-scheduled here because this runs on the professor's device.
      // The student's device will handle notification scheduling when they fetch their diet plan.
    } catch (error) {
      console.error('Error updating meal:', error);
      throw error;
    }
  },

  // Add meal to diet plan
  addMeal: async (meal) => {
    try {
      const { data, error } = await supabase
        .from('diet_meals')
        .insert(meal)
        .select()
        .single();

      if (error) throw error;
      
      set((state) => ({
        meals: [...state.meals, data]
      }));
    } catch (error) {
      console.error('Error adding meal:', error);
      throw error;
    }
  },

  // Fetch meal items
  fetchMealItems: async (mealId: string) => {
    try {
      const { data, error } = await supabase
        .from('diet_meal_items')
        .select(`
          *,
          food:foods (*)
        `)
        .eq('diet_meal_id', mealId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      
      set((state) => ({
        mealItems: {
          ...state.mealItems,
          [mealId]: data || []
        }
      }));
    } catch (error) {
      console.error('Error fetching meal items:', error);
    }
  },

  // Add food to meal
  addFoodToMeal: async (mealId, foodId, quantity, unit) => {
    try {
      const currentItems = get().mealItems[mealId] || [];
      const nextOrder = currentItems.length;

      const { data, error } = await supabase
        .from('diet_meal_items')
        .insert({
          diet_meal_id: mealId,
          food_id: foodId,
          quantity,
          unit,
          order_index: nextOrder
        })
        .select(`
          *,
          food:foods (*)
        `)
        .single();

      if (error) throw error;
      
      set((state) => ({
        mealItems: {
          ...state.mealItems,
          [mealId]: [...(state.mealItems[mealId] || []), data]
        }
      }));
    } catch (error) {
      console.error('Error adding food to meal:', error);
      throw error;
    }
  },

  // Update meal item
  updateMealItem: async (itemId, updates) => {
    try {
      const { data, error } = await supabase
        .from('diet_meal_items')
        .update(updates)
        .eq('id', itemId)
        .select(`
          *,
          food:foods (*)
        `)
        .single();

      if (error) throw error;
      
      // Update local state
      set((state) => {
        const newMealItems = { ...state.mealItems };
        // Find which meal this item belongs to
        const mealId = data.diet_meal_id;
        
        if (newMealItems[mealId]) {
          newMealItems[mealId] = newMealItems[mealId].map(item => 
            item.id === itemId ? data : item
          );
        }
        
        return { mealItems: newMealItems };
      });
    } catch (error) {
      console.error('Error updating meal item:', error);
      throw error;
    }
  },

  // Remove food from meal
  removeFoodFromMeal: async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('diet_meal_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      // Remove from local state
      set((state) => {
        const newMealItems = { ...state.mealItems };
        Object.keys(newMealItems).forEach((mealId) => {
          newMealItems[mealId] = newMealItems[mealId].filter(item => item.id !== itemId);
        });
        return { mealItems: newMealItems };
      });
    } catch (error) {
      console.error('Error removing food from meal:', error);
      throw error;
    }
  },
  
  // Reset all state on logout
  reset: () => {
    set({
      foods: [],
      currentDietPlan: null,
      dietPlanHistory: [],
      meals: [],
      mealItems: {},
      copiedDay: null,
      dailyLogs: {},
      isLoading: false
    });
  }
}));
