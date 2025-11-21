import { supabase } from '@/lib/supabase';
import { create } from 'zustand';

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string | null;
  video_url: string | null;
}

export interface WorkoutItem {
  id?: string;
  exercise_id: string;
  exercise?: Exercise;
  sets: number;
  reps: string;
  weight: string;
  rest_time: number;
  notes: string;
}

export interface Workout {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
}

export interface SelectedExercise {
  id: string;
  name: string;
  muscle_group: string;
  sets: number;
  reps: number;
  rest_seconds: number;
}

interface WorkoutState {
  workouts: Workout[];
  exercises: Exercise[];
  selectedExercises: SelectedExercise[];
  isLoading: boolean;
  fetchWorkouts: (personalId: string) => Promise<void>;
  fetchExercises: () => Promise<void>;
  createWorkout: (workout: { title: string; description: string; items: WorkoutItem[] }) => Promise<void>;
  setSelectedExercises: (exercises: SelectedExercise[]) => void;
  clearSelectedExercises: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workouts: [],
  exercises: [],
  selectedExercises: [],
  isLoading: false,
  fetchWorkouts: async (personalId) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('personal_id', personalId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ workouts: data });
    } catch (error) {
      console.error('Error fetching workouts:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  fetchExercises: async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');

      if (error) throw error;
      set({ exercises: data });
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  },
  createWorkout: async (workout) => {
    // Implementation for creating workout and items
    console.log("Creating workout", workout);
  },
  setSelectedExercises: (exercises) => {
    set({ selectedExercises: exercises });
  },
  clearSelectedExercises: () => {
    set({ selectedExercises: [] });
  }
}));
