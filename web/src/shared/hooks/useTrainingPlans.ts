"use client";

import { createWorkoutsService } from "@elevapro/shared";
import { supabase } from "@elevapro/supabase";
import { useQuery } from "@tanstack/react-query";

export type { TrainingPlan, TrainingStatus as TrainingPlanStatus } from "@elevapro/shared";

const workoutsService = createWorkoutsService(supabase);

export function useTrainingPlans(periodizationId: string) {
  return useQuery({
    queryKey: ["training-plans", periodizationId],
    queryFn: () => workoutsService.fetchTrainingPlans(periodizationId),
    enabled: !!periodizationId,
    retry: 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useTrainingPlan(id: string) {
  return useQuery({
    queryKey: ["training-plan", id],
    queryFn: () => workoutsService.fetchTrainingPlanById(id),
    enabled: !!id,
    retry: 0,
  });
}

export function useActiveTrainingPlan(periodizationId: string) {
  return useQuery({
    queryKey: ["active-training-plan", periodizationId],
    queryFn: async () => {
      const plans = await workoutsService.fetchTrainingPlans(periodizationId);
      return plans.find((p) => p.status === "active") ?? null;
    },
    enabled: !!periodizationId,
  });
}
