import { AdminMenuButton } from '@/components/admin/AdminMenuButton';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { accountType } = useAuthStore();
  const insets = useSafeAreaInsets();

  // If accountType is null (loading), default to student to avoid flashing restricted tabs
  const isStudent = !accountType || accountType === 'managed_student' || accountType === 'autonomous_student';
  
  // Debug log
  console.log('📱 TabLayout - accountType:', accountType);
  
  return (
    <>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A0E1A',
          borderTopWidth: 1,
          borderTopColor: '#1E2A42',
          height: Platform.OS === 'ios' ? 85 : 65 + insets.bottom,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10 + insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#00D9FF',
        tabBarInactiveTintColor: '#5A6178',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Treinos',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'barbell' : 'barbell-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'person' : 'person-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      
      {/* Personal Trainer only */}
      <Tabs.Screen
        name="students"
        options={{
          title: 'Alunos',
          tabBarButton: isStudent ? () => null : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'people' : 'people-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      
      {/* Personal Trainer only - Nutrition */}
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrição',
          tabBarButton: isStudent ? () => null : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'restaurant' : 'restaurant-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      {/* Hide unused tabs */}
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
    
    {/* Admin floating button */}
    <AdminMenuButton />
    </>
  );
}
