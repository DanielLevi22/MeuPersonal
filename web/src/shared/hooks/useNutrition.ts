"use client";

import type { DietMeal, DietMealItem, DietPlan, Food } from "@meupersonal/core";
import { defineAbilitiesFor, supabase } from "@meupersonal/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { StrategyResult } from "../utils/dietStrategies";
import { useAuthUser } from "./useAuthUser";

// --- Hooks for Data Fetching ---

export interface StudentNutritionStats {
  adherenceRate: number;
  totalLogs: number;
  completedMeals: number;
  latestWeight: number | null;
  lastWeightDate: string | null;
}

export function useFoods(searchQuery = "") {
  return useQuery({
    queryKey: ["foods", searchQuery],
    queryFn: async () => {
      let query = supabase.from("foods").select("*").limit(50);

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
  const { data: currentUser } = useAuthUser();

  return useQuery({
    queryKey: ["nutrition_plans", studentId, currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];

      const ability = defineAbilitiesFor({
        accountType: currentUser.accountType as any,
        services: currentUser.services as any[],
      });

      if (ability.cannot("read", "Diet")) {
        throw new Error("Você não tem permissão para visualizar dietas");
      }

      let query = supabase.from("nutrition_plans").select("*");

      if (studentId) {
        query = query.eq("student_id", studentId);
        if (currentUser.accountType === "professional") {
          query = query.or(`personal_id.eq.${currentUser.id},professional_id.eq.${currentUser.id}`);
        }
      } else if (currentUser.accountType === "professional") {
        query = query.or(`personal_id.eq.${currentUser.id},professional_id.eq.${currentUser.id}`);
      }

      const { data: plans, error: plansError } = await query.order("created_at", {
        ascending: false,
      });
      if (plansError) throw plansError;
      if (!plans || plans.length === 0) return [];

      const uniqueStudentIds = Array.from(new Set(plans.map((p) => p.student_id)));
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", uniqueStudentIds);

      if (profilesError) throw profilesError;
      const profileMap = new Map(profiles?.map((p) => [p.id, p]));

      return plans.map((plan) => ({
        ...plan,
        profiles: profileMap.get(plan.student_id) || {
          full_name: "Aluno Desconhecido",
          avatar_url: null,
        },
      })) as (DietPlan & { profiles: { full_name: string; avatar_url: string | null } })[];
    },
    enabled: !!currentUser,
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

export function useDietPlan(id: string) {
  return useQuery({
    queryKey: ["diet_plan", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nutrition_plans")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as DietPlan;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

export function useDietMeals(dietPlanId: string) {
  return useQuery({
    queryKey: ["meals", dietPlanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meals")
        .select(`
          *,
          meal_foods (
            *,
            food:foods (*)
          )
        `)
        .eq("diet_plan_id", dietPlanId)
        .order("day_of_week", { ascending: true })
        .order("meal_order", { ascending: true });

      if (error) throw error;

      const meals = (data || []).map((meal) => ({
        ...meal,
        meal_foods: meal.meal_foods?.sort(
          (a: DietMealItem, b: DietMealItem) => (a.order_index || 0) - (b.order_index || 0),
        ),
      }));

      return meals as (DietMeal & { meal_foods: (DietMealItem & { food: Food })[] })[];
    },
    enabled: !!dietPlanId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

// --- Mutations ---

export function useCreateDietPlan() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useAuthUser();

  return useMutation({
    mutationFn: async (
      plan: Omit<DietPlan, "id" | "created_at" | "version" | "is_active" | "status">,
    ) => {
      if (currentUser) {
        const ability = defineAbilitiesFor({
          accountType: currentUser.accountType as any,
          services: currentUser.services as any[],
        });
        if (ability.cannot("create", "Diet"))
          throw new Error("Você não tem permissão para criar dietas");
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: existingActive } = await supabase
        .from("nutrition_plans")
        .select("id")
        .eq("student_id", plan.student_id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (existingActive) throw new Error("Já existe um plano ativo para este aluno.");

      const { data, error } = await supabase
        .from("nutrition_plans")
        .insert({
          ...plan,
          personal_id: user.id,
          professional_id: user.id,
          version: 1,
          is_active: false,
          status: "draft",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["nutrition_plans"] }),
  });
}

export function useCreateDietPlanWithStrategy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      plan,
      strategyData,
    }: {
      plan: Omit<DietPlan, "id" | "created_at" | "version" | "is_active" | "status">;
      strategyData: StrategyResult;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: existingActive } = await supabase
        .from("nutrition_plans")
        .select("id")
        .eq("student_id", plan.student_id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (existingActive) throw new Error("Já existe um plano ativo para este aluno.");

      const { data: newPlan, error: planError } = await supabase
        .from("nutrition_plans")
        .insert({
          ...plan,
          personal_id: user.id,
          professional_id: user.id,
          version: 1,
          is_active: false,
          status: "draft",
        })
        .select()
        .single();
      if (planError) throw planError;

      const { weeklySchedule } = strategyData;
      const daysToSave = plan.plan_type === "unique" ? [weeklySchedule[0]] : weeklySchedule;

      for (const day of daysToSave) {
        for (const [index, mealTemplate] of day.meals.entries()) {
          await supabase.from("meals").insert({
            diet_plan_id: newPlan.id,
            day_of_week: day.dayOfWeek,
            meal_type: mealTemplate.type,
            meal_order: index,
            name: mealTemplate.name,
            target_calories: 0,
            meal_time: mealTemplate.time,
          });
        }
      }
      return newPlan;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["nutrition_plans"] }),
  });
}

export function useUpdateDietPlanStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      planId,
      status,
      isActive,
    }: {
      planId: string;
      status: DietPlan["status"];
      isActive: boolean;
    }) => {
      const { data, error } = await supabase
        .from("nutrition_plans")
        .update({ status, is_active: isActive })
        .eq("id", planId)
        .select()
        .single();
      if (error) throw error;
      return data as DietPlan;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["nutrition_plans"] });
      queryClient.invalidateQueries({ queryKey: ["diet_plan", data.id] });
    },
  });
}

export function useDeleteDietPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (planId: string) => {
      // First, get the plan to know the studentId for invalidation
      const { data: plan } = await supabase
        .from("nutrition_plans")
        .select("student_id")
        .eq("id", planId)
        .single();

      // Get all meals for this plan to delete dependent foods/logs
      const { data: meals } = await supabase.from("meals").select("id").eq("diet_plan_id", planId);

      const mealIds = meals?.map((m) => m.id) || [];

      if (mealIds.length > 0) {
        // Delete logs first - handle both possible column names
        await supabase.from("meal_logs").delete().in("diet_meal_id", mealIds);
        await supabase.from("meal_logs").delete().in("meal_id", mealIds);
        // Delete foods
        await supabase.from("meal_foods").delete().in("diet_meal_id", mealIds);
        // Delete meals
        await supabase.from("meals").delete().in("id", mealIds);
      }

      // Finally delete the plan
      const { error } = await supabase.from("nutrition_plans").delete().eq("id", planId);
      if (error) throw error;
      return { planId, studentId: plan?.student_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["nutrition_plans"] });
      queryClient.removeQueries({ queryKey: ["diet_plan", data.planId] });
      queryClient.removeQueries({ queryKey: ["meals", data.planId] });
    },
  });
}

