import { useAuthStore } from '@/auth';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { accountType, abilities } = useAuthStore();
  const insets = useSafeAreaInsets();

  // If accountType is null (loading), default to student to avoid flashing restricted tabs
  const isStudent = !accountType || accountType === 'managed_student' || accountType === 'autonomous_student';
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A0E1A', // bg-background
          borderTopWidth: 1,
          borderTopColor: '#1E2A42', // border-border
          height: Platform.OS === 'ios' ? 85 : 65 + insets.bottom,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10 + insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#CCFF00', // text-primary (Neon Lime)
        tabBarInactiveTintColor: '#5A6178', // text-muted-foreground
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          fontFamily: 'Orbitron_600SemiBold', // Use custom font if available, else default
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
          href: (isStudent || abilities?.can('manage', 'Workout')) ? '/workouts' : null,
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
        name="progress"
        options={{
          title: 'Progresso',
          href: isStudent ? '/progress' : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'stats-chart' : 'stats-chart-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      <Tabs.Screen
        name="ranking"
        options={{
          title: 'Ranking',
          href: isStudent ? '/ranking' : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'trophy' : 'trophy-outline'} 
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
          href: (accountType === 'professional' && abilities?.can('manage', 'Workout')) ? '/students' : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'people' : 'people-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      
      {/* Nutritionist only */}
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrição',
          href: (accountType === 'professional' && abilities?.can('manage', 'Diet')) ? '/nutrition' : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'restaurant' : 'restaurant-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />


    </Tabs>
  );
}
