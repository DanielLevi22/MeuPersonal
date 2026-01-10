import { useAuthStore } from '@/auth';
import { TabBar } from '@/components/navigation/TabBar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { accountType, abilities, isMasquerading } = useAuthStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // LOG DEBUG
  // console.log('Tabs Layout Render:', { accountType, isMasquerading, hasAbilities: !!abilities });


  // If accountType is null (loading), default to student to avoid flashing restricted tabs. 
  // explicitly include isMasquerading to ensure tabs show immediately
  const isStudent = !accountType || accountType === 'managed_student' || accountType === 'autonomous_student' || isMasquerading;
  
  return (
    <>
    <Tabs
      tabBar={props => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // We handle styling in the custom component
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Treino',
          href: (isStudent || abilities?.can('manage', 'Workout')) ? '/workouts' : null,
        }}
      />

      {/* Central Button usually, or just 3rd item */}
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrição',
          href: (isStudent || (accountType === 'professional' && abilities?.can('manage', 'Diet'))) ? '/nutrition' : null,
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progresso',
          href: isStudent ? '/progress' : null,
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          href: '/profile', // Always visible
        }}
      />

      {/* Previously Visible Tabs now Hidden from bar but accessible if needed (or we remove them) */}
       <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          href: null, // Hide from tab bar, accessed via other means if needed
        }}
      />

      {/* Hidden Screens */}
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
        name="cardio/index"
        options={{
          title: 'Cardio',
          href: null, // Hide from main tabs, maybe access from Home
        }}
      />
      
      {/* Personal Trainer only */}
      <Tabs.Screen
        name="students"
        options={{
          title: 'Alunos',
          href: (accountType === 'professional' && abilities?.can('manage', 'Workout')) ? '/students' : null,
        }}
      />

      </Tabs>

      {/* Masquerade Mode Overlay - Floating Exit Button */}
      {isStudent && isMasquerading && (
        <View style={{ 
          position: 'absolute', 
          bottom: 120, // Increased bottom margin to clear the floating tab bar
          right: 20, 
          zIndex: 999 
        }}>
          <TouchableOpacity
            onPress={() => {
              useAuthStore.getState().exitStudentView();
              router.push('/(tabs)/students');
            }}
            style={{
              backgroundColor: '#FF4444',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 30,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 4.65,
              elevation: 8,
            }}
          >
            <MaterialCommunityIcons name="eye-off" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Sair da Visão do Aluno</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}
