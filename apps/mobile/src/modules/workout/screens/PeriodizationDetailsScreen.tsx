import { useAuthStore } from '@/auth';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useWorkoutStore } from '../store/workoutStore';

export default function PeriodizationDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { periodizations, fetchPeriodizations, isLoading, activatePeriodization, currentPeriodizationPhases, fetchPeriodizationPhases, createTrainingPlan } = useWorkoutStore();
  const [periodization, setPeriodization] = useState<any>(null);

  // Handle both route patterns:
  // 1. /students/[id]/workouts/[periodizationId] -> id is student, periodizationId is periodization
  // 2. /workouts/periodizations/[id] -> id is periodization
  const rawPeriodizationId = params.periodizationId || params.id;
  const periodizationId = Array.isArray(rawPeriodizationId) ? rawPeriodizationId[0] : rawPeriodizationId;

  useEffect(() => {
    if (user?.id) {
      // Always fetch if we don't have the specific periodization, even if we have others
      // This ensures we get the latest data if we navigated from creation
      const found = periodizations.find(p => p.id === periodizationId);
      if (!found) {
        fetchPeriodizations(user.id);
      } else {
        setPeriodization(found);
      }
    }
  }, [user, periodizationId, periodizations.length]); // Depend on length to re-run if fetch completes

  useEffect(() => {
    if (periodizations.length > 0 && periodizationId) {
      const found = periodizations.find(p => p.id === periodizationId);
      if (found) {
        setPeriodization(found);
        fetchPeriodizationPhases(periodizationId as string);
      }
    }
  }, [periodizations, periodizationId]);

  if (isLoading) {
    return (
      <ScreenLayout className="justify-center items-center">
        <ActivityIndicator size="large" color="#00D9FF" />
      </ScreenLayout>
    );
  }

  if (!periodization) {
    return (
      <ScreenLayout className="justify-center items-center px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#71717A" />
        <Text className="text-white text-xl font-bold mt-4 text-center font-display">
          Periodização não encontrada
        </Text>
        <Text className="text-zinc-400 text-center mt-2 mb-6">
          Não foi possível carregar os detalhes desta periodização.
        </Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="bg-zinc-800 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-bold">Voltar</Text>
        </TouchableOpacity>
      </ScreenLayout>
    );
  }

  // Mock Phases Data (Replace with real data later)
  const getPhaseColor = (type: string) => {
    switch (type) {
      case 'adaptation': return '#00C9A7'; // Emerald
      case 'hypertrophy': return '#FFB800'; // Gold
      case 'strength': return '#FF2E63'; // Red
      default: return '#00D9FF'; // Cyan
    }
  };

  const getPhaseLabel = (type: string) => {
    switch (type) {
      case 'adaptation': return 'Adaptação';
      case 'hypertrophy': return 'Hipertrofia';
      case 'strength': return 'Força';
      default: return type;
    }
  };

  return (
    <ScreenLayout>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="items-center pt-8 pb-8 px-6 bg-zinc-900 rounded-b-[32px] border-b border-zinc-800">
          <View className="flex-row items-center justify-between w-full mb-6">
            <TouchableOpacity 
              onPress={() => router.back()} 
              className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800"
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View className="flex-row gap-2">
              <TouchableOpacity 
                onPress={() => Alert.alert('Em breve', 'Edição em desenvolvimento')}
                className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800"
              >
                <Ionicons name="pencil" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="w-20 h-20 rounded-full bg-cyan-400/10 items-center justify-center mb-4 border-2 border-cyan-400/20">
            <Ionicons name="calendar" size={40} color="#00D9FF" />
          </View>
          
          <Text className="text-2xl font-extrabold text-white mb-1 font-display text-center">
            {periodization.name}
          </Text>
          <Text className="text-zinc-400 font-sans mb-6 text-center">
            {periodization.description || 'Sem descrição'}
          </Text>

          <View className="flex-row gap-3 w-full">
            <View className="flex-1 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 items-center">
              <Text className="text-zinc-500 text-xs font-bold mb-1 uppercase">Início</Text>
              <Text className="text-white font-bold">
                {new Date(periodization.start_date).toLocaleDateString()}
              </Text>
            </View>
            <View className="flex-1 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 items-center">
              <Text className="text-zinc-500 text-xs font-bold mb-1 uppercase">Fim</Text>
              <Text className="text-white font-bold">
                {new Date(periodization.end_date).toLocaleDateString()}
              </Text>
            </View>
          </View>
          
          {periodization.status === 'planned' && (
            <TouchableOpacity 
              onPress={() => {
                Alert.alert(
                  'Ativar Periodização',
                  'Deseja ativar esta periodização? Outras periodizações ativas deste aluno serão concluídas.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { 
                      text: 'Ativar', 
                      onPress: async () => {
                        try {
                          await activatePeriodization(periodization.id);
                          Alert.alert('Sucesso', 'Periodização ativada!');
                        } catch (error) {
                          Alert.alert('Erro', 'Não foi possível ativar a periodização.');
                        }
                      }
                    }
                  ]
                );
              }}
              className="mt-6 bg-orange-500 px-6 py-3 rounded-xl w-full items-center"
            >
              <Text className="text-white font-bold font-display">ATIVAR PERIODIZAÇÃO</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Phases List */}
        <View className="p-6">
          <Text className="text-white text-lg font-bold mb-4 font-display tracking-wide">
            FASES DO TREINAMENTO
          </Text>
          
          <View className="gap-4">
            {currentPeriodizationPhases.map((phase, index) => (
              <TouchableOpacity 
                key={phase.id} 
                className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800"
                onPress={() => {
                  // Determine navigation path based on context
                  const targetStudentId = params.id || periodization?.student_id;
                  
                  if (params.id && params.periodizationId) {
                    // We are in students tab: /students/[id]/workouts/[periodizationId]
                    router.push(`/(tabs)/students/${targetStudentId}/workouts/${periodizationId}/phases/${phase.id}` as any);
                  } else {
                    // We are in workouts tab: /workouts/periodizations/[id]
                    // Since we don't have a phases route in workouts tab yet, show alert or redirect to students tab?
                    // Ideally we should mirror the route, but for now let's alert or try to navigate to student context if possible.
                    // Actually, let's just use the student route since it exists.
                    router.push(`/(tabs)/students/${targetStudentId}/workouts/${periodizationId}/phases/${phase.id}` as any);
                  }
                }}
              >
                <View className="flex-row justify-between items-center mb-3">
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center mr-3">
                      <Text className="text-white font-bold">{index + 1}</Text>
                    </View>
                    <View>
                      <Text className="text-white font-bold text-base">{phase.name}</Text>
                      <Text className="text-zinc-500 text-xs">{phase.weekly_frequency}x/semana • {phase.training_split.toUpperCase()}</Text>
                    </View>
                  </View>
                  <View 
                    className="px-2 py-1 rounded-md"
                    style={{ backgroundColor: `${getPhaseColor('hypertrophy')}20` }}
                  >
                    <Text 
                      className="text-[10px] font-bold uppercase"
                      style={{ color: getPhaseColor('hypertrophy') }}
                    >
                      {phase.status === 'draft' ? 'Rascunho' : phase.status === 'active' ? 'Ativo' : 'Concluído'}
                    </Text>
                  </View>
                </View>
                
                <View className="flex-row items-center justify-between pl-11">
                  <Text className={`text-xs font-bold ${
                    phase.status === 'active' ? 'text-emerald-400' : 
                    phase.status === 'completed' ? 'text-zinc-500' : 'text-zinc-600'
                  }`}>
                    {phase.status === 'active' ? '● Em andamento' : 
                     phase.status === 'completed' ? '✓ Concluído' : '○ Planejado'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#52525B" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            className="mt-6 border-2 border-dashed border-zinc-700 rounded-2xl p-4 items-center justify-center"
            onPress={() => {
              Alert.alert(
                'Nova Fase',
                'Criar uma nova fase de treino?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { 
                    text: 'Criar', 
                    onPress: async () => {
                      if (!periodization) return;
                      try {
                        await createTrainingPlan({
                          periodization_id: periodization.id,
                          name: `Fase ${currentPeriodizationPhases.length + 1}`,
                          training_split: 'abc',
                          weekly_frequency: 3,
                          start_date: new Date().toISOString().split('T')[0],
                          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                          status: 'draft',
                          notes: ''
                        });
                        Alert.alert('Sucesso', 'Fase criada!');
                      } catch (error) {
                        Alert.alert('Erro', 'Não foi possível criar a fase.');
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Ionicons name="add-circle-outline" size={24} color="#71717A" />
            <Text className="text-zinc-500 font-bold mt-2">Adicionar Fase</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
