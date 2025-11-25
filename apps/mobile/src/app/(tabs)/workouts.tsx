import { Card } from '@/components/ui/Card';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { useAuthStore } from '@/auth';
import { useWorkoutStore } from '@/workout';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@meupersonal/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';

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

    if (userRole === 'student') {
      // Fetch assigned workouts for students
      setLoadingStudentWorkouts(true);
      try {
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

        if (!error && data) {
          const workoutsData = data
            .map((item: any) => item.workout)
            .filter(Boolean);
          setStudentWorkouts(workoutsData);
        }
      } catch (error) {
        console.error('Exception fetching student workouts:', error);
      } finally {
        setLoadingStudentWorkouts(false);
      }
    } else {
      // Fetch created workouts for personal trainers
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
      <Link href={targetRoute as any} asChild>
        <TouchableOpacity activeOpacity={0.8} className="mb-3">
          <Card className="p-5 border-2 border-border">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-foreground text-xl font-bold flex-1 font-display">
                {item.title}
              </Text>
              <View className="bg-primary/10 p-2 rounded-xl">
                <Ionicons name="chevron-forward" size={20} color="#CCFF00" />
              </View>
            </View>
            
            {item.description && (
              <Text className="text-muted-foreground text-sm mb-3 font-sans" numberOfLines={2}>
                {item.description}
              </Text>
            )}
            
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={16} color="#71717A" />
              <Text className="text-muted-foreground text-xs ml-2 font-sans">
                Criado em {new Date(item.created_at).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          </Card>
        </TouchableOpacity>
      </Link>
    );
  };

  return (
    <ScreenLayout>
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pt-4 pb-6">
        <View>
          <Text className="text-4xl font-bold text-foreground mb-1 font-display">
            Meus Treinos
          </Text>
          <Text className="text-base text-muted-foreground font-sans">
            {displayWorkouts.length} {displayWorkouts.length === 1 ? 'treino' : 'treinos'}
          </Text>
        </View>
        
        {userRole === 'personal' && (
          <Link href={'/workouts/create' as any} asChild>
            <TouchableOpacity activeOpacity={0.8}>
              <LinearGradient
                colors={['#CCFF00', '#99CC00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="h-14 w-14 rounded-full items-center justify-center shadow-lg shadow-primary/30"
              >
                <Ionicons name="add" size={28} color="#000000" />
              </LinearGradient>
            </TouchableOpacity>
          </Link>
        )}
      </View>

      {/* Content */}
      {displayWorkouts.length === 0 && !loading ? (
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-surface p-8 rounded-full mb-6 border border-border">
            <Ionicons name="barbell-outline" size={80} color="#71717A" />
          </View>
          <Text className="text-foreground text-2xl font-bold mb-2 text-center font-display">
            {userRole === 'student' ? 'Nenhum treino atribuído' : 'Nenhum treino criado'}
          </Text>
          <Text className="text-muted-foreground text-center px-8 text-base mb-8 font-sans">
            {userRole === 'student' 
              ? 'Seu personal ainda não atribuiu treinos para você' 
              : 'Crie seu primeiro treino personalizado'}
          </Text>
          
          {userRole === 'personal' && (
            <Link href={'/workouts/create' as any} asChild>
              <TouchableOpacity activeOpacity={0.8}>
                <LinearGradient
                  colors={['#CCFF00', '#99CC00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="rounded-2xl py-4 px-8 shadow-lg shadow-primary/30"
                >
                  <Text className="text-black text-base font-bold font-display">
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
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl 
              refreshing={loading} 
              onRefresh={fetchWorkoutsData} 
              tintColor="#CCFF00" 
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenLayout>
  );
}
