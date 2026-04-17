"use client";

import { defineAbilitiesFor, supabase } from "@meupersonal/supabase";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export interface Workout {
  id: string;
  title: string;
  description: string | null;
  personal_id: string;
  student_id: string | null;
  created_at: string;
  // New periodization fields
  training_plan_id?: string | null;
  identifier?: string | null;
  estimated_duration?: number | null;
  difficulty_level?: "beginner" | "intermediate" | "advanced" | null;
  focus_areas?: string[] | null;
  // Counts
  exercise_count?: number;
  assigned_count?: number;
}

export function useWorkouts() {
  const [currentUser, setCurrentUser] = useState<{
    accountType: string;
    services?: string[];
  } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("account_type")
          .eq("id", user.id)
          .single();

        if (profile) {
          let services: string[] = [];
          if (profile.account_type === "specialist") {
            const { data: servicesData } = await supabase
              .from("professional_services")
              .select("service_category")
              .eq("user_id", user.id)
              .eq("is_active", true);
            services = servicesData?.map((s) => s.service_category) || [];
          }

          setCurrentUser({
            accountType: profile.account_type,
            services,
          });
        }
      }
    };

    getUser();
  }, []);

  return useQuery({
    queryKey: ["workouts", userId],
    queryFn: async () => {
      if (!userId) return [];

      // Check permissions with CASL
      if (currentUser) {
        const ability = defineAbilitiesFor({
          accountType: currentUser.accountType as any,
          services: currentUser.services as any[],
        });
        if (ability.cannot("read", "Workout")) {
          throw new Error("Você não tem permissão para visualizar treinos");
        }
      }

      // Query with counts
      const { data, error } = await supabase
        .from("workouts")
        .select(`
          *,
          workout_exercises(count),
          workout_assignments(count)
        `)
        .eq("personal_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      interface WorkoutWithCounts extends Workout {
        workout_exercises: { count: number }[];
        workout_assignments: { count: number }[];
      }

      // Transform data to include counts
      return ((data as unknown as WorkoutWithCounts[]) || []).map((workout) => ({
        ...workout,
        exercise_count: workout.workout_exercises?.[0]?.count || 0,
        assigned_count: workout.workout_assignments?.[0]?.count || 0,
      }));
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useWorkout(id: string) {
  return useQuery({
    queryKey: ["workout", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select(`*, workout_exercises(count)`)
        .eq("id", id)
        .single();

      if (error) throw error;

      interface WorkoutWithCount extends Workout {
        workout_exercises: { count: number }[];
      }

      const w = data as unknown as WorkoutWithCount;
      return {
        ...w,
        exercise_count: w.workout_exercises?.[0]?.count || 0,
      } as Workout;
    },
    enabled: !!id,
  });
}

export interface WorkoutItem {
  id: string;
  workout_id: string;
  exercise_id: string;
  order: number;
  sets: number;
  reps: string;
  weight: string | null;
  rest_time: number;
  notes: string | null;
  exercise?: {
    id: string;
    name: string;
    muscle_group: string | null;
    video_url: string | null;
  };
}

export function useWorkoutItems(workoutId: string) {
  return useQuery({
    queryKey: ["workout-items", workoutId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_exercises")
        .select(`
          id,
          sets,
          reps,
          weight,
          rest_time,
          "order",
          exercise:exercises (
            id,
            name,
            muscle_group,
            video_url
          )
        `)
        .eq("workout_id", workoutId)
        .order("order", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as WorkoutItem[];
    },
    enabled: !!workoutId,
    retry: 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useWorkoutsByPlan(planId: string) {
  return useQuery({
    queryKey: ["workouts-by-plan", planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select(`*, workout_exercises(count)`)
        .eq("training_plan_id", planId)
        .order("identifier", { ascending: true });

      if (error) throw error;

      interface WorkoutWithCount extends Workout {
        workout_exercises: { count: number }[];
      }

      return ((data as unknown as WorkoutWithCount[]) || []).map((w) => ({
        ...w,
        exercise_count: w.workout_exercises?.[0]?.count || 0,
      })) as Workout[];
    },
    enabled: !!planId,
    retry: 0,
    staleTime: 1000 * 60 * 5,
  });
}
