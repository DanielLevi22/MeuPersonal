import { useAuthStore } from '@/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { LiveWorkoutOverlay } from '@/components/workout/LiveWorkoutOverlay';
import { schedulePostWorkoutReminder } from '@/services/notificationService';
import { useWorkoutTimer } from '@/workout';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@meupersonal/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';

interface Exercise {
  id: string;
  exercise_id: string;
  exercise: {
    id: string;
    name: string;
    muscle_group: string;
  };
  sets: number;
  reps: string;
  weight?: string;
  rest_time: number;
  order: number;
}

export default function StudentWorkoutExecuteScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const router = useRouter();

  const [workout, setWorkout] = useState<any>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Timer Hook
  const { 
    timeLeft, 
    isActive, 
    totalTime, 
    startTimer, 
    stopTimer, 
    addTime, 
    subtractTime 
  } = useWorkoutTimer();

  useEffect(() => {
    fetchWorkoutAndStartSession();
  }, [id]);

  // Reload completed exercises when screen gains focus (returning from exercise detail)
  useFocusEffect(
    useCallback(() => {
      if (sessionId) {
        loadCompletedExercises(sessionId);
      }
    }, [sessionId])
  );

  const fetchWorkoutAndStartSession = async () => {
    try {
      console.log('🏋️ Fetching workout for student, ID:', id, 'User:', user?.id);

      // Fetch workout details
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .select('id, title, description')
        .eq('id', id)
        .single();

      if (workoutError) throw workoutError;
      setWorkout(workoutData);

      // Fetch exercises
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('workout_items')
        .select(`
          id,
          exercise_id,
          sets,
          reps,
          weight,
          rest_time,
          order,
          exercise:exercises (
            id,
            name,
            muscle_group
          )
        `)
        .eq('workout_id', id)
        .order('order', { ascending: true });

      if (exercisesError) throw exercisesError;
      
      const transformed = (exercisesData || []).map((item: any) => ({
        ...item,
        exercise: Array.isArray(item.exercise) ? item.exercise[0] : item.exercise,
      }));
      
      setExercises(transformed);

      // Create or get active workout session
      const { data: existingSession } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('workout_id', id)
        .eq('student_id', user?.id)
        .is('completed_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (existingSession) {
        setSessionId(existingSession.id);
        await loadCompletedExercises(existingSession.id);
      } else {
        // Create new session
        const { data: newSession, error: sessionError } = await supabase
          .from('workout_sessions')
          .insert({
            workout_id: id,
            student_id: user?.id,
            started_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (sessionError) throw sessionError;
        setSessionId(newSession.id);
      }
    } catch (error: any) {
      console.error('💥 Error fetching workout:', error);
      Alert.alert('Erro', 'Não foi possível carregar o treino.');
    } finally {
      setLoading(false);
    }
  };

  const loadCompletedExercises = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('workout_exercise_logs')
        .select('workout_item_id')
        .eq('workout_session_id', sessionId)
        .eq('completed', true);

      if (!error && data) {
        const completed = new Set(data.map(log => log.workout_item_id));
        setCompletedExercises(completed);
      }
    } catch (error) {
      console.error('Error loading completed exercises:', error);
    }
  };

  const handleExercisePress = (exercise: Exercise) => {
    router.push(`/student/exercise-detail?exerciseId=${exercise.id}&sessionId=${sessionId}&workoutId=${id}` as any);
  };

  const handleStartRest = (restTime: number) => {
    startTimer(restTime || 60);
  };

  const handleFinishWorkout = async () => {
    if (completedExercises.size < exercises.length) {
      Alert.alert(
        'Treino Incompleto',
        'Você ainda não completou todos os exercícios. Deseja finalizar mesmo assim?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Finalizar', style: 'destructive', onPress: finishWorkout }
        ]
      );
    } else {
      finishWorkout();
    }
  };

  const finishWorkout = async () => {
    try {
      if (!sessionId) return;

      const { error } = await supabase
        .from('workout_sessions')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) throw error;

      // Schedule post-workout meal reminder
      await schedulePostWorkoutReminder();

      Alert.alert('Parabéns! 🎉', 'Treino concluído com sucesso!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível finalizar o treino.');
    }
  };

  const renderExercise = ({ item, index }: { item: Exercise; index: number }) => {
    const isCompleted = completedExercises.has(item.id);

    return (
      <TouchableOpacity
        onPress={() => handleExercisePress(item)}
        activeOpacity={0.8}
      >
        <Card className={`mb-3 p-4 border-2 ${isCompleted ? 'border-primary bg-primary/10' : 'border-border'}`}>
          <View className="flex-row items-center mb-2">
            <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isCompleted ? 'bg-primary' : 'bg-primary/20'}`}>
              {isCompleted ? (
                <Ionicons name="checkmark" size={20} color="#000000" />
              ) : (
                <Text className="text-primary font-bold text-sm font-display">{index + 1}</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-foreground text-lg font-bold font-display">
                {item.exercise.name}
              </Text>
              <View className="flex-row items-center mt-1">
                <View className="bg-secondary/15 px-2 py-1 rounded-md">
                  <Text className="text-secondary text-xs font-bold font-display uppercase">
                    {item.exercise.muscle_group}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Quick Rest Button */}
            {!isCompleted && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleStartRest(item.rest_time);
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
              <Text className="text-foreground text-base font-bold font-display">{item.sets}</Text>
            </View>
            <View className="flex-1 bg-background p-2 rounded-lg border border-border">
              <Text className="text-muted-foreground text-xs mb-1 font-sans">Reps</Text>
              <Text className="text-foreground text-base font-bold font-display">{item.reps}</Text>
            </View>
            {item.weight && (
              <View className="flex-1 bg-background p-2 rounded-lg border border-border">
                <Text className="text-muted-foreground text-xs mb-1 font-sans">Carga</Text>
                <Text className="text-foreground text-base font-bold font-display">{item.weight}kg</Text>
              </View>
            )}
            <View className="flex-1 bg-background p-2 rounded-lg border border-border">
              <Text className="text-muted-foreground text-xs mb-1 font-sans">Descanso</Text>
              <Text className="text-foreground text-base font-bold font-display">{item.rest_time}s</Text>
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
        <Text className="text-foreground text-xl font-bold mt-4 mb-6 font-display">Treino não encontrado</Text>
        <Button
          onPress={() => router.back()}
          variant="outline"
          label="Voltar"
        />
      </ScreenLayout>
    );
  }

  const progress = exercises.length > 0 ? (completedExercises.size / exercises.length) * 100 : 0;

  return (
    <ScreenLayout>
      {/* Header */}
      <View className="px-6 pt-2 pb-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-surface p-2.5 rounded-xl mr-4 border border-border"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground font-display">
              {workout.title}
            </Text>
            {workout.description && (
              <Text className="text-muted-foreground text-sm mt-1 font-sans">
                {workout.description}
              </Text>
            )}
          </View>
        </View>

        {/* Progress */}
        <Card className="p-4 border border-border">
          <View className="flex-row justify-between mb-2">
            <Text className="text-foreground text-base font-bold font-display">Progresso</Text>
            <Text className="text-primary text-base font-bold font-display">
              {completedExercises.size}/{exercises.length}
            </Text>
          </View>
          <View className="h-2 bg-background rounded-full overflow-hidden">
            <View 
              className="h-full bg-primary" 
              style={{ width: `${progress}%` }} 
            />
          </View>
        </Card>
      </View>

      {/* Exercise List */}
      <FlatList
        data={exercises}
        renderItem={renderExercise}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Finish Button */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-background/95 border-t border-border">
        <TouchableOpacity onPress={handleFinishWorkout} activeOpacity={0.8}>
          <LinearGradient
            colors={completedExercises.size === exercises.length ? ['#CCFF00', '#99CC00'] : ['#FF6B35', '#E85A2A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-xl py-4 items-center flex-row justify-center shadow-lg shadow-black/20"
          >
            <Ionicons
              name={completedExercises.size === exercises.length ? "checkmark-circle" : "flag"}
              size={22}
              color="#000000"
              style={{ marginRight: 8 }}
            />
            <Text className="text-black text-lg font-bold font-display">
              Finalizar Treino
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Live Workout Overlay */}
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
