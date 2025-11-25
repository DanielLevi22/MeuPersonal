import { AchievementBadge } from '@/components/gamification/AchievementBadge';
import { ProgressCard } from '@/components/gamification/ProgressCard';
import { StatCard } from '@/components/gamification/StatCard';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { useAuthStore } from '@/store/authStore';
import { useGamificationStore } from '@/store/gamificationStore';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@meupersonal/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { dailyGoal, streak, achievements, fetchDailyData, isLoading } = useGamificationStore();
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
  };

  if (isLoading && !profile) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0E1A', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ 
          backgroundColor: 'rgba(255, 107, 53, 0.15)', 
          padding: 20, 
          borderRadius: 50,
          marginBottom: 16
        }}>
          <Ionicons name="barbell" size={48} color="#FF6B35" />
        </View>
        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>Carregando...</Text>
      </View>
    );
  }

  // Personal Trainer Dashboard (Legacy View)
  if (profile?.role === 'personal') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ padding: 24 }}>
            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontSize: 36, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 }}>
                Dashboard 🔥
              </Text>
              <Text style={{ fontSize: 16, color: '#8B92A8' }}>
                Gerencie seus alunos e treinos
              </Text>
            </View>

            <View>
              {/* Stats Card - Students */}
              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/students')}
                activeOpacity={0.8}
                style={{ marginBottom: 16 }}
              >
                <LinearGradient
                  colors={['#00D9FF', '#00B8D9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 20,
                    padding: 24,
                    shadowColor: '#00D9FF',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 13, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>
                        ALUNOS ATIVOS
                      </Text>
                      <Text style={{ color: '#FFFFFF', fontSize: 48, fontWeight: '800' }}>
                        0
                      </Text>
                    </View>
                    <View style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                      padding: 16, 
                      borderRadius: 20 
                    }}>
                      <Ionicons name="people" size={40} color="white" />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Stats Card - Workouts */}
              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/workouts')}
                activeOpacity={0.8}
                style={{ marginBottom: 24 }}
              >
                <LinearGradient
                  colors={['#00FF88', '#00CC6E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 20,
                    padding: 24,
                    shadowColor: '#00FF88',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={{ color: 'rgba(10, 14, 26, 0.8)', fontSize: 13, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>
                        TREINOS CRIADOS
                      </Text>
                      <Text style={{ color: '#0A0E1A', fontSize: 48, fontWeight: '800' }}>
                        0
                      </Text>
                    </View>
                    <View style={{ 
                      backgroundColor: 'rgba(10, 14, 26, 0.2)', 
                      padding: 16, 
                      borderRadius: 20 
                    }}>
                      <Ionicons name="barbell" size={40} color="#0A0E1A" />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Quick Action */}
              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/students')}
                activeOpacity={0.8}
              >
                <View style={{
                  backgroundColor: '#141B2D',
                  borderWidth: 2,
                  borderColor: '#FF6B35',
                  borderRadius: 20,
                  padding: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Ionicons name="add-circle" size={28} color="#FF6B35" />
                  <Text style={{ color: '#FF6B35', fontSize: 18, fontWeight: '700', marginLeft: 12 }}>
                    Adicionar Novo Aluno
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Student Dashboard (Gamified)
  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor="#FF6B35" />
          }
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <View>
              <Text style={{ color: '#8B92A8', fontSize: 16, marginBottom: 4 }}>Olá,</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '800' }}>
                {profile?.full_name?.split(' ')[0] || 'Aluno'}! 👋
              </Text>
            </View>
            <StreakCounter streak={streak?.current_streak || 0} />
          </View>

          {/* Daily Progress Section */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
              HOJE
            </Text>
            <View style={{ gap: 12 }}>
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

          {/* Weekly Goals Section */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
              METAS DA SEMANA
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <StatCard
                  label="Refeições"
                  value="85%"
                  trend="up"
                  change="+5%"
                />
              </View>
              <View style={{ flex: 1 }}>
                <StatCard
                  label="Treinos"
                  value="4/5"
                  trend="neutral"
                  change="0%"
                />
              </View>
            </View>
          </View>

          {/* Recent Achievements */}
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>
                CONQUISTAS RECENTES
              </Text>
              <TouchableOpacity>
                <Text style={{ color: '#FF6B35', fontSize: 14, fontWeight: '600' }}>Ver todas</Text>
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
      </SafeAreaView>
    </View>
  );
}
