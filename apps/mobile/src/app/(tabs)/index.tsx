import { useAuthStore } from '@/auth';
import { ConfettiOverlay } from '@/components/gamification/ConfettiOverlay';
import { ProgressCard } from '@/components/gamification/ProgressCard';
import { StatCard } from '@/components/gamification/StatCard';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { WeeklyProgress } from '@/components/gamification/WeeklyProgress';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { useHealthData } from '@/hooks/useHealthData';
import { useStudentStore } from '@/modules/students/store/studentStore';
import { useWorkoutStore } from '@/modules/workout/store/workoutStore';
import { useGamificationStore } from '@/store/gamificationStore';
import { getLocalDateISOString } from '@/utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@meupersonal/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';


export default function DashboardScreen() {
  const { user, abilities, accountType } = useAuthStore();
  const { dailyGoal, weeklyGoals, streak, achievements, showConfetti, fetchDailyData, isLoading: gamificationLoading } = useGamificationStore();
  const { steps, calories, refetch: refetchHealth, loading: healthLoading } = useHealthData();
  
  // Professional Data Stores
  const { students, fetchStudents, isLoading: studentsLoading } = useStudentStore();
  const { workouts, fetchWorkouts, isLoading: workoutsLoading } = useWorkoutStore();

  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  const isLoading = gamificationLoading || studentsLoading || workoutsLoading;

  useEffect(() => {
    loadData();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user])
  );

  const loadData = async () => {
    if (!user?.id) return;
    
    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    setProfile(profileData);

    if (accountType === 'professional') {
        // Fetch Professional Data
        await Promise.all([
            fetchStudents(user.id),
            fetchWorkouts(user.id)
        ]);
    } else {
        // Fetch Student Data (Gamification & Health)
        const today = getLocalDateISOString();
        await fetchDailyData(today);
        refetchHealth();
    }
  };

  if (isLoading && !profile && !accountType) {
    return (
      <ScreenLayout className="justify-center items-center">
        <View className="bg-zinc-900 p-5 rounded-full mb-4 border border-zinc-800">
          <Ionicons name="barbell" size={48} color="#FF6B35" />
        </View>
        <Text className="text-white text-lg font-semibold font-display">Carregando...</Text>
      </ScreenLayout>
    );
  }

  // Personal Trainer Dashboard (Legacy View)
  if (accountType === 'professional') {
    return (
      <ScreenLayout>
        <ScrollView
             contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
             refreshControl={
               <RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor="#FF6B35" />
             }
        >
          <View className="mb-8">
            <Text className="text-4xl font-extrabold text-white mb-2 font-display">
              Dashboard 🔥
            </Text>
            <Text className="text-base text-zinc-400 font-sans">
              Gerencie seus alunos e treinos
            </Text>
          </View>

          <View>
            {/* Stats Card - Students */}
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/students')}
              activeOpacity={0.8}
              className="mb-4"
            >
              <LinearGradient
                colors={['#00D9FF', '#00B8D9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-2xl p-6 shadow-lg shadow-cyan-500/20"
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-white/80 text-xs font-bold tracking-widest mb-2 font-sans">
                      ALUNOS ATIVOS
                    </Text>
                    <Text className="text-white text-5xl font-bold font-display">
                      {students.length}
                    </Text>
                  </View>
                  <View className="bg-white/20 p-4 rounded-2xl">
                    <Ionicons name="people" size={40} color="white" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Stats Card - Workouts */}
            {abilities?.can('manage', 'Workout') && (
              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/workouts')}
                activeOpacity={0.8}
                className="mb-6"
              >
                <LinearGradient
                  colors={['#FF6B35', '#FF2E63']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="rounded-2xl p-6 shadow-lg shadow-orange-500/20"
                >
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-white/80 text-xs font-bold tracking-widest mb-2 font-sans">
                        TREINOS CRIADOS
                      </Text>
                      <Text className="text-white text-5xl font-bold font-display">
                        {workouts.length}
                      </Text>
                    </View>
                    <View className="bg-white/20 p-4 rounded-2xl">
                      <Ionicons name="barbell" size={40} color="white" />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Quick Action */}
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/students/create')}
              activeOpacity={0.8}
            >
              <View className="bg-zinc-900 border-2 border-orange-500 rounded-2xl p-5 flex-row items-center justify-center">
                <Ionicons name="add-circle" size={28} color="#FF6B35" />
                <Text className="text-orange-500 text-lg font-bold ml-3 font-display">
                  Adicionar Novo Aluno
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenLayout>
    );
  }

  // Student Dashboard (Gamified)
  return (
    <ScreenLayout>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor="#FF6B35" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.delay(100).springify()}
          className="flex-row justify-between items-end mb-8 mt-2"
        >
          <View>
            <Text className="text-zinc-400 text-[15px] font-medium mb-1 font-sans tracking-wide uppercase">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            <Text className="text-white text-[34px] font-bold font-display tracking-tight leading-tight">
              Olá, {profile?.full_name?.split(' ')[0] || 'Aluno'}
            </Text>
          </View>
          <View className="mb-1 flex-row items-center gap-2">
            {streak?.freeze_available && streak.freeze_available > 0 && (
              <View className="bg-blue-500/20 px-2 py-1 rounded-full">
                <Ionicons name="snow" size={12} color="#3B82F6" />
              </View>
            )}
            <StreakCounter 
              streak={streak?.current_streak || 0} 
              frozen={streak?.last_freeze_date === new Date().toISOString().split('T')[0]} 
            />
          </View>
        </Animated.View>

        {/* Daily Progress Section */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className="mb-8">
          <Text className="text-zinc-500 text-[13px] font-bold mb-3 font-sans uppercase tracking-widest ml-1">
            Hoje
          </Text>
          <View className="gap-y-3">
            <ProgressCard
              title="Dieta"
              current={dailyGoal?.meals_completed || 0}
              target={dailyGoal?.meals_target || 4}
              icon="restaurant"
              color="success"
              unit="ref."
            />
            <ProgressCard
              title="Treino"
              current={dailyGoal?.workout_completed || 0}
              target={dailyGoal?.workout_target || 1}
              icon="barbell"
              color="warning"
              unit="treino"
            />
          </View>
        </Animated.View>

        {/* Weekly Consistency */}
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <WeeklyProgress weeklyGoals={weeklyGoals} />
        </Animated.View>

        {/* Health Data Section */}
        <Animated.View entering={FadeInDown.delay(300).springify()} className="mb-8">
          <View className="flex-row justify-between items-center mb-3 ml-1">
            <Text className="text-zinc-500 text-[13px] font-bold font-sans uppercase tracking-widest">
              Atividade
            </Text>
            {steps > 0 && (
              <View className="bg-zinc-800/50 px-2.5 py-1 rounded-full">
                <Text className="text-zinc-400 text-[10px] font-bold font-sans uppercase tracking-wider">
                  Sincronizado
                </Text>
              </View>
            )}
          </View>
          <View className="flex-row gap-x-3">
            <View className="flex-1">
              <StatCard
                label="Passos"
                value={steps.toLocaleString()}
                trend={steps >= 10000 ? 'up' : 'neutral'}
                change={steps >= 10000 ? 'Meta!' : `${Math.round((steps / 10000) * 100)}%`}
                icon="walk"
              />
            </View>
            <View className="flex-1">
              <StatCard
                label="Calorias"
                value={`${calories}`}
                trend="up"
                change="Kcal"
                icon="flame"
              />
            </View>
          </View>
        </Animated.View>




      </ScrollView>
      
      {/* Confetti Overlay */}
      <ConfettiOverlay show={showConfetti} />
    </ScreenLayout>
  );
}
