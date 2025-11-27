import { useAuthStore } from '@/auth';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useNutritionStore } from '../routes';

export default function NutritionScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { dietPlans, isLoading, fetchDietPlans } = useNutritionStore();

  useEffect(() => {
    if (user?.id) {
      fetchDietPlans(user.id);
    }
  }, [user]);

  const handlePressPlan = (studentId: string, planId: string) => {
    Haptics.selectionAsync();
    router.push(`/(tabs)/students/${studentId}/nutrition/${planId}` as any);
  };

  const handleCreatePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 100).springify()} 
      layout={Layout.springify()}
    >
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => handlePressPlan(item.student_id, item.id)}
        className="mb-4"
      >
        <View className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 shadow-sm">
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1 mr-4">
              <Text className="text-white text-xl font-bold font-display mb-1 leading-tight">
                {item.name}
              </Text>
              <Text className="text-zinc-400 text-sm font-sans line-clamp-2">
                {item.description || 'Sem descrição'}
              </Text>
              {item.student?.full_name && (
                <View className="flex-row items-center mt-2">
                  <Ionicons name="person-circle-outline" size={16} color="#A1A1AA" />
                  <Text className="text-zinc-400 text-xs ml-1 font-medium">
                    {item.student.full_name}
                  </Text>
                </View>
              )}
            </View>
            <View className={`px-3 py-1.5 rounded-full ${
              item.status === 'active' ? 'bg-emerald-500/15' : 'bg-zinc-800'
            }`}>
              <Text className={`text-xs font-bold ${
                item.status === 'active' ? 'text-emerald-400' : 'text-zinc-400'
              }`}>
                {item.status === 'active' ? 'Ativo' : 'Inativo'}
              </Text>
            </View>
          </View>

          {/* Macros Summary - Cleaner Look */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-zinc-950/50 p-3 rounded-xl items-center">
              <Text className="text-emerald-400 text-xs font-bold mb-0.5">PROT</Text>
              <Text className="text-white font-semibold text-sm">{item.target_protein}g</Text>
            </View>
            <View className="flex-1 bg-zinc-950/50 p-3 rounded-xl items-center">
              <Text className="text-purple-400 text-xs font-bold mb-0.5">CARB</Text>
              <Text className="text-white font-semibold text-sm">{item.target_carbs}g</Text>
            </View>
            <View className="flex-1 bg-zinc-950/50 p-3 rounded-xl items-center">
              <Text className="text-amber-400 text-xs font-bold mb-0.5">GORD</Text>
              <Text className="text-white font-semibold text-sm">{item.target_fat}g</Text>
            </View>
          </View>

          <View className="flex-row justify-between items-center pt-4 border-t border-zinc-800/50">
            <View className="flex-row items-center bg-orange-500/10 px-2 py-1 rounded-lg">
              <Ionicons name="flame" size={14} color="#FF6B35" style={{ marginRight: 4 }} />
              <Text className="text-[#FF6B35] font-bold text-sm">
                {item.target_calories} <Text className="text-[#FF6B35]/70 font-normal text-xs">kcal</Text>
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-zinc-500 text-xs mr-1 font-medium">
                {new Date(item.start_date).toLocaleDateString()}
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#52525B" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <ScreenLayout>
      {/* Large Title Header */}
      <View className="flex-row justify-between items-end px-6 pt-8 pb-6">
        <View>
          <Text className="text-4xl font-extrabold text-white font-display tracking-tight">
            Nutrição
          </Text>
          <Text className="text-base text-zinc-400 font-sans font-medium mt-1">
            Gestão de planos alimentares
          </Text>
        </View>
        
        <Link href={'/nutrition/create' as any} asChild>
          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={handleCreatePress}
          >
            <LinearGradient
              colors={['#00D9FF', '#00B8D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="h-12 w-12 rounded-full items-center justify-center shadow-lg shadow-cyan-500/20"
            >
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Content */}
      <FlatList
        data={dietPlans}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={() => user?.id && fetchDietPlans(user.id)} 
            tintColor="#00D9FF" 
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <Animated.View 
              entering={FadeInDown.delay(200).springify()}
              className="flex-1 justify-center items-center py-20"
            >
              <View className="bg-zinc-900/50 p-8 rounded-full mb-6 border border-zinc-800">
                <Ionicons name="restaurant-outline" size={64} color="#52525B" />
              </View>
              <Text className="text-white text-xl font-bold mb-2 text-center font-display">
                Nenhum plano encontrado
              </Text>
              <Text className="text-zinc-400 text-center px-8 text-sm mb-8 font-sans leading-relaxed">
                Crie planos alimentares personalizados para seus alunos e acompanhe o progresso.
              </Text>
              
              <Link href={'/nutrition/create' as any} asChild>
                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={handleCreatePress}
                >
                  <LinearGradient
                    colors={['#00D9FF', '#00B8D9']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="rounded-2xl py-3.5 px-8 shadow-lg shadow-cyan-500/20"
                  >
                    <Text className="text-white text-base font-bold font-display">
                      Criar Primeiro Plano
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Link>
            </Animated.View>
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
