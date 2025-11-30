'use client';

import { supabase } from '@meupersonal/supabase';
import { useQuery } from '@tanstack/react-query';

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string | null;
  video_url: string | null;
  created_at?: string;
}

export function useExercises() {
  return useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');

      if (error) throw error;
      
      // Filter out invalid exercises (like mobile does)
      return (data || []).filter(
        (ex) =>
          ex.name &&
          ex.name.trim() !== '' &&
          !ex.name.toLowerCase().includes('adicionar exercício') &&
          !ex.name.toLowerCase().includes('adicionar exercicios')
      ) as Exercise[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useExercise(id: string) {
  return useQuery({
    queryKey: ['exercise', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Exercise;
    },
    enabled: !!id,
  });
}
