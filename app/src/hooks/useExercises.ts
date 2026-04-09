import { supabase } from '@meupersonal/supabase';
import { useQuery } from '@tanstack/react-query';

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string | null;
  description: string | null;
  video_url: string | null;
  created_at?: string;
}

export function useExercises() {
  return useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const { data, error } = await supabase.from('exercises').select('*').order('name');
      if (error) throw error;
      return (data || []) as Exercise[];
    },
  });
}
