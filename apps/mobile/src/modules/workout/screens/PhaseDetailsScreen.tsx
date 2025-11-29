import { useAuthStore } from '@/auth';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useWorkoutStore } from '../store/workoutStore';

export default function PhaseDetailsScreen() {
  const { phaseId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentPeriodizationPhases, updateTrainingPlan, createWorkout, fetchWorkoutsForPhase, generateWorkoutsForPhase, workouts } = useWorkoutStore();
  
  const phase = currentPeriodizationPhases.find(p => p.id === phaseId);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [customSplit, setCustomSplit] = useState('');

  const splits = ['A', 'AB', 'ABC', 'ABCD', 'ABCDE', 'ABCDEF'];

  useEffect(() => {
    if (phase?.id) {
      fetchWorkoutsForPhase(phase.id);
    }
  }, [phase?.id]);

  const handleUpdateDate = async (type: 'start' | 'end', date: Date) => {
    if (!phase) return;
    try {
      await updateTrainingPlan(phase.id, {
        [type === 'start' ? 'start_date' : 'end_date']: date.toISOString().split('T')[0]
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar a data.');
    }
  };

  const handleSelectSplit = async (split?: string) => {
    if (!phase || !user?.id) return;
    
    const finalSplit = split || customSplit.toUpperCase().trim();
    
    if (!finalSplit) {
      Alert.alert('Atenção', 'Digite uma divisão de treino válida.');
      return;
    }
    
    // Validate that split only contains letters
    if (!/^[A-Z]+$/.test(finalSplit)) {
      Alert.alert('Erro', 'A divisão deve conter apenas letras (A-Z).');
      return;
    }
    
    // Check if workouts exist and warn about data loss
    if (workouts.length > 0 && phase.training_split && phase.training_split !== finalSplit) {
      Alert.alert(
        'Atenção - Dados Serão Perdidos',
        `Você possui ${workouts.length} treino(s) configurado(s) para a divisão "${phase.training_split}".\n\n⚠️ TODOS OS TREINOS E EXERCÍCIOS SERÃO DELETADOS ao mudar para "${finalSplit}".\n\nDeseja continuar?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel'
          },
          {
            text: 'Deletar e Continuar',
            style: 'destructive',
            onPress: () => executeSplitChange(finalSplit)
          }
        ]
      );
    } else {
      executeSplitChange(finalSplit);
    }
  };

  const executeSplitChange = async (finalSplit: string) => {
    if (!phase || !user?.id) return;
    
    try {
      await generateWorkoutsForPhase(phase.id, finalSplit, user.id);
      setShowSplitModal(false);
      setCustomSplit('');
      Alert.alert('Sucesso', `Treinos para divisão ${finalSplit} gerados!`);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível gerar os treinos.');
    }
  };

  const handleCreateWorkout = async () => {
    if (!phase || !user?.id) return;
    try {
      await createWorkout({
        training_plan_id: phase.id,
        title: 'Novo Treino',
        description: '',
        personal_id: user.id
      });
      Alert.alert('Sucesso', 'Treino criado!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar o treino.');
    }
  };

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

      <ScrollView className="p-6" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 mb-6">
          <Text className="text-zinc-400 text-sm mb-1">Divisão de Treino</Text>
          <TouchableOpacity 
            onPress={() => setShowSplitModal(true)}
            className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 flex-row items-center justify-between mt-1"
          >
            <Text className="text-white font-bold text-lg uppercase">
              {phase.training_split || 'Selecionar'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#71717A" />
          </TouchableOpacity>
          
          <View className="flex-row gap-4 mt-4">
            <View className="flex-1">
              <Text className="text-zinc-400 text-xs mb-1">Frequência</Text>
              <Text className="text-white font-bold">{phase.weekly_frequency}x/semana</Text>
            </View>
          </View>

          <View className="flex-row gap-4 mt-4">
            <View className="flex-1">
              <Text className="text-zinc-400 text-xs mb-1">Início</Text>
              <TouchableOpacity 
                onPress={() => setShowStartPicker(true)}
                className="bg-zinc-800 p-2 rounded-lg border border-zinc-700 flex-row items-center justify-between"
              >
                <Text className="text-white font-bold text-sm">
                  {new Date(phase.start_date).toLocaleDateString('pt-BR')}
                </Text>
                <Ionicons name="calendar-outline" size={14} color="#71717A" />
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker
                  value={new Date(phase.start_date)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowStartPicker(false);
                    if (selectedDate && event.type === 'set') {
                      handleUpdateDate('start', selectedDate);
                    }
                  }}
                />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-zinc-400 text-xs mb-1">Término</Text>
              <TouchableOpacity 
                onPress={() => setShowEndPicker(true)}
                className="bg-zinc-800 p-2 rounded-lg border border-zinc-700 flex-row items-center justify-between"
              >
                <Text className="text-white font-bold text-sm">
                  {new Date(phase.end_date).toLocaleDateString('pt-BR')}
                </Text>
                <Ionicons name="calendar-outline" size={14} color="#71717A" />
              </TouchableOpacity>
              {showEndPicker && (
                <DateTimePicker
                  value={new Date(phase.end_date)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date(phase.start_date)}
                  onChange={(event, selectedDate) => {
                    setShowEndPicker(false);
                    if (selectedDate && event.type === 'set') {
                      handleUpdateDate('end', selectedDate);
                    }
                  }}
                />
              )}
            </View>
          </View>
        </View>

        <Text className="text-white font-bold text-lg mb-4 font-display">Treinos</Text>
        
        {workouts.map((workout) => (
          <TouchableOpacity
            key={workout.id}
            className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 mb-4 flex-row justify-between items-center"
            onPress={() => router.push(`/(tabs)/students/${user?.id}/workouts/details/${workout.id}` as any)}
          >
            <View>
              <Text className="text-white font-bold text-lg">{workout.title}</Text>
              <Text className="text-zinc-500 text-sm">
                {workout.items?.length || 0} exercícios
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#71717A" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Split Selection Modal */}
      <Modal
        visible={showSplitModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowSplitModal(false);
          setCustomSplit('');
        }}
      >
        <TouchableOpacity 
          className="flex-1 bg-black/80 justify-center items-center p-6"
          activeOpacity={1}
          onPress={() => {
            setShowSplitModal(false);
            setCustomSplit('');
          }}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View className="bg-zinc-900 w-full rounded-2xl p-6 border border-zinc-800">
              <Text className="text-white text-xl font-bold mb-2 text-center font-display">
                Divisão de Treino
              </Text>
              <Text className="text-zinc-400 text-sm mb-6 text-center">
                Cada letra representa um treino. Ex: ABC = Treino A, B e C
              </Text>
              
              {/* Custom Input */}
              <View className="mb-4">
                <Text className="text-zinc-400 text-xs mb-2 font-semibold">DIVISÃO CUSTOMIZADA</Text>
                <View className="flex-row gap-2">
                  <TextInput
                    value={customSplit}
                    onChangeText={(text: string) => setCustomSplit(text.toUpperCase())}
                    placeholder="Ex: ABCD"
                    placeholderTextColor="#52525B"
                    maxLength={10}
                    autoCapitalize="characters"
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white font-bold text-lg"
                  />
                  <TouchableOpacity
                    className="bg-orange-500 px-6 py-3 rounded-xl items-center justify-center"
                    onPress={() => handleSelectSplit()}
                  >
                    <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Quick Select */}
              <Text className="text-zinc-400 text-xs mb-3 font-semibold">SELEÇÃO RÁPIDA</Text>
              <View className="flex-row flex-wrap justify-center gap-3">
                {splits.map((split) => (
                  <TouchableOpacity
                    key={split}
                    className={`px-6 py-4 rounded-xl border ${
                      phase.training_split === split 
                        ? 'bg-orange-500 border-orange-500' 
                        : 'bg-zinc-950 border-zinc-800'
                    }`}
                    onPress={() => handleSelectSplit(split)}
                  >
                    <Text className={`font-bold text-lg ${
                      phase.training_split === split ? 'text-white' : 'text-zinc-400'
                    }`}>
                      {split}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScreenLayout>
  );
}
