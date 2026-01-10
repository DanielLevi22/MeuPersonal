import { useAuthStore } from '@/auth';
import { ConfettiOverlay } from '@/components/gamification/ConfettiOverlay';
import { ProgressCard } from '@/components/gamification/ProgressCard';
import { StatCard } from '@/components/gamification/StatCard';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { WeeklyProgress } from '@/components/gamification/WeeklyProgress';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { colors as brandColors } from '@/constants/colors';
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
import { Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';


const MUSCLE_IMAGES: Record<string, any> = {
  'Peito': require('../../../assets/workouts/chest.png'),
  'Costas': require('../../../assets/workouts/back.png'),
  'Pernas': require('../../../assets/workouts/legs.png'),
  'Braços': require('../../../assets/workouts/arms.png'),
  'Ombros': require('../../../assets/workouts/shoulders.png'),
  'Abs': require('../../../assets/workouts/abs.png'),
  'Geral': require('../../../assets/workouts/chest.png'),
};

export default function DashboardScreen() {
  const { user, abilities, accountType } = useAuthStore();
  const { dailyGoal, weeklyGoals, streak, achievements, showConfetti, fetchDailyData, isLoading: gamificationLoading } = useGamificationStore();
  const { steps, calories, refetch: refetchHealth, loading: healthLoading } = useHealthData();
  
  // Professional Data Stores
  const { students, fetchStudents, isLoading: studentsLoading } = useStudentStore();
  const { workouts, fetchWorkouts, isLoading: workoutsLoading } = useWorkoutStore();

  const [profile, setProfile] = useState<any>(null);
  const [suggestedWorkout, setSuggestedWorkout] = useState<any>(null);
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
        // Fetch Student Data (Gamification & Health & Workouts)
        const today = getLocalDateISOString();
        await Promise.all([
            fetchDailyData(today),
            fetchWorkouts(user.id),
            refetchHealth()
        ]);
    }
  };

  useEffect(() => {
    if (accountType !== 'professional' && workouts.length > 0) {
      // Logic for suggested workout: pick the first one for now
      setSuggestedWorkout(workouts[0]);
    }
  }, [workouts, accountType]);

  const renderHeaderAvatar = () => (
    <TouchableOpacity 
      onPress={() => router.push('/(tabs)/profile')}
      activeOpacity={0.8}
      className="items-center justify-center p-0.5"
    >
      <View 
        className="w-12 h-12 rounded-full border-2 overflow-hidden items-center justify-center bg-zinc-900 shadow-sm"
        style={{ borderColor: brandColors.border.default }}
      >
        {profile?.avatar_url ? (
          <Image 
            source={{ uri: profile.avatar_url }} 
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center bg-zinc-800">
            <Text className="text-orange-500 font-bold text-lg font-display">
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
        )}
      </View>
      <View 
        className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-zinc-950" 
        style={{ backgroundColor: brandColors.status.success }}
      />
    </TouchableOpacity>
  );

  if (isLoading && !profile && !accountType) {
    return (
      <ScreenLayout className="justify-center items-center">
        <View 
          className="p-5 rounded-full mb-4 border"
          style={{ backgroundColor: brandColors.background.secondary, borderColor: brandColors.border.default }}
        >
          <Ionicons name="barbell" size={48} color={brandColors.primary.start} />
        </View>
        <Text className="text-white text-lg font-bold font-display">Carregando...</Text>
      </ScreenLayout>
    );
  }

  // Personal Trainer Dashboard (Legacy View)
  if (accountType === 'professional' && !useAuthStore.getState().isMasquerading) {
    return (
      <ScreenLayout>
        <ScrollView
             contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
             refreshControl={
               <RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor={brandColors.primary.start} />
             }
        >
          <View className="mb-8 flex-row justify-between items-start">
            <View>
              <Text className="text-zinc-500 text-[13px] font-bold mb-1 uppercase tracking-widest font-sans ml-1">
                Central de Comando
              </Text>
              <Text className="text-4xl font-extrabold text-white mb-2 font-display">
                Dashboard 🔥
              </Text>
            </View>
            {renderHeaderAvatar()}
          </View>

          <View className="gap-y-4">
            {/* Stats Grid */}
            <View className="flex-row gap-4">
              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/students')}
                activeOpacity={0.8}
                className="flex-1"
              >
                <LinearGradient
                  colors={brandColors.gradients.secondary}
                  className="rounded-3xl p-6 h-48 justify-between relative overflow-hidden"
                >
                  <Ionicons name="people" size={80} color="rgba(255,255,255,0.1)" style={{ position: 'absolute', right: -10, bottom: -10 }} />
                  <View className="bg-white/20 self-start p-2 rounded-xl">
                    <Ionicons name="people" size={20} color="white" />
                  </View>
                  <View>
                    <Text className="text-white text-5xl font-black font-display">
                      {students.length}
                    </Text>
                    <Text className="text-white/80 text-[10px] font-bold tracking-widest uppercase font-sans">
                      Alunos Ativos
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/workouts')}
                activeOpacity={0.8}
                className="flex-1"
              >
                <LinearGradient
                  colors={brandColors.gradients.primary}
                  className="rounded-3xl p-6 h-48 justify-between relative overflow-hidden"
                >
                  <Ionicons name="barbell" size={80} color="rgba(255,255,255,0.1)" style={{ position: 'absolute', right: -10, bottom: -10 }} />
                  <View className="bg-white/20 self-start p-2 rounded-xl">
                    <Ionicons name="barbell" size={20} color="white" />
                  </View>
                  <View>
                    <Text className="text-white text-5xl font-black font-display">
                      {workouts.length}
                    </Text>
                    <Text className="text-white/80 text-[10px] font-bold tracking-widest uppercase font-sans">
                      Modelos de Treino
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Quick Action - Glass Style */}
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/students/create')}
              activeOpacity={0.8}
              className="mt-2"
            >
              <View 
                className="rounded-3xl p-6 flex-row items-center justify-center border-2 border-dashed"
                style={{ backgroundColor: brandColors.background.secondary, borderColor: brandColors.border.default }}
              >
                <View className="bg-orange-500/10 p-3 rounded-full mr-4 border border-orange-500/20">
                  <Ionicons name="add-circle" size={24} color={brandColors.primary.start} />
                </View>
                <Text className="text-white text-lg font-bold font-display">
                   Novo Aluno
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
          <RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor={brandColors.primary.start} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.delay(100).springify()}
          className="flex-row justify-between items-start mb-8 mt-2"
        >
          <View className="flex-1">
            <Text className="text-zinc-400 text-[15px] font-medium mb-1 font-sans tracking-wide uppercase">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            <Text className="text-white text-[34px] font-bold font-display tracking-tight leading-tight">
              Olá, {profile?.full_name?.split(' ')[0] || 'Aluno'}
            </Text>
          </View>
          
          <View className="flex-row items-center gap-4">
             <View className="items-end gap-1.5">
                {streak?.freeze_available && streak.freeze_available > 0 && (
                  <View className="bg-blue-500/20 px-2 py-0.5 rounded-full">
                    <Ionicons name="snow" size={10} color="#3B82F6" />
                  </View>
                )}
                <StreakCounter 
                  streak={streak?.current_streak || 0} 
                  frozen={streak?.last_freeze_date === new Date().toISOString().split('T')[0]} 
                />
             </View>

             {renderHeaderAvatar()}
          </View>
        </Animated.View>

        {/* Daily Progress Section */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className="mb-8">
          <Text className="text-zinc-500 text-[13px] font-bold mb-3 font-sans uppercase tracking-widest ml-1">
            Minha Jornada
          </Text>
          
          {/* Workout of the Day (Bento Lead) */}
          {suggestedWorkout && (
             <PremiumCard
                title={suggestedWorkout.title}
                subtitle={`${suggestedWorkout.muscle_group || 'Geral'} • Meta de Hoje`}
                image={MUSCLE_IMAGES[suggestedWorkout.muscle_group] || MUSCLE_IMAGES['Geral']}
                onPress={() => router.push(`/(tabs)/workouts/${suggestedWorkout.id}` as any)}
                containerStyle={{ marginBottom: 16 }}
                badge={
                  <View className="bg-orange-500/20 px-3 py-1 rounded-full border border-orange-500/20">
                    <Text className="text-orange-500 text-[10px] font-black uppercase tracking-widest">TREINO DO DIA</Text>
                  </View>
                }
             >
                <View className="flex-row items-center mt-4 bg-black/40 self-start px-3 py-2 rounded-xl border border-white/5">
                   <Ionicons name="time-outline" size={14} color={brandColors.secondary.main} style={{ marginRight: 6 }} />
                   <Text className="text-white/90 text-[10px] font-bold uppercase tracking-widest">
                      {suggestedWorkout.duration_minutes || 60} MIN
                   </Text>
                   <View className="w-[1px] h-3 bg-white/20 mx-3" />
                   <Ionicons name="play" size={12} color={brandColors.primary.start} style={{ marginRight: 6 }} />
                   <Text className="text-white/90 text-[10px] font-bold uppercase tracking-widest">Começar</Text>
                </View>
             </PremiumCard>
          )}

          <View className="gap-y-3">
            <ProgressCard
              title="Dieta & Macronutrientes"
              current={dailyGoal?.meals_completed || 0}
              target={dailyGoal?.meals_target || 4}
              icon="restaurant"
              color="success"
              unit="ref."
            />
            <ProgressCard
              title="Meta de Treino"
              current={dailyGoal?.workout_completed || 0}
              target={dailyGoal?.workout_target || 1}
              icon="barbell"
              color="warning"
              unit="treino"
            />
          </View>
        </Animated.View>

        {/* Weekly Consistency */}
        <Animated.View entering={FadeInDown.delay(250).springify()} className="mb-8">
           <WeeklyProgress weeklyGoals={weeklyGoals} />
        </Animated.View>

        {/* Health Data (Bento Activity) */}
        <Animated.View entering={FadeInDown.delay(300).springify()} className="mb-8">
          <View className="flex-row justify-between items-center mb-4 ml-1">
            <Text className="text-zinc-500 text-[13px] font-bold font-sans uppercase tracking-widest">
              Atividade & Saúde
            </Text>
            {steps > 0 && (
              <View className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/10">
                <Text className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                  Live
                </Text>
              </View>
            )}
          </View>
          
          <View className="flex-row gap-x-4">
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
