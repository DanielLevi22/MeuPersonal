import { useAuthStore } from '@/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
          backgroundColor: '#09090B', // Deep Black
          borderTopWidth: 1,
          borderTopColor: '#27272A',
          height: Platform.OS === 'ios' ? 88 : 68 + insets.bottom,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8 + insets.bottom,
          paddingTop: 8,
          elevation: 0, // Android shadow removal
        },
        tabBarActiveTintColor: '#FF6B35', 
        tabBarInactiveTintColor: '#A1A1AA', // Zinc-400
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? 'home-variant' : 'home-variant-outline'} 
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
            <MaterialCommunityIcons 
              name={focused ? 'dumbbell' : 'dumbbell'} 
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
            <MaterialCommunityIcons 
              name={focused ? 'food-apple' : 'food-apple-outline'} 
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
            <MaterialCommunityIcons 
              name={focused ? 'chart-timeline-variant' : 'chart-timeline-variant'} 
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
            <MaterialCommunityIcons 
              name={focused ? 'dots-grid' : 'dots-grid'} 
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
            <MaterialCommunityIcons 
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
            <MaterialCommunityIcons 
              name={focused ? 'account-group' : 'account-group-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

    </Tabs>
  );
}
