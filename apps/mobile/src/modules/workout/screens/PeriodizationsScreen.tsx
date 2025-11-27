import { useAuthStore } from '@/auth';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useWorkoutStore } from '../store/workoutStore';

export default function PeriodizationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { periodizations, isLoading, fetchPeriodizations } = useWorkoutStore();

  useEffect(() => {
    if (user?.id) {
      fetchPeriodizations(user.id);
    }
  }, [user]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={() => router.push(`/(tabs)/workouts/periodization/${item.id}` as any)}
      className="mb-4"
    >
      <View className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-4">
            <Text className="text-white text-lg font-bold font-display mb-1">
              {item.name}
            </Text>
            <Text className="text-zinc-400 text-sm font-sans" numberOfLines={2}>
              {item.description || 'Sem descrição'}
            </Text>
          </View>
          <View className={`px-3 py-1 rounded-full ${
            item.status === 'active' ? 'bg-emerald-500/15' : 'bg-zinc-800'
          }`}>
            <Text className={`text-xs font-bold ${
              item.status === 'active' ? 'text-emerald-400' : 'text-zinc-400'
            }`}>
              {item.status === 'active' ? 'Ativo' : 'Inativo'}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-4 mt-2">
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={16} color="#00D9FF" style={{ marginRight: 6 }} />
            <Text className="text-zinc-300 text-xs font-bold">
              {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenLayout>
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pt-4 pb-6">
        <View>
          <Text className="text-4xl font-extrabold text-white mb-1 font-display">
            Periodização
          </Text>
          <Text className="text-base text-zinc-400 font-sans">
            Planejamento de treinos
          </Text>
        </View>
        
        <Link href={'/(tabs)/workouts/periodization/create' as any} asChild>
          <TouchableOpacity activeOpacity={0.8}>
            <LinearGradient
              colors={['#00D9FF', '#00B8D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="h-14 w-14 rounded-full items-center justify-center shadow-lg shadow-cyan-500/20"
            >
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Content */}
      <FlatList
        data={periodizations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={() => user?.id && fetchPeriodizations(user.id)} 
            tintColor="#00D9FF" 
          />
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
                Crie um planejamento de longo prazo para seus alunos
              </Text>
              
              <Link href={'/(tabs)/workouts/periodization/create' as any} asChild>
                <TouchableOpacity activeOpacity={0.8}>
                  <LinearGradient
                    colors={['#00D9FF', '#00B8D9']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="rounded-2xl py-3 px-6 shadow-lg shadow-cyan-500/20"
                  >
                    <Text className="text-white text-base font-bold font-display">
                      Criar Periodização
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Link>
            </View>
          ) : (
            <View className="py-20">
              <ActivityIndicator size="large" color="#00D9FF" />
            </View>
          )
        }
      />
    </ScreenLayout>
  );
}
