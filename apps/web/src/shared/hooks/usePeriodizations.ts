'use client';

import { supabase } from '@meupersonal/supabase';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export type PeriodizationObjective = 
  | 'hypertrophy' 
  | 'strength' 
  | 'endurance' 
  | 'weight_loss' 
  | 'conditioning' 
  | 'general_fitness';

export type PeriodizationStatus = 'planned' | 'active' | 'completed' | 'cancelled';

export interface Periodization {
  id: string;
  student_id: string;
  personal_id: string;
  name: string;
  objective: PeriodizationObjective;
  start_date: string;
  end_date: string;
  status: PeriodizationStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  student?: {
    id: string;
    full_name: string;
    email: string;
  };
  training_plans_count?: number;
}

export function usePeriodizations() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'personal' | 'student' | null>(null);

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
          setUserRole(profile.role as 'personal' | 'student');
        }
      }
    };

    getUser();
  }, []);

  return useQuery({
    queryKey: ['periodizations', userId, userRole],
    queryFn: async () => {
      if (!userId || !userRole) return [];

      let query = supabase
        .from('periodizations')
        .select(`
          *,
          student:profiles!periodizations_student_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      // Filter based on role
      if (userRole === 'personal') {
        query = query.eq('personal_id', userId);
      } else {
        query = query.eq('student_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get training plans count for each periodization
      const periodizationsWithCounts = await Promise.all(
        (data || []).map(async (periodization) => {
          const { count } = await supabase
            .from('training_plans')
            .select('*', { count: 'exact', head: true })
            .eq('periodization_id', periodization.id);

          return {
            ...periodization,
            training_plans_count: count || 0,
          };
        })
      );

      return periodizationsWithCounts as Periodization[];
    },
    enabled: !!userId && !!userRole,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function usePeriodization(id: string) {
  return useQuery({
    queryKey: ['periodization', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('periodizations')
        .select(`
          *,
          student:profiles!periodizations_student_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('id', id)
        .maybeSingle(); // Changed from .single() to .maybeSingle() to handle RLS

      if (error) throw error;
      if (!data) return null; // Return null if not found or no permission

      // Get training plans count
      const { count } = await supabase
        .from('training_plans')
        .select('*', { count: 'exact', head: true })
        .eq('periodization_id', id);

      return {
        ...data,
        training_plans_count: count || 0,
      } as Periodization;
    },
    enabled: !!id,
  });
}

export function useActivePeriodization(studentId: string) {
  return useQuery({
    queryKey: ['active-periodization', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('periodizations')
        .select(`
          *,
          student:profiles!periodizations_student_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('student_id', studentId)
        .eq('status', 'active')
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) return null;

      // Get training plans count
      const { count } = await supabase
        .from('training_plans')
        .select('*', { count: 'exact', head: true })
        .eq('periodization_id', data.id);

      return {
        ...data,
        training_plans_count: count || 0,
      } as Periodization;
    },
    enabled: !!studentId,
  });
}
