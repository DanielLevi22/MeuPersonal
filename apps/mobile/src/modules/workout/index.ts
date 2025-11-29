export { useWorkoutTimer } from './hooks/useWorkoutTimer';

// Components
export { ExerciseConfigModal } from './components/ExerciseConfigModal';
export { RestTimer } from './components/RestTimer';
export { StudentAssignmentModal } from './components/StudentAssignmentModal';

// Screens
export { default as CreatePeriodizationScreen } from './screens/CreatePeriodizationScreen';
export { default as CreateTrainingPlanScreen } from './screens/CreateTrainingPlanScreen';
export { default as PeriodizationDetailsScreen } from './screens/PeriodizationDetailsScreen';
export { default as PeriodizationsScreen } from './screens/PeriodizationsScreen';
export { default as SelectExercisesScreen } from './screens/SelectExercisesScreen';
export { default as WorkoutDetailsScreen } from './screens/WorkoutDetailsScreen';

// Types (re-export from stores for now)
export { useWorkoutLogStore } from './store/workoutLogStore';
export type { ExerciseLog, WorkoutSession } from './store/workoutLogStore';
export { useWorkoutStore } from './store/workoutStore';
export type { Exercise, SelectedExercise, Workout, WorkoutItem } from './store/workoutStore';

export * from './routes';

