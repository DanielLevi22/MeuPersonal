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
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNutritionStore } from '../routes';
import { calculateDietStrategy, DIET_STRATEGIES, DietStrategyType } from '../utils/dietStrategies';

export default function CreateDietScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [studentId, setStudentId] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  
  // Macros
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [calories, setCalories] = useState('');
  
  // Strategy
  const [selectedStrategy, setSelectedStrategy] = useState<DietStrategyType>('standard');
  const [targetCalories, setTargetCalories] = useState('2000'); // Base calories for strategy

  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  
  const { createDietPlanWithStrategy } = useNutritionStore();

  // Auto-calculate macros based on strategy and target calories
  useEffect(() => {
    if (targetCalories) {
      const result = calculateDietStrategy(selectedStrategy, parseFloat(targetCalories) || 0);
      setCalories(result.averageMacros.calories.toString());
      setProtein(result.averageMacros.protein.toString());
      setCarbs(result.averageMacros.carbs.toString());
      setFat(result.averageMacros.fat.toString());
    }
  }, [selectedStrategy, targetCalories]);
  
  // Previous auto-calculate (Manually disabled to prefer strategy calculation, or we keep it for manual overrides?)
  // Let's comment out the old effect that listened to P/C/F changes for now, 
  // or better, make it only run if we aren't using the strategy calculator loop.
  // Actually, the previous effect calculated Total Calories from P/C/F. 
  // The new flow drives P/C/F from Total Calories + Strategy.
  // If the user manually edits P/C/F, we should update Total Calories.
  
  useEffect(() => {
     // This effect ensures if user manually types P/C/F, the total updates.
     // But we need to avoid an infinite loop if we also set P/C/F from strategy.
     // The strategy effect runs on [selectedStrategy, targetCalories].
     // This one runs on [protein, carbs, fat].
     // It should be fine as long as we don't set targetCalories here.
    const p = parseFloat(protein) || 0;
    const c = parseFloat(carbs) || 0;
    const f = parseFloat(fat) || 0;
    
    // Only update if the values differ significantly to avoid rounding loops
    const calculated = (p * 4) + (c * 4) + (f * 9);
    const current = parseFloat(calories) || 0;
    
    if (Math.abs(calculated - current) > 5 && (p || c || f)) {
        // If user manually changed macros, update total.
        setCalories(Math.round(calculated).toString());
    }
  }, [protein, carbs, fat]);

  // Fetch students on mount
  useEffect(() => {
    fetchStudents();
  }, [user]);

  const fetchStudents = async () => {
    if (!user?.id) return;

    try {
      // 1. Fetch active students
      const { data: activeData, error: activeError } = await supabase
        .from('coachings')
        .select(`
          student:profiles!client_id (
            id,
            full_name
          )
        `)
        .eq('professional_id', user.id)
        .eq('status', 'active');

      // 2. Fetch pending students
      const { data: pendingData, error: pendingError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('account_type', 'managed_student')
        .eq('account_status', 'pending');
        // .not('invite_code', 'is', null);

      if (!activeError && !pendingError) {
        const activeList = activeData?.map((item: any) => item.student).filter(Boolean) || [];
        const pendingList = pendingData || [];
        
        // Merge and deduplicate (prefer active profile if both exist)
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
      Alert.alert('Erro', 'O nome do plano é obrigatório.');
      return;
    }

    if (!studentId) {
      Alert.alert('Erro', 'Selecione um aluno.');
      return;
    }

    if (!user?.id) return;

    setLoading(true);

    try {
      // Calculate final strategy data to ensure freshness
      const strategyResult = calculateDietStrategy(selectedStrategy, parseFloat(targetCalories) || 0);

      const planData = {
          name,
          description: description || strategyResult.description, // Use strategy desc if empty
          student_id: studentId,
          personal_id: user.id,
          start_date: startDate.toISOString().split('T')[0],
          status: 'active',
          // These global targets are averages now, helpful for quick ref
          target_protein: parseFloat(protein) || 0,
          target_carbs: parseFloat(carbs) || 0,
          target_fat: parseFloat(fat) || 0,
          target_calories: parseFloat(calories) || 0,
          plan_type: selectedStrategy
      };

      await createDietPlanWithStrategy(planData as any, strategyResult);

      Alert.alert('Sucesso', 'Plano alimentar criado com sucesso!', [
        {
          text: 'OK',
          onPress: () => {
             router.back();
          },
        },
      ]);
    } catch (error) {
      console.error('Error creating diet plan:', error);
      Alert.alert('Erro', 'Não foi possível criar o plano alimentar.');
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = students.find(s => s.id === studentId);

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
            <Ionicons name="arrow-back" size={24} color="#00D9FF" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground font-display">
            Novo Plano Alimentar
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 0 }}>
          
          {/* Strategy Selector */}
          <View className="mb-6">
            <Text className="text-foreground text-sm font-semibold mb-3 font-sans">
              Estratégia Nutricional
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-3">
                {(Object.keys(DIET_STRATEGIES) as DietStrategyType[]).map((strategy) => (
                  <TouchableOpacity
                    key={strategy}
                    onPress={() => setSelectedStrategy(strategy)}
                    className={`p-4 rounded-2xl border w-40 h-48 justify-between ${
                      selectedStrategy === strategy
                        ? 'bg-primary-900/20 border-primary-500'
                        : 'bg-zinc-900/80 border-zinc-800'
                    }`}
                  >
                    <View>
                      <Ionicons 
                        name={DIET_STRATEGIES[strategy].icon as any} 
                        size={32} 
                        color={selectedStrategy === strategy ? '#00D9FF' : '#71717A'} 
                      />
                      <Text className={`mt-3 font-bold text-base ${
                        selectedStrategy === strategy ? 'text-white' : 'text-zinc-400'
                      }`}>
                        {DIET_STRATEGIES[strategy].label}
                      </Text>
                    </View>
                    <Text className="text-zinc-500 text-xs mt-2" numberOfLines={3}>
                      {DIET_STRATEGIES[strategy].description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Target Calories Input (Primary Driver) */}
            <View className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-700 mb-4">
               <Text className="text-zinc-400 text-xs mb-1">Meta Calórica Média (Base)</Text>
               <Input
                  value={targetCalories}
                  onChangeText={setTargetCalories}
                  placeholder="2000"
                  keyboardType="numeric"
                  className="text-xl font-bold text-white h-12"
               />
               <Text className="text-zinc-600 text-xs mt-1">
                 Isso definirá a base para os cálculos da semana.
               </Text>
            </View>

            {/* Strategy Preview */}
            <View className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50">
              <Text className="text-zinc-400 text-xs font-bold mb-3 uppercase tracking-wider">
                Resumo da Semana
              </Text>
              
              {(() => {
                const preview = calculateDietStrategy(selectedStrategy, parseFloat(targetCalories) || 0);
                // Group days by label for cleaner display
                 const groupedDays = preview.weeklySchedule.reduce((acc, day) => {
                    if (!acc[day.label]) acc[day.label] = [];
                    acc[day.label].push(day);
                    return acc;
                 }, {} as Record<string, typeof preview.weeklySchedule>);

                return (
                  <View className="gap-2">
                    {Object.entries(groupedDays).map(([label, days]) => {
                         const representative = days[0];
                         const dayNames = days.map(d => ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][d.dayOfWeek]).join(', ');
                         
                         return (
                           <View key={label} className="flex-row items-center justify-between py-2 border-b border-zinc-800/50">
                              <View className="flex-1">
                                <Text className="text-white font-bold text-sm">{label}</Text>
                                <Text className="text-zinc-500 text-xs">{dayNames}</Text>
                              </View>
                              <View className="items-end">
                                <Text className="text-primary-400 font-bold text-sm">
                                  {representative.macros.calories} kcal
                                </Text>
                                <Text className="text-zinc-600 text-[10px]">
                                   P:{representative.macros.protein}g  C:{representative.macros.carbs}g  G:{representative.macros.fat}g
                                </Text>
                              </View>
                           </View>
                         );
                    })}
                  </View>
                );
              })()}
            </View>

          </View>

          {/* Nome */}
          <View className="mb-4">
            <Text className="text-foreground text-sm font-semibold mb-2 font-sans">
              Nome do Plano *
            </Text>
            <Input
              value={name}
              onChangeText={setName}
              placeholder="Ex: Cutting - Fase 1"
            />
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

            <TouchableOpacity
              onPress={() => setShowStudentPicker(true)}
              className="bg-zinc-900/80 border-2 border-zinc-700 rounded-2xl px-4 py-4 flex-row items-center justify-between"
            >
              <Text className={selectedStudent ? 'text-foreground text-base' : 'text-zinc-500 text-base'}>
                {selectedStudent ? selectedStudent.full_name : 'Selecione um aluno'}
              </Text>
              <Ionicons
                name="chevron-down"
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

          {/* Start Date */}
          <View className="mb-4">
            <Text className="text-foreground text-sm font-semibold mb-2 font-sans">
              Data de Início *
            </Text>
            <TouchableOpacity
              onPress={() => setShowStartPicker(true)}
              className="bg-zinc-900/80 border-2 border-zinc-700 rounded-2xl px-4 py-4 flex-row items-center justify-between"
            >
              <Ionicons name="calendar-outline" size={20} color="#00D9FF" />
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

          {/* Macros */}
          <View className="mb-6">
            <Text className="text-foreground text-sm font-semibold mb-3 font-sans">
              Metas Diárias (Macros)
            </Text>
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-zinc-400 text-xs mb-1 ml-1">Proteína (g)</Text>
                <Input
                  value={protein}
                  onChangeText={setProtein}
                  placeholder="0"
                  keyboardType="numeric"
                  className="text-center"
                />
              </View>
              <View className="flex-1">
                <Text className="text-zinc-400 text-xs mb-1 ml-1">Carboidratos (g)</Text>
                <Input
                  value={carbs}
                  onChangeText={setCarbs}
                  placeholder="0"
                  keyboardType="numeric"
                  className="text-center"
                />
              </View>
              <View className="flex-1">
                <Text className="text-zinc-400 text-xs mb-1 ml-1">Gorduras (g)</Text>
                <Input
                  value={fat}
                  onChangeText={setFat}
                  placeholder="0"
                  keyboardType="numeric"
                  className="text-center"
                />
              </View>
            </View>
            
            <View>
              <Text className="text-zinc-400 text-xs mb-1 ml-1">Calorias Totais (kcal)</Text>
              <Input
                value={calories}
                onChangeText={setCalories}
                placeholder="0"
                keyboardType="numeric"
              />
              <Text className="text-zinc-500 text-xs mt-1 ml-1">
                * Calculado automaticamente: (P×4) + (C×4) + (G×9)
              </Text>
            </View>
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="text-foreground text-sm font-semibold mb-2 font-sans">
              Descrição / Observações
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Instruções gerais para o aluno..."
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
            label={loading ? 'Salvando...' : 'Criar Plano Alimentar'}
            className="mb-10"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}
