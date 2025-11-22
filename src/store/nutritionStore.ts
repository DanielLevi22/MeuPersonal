import { supabase } from '@/lib/supabase';
import { create } from 'zustand';

// Types
export interface Food {
  id: string;
  name: string;
  category: string;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  source: string;
  is_custom: boolean;
  created_by?: string;
}

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DietPlan {
  id: string;
  student_id: string;
  personal_id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  version: number;
  is_active: boolean;
  notes?: string;
}

export interface DietMeal {
  id: string;
  diet_plan_id: string;
  day_of_week: number;
  meal_type: string;
  meal_order: number;
  name?: string;
  target_calories?: number;
  meal_time?: string; // Format: "HH:MM" (e.g., "08:00", "12:30")
}

export interface DietMealItem {
  id: string;
  diet_meal_id: string;
  food_id: string;
  food?: Food;
  quantity: number;
  unit: string;
  order_index: number;
}

interface NutritionStore {
  // Foods
  foods: Food[];
  searchFoods: (query: string) => Promise<Food[]>;
  createCustomFood: (food: Omit<Food, 'id' | 'is_custom' | 'created_by'>) => Promise<void>;
  
  // Diet Plans
  currentDietPlan: DietPlan | null;
  fetchDietPlan: (studentId: string) => Promise<void>;
  createDietPlan: (plan: Omit<DietPlan, 'id' | 'version' | 'is_active'>) => Promise<void>;
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
  
  // Loading states
  isLoading: boolean;
}

export const useNutritionStore = create<NutritionStore>((set, get) => ({
  foods: [],
  currentDietPlan: null,
  meals: [],
  mealItems: {},
  isLoading: false,

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

  // Fetch diet plan for student
  fetchDietPlan: async (studentId: string) => {
    try {
      set({ isLoading: true });
      
      const { data, error } = await supabase
        .from('diet_plans')
        .select('*')
        .eq('student_id', studentId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      
      set({ currentDietPlan: data, isLoading: false });
    } catch (error) {
      console.error('Error fetching diet plan:', error);
      set({ isLoading: false });
    }
  },

  // Create new diet plan
  createDietPlan: async (plan) => {
    try {
      // Deactivate existing plans
      await supabase
        .from('diet_plans')
        .update({ is_active: false })
        .eq('student_id', plan.student_id);

      // Create new plan
      const { data, error } = await supabase
        .from('diet_plans')
        .insert({
          ...plan,
          version: 1,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      
      set({ currentDietPlan: data });
    } catch (error) {
      console.error('Error creating diet plan:', error);
      throw error;
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
  }
}));
