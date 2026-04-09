'use client';

import { supabase } from '@meupersonal/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TrainingPlanStatus, TrainingSplit } from './useTrainingPlans';

export interface CreateTrainingPlanInput {
  periodization_id: string;
  name: string;
  description?: string;
  training_split: TrainingSplit;
  weekly_frequency: number;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  notes?: string;
  goals?: string[];
}

export interface UpdateTrainingPlanInput {
  id: string;
  data: Partial<Omit<CreateTrainingPlanInput, 'periodization_id'>>;
}

export interface UpdateTrainingPlanStatusInput {
  id: string;
  status: TrainingPlanStatus;
}

export function useCreateTrainingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTrainingPlanInput) => {
      const { data, error } = await supabase
        .from('training_plans')
        .insert({
          ...input,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['training-plans', data.periodization_id] });
      queryClient.invalidateQueries({ queryKey: ['periodization', data.periodization_id] });
    },
  });
}

export function useUpdateTrainingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateTrainingPlanInput) => {
      const { data: result, error } = await supabase
        .from('training_plans')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['training-plans', data.periodization_id] });
      queryClient.invalidateQueries({ queryKey: ['training-plan', variables.id] });
    },
  });
}

export function useUpdateTrainingPlanStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: UpdateTrainingPlanStatusInput) => {
      const { data, error } = await supabase
        .from('training_plans')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['training-plans', data.periodization_id] });
      queryClient.invalidateQueries({ queryKey: ['training-plan', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['active-training-plan'] });
    },
  });
}

export function useDeleteTrainingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get periodization_id before deleting
      const { data: plan } = await supabase
        .from('training_plans')
        .select('periodization_id')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('training_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return plan?.periodization_id;
    },
    onSuccess: (periodizationId) => {
      if (periodizationId) {
        queryClient.invalidateQueries({ queryKey: ['training-plans', periodizationId] });
        queryClient.invalidateQueries({ queryKey: ['periodization', periodizationId] });
      }
    },
  });
}

export function useCloneTrainingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get original training plan
      const { data: original, error: fetchError } = await supabase
        .from('training_plans')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Create clone
      const { data: clone, error: createError } = await supabase
        .from('training_plans')
        .insert({
          periodization_id: original.periodization_id,
          name: `${original.name} (Cópia)`,
          description: original.description,
          training_split: original.training_split,
          weekly_frequency: original.weekly_frequency,
          start_date: original.start_date,
          end_date: original.end_date,
          status: 'draft',
          notes: original.notes,
          goals: original.goals,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Clone workouts
      const { data: workouts } = await supabase
        .from('workouts')
        .select('*')
        .eq('training_plan_id', id);

      if (workouts && workouts.length > 0) {
        const clonedWorkouts = workouts.map((workout) => ({
          training_plan_id: clone.id,
          personal_id: workout.personal_id,
          title: workout.title,
          description: workout.description,
          identifier: workout.identifier,
          estimated_duration: workout.estimated_duration,
          difficulty_level: workout.difficulty_level,
          focus_areas: workout.focus_areas,
        }));

        await supabase.from('workouts').insert(clonedWorkouts);
      }

      return clone;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['training-plans', data.periodization_id] });
    },
  });
}
