import { useAuthStore } from '@/auth';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { ShareWorkoutModal } from '@/components/workout/ShareWorkoutModal';
import { WorkoutFeedbackModal } from '@/components/workout/WorkoutFeedbackModal';
import { useVoiceCoach } from '@/hooks/useVoiceCoach';
import { useGamificationStore } from '@/store/gamificationStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useWorkoutStore } from '../store/workoutStore';

export default function ExecuteWorkoutScreen() {
  const { id, workoutId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { workouts, fetchWorkouts, isLoading } = useWorkoutStore();
  
  const [workout, setWorkout] = useState<any>(null);
  // Track completed sets for each exercise: { [exerciseId]: numberOfCompletedSets }
  const [completedSets, setCompletedSets] = useState<Record<string, number>>({});
  const [isResting, setIsResting] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [currentRestExercise, setCurrentRestExercise] = useState<string | null>(null);

  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const { updateWorkoutProgress } = useGamificationStore();
  const { saveWorkoutSession } = useWorkoutStore();

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareStats, setShareStats] = useState({
    title: '',
    duration: '',
    calories: '',
    date: '',
    exerciseName: ''
  });

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  const { 
    isMuted, 
    toggleMute, 
    motivateStart, 
    motivateRest, 
    motivateResume, 
    motivateFinish 
  } = useVoiceCoach();

  useEffect(() => {
    if (user?.id && !workouts.length) {
      fetchWorkouts(user.id);
    }
  }, [user]);

  useEffect(() => {
    const targetId = (workoutId || id) as string;
    if (workouts.length > 0 && targetId) {
      const found = workouts.find(w => w.id === targetId);
      setWorkout(found);
      
      // Initialize completed sets if needed (optional, could just rely on empty object)
      if (found) {
        const initialSets: Record<string, number> = {};
        found.items?.forEach((item: any) => {
          initialSets[item.id] = 0;
        });
        setCompletedSets(initialSets);
      }
    }
  }, [workouts, id, workoutId]);

  useEffect(() => {
    let interval: any;
    if (isActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && isResting) {
      setIsResting(false);
      setIsActive(false);
      setCurrentRestExercise(null);
      motivateResume();
      Alert.alert('Tempo esgotado!', 'Hora da próxima série!');
    }
    return () => clearInterval(interval);
  }, [isActive, timer, isResting]);

  if (isLoading || !workout) {
    return (
      <ScreenLayout className="justify-center items-center">
        <ActivityIndicator size="large" color="#FF6B35" />
      </ScreenLayout>
    );
  }

  const handleLogSet = (exerciseItem: any) => {
    if (isResting) {
      Alert.alert('Descanso', 'Aguarde o tempo de descanso terminar ou pule o descanso.');
      return;
    }

    const currentCompleted = completedSets[exerciseItem.id] || 0;
    
    if (currentCompleted < exerciseItem.sets) {
      setCompletedSets(prev => ({
        ...prev,
        [exerciseItem.id]: currentCompleted + 1
      }));

      // Start rest timer if not the last set
      if (currentCompleted + 1 < exerciseItem.sets) {
        setTimer(exerciseItem.rest_time || 60);
        setIsResting(true);
        setIsActive(true);

        setCurrentRestExercise(exerciseItem.exercise.name);
        motivateRest(exerciseItem.rest_time || 60);
      }
    }
  };

  const onFeedbackSubmit = async (intensity: number, notes: string) => {
    setShowFeedbackModal(false);
    motivateFinish();
    try {
      if (!user?.id || !startTime) return;

      const endTime = new Date();
      
      // Prepare items data
      const sessionItems = Object.entries(completedSets).map(([itemId, sets]) => ({
        workoutItemId: itemId,
        setsCompleted: sets
      }));

      // Save session
      await saveWorkoutSession({
        workoutId: workout.id,
        studentId: user.id,
        startedAt: startTime.toISOString(),
        completedAt: endTime.toISOString(),
        items: sessionItems,
        intensity,
        notes
      });

      // Update gamification
      await updateWorkoutProgress(1);

      Alert.alert(
        'Parabéns! 🎉',
        'Treino concluído e salvo com sucesso!',
        [
          {
            text: 'Sair',
            onPress: () => {
              router.back();
            }
          },
          {
            text: 'Compartilhar 📸',
            onPress: () => {
              // Calculate total duration
              const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
              const durationFormatted = formatTime(Math.floor(durationSeconds));
              
              // Estimate calories (very rough estimate for weight training: ~3-4 METs)
              // 3.5 METs * 70kg * hours
              const estimatedCalories = Math.round(3.5 * 70 * (durationSeconds / 3600));

              setShareStats({
                title: 'Treino Concluído',
                duration: durationFormatted,
                calories: `${estimatedCalories} kcal`,
                date: new Date().toLocaleDateString('pt-BR'),
                exerciseName: workout.title
              });
              setShowShareModal(true);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Erro', 'Não foi possível salvar o treino. Tente novamente.');
    }
  };

  const handleFinishWorkout = () => {
    // Check if all sets are completed
    const totalSets = workout.items?.reduce((acc: number, item: any) => acc + item.sets, 0) || 0;
    const completedTotal = Object.values(completedSets).reduce((acc, val) => acc + val, 0);

    if (completedTotal < totalSets) {
      Alert.alert(
        'Treino Incompleto',
        `Você completou ${completedTotal} de ${totalSets} séries. Deseja finalizar mesmo assim?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Finalizar', 
            style: 'destructive',
            onPress: () => setShowFeedbackModal(true)
          }
        ]
      );
    } else {
      setShowFeedbackModal(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <ScreenLayout>
      <View className="absolute top-12 right-6 z-50">
        <TouchableOpacity 
          onPress={toggleMute}
          className="bg-zinc-800/80 p-3 rounded-full border border-zinc-700 backdrop-blur-md"
        >
          <Ionicons 
            name={isMuted ? "volume-mute" : "volume-high"} 
            size={24} 
            color={isMuted ? "#71717A" : "#FF6B35"} 
          />
        </TouchableOpacity>
      </View>

      {!isWorkoutStarted ? (
        <View className="flex-1 justify-center items-center p-6">
          <View className="w-32 h-32 rounded-full bg-orange-500/10 items-center justify-center mb-8 border-4 border-orange-500/20">
            <Ionicons name="barbell" size={64} color="#FF6B35" />
          </View>
          
          <Text className="text-3xl font-extrabold text-white text-center mb-2 font-display">
            {workout.title}
          </Text>
          <Text className="text-zinc-400 text-lg font-sans mb-12 text-center">
            {workout.items?.length} exercícios • {workout.items?.reduce((acc: number, item: any) => acc + item.sets, 0)} séries totais
          </Text>

          <TouchableOpacity 
            onPress={() => {
              setIsWorkoutStarted(true);
              setStartTime(new Date());
              motivateStart(user?.user_metadata?.full_name);
            }}
            className="w-full"
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF6B35', '#FF2E63']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-2xl py-5 items-center justify-center shadow-lg shadow-orange-500/40"
            >
              <Text className="text-white text-xl font-bold font-display tracking-wide">
                INICIAR TREINO
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.back()}
            className="mt-6 py-3"
          >
            <Text className="text-zinc-500 font-bold">Voltar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-1">
          {/* Header */}
          <View className="flex-row justify-between items-center p-6 pb-4 bg-zinc-900 border-b border-zinc-800">
            <TouchableOpacity 
              onPress={() => {
                Alert.alert(
                  'Sair do Treino',
                  'Deseja realmente sair? O progresso não salvo será perdido.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Sair', style: 'destructive', onPress: () => router.back() }
                  ]
                );
              }} 
              className="bg-zinc-950 p-2 rounded-xl border border-zinc-800"
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View className="items-center flex-1 mx-4">
              <Text className="text-white text-lg font-bold font-display text-center" numberOfLines={1}>
                {workout.title}
              </Text>
              <Text className="text-zinc-400 text-xs font-sans">
                {workout.items?.length} exercícios
              </Text>
            </View>
            <View className="w-10" />
          </View>

          {/* Exercises List */}
          <FlatList
            data={workout.items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
            renderItem={({ item }) => {
              const completed = completedSets[item.id] || 0;
              const isCompleted = completed >= item.sets;
              const isCardio = item.exercise.muscle_group === 'Cardio' || ['Esteira', 'Bicicleta', 'Elíptico', 'Caminhada', 'Corrida'].some(c => item.exercise.name.includes(c));
              
              return (
                <View className={`mb-4 rounded-2xl border ${isCompleted ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-zinc-900 border-zinc-800'} overflow-hidden`}>
                  <View className="p-4">
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1 mr-4">
                        <Text className={`text-lg font-bold font-display ${isCompleted ? 'text-emerald-400' : 'text-white'}`}>
                          {item.exercise.name}
                        </Text>
                        <Text className="text-zinc-400 text-sm">
                          {item.exercise.muscle_group}
                        </Text>
                      </View>
                      {isCompleted && (
                        <View className="bg-emerald-500/20 p-1 rounded-full">
                          <Ionicons name="checkmark" size={16} color="#34D399" />
                        </View>
                      )}
                    </View>

                    {isCardio ? (
                      <View>
                        <Text className="text-zinc-400 text-sm mb-4">
                          Exercício de longa duração. Utilize o modo Cardio para monitorar.
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            router.push({
                              pathname: '/(tabs)/workouts/cardio/[id]',
                              params: { 
                                id: item.id,
                                exerciseId: item.exercise.id,
                                exerciseName: item.exercise.name,
                                muscleGroup: item.exercise.muscle_group
                              }
                            });
                          }}
                          className="bg-orange-500/10 border border-orange-500/50 p-4 rounded-xl flex-row items-center justify-center"
                        >
                          <Ionicons name="timer-outline" size={24} color="#FF6B35" style={{ marginRight: 8 }} />
                          <Text className="text-orange-500 font-bold text-base">
                            INICIAR SESSÃO CARDIO
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
                        <View className="flex-row gap-4 mb-4">
                          <View className="items-center">
                            <Text className="text-zinc-500 text-xs uppercase font-bold">Séries</Text>
                            <Text className="text-white font-bold text-lg">{item.sets}</Text>
                          </View>
                          <View className="items-center">
                            <Text className="text-zinc-500 text-xs uppercase font-bold">Reps</Text>
                            <Text className="text-white font-bold text-lg">{item.reps}</Text>
                          </View>
                          <View className="items-center">
                            <Text className="text-zinc-500 text-xs uppercase font-bold">Carga</Text>
                            <Text className="text-white font-bold text-lg">{item.weight || '-'}kg</Text>
                          </View>
                          <View className="items-center">
                            <Text className="text-zinc-500 text-xs uppercase font-bold">Descanso</Text>
                            <Text className="text-white font-bold text-lg">{item.rest_time}s</Text>
                          </View>
                        </View>

                        <View className="flex-row items-center justify-between bg-zinc-950/50 rounded-xl p-3">
                          <Text className="text-zinc-400 font-bold">
                            Progresso: <Text className="text-white">{completed}/{item.sets}</Text>
                          </Text>
                          
                          {!isCompleted && (
                            <TouchableOpacity
                              onPress={() => handleLogSet(item)}
                              activeOpacity={isResting ? 1 : 0.7}
                              className={`px-4 py-2 rounded-lg border flex-row items-center ${
                                isResting 
                                  ? 'bg-zinc-800 border-zinc-700 opacity-50' 
                                  : 'bg-zinc-800 border-zinc-700'
                              }`}
                            >
                              {isResting ? (
                                <Ionicons name="hourglass-outline" size={18} color="#71717A" style={{ marginRight: 6 }} />
                              ) : (
                                <Ionicons name="checkmark-circle-outline" size={18} color="#FF6B35" style={{ marginRight: 6 }} />
                              )}
                              <Text className={`font-bold text-sm ${isResting ? 'text-zinc-500' : 'text-white'}`}>
                                {isResting ? 'Descanso...' : 'Registrar Série'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </>
                    )}
                  </View>
                  
                  {/* Progress Bar */}
                  <View className="h-1 bg-zinc-800 w-full">
                    <View 
                      className={`h-full ${isCompleted ? 'bg-emerald-500' : 'bg-orange-500'}`} 
                      style={{ width: `${(completed / item.sets) * 100}%` }} 
                    />
                  </View>
                </View>
              );
            }}
          />

          {/* Footer / Timer Overlay */}
          <View className="absolute bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-4 pb-8 shadow-lg shadow-black">
            {isResting ? (
              <View className="flex-row items-center justify-between bg-zinc-800 p-4 rounded-2xl border border-zinc-700 mb-2">
                <View>
                  <Text className="text-zinc-400 text-xs font-bold uppercase">Descanso</Text>
                  <Text className="text-white font-bold text-sm" numberOfLines={1}>
                    {currentRestExercise}
                  </Text>
                </View>
                <View className="flex-row items-center gap-4">
                  <Text className="text-3xl font-mono font-bold text-cyan-400">
                    {formatTime(timer)}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => {
                      setIsResting(false);
                      setIsActive(false);
                      setTimer(0);
                      motivateResume();
                    }}
                    className="bg-zinc-700 p-2 rounded-full"
                  >
                    <Ionicons name="play-skip-forward" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                onPress={handleFinishWorkout}
                className="w-full"
              >
                <LinearGradient
                  colors={['#FF6B35', '#FF2E63']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="rounded-2xl py-4 items-center justify-center shadow-lg shadow-orange-500/20"
                >
                  <Text className="text-white text-lg font-bold font-display">
                    FINALIZAR TREINO
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <ShareWorkoutModal
        visible={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          router.back();
        }}
        stats={shareStats}
      />

      <WorkoutFeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={onFeedbackSubmit}
      />
    </ScreenLayout>
  );
}
