import { Stack } from 'expo-router';

export function StudentsNavigator() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create" />
      <Stack.Screen name="invite" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
