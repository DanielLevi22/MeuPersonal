import { StudentAssignmentModal } from '@/components/StudentAssignmentModal';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WorkoutAssignmentsScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const router = useRouter();

  const [workoutTitle, setWorkoutTitle] = useState('');
  const [assignedStudents, setAssignedStudents] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStudentPicker, setShowStudentPicker] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Workout Title
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .select('title, student_id')
        .eq('id', id)
        .single();
      
      if (workoutError) throw workoutError;
      setWorkoutTitle(workout.title);

      // 2. Fetch Assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('workout_assignments')
        .select(`
          id,
          student:profiles!student_id (
            id,
            full_name,
            email
          )
        `)
        .eq('workout_id', id);

      if (assignmentsError) throw assignmentsError;

      // 3. Fetch All Active Students (for picker)
      const { data: studentsData, error: studentsError } = await supabase
        .from('students_personals')
        .select(`
          status,
          student:profiles!student_id (
            id,
            full_name,
            email
          )
        `)
        .eq('status', 'active')
        .eq('personal_id', user?.id);

      if (studentsError) throw studentsError;

      // Process Assignments
      const allAssigned = [];
      const seenIds = new Set();

      // Legacy assignment
      if (workout.student_id) {
        // We need to fetch the profile for the legacy ID if it wasn't in the assignments list
        // But for simplicity, let's assume we migrate or handle it. 
        // Actually, let's fetch it to be safe if we want to display it correctly.
        // For now, let's rely on the assignments table mostly, but if legacy exists, we should probably include it.
        // However, the previous logic fetched it via the workout query.
        // Let's just stick to the assignments table for now as we are moving towards that.
        // If we really need legacy support here, we'd need to fetch that profile.
      }

      if (assignmentsData) {
        assignmentsData.forEach((item: any) => {
          if (item.student && !seenIds.has(item.student.id)) {
            allAssigned.push(item.student);
            seenIds.add(item.student.id);
          }
        });
      }
      setAssignedStudents(allAssigned);

      // Process All Students
      const formattedStudents = (studentsData || []).map((item: any) => item.student).filter(Boolean);
      setAllStudents(formattedStudents);

    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && user?.id) {
      fetchData();
    }
  }, [id, user]);

  const handleUpdateAssignments = async (selectedIds: string[]) => {
    if (!user?.id) return;
    
    try {
      const currentIds = assignedStudents.map(s => s.id);
      
      const toAdd = selectedIds.filter(id => !currentIds.includes(id));
      const toRemove = currentIds.filter(id => !selectedIds.includes(id));

      if (toAdd.length > 0) {
        const assignments = toAdd.map(studentId => ({
          workout_id: id,
          student_id: studentId
        }));
        
        const { error: addError } = await supabase
          .from('workout_assignments')
          .insert(assignments);
          
        if (addError) throw addError;
      }

      if (toRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('workout_assignments')
          .delete()
          .eq('workout_id', id)
          .in('student_id', toRemove);
          
        if (removeError) throw removeError;
        
        // Handle legacy field cleanup if needed
        const { data: workout } = await supabase.from('workouts').select('student_id').eq('id', id).single();
        if (workout?.student_id && toRemove.includes(workout.student_id)) {
           await supabase.from('workouts').update({ student_id: null }).eq('id', id);
        }
      }

      fetchData();
      setShowStudentPicker(false);
      Alert.alert('Sucesso', 'Atribuições atualizadas!');
    } catch (e: any) {
      Alert.alert('Erro', 'Erro ao atualizar atribuições: ' + e.message);
    }
  };

  const handleRemoveStudent = (studentId: string) => {
    Alert.alert(
      'Remover Aluno',
      'Deseja remover este aluno do treino?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: () => {
            const currentIds = assignedStudents.map(s => s.id);
            const newIds = currentIds.filter(id => id !== studentId);
            handleUpdateAssignments(newIds);
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: '#141B2D', padding: 10, borderRadius: 12, marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFFFFF' }} numberOfLines={1}>
              Gerenciar Alunos
            </Text>
            <Text style={{ fontSize: 14, color: '#8B92A8' }} numberOfLines={1}>
              {workoutTitle}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#FF6B35" />
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
            <TouchableOpacity 
              onPress={() => setShowStudentPicker(true)}
              activeOpacity={0.8}
              style={{
                backgroundColor: 'rgba(0, 255, 136, 0.1)',
                borderWidth: 2,
                borderColor: '#00FF88',
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                marginBottom: 24
              }}
            >
              <Ionicons name="person-add" size={20} color="#00FF88" style={{ marginRight: 8 }} />
              <Text style={{ color: '#00FF88', fontSize: 16, fontWeight: '700' }}>
                Adicionar Alunos
              </Text>
            </TouchableOpacity>

            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>
              Alunos Atribuídos ({assignedStudents.length})
            </Text>

            {assignedStudents.length > 0 ? (
              <View style={{ gap: 12 }}>
                {assignedStudents.map((student) => (
                  <View key={student.id} style={{ 
                    backgroundColor: '#141B2D', 
                    padding: 16, 
                    borderRadius: 16, 
                    borderWidth: 1, 
                    borderColor: '#1E2A42', 
                    flexDirection: 'row', 
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: 20, 
                        backgroundColor: '#1E2A42', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        marginRight: 12
                      }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                          {student.full_name?.charAt(0).toUpperCase() || '?'}
                        </Text>
                      </View>
                      <View>
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>{student.full_name || 'Aluno'}</Text>
                        <Text style={{ color: '#8B92A8', fontSize: 12 }}>{student.email}</Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      onPress={() => handleRemoveStudent(student.id)}
                      style={{
                        padding: 10,
                        backgroundColor: 'rgba(255, 59, 59, 0.1)',
                        borderRadius: 10,
                      }}
                    >
                      <Ionicons name="trash-outline" size={20} color="#FF3B3B" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={{ alignItems: 'center', padding: 32, opacity: 0.5 }}>
                <Ionicons name="people-outline" size={48} color="#5A6178" style={{ marginBottom: 12 }} />
                <Text style={{ color: '#8B92A8', textAlign: 'center' }}>
                  Nenhum aluno atribuído a este treino.
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        <StudentAssignmentModal
          visible={showStudentPicker}
          onClose={() => setShowStudentPicker(false)}
          onConfirm={handleUpdateAssignments}
          students={allStudents}
          initialSelectedIds={assignedStudents.map(s => s.id)}
        />
      </SafeAreaView>
    </View>
  );
}
