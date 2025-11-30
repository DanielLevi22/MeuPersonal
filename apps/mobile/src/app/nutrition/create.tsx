import { useAuthStore } from '@/auth';
import { cn } from '@/lib/utils';
import {
  ActivityLevel,
  Goal,
  calculateMacrosFromCalories,
  calculateTDEE,
  calculateTMB,
  calculateTargetCalories,
  useNutritionStore
} from '@/modules/nutrition/routes/index';
import { useStudentStore } from '@/students';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@meupersonal/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateDietPlanScreen() {
  const router = useRouter();
  const { preselectedStudentId } = useLocalSearchParams();
  const { user } = useAuthStore();
  const { students, fetchStudents } = useStudentStore();

  const { createDietPlan } = useNutritionStore();

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [sourceStudent, setSourceStudent] = useState<any>(null);
  const [sourcePlanId, setSourcePlanId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  
  const [dietName, setDietName] = useState('');
  const [planType, setPlanType] = useState<'unique' | 'cyclic'>('cyclic');
  const [goal, setGoal] = useState<Goal>('maintenance');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  // Date states
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  // Calculated values
  const [tmb, setTmb] = useState(0);
  const [tdee, setTdee] = useState(0);
  const [targetCalories, setTargetCalories] = useState(0);
  const [macros, setMacros] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });


  
  useEffect(() => {
    if (user?.id) {
      fetchStudents(user.id);
    }
  }, [user]);

  // Pre-select student if param exists
  useEffect(() => {
    if (preselectedStudentId && students.length > 0 && !selectedStudent) {
      const preselected = students.find(s => s.id === preselectedStudentId);
      if (preselected) {
        setSelectedStudent(preselected);
      }
    }
  }, [preselectedStudentId, students]);

  useEffect(() => {
    if (selectedStudent) {
      calculateNutrition();
    }
  }, [selectedStudent, goal, activityLevel]);

  const calculateNutrition = () => {
    if (!selectedStudent?.weight || !selectedStudent?.height) {
      return;
    }

    // Calculate age (assuming birth_date exists, otherwise use default)
    const age = 25; // TODO: Calculate from birth_date

    const calculatedTMB = calculateTMB(
      selectedStudent.weight,
      selectedStudent.height,
      age,
      selectedStudent.gender || 'M'
    );

    const calculatedTDEE = calculateTDEE(calculatedTMB, activityLevel);
    const calculatedTargetCalories = calculateTargetCalories(calculatedTDEE, goal);
    const calculatedMacros = calculateMacrosFromCalories(
      calculatedTargetCalories,
      selectedStudent.weight,
      goal
    );

    setTmb(calculatedTMB);
    setTdee(calculatedTDEE);
    setTargetCalories(calculatedTargetCalories);
    setMacros(calculatedMacros);
  };

  const handleCreatePlan = async () => {
    if (!selectedStudent) {
      Alert.alert('Erro', 'Selecione um aluno');
      return;
    }

    if (!dietName.trim()) {
      Alert.alert('Erro', 'Digite um nome para o plano de dieta');
      return;
    }

    if (!selectedStudent.weight || !selectedStudent.height) {
      Alert.alert(
        'Erro',
        'O aluno precisa ter peso e altura cadastrados para criar um plano de dieta'
      );
      return;
    }

    try {
       await createDietPlan({
        student_id: selectedStudent.id,
        personal_id: user!.id,
        name: dietName,
        description: `Plano ${goal} - ${activityLevel}`,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        plan_type: planType,
        target_calories: macros.calories,
        target_protein: macros.protein,
        target_carbs: macros.carbs,
        target_fat: macros.fat,
      }, sourcePlanId || undefined);

      Alert.alert('Sucesso', 'Plano de dieta criado!', [
        {
          text: 'OK',
          onPress: () => router.push(`/(tabs)/students/${selectedStudent.id}/nutrition` as any),
        },
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar o plano de dieta');
    }
  };

  const activeStudents = students.filter((s) => s.status === 'active');

  const handleSelectSourceStudent = async (student: any) => {
    try {
      const { data, error } = await supabase
        .from('diet_plans')
        .select('*')
        .eq('student_id', student.id)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        Alert.alert('Aviso', 'Este aluno não possui um plano de dieta ativo para importar.');
        return;
      }

      setSourceStudent(student);
      setSourcePlanId(data.id);
      setShowImportModal(false);
      
      // Optional: Pre-fill data from source plan
      // setDietName(data.name + ' (Cópia)');
      // setPlanType(data.plan_type);
      
      Alert.alert('Sucesso', `Plano de ${student.full_name} selecionado para importação.`);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao buscar plano do aluno.');
    }
  };

  const GOALS: { value: Goal; label: string; description: string }[] = [
    { value: 'cutting', label: 'Cutting', description: 'Perda de peso (-20% calorias)' },
    { value: 'maintenance', label: 'Manutenção', description: 'Manter peso atual' },
    { value: 'bulking', label: 'Bulking', description: 'Ganho de massa (+10% calorias)' },
  ];

  const ACTIVITY_LEVELS: { value: ActivityLevel; label: string }[] = [
    { value: 'sedentary', label: 'Sedentário' },
    { value: 'light', label: 'Leve (1-3x/semana)' },
    { value: 'moderate', label: 'Moderado (3-5x/semana)' },
    { value: 'active', label: 'Ativo (6-7x/semana)' },
    { value: 'very_active', label: 'Muito Ativo' },
  ];

  return (
    <View className="flex-1 bg-[#0A0A0A]">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-6 py-4">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="bg-zinc-900 p-2.5 rounded-xl mr-4"
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-extrabold text-white">Novo Plano de Dieta</Text>
            <Text className="text-sm text-zinc-400 mt-1">Configure os macros do aluno</Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Student Selection */}
          {!preselectedStudentId ? (
            <View className="mb-6">
              <Text className="text-base font-bold text-white mb-3">Selecionar Aluno</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
              >
                {activeStudents.map((student) => (
                  <TouchableOpacity
                    key={student.id}
                    className={cn(
                      "bg-zinc-900 rounded-xl p-4 border-2 border-zinc-800 items-center w-[120px]",
                      selectedStudent?.id === student.id && "border-emerald-400 bg-emerald-400/10"
                    )}
                    onPress={() => setSelectedStudent(student)}
                  >
                    <View className="w-12 h-12 rounded-full bg-cyan-400/15 items-center justify-center mb-2">
                      <Ionicons name="person" size={24} color="#00D9FF" />
                    </View>
                    <Text className="text-sm font-semibold text-white text-center mb-1" numberOfLines={1}>
                      {student.full_name}
                    </Text>
                    {selectedStudent?.id === student.id && (
                      <Ionicons name="checkmark-circle" size={20} color="#00FF88" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : selectedStudent ? (
            <View className="mb-6">
              <Text className="text-base font-bold text-white mb-3">Aluno Selecionado</Text>
              <View className="bg-zinc-900 rounded-xl p-4 border-2 border-emerald-400 bg-emerald-400/10 w-full flex-row items-center px-6">
                <View className="w-12 h-12 rounded-full bg-cyan-400/15 items-center justify-center mr-4">
                  <Ionicons name="person" size={24} color="#00D9FF" />
                </View>
                <View className="flex-1 items-start">
                  <Text className="text-lg font-semibold text-white mb-1">
                    {selectedStudent.full_name}
                  </Text>
                  <Text className="text-sm text-zinc-400">
                    {selectedStudent.email}
                  </Text>
                </View>
                <Ionicons name="lock-closed" size={20} color="#5A6178" />
              </View>
            </View>
          ) : null}

          {/* Import Option */}
          {selectedStudent && !sourcePlanId && (
            <View className="mb-6">
              <TouchableOpacity 
                className="flex-row items-center justify-center bg-cyan-400/10 p-4 rounded-xl border border-dashed border-cyan-400/30"
                onPress={() => setShowImportModal(true)}
              >
                <Ionicons name="download-outline" size={20} color="#00D9FF" />
                <Text className="text-cyan-400 text-sm font-semibold ml-2">Importar de outro aluno</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Selected Source Student Display */}
          {sourceStudent && (
            <View className="mb-6">
              <Text className="text-base font-bold text-white mb-3">Importando de</Text>
              <View className="flex-row items-center justify-between bg-zinc-900 p-3 rounded-xl border border-cyan-400">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="person-circle-outline" size={24} color="#00D9FF" />
                  <Text className="text-white text-sm font-semibold">{sourceStudent.full_name}</Text>
                </View>
                <TouchableOpacity onPress={() => {
                  setSourceStudent(null);
                  setSourcePlanId(null);
                }}>
                  <Ionicons name="close-circle" size={24} color="#FF4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Import Modal */}
          {showImportModal && (
            <View className="absolute inset-0 bg-black/80 justify-center items-center p-6 z-50">
              <View className="bg-zinc-900 rounded-2xl w-full max-h-[400px] border border-zinc-800">
                <View className="flex-row items-center justify-between p-4 border-b border-zinc-800">
                  <Text className="text-lg font-bold text-white">Selecione um Aluno</Text>
                  <TouchableOpacity onPress={() => setShowImportModal(false)}>
                    <Ionicons name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                <ScrollView className="p-4">
                  {activeStudents
                    .filter(s => s.id !== selectedStudent?.id) // Don't show current student
                    .map((student) => (
                    <TouchableOpacity
                      key={student.id}
                      className="flex-row items-center p-3 bg-zinc-950 rounded-xl mb-2"
                      onPress={() => handleSelectSourceStudent(student)}
                    >
                      <View className="w-8 h-8 rounded-full bg-cyan-400/15 items-center justify-center mr-3">
                        <Ionicons name="person" size={16} color="#00D9FF" />
                      </View>
                      <Text className="flex-1 text-sm font-medium text-white">{student.full_name}</Text>
                      <Ionicons name="chevron-forward" size={20} color="#5A6178" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          {selectedStudent && (
            <>
              {/* Diet Name */}
              <View className="mb-6">
                <Text className="text-base font-bold text-white mb-3">Nome do Plano</Text>
                <TextInput
                  className="bg-zinc-900 rounded-xl p-4 text-white text-base border-2 border-zinc-800"
                  placeholder="Ex: Dieta de Cutting"
                  placeholderTextColor="#5A6178"
                  value={dietName}
                  onChangeText={setDietName}
                />
              </View>

              {/* Plan Type Selection */}
              <View className="mb-6">
                <Text className="text-base font-bold text-white mb-3">Tipo de Dieta</Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className={cn(
                      "flex-1 bg-zinc-900 rounded-xl p-4 border-2 border-zinc-800 flex-row items-center justify-between",
                      planType === 'unique' && "border-emerald-400 bg-emerald-400/10"
                    )}
                    onPress={() => setPlanType('unique')}
                  >
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-white mb-0.5">Dieta Única</Text>
                      <Text className="text-xs text-zinc-400">Mesma dieta todos os dias</Text>
                    </View>
                    {planType === 'unique' && (
                      <Ionicons name="checkmark-circle" size={24} color="#00FF88" />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    className={cn(
                      "flex-1 bg-zinc-900 rounded-xl p-4 border-2 border-zinc-800 flex-row items-center justify-between",
                      planType === 'cyclic' && "border-emerald-400 bg-emerald-400/10"
                    )}
                    onPress={() => setPlanType('cyclic')}
                  >
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-white mb-0.5">Dieta Cíclica</Text>
                      <Text className="text-xs text-zinc-400">Dietas diferentes por dia</Text>
                    </View>
                    {planType === 'cyclic' && (
                      <Ionicons name="checkmark-circle" size={24} color="#00FF88" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

               {/* Start Date */}
              <View className="mb-6">
                <Text className="text-base font-bold text-white mb-3">Data de Início</Text>
                <TouchableOpacity 
                  className="flex-row items-center justify-between bg-zinc-900 border-2 border-zinc-800 rounded-xl p-4"
                  onPress={() => {
                    console.log('📅 BOTÃO CLICADO! showStartPicker antes:', showStartPicker);
                    setShowStartPicker(true);
                    console.log('📅 setShowStartPicker(true) chamado');
                  }}
                >
                  <Ionicons name="calendar-outline" size={20} color="#00D9FF" />
                  <Text className="flex-1 text-base font-semibold text-white ml-3">
                    {startDate.toLocaleDateString('pt-BR')}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#8B92A8" />
                </TouchableOpacity>
               
                
                {showStartPicker && (
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      console.log('📅 onChange chamado! event.type:', event.type);
                      setShowStartPicker(false);
                      if (selectedDate && event.type === 'set') {
                        setStartDate(selectedDate);
                        console.log('📅 Data atualizada para:', selectedDate);
                      }
                    }}
                  />
                )}
              </View>
 {/* End Date */}
              <View className="mb-6">
                <Text className="text-base font-bold text-white mb-3">Data de Término</Text>
                <TouchableOpacity 
                  className="flex-row items-center justify-between bg-zinc-900 border-2 border-zinc-800 rounded-xl p-4"
                  onPress={() => setShowEndPicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#00D9FF" />
                  <Text className="flex-1 text-base font-semibold text-white ml-3">
                    {endDate.toLocaleDateString('pt-BR')}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#8B92A8" />
                </TouchableOpacity>
                <Text className="text-xs text-zinc-400 mt-1">
                  Duração: {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} dias
                </Text>
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
              {/* Goal Selection */}
              <View className="mb-6">
                <Text className="text-base font-bold text-white mb-3">Objetivo</Text>
                {GOALS.map((g) => (
                  <TouchableOpacity
                    key={g.value}
                    className={cn(
                      "bg-zinc-900 rounded-xl p-4 mb-2 border-2 border-zinc-800 flex-row items-center justify-between",
                      goal === g.value && "border-emerald-400 bg-emerald-400/10"
                    )}
                    onPress={() => setGoal(g.value)}
                  >
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-white mb-0.5">{g.label}</Text>
                      <Text className="text-xs text-zinc-400">{g.description}</Text>
                    </View>
                    {goal === g.value && (
                      <Ionicons name="checkmark-circle" size={24} color="#00FF88" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Activity Level */}
              <View className="mb-6">
                <Text className="text-base font-bold text-white mb-3">Nível de Atividade</Text>
                {ACTIVITY_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    className={cn(
                      "bg-zinc-900 rounded-xl p-4 mb-2 border-2 border-zinc-800 flex-row items-center justify-between",
                      activityLevel === level.value && "border-emerald-400 bg-emerald-400/10"
                    )}
                    onPress={() => setActivityLevel(level.value)}
                  >
                    <Text className="text-base font-semibold text-white mb-0.5">{level.label}</Text>
                    {activityLevel === level.value && (
                      <Ionicons name="checkmark-circle" size={24} color="#00FF88" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Calculated Macros */}
              {macros.calories > 0 && (
                <View className="mb-6">
                  <Text className="text-base font-bold text-white mb-3">Macros Calculados</Text>
                  <View className="bg-zinc-900 rounded-2xl p-5 border-2 border-zinc-800">
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-sm text-zinc-400">TMB (Taxa Metabólica Basal)</Text>
                      <Text className="text-base font-bold text-white">{tmb.toFixed(0)} kcal</Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-sm text-zinc-400">TDEE (Gasto Diário Total)</Text>
                      <Text className="text-base font-bold text-white">{tdee.toFixed(0)} kcal</Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-3 bg-emerald-400/10 -mx-3 px-3 py-2 rounded-lg">
                      <Text className="text-base font-bold text-white">Calorias Alvo</Text>
                      <Text className="text-lg font-extrabold text-emerald-400">
                        {macros.calories.toFixed(0)} kcal
                      </Text>
                    </View>
                    <View className="h-px bg-zinc-800 my-3" />
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-sm text-emerald-400">Proteína</Text>
                      <Text className="text-base font-bold text-emerald-400">
                        {macros.protein.toFixed(0)}g
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-sm text-purple-500">Carboidratos</Text>
                      <Text className="text-base font-bold text-purple-500">
                        {macros.carbs.toFixed(0)}g
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-sm text-amber-400">Gordura</Text>
                      <Text className="text-base font-bold text-amber-400">
                        {macros.fat.toFixed(0)}g
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Create Button */}
        {selectedStudent && dietName && (
          <View className="px-6 py-4 border-t border-zinc-800">
            <TouchableOpacity onPress={handleCreatePlan} activeOpacity={0.8}>
              <LinearGradient
                colors={['#00C9A7', '#00A389']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-2xl py-4.5 items-center"
              >
                <Text className="text-zinc-950 text-base font-bold">Criar Plano de Dieta</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}