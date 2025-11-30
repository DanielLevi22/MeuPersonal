'use client';

import type { DietMeal, DietMealItem, DietPlan, Food } from '@meupersonal/core';
import { defineAbilitiesFor, supabase } from '@meupersonal/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

// --- Hooks for Data Fetching ---

export function useFoods(searchQuery: string = '') {
  return useQuery({
    queryKey: ['foods', searchQuery],
    queryFn: async () => {
      let query = supabase.from('foods').select('*').limit(50);
      
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,search_vector.fts.${searchQuery}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Food[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useDietPlans(studentId?: string) {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const getRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile) setUserRole(profile.role);
      }
    };
    getRole();
  }, []);

  return useQuery({
    queryKey: ['diet_plans', studentId],
    queryFn: async () => {
      if (!studentId) return [];

      // Check permissions
      if (userRole) {
        const ability = defineAbilitiesFor(userRole as any);
        if (ability.cannot('read', 'Diet')) {
          throw new Error('Você não tem permissão para visualizar dietas');
        }
      }

      const { data, error } = await supabase
        .from('diet_plans')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DietPlan[];
    },
    enabled: !!studentId,
  });
}

export function useDietPlan(id: string) {
  return useQuery({
    queryKey: ['diet_plan', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diet_plans')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as DietPlan;
    },
    enabled: !!id,
  });
}

export function useDietMeals(dietPlanId: string) {
  return useQuery({
    queryKey: ['diet_meals', dietPlanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diet_meals')
        .select(`
          *,
          diet_meal_items (
            *,
            food:foods (*)
          )
        `)
        .eq('diet_plan_id', dietPlanId)
        .order('day_of_week', { ascending: true })
        .order('meal_order', { ascending: true });

      if (error) throw error;
      
      // Sort items by order_index manually since nested order in select is tricky
      const meals = data?.map(meal => ({
        ...meal,
        diet_meal_items: meal.diet_meal_items?.sort((a: any, b: any) => a.order_index - b.order_index)
      }));

      return meals as (DietMeal & { diet_meal_items: (DietMealItem & { food: Food })[] })[];
    },
    enabled: !!dietPlanId,
  });
}

// --- Mutations ---

export function useCreateDietPlan() {
  const queryClient = useQueryClient();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const getRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile) setUserRole(profile.role);
      }
    };
    getRole();
  }, []);

  return useMutation({
    mutationFn: async (plan: Omit<DietPlan, 'id' | 'created_at' | 'version' | 'is_active' | 'status'>) => {
      if (userRole) {
        const ability = defineAbilitiesFor(userRole as any);
        if (ability.cannot('create', 'Diet')) {
          throw new Error('Você não tem permissão para criar dietas');
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Check for active plan
      const { data: existingActive } = await supabase
        .from('diet_plans')
        .select('id')
        .eq('student_id', plan.student_id)
        .eq('status', 'active')
        .single();

      if (existingActive) {
        throw new Error('Já existe um plano ativo para este aluno. Finalize o atual antes de criar um novo.');
      }

      const { data, error } = await supabase
        .from('diet_plans')
        .insert({
          ...plan,
          personal_id: user.id,
          version: 1,
          is_active: true,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['diet_plans', variables.student_id] });
    },
  });
}

export function useFinishDietPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
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
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['diet_plans', data.student_id] });
      queryClient.invalidateQueries({ queryKey: ['diet_plan', data.id] });
    },
  });
}

export function useAddMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meal: Omit<DietMeal, 'id'>) => {
      const { data, error } = await supabase
        .from('diet_meals')
        .insert(meal)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['diet_meals', variables.diet_plan_id] });
    },
  });
}

export function useUpdateMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<DietMeal>) => {
      const { data, error } = await supabase
        .from('diet_meals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet_meals'] });
    },
  });
}

