// Workout Module Types
// Centralized TypeScript interfaces for type safety and better developer experience

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string | null;
  description: string | null;
  video_url: string | null;
}

export interface WorkoutItem {
  id: string;
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
  items?: WorkoutItem[];
  training_plan_id?: string;
  muscle_group?: string | null;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  personal_id?: string;
  created_at?: string;
  updated_at?: string;
  duration_minutes?: number;
  exercises_count?: number;
}

export interface SessionItem {
  id?: string;
  workout_item_id: string;
  sets_completed: number;
  weight?: number;
  reps?: number;
  // Edited parameters from the session
  editedSets?: number;
  editedReps?: number;
  editedWeight?: number;
  editedRestTime?: number;
}

export interface WorkoutSession {
  id: string;
  workout_id: string;
  student_id: string;
  started_at: string;
  completed_at: string;
  items: SessionItem[];
  intensity?: number;
  notes?: string;
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
  [itemId: string]: WorkoutItem;
}

export interface ProgressionSummaryItem {
  exerciseName: string;
  improvements: string[];
  decreases: string[];
  maintained: string[];
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
    workoutItemId: string;
    setsCompleted: number;
    editedSets?: number;
    editedReps?: number;
    editedWeight?: number;
    editedRestTime?: number;
  }[];
  intensity: number;
  notes: string;
}
