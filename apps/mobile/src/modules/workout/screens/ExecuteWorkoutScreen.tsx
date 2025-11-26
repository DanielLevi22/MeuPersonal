import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@meupersonal/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedbackModal } from '../components/FeedbackModal';
import { RestTimer } from '../components/RestTimer';

interface WorkoutItem {
  id: string;
  exercise: {
    id: string;
    name: string;
    muscle_group: string;
  };
  sets: number;
  reps: number | string;
  weight?: string;
  rest_time: number;
  order: number;
}

interface SetData {
  reps: string;
  weight: string;
  completed: boolean;
}

interface ExerciseLog {
  exerciseItemId: string;
  sets: SetData[];
  substitutedExerciseId?: string; // Track if exercise was substituted
  substitutedExerciseName?: string;
}

interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
}

export default function ExecuteWorkoutScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [workout, setWorkout] = useState<any>(null);
  const [workoutItems, setWorkoutItems] = useState<WorkoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, ExerciseLog>>({});
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [workoutLogId, setWorkoutLogId] = useState<string | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSetIndex, setEditingSetIndex] = useState<number | null>(null);
  const [editReps, setEditReps] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [showSubstituteModal, setShowSubstituteModal] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchWorkoutDetails();
  }, [id]);

  const fetchWorkoutDetails = async () => {
    try {
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', id)
        .single();

      if (workoutError) throw workoutError;
      setWorkout(workoutData);

      const { data: itemsData, error: itemsError } = await supabase
        .from('workout_items')
        .select(`
          id,
          sets,
          reps,
          weight,
          rest_time,
          "order",
          exercise:exercises (
            id,
            name,
            muscle_group
          )
        `)
        .eq('workout_id', id)
        .order('order', { ascending: true });

      if (itemsError) throw itemsError;

      const transformed = (itemsData || []).map((item: any) => ({
        ...item,
        exercise: Array.isArray(item.exercise) ? item.exercise[0] : item.exercise,
      }));

      setWorkoutItems(transformed);
      
      // Initialize exercise logs with planned values
      const initialLogs: Record<string, ExerciseLog> = {};
      transformed.forEach(item => {
        initialLogs[item.id] = {
          exerciseItemId: item.id,
          sets: Array.from({ length: item.sets }, () => ({
            reps: item.reps.toString(),
            weight: item.weight || '',
            completed: false,
          })),
        };
      });
      setExerciseLogs(initialLogs);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching workout:', error);
      Alert.alert('Erro', 'Não foi possível carregar o treino');
      router.back();
    }
  };

  const handleStartWorkout = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      setStartTime(now);

      const { data, error } = await supabase
        .from('workout_logs')
        .insert({
          workout_id: id as string,
          student_id: user.id,
          started_at: now.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      setWorkoutLogId(data.id);
      setWorkoutStarted(true);
    } catch (error) {
      console.error('Error starting workout:', error);
      Alert.alert('Erro', 'Não foi possível iniciar o treino');
    }
  };

  const handleEditSet = (setIndex: number) => {
    const currentItem = workoutItems[currentExerciseIndex];
    const setData = exerciseLogs[currentItem.id].sets[setIndex];
    
    setEditingSetIndex(setIndex);
    setEditReps(setData.reps);
    setEditWeight(setData.weight);
    setShowEditModal(true);
  };

  const handleSaveSetEdit = () => {
    if (!editReps || parseInt(editReps) <= 0) {
      Alert.alert('Erro', 'Número de repetições inválido');
      return;
    }

    const currentItem = workoutItems[currentExerciseIndex];
    const newLogs = { ...exerciseLogs };
    
    if (editingSetIndex !== null) {
      newLogs[currentItem.id].sets[editingSetIndex] = {
        ...newLogs[currentItem.id].sets[editingSetIndex],
        reps: editReps,
        weight: editWeight,
      };
      setExerciseLogs(newLogs);
    }

    setShowEditModal(false);
    setEditingSetIndex(null);
  };

  const handleCompleteSet = (setIndex: number) => {
    const currentItem = workoutItems[currentExerciseIndex];
    const newLogs = { ...exerciseLogs };
    newLogs[currentItem.id].sets[setIndex].completed = true;
    setExerciseLogs(newLogs);

    const allSetsCompleted = newLogs[currentItem.id].sets.every(s => s.completed);
    
    if (allSetsCompleted) {
      if (currentExerciseIndex < workoutItems.length - 1) {
        setTimeout(() => {
          setCurrentExerciseIndex(prev => prev + 1);
        }, 500);
      }
    } else {
      setShowRestTimer(true);
    }
  };

  const handleRestComplete = () => {
    setShowRestTimer(false);
  };

  const handleSubstituteExercise = async () => {
    setShowSubstituteModal(true);
    // Fetch available exercises
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, muscle_group')
        .order('name');
      
      if (error) throw error;
      setAvailableExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      Alert.alert('Erro', 'Não foi possível carregar exercícios');
    }
  };

  const handleConfirmSubstitution = (exercise: Exercise) => {
    Alert.alert(
      '⚠️ Substituir Exercício',
      `Você está prestes a substituir o exercício planejado por "${exercise.name}".\n\n` +
      `⚠️ ATENÇÃO: Isso é uma exceção e deve ser evitado. O professor poderá ver esta alteração.\n\n` +
      `Esta substituição vale APENAS para hoje. No próximo treino, o exercício original voltará.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar Substituição',
          style: 'destructive',
          onPress: () => {
            const currentItem = workoutItems[currentExerciseIndex];
            const newLogs = { ...exerciseLogs };
            
            // Mark as substituted
            newLogs[currentItem.id] = {
              ...newLogs[currentItem.id],
              substitutedExerciseId: exercise.id,
              substitutedExerciseName: exercise.name,
            };
            
            setExerciseLogs(newLogs);
            setShowSubstituteModal(false);
            setSearchQuery('');
            
            Alert.alert(
              '✅ Exercício Substituído',
              `O exercício foi substituído por "${exercise.name}" apenas para este treino.`
            );
          },
        },
      ]
    );
  };

  const calculateEstimatedTime = () => {
    let totalSeconds = 0;
    workoutItems.forEach(item => {
      // Assume 30 seconds per set + rest time between sets
      totalSeconds += (item.sets * 30) + ((item.sets - 1) * item.rest_time);
    });
    return Math.ceil(totalSeconds / 60); // minutes
  };

  const handleCompleteWorkout = async () => {
    if (!workoutLogId || !startTime) {
      Alert.alert('Erro', 'Não foi possível registrar o treino');
      return;
    }

    setCompleting(true);
    try {
      const endTime = new Date();
      const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60);

      // Save workout log
      const { error: logError } = await supabase
        .from('workout_logs')
        .update({
          completed_at: endTime.toISOString(),
          status: 'completed',
          duration_minutes: durationMinutes,
        })
        .eq('id', workoutLogId);

      if (logError) throw logError;

      // Save detailed set logs
      const setLogs = Object.entries(exerciseLogs).flatMap(([itemId, log]) =>
        log.sets.map((set, index) => ({
          workout_log_id: workoutLogId,
          workout_item_id: itemId,
          set_number: index + 1,
          reps_completed: parseInt(set.reps),
          weight_used: set.weight ? parseFloat(set.weight) : null,
          completed: set.completed,
          substituted_exercise_id: log.substitutedExerciseId || null,
        }))
      );

      const { error: setsError } = await supabase
        .from('workout_set_logs')
        .insert(setLogs);

      if (setsError) throw setsError;

      setShowFeedbackModal(true);
    } catch (error) {
      console.error('Error completing workout:', error);
      Alert.alert('Erro', 'Não foi possível finalizar o treino');
    } finally {
      setCompleting(false);
    }
  };

  const handleFeedbackClose = () => {
    setShowFeedbackModal(false);
    
    // Show summary
    const durationMinutes = startTime 
      ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000 / 60)
      : 0;
    const estimatedMinutes = calculateEstimatedTime();
    
    Alert.alert(
      '🎉 Treino Concluído!',
      `⏱️ Tempo gasto: ${durationMinutes} min\n📊 Tempo estimado: ${estimatedMinutes} min\n\n${
        durationMinutes < estimatedMinutes 
          ? '⚡ Você foi mais rápido que o esperado!' 
          : durationMinutes > estimatedMinutes
          ? '💪 Você dedicou mais tempo ao treino!'
          : '✅ Tempo perfeito!'
      }`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#CCFF00" />
      </SafeAreaView>
    );
  }

  if (!workoutStarted) {
    const estimatedTime = calculateEstimatedTime();
    
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center p-6">
          <View className="bg-primary/10 p-8 rounded-full mb-6">
            <Ionicons name="barbell" size={80} color="#CCFF00" />
          </View>
          
          <Text className="text-3xl font-bold text-foreground mb-3 text-center font-display">
            {workout?.title}
          </Text>
          
          <View className="bg-surface border border-border rounded-2xl p-6 w-full mb-6">
            <View className="flex-row items-center mb-4">
              <Ionicons name="list" size={24} color="#CCFF00" />
              <Text className="text-foreground text-lg ml-3 font-sans">
                {workoutItems.length} exercícios
              </Text>
            </View>
            
            <View className="flex-row items-center">
              <Ionicons name="time" size={24} color="#CCFF00" />
              <Text className="text-foreground text-lg ml-3 font-sans">
                ~{estimatedTime} min (estimado)
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleStartWorkout}
            className="bg-primary py-5 px-12 rounded-2xl w-full"
          >
            <Text className="text-black text-xl font-bold text-center font-display">
              Iniciar Treino
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 py-3"
          >
            <Text className="text-muted-foreground font-sans">Cancelar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentItem = workoutItems[currentExerciseIndex];
  const currentLog = exerciseLogs[currentItem?.id];
  const completedExercises = workoutItems.filter((item, idx) => 
    idx < currentExerciseIndex || exerciseLogs[item.id].sets.every(s => s.completed)
  ).length;
  const progress = workoutItems.length > 0 ? (completedExercises / workoutItems.length) * 100 : 0;
  const isWorkoutComplete = completedExercises === workoutItems.length;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 py-4 border-b border-border bg-surface">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity 
            onPress={() => {
              Alert.alert(
                'Sair do Treino',
                'Tem certeza? Seu progresso será perdido.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Sair', style: 'destructive', onPress: () => router.back() },
                ]
              );
            }} 
            className="p-2"
          >
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <View className="flex-1 mx-4">
            <Text className="text-lg font-bold text-foreground text-center font-display">
              {workout?.title}
            </Text>
            <Text className="text-xs text-muted-foreground text-center font-sans mt-1">
              {completedExercises} de {workoutItems.length} exercícios
            </Text>
          </View>
          <View className="w-10" />
        </View>

        <View className="bg-background rounded-full h-3 overflow-hidden">
          <View 
            className="bg-primary h-full transition-all" 
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>

      {showRestTimer && currentItem ? (
        <View className="flex-1 justify-center">
          <RestTimer
            restSeconds={currentItem.rest_time}
            onComplete={handleRestComplete}
            autoStart={true}
          />
          <TouchableOpacity
            onPress={handleRestComplete}
            className="mx-6 mt-6 bg-surface border border-border py-4 rounded-xl items-center"
          >
            <Text className="text-foreground font-bold font-display">Pular Descanso</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView className="flex-1">
          {currentItem && currentLog && !isWorkoutComplete && (
            <View className="p-6">
              {/* Exercise Info */}
              <View className="bg-surface border-2 border-border rounded-2xl p-6 mb-6">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="bg-primary/10 px-3 py-1.5 rounded-full">
                    <Text className="text-primary text-xs font-bold font-display">
                      {currentItem.exercise.muscle_group}
                    </Text>
                  </View>
                  <Text className="text-muted-foreground text-sm font-sans">
                    Exercício {currentExerciseIndex + 1}/{workoutItems.length}
                  </Text>
                </View>
                
                <Text className="text-foreground text-3xl font-bold mb-2 font-display">
                  {currentLog.substitutedExerciseName || currentItem.exercise.name}
                </Text>
                
                {currentLog.substitutedExerciseName && (
                  <View className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 mb-4">
                    <View className="flex-row items-center">
                      <Ionicons name="warning" size={20} color="#F97316" />
                      <Text className="text-orange-500 text-sm ml-2 flex-1 font-sans">
                        Exercício substituído: {currentItem.exercise.name} → {currentLog.substitutedExerciseName}
                      </Text>
                    </View>
                  </View>
                )}

                {!currentLog.substitutedExerciseId && (
                  <TouchableOpacity
                    onPress={handleSubstituteExercise}
                    className="bg-orange-500/10 border border-orange-500/30 py-2 px-4 rounded-xl mb-4"
                  >
                    <Text className="text-orange-500 text-center text-sm font-semibold font-display">
                      ⚠️ Substituir Exercício (Exceção)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Sets */}
              <Text className="text-foreground text-lg font-bold mb-4 font-display">
                Séries
              </Text>
              <View className="space-y-3 mb-6">
                {currentLog.sets.map((set, index) => (
                  <View
                    key={index}
                    className={`p-4 rounded-xl border-2 ${
                      set.completed
                        ? 'bg-primary/10 border-primary'
                        : 'bg-surface border-border'
                    }`}
                  >
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className={`text-lg font-semibold font-display ${
                        set.completed ? 'text-primary' : 'text-foreground'
                      }`}>
                        Série {index + 1}
                      </Text>
                      {set.completed && (
                        <Ionicons name="checkmark-circle" size={28} color="#CCFF00" />
                      )}
                    </View>

                    <View className="flex-row gap-3 mb-3">
                      <View className="flex-1 bg-background px-3 py-2 rounded-lg">
                        <Text className="text-xs text-muted-foreground mb-1 font-sans">Reps</Text>
                        <Text className="text-foreground text-lg font-bold font-display">{set.reps}</Text>
                      </View>
                      {set.weight && (
                        <View className="flex-1 bg-background px-3 py-2 rounded-lg">
                          <Text className="text-xs text-muted-foreground mb-1 font-sans">Peso</Text>
                          <Text className="text-foreground text-lg font-bold font-display">{set.weight}kg</Text>
                        </View>
                      )}
                    </View>

                    {!set.completed && (
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() => handleEditSet(index)}
                          className="flex-1 bg-background border border-border py-3 rounded-lg"
                        >
                          <Text className="text-foreground text-center font-semibold font-display">Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleCompleteSet(index)}
                          className="flex-1 bg-primary py-3 rounded-lg"
                        >
                          <Text className="text-black text-center font-bold font-display">Completar</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {isWorkoutComplete && (
            <View className="flex-1 items-center justify-center p-6">
              <View className="bg-primary/10 p-6 rounded-full mb-6">
                <Ionicons name="trophy" size={80} color="#CCFF00" />
              </View>
              <Text className="text-3xl font-bold text-foreground mb-3 text-center font-display">
                Treino Concluído!
              </Text>
              <Text className="text-muted-foreground text-center text-lg font-sans mb-6">
                Parabéns! Você completou todos os exercícios.
              </Text>

              <TouchableOpacity
                onPress={handleCompleteWorkout}
                disabled={completing}
                className="bg-primary py-5 px-12 rounded-xl w-full"
              >
                {completing ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text className="text-black text-lg font-bold text-center font-display">
                    Finalizar e Avaliar
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* Edit Set Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-surface rounded-t-3xl p-6">
            <Text className="text-2xl font-bold text-foreground mb-6 font-display">
              Editar Série {editingSetIndex !== null ? editingSetIndex + 1 : ''}
            </Text>

            <View className="mb-4">
              <Text className="text-foreground mb-2 font-sans">Repetições</Text>
              <TextInput
                value={editReps}
                onChangeText={setEditReps}
                keyboardType="numeric"
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground text-lg font-sans"
              />
            </View>

            <View className="mb-6">
              <Text className="text-foreground mb-2 font-sans">Peso (kg)</Text>
              <TextInput
                value={editWeight}
                onChangeText={setEditWeight}
                keyboardType="decimal-pad"
                placeholder="Opcional"
                placeholderTextColor="#71717A"
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground text-lg font-sans"
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                className="flex-1 bg-background border border-border py-4 rounded-xl"
              >
                <Text className="text-foreground text-center font-bold font-display">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveSetEdit}
                className="flex-1 bg-primary py-4 rounded-xl"
              >
                <Text className="text-black text-center font-bold font-display">Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Substitute Exercise Modal */}
      <Modal
        visible={showSubstituteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSubstituteModal(false)}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 mt-20 bg-background rounded-t-3xl">
            {/* Header */}
            <View className="p-6 border-b border-border">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-2xl font-bold text-foreground font-display">
                  Substituir Exercício
                </Text>
                <TouchableOpacity onPress={() => setShowSubstituteModal(false)} className="p-2">
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
              <View className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 mt-3">
                <View className="flex-row items-start">
                  <Ionicons name="warning" size={20} color="#F97316" />
                  <Text className="text-orange-500 text-xs ml-2 flex-1 font-sans">
                    Esta substituição vale APENAS para hoje. No próximo treino, o exercício original voltará.
                  </Text>
                </View>
              </View>
            </View>

            {/* Search */}
            <View className="p-6 border-b border-border">
              <View className="bg-surface border border-border rounded-xl flex-row items-center px-4">
                <Ionicons name="search" size={20} color="#71717A" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Buscar exercício..."
                  placeholderTextColor="#71717A"
                  className="flex-1 py-3 px-3 text-foreground font-sans"
                />
              </View>
            </View>

            {/* Exercise List */}
            <ScrollView className="flex-1 px-6">
              {availableExercises
                .filter(ex => 
                  ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  ex.muscle_group.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((exercise) => (
                  <TouchableOpacity
                    key={exercise.id}
                    onPress={() => handleConfirmSubstitution(exercise)}
                    className="bg-surface border border-border rounded-xl p-4 mb-3"
                  >
                    <Text className="text-foreground text-lg font-bold mb-1 font-display">
                      {exercise.name}
                    </Text>
                    <Text className="text-muted-foreground text-sm font-sans">
                      {exercise.muscle_group}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Feedback Modal */}
      {workoutLogId && (
        <FeedbackModal
          visible={showFeedbackModal}
          onClose={handleFeedbackClose}
          workoutLogId={workoutLogId}
          workoutName={workout?.title || 'Treino'}
        />
      )}
    </SafeAreaView>
  );
}
