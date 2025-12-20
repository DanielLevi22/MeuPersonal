import { useAuthStore } from '@/auth';
import { Redirect } from 'expo-router';

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
