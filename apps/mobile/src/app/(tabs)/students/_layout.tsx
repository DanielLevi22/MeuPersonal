import { Stack } from 'expo-router';

export default function StudentsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create" />
      <Stack.Screen name="invite" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
