import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Stack, useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

export default function AdminLayout() {
  const router = useRouter();
  const { accountType, isLoading } = useAuthStore();

  // Show loading state
  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-white">Loading...</Text>
      </View>
    );
  }

  // Redirect non-admins
  if (accountType !== 'admin') {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0A0A0A',
        },
        headerTintColor: '#8B5CF6',
        headerTitleStyle: {
          fontWeight: 'bold',
          color: '#FFFFFF',
        },
        headerShadowVisible: false,
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.back()}
            className="ml-2 w-10 h-10 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="#8B5CF6" />
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: '🛡️ Admin Panel',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)' as any)}
              className="ml-2 w-10 h-10 items-center justify-center"
            >
              <Ionicons name="close" size={24} color="#8B5CF6" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="users/index"
        options={{
          title: 'All Users',
        }}
      />
      <Stack.Screen
        name="users/[id]"
        options={{
          title: 'User Details',
        }}
      />
    </Stack>
  );
}