export function useAddFoodToMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      diet_meal_id, 
      food_id, 
      quantity, 
      unit, 
      order_index 
    }: { 
      diet_meal_id: string; 
      food_id: string; 
      quantity: number; 
      unit: string; 
      order_index: number;
    }) => {
      const { data, error } = await supabase
        .from('diet_meal_items')
        .insert({
          diet_meal_id,
          food_id,
          quantity,
          unit,
          order_index
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // We need to find the plan ID to invalidate, but we only have meal ID.
      // Invalidation of 'diet_meals' requires plan ID.
      // A simple way is to invalidate all 'diet_meals' queries or refetch the specific one if we knew the plan ID.
      // Since we don't easily have plan ID here without extra fetch or passing it, 
      // we can invalidate all 'diet_meals' which is safe but slightly inefficient, 
      // OR pass planId in variables.
      // Let's rely on the UI to refetch or invalidate broadly for now.
      queryClient.invalidateQueries({ queryKey: ['diet_meals'] }); 
    },
  });
}

export function useUpdateMealItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<DietMealItem>) => {
      const { data, error } = await supabase
        .from('diet_meal_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet_meals'] });
    },
  });
}

export function useRemoveMealItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('diet_meal_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet_meals'] });
    },
  });
}

// --- Copy/Paste/Clear Day Operations ---

export function useCopyDay() {
  return useMutation({
    mutationFn: async ({ dietPlanId, dayOfWeek }: { dietPlanId: string; dayOfWeek: number }) => {
      // Fetch all meals and items for the specified day
      const { data: meals, error } = await supabase
        .from('diet_meals')
        .select(`
          *,
          diet_meal_items (
            *,
            food:foods (*)
          )
        `)
        .eq('diet_plan_id', dietPlanId)
        .eq('day_of_week', dayOfWeek)
        .order('meal_order', { ascending: true });

      if (error) throw error;
      return { meals, dayOfWeek };
    },
  });
}

export function usePasteDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      dietPlanId, 
      targetDay, 
      copiedMeals 
    }: { 
      dietPlanId: string; 
      targetDay: number; 
      copiedMeals: any[];
    }) => {
      // 1. Delete existing meals for target day
      const { error: deleteError } = await supabase
        .from('diet_meals')
        .delete()
        .eq('diet_plan_id', dietPlanId)
        .eq('day_of_week', targetDay);

      if (deleteError) throw deleteError;

      // 2. Copy meals to target day
      for (const sourceMeal of copiedMeals) {
        const { data: newMeal, error: mealError } = await supabase
          .from('diet_meals')
          .insert({
            diet_plan_id: dietPlanId,
            day_of_week: targetDay,
            meal_type: sourceMeal.meal_type,
            meal_order: sourceMeal.meal_order,
            name: sourceMeal.name,
            target_calories: sourceMeal.target_calories,
            meal_time: sourceMeal.meal_time,
          })
          .select()
          .single();

        if (mealError) throw mealError;

        // 3. Copy meal items
        if (sourceMeal.diet_meal_items && sourceMeal.diet_meal_items.length > 0) {
          const itemsToInsert = sourceMeal.diet_meal_items.map((item: any) => ({
            diet_meal_id: newMeal.id,
            food_id: item.food_id,
            quantity: item.quantity,
            unit: item.unit,
            order_index: item.order_index,
          }));

          const { error: itemsError } = await supabase
            .from('diet_meal_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }
      }

      return { dietPlanId, targetDay };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['diet_meals', data.dietPlanId] });
    },
  });
}

export function useClearDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dietPlanId, dayOfWeek }: { dietPlanId: string; dayOfWeek: number }) => {
      const { error } = await supabase
        .from('diet_meals')
        .delete()
        .eq('diet_plan_id', dietPlanId)
        .eq('day_of_week', dayOfWeek);

      if (error) throw error;
      return { dietPlanId, dayOfWeek };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['diet_meals', data.dietPlanId] });
    },
  });
}

// --- Import Diet ---

