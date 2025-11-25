import { Podium } from '@/components/gamification/Podium';
import { RankListItem } from '@/components/gamification/RankListItem';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@meupersonal/supabase';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LeaderboardEntry {
  student_id: string;
  name: string;
  points: number;
  avatar_url?: string;
  rank: number;
}

export default function LeaderboardScreen() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      // 1. Fetch scores for current week
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
      const monday = new Date(today.setDate(diff)).toISOString().split('T')[0];

      const { data: scores, error } = await supabase
        .from('leaderboard_scores')
        .select(`
          points,
          student:profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('week_start_date', monday)
        .order('points', { ascending: false })
        .limit(50);

      if (error) throw error;

      // 2. Transform data
      const leaderboardData = scores.map((score: any, index: number) => ({
        student_id: score.student.id,
        name: score.student.full_name || 'Aluno',
        points: score.points,
        avatar_url: score.student.avatar_url,
        rank: index + 1,
      }));

      setEntries(leaderboardData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const topThree = entries.slice(0, 3);
  const rest = entries.slice(3);

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0E1A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' }}>
            Ranking Semanal 🏆
          </Text>
          <Text style={{ fontSize: 14, color: '#8B92A8', textAlign: 'center', marginTop: 4 }}>
            Quem está mais focado essa semana?
          </Text>
        </View>

        <FlatList
          data={rest}
          keyExtractor={(item) => item.student_id}
          ListHeaderComponent={() => (
            <View style={{ marginBottom: 16 }}>
              {topThree.length > 0 ? (
                <Podium topThree={topThree} />
              ) : (
                <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="trophy-outline" size={64} color="#5A6178" />
                  <Text style={{ color: '#8B92A8', marginTop: 16 }}>
                    Seja o primeiro a pontuar!
                  </Text>
                </View>
              )}
            </View>
          )}
          renderItem={({ item }) => (
            <RankListItem item={item} isCurrentUser={item.student_id === user?.id} />
          )}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />
          }
          ListEmptyComponent={
            topThree.length === 0 ? null : (
              <Text style={{ color: '#8B92A8', textAlign: 'center', marginTop: 24 }}>
                Nenhum outro aluno pontuou ainda.
              </Text>
            )
          }
        />
      </SafeAreaView>
    </View>
  );
}
