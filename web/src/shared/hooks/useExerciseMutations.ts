"use client";

import { type CreateExerciseInput, createWorkoutsService } from "@meupersonal/shared";
import { supabase } from "@meupersonal/supabase";
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
