"use client";

import { type CreateExerciseInput, createWorkoutsService } from "@elevapro/shared";
import { supabase } from "@elevapro/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const workoutsService = createWorkoutsService(supabase);

export function useCreateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (exercise: CreateExerciseInput) => workoutsService.createExercise(exercise),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
    },
  });
}