export function useImportDiet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      sourceDietPlanId, 
      targetStudentId 
    }: { 
      sourceDietPlanId: string; 
      targetStudentId: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // 1. Get source diet plan
      const { data: sourcePlan, error: planError } = await supabase
        .from('diet_plans')
        .select('*')
        .eq('id', sourceDietPlanId)
        .single();

      if (planError) throw planError;

      // 2. Check for active plan on target student
      const { data: existingActive } = await supabase
        .from('diet_plans')
        .select('id')
        .eq('student_id', targetStudentId)
        .eq('status', 'active')
        .single();

      if (existingActive) {
        throw new Error('Já existe um plano ativo para este aluno. Finalize o atual antes de importar.');
      }

      // 3. Create new diet plan for target student
      const { data: newPlan, error: newPlanError } = await supabase
        .from('diet_plans')
        .insert({
          student_id: targetStudentId,
          personal_id: user.id,
          name: `${sourcePlan.name} (Importado)`,
          description: sourcePlan.description,
          start_date: new Date().toISOString().split('T')[0],
          end_date: sourcePlan.end_date,
          target_calories: sourcePlan.target_calories,
          target_protein: sourcePlan.target_protein,
          target_carbs: sourcePlan.target_carbs,
          target_fat: sourcePlan.target_fat,
          plan_type: sourcePlan.plan_type,
          version: 1,
          is_active: true,
          status: 'active',
        })
        .select()
        .single();

      if (newPlanError) throw newPlanError;

      // 4. Get all meals from source plan
      const { data: sourceMeals, error: mealsError } = await supabase
        .from('diet_meals')
        .select(`
          *,
          diet_meal_items (
            *
          )
        `)
        .eq('diet_plan_id', sourceDietPlanId);

      if (mealsError) throw mealsError;

      // 5. Copy meals to new plan
      for (const sourceMeal of sourceMeals || []) {
        const { data: newMeal, error: mealError } = await supabase
          .from('diet_meals')
          .insert({
            diet_plan_id: newPlan.id,
            day_of_week: sourceMeal.day_of_week,
            meal_type: sourceMeal.meal_type,
            meal_order: sourceMeal.meal_order,
            name: sourceMeal.name,
            target_calories: sourceMeal.target_calories,
            meal_time: sourceMeal.meal_time,
          })
          .select()
          .single();

        if (mealError) throw mealError;

        // 6. Copy meal items
        if (sourceMeal.diet_meal_items && sourceMeal.diet_meal_items.length > 0) {
          const itemsToInsert = sourceMeal.diet_meal_items.map((item: any) => ({
            diet_meal_id: newMeal.id,
            food_id: item.food_id,
            quantity: item.quantity,
            unit: item.unit,
            order_index: item.order_index,
          }));

          const { error: itemsError } = await supabase
            .from('diet_meal_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }
      }

      return { newPlan, targetStudentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['diet_plans', data.targetStudentId] });
    },
  });
}

// --- Progress Tracking Queries ---

export function useDietLogs(studentId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['diet_logs', studentId, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('diet_logs')
        .select('*')
        .eq('student_id', studentId)
        .order('logged_date', { ascending: true });

      if (startDate) {
        query = query.gte('logged_date', startDate);
      }
      if (endDate) {
        query = query.lte('logged_date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });
}

export function useNutritionProgress(studentId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['nutrition_progress', studentId, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('nutrition_progress')
        .select('*')
        .eq('student_id', studentId)
        .order('recorded_date', { ascending: true });

      if (startDate) {
        query = query.gte('recorded_date', startDate);
      }
      if (endDate) {
        query = query.lte('recorded_date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });
}

export function useStudentNutritionStats(studentId: string) {
  return useQuery({
    queryKey: ['nutrition_stats', studentId],
    queryFn: async () => {
      // Get last 30 days of logs
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: logs, error: logsError } = await supabase
        .from('diet_logs')
        .select('*')
        .eq('student_id', studentId)
        .gte('logged_date', thirtyDaysAgo.toISOString().split('T')[0]);

      if (logsError) throw logsError;

      // Get latest weight
      const { data: latestProgress, error: progressError } = await supabase
        .from('nutrition_progress')
        .select('weight, recorded_date')
        .eq('student_id', studentId)
        .order('recorded_date', { ascending: false })
        .limit(1)
        .single();

      // Calculate adherence
      const totalDays = logs?.length || 0;
      const completedMeals = logs?.filter(log => log.completed).length || 0;
      const adherenceRate = totalDays > 0 ? (completedMeals / totalDays) * 100 : 0;

      return {
        adherenceRate,
        totalLogs: totalDays,
        completedMeals,
        latestWeight: latestProgress?.weight || null,
        lastWeightDate: latestProgress?.recorded_date || null,
      };
    },
    enabled: !!studentId,
  });
}
