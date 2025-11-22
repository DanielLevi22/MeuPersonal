import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WorkoutsScreen() {
  const { workouts, isLoading, fetchWorkouts } = useWorkoutStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [studentWorkouts, setStudentWorkouts] = useState<any[]>([]);
  const [loadingStudentWorkouts, setLoadingStudentWorkouts] = useState(false);

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!error && data) {
        setUserRole(data.role);
      }
    };

    fetchUserRole();
  }, [user]);

  // Fetch workouts based on role
  const fetchWorkoutsData = useCallback(async () => {
    if (!user?.id || !userRole) return;

    console.log('🔍 Fetching workouts for role:', userRole, 'user:', user.id);

    if (userRole === 'student') {
      // Fetch assigned workouts for students
      setLoadingStudentWorkouts(true);
      try {
        console.log('📚 Fetching student workouts from workout_assignments...');
        const { data, error } = await supabase
          .from('workout_assignments')
          .select(`
            workout:workouts (
              id,
              title,
              description,
              created_at
            )
          `)
          .eq('student_id', user.id);

        console.log('📊 Student workouts query result:', { data, error });

        if (error) {
          console.error('❌ Error fetching student workouts:', error);
        }

        if (!error && data) {
          const workoutsData = data
            .map((item: any) => item.workout)
            .filter(Boolean);
          console.log('✅ Processed student workouts:', workoutsData.length, 'workouts');
          setStudentWorkouts(workoutsData);
        }
      } catch (error) {
        console.error('💥 Exception fetching student workouts:', error);
      } finally {
        setLoadingStudentWorkouts(false);
      }
    } else {
      // Fetch created workouts for personal trainers
      console.log('👨‍⚕️ Fetching personal trainer workouts...');
      fetchWorkouts(user.id);
    }
  }, [user, userRole]);

  useEffect(() => {
    fetchWorkoutsData();
  }, [fetchWorkoutsData]);

  useFocusEffect(
    useCallback(() => {
      fetchWorkoutsData();
    }, [fetchWorkoutsData])
  );

  const displayWorkouts = userRole === 'student' ? studentWorkouts : workouts;
  const loading = userRole === 'student' ? loadingStudentWorkouts : isLoading;

  const renderItem = ({ item }: { item: any }) => {
    const targetRoute = userRole === 'student' 
      ? `/student/workout-execute/${item.id}`
      : `/workouts/${item.id}`;

    return (
      <TouchableOpacity 
        onPress={() => router.push(targetRoute as any)}
        activeOpacity={0.8}
        style={{
          backgroundColor: '#141B2D',
          borderRadius: 16,
          padding: 20,
          marginBottom: 12,
          borderWidth: 2,
          borderColor: '#1E2A42'
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', flex: 1 }}>
            {item.title}
          </Text>
          <View style={{
            backgroundColor: 'rgba(255, 107, 53, 0.15)',
            padding: 8,
            borderRadius: 12
          }}>
            <Ionicons name="chevron-forward" size={20} color="#FF6B35" />
          </View>
        </View>
        
        {item.description && (
          <Text style={{ color: '#8B92A8', fontSize: 14, marginBottom: 12 }} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="calendar-outline" size={16} color="#5A6178" />
          <Text style={{ color: '#5A6178', fontSize: 12, marginLeft: 6 }}>
            Criado em {new Date(item.created_at).toLocaleDateString('pt-BR')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 24
        }}>
          <View>
            <Text style={{ fontSize: 36, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 }}>
              Meus Treinos
            </Text>
            <Text style={{ fontSize: 16, color: '#8B92A8' }}>
              {displayWorkouts.length} {displayWorkouts.length === 1 ? 'treino' : 'treinos'}
            </Text>
          </View>
          
          {userRole === 'personal' && (
            <Link href={'/workouts/create' as any} asChild>
              <TouchableOpacity activeOpacity={0.8}>
                <LinearGradient
                  colors={['#00FF88', '#00CC6E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    height: 56,
                    width: 56,
                    borderRadius: 28,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Ionicons name="add" size={28} color="#0A0E1A" />
                </LinearGradient>
              </TouchableOpacity>
            </Link>
          )}
        </View>

        {/* Content */}
        {displayWorkouts.length === 0 && !loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
            <View style={{
              backgroundColor: '#141B2D',
              padding: 32,
              borderRadius: 50,
              marginBottom: 24
            }}>
              <Ionicons name="barbell-outline" size={80} color="#5A6178" />
            </View>
            <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginBottom: 8 }}>
              {userRole === 'student' ? 'Nenhum treino atribuído' : 'Nenhum treino criado'}
            </Text>
            <Text style={{ color: '#8B92A8', textAlign: 'center', paddingHorizontal: 32, fontSize: 15, marginBottom: 32 }}>
              {userRole === 'student' 
                ? 'Seu personal ainda não atribuiu treinos para você' 
                : 'Crie seu primeiro treino personalizado'}
            </Text>
            
            {userRole === 'personal' && (
              <Link href={'/workouts/create' as any} asChild>
                <TouchableOpacity activeOpacity={0.8}>
                  <LinearGradient
                    colors={['#00FF88', '#00CC6E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 16,
                      paddingVertical: 16,
                      paddingHorizontal: 32
                    }}
                  >
                    <Text style={{ color: '#0A0E1A', fontSize: 16, fontWeight: '700' }}>
                      Criar Treino
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Link>
            )}
          </View>
        ) : (
          <FlatList
            data={displayWorkouts}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24 }}
            refreshControl={
              <RefreshControl 
                refreshing={loading} 
                onRefresh={fetchWorkoutsData} 
                tintColor="#00FF88" 
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
