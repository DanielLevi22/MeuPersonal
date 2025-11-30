import { useAuthStore } from '@/auth';
import { AchievementBadge } from '@/components/gamification/AchievementBadge';
import { GoalChart } from '@/components/gamification/GoalChart';
import { StatCard } from '@/components/gamification/StatCard';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { useGamificationStore } from '@/store/gamificationStore';
import { useEffect } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ProgressScreen() {
  const { user } = useAuthStore();
  const { dailyGoal, weeklyGoals, achievements, fetchDailyData, isLoading } = useGamificationStore();

  useEffect(() => {
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      fetchDailyData(today);
    }
  }, [user]);

  return (
    <ScreenLayout>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={() => {
              const today = new Date().toISOString().split('T')[0];
              fetchDailyData(today);
            }} 
            tintColor="#FF6B35" 
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          entering={FadeInDown.delay(100).springify()}
          className="mb-8 mt-2"
        >
          <Text className="text-[34px] font-bold text-white mb-1 font-display tracking-tight leading-tight">
            Seu Progresso 📈
          </Text>
          <Text className="text-[15px] text-zinc-400 font-sans font-medium tracking-wide">
            Acompanhe sua evolução semanal
          </Text>
        </Animated.View>

        {/* Weekly Summary */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className="mb-8">
          <Text className="text-zinc-500 text-[13px] font-bold mb-3 font-sans uppercase tracking-widest ml-1">
            Resumo Semanal
          </Text>
          
          <View className="gap-y-4">
            <StatCard
              label="Meta Semanal"
              value={(() => {
                const totalCompleted = weeklyGoals.reduce((sum, goal) => 
                  sum + goal.meals_completed + goal.workout_completed, 0
                );
                const totalTarget = weeklyGoals.reduce((sum, goal) => 
                  sum + goal.meals_target + goal.workout_target, 0
                );
                return totalTarget > 0 ? `${Math.round((totalCompleted / totalTarget) * 100)}%` : '0%';
              })()}
              trend={(() => {
                const totalCompleted = weeklyGoals.reduce((sum, goal) => 
                  sum + goal.meals_completed + goal.workout_completed, 0
                );
                const totalTarget = weeklyGoals.reduce((sum, goal) => 
                  sum + goal.meals_target + goal.workout_target, 0
                );
                const percentage = totalTarget > 0 ? (totalCompleted / totalTarget) * 100 : 0;
                return percentage >= 80 ? 'up' : percentage >= 50 ? 'neutral' : 'down';
              })()}
              change={(() => {
                const totalCompleted = weeklyGoals.reduce((sum, goal) => 
                  sum + goal.meals_completed + goal.workout_completed, 0
                );
                const totalTarget = weeklyGoals.reduce((sum, goal) => 
                  sum + goal.meals_target + goal.workout_target, 0
                );
                return `${totalCompleted}/${totalTarget}`;
              })()}
              icon="trophy"
            />
            
            {/* Charts */}
            <GoalChart data={weeklyGoals} type="meals" />
            <GoalChart data={weeklyGoals} type="workouts" />
          </View>
        </Animated.View>

        {/* Achievements Grid */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text className="text-zinc-500 text-[13px] font-bold mb-3 font-sans uppercase tracking-widest ml-1">
            Suas Conquistas
          </Text>
          <View className="flex-row flex-wrap gap-4 justify-center">
            {achievements.length > 0 ? (
              achievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  title={achievement.title}
                  subtitle={new Date(achievement.earned_at).toLocaleDateString()}
                  icon={achievement.icon}
                  earned={true}
                  size="lg"
                />
              ))
            ) : (
              <>
                <AchievementBadge
                  title="Início"
                  subtitle="Jornada"
                  icon="🚀"
                  earned={true}
                  size="lg"
                />
                <AchievementBadge
                  title="7 Dias"
                  subtitle="Sequência"
                  icon="🔥"
                  earned={false}
                  size="lg"
                />
                <AchievementBadge
                  title="Foco"
                  subtitle="Total"
                  icon="🎯"
                  earned={false}
                  size="lg"
                />
                <AchievementBadge
                  title="Mestre"
                  subtitle="Dieta"
                  icon="🥗"
                  earned={false}
                  size="lg"
                />
                <AchievementBadge
                  title="Monstro"
                  subtitle="Treino"
                  icon="💪"
                  earned={false}
                  size="lg"
                />
                <AchievementBadge
                  title="Hidratado"
                  subtitle="Água"
                  icon="💧"
                  earned={false}
                  size="lg"
                />
              </>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </ScreenLayout>
  );
}
