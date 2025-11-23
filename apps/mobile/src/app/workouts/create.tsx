import { Exercise, ExerciseConfigModal } from '@/components/ExerciseConfigModal';
import { StudentMultiSelect } from '@/components/StudentMultiSelect';
import { supabase } from '@meupersonal/supabase';
import { useAuthStore } from '@/store/authStore';
import { useStudentStore } from '@/store/studentStore';
import { SelectedExercise, useWorkoutStore } from '@/store/workoutStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateWorkoutScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const { user } = useAuthStore();
  const { fetchWorkouts, selectedExercises: storeExercises, clearSelectedExercises } = useWorkoutStore();
  const { students, fetchStudents } = useStudentStore();
  const router = useRouter();

  // Sync with store when returning from select exercises screen
  useEffect(() => {
    if (storeExercises.length > 0) {
      setSelectedExercises(storeExercises);
    }
  }, [storeExercises]);

  // Fetch students on mount
  useEffect(() => {
    if (user?.id) {
      fetchStudents(user.id);
    }
  }, [user]);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Erro', 'O título do treino é obrigatório.');
      return;
    }

    if (!user?.id) return;

    setLoading(true);
    try {
      // Create workout
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          title,
          description,
          personal_id: user.id,
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Insert workout items if there are selected exercises
      if (selectedExercises.length > 0) {
        const workoutItems = selectedExercises.map((exercise, index) => ({
          workout_id: workout.id,
          exercise_id: exercise.id,
          sets: exercise.sets,
          reps: exercise.reps.toString(),
          weight: exercise.weight,
          rest_time: exercise.rest_seconds,
          order: index,
        }));

        const { error: itemsError } = await supabase
          .from('workout_items')
          .insert(workoutItems);

        if (itemsError) throw itemsError;
      }

      // Create workout assignments
      if (selectedStudentIds.length > 0) {
        const assignments = selectedStudentIds.map(studentId => ({
          workout_id: workout.id,
          student_id: studentId,
        }));

        const { error: assignmentError } = await supabase
          .from('workout_assignments')
          .insert(assignments);

        if (assignmentError) throw assignmentError;
      }

      Alert.alert('Sucesso! 🎉', 'Treino criado com sucesso!');
      clearSelectedExercises(); // Clear store
      fetchWorkouts(user.id);
      router.back();
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExercise = () => {
    router.push('/workouts/select-exercises' as any);
  };

  const removeExercise = (index: number) => {
    const newExercises = selectedExercises.filter((_, i) => i !== index);
    setSelectedExercises(newExercises);
    // Update store as well
    const { setSelectedExercises: setStoreExercises } = useWorkoutStore.getState();
    setStoreExercises(newExercises);
  };

  const editExercise = (index: number) => {
    const exercise = selectedExercises[index];
    setCurrentExercise({
      id: exercise.id,
      name: exercise.name,
      muscle_group: exercise.muscle_group,
      video_url: exercise.video_url || null,
    });
    setEditingExerciseIndex(index);
    setShowEditModal(true);
  };

  const handleSaveExercise = (updatedExercise: SelectedExercise) => {
    if (editingExerciseIndex !== null) {
      const updated = [...selectedExercises];
      updated[editingExerciseIndex] = updatedExercise;
      setSelectedExercises(updated);
      // Update store as well
      const { setSelectedExercises: setStoreExercises } = useWorkoutStore.getState();
      setStoreExercises(updated);
    }
    setShowEditModal(false);
    setEditingExerciseIndex(null);
    setCurrentExercise(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header with Back Button */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 24
        }}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={{
              backgroundColor: '#141B2D',
              padding: 10,
              borderRadius: 12,
              marginRight: 16
            }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFFFFF' }}>
              Novo Treino
            </Text>
            <Text style={{ fontSize: 14, color: '#8B92A8', marginTop: 2 }}>
              Crie um treino personalizado
            </Text>
          </View>
        </View>

        <ScrollView 
          style={{ flex: 1, paddingHorizontal: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Student Selection */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ 
              color: '#FFFFFF', 
              fontSize: 14, 
              fontWeight: '600',
              marginBottom: 8
            }}>
              Atribuir a Alunos (Opcional)
            </Text>
            <StudentMultiSelect
              students={students.filter(s => !s.is_invite)}
              selectedIds={selectedStudentIds}
              onSelectionChange={setSelectedStudentIds}
            />
          </View>

          {/* Title Input */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ 
              color: '#FFFFFF', 
              fontSize: 14, 
              fontWeight: '600',
              marginBottom: 8
            }}>
              Título do Treino
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Treino A - Peito e Tríceps"
              placeholderTextColor="#5A6178"
              style={{
                backgroundColor: '#141B2D',
                borderWidth: 2,
                borderColor: '#1E2A42',
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 16,
                color: '#FFFFFF',
                fontSize: 16,
                minHeight: 56
              }}
            />
          </View>

          {/* Description Input */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ 
              color: '#FFFFFF', 
              fontSize: 14, 
              fontWeight: '600',
              marginBottom: 8
            }}>
              Descrição (Opcional)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Ex: Foco em hipertrofia, descanso de 60s..."
              placeholderTextColor="#5A6178"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{
                backgroundColor: '#141B2D',
                borderWidth: 2,
                borderColor: '#1E2A42',
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 16,
                color: '#FFFFFF',
                fontSize: 16,
                minHeight: 120
              }}
            />
          </View>

          {/* Exercises Section */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>
                Exercícios
              </Text>
              <Text style={{ color: '#8B92A8', fontSize: 14 }}>
                {selectedExercises.length} {selectedExercises.length === 1 ? 'exercício' : 'exercícios'}
              </Text>
            </View>

            {selectedExercises.length > 0 ? (
              <View>
                {selectedExercises.map((exercise, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: '#141B2D',
                      padding: 16,
                      borderRadius: 16,
                      marginBottom: 12,
                      borderWidth: 2,
                      borderColor: '#1E2A42'
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <View style={{
                        backgroundColor: '#FF6B35',
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12
                      }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
                          {index + 1}
                        </Text>
                      </View>
                      <TouchableOpacity 
                        style={{ flex: 1 }}
                        onPress={() => editExercise(index)}
                        activeOpacity={0.7}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>
                          {exercise.name}
                        </Text>
                        <View style={{
                          backgroundColor: 'rgba(0, 217, 255, 0.15)',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                          alignSelf: 'flex-start'
                        }}>
                          <Text style={{ color: '#00D9FF', fontSize: 11, fontWeight: '600' }}>
                            {exercise.muscle_group}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => removeExercise(index)}
                        onPressIn={(e) => e.stopPropagation()}
                      >
                        <Ionicons name="close-circle" size={24} color="#FF3B3B" />
                      </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', marginTop: 8, gap: 12 }}>
                      <View style={{ flex: 1, backgroundColor: '#0A0E1A', padding: 10, borderRadius: 10 }}>
                        <Text style={{ color: '#8B92A8', fontSize: 11, marginBottom: 2 }}>Séries</Text>
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>{exercise.sets}</Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: '#0A0E1A', padding: 10, borderRadius: 10 }}>
                        <Text style={{ color: '#8B92A8', fontSize: 11, marginBottom: 2 }}>Reps</Text>
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>{exercise.reps}</Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: '#0A0E1A', padding: 10, borderRadius: 10 }}>
                        <Text style={{ color: '#8B92A8', fontSize: 11, marginBottom: 2 }}>Descanso</Text>
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>{exercise.rest_seconds}s</Text>
                      </View>
                      {exercise.weight ? (
                        <View style={{ flex: 1, backgroundColor: '#0A0E1A', padding: 10, borderRadius: 10 }}>
                          <Text style={{ color: '#8B92A8', fontSize: 11, marginBottom: 2 }}>Carga</Text>
                          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>{exercise.weight}kg</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={{
                backgroundColor: '#141B2D',
                borderRadius: 16,
                padding: 24,
                borderWidth: 2,
                borderColor: '#1E2A42',
                borderStyle: 'dashed',
                alignItems: 'center'
              }}>
                <View style={{
                  backgroundColor: 'rgba(0, 255, 136, 0.15)',
                  padding: 16,
                  borderRadius: 50,
                  marginBottom: 12
                }}>
                  <Ionicons name="barbell-outline" size={40} color="#00FF88" />
                </View>
                <Text style={{ color: '#8B92A8', fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
                  Adicione exercícios ao seu treino
                </Text>
              </View>
            )}

            <TouchableOpacity 
              onPress={handleAddExercise}
              activeOpacity={0.8}
              style={{
                backgroundColor: 'rgba(0, 255, 136, 0.1)',
                borderWidth: 2,
                borderColor: '#00FF88',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                marginTop: 12,
                flexDirection: 'row',
                justifyContent: 'center'
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color="#00FF88" style={{ marginRight: 8 }} />
              <Text style={{ color: '#00FF88', fontSize: 15, fontWeight: '700' }}>
                Adicionar Exercícios
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={{ 
          padding: 24, 
          borderTopWidth: 2, 
          borderTopColor: '#1E2A42' 
        }}>
          <TouchableOpacity 
            onPress={handleCreate}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#00FF88', '#00CC6E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Text style={{ 
                color: '#0A0E1A', 
                fontSize: 18, 
                fontWeight: '700'
              }}>
                {loading ? 'Salvando...' : 'Salvar Treino'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Exercise Edit Modal */}
      {currentExercise && (
        <ExerciseConfigModal
          visible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingExerciseIndex(null);
            setCurrentExercise(null);
          }}
          exercise={currentExercise}
          initialData={editingExerciseIndex !== null ? selectedExercises[editingExerciseIndex] : undefined}
          onSave={handleSaveExercise}
        />
      )}
    </View>
  );
}
