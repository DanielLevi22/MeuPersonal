import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/auth';
import { ExecuteWorkoutScreen, WorkoutDetailsScreen } from '@/workout';

export default function WorkoutDetailsRoute() {
  const { mode } = useLocalSearchParams();
  const { accountType } = useAuthStore();

  const isExecuteMode = mode === 'execute' && accountType === 'member';
  if (isExecuteMode) {
    return <ExecuteWorkoutScreen />;
  }

  return <WorkoutDetailsScreen />;
}
