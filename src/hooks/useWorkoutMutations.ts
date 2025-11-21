import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Workout } from './useWorkouts';

export interface CreateWorkoutInput {
  title: string;
  description?: string;
  personal_id: string;
  items: Array<{
    exercise_id: string;
    sets: number;
    reps: string;
    weight?: string;
    rest_time: number;
    order: number;
  }>;
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workout: CreateWorkoutInput) => {
      // Criar workout
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          title: workout.title,
          description: workout.description || null,
          personal_id: workout.personal_id,
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Criar workout items
      if (workout.items.length > 0) {
        const workoutItems = workout.items.map((item) => ({
          workout_id: workoutData.id,
          exercise_id: item.exercise_id,
          sets: item.sets,
          reps: item.reps,
          weight: item.weight || null,
          rest_time: item.rest_time,
          order: item.order,
        }));

        const { error: itemsError } = await supabase
          .from('workout_items')
          .insert(workoutItems);

        if (itemsError) throw itemsError;
      }

      return workoutData as Workout;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workout', data.id] });
    },
    onError: (error: Error) => {
      Alert.alert('Erro', error.message || 'Não foi possível criar o treino.');
    },
  });
}

export function useUpdateWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Workout> }) => {
      const { data: updated, error } = await supabase
        .from('workouts')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return updated as Workout;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workout', data.id] });
    },
    onError: (error: Error) => {
      Alert.alert('Erro', error.message || 'Não foi possível atualizar o treino.');
    },
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Deletar workout items primeiro
      await supabase.from('workout_items').delete().eq('workout_id', id);
      
      const { error } = await supabase.from('workouts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
    onError: (error: Error) => {
      Alert.alert('Erro', error.message || 'Não foi possível deletar o treino.');
    },
  });
}