export function useFinishDietPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (planId: string) => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("nutrition_plans")
        .update({ status: "finished", is_active: false, end_date: today })
        .eq("id", planId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["nutrition_plans"] });
      queryClient.invalidateQueries({ queryKey: ["diet_plan", data.id] });
    },
  });
}

export function useAddMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (meal: Omit<DietMeal, "id">) => {
      console.log("🥘 Creating meal:", meal);
      const { data, error } = await supabase.from("meals").insert(meal).select().single();
      if (error) {
        console.error("❌ Error creating meal:", error);
        if (error.code === "23503" && error.details?.includes("daily_goals")) {
          throw new Error(
            "O aluno não possui um perfil completo. Por favor, verifique o cadastro.",
          );
        }
        throw new Error(error.message || "Erro ao criar refeição");
      }
      return data;
    },
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({ queryKey: ["meals", variables.diet_plan_id] }),
  });
}

export function useUpdateMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<DietMeal>) => {
      const { data, error } = await supabase
        .from("meals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meals"] }),
  });
}

export function useDeleteMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Clear foods and logs for this specific meal
      await supabase.from("meal_foods").delete().eq("diet_meal_id", id);
      await supabase.from("meal_logs").delete().eq("diet_meal_id", id);
      await supabase.from("meal_logs").delete().eq("meal_id", id);

      // 2. Delete the meal
      const { error } = await supabase.from("meals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meals"] }),
  });
}

