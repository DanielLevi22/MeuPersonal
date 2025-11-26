import { useAuthStore } from '@/auth';
import { AchievementBadge } from '@/components/gamification/AchievementBadge';
import { ConfettiOverlay } from '@/components/gamification/ConfettiOverlay';
import { ProgressCard } from '@/components/gamification/ProgressCard';
import { StatCard } from '@/components/gamification/StatCard';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { useHealthData } from '@/hooks/useHealthData';
import { useGamificationStore } from '@/store/gamificationStore';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@meupersonal/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function DashboardScreen() {
  const { user, abilities } = useAuthStore();
  const { dailyGoal, weeklyGoals, streak, achievements, showConfetti, fetchDailyData, isLoading } = useGamificationStore();
  const { steps, calories, refetch: refetchHealth, loading: healthLoading } = useHealthData();
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

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

    // Fetch gamification data
    const today = new Date().toISOString().split('T')[0];
    await fetchDailyData(today);
    refetchHealth();
  };

  if (isLoading && !profile) {
    return (
      <ScreenLayout className="justify-center items-center">
        <View className="bg-primary/10 p-5 rounded-full mb-4 border border-primary/20">
          <Ionicons name="barbell" size={48} color="#CCFF00" />
        </View>
        <Text className="text-foreground text-lg font-semibold font-display">Carregando...</Text>
      </ScreenLayout>
    );
  }

  // Personal Trainer Dashboard (Legacy View)
  if (profile?.account_type === 'professional') {
    return (
      <ScreenLayout>
        <View className="p-6">
          <View className="mb-8">
            <Text className="text-4xl font-bold text-foreground mb-2 font-display">
              Dashboard 🔥
            </Text>
            <Text className="text-base text-muted-foreground font-sans">
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
                className="rounded-2xl p-6 shadow-lg shadow-secondary/30"
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-white/80 text-xs font-bold tracking-widest mb-2 font-sans">
                      ALUNOS ATIVOS
                    </Text>
                    <Text className="text-white text-5xl font-bold font-display">
                      0
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
                  colors={['#CCFF00', '#99CC00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="rounded-2xl p-6 shadow-lg shadow-primary/30"
                >
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-black/60 text-xs font-bold tracking-widest mb-2 font-sans">
                        TREINOS CRIADOS
                      </Text>
                      <Text className="text-black text-5xl font-bold font-display">
                        0
                      </Text>
                    </View>
                    <View className="bg-black/10 p-4 rounded-2xl">
                      <Ionicons name="barbell" size={40} color="#000000" />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Quick Action */}
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/students')}
              activeOpacity={0.8}
            >
              <View className="bg-surface border-2 border-primary rounded-2xl p-5 flex-row items-center justify-center">
                <Ionicons name="add-circle" size={28} color="#CCFF00" />
                <Text className="text-primary text-lg font-bold ml-3 font-display">
                  Adicionar Novo Aluno
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenLayout>
    );
  }

  // Student Dashboard (Gamified)
  return (
    <ScreenLayout>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor="#CCFF00" />
        }
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-muted-foreground text-base mb-1 font-sans">Olá,</Text>
            <Text className="text-foreground text-2xl font-bold font-display">
              {profile?.full_name?.split(' ')[0] || 'Aluno'}! 👋
            </Text>
          </View>
          <StreakCounter streak={streak?.current_streak || 0} />
        </View>

        {/* Daily Progress Section */}
        <View className="mb-8">
          <Text className="text-foreground text-lg font-bold mb-4 font-display">
            HOJE
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
        </View>

        {/* Health Data Section */}
        <View className="mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-foreground text-lg font-bold font-display">
              ATIVIDADE
            </Text>
            <View className="bg-secondary/10 px-2 py-1 rounded-md">
              <Text className="text-secondary text-[10px] font-bold font-sans">
                SINCRONIZADO
              </Text>
            </View>
          </View>
          <View className="flex-row gap-x-3">
            <View className="flex-1">
              <StatCard
                label="Passos"
                value={steps.toLocaleString()}
                trend={steps >= 10000 ? 'up' : 'neutral'}
                change={steps >= 10000 ? 'Meta atingida!' : `${Math.round((steps / 10000) * 100)}% da meta`}
              />
            </View>
            <View className="flex-1">
              <StatCard
                label="Calorias"
                value={`${calories} kcal`}
                trend="up"
                change="Hoje"
              />
            </View>
          </View>
        </View>

        {/* Weekly Goals Section */}
        <View className="mb-8">
          <Text className="text-foreground text-lg font-bold mb-4 font-display">
            METAS DA SEMANA
          </Text>
          <View className="flex-row gap-x-3">
            <View className="flex-1">
              <StatCard
                label="Refeições"
                value={(() => {
                  const totalMeals = weeklyGoals.reduce((sum, goal) => sum + goal.meals_completed, 0);
                  const targetMeals = weeklyGoals.reduce((sum, goal) => sum + goal.meals_target, 0);
                  return targetMeals > 0 ? `${Math.round((totalMeals / targetMeals) * 100)}%` : '0%';
                })()}
                trend={(() => {
                  const totalMeals = weeklyGoals.reduce((sum, goal) => sum + goal.meals_completed, 0);
                  const targetMeals = weeklyGoals.reduce((sum, goal) => sum + goal.meals_target, 0);
                  const percentage = targetMeals > 0 ? (totalMeals / targetMeals) * 100 : 0;
                  return percentage >= 80 ? 'up' : percentage >= 50 ? 'neutral' : 'down';
                })()}
                change={(() => {
                  const totalMeals = weeklyGoals.reduce((sum, goal) => sum + goal.meals_completed, 0);
                  const targetMeals = weeklyGoals.reduce((sum, goal) => sum + goal.meals_target, 0);
                  return `${totalMeals}/${targetMeals}`;
                })()}
              />
            </View>
            <View className="flex-1">
              <StatCard
                label="Treinos"
                value={(() => {
                  const totalWorkouts = weeklyGoals.reduce((sum, goal) => sum + goal.workout_completed, 0);
                  const targetWorkouts = weeklyGoals.reduce((sum, goal) => sum + goal.workout_target, 0);
                  return `${totalWorkouts}/${targetWorkouts}`;
                })()}
                trend={(() => {
                  const totalWorkouts = weeklyGoals.reduce((sum, goal) => sum + goal.workout_completed, 0);
                  const targetWorkouts = weeklyGoals.reduce((sum, goal) => sum + goal.workout_target, 0);
                  const percentage = targetWorkouts > 0 ? (totalWorkouts / targetWorkouts) * 100 : 0;
                  return percentage >= 80 ? 'up' : percentage >= 50 ? 'neutral' : 'down';
                })()}
                change={(() => {
                  const totalWorkouts = weeklyGoals.reduce((sum, goal) => sum + goal.workout_completed, 0);
                  const targetWorkouts = weeklyGoals.reduce((sum, goal) => sum + goal.workout_target, 0);
                  const percentage = targetWorkouts > 0 ? Math.round((totalWorkouts / targetWorkouts) * 100) : 0;
                  return `${percentage}%`;
                })()}
              />
            </View>
          </View>
        </View>

        {/* Recent Achievements */}
        <View>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-foreground text-lg font-bold font-display">
              CONQUISTAS RECENTES
            </Text>
            <TouchableOpacity>
              <Text className="text-primary text-sm font-semibold font-sans">Ver todas</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
            {achievements.length > 0 ? (
              achievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  title={achievement.title}
                  subtitle={new Date(achievement.earned_at).toLocaleDateString()}
                  icon={achievement.icon}
                  earned={true}
                />
              ))
            ) : (
              // Placeholder achievements
              <>
                <AchievementBadge
                  title="Início"
                  subtitle="Jornada"
                  icon="🚀"
                  earned={true}
                />
                <AchievementBadge
                  title="7 Dias"
                  subtitle="Sequência"
                  icon="🔥"
                  earned={false}
                />
                <AchievementBadge
                  title="Foco"
                  subtitle="Total"
                  icon="🎯"
                  earned={false}
                />
              </>
            )}
          </ScrollView>
        </View>

      </ScrollView>
      
      {/* Confetti Overlay */}
      <ConfettiOverlay show={showConfetti} />
    </ScreenLayout>
  );
}
