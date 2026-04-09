'use client';

import { defineAbilitiesFor, supabase } from '@meupersonal/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export interface CreateWorkoutInput {
  title: string;
  description?: string;
  training_plan_id?: string | null;
  identifier?: string | null;
  estimated_duration?: number | null;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | null;
  focus_areas?: string[] | null;
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const getRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role);
        }
      }
    };

    getRole();
  }, []);

  return useMutation({
    mutationFn: async (workout: CreateWorkoutInput) => {
      // Check permissions with CASL
      if (userRole) {
        const ability = defineAbilitiesFor(userRole as any);
        if (ability.cannot('create', 'Workout')) {
          throw new Error('Você não tem permissão para criar treinos');
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('workouts')
        .insert({
          title: workout.title,
          description: workout.description || null,
          personal_id: user.id,
          training_plan_id: workout.training_plan_id,
          identifier: workout.identifier,
          estimated_duration: workout.estimated_duration,
          difficulty_level: workout.difficulty_level,
          focus_areas: workout.focus_areas,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

export function useUpdateWorkout() {
  const queryClient = useQueryClient();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const getRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role);
        }
      }
    };

    getRole();
  }, []);

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<CreateWorkoutInput>) => {
      // Check permissions with CASL
      if (userRole) {
        const ability = defineAbilitiesFor(userRole as any);
        if (ability.cannot('update', 'Workout')) {
          throw new Error('Você não tem permissão para editar treinos');
        }
      }

      const { data: updated, error } = await supabase
        .from('workouts')
        .update({
          title: data.title,
          description: data.description,
          training_plan_id: data.training_plan_id,
          identifier: data.identifier,
          estimated_duration: data.estimated_duration,
          difficulty_level: data.difficulty_level,
          focus_areas: data.focus_areas,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workout', data.id] });
    },
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const getRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role);
        }
      }
    };

    getRole();
  }, []);

  return useMutation({
    mutationFn: async (id: string) => {
      // Check permissions with CASL
      if (userRole) {
        const ability = defineAbilitiesFor(userRole as any);
        if (ability.cannot('delete', 'Workout')) {
          throw new Error('Você não tem permissão para deletar treinos');
        }
      }

      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}
