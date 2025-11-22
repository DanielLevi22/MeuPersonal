import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export default function TabLayout() {
  const { user } = useAuthStore();
  const [userRole, setUserRole] = useState<'personal' | 'student' | null>(null);

  useEffect(() => {
    async function fetchUserRole() {
      if (!user?.id) return;
      
      // Try direct query first
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      console.log('🔍 Query result:', { data, error, userId: user.id });
      
      if (data?.role) {
        console.log('✅ User Role:', data.role);
        setUserRole(data.role as 'personal' | 'student');
      } else {
        // Fallback: check if user is in students_personals table
        const { data: studentLink } = await supabase
          .from('students_personals')
          .select('student_id')
          .eq('student_id', user.id)
          .single();
        
        if (studentLink) {
          console.log('✅ User is student (from students_personals)');
          setUserRole('student');
        } else {
          console.log('✅ User is personal (default)');
          setUserRole('personal');
        }
      }
    }
    
    fetchUserRole();

    // Subscribe to profile changes
    if (user?.id) {
      const channel = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
          },
          (payload) => {
            console.log('🔄 Profile updated:', payload.new);
            const newRole = (payload.new as any).role;
            if (newRole) {
              setUserRole(newRole as 'personal' | 'student');
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const isStudent = userRole === 'student';
  
  console.log('🎯 Tab Layout - Role:', userRole, 'Is Student:', isStudent);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A0E1A',
          borderTopWidth: 1,
          borderTopColor: '#1E2A42',
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
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
      
      {/* Hide unused tabs */}
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
