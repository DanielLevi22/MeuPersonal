import { useAuthStore } from '@/auth';
import { Podium } from '@/components/gamification/Podium';
import { RankListItem } from '@/components/gamification/RankListItem';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@meupersonal/supabase';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';

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
      <View className="flex-1 bg-[#0A0A0A] justify-center items-center">
        <ActivityIndicator size="large" color="#FFB800" />
      </View>
    );
  }

  return (
    <ScreenLayout>
      <View className="px-6 pt-4 pb-2">
        <Text className="text-3xl font-extrabold text-white text-center font-display">
          Ranking Semanal 🏆
        </Text>
        <Text className="text-sm text-zinc-400 text-center mt-1 font-sans">
          Quem está mais focado essa semana?
        </Text>
      </View>

      <FlatList
        data={rest}
        keyExtractor={(item) => item.student_id}
        ListHeaderComponent={() => (
          <View className="mb-4">
            {topThree.length > 0 ? (
              <Podium topThree={topThree} />
            ) : (
              <View className="h-48 justify-center items-center">
                <Ionicons name="trophy-outline" size={64} color="#52525B" />
                <Text className="text-zinc-500 mt-4 font-sans">
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFB800" />
        }
        ListEmptyComponent={
          topThree.length === 0 ? null : (
            <Text className="text-zinc-500 text-center mt-6 font-sans">
              Nenhum outro aluno pontuou ainda.
            </Text>
          )
        }
      />
    </ScreenLayout>
  );
}
