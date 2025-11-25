import { AchievementBadge } from '@/components/gamification/AchievementBadge';
import { GoalChart } from '@/components/gamification/GoalChart';
import { StatCard } from '@/components/gamification/StatCard';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { useAuthStore } from '@/auth';
import { useGamificationStore } from '@/store/gamificationStore';
import { useEffect } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

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
            tintColor="#CCFF00" 
          />
        }
      >
        <View className="mb-8">
          <Text className="text-4xl font-bold text-foreground mb-2 font-display">
            Seu Progresso 📈
          </Text>
          <Text className="text-base text-muted-foreground font-sans">
            Acompanhe sua evolução semanal
          </Text>
        </View>

        {/* Weekly Summary */}
        <View className="mb-8">
          <Text className="text-foreground text-lg font-bold mb-4 font-display">
            RESUMO SEMANAL
          </Text>
          
          <View className="gap-y-4">
            <StatCard
              label="Meta Semanal"
              value="85%" // This should ideally be calculated from weeklyGoals
              trend="up"
              change="+5%"
              icon="trophy"
            />
            
            {/* Charts */}
            <GoalChart data={weeklyGoals} type="meals" />
            <GoalChart data={weeklyGoals} type="workouts" />
          </View>
        </View>

        {/* Achievements Grid */}
        <View>
          <Text className="text-foreground text-lg font-bold mb-4 font-display">
            SUAS CONQUISTAS
          </Text>
          <View className="flex-row flex-wrap gap-6 justify-center">
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
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
