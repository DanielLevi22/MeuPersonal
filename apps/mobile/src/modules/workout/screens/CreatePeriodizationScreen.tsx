import { useAuthStore } from '@/auth';
import { StudentPickerModal } from '@/components/StudentPickerModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@meupersonal/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useWorkoutStore } from '../store/workoutStore';

const OBJECTIVE_OPTIONS = [
  { label: 'Hipertrofia', value: 'hypertrophy' },
  { label: 'Força', value: 'strength' },
  { label: 'Resistência', value: 'endurance' },
  { label: 'Emagrecimento', value: 'weight_loss' },
  { label: 'Condicionamento', value: 'conditioning' },
];

export default function CreatePeriodizationScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createPeriodization } = useWorkoutStore();

  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [studentId, setStudentId] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const [students, setStudents] = useState<any[]>([]);
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [showObjectivePicker, setShowObjectivePicker] = useState(false);

  // Fetch students on mount
  useEffect(() => {
    fetchStudents();
  }, [user]);

  const fetchStudents = async () => {
    if (!user?.id) return;

    try {
      // 1. Fetch active students
      const { data: activeData, error: activeError } = await supabase
        .from('students_personals')
        .select(`
          student:profiles!student_id (
            id,
            full_name
          )
        `)
        .eq('personal_id', user.id)
        .eq('status', 'active');

      // 2. Fetch pending students
      const { data: pendingData, error: pendingError } = await supabase
        .from('students')
        .select('id, full_name')
        .eq('personal_id', user.id)
        .not('invite_code', 'is', null);

      if (!activeError && !pendingError) {
        const activeList = activeData?.map((item: any) => item.student).filter(Boolean) || [];
        const pendingList = pendingData || [];
        
        // Merge and deduplicate
        const allStudents = [...activeList, ...pendingList];
        const uniqueStudents = Array.from(new Map(allStudents.map(item => [item.id, item])).values());
        
        setStudents(uniqueStudents);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'O nome da periodização é obrigatório.');
      return;
    }

    if (!objective.trim()) {
      Alert.alert('Erro', 'O objetivo da periodização é obrigatório.');
      return;
    }

    if (!studentId) {
      Alert.alert('Erro', 'Selecione um aluno.');
      return;
    }

    if (!user?.id) return;

    setLoading(true);

    try {
      const data = await createPeriodization({
        name,
        objective,
        student_id: studentId,
        personal_id: user.id,
        professional_id: user.id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'planned',
        notes: notes || null,
      } as any);

      Alert.alert('Sucesso', 'Periodização criada com sucesso!', [
        {
          text: 'OK',
          onPress: () => {
             // Navigate to the periodization details/edit screen
             router.replace(`/(tabs)/students/${studentId}/workouts/${data.id}` as any);
          },
        },
      ]);
    } catch (error) {
      console.error('Error creating periodization:', error);
      Alert.alert('Erro', 'Não foi possível criar a periodização.');
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = students.find(s => s.id === studentId);
  const selectedObjective = OBJECTIVE_OPTIONS.find(o => o.value === objective);

  return (
    <ScreenLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center px-6 py-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-zinc-800/50 p-2.5 rounded-xl mr-4 border border-zinc-700"
          >
            <Ionicons name="arrow-back" size={24} color="#FF6B35" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground font-display">
            Nova Periodização
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 0 }}>
          {/* Nome */}
          <View className="mb-4">
            <Text className="text-foreground text-sm font-semibold mb-2 font-sans">
              Nome da Periodização *
            </Text>
            <Input
              value={name}
              onChangeText={setName}
              placeholder="Ex: Hipertrofia - Ciclo 1"
            />
          </View>

          {/* Objetivo */}
          <View className="mb-4">
            <Text className="text-foreground text-sm font-semibold mb-2 font-sans">
              Objetivo *
            </Text>
            <TouchableOpacity
              onPress={() => setShowObjectivePicker(true)}
              className="bg-zinc-900/80 border-2 border-zinc-700 rounded-2xl px-4 py-4 flex-row items-center justify-between"
            >
              <Text className={selectedObjective ? 'text-foreground text-base' : 'text-zinc-500 text-base'}>
                {selectedObjective ? selectedObjective.label : 'Selecione um objetivo'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#71717A" />
            </TouchableOpacity>

            <Modal
              visible={showObjectivePicker}
              transparent
              animationType="fade"
              onRequestClose={() => setShowObjectivePicker(false)}
            >
              <TouchableOpacity 
                className="flex-1 bg-black/80 justify-center px-6"
                activeOpacity={1}
                onPress={() => setShowObjectivePicker(false)}
              >
                <View className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800">
                  <View className="p-4 border-b border-zinc-800 flex-row justify-between items-center">
                    <Text className="text-white font-bold text-lg font-display">Selecione o Objetivo</Text>
                    <TouchableOpacity onPress={() => setShowObjectivePicker(false)}>
                      <Ionicons name="close" size={24} color="#A1A1AA" />
                    </TouchableOpacity>
                  </View>
                  
                  {OBJECTIVE_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      className={`p-4 border-b border-zinc-800 flex-row items-center justify-between ${objective === option.value ? 'bg-zinc-800' : ''}`}
                      onPress={() => {
                        setObjective(option.value);
                        setShowObjectivePicker(false);
                      }}
                    >
                      <Text className={`text-base ${objective === option.value ? 'text-orange-500 font-bold' : 'text-zinc-300'}`}>
                        {option.label}
                      </Text>
                      {objective === option.value && (
                        <Ionicons name="checkmark" size={20} color="#F97316" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </Modal>
          </View>

          {/* Student Selector */}
          <View className="mb-4">
            <Text className="text-foreground text-sm font-semibold mb-2 font-sans">
              Aluno *
            </Text>
            <TouchableOpacity
              onPress={() => setShowStudentPicker(!showStudentPicker)}
              className="bg-zinc-900/80 border-2 border-zinc-700 rounded-2xl px-4 py-4 flex-row items-center justify-between"
            >
              <Text className={selectedStudent ? 'text-foreground text-base' : 'text-zinc-500 text-base'}>
                {selectedStudent ? selectedStudent.full_name : 'Selecione um aluno'}
              </Text>
              <Ionicons
                name={showStudentPicker ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#71717A"
              />
            </TouchableOpacity>

            <StudentPickerModal
              visible={showStudentPicker}
              onClose={() => setShowStudentPicker(false)}
              onSelect={(student) => setStudentId(student.id)}
              students={students}
              selectedStudentId={studentId}
            />
          </View>

          {/* Dates */}
          <View className="flex-row gap-4 mb-4">
            <View className="flex-1">
              <Text className="text-foreground text-sm font-semibold mb-2 font-sans">
                Data Início *
              </Text>
              <TouchableOpacity
                onPress={() => setShowStartPicker(true)}
                className="bg-zinc-900/80 border-2 border-zinc-700 rounded-2xl px-4 py-4 flex-row items-center justify-between"
              >
                <Ionicons name="calendar-outline" size={20} color="#FF6B35" />
                <Text className="text-foreground text-base flex-1 ml-3">
                  {startDate.toLocaleDateString('pt-BR')}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#71717A" />
              </TouchableOpacity>

              {showStartPicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowStartPicker(false);
                    if (selectedDate && event.type === 'set') {
                      setStartDate(selectedDate);
                    }
                  }}
                />
              )}
            </View>

            <View className="flex-1">
              <Text className="text-foreground text-sm font-semibold mb-2 font-sans">
                Data Término *
              </Text>
              <TouchableOpacity
                onPress={() => setShowEndPicker(true)}
                className="bg-zinc-900/80 border-2 border-zinc-700 rounded-2xl px-4 py-4 flex-row items-center justify-between"
              >
                <Ionicons name="calendar-outline" size={20} color="#FF6B35" />
                <Text className="text-foreground text-base flex-1 ml-3">
                  {endDate.toLocaleDateString('pt-BR')}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#71717A" />
              </TouchableOpacity>

              {showEndPicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date(startDate.getTime() + 24 * 60 * 60 * 1000)}
                  onChange={(event, selectedDate) => {
                    setShowEndPicker(false);
                    if (selectedDate && event.type === 'set') {
                      setEndDate(selectedDate);
                    }
                  }}
                />
              )}
            </View>
          </View>

          {/* Notes */}
          <View className="mb-6">
            <Text className="text-foreground text-sm font-semibold mb-2 font-sans">
              Observações
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Objetivos, foco do ciclo, etc..."
              placeholderTextColor="#52525B"
              multiline
              numberOfLines={4}
              className="bg-zinc-900/80 rounded-2xl p-4 text-foreground text-base h-24 border-2 border-zinc-700"
              style={{ color: '#FFFFFF' }}
              textAlignVertical="top"
            />
          </View>

          {/* Save Button */}
          <Button
            onPress={handleSave}
            disabled={loading}
            variant="primary"
            label={loading ? 'Salvando...' : 'Criar Periodização'}
            className="mb-10"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}
