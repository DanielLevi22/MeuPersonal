'use client';

import { defineAbilitiesFor, supabase } from '@meupersonal/supabase';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export interface Workout {
  id: string;
  title: string;
  description: string | null;
  personal_id: string;
  student_id: string | null;
  created_at: string;
  exercise_count?: number;
  assigned_count?: number;
}

export function useWorkouts() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Get user role
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

    getUser();
  }, []);

  return useQuery({
    queryKey: ['workouts', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Check permissions with CASL
      if (userRole) {
        const ability = defineAbilitiesFor(userRole as any);
        if (ability.cannot('read', 'Workout')) {
          throw new Error('Você não tem permissão para visualizar treinos');
        }
      }

      // Query with counts
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_items(count),
          workout_assignments(count)
        `)
        .eq('personal_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include counts
      return (data || []).map((workout: any) => ({
        ...workout,
        exercise_count: workout.workout_items?.[0]?.count || 0,
        assigned_count: workout.workout_assignments?.[0]?.count || 0,
      })) as Workout[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useWorkout(id: string) {
  return useQuery({
    queryKey: ['workout', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Workout;
    },
    enabled: !!id,
  });
}