export function useAddFoodToMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: {
      diet_meal_id: string;
      food_id: string;
      quantity: number;
      unit: string;
      order_index: number;
    }) => {
      console.log("🍎 Adding food to meal:", item);
      const { data, error } = await supabase.from("meal_foods").insert(item).select().single();
      if (error) {
        console.error("❌ Error adding food to meal:", error);
        throw new Error(error.message || "Erro ao adicionar alimento");
      }
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meals"] }),
  });
}

export function useUpdateMealItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<DietMealItem>) => {
      const { data, error } = await supabase
        .from("meal_foods")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meals"] }),
  });
}

export function useRemoveMealItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meal_foods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meals"] }),
  });
}

export function useCopyDay() {
  return useMutation({
    mutationFn: async ({ dietPlanId, dayOfWeek }: { dietPlanId: string; dayOfWeek: number }) => {
      const { data: meals, error } = await supabase
        .from("meals")
        .select("*, meal_foods(*, food:foods(*))")
        .eq("diet_plan_id", dietPlanId)
        .eq("day_of_week", dayOfWeek)
        .order("meal_order", { ascending: true });
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
      copiedMeals,
    }: {
      dietPlanId: string;
      targetDay: number;
      copiedMeals: any[];
    }) => {
      // 1. Get current meals for the target day
      const { data: targetMeals } = await supabase
        .from("meals")
        .select("id")
        .eq("diet_plan_id", dietPlanId)
        .eq("day_of_week", targetDay);

      const targetMealIds = targetMeals?.map((m) => m.id) || [];

      if (targetMealIds.length > 0) {
        // 2. Clear foods and logs for these meals first (cascade fallback)
        await supabase.from("meal_foods").delete().in("diet_meal_id", targetMealIds);
        await supabase.from("meal_logs").delete().in("diet_meal_id", targetMealIds);
        await supabase.from("meal_logs").delete().in("meal_id", targetMealIds);

        // 3. Delete the meals themselves
        await supabase.from("meals").delete().in("id", targetMealIds);
      }

      // 4. Paste new meals
      for (const sourceMeal of copiedMeals) {
        const { data: newMeal, error: mealError } = await supabase
          .from("meals")
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
        if (sourceMeal.meal_foods?.length > 0) {
          const itemsToInsert = sourceMeal.meal_foods.map((item: any) => ({
            diet_meal_id: newMeal.id,
            food_id: item.food_id,
            quantity: item.quantity,
            unit: item.unit,
            order_index: item.order_index,
          }));
          await supabase.from("meal_foods").insert(itemsToInsert);
        }
      }
      return { dietPlanId, targetDay };
    },
    onSuccess: (data) => queryClient.invalidateQueries({ queryKey: ["meals", data.dietPlanId] }),
  });
}

export function useClearDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dietPlanId, dayOfWeek }: { dietPlanId: string; dayOfWeek: number }) => {
      // 1. Get current meals for the day
      const { data: mealsToDelete } = await supabase
        .from("meals")
        .select("id")
        .eq("diet_plan_id", dietPlanId)
        .eq("day_of_week", dayOfWeek);

      const mealIds = mealsToDelete?.map((m) => m.id) || [];

      if (mealIds.length > 0) {
        // 2. Clear foods and logs
        await supabase.from("meal_foods").delete().in("diet_meal_id", mealIds);
        await supabase.from("meal_logs").delete().in("diet_meal_id", mealIds);
        await supabase.from("meal_logs").delete().in("meal_id", mealIds);

        // 3. Delete meals
        const { error } = await supabase.from("meals").delete().in("id", mealIds);
        if (error) throw error;
      }
      return { dietPlanId, dayOfWeek };
    },
    onSuccess: (data) => queryClient.invalidateQueries({ queryKey: ["meals", data.dietPlanId] }),
  });
}

