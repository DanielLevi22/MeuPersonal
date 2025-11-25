import { AchievementBadge } from '@/components/gamification/AchievementBadge';
import { StatCard } from '@/components/gamification/StatCard';
import { useAuthStore } from '@/store/authStore';
import { useGamificationStore } from '@/store/gamificationStore';
import { useEffect } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProgressScreen() {
  const { user } = useAuthStore();
  const { dailyGoal, achievements, fetchDailyData, isLoading } = useGamificationStore();

  useEffect(() => {
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      fetchDailyData(today);
    }
  }, [user]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: 24 }}
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
        >
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 32, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 }}>
              Seu Progresso 📈
            </Text>
            <Text style={{ fontSize: 16, color: '#8B92A8' }}>
              Acompanhe sua evolução semanal
            </Text>
          </View>

          {/* Weekly Summary */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
              RESUMO SEMANAL
            </Text>
            <View style={{ gap: 12 }}>
              <StatCard
                label="Meta Semanal"
                value="85%"
                trend="up"
                change="+5%"
                icon="trophy"
              />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <StatCard
                    label="Refeições"
                    value={`${dailyGoal?.meals_completed || 0}/${dailyGoal?.meals_target || 4}`}
                    trend="neutral"
                    change="Hoje"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <StatCard
                    label="Treinos"
                    value={`${dailyGoal?.workout_completed || 0}/${dailyGoal?.workout_target || 1}`}
                    trend="neutral"
                    change="Hoje"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Achievements Grid */}
          <View>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
              SUAS CONQUISTAS
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>
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
      </SafeAreaView>
    </View>
  );
}
