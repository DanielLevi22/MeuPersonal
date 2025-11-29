import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useWorkoutStore } from '../store/workoutStore';

export default function PhaseDetailsScreen() {
  const { phaseId } = useLocalSearchParams();
  const router = useRouter();
  const { currentPeriodizationPhases } = useWorkoutStore();
  
  const phase = currentPeriodizationPhases.find(p => p.id === phaseId);

  if (!phase) {
    return (
      <ScreenLayout className="justify-center items-center px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#71717A" />
        <Text className="text-white text-xl font-bold mt-4 text-center font-display">
          Fase não encontrada
        </Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="bg-zinc-800 px-6 py-3 rounded-xl mt-6"
        >
          <Text className="text-white font-bold">Voltar</Text>
        </TouchableOpacity>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <View className="flex-row items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="bg-zinc-950 p-2 rounded-xl border border-zinc-800"
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-white font-bold text-lg font-display">{phase.name}</Text>
        <View className="w-10" /> 
      </View>

      <ScrollView className="p-6">
        <View className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 mb-6">
          <Text className="text-zinc-400 text-sm mb-1">Divisão de Treino</Text>
          <Text className="text-white font-bold text-lg uppercase">{phase.training_split}</Text>
          
          <View className="flex-row gap-4 mt-4">
            <View>
              <Text className="text-zinc-400 text-xs">Frequência</Text>
              <Text className="text-white font-bold">{phase.weekly_frequency}x/semana</Text>
            </View>
            <View>
              <Text className="text-zinc-400 text-xs">Duração</Text>
              <Text className="text-white font-bold">
                {new Date(phase.start_date).toLocaleDateString()} - {new Date(phase.end_date).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        <Text className="text-white font-bold text-lg mb-4 font-display">Treinos</Text>
        
        <TouchableOpacity 
          className="border-2 border-dashed border-zinc-700 rounded-2xl p-6 items-center justify-center"
          onPress={() => Alert.alert('Em breve', 'Criar treino')}
        >
          <Ionicons name="barbell-outline" size={32} color="#71717A" />
          <Text className="text-zinc-500 font-bold mt-2">Adicionar Treino (A, B, C...)</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenLayout>
  );
}
