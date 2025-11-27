import { useNutritionStore } from '@/modules/nutrition/store/nutritionStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NutritionDashboard() {
  const { id: studentId } = useLocalSearchParams();
  const router = useRouter();
  const {
    currentDietPlan,
    dietPlanHistory,
    fetchDietPlan,
    fetchDietPlanHistory,
    finishDietPlan,
    checkPlanExpiration,
    isLoading,
  } = useNutritionStore();

  useEffect(() => {
    if (studentId && typeof studentId === 'string') {
      fetchDietPlan(studentId);
      fetchDietPlanHistory(studentId);
      checkPlanExpiration(studentId);
    }
  }, [studentId]);

  const calculateDaysRemaining = () => {
    if (!currentDietPlan?.end_date) return null;
    const today = new Date();
    const endDate = new Date(currentDietPlan.end_date);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleFinishPlan = () => {
    if (!currentDietPlan) return;
    
    Alert.alert(
      'Finalizar Plano',
      'Tem certeza que deseja finalizar este plano antes do prazo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          style: 'destructive',
          onPress: async () => {
            try {
              await finishDietPlan(currentDietPlan.id);
              Alert.alert('Sucesso', 'Plano finalizado!');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível finalizar o plano');
            }
          }
        }
      ]
    );
  };

  const handleCreateNew = () => {
    // Navigate to create screen
    // We need to pass the student ID to pre-select them?
    // The create screen currently selects from a list.
    // We can pass a param or just let them select.
    // Ideally, we pass the student ID.
    router.push({
      pathname: '/nutrition/create',
      params: { preselectedStudentId: studentId }
    } as any);
  };

  const handleOpenPlan = (planId: string) => {
    router.push(`/(tabs)/students/${studentId}/nutrition/full-diet` as any);
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-6 pt-4 pb-4">
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.push(`/(tabs)/students/${studentId}` as any);
              }
            }}
            className="bg-card p-2.5 rounded-xl mr-4"
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-extrabold text-foreground">Nutrição</Text>
            <Text className="text-sm text-muted-foreground mt-1">Gerenciar planos</Text>
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
          {/* Active Plan Section */}
          <View className="mb-8">
            <Text className="text-lg font-bold text-foreground mb-4">Plano Ativo</Text>
            
            {isLoading ? (
              <ActivityIndicator size="small" color="#F97316" />
            ) : currentDietPlan ? (
              <TouchableOpacity 
                className="rounded-3xl overflow-hidden border border-orange-500"
                onPress={() => handleOpenPlan(currentDietPlan.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#141B2D', '#1E2A42']}
                  className="p-5"
                >
                  <View className="flex-row justify-between items-start mb-5">
                    <View>
                      <Text className="text-xl font-bold text-foreground mb-1">{currentDietPlan.name}</Text>
                      <Text className="text-sm text-muted-foreground">
                        Início: {new Date(currentDietPlan.start_date).toLocaleDateString('pt-BR')}
                      </Text>
                      {currentDietPlan.end_date && (
                        <Text className="text-sm text-muted-foreground">
                          Término: {new Date(currentDietPlan.end_date).toLocaleDateString('pt-BR')}
                          {calculateDaysRemaining() !== null && (
                            <Text style={{ color: calculateDaysRemaining()! > 7 ? '#A3E635' : '#FBBF24' }}>
                              {' '}({calculateDaysRemaining()} dias restantes)
                            </Text>
                          )}
                        </Text>
                      )}
                    </View>
                    <View className="bg-green-500/15 px-2.5 py-1 rounded-lg border border-green-500">
                      <Text className="text-green-400 text-xs font-bold">
                        {currentDietPlan.status === 'active' ? 'ATIVO' : 
                         currentDietPlan.status === 'completed' ? 'CONCLUÍDO' :
                         currentDietPlan.status === 'finished' ? 'FINALIZADO' : 'RASCUNHO'}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between bg-black/20 p-4 rounded-2xl mb-4">
                    <View className="items-center flex-1">
                      <Text className="text-lg font-bold text-foreground mb-1">{currentDietPlan.target_calories}</Text>
                      <Text className="text-xs text-muted-foreground">Kcal</Text>
                    </View>
                    <View className="w-px bg-white/10" />
                    <View className="items-center flex-1">
                      <Text className="text-lg font-bold text-[#00C9A7] mb-1">
                        {currentDietPlan.target_protein}g
                      </Text>
                      <Text className="text-xs text-muted-foreground">Prot</Text>
                    </View>
                    <View className="w-px bg-white/10" />
                    <View className="items-center flex-1">
                      <Text className="text-lg font-bold text-[#9D4EDD] mb-1">
                        {currentDietPlan.target_carbs}g
                      </Text>
                      <Text className="text-xs text-muted-foreground">Carb</Text>
                    </View>
                    <View className="w-px bg-white/10" />
                    <View className="items-center flex-1">
                      <Text className="text-lg font-bold text-[#FFB800] mb-1">
                        {currentDietPlan.target_fat}g
                      </Text>
                      <Text className="text-xs text-muted-foreground">Gord</Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text className="text-primary text-sm font-semibold">Toque para editar</Text>
                    <Ionicons name="chevron-forward" size={20} color="#FF6B35" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View className="bg-card rounded-3xl p-8 items-center border-2 border-border border-dashed">
                <Ionicons name="restaurant-outline" size={48} color="#5A6178" />
                <Text className="text-muted-foreground mt-3 text-base">Nenhum plano ativo</Text>
              </View>
            )}
          </View>

          {/* Actions */}
          {currentDietPlan && currentDietPlan.status === 'active' && (
            <TouchableOpacity 
              onPress={handleFinishPlan}
              activeOpacity={0.8}
              className="mb-4 rounded-2xl bg-card border-2 border-amber-500"
            >
              <View className="flex-row items-center justify-center py-4">
                <Ionicons name="checkmark-done" size={24} color="#F59E0B" style={{ marginRight: 8 }} />
                <Text className="text-amber-500 text-base font-bold">Finalizar Plano</Text>
              </View>
            </TouchableOpacity>
          )}

          {!currentDietPlan || currentDietPlan.status !== 'active' ? (
            <TouchableOpacity 
              onPress={handleCreateNew}
              activeOpacity={0.8}
              className="mb-8 rounded-2xl overflow-hidden"
            >
              <LinearGradient
                colors={['#00C9A7', '#00A389']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="flex-row items-center justify-center py-4"
              >
                <Ionicons name="add-circle" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text className="text-white text-base font-bold">Criar Novo Plano</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : null}


          {/* History Section */}
          <View className="mb-8">
            <Text className="text-lg font-bold text-foreground mb-4">Histórico</Text>
            
            {dietPlanHistory.length > 0 ? (
              dietPlanHistory.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  className="bg-card rounded-2xl p-4 mb-3 border border-border"
                  onPress={() => handleOpenPlan(plan.id)}
                  disabled={true} // For now, maybe we want to view details later
                >
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-base font-bold text-foreground mb-1">{plan.name}</Text>
                      <Text className="text-xs text-muted-foreground">
                        {new Date(plan.start_date).toLocaleDateString('pt-BR')} - {plan.end_date ? new Date(plan.end_date).toLocaleDateString('pt-BR') : '...'}
                      </Text>
                    </View>
                    <View className="px-2 py-1 rounded-lg border border-zinc-500 bg-white/10">
                      <Text className="text-[10px] font-bold text-muted-foreground">
                        {plan.status === 'completed' ? 'CONCLUÍDO' : 'FINALIZADO'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text className="text-muted-foreground italic text-center mt-4">
                Nenhum plano arquivado.
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
