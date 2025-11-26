import { VideoPlayer } from '@/components/VideoPlayer';
import { useAuthStore } from '@/modules/auth';
import type { SelectedExercise } from '@/modules/workout/store/workoutStore';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@meupersonal/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExerciseConfigModal } from '../components/ExerciseConfigModal';
import { useWorkoutStore } from '../store/workoutStore';

interface WorkoutItem {
  id: string;
  exercise: {
    id: string;
    name: string;
    muscle_group: string;
    video_url?: string;
  };
  sets: number;
  reps: number | string;
  weight?: string;
  rest_time: number;
  order: number;
}

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const router = useRouter();

  const [workout, setWorkout] = useState<any>(null);
  const [workoutItems, setWorkoutItems] = useState<WorkoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkoutItem | null>(null);
  const [showWorkoutEditModal, setShowWorkoutEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Fetch workout details
  const fetchWorkoutDetails = async () => {
    try {
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .select(`
          *,
          student:profiles!student_id (
            id,
            full_name,
            email
          )
        `)
        .eq('id', id)
        .maybeSingle();
      if (workoutError) throw workoutError;
      
      if (!workoutData) {
        setLoading(false);
        return;
      }
      
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
            muscle_group,
            video_url
          )
        `)
        .eq('workout_id', id)
        .order('order', { ascending: true });
      if (itemsError) throw itemsError;
      // Transform to match interface (exercise may come as array)
      const transformed = (itemsData || []).map((item: any) => ({
        ...item,
        exercise: Array.isArray(item.exercise) ? item.exercise[0] : item.exercise,
      }));
      setWorkoutItems(transformed);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (id) {
      fetchWorkoutDetails();
    }
  }, [id]);

  const { selectedExercises, clearSelectedExercises } = useWorkoutStore();

  // Refresh when returning
  useFocusEffect(
    useCallback(() => {
      const handleNewExercises = async () => {
        if (selectedExercises.length > 0) {
          try {
            setLoading(true);
            
            // Get current max order
            const currentMaxOrder = workoutItems.length > 0 
              ? Math.max(...workoutItems.map(i => i.order)) 
              : -1;

            const newItems = selectedExercises.map((ex, index) => ({
              workout_id: id,
              exercise_id: ex.id,
              sets: ex.sets,
              reps: ex.reps.toString(),
              weight: ex.weight,
              rest_time: ex.rest_seconds,
              order: currentMaxOrder + 1 + index
            }));

            const { error } = await supabase
              .from('workout_items')
              .insert(newItems);

            if (error) throw error;

            clearSelectedExercises();
            Alert.alert('Sucesso', 'Novos exercícios adicionados!');
          } catch (e: any) {
            Alert.alert('Erro', 'Falha ao adicionar exercícios: ' + e.message);
          }
        }
        
        if (id) fetchWorkoutDetails();
      };

      handleNewExercises();
    }, [id, selectedExercises])
  );

  const handleDeleteWorkout = () => {
    Alert.alert(
      'Deletar Treino',
      'Tem certeza que deseja deletar este treino? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await supabase.from('workout_items').delete().eq('workout_id', id);
              const { error } = await supabase.from('workouts').delete().eq('id', id);
              if (error) throw error;
              Alert.alert('Sucesso! ✅', 'Treino deletado com sucesso!');
              router.back();
            } catch (e: any) {
              Alert.alert('Erro', e.message);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteExercise = async (exerciseItemId: string) => {
    try {
      await supabase.from('workout_items').delete().eq('id', exerciseItemId);
      fetchWorkoutDetails();
    } catch (e: any) {
      Alert.alert('Erro ao deletar exercício', e.message);
    }
  };

  const handleEditExercise = (item: WorkoutItem) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleSaveExercise = async (updatedExercise: SelectedExercise) => {
    if (!editingItem) return;
    
    try {
      const { error } = await supabase
        .from('workout_items')
        .update({
          sets: updatedExercise.sets,
          reps: updatedExercise.reps.toString(),
          weight: updatedExercise.weight,
          rest_time: updatedExercise.rest_seconds,
        })
        .eq('id', editingItem.id);
      
      if (error) throw error;
      
      // Update video URL if changed
      if (updatedExercise.video_url !== editingItem.exercise.video_url) {
        await supabase
          .from('exercises')
          .update({ video_url: updatedExercise.video_url || null })
          .eq('id', editingItem.exercise.id);
      }
      
      fetchWorkoutDetails();
      setShowEditModal(false);
      setEditingItem(null);
    } catch (e: any) {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    }
  };

  const handleEditWorkout = () => {
    setEditTitle(workout.title);
    setEditDescription(workout.description || '');
    setShowWorkoutEditModal(true);
  };

  const handleSaveWorkout = async () => {
    if (!editTitle.trim()) {
      Alert.alert('Erro', 'O título não pode estar vazio.');
      return;
    }

    try {
      const { error } = await supabase
        .from('workouts')
        .update({
          title: editTitle,
          description: editDescription || null
        })
        .eq('id', id);

      if (error) throw error;

      setShowWorkoutEditModal(false);
      fetchWorkoutDetails();
      Alert.alert('Sucesso', 'Treino atualizado!');
    } catch (e: any) {
      Alert.alert('Erro', 'Não foi possível salvar: ' + e.message);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#F97316" />
        <Text className="text-muted-foreground mt-4 text-base">Carregando treino...</Text>
      </View>
    );
  }

  if (!workout) {
    return (
      <View className="flex-1 bg-background justify-center items-center p-6">
        <Ionicons name="alert-circle-outline" size={64} color="#A1A1AA" />
        <Text className="text-foreground text-xl font-bold mt-4">Treino não encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-6">
          <LinearGradient
            colors={['#FF6B35', '#E85A2A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-2xl py-3.5 px-8"
          >
            <Text className="text-white text-base font-bold">Voltar</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-6 pt-4 pb-6">
          <TouchableOpacity onPress={() => router.back()} className="bg-card p-2.5 rounded-xl mr-4">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-2xl font-extrabold text-foreground flex-1" numberOfLines={1}>
            {workout.title}
          </Text>
          <TouchableOpacity onPress={handleEditWorkout} className="bg-cyan-400/15 p-2.5 rounded-xl mr-2">
            <Ionicons name="pencil" size={24} color="#22D3EE" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteWorkout} disabled={deleting} className="bg-red-500/15 p-2.5 rounded-xl mr-2">
            <Ionicons name="trash-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {/* Description */}
          {workout.description && (
            <View className="bg-card p-4 rounded-2xl mb-4 border-2 border-border">
              <Text className="text-muted-foreground text-base leading-6">{workout.description}</Text>
            </View>
          )}

          {/* Manage Students Button */}
          <TouchableOpacity 
            onPress={() => router.push(`/workouts/${id}/assignments`)}
            activeOpacity={0.8}
            className="bg-card p-4 rounded-2xl mb-6 border border-border flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <View className="bg-cyan-400/10 p-2.5 rounded-xl mr-3">
                <Ionicons name="people" size={24} color="#22D3EE" />
              </View>
              <View>
                <Text className="text-foreground text-base font-bold">Gerenciar Alunos</Text>
                <Text className="text-muted-foreground text-xs">Atribuir ou remover alunos</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#5A6178" />
          </TouchableOpacity>

          {/* Exercises Section */}
          <View>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-extrabold text-foreground">Exercícios</Text>
              <Text className="text-sm text-muted-foreground">{workoutItems.length} {workoutItems.length === 1 ? 'exercício' : 'exercícios'}</Text>
            </View>

            {workoutItems.length > 0 ? (
              <View>
                {workoutItems.map((item, index) => (
                  <View key={item.id} className="bg-card p-4 rounded-2xl mb-3 border-2 border-border">
                    <View className="flex-row items-center mb-2">
                      <View className="bg-orange-500 w-7 h-7 rounded-full items-center justify-center mr-3">
                        <Text className="text-white text-sm font-bold">{index + 1}</Text>
                      </View>
                      <TouchableOpacity 
                        className="flex-1"
                        onPress={() => handleEditExercise(item)}
                        activeOpacity={0.7}
                      >
                        <Text className="text-foreground text-base font-bold">{item.exercise.name}</Text>
                        <View className="flex-row items-center mt-1">
                          <View className="bg-cyan-400/15 px-2 py-1 rounded-md">
                            <Text className="text-cyan-400 text-[11px] font-semibold">{item.exercise.muscle_group}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => handleDeleteExercise(item.id)}
                        onPressIn={(e) => e.stopPropagation()}
                      >
                        <Ionicons name="trash" size={24} color="#EF4444" />
                      </TouchableOpacity>
                    </View>

                    {item.exercise.video_url && (
                      <View className="mt-3 mb-3">
                        <VideoPlayer videoUrl={item.exercise.video_url} height={200} />
                      </View>
                    )}

                    <View className="flex-row gap-3">
                      <View className="flex-1 bg-background p-2.5 rounded-xl">
                        <Text className="text-muted-foreground text-[11px] mb-0.5">Séries</Text>
                        <Text className="text-foreground text-base font-bold">{item.sets}</Text>
                      </View>
                      <View className="flex-1 bg-background p-2.5 rounded-xl">
                        <Text className="text-muted-foreground text-[11px] mb-0.5">Reps</Text>
                        <Text className="text-foreground text-base font-bold">{item.reps}</Text>
                      </View>
                      <View className="flex-1 bg-background p-2.5 rounded-xl">
                        <Text className="text-muted-foreground text-[11px] mb-0.5">Descanso</Text>
                        <Text className="text-foreground text-base font-bold">{item.rest_time}s</Text>
                      </View>
                      {item.weight ? (
                        <View className="flex-1 bg-background p-2.5 rounded-xl">
                          <Text className="text-muted-foreground text-[11px] mb-0.5">Carga</Text>
                          <Text className="text-foreground text-base font-bold">{item.weight}kg</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="bg-card rounded-2xl p-8 border-2 border-border border-dashed items-center">
                <View className="bg-muted/20 p-4 rounded-full mb-4">
                  <Ionicons name="barbell-outline" size={48} color="#5A6178" />
                </View>
                <Text className="text-muted-foreground text-base text-center mb-5">Nenhum exercício adicionado.</Text>
                <TouchableOpacity onPress={() => router.push('/workouts/select-exercises' as any)} activeOpacity={0.8} className="bg-lime-400/10 border-2 border-lime-400 rounded-xl py-3 px-6">
                  <Text className="text-lime-400 text-base font-bold">Adicionar Exercício</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Add More Button */}
            <TouchableOpacity onPress={() => router.push('/workouts/select-exercises' as any)} activeOpacity={0.8} className="bg-lime-400/10 border-2 border-lime-400 rounded-2xl py-3.5 items-center flex-row justify-center mt-1">
              <Ionicons name="add-circle-outline" size={20} color="#A3E635" style={{ marginRight: 8 }} />
              <Text className="text-lime-400 text-base font-bold">Adicionar Mais Exercícios</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Workout Edit Modal */}
      {showWorkoutEditModal && (
        <>
          <TouchableOpacity 
            className="absolute inset-0 bg-black/80"
            activeOpacity={1}
            onPress={() => setShowWorkoutEditModal(false)}
          />
          <View className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl p-6 border-t-2 border-border max-h-[70%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-extrabold text-foreground">Editar Treino</Text>
              <TouchableOpacity onPress={() => setShowWorkoutEditModal(false)}>
                <Ionicons name="close" size={28} color="#A1A1AA" />
              </TouchableOpacity>
            </View>
            
            <View className="mb-4">
              <Text className="text-muted-foreground text-xs mb-2 font-semibold">Título</Text>
              <TextInput 
                value={editTitle} 
                onChangeText={setEditTitle} 
                placeholder="Nome do treino" 
                placeholderTextColor="#5A6178" 
                className="bg-background border-2 border-border rounded-xl p-4 text-foreground text-base"
              />
            </View>
            
            <View className="mb-6">
              <Text className="text-muted-foreground text-xs mb-2 font-semibold">Descrição</Text>
              <TextInput 
                value={editDescription} 
                onChangeText={setEditDescription} 
                placeholder="Descrição do treino (opcional)" 
                placeholderTextColor="#5A6178"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="bg-background border-2 border-border rounded-xl p-4 text-foreground text-base min-h-[100px]"
              />
            </View>
            
            <TouchableOpacity 
              onPress={handleSaveWorkout}
              activeOpacity={0.8} 
              className="bg-cyan-400 p-4 rounded-xl items-center"
            >
              <Text className="text-background text-base font-bold">Salvar Alterações</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Exercise Edit Modal */}
      {editingItem && (
        <ExerciseConfigModal
          visible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingItem(null);
          }}
          exercise={{
            id: editingItem.exercise.id,
            name: editingItem.exercise.name,
            muscle_group: editingItem.exercise.muscle_group,
            video_url: editingItem.exercise.video_url || null,
          }}
          initialData={{
            id: editingItem.exercise.id,
            name: editingItem.exercise.name,
            muscle_group: editingItem.exercise.muscle_group,
            sets: editingItem.sets,
            reps: typeof editingItem.reps === 'string' ? parseInt(editingItem.reps) : editingItem.reps,
            weight: editingItem.weight || '',
            rest_seconds: editingItem.rest_time,
            video_url: editingItem.exercise.video_url,
          }}
          onSave={handleSaveExercise}
        />
      )}
    </View>
  );
}
