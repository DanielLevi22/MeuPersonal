import { RestTimer } from '@/workout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useAuthStore } from '@/auth';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@meupersonal/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ExerciseDetailScreen() {
  const { exerciseId, sessionId, workoutId } = useLocalSearchParams();
  const { user } = useAuthStore();
  const router = useRouter();

  const [exercise, setExercise] = useState<any>(null);
  const [completedSets, setCompletedSets] = useState<Set<number>>(new Set());
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showTimer, setShowTimer] = useState(false);
  const [currentSet, setCurrentSet] = useState<number | null>(null);
  const [isRestingBetweenSets, setIsRestingBetweenSets] = useState(false);

  useEffect(() => {
    fetchExerciseDetails();
  }, [exerciseId]);

  const fetchExerciseDetails = async () => {
    try {
      // Fetch exercise details from workout_items
      const { data, error } = await supabase
        .from('workout_items')
        .select(`
          id,
          sets,
          reps,
          weight,
          rest_time,
          exercise:exercises (
            id,
            name,
            muscle_group,
            video_url
          )
        `)
        .eq('id', exerciseId)
        .single();

      if (error) throw error;

      const transformed = {
        ...data,
        exercise: Array.isArray(data.exercise) ? data.exercise[0] : data.exercise,
      };

      setExercise(transformed);

      // Load completion status
      const { data: logData } = await supabase
        .from('workout_exercise_logs')
        .select('sets_completed, completed')
        .eq('workout_session_id', sessionId)
        .eq('workout_item_id', exerciseId)
        .single();

      if (logData) {
        const sets = new Set<number>();
        for (let i = 0; i < logData.sets_completed; i++) {
          sets.add(i);
        }
        setCompletedSets(sets);
        setIsCompleted(logData.completed);
      }
    } catch (error: any) {
      console.error('Error fetching exercise:', error);
      Alert.alert('Erro', 'Não foi possível carregar o exercício.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSetCompletion = (setIndex: number) => {
    // Don't allow unmarking completed sets
    if (completedSets.has(setIndex)) {
      Alert.alert('Série Concluída', 'Você não pode desmarcar uma série já concluída.');
      return;
    }

    // Don't allow marking if currently resting
    if (isRestingBetweenSets) {
      Alert.alert('Aguarde', 'Complete o descanso antes de marcar a próxima série.');
      return;
    }

    // Only allow marking the next sequential set
    const expectedNextSet = completedSets.size;
    if (setIndex !== expectedNextSet) {
      Alert.alert('Ordem Incorreta', `Complete a Série ${expectedNextSet + 1} primeiro.`);
      return;
    }

    // Mark the set as completed
    const newCompleted = new Set(completedSets);
    newCompleted.add(setIndex);
    setCompletedSets(newCompleted);
    updateExerciseLog(newCompleted.size, false);
    
    // Always start timer after completing a set (including the last one for recovery)
    setCurrentSet(setIndex);
    setShowTimer(true);
    setIsRestingBetweenSets(true);
  };

  const handleTimerComplete = () => {
    // Timer finished, unlock next set
    setShowTimer(false);
    setIsRestingBetweenSets(false);
    setCurrentSet(null);
  };

  const updateExerciseLog = async (setsCompleted: number, completed: boolean) => {
    try {
      // Check if log exists
      const { data: existing } = await supabase
        .from('workout_exercise_logs')
        .select('id')
        .eq('workout_session_id', sessionId)
        .eq('workout_item_id', exerciseId)
        .single();

      if (existing) {
        // Update existing log
        await supabase
          .from('workout_exercise_logs')
          .update({
            sets_completed: setsCompleted,
            completed,
            completed_at: completed ? new Date().toISOString() : null
          })
          .eq('id', existing.id);
      } else {
        // Create new log
        await supabase
          .from('workout_exercise_logs')
          .insert({
            workout_session_id: sessionId,
            exercise_id: exercise.exercise.id,
            workout_item_id: exerciseId,
            sets_completed: setsCompleted,
            completed,
            completed_at: completed ? new Date().toISOString() : null
          });
      }
    } catch (error) {
      console.error('Error updating exercise log:', error);
    }
  };

  const handleMarkComplete = async () => {
    if (completedSets.size < exercise.sets) {
      Alert.alert(
        'Exercício Incompleto',
        `Você completou ${completedSets.size} de ${exercise.sets} séries. Deseja marcar como concluído mesmo assim?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Marcar Concluído',
            onPress: () => {
              setIsCompleted(true);
              updateExerciseLog(completedSets.size, true);
              router.back();
            }
          }
        ]
      );
    } else {
      setIsCompleted(true);
      await updateExerciseLog(completedSets.size, true);
      Alert.alert('Parabéns! 🎉', 'Exercício concluído!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  };

  if (loading) {
    return (
      <ScreenLayout className="justify-center items-center">
        <ActivityIndicator size="large" color="#CCFF00" />
      </ScreenLayout>
    );
  }

  if (!exercise) {
    return (
      <ScreenLayout className="justify-center items-center px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#5A6178" />
        <Text className="text-foreground text-xl font-bold mt-4 mb-6 font-display">Exercício não encontrado</Text>
        <Button
          onPress={() => router.back()}
          variant="outline"
          label="Voltar"
        />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      {/* Header */}
      <View className="flex-row items-center px-6 pt-2 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-surface p-2.5 rounded-xl mr-4 border border-border"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-2xl font-bold text-foreground font-display">
            {exercise.exercise.name}
          </Text>
          <View className="flex-row items-center mt-1">
            <View className="bg-secondary/15 px-2 py-1 rounded-md">
              <Text className="text-secondary text-xs font-bold font-display uppercase">
                {exercise.exercise.muscle_group}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Video */}
        {exercise.exercise.video_url && (
          <View className="mb-6 rounded-2xl overflow-hidden border border-border">
            <VideoPlayer videoUrl={exercise.exercise.video_url} height={220} />
          </View>
        )}

        {/* Exercise Info */}
        <Card className="p-4 mb-6 border border-border">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-background p-3 rounded-lg border border-border">
              <Text className="text-muted-foreground text-xs mb-1 font-sans">Séries</Text>
              <Text className="text-foreground text-xl font-bold font-display">{exercise.sets}</Text>
            </View>
            <View className="flex-1 bg-background p-3 rounded-lg border border-border">
              <Text className="text-muted-foreground text-xs mb-1 font-sans">Repetições</Text>
              <Text className="text-foreground text-xl font-bold font-display">{exercise.reps}</Text>
            </View>
            {exercise.weight && (
              <View className="flex-1 bg-background p-3 rounded-lg border border-border">
                <Text className="text-muted-foreground text-xs mb-1 font-sans">Carga</Text>
                <Text className="text-foreground text-xl font-bold font-display">{exercise.weight}kg</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Sets Tracking */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-3 font-display">
            Marcar Séries
          </Text>
          {Array.from({ length: exercise.sets }).map((_, index) => {
            const isCompleted = completedSets.has(index);
            const isNext = index === completedSets.size;
            const isLocked = index > completedSets.size || isRestingBetweenSets;

            return (
              <TouchableOpacity
                key={index}
                onPress={() => toggleSetCompletion(index)}
                disabled={!isNext || isRestingBetweenSets}
                activeOpacity={0.8}
              >
                <Card 
                  className={`mb-2 p-4 border-2 flex-row items-center justify-between ${
                    isCompleted ? 'border-primary bg-primary/10 opacity-60' : 
                    isNext ? 'border-secondary' : 'border-border'
                  }`}
                >
                  <View className="flex-row items-center flex-1">
                    <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                      isCompleted ? 'border-primary bg-primary' : 
                      isNext ? 'border-secondary' : 'border-muted-foreground'
                    }`}>
                      {isCompleted && (
                        <Ionicons name="checkmark" size={16} color="#000000" />
                      )}
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-foreground text-base font-bold font-display">
                          Série {index + 1}
                        </Text>
                        {isCompleted && (
                          <View className="bg-primary px-2 py-0.5 rounded-md">
                            <Text className="text-black text-[10px] font-bold font-display">
                              CONCLUÍDA
                            </Text>
                          </View>
                        )}
                        {isNext && !isRestingBetweenSets && (
                          <View className="bg-secondary/20 px-2 py-0.5 rounded-md">
                            <Text className="text-secondary text-[10px] font-bold font-display">
                              PRÓXIMA
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-muted-foreground text-xs mt-0.5 font-sans">
                        {exercise.reps} reps {exercise.weight && `• ${exercise.weight}kg`}
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Rest Timer */}
        {showTimer && (
          <Card className="p-4 mb-6 border-2 border-border bg-surface">
            <Text className="text-lg font-bold text-foreground mb-2 text-center font-display">
              Tempo de Descanso
            </Text>
            <RestTimer
              restSeconds={exercise.rest_time}
              onComplete={handleTimerComplete}
              autoStart={true}
            />
          </Card>
        )}
      </ScrollView>

      {/* Complete Button */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-background/95 border-t border-border">
        <TouchableOpacity
          onPress={handleMarkComplete}
          disabled={isCompleted}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isCompleted ? ['#5A6178', '#5A6178'] : ['#CCFF00', '#99CC00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-xl py-4 items-center flex-row justify-center shadow-lg shadow-black/20"
          >
            <Ionicons
              name={isCompleted ? "checkmark-done" : "checkmark-circle"}
              size={22}
              color={isCompleted ? '#8B92A8' : '#000000'}
              style={{ marginRight: 8 }}
            />
            <Text className={`text-lg font-bold font-display ${isCompleted ? 'text-muted-foreground' : 'text-black'}`}>
              {isCompleted ? 'Exercício Concluído' : 'Marcar como Concluído'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}
