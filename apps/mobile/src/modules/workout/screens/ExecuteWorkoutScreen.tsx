import { useAuthStore } from '@/auth';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { ShareWorkoutModal } from '@/components/workout/ShareWorkoutModal';
import { WorkoutFeedbackModal } from '@/components/workout/WorkoutFeedbackModal';
import { useVoiceCoach } from '@/hooks/useVoiceCoach';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useGamificationStore } from '@/store/gamificationStore';
import { getLocalDateISOString } from '@/utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ImageBackground, Text, TouchableOpacity, View } from 'react-native';
import { useWorkoutStore } from '../store/workoutStore';

const MUSCLE_IMAGES: Record<string, any> = {
  'Peito': require('../../../../assets/workouts/chest.png'),
  'Costas': require('../../../../assets/workouts/back.png'),
  'Pernas': require('../../../../assets/workouts/legs.png'),
  'Braços': require('../../../../assets/workouts/arms.png'),
  'Ombros': require('../../../../assets/workouts/shoulders.png'),
  'Abdominais': require('../../../../assets/workouts/abs.png'),
  'Geral': require('../../../../assets/workouts/back.png'),
};

export default function ExecuteWorkoutScreen() {
  const { id, workoutId } = useLocalSearchParams();
  const router = useRouter();
  const { user, isMasquerading } = useAuthStore();
  const { workouts, fetchWorkouts, isLoading } = useWorkoutStore();
  
  const [workout, setWorkout] = useState<any>(null);
  const [completedSets, setCompletedSets] = useState<Record<string, number>>({});
  const [isResting, setIsResting] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [currentRestItemId, setCurrentRestItemId] = useState<string | null>(null);

  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const { incrementWorkoutProgress } = useGamificationStore();
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
    announceExercise,
    announceSetStart, 
    announceRest, 
    announceFinish,
    announceResume,
    repeatLastInstruction
  } = useVoiceCoach();

  const handleExit = () => {
    if (isMasquerading) {
      router.replace('/(tabs)/workouts');
    } else {
      router.back();
    }
  };

  const handleVoiceCommand = async (action: any) => {
    if (action === 'next_set') {
        const nextItem = workout.items.find((item: any) => {
            const completed = completedSets[item.id] || 0;
            return completed < item.sets;
        });

        if (nextItem) {
            handleLogSet(nextItem);
        } else {
            announceFinish();
        }
    } else if (action === 'finish_workout') {
        handleFinishWorkout();
    } else if (action === 'pause_timer') {
         setIsActive(false); 
    } else if (action === 'resume_timer') {
         setIsActive(true);
         if (announceResume) announceResume();
    } else if (action === 'repeat_instruction') {
        repeatLastInstruction();
    }
  };

  const { isRecording, startListening, stopListening } = useVoiceInput({ 
      onCommand: handleVoiceCommand,
      continuous: true 
  });

  useEffect(() => {
     if (isWorkoutStarted) {
         startListening();
     } else {
         stopListening();
     }
     return () => { stopListening(); };
  }, [isWorkoutStarted]);

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
      
      if (currentRestItemId) {
          const item = workout?.items?.find((i: any) => i.id === currentRestItemId);
          if (item) {
              const nextSet = (completedSets[item.id] || 0) + 1;
              announceSetStart(nextSet, item.reps, item.weight);
          }
      }
      setCurrentRestItemId(null);
    }
    return () => clearInterval(interval);
  }, [isActive, timer, isResting, currentRestItemId]);

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

      if (currentCompleted + 1 < exerciseItem.sets) {
        setTimer(exerciseItem.rest_time || 60);
        setIsResting(true);
        setIsActive(true);
        setCurrentRestItemId(exerciseItem.id);
        announceRest(exerciseItem.rest_time || 60);
      } else {
        const myIndex = workout.items.indexOf(exerciseItem);
        if (myIndex < workout.items.length - 1) {
             const nextItem = workout.items[myIndex + 1];
             announceExercise(nextItem.exercise.name, nextItem.sets, nextItem.reps, nextItem.weight);
        }
      }
    }
  };

  const onFeedbackSubmit = async (intensity: number, notes: string) => {
    setShowFeedbackModal(false);
    announceFinish();
    try {
      if (!user?.id || !startTime) return;
      const endTime = new Date();
      const sessionItems = Object.entries(completedSets).map(([itemId, sets]) => ({
        workoutItemId: itemId,
        setsCompleted: sets
      }));

      await saveWorkoutSession({
        workoutId: workout.id,
        studentId: user.id,
        startedAt: startTime.toISOString(),
        completedAt: endTime.toISOString(),
        items: sessionItems,
        intensity,
        notes
      });

      const today = getLocalDateISOString();
      await incrementWorkoutProgress(today);

      Alert.alert(
        'Parabéns! 🎉',
        'Treino concluído e salvo com sucesso!',
        [
          { text: 'Sair', onPress: () => handleExit() },
          {
            text: 'Compartilhar 📸',
            onPress: () => {
              const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
              const durationFormatted = formatTime(Math.floor(durationSeconds));
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
      Alert.alert('Erro', 'Não foi possível salvar o treino. Tente novamente.');
    }
  };

  const handleFinishWorkout = () => {
    const totalSets = workout.items?.reduce((acc: number, item: any) => acc + item.sets, 0) || 0;
    const completedTotal = Object.values(completedSets).reduce((acc, val) => acc + val, 0);

    if (completedTotal < totalSets) {
      Alert.alert(
        'Treino Incompleto',
        `Você completou ${completedTotal} de ${totalSets} séries. Deseja finalizar mesmo assim?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Finalizar', style: 'destructive', onPress: () => setShowFeedbackModal(true) }
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

  const currentRestExercise = currentRestItemId 
    ? workout?.items?.find((i: any) => i.id === currentRestItemId)?.exercise?.name 
    : '';

  return (
    <ScreenLayout>
      <View className="absolute top-12 right-6 z-50 flex-row gap-3">
        {isWorkoutStarted && (
            <View className={`p-3 rounded-full border backdrop-blur-md ${isRecording ? 'bg-emerald-500/20 border-emerald-500' : 'bg-zinc-800/80 border-zinc-700'}`}>
               <Ionicons name={isRecording ? "mic" : "mic-off"} size={20} color={isRecording ? "#34D399" : "#71717A"} />
            </View>
        )}
        <TouchableOpacity onPress={toggleMute} className="bg-zinc-800/80 p-3 rounded-full border border-zinc-700 backdrop-blur-md">
          <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={20} color={isMuted ? "#71717A" : "#FF6B35"} />
        </TouchableOpacity>
      </View>

      {!isWorkoutStarted ? (
        <View className="flex-1 justify-center items-center p-8 bg-black">
          <View className="w-32 h-32 rounded-[40px] bg-orange-500/10 items-center justify-center mb-10 border border-orange-500/20 rotate-12">
            <Ionicons name="barbell" size={64} color="#FF6B35" />
          </View>
          
          <Text className="text-4xl font-black text-white text-center mb-2 font-display uppercase tracking-tight">
            {workout.title}
          </Text>
          <Text className="text-zinc-500 text-lg font-sans mb-12 text-center font-medium">
            {workout.items?.length} exercícios • {workout.items?.reduce((acc: number, item: any) => acc + item.sets, 0)} séries
          </Text>

          <TouchableOpacity onPress={() => { setIsWorkoutStarted(true); setStartTime(new Date()); const firstItem = workout.items?.[0]; if (firstItem) announceExercise(firstItem.exercise.name, firstItem.sets, firstItem.reps, firstItem.weight); }} className="w-full">
            <LinearGradient colors={['#FF6B35', '#FF2E63']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="rounded-3xl py-6 items-center justify-center shadow-2xl shadow-orange-500/40">
              <Text className="text-white text-xl font-black font-display tracking-widest">INICIAR TREINO</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleExit()} className="mt-8 py-2">
            <Text className="text-zinc-600 font-bold uppercase tracking-widest text-xs">Voltar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-1 bg-black">
          <View className="flex-row justify-between items-center px-6 py-8 bg-black">
            <TouchableOpacity onPress={() => { Alert.alert('Sair do Treino', 'Deseja realmente sair? O progresso não salvo será perdido.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sair', style: 'destructive', onPress: () => handleExit() }]); }} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View className="items-center flex-1 mx-4">
              <Text className="text-white text-xl font-black font-display text-center uppercase tracking-tight" numberOfLines={1}>{workout.title}</Text>
              <View className="bg-orange-500/10 px-2 py-0.5 rounded-full mt-1">
                <Text className="text-orange-500 text-[10px] font-black uppercase tracking-widest">{workout.items?.length} MOVIMENTOS</Text>
              </View>
            </View>
            <View className="w-12" />
          </View>

          <FlatList
            data={workout.items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 24, paddingBottom: 150 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const completed = completedSets[item.id] || 0;
              const isCompleted = completed >= item.sets;
              const muscleGroup = item.exercise.muscle_group || 'Geral';
              const bgImage = MUSCLE_IMAGES[muscleGroup] || MUSCLE_IMAGES['Geral'];
              
              return (
                <View className="mb-6 rounded-[32px] overflow-hidden border border-zinc-800 bg-zinc-900/50">
                  <ImageBackground source={bgImage} className="h-32" resizeMode="cover">
                    <LinearGradient colors={['rgba(24,24,27,0.2)', 'rgba(24,24,27,0.95)']} className="flex-1 p-5 justify-end">
                       <View className="flex-row justify-between items-center">
                          <View>
                             <Text className="text-white text-xl font-black font-display uppercase tracking-tight">{item.exercise.name}</Text>
                             <Text className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{muscleGroup}</Text>
                          </View>
                          {isCompleted && <View className="bg-emerald-500 w-8 h-8 rounded-full items-center justify-center"><Ionicons name="checkmark" size={18} color="white" /></View>}
                       </View>
                    </LinearGradient>
                  </ImageBackground>

                  <View className="p-5">
                    <View className="flex-row justify-between mb-6 bg-zinc-800/30 p-4 rounded-2xl border border-zinc-800/50">
                        <View className="items-center px-2">
                          <Text className="text-zinc-600 text-[10px] font-black uppercase mb-1">Séries</Text>
                          <Text className="text-white font-black text-lg">{item.sets}</Text>
                        </View>
                        <View className="w-[1px] bg-zinc-800 h-full" />
                        <View className="items-center px-2">
                          <Text className="text-zinc-600 text-[10px] font-black uppercase mb-1">Reps</Text>
                          <Text className="text-white font-black text-lg">{item.reps}</Text>
                        </View>
                        <View className="w-[1px] bg-zinc-800 h-full" />
                        <View className="items-center px-2">
                          <Text className="text-zinc-600 text-[10px] font-black uppercase mb-1">Carga</Text>
                          <Text className="text-white font-black text-lg">{item.weight || '-'}kg</Text>
                        </View>
                    </View>

                    <View className="flex-row items-center gap-3">
                      <View className="flex-1 h-12 bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800">
                         <View className={`h-full ${isCompleted ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{ width: `${(completed / item.sets) * 100}%` }} />
                         <View className="absolute inset-0 items-center justify-center">
                            <Text className="text-white font-black text-[10px] uppercase tracking-widest">{completed} / {item.sets} CONCLUÍDOS</Text>
                         </View>
                      </View>
                      
                      {!isCompleted && (
                        <TouchableOpacity onPress={() => handleLogSet(item)} activeOpacity={isResting ? 1 : 0.7} className={`h-12 px-6 rounded-xl flex-row items-center justify-center ${isResting ? 'bg-zinc-800 opacity-50' : 'bg-orange-500 shadow-lg shadow-orange-500/20'}`}>
                          <Text className="text-white font-black text-xs uppercase tracking-widest">{isResting ? 'Aguarde' : 'Check'}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
          />

          <View className="absolute bottom-0 left-0 right-0 bg-black/80 p-6 pb-12 border-t border-zinc-900">
            {isResting ? (
              <LinearGradient colors={['#18181B', '#09090B']} className="flex-row items-center justify-between p-6 rounded-[24px] border border-zinc-800">
                <View>
                  <Text className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Descanso Ativo</Text>
                  <Text className="text-white font-bold text-sm uppercase" numberOfLines={1}>{currentRestExercise}</Text>
                </View>
                <View className="flex-row items-center gap-6">
                  <Text className="text-4xl font-black text-orange-500 font-display">{formatTime(timer)}</Text>
                  <TouchableOpacity onPress={() => { setIsResting(false); setIsActive(false); setTimer(0); if (announceResume) announceResume(); }} className="bg-zinc-800 p-3 rounded-2xl border border-zinc-700">
                    <Ionicons name="play-skip-forward" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            ) : (
              <TouchableOpacity onPress={handleFinishWorkout} className="w-full">
                <LinearGradient colors={['#FF6B35', '#FF2E63']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="rounded-2xl py-5 items-center justify-center shadow-xl shadow-orange-500/20">
                  <Text className="text-white text-lg font-black font-display uppercase tracking-widest">FINALIZAR TREINO</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <ShareWorkoutModal visible={showShareModal} onClose={() => { setShowShareModal(false); handleExit(); }} stats={shareStats} />
      <WorkoutFeedbackModal visible={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} onSubmit={onFeedbackSubmit} />
    </ScreenLayout>
  );
}


