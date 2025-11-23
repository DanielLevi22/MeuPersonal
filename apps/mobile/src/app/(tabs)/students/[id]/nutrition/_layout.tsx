import { Stack } from 'expo-router';

export default function NutritionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="today" />
      <Stack.Screen name="hoje" />
      <Stack.Screen name="full-diet" />
      <Stack.Screen name="dieta-completa" />
      <Stack.Screen name="progress" />
      <Stack.Screen name="progresso" />
      <Stack.Screen name="history" />
      <Stack.Screen name="historico" />
    </Stack>
  );
}
