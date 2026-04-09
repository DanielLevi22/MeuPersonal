import { Redirect } from 'expo-router';
import { useAuthStore } from '@/auth';

export default function Index() {
  const { session, isLoading } = useAuthStore();

  if (isLoading) {
    return null;
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
}
