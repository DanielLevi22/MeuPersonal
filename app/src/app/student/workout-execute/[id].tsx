import { supabase } from '@elevapro/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '@/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { LiveWorkoutOverlay } from '@/components/workout/LiveWorkoutOverlay';
import { schedulePostWorkoutReminder } from '@/services/notificationService';
import { useWorkoutTimer, type WorkoutExercise, workoutSessionStore } from '@/workout';

async function loadWorkoutExercises(workoutId: string): Promise<WorkoutExercise[]> {
  const { data, error } = await supabase
    .from('workout_exercises')
    .select(
      'id, exercise_id, sets, reps, weight, rest_seconds, order_index, exercise:exercises(id, name, muscle_group)'
    )
    .eq('workout_id', workoutId)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as WorkoutExercise[];
}

async function createWorkoutSession(workoutId: string, studentId: string): Promise<string> {
  const { data: existing } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('workout_id', workoutId)
    .eq('student_id', studentId)
    .is('completed_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return (existing as { id: string }).id;

  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({ workout_id: workoutId, student_id: studentId, started_at: new Date().toISOString() })
    .select('id')
    .single();

  if (error || !data) throw new Error('Failed to create workout session');
  return (data as { id: string }).id;
}

async function batchSaveSession(sessionId: string): Promise<void> {
  const states = workoutSessionStore.getAll();
  for (const ex of states) {
    const { data: sessionEx, error } = await supabase
      .from('workout_session_exercises')
      .insert({
        session_id: sessionId,
        workout_exercise_id: ex.workoutExerciseId,
        exercise_id: ex.exerciseId,
      })
      .select('id')
      .single();

    if (error || !sessionEx) continue;

    const setRows = ex.sets.map((s, idx) => ({
      session_exercise_id: (sessionEx as { id: string }).id,
      set_index: idx,
      reps_prescribed: ex.repsPrescribed,
      reps_actual: s.repsActual,
      weight_prescribed: ex.weightPrescribed ? parseFloat(ex.weightPrescribed) : null,
      weight_actual: s.weightActual,
      rest_prescribed: ex.restPrescribed,
      rest_actual: s.restActual,
      completed: s.completed,
      skipped: s.skipped,
    }));

    if (setRows.length > 0) {
      await supabase.from('workout_session_sets').insert(setRows);
    }
  }
}

export default function StudentWorkoutExecuteScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const router = useRouter();

  const [workout, setWorkout] = useState<{ title: string; description: string | null } | null>(
    null
  );
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const { timeLeft, isActive, totalTime, startTimer, stopTimer, addTime, subtractTime } =
    useWorkoutTimer();

  const refreshCompletedFromStore = useCallback(() => {
    const done = exercises
      .filter((ex) => workoutSessionStore.isExerciseComplete(ex.id))
      .map((ex) => ex.id);
    setCompletedIds(new Set(done));
  }, [exercises]);

  useFocusEffect(
    useCallback(() => {
      refreshCompletedFromStore();
    }, [refreshCompletedFromStore])
  );

  useEffect(() => {
    const workoutId = typeof id === 'string' ? id : id[0];
    if (!workoutId || !user?.id) return;

    (async () => {
      try {
        const { data: workoutData, error: workoutError } = await supabase
          .from('workouts')
          .select('id, title, description')
          .eq('id', workoutId)
          .single();

        if (workoutError) throw workoutError;
        setWorkout(workoutData);

        const exList = await loadWorkoutExercises(workoutId);
        setExercises(exList);

        const sessId = await createWorkoutSession(workoutId, user.id);
        setSessionId(sessId);
        workoutSessionStore.init(sessId);

        for (const ex of exList) {
          workoutSessionStore.addExercise({
            workoutExerciseId: ex.id,
            exerciseId: ex.exercise_id,
            repsPrescribed: ex.reps,
            setsCount: ex.sets ?? 3,
            weightPrescribed: ex.weight,
            restPrescribed: ex.rest_seconds,
          });
        }
      } catch (error) {
        console.error('Error loading workout:', error);
        Alert.alert('Erro', 'Não foi possível carregar o treino.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user?.id]);

  const handleExercisePress = (exercise: WorkoutExercise) => {
    router.push(
      `/student/exercise-detail?workoutExerciseId=${exercise.id}&sessionId=${sessionId}` as never
    );
  };

  const handleStartRest = (restSeconds: number) => {
    startTimer(restSeconds || 60);
  };

  const finishWorkout = async () => {
    try {
      if (!sessionId) return;

      await batchSaveSession(sessionId);

      await supabase
        .from('workout_sessions')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', sessionId);

      workoutSessionStore.clear();
      await schedulePostWorkoutReminder();

      Alert.alert('Parabéns! 🎉', 'Treino concluído com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (_error) {
      Alert.alert('Erro', 'Não foi possível finalizar o treino.');
    }
  };

  const handleFinishWorkout = () => {
    if (completedIds.size < exercises.length) {
      Alert.alert(
        'Treino Incompleto',
        'Você ainda não completou todos os exercícios. Deseja finalizar mesmo assim?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Finalizar', style: 'destructive', onPress: finishWorkout },
        ]
      );
    } else {
      finishWorkout();
    }
  };

  const renderExercise = ({ item, index }: { item: WorkoutExercise; index: number }) => {
    const isCompleted = completedIds.has(item.id);
    const exercise = item.exercise as { name: string; muscle_group: string | null } | undefined;

    return (
      <TouchableOpacity onPress={() => handleExercisePress(item)} activeOpacity={0.8}>
        <Card
          className={`mb-3 p-4 border-2 ${isCompleted ? 'border-primary bg-primary/10' : 'border-border'}`}
        >
          <View className="flex-row items-center mb-2">
            <View
              className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isCompleted ? 'bg-primary' : 'bg-primary/20'}`}
            >
              {isCompleted ? (
                <Ionicons name="checkmark" size={20} color="#000000" />
              ) : (
                <Text className="text-primary font-bold text-sm font-display">{index + 1}</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-foreground text-lg font-bold font-display">
                {exercise?.name ?? '—'}
              </Text>
              {exercise?.muscle_group && (
                <View className="flex-row items-center mt-1">
                  <View className="bg-secondary/15 px-2 py-1 rounded-md">
                    <Text className="text-secondary text-xs font-bold font-display uppercase">
                      {exercise.muscle_group}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {!isCompleted && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleStartRest(item.rest_seconds ?? 60);
                }}
                className="bg-primary/10 p-2 rounded-lg ml-2 border border-primary/20"
              >
                <Ionicons name="timer-outline" size={20} color="#CCFF00" />
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-row gap-3 pl-11">
            <View className="flex-1 bg-background p-2 rounded-lg border border-border">
              <Text className="text-muted-foreground text-xs mb-1 font-sans">Séries</Text>
              <Text className="text-foreground text-base font-bold font-display">
                {item.sets ?? '—'}
              </Text>
            </View>
            <View className="flex-1 bg-background p-2 rounded-lg border border-border">
              <Text className="text-muted-foreground text-xs mb-1 font-sans">Reps</Text>
              <Text className="text-foreground text-base font-bold font-display">
                {item.reps ?? '—'}
              </Text>
            </View>
            {item.weight && (
              <View className="flex-1 bg-background p-2 rounded-lg border border-border">
                <Text className="text-muted-foreground text-xs mb-1 font-sans">Carga</Text>
                <Text className="text-foreground text-base font-bold font-display">
                  {item.weight}kg
                </Text>
              </View>
            )}
            <View className="flex-1 bg-background p-2 rounded-lg border border-border">
              <Text className="text-muted-foreground text-xs mb-1 font-sans">Descanso</Text>
              <Text className="text-foreground text-base font-bold font-display">
                {item.rest_seconds ?? '—'}s
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <ScreenLayout className="justify-center items-center">
        <ActivityIndicator size="large" color="#CCFF00" />
        <Text className="text-muted-foreground mt-4 font-sans">Carregando treino...</Text>
      </ScreenLayout>
    );
  }

  if (!workout) {
    return (
      <ScreenLayout className="justify-center items-center px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#5A6178" />
        <Text className="text-foreground text-xl font-bold mt-4 mb-6 font-display">
          Treino não encontrado
        </Text>
        <Button onPress={() => router.back()} variant="outline" label="Voltar" />
      </ScreenLayout>
    );
  }

  const progress = exercises.length > 0 ? (completedIds.size / exercises.length) * 100 : 0;

  return (
    <ScreenLayout>
      <View className="px-6 pt-2 pb-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-surface p-2.5 rounded-xl mr-4 border border-border"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground font-display">{workout.title}</Text>
            {workout.description && (
              <Text className="text-muted-foreground text-sm mt-1 font-sans">
                {workout.description}
              </Text>
            )}
          </View>
        </View>

        <Card className="p-4 border border-border">
          <View className="flex-row justify-between mb-2">
            <Text className="text-foreground text-base font-bold font-display">Progresso</Text>
            <Text className="text-primary text-base font-bold font-display">
              {completedIds.size}/{exercises.length}
            </Text>
          </View>
          <View className="h-2 bg-background rounded-full overflow-hidden">
            <View className="h-full bg-primary" style={{ width: `${progress}%` }} />
          </View>
        </Card>
      </View>

      <FlatList
        data={exercises}
        renderItem={renderExercise}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      <View className="absolute bottom-0 left-0 right-0 p-6 bg-background/95 border-t border-border">
        <TouchableOpacity onPress={handleFinishWorkout} activeOpacity={0.8}>
          <LinearGradient
            colors={
              completedIds.size === exercises.length
                ? (['#CCFF00', '#99CC00'] as [string, string])
                : (['#FF6B35', '#E85A2A'] as [string, string])
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-xl py-4 items-center flex-row justify-center shadow-lg shadow-black/20"
          >
            <Ionicons
              name={completedIds.size === exercises.length ? 'checkmark-circle' : 'flag'}
              size={22}
              color="#000000"
              style={{ marginRight: 8 }}
            />
            <Text className="text-black text-lg font-bold font-display">Finalizar Treino</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <LiveWorkoutOverlay
        visible={isActive}
        timeLeft={timeLeft}
        totalTime={totalTime}
        onClose={stopTimer}
        onAdd10s={() => addTime(10)}
        onSubtract10s={() => subtractTime(10)}
        onSkip={stopTimer}
      />
    </ScreenLayout>
  );
}
