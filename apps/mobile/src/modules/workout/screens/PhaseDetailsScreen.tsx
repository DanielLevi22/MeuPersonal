import { useAuthStore } from '@/auth';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useWorkoutStore } from '../store/workoutStore';

export default function PhaseDetailsScreen() {
  const { phaseId } = useLocalSearchParams();
  const router = useRouter();
  const { user, accountType } = useAuthStore();
  const pathname = usePathname();
  const isStudentView = pathname.includes('/students/') || accountType === 'managed_student' || accountType === 'autonomous_student';
  


  const { 
    currentPeriodizationPhases, 
    updateTrainingPlan, 
    deleteTrainingPlan, 
    createWorkout, 
    fetchWorkoutsForPhase, 
    generateWorkoutsForPhase, 
    workouts,
    fetchLastWorkoutSession 
  } = useWorkoutStore();
  
  const phase = currentPeriodizationPhases.find(p => p.id === phaseId);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [customSplit, setCustomSplit] = useState('');
  const [pendingSplit, setPendingSplit] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedWorkout, setSuggestedWorkout] = useState<any>(null);
  const [isWorkoutDoneToday, setIsWorkoutDoneToday] = useState(false);

  const splits = ['A', 'AB', 'ABC', 'ABCD', 'ABCDE', 'ABCDEF'];

  useEffect(() => {
    if (phase?.id) {
      fetchWorkoutsForPhase(phase.id);
    }
  }, [phase?.id]);

  useEffect(() => {
      const determineSuggested = async () => {
          if (!user?.id || workouts.length === 0) return;

          const lastSession = await fetchLastWorkoutSession(user.id);
          
          if (!lastSession) {
              // No history, suggest first one
              setSuggestedWorkout(workouts[0]);
              return;
          }

          // Check if done today
          const lastDate = new Date(lastSession.completed_at).toDateString();
          const today = new Date().toDateString();
          
          if (lastDate === today) {
              setIsWorkoutDoneToday(true);
          }

          const lastIndex = workouts.findIndex(w => w.id === lastSession.workout_id);
          
          if (lastIndex === -1) {
              // Last workout not in this list (maybe from another phase), suggest first
              setSuggestedWorkout(workouts[0]);
          } else {
              // Suggest next, rotating
              const nextIndex = (lastIndex + 1) % workouts.length;
              setSuggestedWorkout(workouts[nextIndex]);
          }
      };

      determineSuggested();
  }, [workouts, user?.id]);

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
      setPendingSplit(finalSplit);
      setShowWarningModal(true);
      setShowSplitModal(false); // Close split selector to focus on warning
    } else {
      executeSplitChange(finalSplit);
    }
  };

  const executeSplitChange = async (finalSplit: string) => {
    if (!phase || !user?.id) return;
    
    setIsGenerating(true);
    try {
      await generateWorkoutsForPhase(phase.id, finalSplit, user.id);
      setShowSplitModal(false);
      setCustomSplit('');
      Alert.alert('Sucesso', `Treinos para divisão ${finalSplit} gerados!`);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível gerar os treinos.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!phase) return;
    
    const newStatus = phase.status === 'draft' ? 'active' : 
                     phase.status === 'active' ? 'completed' : 'draft';
    
    const statusLabel = newStatus === 'draft' ? 'Rascunho' :
                       newStatus === 'active' ? 'Ativo' : 'Concluído';
    
    Alert.alert(
      'Alterar Status',
      `Deseja alterar o status desta fase para "${statusLabel}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await updateTrainingPlan(phase.id, { status: newStatus });
              Alert.alert('Sucesso', `Status alterado para ${statusLabel}!`);
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível alterar o status.');
            }
          }
        }
      ]
    );
  };

  const handleDeletePhase = async () => {
    if (!phase) return;
    
    Alert.alert(
      'Excluir Fase',
      `Tem certeza que deseja excluir a fase "${phase.name}"? Todos os treinos e exercícios desta fase serão perdidos. Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await useWorkoutStore.getState().deleteTrainingPlan(phase.id);
              Alert.alert('Sucesso', 'Fase excluída!');
              router.back();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir a fase.');
            }
          }
        }
      ]
    );
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
        {!isStudentView && (
          <View className="flex-row gap-2">
            <TouchableOpacity 
              onPress={handleToggleStatus}
              className="bg-zinc-950 p-2 rounded-xl border border-zinc-800"
            >
              <Ionicons 
                name={phase.status === 'draft' ? 'play-circle' : phase.status === 'active' ? 'checkmark-circle' : 'refresh-circle'} 
                size={24} 
                color={phase.status === 'draft' ? '#FFB800' : phase.status === 'active' ? '#00C9A7' : '#71717A'} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleDeletePhase}
              className="bg-zinc-950 p-2 rounded-xl border border-zinc-800"
            >
              <Ionicons name="trash" size={24} color="#FF2E63" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView className="p-6" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 mb-6">
          <Text className="text-zinc-400 text-sm mb-1">Divisão de Treino</Text>
          <TouchableOpacity 
            onPress={() => !isStudentView && setShowSplitModal(true)}
            activeOpacity={isStudentView ? 1 : 0.7}
            className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 flex-row items-center justify-between mt-1"
          >
            <Text className="text-white font-bold text-lg uppercase">
              {phase.training_split || 'Selecionar'}
            </Text>
            {!isStudentView && <Ionicons name="chevron-down" size={20} color="#71717A" />}
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
                onPress={() => !isStudentView && setShowStartPicker(true)}
                activeOpacity={isStudentView ? 1 : 0.7}
                className="bg-zinc-800 p-2 rounded-lg border border-zinc-700 flex-row items-center justify-between"
              >
                <Text className="text-white font-bold text-sm">
                  {new Date(phase.start_date).toLocaleDateString('pt-BR')}
                </Text>
                {!isStudentView && <Ionicons name="calendar-outline" size={14} color="#71717A" />}
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
                onPress={() => !isStudentView && setShowEndPicker(true)}
                activeOpacity={isStudentView ? 1 : 0.7}
                className="bg-zinc-800 p-2 rounded-lg border border-zinc-700 flex-row items-center justify-between"
              >
                <Text className="text-white font-bold text-sm">
                  {new Date(phase.end_date).toLocaleDateString('pt-BR')}
                </Text>
                {!isStudentView && <Ionicons name="calendar-outline" size={14} color="#71717A" />}
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

        <Text className="text-white font-bold text-lg mb-4 font-display">Treino do Dia</Text>

        {workouts.length === 0 ? (
          <View className="items-center justify-center py-10">
            <View className="bg-zinc-900 p-8 rounded-full mb-6 border border-zinc-800">
              <Ionicons name="walk" size={64} color="#52525B" />
            </View>
            <Text className="text-zinc-500 font-sans text-center">
              Nenhum treino cadastrado nesta fase.
            </Text>
          </View>
        ) : (
          <>
            {/* Suggested Workout Card */}
            {suggestedWorkout && (
                <TouchableOpacity
                    activeOpacity={isWorkoutDoneToday ? 1 : 0.9}
                    onPress={() => {
                        if (isWorkoutDoneToday) {
                            Alert.alert('Meta Atingida! 🏆', 'Você já treinou hoje. Descanse para voltar mais forte amanhã!');
                            return;
                        }

                        const isProfessional = (accountType as string) === 'personal' || (accountType as string) === 'professional';
                        const path = isProfessional
                            ? '/(tabs)/workouts/details/[id]'
                            : isStudentView
                                ? `/(tabs)/students/${user?.id}/workouts/details/${suggestedWorkout.id}`
                                : `/(tabs)/workouts/details/${suggestedWorkout.id}`;
                        
                        const params = isProfessional ? { id: suggestedWorkout.id, workoutId: suggestedWorkout.id, studentId: user?.id } : {};

                        router.push(isProfessional ? { pathname: path, params } as any : path as any);
                    }}
                    className="mb-8"
                >
                    <LinearGradient
                        colors={isWorkoutDoneToday ? ['#18181B', '#18181B'] : ['#FF6B35', '#FF2E63']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className={`p-6 rounded-3xl ${isWorkoutDoneToday ? 'border border-zinc-800' : 'shadow-lg shadow-orange-500/30'}`}
                    >
                        <View className="flex-row justify-between items-start mb-4">
                            <View className={`${isWorkoutDoneToday ? 'bg-zinc-800' : 'bg-white/20'} px-3 py-1 rounded-full`}>
                                <Text className={`${isWorkoutDoneToday ? 'text-zinc-400' : 'text-white'} font-bold text-xs uppercase`}>
                                    {isWorkoutDoneToday ? 'Concluído' : 'Sugerido para hoje'}
                                </Text>
                            </View>
                            <Ionicons name={isWorkoutDoneToday ? "checkmark-circle" : "flame"} size={24} color={isWorkoutDoneToday ? "#4ADE80" : "white"} />
                        </View>
                        
                        <Text className={`${isWorkoutDoneToday ? 'text-zinc-400' : 'text-white'} text-3xl font-extrabold font-display mb-2`}>
                            {isWorkoutDoneToday ? 'Treino Finalizado' : suggestedWorkout.title}
                        </Text>
                        
                        {isWorkoutDoneToday ? (
                             <Text className="text-zinc-500 font-medium">
                                Bom descanso! O próximo treino será: {suggestedWorkout.title}
                             </Text>
                        ) : (
                            <View className="flex-row items-center gap-4">
                                <View className="flex-row items-center bg-black/10 px-3 py-1.5 rounded-lg">
                                    <Ionicons name="barbell" size={16} color="white" style={{ marginRight: 6 }} />
                                    <Text className="text-white font-medium">
                                        {suggestedWorkout.items?.length || 0} exercícios
                                    </Text>
                                </View>
                                <View className="flex-row items-center bg-black/10 px-3 py-1.5 rounded-lg">
                                    <Ionicons name="time" size={16} color="white" style={{ marginRight: 6 }} />
                                    <Text className="text-white font-medium">~60 min</Text>
                                </View>
                            </View>
                        )}

                        {!isWorkoutDoneToday && (
                            <View className="mt-6 bg-white py-3 rounded-xl items-center">
                                <Text className="text-orange-600 font-bold text-base">COMEÇAR TREINO</Text>
                            </View>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            )}

            {/* List Header */}
            <View className="flex-row items-center justify-between mb-4 mt-2">
                <Text className="text-zinc-400 font-bold text-sm uppercase tracking-wider">Todos os Treinos</Text>
                <View className="h-[1px] flex-1 bg-zinc-800 ml-4" />
            </View>

            {/* Other Workouts List */}
             {workouts.map((workout) => (
                <TouchableOpacity
                    key={workout.id}
                    className={`bg-zinc-900 p-4 rounded-2xl border border-zinc-800 mb-3 flex-row justify-between items-center ${workout.id === suggestedWorkout?.id ? 'opacity-50' : ''} ${isWorkoutDoneToday ? 'opacity-30' : ''}`}
                    onPress={() => {
                        if (isWorkoutDoneToday) {
                             Alert.alert('Atenção', 'Você já treinou hoje.');
                             return;
                        }

                        const isProfessional = (accountType as string) === 'personal' || (accountType as string) === 'professional';
                        const path = isProfessional
                            ? '/(tabs)/workouts/details/[id]'
                            : isStudentView
                                ? `/(tabs)/students/${user?.id}/workouts/details/${workout.id}`
                                : `/(tabs)/workouts/details/${workout.id}`;

                         const params = isProfessional ? { id: workout.id, workoutId: workout.id, studentId: user?.id } : {};
                         
                        router.push(isProfessional ? { pathname: path, params } as any : path as any);
                    }}
                >
                    <View className="flex-row items-center flex-1">
                        <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${workout.id === suggestedWorkout?.id ? 'bg-orange-500/20' : 'bg-zinc-800'}`}>
                            <Text className={`font-bold ${workout.id === suggestedWorkout?.id ? 'text-orange-500' : 'text-zinc-500'}`}>
                                {workout.title.charAt(workout.title.length - 1)}
                            </Text>
                        </View>
                        <View>
                            <Text className={`text-base font-bold ${workout.id === suggestedWorkout?.id ? 'text-zinc-400' : 'text-white'}`}>
                                {workout.title}
                            </Text>
                            <Text className="text-zinc-500 text-xs">
                                {workout.items?.length || 0} exercícios
                            </Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#52525B" />
                </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>

      {/* Split Selection Modal */}
      <Modal
        visible={showSplitModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isGenerating) {
            setShowSplitModal(false);
            setCustomSplit('');
          }
        }}
      >
        <TouchableOpacity 
          className="flex-1 bg-black/80 justify-center items-center p-6"
          activeOpacity={1}
          onPress={() => {
            if (!isGenerating) {
              setShowSplitModal(false);
              setCustomSplit('');
            }
          }}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View className="bg-zinc-900 w-full rounded-2xl p-6 border border-zinc-800">
              <Text className="text-white text-xl font-bold mb-2 text-center font-display">
                Divisão de Treino
              </Text>
              
              {isGenerating ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="large" color="#FF6B35" />
                  <Text className="text-zinc-400 text-sm mt-4 text-center">
                    Gerando treinos para a divisão...
                  </Text>
                  <Text className="text-zinc-600 text-xs mt-2 text-center">
                    Isso pode levar alguns segundos.
                  </Text>
                </View>
              ) : (
                <>
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
                </>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Warning Modal */}
      <Modal
        visible={showWarningModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWarningModal(false)}
      >
        <TouchableOpacity 
          className="flex-1 bg-black/80 justify-center items-center p-6"
          activeOpacity={1}
          onPress={() => setShowWarningModal(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View className="bg-zinc-900 w-full rounded-2xl p-6 border border-zinc-800 items-center">
              <View className="w-16 h-16 rounded-full bg-red-500/10 items-center justify-center mb-4 border border-red-500/20">
                <Ionicons name="warning-outline" size={32} color="#EF4444" />
              </View>
              
              <Text className="text-white text-xl font-bold mb-2 text-center font-display">
                Atenção!
              </Text>
              
              <Text className="text-zinc-400 text-sm mb-6 text-center leading-relaxed">
                Você possui <Text className="font-bold text-white">{workouts.length} treinos</Text> configurados.{'\n'}
                Ao mudar a divisão, <Text className="text-red-400 font-bold">TODOS os treinos e exercícios serão deletados</Text> permanentemente.
              </Text>

              <View className="flex-row gap-3 w-full">
                <TouchableOpacity
                  className="flex-1 py-4 rounded-xl bg-zinc-800 border border-zinc-700 items-center"
                  onPress={() => {
                    setShowWarningModal(false);
                    setPendingSplit('');
                  }}
                >
                  <Text className="text-zinc-300 font-bold">Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 py-4 rounded-xl bg-red-500/10 border border-red-500/50 items-center"
                  onPress={() => {
                    setShowWarningModal(false);
                    if (pendingSplit) {
                      // Slight delay to allow modal to close smoothly before loading starts
                      setTimeout(() => {
                        executeSplitChange(pendingSplit);
                      }, 200);
                    }
                  }}
                >
                  <Text className="text-red-500 font-bold">Deletar tudo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScreenLayout>
  );
}
