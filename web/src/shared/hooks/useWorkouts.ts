"use client";

import type { Workout, WorkoutExercise } from "@meupersonal/shared";
import { createWorkoutsService } from "@meupersonal/shared";
import { supabase } from "@meupersonal/supabase";
import { useQuery } from "@tanstack/react-query";
import { useAuthUser } from "./useAuthUser";

export type { Workout, WorkoutExercise, WorkoutExercise as WorkoutItem };

const workoutsService = createWorkoutsService(supabase);

export function useWorkouts() {
  const { data: authUser } = useAuthUser();
  const userId = authUser?.id ?? null;

  return useQuery({
    queryKey: ["workouts", userId],
    queryFn: () => workoutsService.fetchWorkouts(userId as string),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useWorkout(id: string) {
  return useQuery({
    queryKey: ["workout", id],
    queryFn: () => workoutsService.fetchWorkoutById(id),
    enabled: !!id,
  });
}

export function useWorkoutsByPlan(planId: string) {
  return useQuery({
    queryKey: ["workouts-by-plan", planId],
    queryFn: () => workoutsService.fetchWorkoutsByPlan(planId),
    enabled: !!planId,
    retry: 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useWorkoutItems(workoutId: string) {
  return useQuery({
    queryKey: ["workout-items", workoutId],
    queryFn: async () => {
      const workout = await workoutsService.fetchWorkoutById(workoutId);
      return workout?.exercises ?? [];
    },
    enabled: !!workoutId,
    retry: 0,
    staleTime: 1000 * 60 * 5,
  });
}
