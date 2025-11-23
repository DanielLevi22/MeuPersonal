import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { supabase } from '@meupersonal/supabase';
import { Exercise } from './useExercises';

export interface CreateExerciseInput {
  name: string;
  muscle_group: string;
  video_url?: string;
}

export function useCreateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (exercise: CreateExerciseInput) => {
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          name: exercise.name,
          muscle_group: exercise.muscle_group,
          video_url: exercise.video_url || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Exercise;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
    onError: (error: Error) => {
      Alert.alert('Erro', error.message || 'Não foi possível criar o exercício.');
    },
  });
}

export function useUpdateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Exercise> }) => {
      const { data: updated, error } = await supabase
        .from('exercises')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return updated as Exercise;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
    onError: (error: Error) => {
      Alert.alert('Erro', error.message || 'Não foi possível atualizar o exercício.');
    },
  });
}

