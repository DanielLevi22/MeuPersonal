import { useAuthStore } from '@/store/authStore';
import { useNutritionStore } from '@/store/nutritionStore';
import { useStudentStore } from '@/store/studentStore';
import {
  ActivityLevel,
  Goal,
  calculateMacrosFromCalories,
  calculateTDEE,
  calculateTMB,
  calculateTargetCalories,
} from '@/utils/nutrition';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateDietPlanScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { students, fetchStudents } = useStudentStore();
  const { createDietPlan } = useNutritionStore();

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [dietName, setDietName] = useState('');
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
        start_date: startDate.toISOString().split('T')[0],  // <-- MUDAR de new Date()
        end_date: endDate.toISOString().split('T')[0],      // <-- ADICIONAR
        target_calories: macros.calories,
        target_protein: macros.protein,
        target_carbs: macros.carbs,
        target_fat: macros.fat,
      });

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
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Novo Plano de Dieta</Text>
            <Text style={styles.headerSubtitle}>Configure os macros do aluno</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Student Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selecionar Aluno</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.studentsScroll}
            >
              {activeStudents.map((student) => (
                <TouchableOpacity
                  key={student.id}
                  style={[
                    styles.studentCard,
                    selectedStudent?.id === student.id && styles.studentCardSelected,
                  ]}
                  onPress={() => setSelectedStudent(student)}
                >
                  <View style={styles.studentAvatar}>
                    <Ionicons name="person" size={24} color="#00D9FF" />
                  </View>
                  <Text style={styles.studentName} numberOfLines={1}>
                    {student.full_name}
                  </Text>
                  {selectedStudent?.id === student.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#00FF88" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {selectedStudent && (
            <>
              {/* Diet Name */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Nome do Plano</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Dieta de Cutting"
                  placeholderTextColor="#5A6178"
                  value={dietName}
                  onChangeText={setDietName}
                />
              </View>
               {/* Start Date */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Data de Início</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => {
                    console.log('📅 BOTÃO CLICADO! showStartPicker antes:', showStartPicker);
                    setShowStartPicker(true);
                    console.log('📅 setShowStartPicker(true) chamado');
                  }}
                >
                  <Ionicons name="calendar-outline" size={20} color="#00D9FF" />
                  <Text style={styles.dateButtonText}>
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
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Data de Término</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#00D9FF" />
                  <Text style={styles.dateButtonText}>
                    {endDate.toLocaleDateString('pt-BR')}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#8B92A8" />
                </TouchableOpacity>
                <Text style={styles.helperText}>
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
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Objetivo</Text>
                {GOALS.map((g) => (
                  <TouchableOpacity
                    key={g.value}
                    style={[styles.optionCard, goal === g.value && styles.optionCardSelected]}
                    onPress={() => setGoal(g.value)}
                  >
                    <View style={styles.optionContent}>
                      <Text style={styles.optionLabel}>{g.label}</Text>
                      <Text style={styles.optionDescription}>{g.description}</Text>
                    </View>
                    {goal === g.value && (
                      <Ionicons name="checkmark-circle" size={24} color="#00FF88" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Activity Level */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Nível de Atividade</Text>
                {ACTIVITY_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.optionCard,
                      activityLevel === level.value && styles.optionCardSelected,
                    ]}
                    onPress={() => setActivityLevel(level.value)}
                  >
                    <Text style={styles.optionLabel}>{level.label}</Text>
                    {activityLevel === level.value && (
                      <Ionicons name="checkmark-circle" size={24} color="#00FF88" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Calculated Macros */}
              {macros.calories > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Macros Calculados</Text>
                  <View style={styles.macrosCard}>
                    <View style={styles.macroRow}>
                      <Text style={styles.macroLabel}>TMB (Taxa Metabólica Basal)</Text>
                      <Text style={styles.macroValue}>{tmb.toFixed(0)} kcal</Text>
                    </View>
                    <View style={styles.macroRow}>
                      <Text style={styles.macroLabel}>TDEE (Gasto Diário Total)</Text>
                      <Text style={styles.macroValue}>{tdee.toFixed(0)} kcal</Text>
                    </View>
                    <View style={[styles.macroRow, styles.macroRowHighlight]}>
                      <Text style={styles.macroLabelHighlight}>Calorias Alvo</Text>
                      <Text style={styles.macroValueHighlight}>
                        {macros.calories.toFixed(0)} kcal
                      </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.macroRow}>
                      <Text style={[styles.macroLabel, { color: '#00ff9d' }]}>Proteína</Text>
                      <Text style={[styles.macroValue, { color: '#00ff9d' }]}>
                        {macros.protein.toFixed(0)}g
                      </Text>
                    </View>
                    <View style={styles.macroRow}>
                      <Text style={[styles.macroLabel, { color: '#7f5aff' }]}>Carboidratos</Text>
                      <Text style={[styles.macroValue, { color: '#7f5aff' }]}>
                        {macros.carbs.toFixed(0)}g
                      </Text>
                    </View>
                    <View style={styles.macroRow}>
                      <Text style={[styles.macroLabel, { color: '#ffde59' }]}>Gordura</Text>
                      <Text style={[styles.macroValue, { color: '#ffde59' }]}>
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
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleCreatePlan} activeOpacity={0.8}>
              <LinearGradient
                colors={['#00FF88', '#00CC6E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.createButton}
              >
                <Text style={styles.createButtonText}>Criar Plano de Dieta</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E1A',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    backgroundColor: '#141B2D',
    padding: 10,
    borderRadius: 12,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8B92A8',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  studentsScroll: {
    gap: 12,
  },
  studentCard: {
    backgroundColor: '#141B2D',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#1E2A42',
    alignItems: 'center',
    width: 120,
  },
  studentCardSelected: {
    borderColor: '#00FF88',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 217, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#141B2D',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#1E2A42',
  },
  optionCard: {
    backgroundColor: '#141B2D',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#1E2A42',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionCardSelected: {
    borderColor: '#00FF88',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    color: '#8B92A8',
  },
  macrosCard: {
    backgroundColor: '#141B2D',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#1E2A42',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  macroRowHighlight: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    marginHorizontal: -12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  macroLabel: {
    fontSize: 14,
    color: '#8B92A8',
  },
  macroLabelHighlight: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  macroValueHighlight: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00FF88',
  },
  divider: {
    height: 1,
    backgroundColor: '#1E2A42',
    marginVertical: 12,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E2A42',
  },
  createButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#0A0E1A',
    fontSize: 16,
    fontWeight: '700',
  },
   dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141B2D',
    borderWidth: 2,
    borderColor: '#1E2A42',
    borderRadius: 12,
    padding: 16,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#8B92A8',
    marginTop: 4,
  },
});
