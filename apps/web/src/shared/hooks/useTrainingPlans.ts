'use client';

import { supabase } from '@meupersonal/supabase';
import { useQuery } from '@tanstack/react-query';

export type TrainingSplit = 
  | 'abc' 
  | 'abcd' 
  | 'abcde' 
  | 'abcdef' 
  | 'upper_lower' 
  | 'full_body' 
  | 'push_pull_legs' 
  | 'custom';

export type TrainingPlanStatus = 'draft' | 'active' | 'completed';

export interface TrainingPlan {
  id: string;
  periodization_id: string;
  name: string;
  description?: string;
  training_split: TrainingSplit;
  weekly_frequency: number;
  start_date: string;
  end_date: string;
  status: TrainingPlanStatus;
  notes?: string;
  goals?: string[];
  created_at: string;
  updated_at: string;
  // Joined data
  workouts_count?: number;
}

export function useTrainingPlans(periodizationId: string) {
  return useQuery({
    queryKey: ['training-plans', periodizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_plans')
        .select('*')
        .eq('periodization_id', periodizationId)
        .order('start_date', { ascending: true });

      if (error) throw error;

      // Get workouts count for each training plan
      const plansWithCounts = await Promise.all(
        (data || []).map(async (plan) => {
          const { count } = await supabase
            .from('workouts')
            .select('*', { count: 'exact', head: true })
            .eq('training_plan_id', plan.id);

          return {
            ...plan,
            workouts_count: count || 0,
          };
        })
      );

      return plansWithCounts as TrainingPlan[];
    },
    enabled: !!periodizationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useTrainingPlan(id: string) {
  return useQuery({
    queryKey: ['training-plan', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_plans')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Get workouts count
      const { count } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .eq('training_plan_id', id);

      return {
        ...data,
        workouts_count: count || 0,
      } as TrainingPlan;
    },
    enabled: !!id,
  });
}

export function useActiveTrainingPlan(periodizationId: string) {
  return useQuery({
    queryKey: ['active-training-plan', periodizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_plans')
        .select('*')
        .eq('periodization_id', periodizationId)
        .eq('status', 'active')
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) return null;

      // Get workouts count
      const { count } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .eq('training_plan_id', data.id);

      return {
        ...data,
        workouts_count: count || 0,
      } as TrainingPlan;
    },
    enabled: !!periodizationId,
  });
}
