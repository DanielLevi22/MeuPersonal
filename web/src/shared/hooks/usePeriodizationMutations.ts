"use client";

import {
  createWorkoutsService,
  type TrainingStatus,
  type UpdatePeriodizationInput,
} from "@elevapro/shared";
import { supabase } from "@elevapro/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthUser } from "./useAuthUser";

export type { UpdatePeriodizationInput };

const workoutsService = createWorkoutsService(supabase);

export interface CreatePeriodizationInput {
  student_id: string;
  name: string;
  objective?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

export function useCreatePeriodization() {
  const queryClient = useQueryClient();
  const { data: authUser } = useAuthUser();

  return useMutation({
    mutationFn: async (input: CreatePeriodizationInput) => {
      if (!authUser?.id) throw new Error("Usuário não autenticado");
      return workoutsService.createPeriodization({ specialist_id: authUser.id, ...input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periodizations"] });
    },
  });
}

export function useUpdatePeriodization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePeriodizationInput }) => {
      return workoutsService.updatePeriodization(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["periodizations"] });
      queryClient.invalidateQueries({ queryKey: ["periodization", variables.id] });
    },
  });
}

export function useUpdatePeriodizationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TrainingStatus }) => {
      return workoutsService.updatePeriodization(id, { status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["periodizations"] });
      queryClient.invalidateQueries({ queryKey: ["periodization", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["active-periodization"] });
    },
  });
}

export function useDeletePeriodization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => workoutsService.deletePeriodization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periodizations"] });
    },
  });
}

export function useActivatePeriodization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => workoutsService.activatePeriodization(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["periodizations"] });
      queryClient.invalidateQueries({ queryKey: ["periodization", data.id] });
      queryClient.invalidateQueries({ queryKey: ["active-periodization"] });
    },
  });
}

export function useCompletePeriodization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => workoutsService.updatePeriodization(id, { status: "completed" }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["periodizations"] });
      queryClient.invalidateQueries({ queryKey: ["periodization", data.id] });
      queryClient.invalidateQueries({ queryKey: ["active-periodization"] });
    },
  });
}
