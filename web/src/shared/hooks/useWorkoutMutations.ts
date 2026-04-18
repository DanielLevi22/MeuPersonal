"use client";

import type { UpdateWorkoutInput } from "@meupersonal/shared";
import { createWorkoutsService } from "@meupersonal/shared";
import { supabase } from "@meupersonal/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthUser } from "./useAuthUser";

export type { UpdateWorkoutInput };

const workoutsService = createWorkoutsService(supabase);

export interface CreateWorkoutInput {
  title: string;
  description?: string | null;
  training_plan_id?: string | null;
  muscle_group?: string | null;
  difficulty?: "beginner" | "intermediate" | "advanced" | null;
  day_of_week?:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday"
    | null;
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();
  const { data: authUser } = useAuthUser();

  return useMutation({
    mutationFn: async (workout: CreateWorkoutInput) => {
      if (!authUser?.id) throw new Error("Usuário não autenticado");
      return workoutsService.createWorkout({ specialist_id: authUser.id, ...workout });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

export function useUpdateWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & UpdateWorkoutInput) => {
      return workoutsService.updateWorkout(id, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["workout", data.id] });
    },
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => workoutsService.deleteWorkout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

export function useDeleteWorkoutItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => workoutsService.removeExerciseFromWorkout(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-items"] });
      queryClient.invalidateQueries({ queryKey: ["workouts-by-plan"] });
    },
  });
}
