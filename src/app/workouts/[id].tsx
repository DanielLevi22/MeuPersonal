import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface WorkoutItem {
  id: string;
  exercise: {
    id: string;
    name: string;
    muscle_group: string;
  };
  sets: number;
  reps: number;
  rest_time: number;
  order: number;
}

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const router = useRouter();

  const [workout, setWorkout] = useState<any>(null);
  const [workoutItems, setWorkoutItems] = useState<WorkoutItem[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Fetch workout details
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

  // Fetch students for assignment
  const fetchStudents = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('students_personals')
        .select(`
          status,
          student:profiles!student_id (
            id,
            full_name,
            email
          )
        `);
      if (error) throw error;
      setStudents(data);
    } catch (e: any) {
      console.error(e);
    }
  };

  // Initial load
  useEffect(() => {
    if (id) {
      fetchWorkoutDetails();
      fetchStudents();
    }
  }, [id]);

  // Refresh when returning from select-exercises screen
  useFocusEffect(
    useCallback(() => {
      if (id) fetchWorkoutDetails();
    }, [id])
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

  const handleAssignToStudent = async (studentId: string) => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('workouts')
        .update({ student_id: studentId })
        .eq('id', id);
      if (error) throw error;
      fetchWorkoutDetails();
    } catch (e: any) {
      Alert.alert('Erro ao atribuir aluno', e.message);
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

          {/* Assigned status */}
          {workout.student_id && (
            <View style={{ backgroundColor: 'rgba(0, 255, 136, 0.1)', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 2, borderColor: 'rgba(0, 255, 136, 0.3)', flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="checkmark-circle" size={24} color="#00FF88" />
              <Text style={{ color: '#00FF88', marginLeft: 12, fontSize: 15, fontWeight: '700' }}>Atribuído a um aluno</Text>
            </View>
          )}

          {/* Assign to student */}
          {!workout.student_id && students.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <TouchableOpacity onPress={() => setShowStudentPicker(!showStudentPicker)} activeOpacity={0.8} style={{ backgroundColor: 'rgba(0, 217, 255, 0.1)', borderWidth: 2, borderColor: '#00D9FF', borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ color: '#00D9FF', fontSize: 16, fontWeight: '700' }}>Atribuir a Aluno</Text>
              </TouchableOpacity>
              {showStudentPicker && (
                <View style={{ marginTop: 12 }}>
                  {students.map((student) => (
                    <TouchableOpacity key={student.id} onPress={() => handleAssignToStudent(student.id)} activeOpacity={0.8} style={{ backgroundColor: '#141B2D', padding: 16, borderRadius: 16, marginBottom: 8, borderWidth: 2, borderColor: '#1E2A42' }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>{student.full_name || 'Sem nome'}</Text>
                      <Text style={{ color: '#8B92A8', fontSize: 14 }}>{student.email}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

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
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>{item.exercise.name}</Text>
                        <View style={{ backgroundColor: 'rgba(0, 217, 255, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' }}>
                          <Text style={{ color: '#00D9FF', fontSize: 11, fontWeight: '600' }}>{item.exercise.muscle_group}</Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteExercise(item.id)}>
                        <Ionicons name="trash" size={24} color="#FF3B3B" />
                      </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', marginTop: 8, gap: 12 }}>
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
    </View>
  );
}
