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
          backgroundColor: '#0A0A0A', // bg-background (Deep Black)
          borderTopWidth: 1,
          borderTopColor: '#27272A', // border-dark
          height: Platform.OS === 'ios' ? 85 : 65 + insets.bottom,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10 + insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#FF6B35', // text-primary (Vibrant Orange)
        tabBarInactiveTintColor: '#71717A', // text-muted
        tabBarItemStyle: {
          padding: 0,
        },
        tabBarLabelStyle: {
          fontSize: 9,
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
          title: 'Treino',
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
        name="nutrition"
        options={{
          title: 'Nutrição',
          href: (isStudent || (accountType === 'professional' && abilities?.can('manage', 'Diet'))) ? '/nutrition' : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'restaurant' : 'restaurant-outline'} 
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
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'grid' : 'grid-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      
      {/* Hidden Tabs (Accessible via Menu or sub-navigation) */}
      <Tabs.Screen
        name="chat"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="ranking"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="cardio/index"
        options={{
          title: 'Cardio',
          href: isStudent ? '/cardio' : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'heart' : 'heart-outline'} 
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

    </Tabs>
  );
}
