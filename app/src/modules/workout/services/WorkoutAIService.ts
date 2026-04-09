import {
  AIWorkoutDay,
  AIWorkoutItem,
  AIWorkoutResponse,
  AssistantService,
} from '@/modules/ai/services/AssistantService';
import { Exercise } from '../types';

// Re-export types for compatibility
export { AIWorkoutResponse, AIWorkoutDay, AIWorkoutItem };

export const WorkoutAIService = {
  /**
   * Generates a workout structure using the centralized Co-Pilot
   */
  generateWorkoutStructure: async (
    split: string,
    goal: string, // 'Hypertrophy', 'Strength', etc.
    studentLevel: string, // 'Beginner', 'Intermediate'
    availableExercises: Exercise[],
    userContext?: string // 'Has knee pain', etc.
  ): Promise<AIWorkoutResponse> => {
    const response = await AssistantService.negotiateWorkout(
      split,
      goal,
      studentLevel,
      availableExercises,
      userContext
    );

    if (response) {
      return response;
    }

    return mockFallback(split);
  },

  generateBatchWorkoutPlan: async (
    phases: { name: string; focus: string; weeks: number }[],
    split: string,
    goal: string,
    studentLevel: string,
    availableExercises: Exercise[],
    userContext?: string
  ) => {
    return AssistantService.generateBatchWorkoutPlan(
      phases,
      split,
      goal,
      studentLevel,
      availableExercises,
      userContext
    );
  },
};

// Fallback if AI fails or no key (returns empty structure for safety)
const mockFallback = (split: string): AIWorkoutResponse => {
  return {
    explanation:
      'Não foi possível conectar à I.A. um template básico foi gerado (Modo Offline/Fallback).',
    plan: split.split('').map((letter) => ({
      letter,
      focus: 'Geral',
      exercises: [],
    })),
  };
};
