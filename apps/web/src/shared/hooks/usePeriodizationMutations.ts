'use client';

import { supabase } from '@meupersonal/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PeriodizationObjective, PeriodizationStatus } from './usePeriodizations';

export interface CreatePeriodizationInput {
  student_id: string;
  name: string;
  objective: PeriodizationObjective;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  notes?: string;
}

export interface UpdatePeriodizationInput {
  id: string;
  data: Partial<Omit<CreatePeriodizationInput, 'student_id'>>;
}

export interface UpdatePeriodizationStatusInput {
  id: string;
  status: PeriodizationStatus;
}

export function useCreatePeriodization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePeriodizationInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('periodizations')
        .insert({
          ...input,
          personal_id: user.id,
          status: 'planned',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodizations'] });
    },
  });
}

export function useUpdatePeriodization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdatePeriodizationInput) => {
      const { data: result, error } = await supabase
        .from('periodizations')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['periodizations'] });
      queryClient.invalidateQueries({ queryKey: ['periodization', variables.id] });
    },
  });
}

export function useUpdatePeriodizationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: UpdatePeriodizationStatusInput) => {
      const { data, error } = await supabase
        .from('periodizations')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['periodizations'] });
      queryClient.invalidateQueries({ queryKey: ['periodization', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['active-periodization'] });
    },
  });
}

export function useDeletePeriodization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('periodizations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodizations'] });
    },
  });
}

export function useActivatePeriodization() {
  const updateStatus = useUpdatePeriodizationStatus();

  return useMutation({
    mutationFn: async (id: string) => {
      // First, deactivate any other active periodizations for the same student
      const { data: periodization } = await supabase
        .from('periodizations')
        .select('student_id')
        .eq('id', id)
        .single();

      if (periodization) {
        await supabase
          .from('periodizations')
          .update({ status: 'completed' })
          .eq('student_id', periodization.student_id)
          .eq('status', 'active');
      }

      // Then activate this one
      return updateStatus.mutateAsync({ id, status: 'active' });
    },
  });
}

export function useCompletePeriodization() {
  const updateStatus = useUpdatePeriodizationStatus();

  return useMutation({
    mutationFn: async (id: string) => {
      return updateStatus.mutateAsync({ id, status: 'completed' });
    },
  });
}
