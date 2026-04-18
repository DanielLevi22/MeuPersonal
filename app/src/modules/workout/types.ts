// Alias for backward-compatibility within app module
export type {
  DayOfWeek,
  Exercise,
  Periodization,
  TrainingPlan,
  TrainingStatus,
  Workout,
  WorkoutDifficulty,
  WorkoutExercise,
  WorkoutExercise as WorkoutItem,
  WorkoutSession,
  WorkoutSessionExercise,
} from '@meupersonal/shared';

export interface SessionItem {
  id?: string;
  workout_exercise_id: string;
  sets_data: {
    sets: number;
    reps: number;
    weight?: number;
    rest_seconds?: number;
  }[];
  editedSets?: number;
  editedReps?: number;
  editedWeight?: number;
  editedRestSeconds?: number;
}

export type ProgressionType = 'improved' | 'decreased' | 'maintained';

export interface ProgressionMetric {
  type: ProgressionType;
  diff: string;
  previous: number;
  current: number;
}

export interface ProgressionAnalysis {
  weight?: ProgressionMetric;
  sets?: ProgressionMetric;
  reps?: ProgressionMetric;
}

export interface EditedWorkoutItems {
  [itemId: string]: import('@meupersonal/shared').WorkoutExercise;
}

export interface ShareStats {
  title: string;
  duration: string;
  calories: string;
  date: string;
  exerciseName: string;
}

export interface SaveSessionParams {
  workoutId: string;
  studentId: string;
  startedAt: string;
  completedAt: string;
  items: {
    workoutExerciseId: string;
    setsData: unknown[];
  }[];
  intensity: number;
  notes: string;
}
