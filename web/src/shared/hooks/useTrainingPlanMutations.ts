"use client";

import {
  type CreateTrainingPlanInput,
  createWorkoutsService,
  type UpdateTrainingPlanInput,
} from "@meupersonal/shared";
import { supabase } from "@meupersonal/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type { CreateTrainingPlanInput, UpdateTrainingPlanInput } from "@meupersonal/shared";

const workoutsService = createWorkoutsService(supabase);

export function useCreateTrainingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTrainingPlanInput) => workoutsService.createTrainingPlan(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["training-plans", data.periodization_id] });
      queryClient.invalidateQueries({ queryKey: ["periodization", data.periodization_id] });
    },
  });
}

export function useUpdateTrainingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTrainingPlanInput }) => {
      return workoutsService.updateTrainingPlan(id, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["training-plans", data.periodization_id] });
      queryClient.invalidateQueries({ queryKey: ["training-plan", variables.id] });
    },
  });
}

export function useUpdateTrainingPlanStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "planned" | "active" | "completed";
    }) => {
      return workoutsService.updateTrainingPlan(id, { status });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["training-plans", data.periodization_id] });
      queryClient.invalidateQueries({ queryKey: ["training-plan", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["active-training-plan"] });
    },
  });
}

export function useDeleteTrainingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => workoutsService.deleteTrainingPlan(id),
    onSuccess: ({ periodization_id }) => {
      if (periodization_id) {
        queryClient.invalidateQueries({ queryKey: ["training-plans", periodization_id] });
        queryClient.invalidateQueries({ queryKey: ["periodization", periodization_id] });
      }
    },
  });
}

export function useCloneTrainingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => workoutsService.cloneTrainingPlan(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["training-plans", data.periodization_id] });
    },
  });
}
