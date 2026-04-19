import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageSourcePropType,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuthStore } from '@/auth';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { SearchModal } from '@/components/ui/SearchModal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { colors } from '@/constants/colors';
import { useWorkoutStore } from '../store/workoutStore';

const PERIODIZATION_IMAGES: Record<string, ImageSourcePropType> = {
  strength: require('../../../../assets/workouts/back.jpg'),
  hypertrophy: require('../../../../assets/workouts/chest.jpg'),
  adaptation: require('../../../../assets/workouts/arms.jpg'),
  default: require('../../../../assets/workouts/shoulders.jpg'),
};

export default function PeriodizationsScreen() {
  const router = useRouter();
  const { user, accountType } = useAuthStore();
  const { periodizations, isLoading, fetchPeriodizations } = useWorkoutStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);

  useEffect(() => {
    if (user?.id && accountType) {
      fetchPeriodizations(user.id);
    }
  }, [user?.id, accountType, fetchPeriodizations]);

  const filteredPeriodizations = useMemo(() => {
    if (!searchQuery.trim()) {
      return accountType === 'specialist'
        ? periodizations
        : periodizations.filter((p) => p.status === 'active' || p.status === 'planned');
    }

    const query = searchQuery.toLowerCase();
    return periodizations.filter((periodization) => {
      if (
        accountType !== 'specialist' &&
        periodization.status !== 'active' &&
        periodization.status !== 'planned'
      )
        return false;

      const name = periodization.name?.toLowerCase() || '';
      const studentName = periodization.student?.full_name?.toLowerCase() || '';
      return name.includes(query) || studentName.includes(query);
    });
  }, [periodizations, searchQuery, accountType]);

  type PeriodizationItem = ReturnType<typeof useWorkoutStore.getState>['periodizations'][number] & {
    phases?: unknown[];
  };

  const onRefresh = useCallback(() => {
    if (user?.id) {
      fetchPeriodizations(user.id);
    }
  }, [user?.id, fetchPeriodizations]);

  const renderItem = useCallback(
    ({ item }: { item: PeriodizationItem }) => {
      // Get phases count from the periodization object
      const phaseCount = item.phases?.length || 0;

      return (
        <PremiumCard
          title={item.name || 'Sem nome'}
          subtitle={`${item.student?.full_name || 'Aluno'} • ${phaseCount} ${phaseCount === 1 ? 'Fase' : 'Fases'}`}
          image={PERIODIZATION_IMAGES[item.objective as string] || PERIODIZATION_IMAGES.default}
          onPress={() => router.push(`/(tabs)/workouts/periodizations/${item.id}` as never)}
          badge={<StatusBadge status={item.status} />}
          containerStyle={{ marginBottom: 24 }}
        >
          <View className="flex-row items-center justify-between mt-4">
            <View className="flex-row items-center bg-black/40 px-3 py-2 rounded-xl border border-white/5">
              <Ionicons
                name="calendar-outline"
                size={14}
                color={colors.primary.start}
                style={{ marginRight: 8 }}
              />
              <Text className="text-white/90 text-[10px] font-bold uppercase tracking-widest">
                {item.start_date ? new Date(item.start_date).toLocaleDateString() : '—'} -{' '}
                {item.end_date ? new Date(item.end_date).toLocaleDateString() : '—'}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text
                className="text-orange-500 font-bold text-xs mr-1 uppercase"
                style={{ color: colors.primary.start }}
              >
                Gerenciar
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary.start} />
            </View>
          </View>
        </PremiumCard>
      );
    },
    [router]
  );

  return (
    <ScreenLayout>
      {/* Header */}
      <View className="px-6 pt-4 pb-6">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-4xl font-extrabold text-white mb-0.5 font-display tracking-tight">
              Alunos
            </Text>
            <Text className="text-sm text-zinc-400 font-sans">Gestão de Planejamento</Text>
          </View>

          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => setIsSearchModalVisible(true)}
              className="w-12 h-12 rounded-full bg-zinc-800 items-center justify-center border border-zinc-700"
            >
              <Ionicons name="search" size={24} color="#E4E4E7" />
            </TouchableOpacity>

            {accountType === 'specialist' && (
              <Link href="/(tabs)/workouts/create-periodization" asChild>
                <TouchableOpacity activeOpacity={0.8}>
                  <LinearGradient
                    colors={['#FF6B35', '#FF2E63']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="h-12 w-12 rounded-full items-center justify-center shadow-lg shadow-orange-500/20"
                  >
                    <Ionicons name="add" size={24} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </Link>
            )}
          </View>
        </View>
      </View>

      <SearchModal
        visible={isSearchModalVisible}
        onClose={() => setIsSearchModalVisible(false)}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Content */}
      <FlatList
        data={filteredPeriodizations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#FF6B35" />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View className="flex-1 justify-center items-center py-20">
              <View className="bg-zinc-900 p-8 rounded-full mb-6 border border-zinc-800">
                <Ionicons name="calendar-outline" size={64} color="#52525B" />
              </View>
              <Text className="text-white text-xl font-bold mb-2 text-center font-display">
                Nenhuma periodização
              </Text>
              <Text className="text-zinc-400 text-center px-8 text-sm mb-8 font-sans">
                {accountType === 'specialist'
                  ? 'Crie um planejamento para seus alunos'
                  : 'Seu personal ainda não criou uma periodização'}
              </Text>

              {accountType === 'specialist' && (
                <Link href="/(tabs)/workouts/create-periodization" asChild>
                  <TouchableOpacity activeOpacity={0.8}>
                    <LinearGradient
                      colors={['#FF6B35', '#FF2E63']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="rounded-2xl py-3 px-6 shadow-lg shadow-orange-500/20"
                    >
                      <Text className="text-white text-base font-bold font-display">
                        Criar Periodização
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Link>
              )}
            </View>
          ) : (
            <View className="py-20">
              <ActivityIndicator size="large" color="#FF6B35" />
            </View>
          )
        }
      />
    </ScreenLayout>
  );
}
