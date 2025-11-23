import { ExerciseConfigModal } from '@/components/ExerciseConfigModal';
import { VideoPlayer } from '@/components/VideoPlayer';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { SelectedExercise, useWorkoutStore } from '@/store/workoutStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  // ... (fetchWorkoutDetails remains)

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
      <View style={{ flex: 1, backgroundColor: '#0A0E1A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={{ color: '#8B92A8', marginTop: 16, fontSize: 15 }}>Carregando treino...</Text>
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0E1A', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Ionicons name="alert-circle-outline" size={64} color="#5A6178" />
        <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: 16 }}>Treino não encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 24 }}>
          <LinearGradient
            colors={['#FF6B35', '#E85A2A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32 }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Voltar</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: '#141B2D', padding: 10, borderRadius: 12, marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF', flex: 1 }} numberOfLines={1}>
            {workout.title}
          </Text>
          <TouchableOpacity onPress={handleEditWorkout} style={{ backgroundColor: 'rgba(0, 217, 255, 0.15)', padding: 10, borderRadius: 12, marginRight: 8 }}>
            <Ionicons name="pencil" size={24} color="#00D9FF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteWorkout} disabled={deleting} style={{ backgroundColor: 'rgba(255, 59, 59, 0.15)', padding: 10, borderRadius: 12, marginRight: 8 }}>
            <Ionicons name="trash-outline" size={24} color="#FF3B3B" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {/* Description */}
          {workout.description && (
            <View style={{ backgroundColor: '#141B2D', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 2, borderColor: '#1E2A42' }}>
              <Text style={{ color: '#8B92A8', fontSize: 15, lineHeight: 22 }}>{workout.description}</Text>
            </View>
          )}

          {/* Manage Students Button */}
          <TouchableOpacity 
            onPress={() => router.push(`/workouts/${id}/assignments`)}
            activeOpacity={0.8}
            style={{ 
              backgroundColor: '#141B2D', 
              padding: 16, 
              borderRadius: 16, 
              marginBottom: 24, 
              borderWidth: 1, 
              borderColor: '#1E2A42',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ 
                backgroundColor: 'rgba(0, 217, 255, 0.1)', 
                padding: 10, 
                borderRadius: 10,
                marginRight: 12
              }}>
                <Ionicons name="people" size={24} color="#00D9FF" />
              </View>
              <View>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Gerenciar Alunos</Text>
                <Text style={{ color: '#8B92A8', fontSize: 13 }}>Atribuir ou remover alunos</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#5A6178" />
          </TouchableOpacity>

          {/* Exercises Section */}
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFFFFF' }}>Exercícios</Text>
              <Text style={{ fontSize: 14, color: '#8B92A8' }}>{workoutItems.length} {workoutItems.length === 1 ? 'exercício' : 'exercícios'}</Text>
            </View>

            {workoutItems.length > 0 ? (
              <View>
                {workoutItems.map((item, index) => (
                  <View key={item.id} style={{ backgroundColor: '#141B2D', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 2, borderColor: '#1E2A42' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <View style={{ backgroundColor: '#FF6B35', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>{index + 1}</Text>
                      </View>
                      <TouchableOpacity 
                        style={{ flex: 1 }}
                        onPress={() => handleEditExercise(item)}
                        activeOpacity={0.7}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>{item.exercise.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                          <View style={{ backgroundColor: 'rgba(0, 217, 255, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                            <Text style={{ color: '#00D9FF', fontSize: 11, fontWeight: '600' }}>{item.exercise.muscle_group}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => handleDeleteExercise(item.id)}
                        onPressIn={(e) => e.stopPropagation()}
                      >
                        <Ionicons name="trash" size={24} color="#FF3B3B" />
                      </TouchableOpacity>
                    </View>

                    {item.exercise.video_url && (
                      <View style={{ marginTop: 12, marginBottom: 12 }}>
                        <VideoPlayer videoUrl={item.exercise.video_url} height={200} />
                      </View>
                    )}

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={{ flex: 1, backgroundColor: '#0A0E1A', padding: 10, borderRadius: 10 }}>
                        <Text style={{ color: '#8B92A8', fontSize: 11, marginBottom: 2 }}>Séries</Text>
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>{item.sets}</Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: '#0A0E1A', padding: 10, borderRadius: 10 }}>
                        <Text style={{ color: '#8B92A8', fontSize: 11, marginBottom: 2 }}>Reps</Text>
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>{item.reps}</Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: '#0A0E1A', padding: 10, borderRadius: 10 }}>
                        <Text style={{ color: '#8B92A8', fontSize: 11, marginBottom: 2 }}>Descanso</Text>
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>{item.rest_time}s</Text>
                      </View>
                      {item.weight ? (
                        <View style={{ flex: 1, backgroundColor: '#0A0E1A', padding: 10, borderRadius: 10 }}>
                          <Text style={{ color: '#8B92A8', fontSize: 11, marginBottom: 2 }}>Carga</Text>
                          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>{item.weight}kg</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={{ backgroundColor: '#141B2D', borderRadius: 16, padding: 32, borderWidth: 2, borderColor: '#1E2A42', borderStyle: 'dashed', alignItems: 'center' }}>
                <View style={{ backgroundColor: 'rgba(90, 97, 120, 0.2)', padding: 16, borderRadius: 50, marginBottom: 16 }}>
                  <Ionicons name="barbell-outline" size={48} color="#5A6178" />
                </View>
                <Text style={{ color: '#8B92A8', fontSize: 15, textAlign: 'center', marginBottom: 20 }}>Nenhum exercício adicionado.</Text>
                <TouchableOpacity onPress={() => router.push('/workouts/select-exercises' as any)} activeOpacity={0.8} style={{ backgroundColor: 'rgba(0, 255, 136, 0.1)', borderWidth: 2, borderColor: '#00FF88', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}>
                  <Text style={{ color: '#00FF88', fontSize: 15, fontWeight: '700' }}>Adicionar Exercício</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Add More Button */}
            <TouchableOpacity onPress={() => router.push('/workouts/select-exercises' as any)} activeOpacity={0.8} style={{ backgroundColor: 'rgba(0, 255, 136, 0.1)', borderWidth: 2, borderColor: '#00FF88', borderRadius: 16, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 4 }}>
              <Ionicons name="add-circle-outline" size={20} color="#00FF88" style={{ marginRight: 8 }} />
              <Text style={{ color: '#00FF88', fontSize: 15, fontWeight: '700' }}>Adicionar Mais Exercícios</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Workout Edit Modal */}
      {showWorkoutEditModal && (
        <>
          <TouchableOpacity 
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              backgroundColor: 'rgba(0, 0, 0, 0.8)' 
            }}
            activeOpacity={1}
            onPress={() => setShowWorkoutEditModal(false)}
          />
          <View style={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            backgroundColor: '#141B2D', 
            borderTopLeftRadius: 24, 
            borderTopRightRadius: 24, 
            padding: 24,
            borderTopWidth: 2, 
            borderTopColor: '#1E2A42',
            maxHeight: '70%' 
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFFFFF' }}>Editar Treino</Text>
              <TouchableOpacity onPress={() => setShowWorkoutEditModal(false)}>
                <Ionicons name="close" size={28} color="#8B92A8" />
              </TouchableOpacity>
            </View>
            
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#8B92A8', fontSize: 13, marginBottom: 8, fontWeight: '600' }}>Título</Text>
              <TextInput 
                value={editTitle} 
                onChangeText={setEditTitle} 
                placeholder="Nome do treino" 
                placeholderTextColor="#5A6178" 
                style={{ 
                  backgroundColor: '#0A0E1A', 
                  borderWidth: 2, 
                  borderColor: '#1E2A42', 
                  borderRadius: 12, 
                  padding: 16, 
                  color: '#FFFFFF', 
                  fontSize: 16 
                }}
              />
            </View>
            
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: '#8B92A8', fontSize: 13, marginBottom: 8, fontWeight: '600' }}>Descrição</Text>
              <TextInput 
                value={editDescription} 
                onChangeText={setEditDescription} 
                placeholder="Descrição do treino (opcional)" 
                placeholderTextColor="#5A6178"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{ 
                  backgroundColor: '#0A0E1A', 
                  borderWidth: 2, 
                  borderColor: '#1E2A42', 
                  borderRadius: 12, 
                  padding: 16, 
                  color: '#FFFFFF', 
                  fontSize: 16,
                  minHeight: 100
                }}
              />
            </View>
            
            <TouchableOpacity 
              onPress={handleSaveWorkout}
              activeOpacity={0.8} 
              style={{ 
                backgroundColor: '#00D9FF', 
                padding: 16, 
                borderRadius: 12, 
                alignItems: 'center'
              }}
            >
              <Text style={{ color: '#0A0E1A', fontSize: 16, fontWeight: '700' }}>Salvar Alterações</Text>
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
