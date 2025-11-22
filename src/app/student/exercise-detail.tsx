import { RestTimer } from '@/components/RestTimer';
import { VideoPlayer } from '@/components/VideoPlayer';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
      <View style={{ flex: 1, backgroundColor: '#0A0E1A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0E1A', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#FFFFFF', fontSize: 20 }}>Exercício não encontrado</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ backgroundColor: '#141B2D', padding: 10, borderRadius: 12, marginRight: 16 }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF' }}>
              {exercise.exercise.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <View style={{
                backgroundColor: 'rgba(0, 217, 255, 0.15)',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6
              }}>
                <Text style={{ color: '#00D9FF', fontSize: 12, fontWeight: '600' }}>
                  {exercise.exercise.muscle_group}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Video */}
          {exercise.exercise.video_url && (
            <View style={{ marginBottom: 24 }}>
              <VideoPlayer videoUrl={exercise.exercise.video_url} height={220} />
            </View>
          )}

          {/* Exercise Info */}
          <View style={{ backgroundColor: '#141B2D', padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 2, borderColor: '#1E2A42' }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1, backgroundColor: '#0A0E1A', padding: 12, borderRadius: 10 }}>
                <Text style={{ color: '#8B92A8', fontSize: 12, marginBottom: 4 }}>Séries</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700' }}>{exercise.sets}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#0A0E1A', padding: 12, borderRadius: 10 }}>
                <Text style={{ color: '#8B92A8', fontSize: 12, marginBottom: 4 }}>Repetições</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700' }}>{exercise.reps}</Text>
              </View>
              {exercise.weight && (
                <View style={{ flex: 1, backgroundColor: '#0A0E1A', padding: 12, borderRadius: 10 }}>
                  <Text style={{ color: '#8B92A8', fontSize: 12, marginBottom: 4 }}>Carga</Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700' }}>{exercise.weight}kg</Text>
                </View>
              )}
            </View>
          </View>

          {/* Sets Tracking */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 }}>
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
                  style={{
                    backgroundColor: isCompleted ? 'rgba(0, 255, 136, 0.1)' : '#141B2D',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 8,
                    borderWidth: 2,
                    borderColor: isCompleted ? '#00FF88' : isNext ? '#FF6B35' : '#1E2A42',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: isCompleted ? 0.6 : 1
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: isCompleted ? '#00FF88' : isNext ? '#FF6B35' : '#5A6178',
                      backgroundColor: isCompleted ? '#00FF88' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12
                    }}>
                      {isCompleted && (
                        <Ionicons name="checkmark" size={16} color="#0A0E1A" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                          Série {index + 1}
                        </Text>
                        {isCompleted && (
                          <View style={{
                            backgroundColor: '#00FF88',
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 6
                          }}>
                            <Text style={{ color: '#0A0E1A', fontSize: 10, fontWeight: '700' }}>
                              CONCLUÍDA
                            </Text>
                          </View>
                        )}
                        {isNext && !isRestingBetweenSets && (
                          <View style={{
                            backgroundColor: 'rgba(255, 107, 53, 0.2)',
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 6
                          }}>
                            <Text style={{ color: '#FF6B35', fontSize: 10, fontWeight: '700' }}>
                              PRÓXIMA
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ color: '#8B92A8', fontSize: 12, marginTop: 2 }}>
                        {exercise.reps} reps {exercise.weight && `• ${exercise.weight}kg`}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Rest Timer */}
          {showTimer && (
            <View style={{ backgroundColor: '#141B2D', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 2, borderColor: '#1E2A42' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 8, textAlign: 'center' }}>
                Tempo de Descanso
              </Text>
              <RestTimer
                restSeconds={exercise.rest_time}
                onComplete={handleTimerComplete}
                autoStart={true}
              />
            </View>
          )}
        </ScrollView>

        {/* Complete Button */}
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
          <TouchableOpacity
            onPress={handleMarkComplete}
            disabled={isCompleted}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isCompleted ? ['#5A6178', '#5A6178'] : ['#00FF88', '#00CC6E']}
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
                name={isCompleted ? "checkmark-done" : "checkmark-circle"}
                size={22}
                color={isCompleted ? '#8B92A8' : '#0A0E1A'}
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: isCompleted ? '#8B92A8' : '#0A0E1A', fontSize: 18, fontWeight: '700' }}>
                {isCompleted ? 'Exercício Concluído' : 'Marcar como Concluído'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
