"use client";

import { createWorkoutsService } from "@elevapro/shared";
import { supabase } from "@elevapro/supabase";
import { useQuery } from "@tanstack/react-query";

export type { Exercise } from "@elevapro/shared";

const workoutsService = createWorkoutsService(supabase);

export function useExercises() {
  return useQuery({
    queryKey: ["exercises"],
    queryFn: async () => {
      const exercises = await workoutsService.fetchExercises();
      return exercises.filter(
        (ex) =>
          ex.name &&
          ex.name.trim() !== "" &&
          !ex.name.toLowerCase().includes("adicionar exercício") &&
          !ex.name.toLowerCase().includes("adicionar exercicios"),
      );
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useExercise(id: string) {
  return useQuery({
    queryKey: ["exercise", id],
    queryFn: async () => {
      const exercises = await workoutsService.fetchExercises();
      return exercises.find((e) => e.id === id) ?? null;
    },
    enabled: !!id,
  });
}
