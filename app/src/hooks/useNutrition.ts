import type { DietMeal, DietMealItem } from '@elevapro/shared';
import { supabase } from '@elevapro/supabase';
import { useQuery } from '@tanstack/react-query';

type DietPlanSummary = {
  id: string;
  name: string;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  target_calories: number;
};

type MealsData = {
  meals: DietMeal[];
  mealItems: Record<string, DietMealItem[]>;
};

export function useDietPlan(planId: string | undefined) {
  return useQuery({
    queryKey: ['dietPlan', planId],
    queryFn: async (): Promise<DietPlanSummary> => {
      const { data, error } = await supabase
        .from('diet_plans')
        .select('id, name, target_protein, target_carbs, target_fat, target_calories')
        .eq('id', planId as string)
        .single();
      if (error) throw error;
      return data as DietPlanSummary;
    },
    enabled: !!planId,
  });
}

export function useDietMeals(planId: string | undefined) {
  return useQuery({
    queryKey: ['dietMeals', planId],
    queryFn: async (): Promise<MealsData> => {
      const { data, error } = await supabase
        .from('diet_meals')
        .select('*, diet_meal_items(*, food:foods(*))')
        .eq('diet_plan_id', planId as string)
        .order('day_of_week', { ascending: true })
        .order('meal_order', { ascending: true });
      if (error) throw error;

      const meals: DietMeal[] = [];
      const mealItems: Record<string, DietMealItem[]> = {};

      for (const row of data ?? []) {
        const { diet_meal_items, ...meal } = row;
        meals.push(meal as DietMeal);
        mealItems[meal.id] = (diet_meal_items ?? []) as DietMealItem[];
      }

      return { meals, mealItems };
    },
    enabled: !!planId,
  });
}
