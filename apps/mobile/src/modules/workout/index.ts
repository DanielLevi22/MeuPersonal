// Workout Module - Public API
// This module handles workout creation, execution, and tracking

// Stores
export { useWorkoutLogStore } from './store/workoutLogStore';
export { useWorkoutStore } from './store/workoutStore';

// Hooks
export { useWorkoutTimer } from './hooks/useWorkoutTimer';

// Components
export { ExerciseConfigModal } from './components/ExerciseConfigModal';
export { RestTimer } from './components/RestTimer';
export { StudentAssignmentModal } from './components/StudentAssignmentModal';

// Types (re-export from stores for now)
export type { ExerciseLog, WorkoutSession } from './store/workoutLogStore';
export type { Exercise, SelectedExercise, Workout, WorkoutItem } from './store/workoutStore';