export function useImportDiet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sourceDietPlanId,
      targetStudentId,
    }: {
      sourceDietPlanId: string;
      targetStudentId: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      const { data: sourcePlan, error: planError } = await supabase
        .from("nutrition_plans")
        .select("*")
        .eq("id", sourceDietPlanId)
        .single();
      if (planError) throw planError;
      const { data: existingActive } = await supabase
        .from("nutrition_plans")
        .select("id")
        .eq("student_id", targetStudentId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (existingActive) throw new Error("Já existe um plano ativo para este aluno.");

      const { data: newPlan, error: newPlanError } = await supabase
        .from("nutrition_plans")
        .insert({
          student_id: targetStudentId,
          personal_id: user.id,
          professional_id: user.id,
          name: `${sourcePlan.name} (Importado)`,
          description: sourcePlan.description,
          start_date: new Date().toISOString().split("T")[0],
          end_date: sourcePlan.end_date,
          target_calories: sourcePlan.target_calories,
          target_protein: sourcePlan.target_protein,
          target_carbs: sourcePlan.target_carbs,
          target_fat: sourcePlan.target_fat,
          plan_type: sourcePlan.plan_type,
          version: 1,
          is_active: true,
          status: "active",
        })
        .select()
        .single();
      if (newPlanError) throw newPlanError;

      const { data: sourceMeals, error: mealsError } = await supabase
        .from("meals")
        .select("*, meal_foods(*)")
        .eq("diet_plan_id", sourceDietPlanId);
      if (mealsError) throw mealsError;

      for (const sourceMeal of sourceMeals || []) {
        const { data: newMeal, error: mealError } = await supabase
          .from("meals")
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
        if (sourceMeal.meal_foods?.length > 0) {
          const itemsToInsert = sourceMeal.meal_foods.map((item: any) => ({
            diet_meal_id: newMeal.id,
            food_id: item.food_id,
            quantity: item.quantity,
            unit: item.unit,
            order_index: item.order_index,
          }));
          await supabase.from("meal_foods").insert(itemsToInsert);
        }
      }
      return newPlan;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["nutrition_plans"] }),
  });
}

export function useDietLogs(studentId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["diet_logs", studentId, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from("meal_logs")
        .select("*")
        .eq("student_id", studentId)
        .order("logged_date", { ascending: true });
      if (startDate) query = query.gte("logged_date", startDate);
      if (endDate) query = query.lte("logged_date", endDate);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useNutritionProgress(studentId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["nutrition_progress", studentId, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from("nutrition_progress")
        .select("*")
        .eq("student_id", studentId)
        .order("recorded_date", { ascending: true });
      if (startDate) query = query.gte("recorded_date", startDate);
      if (endDate) query = query.lte("recorded_date", endDate);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useStudentNutritionStats(studentId: string) {
  return useQuery({
    queryKey: ["nutrition_stats", studentId],
    queryFn: async (): Promise<StudentNutritionStats> => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: logs, error: logsError } = await supabase
        .from("meal_logs")
        .select("*")
        .eq("student_id", studentId)
        .gte("logged_date", thirtyDaysAgo.toISOString().split("T")[0]);
      if (logsError) throw logsError;

      const { data: latestProgress } = await supabase
        .from("nutrition_progress")
        .select("weight, recorded_date")
        .eq("student_id", studentId)
        .order("recorded_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      const totalDays = logs?.length || 0;
      const completedMeals = logs?.filter((log) => log.completed).length || 0;
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
    staleTime: 1000 * 60 * 2, // 2 minutes (stats can change if user logs a meal)
    refetchOnWindowFocus: false,
  });
}

export function useManualLogMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      mealId,
      completed,
      loggedAt,
    }: {
      studentId: string;
      mealId: string;
      completed: boolean;
      loggedAt: string;
    }) => {
      const dateStr = loggedAt.split("T")[0];
      const { data: existing } = await supabase
        .from("meal_logs")
        .select("id")
        .eq("meal_id", mealId)
        .gte("logged_date", dateStr)
        .lte("logged_date", dateStr)
        .maybeSingle();
      if (existing) {
        const { data, error } = await supabase
          .from("meal_logs")
          .update({ completed, logged_at: loggedAt })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("meal_logs")
        .insert({ student_id: studentId, diet_meal_id: mealId, completed, logged_date: dateStr })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({ queryKey: ["nutrition_stats", variables.studentId] }),
  });
}
