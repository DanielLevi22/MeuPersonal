"use client";

import type { CreateWorkoutInput, UpdateWorkoutInput } from "@elevapro/shared";
import { createWorkoutsService } from "@elevapro/shared";
import { supabase } from "@elevapro/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type { CreateWorkoutInput, UpdateWorkoutInput };

const workoutsService = createWorkoutsService(supabase);

export function useCreateWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workout: CreateWorkoutInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) throw new Error("Usuário não autenticado");
      // specialist_id or student_id must be provided by the caller — do not default here
      return workoutsService.createWorkout(workout);
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
