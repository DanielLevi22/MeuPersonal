import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/components/useColorScheme';
import { queryClient } from '@/lib/query-client';
import { registerBackgroundFetchAsync } from '@/services/backgroundTask';
import { requestNotificationPermissions } from '@/services/notificationService';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@meupersonal/supabase';

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { session, initializeSession, isLoading, accountType } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Auth State Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      initializeSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      initializeSession(session);
    });

    // Request notification permissions
    requestNotificationPermissions();
    
    // Register background fetch for diet sync
    registerBackgroundFetchAsync();
  }, []);

  // Auth Guard
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!session && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login' as any);
    } else if (session && inAuthGroup) {
      // Redirect based on role
      if (accountType === 'professional') {
        router.replace('/(professional)' as any);
      } else {
        router.replace('/(tabs)' as any);
      }
    }
  }, [session, segments, isLoading, accountType]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(professional)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="onboarding/role-selection" />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
