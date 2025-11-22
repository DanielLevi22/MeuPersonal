import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

      console.log('📊 Workout query result:', { workoutData, workoutError });

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

      console.log('💪 Exercises query result:', { 
        exercisesData, 
        exercisesError,
        count: exercisesData?.length 
      });

      if (exercisesError) throw exercisesError;
      
      const transformed = (exercisesData || []).map((item: any) => ({
        ...item,
        exercise: Array.isArray(item.exercise) ? item.exercise[0] : item.exercise,
      }));
      
      console.log('✅ Transformed exercises:', transformed.length, 'exercises');
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
        console.log('📝 Found existing session:', existingSession.id);
        setSessionId(existingSession.id);
        // Load completed exercises for this session
        await loadCompletedExercises(existingSession.id);
      } else {
        console.log('🆕 Creating new session...');
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

        if (sessionError) {
          console.error('❌ Session creation error:', sessionError);
          throw sessionError;
        }
        console.log('✅ Created session:', newSession.id);
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
        style={{
          backgroundColor: isCompleted ? 'rgba(0, 255, 136, 0.1)' : '#141B2D',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 2,
          borderColor: isCompleted ? '#00FF88' : '#1E2A42'
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View style={{
            backgroundColor: isCompleted ? '#00FF88' : '#FF6B35',
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12
          }}>
            {isCompleted ? (
              <Ionicons name="checkmark" size={20} color="#0A0E1A" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>{index + 1}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>
              {item.exercise.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <View style={{
                backgroundColor: 'rgba(0, 217, 255, 0.15)',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6
              }}>
                <Text style={{ color: '#00D9FF', fontSize: 11, fontWeight: '600' }}>
                  {item.exercise.muscle_group}
                </Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#5A6178" />
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: '#0A0E1A', padding: 10, borderRadius: 10 }}>
            <Text style={{ color: '#8B92A8', fontSize: 11, marginBottom: 2 }}>Séries</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>{item.sets}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#0A0E1A', padding: 10, borderRadius: 10 }}>
            <Text style={{ color: '#8B92A8', fontSize: 11, marginBottom: 2 }}>Reps</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>{item.reps}</Text>
          </View>
          {item.weight && (
            <View style={{ flex: 1, backgroundColor: '#0A0E1A', padding: 10, borderRadius: 10 }}>
              <Text style={{ color: '#8B92A8', fontSize: 11, marginBottom: 2 }}>Carga</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>{item.weight}kg</Text>
            </View>
          )}
          <View style={{ flex: 1, backgroundColor: '#0A0E1A', padding: 10, borderRadius: 10 }}>
            <Text style={{ color: '#8B92A8', fontSize: 11, marginBottom: 2 }}>Descanso</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>{item.rest_time}s</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0E1A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={{ color: '#8B92A8', marginTop: 16, fontSize: 15 }}>Carregando treino...</Text>
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0E1A', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#FFFFFF', fontSize: 20 }}>Treino não encontrado</Text>
      </View>
    );
  }

  const progress = exercises.length > 0 ? (completedExercises.size / exercises.length) * 100 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ backgroundColor: '#141B2D', padding: 10, borderRadius: 12, marginRight: 16 }}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF' }}>
                {workout.title}
              </Text>
              {workout.description && (
                <Text style={{ color: '#8B92A8', fontSize: 14, marginTop: 4 }}>
                  {workout.description}
                </Text>
              )}
            </View>
          </View>

          {/* Progress */}
          <View style={{ backgroundColor: '#141B2D', padding: 16, borderRadius: 16, borderWidth: 2, borderColor: '#1E2A42' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Progresso</Text>
              <Text style={{ color: '#00FF88', fontSize: 16, fontWeight: '700' }}>
                {completedExercises.size}/{exercises.length}
              </Text>
            </View>
            <View style={{ height: 8, backgroundColor: '#0A0E1A', borderRadius: 4, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${progress}%`, backgroundColor: '#00FF88' }} />
            </View>
          </View>
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
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 24,
          backgroundColor: '#0A0E1A',
          borderTopWidth: 2,
          borderTopColor: '#1E2A42'
        }}>
          <TouchableOpacity onPress={handleFinishWorkout} activeOpacity={0.8}>
            <LinearGradient
              colors={completedExercises.size === exercises.length ? ['#00FF88', '#00CC6E'] : ['#FF6B35', '#E85A2A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center'
              }}
            >
              <Ionicons
                name={completedExercises.size === exercises.length ? "checkmark-circle" : "flag"}
                size={22}
                color="#0A0E1A"
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: '#0A0E1A', fontSize: 18, fontWeight: '700' }}>
                Finalizar Treino
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
