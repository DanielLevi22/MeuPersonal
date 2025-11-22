import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useStudentStore } from '@/store/studentStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface StudentWithPlan {
  id: string;
  full_name: string;
  email: string;
  status: string;
  activePlan?: {
    id: string;
    name: string;
    target_calories: number;
    target_protein: number;
    target_carbs: number;
    target_fat: number;
  };
}

export default function NutritionScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { students, fetchStudents } = useStudentStore();
  const [studentsWithPlans, setStudentsWithPlans] = useState<StudentWithPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchStudents(user.id);
      fetchPlans();
    }
  }, [user]);

  const fetchPlans = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('diet_plans')
      .select('*')
      .eq('personal_id', user.id)
      .eq('status', 'active');
    
    if (data) {
      setPlans(data);
    }
  };

  useEffect(() => {
    if (students.length > 0 || plans.length > 0) {
      processStudents();
    } else {
      // If we have no students and no plans, but loading is done, we should show empty state
      // But we don't know if loading is done here easily without tracking it better.
      // For now, let's just try to process.
      setStudentsWithPlans([]);
      setLoading(false);
    }
  }, [students, plans]);

  const processStudents = () => {
    // Map students with their plans
    const studentsData: StudentWithPlan[] = students
      .filter(s => s.status === 'active')
      .map(student => ({
        ...student,
        activePlan: plans.find(p => p.student_id === student.id)
      }));

    setStudentsWithPlans(studentsData);
    setLoading(false);
  };

  const renderStudentItem = ({ item }: { item: StudentWithPlan }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(tabs)/students/${item.id}/nutrition` as any)}
      activeOpacity={0.7}
      style={styles.studentCard}
    >
      <View style={styles.studentHeader}>
        <View style={styles.studentAvatar}>
          <Ionicons name="person" size={24} color="#00D9FF" />
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.full_name}</Text>
          {item.activePlan ? (
            <Text style={styles.planName}>{item.activePlan.name}</Text>
          ) : (
            <Text style={styles.noPlan}>Sem plano ativo</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#5A6178" />
      </View>

      {item.activePlan && (
        <View style={styles.macrosPreview}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{item.activePlan.target_calories}</Text>
            <Text style={styles.macroLabel}>kcal</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: '#00FF88' }]}>
              {item.activePlan.target_protein}g
            </Text>
            <Text style={styles.macroLabel}>Prot</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: '#00D9FF' }]}>
              {item.activePlan.target_carbs}g
            </Text>
            <Text style={styles.macroLabel}>Carb</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: '#FFDE59' }]}>
              {item.activePlan.target_fat}g
            </Text>
            <Text style={styles.macroLabel}>Gord</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Nutrição</Text>
            <Text style={styles.headerSubtitle}>
              {studentsWithPlans.length} {studentsWithPlans.length === 1 ? 'aluno' : 'alunos'}
            </Text>
          </View>
          
          <Link href={'/nutrition/create' as any} asChild>
            <TouchableOpacity activeOpacity={0.8}>
              <LinearGradient
                colors={['#00FF88', '#00CC6E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.addButton}
              >
                <Ionicons name="add" size={28} color="#0A0E1A" />
              </LinearGradient>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
          </View>
        ) : studentsWithPlans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={80} color="#5A6178" />
            <Text style={styles.emptyTitle}>Nenhum aluno ativo</Text>
            <Text style={styles.emptyText}>
              Adicione alunos para criar planos de dieta
            </Text>
          </View>
        ) : (
          <FlatList
            data={studentsWithPlans}
            renderItem={renderStudentItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8B92A8',
  },
  addButton: {
    height: 56,
    width: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#8B92A8',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  studentCard: {
    backgroundColor: '#141B2D',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#1E2A42',
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 217, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  planName: {
    fontSize: 13,
    color: '#00FF88',
  },
  noPlan: {
    fontSize: 13,
    color: '#8B92A8',
    fontStyle: 'italic',
  },
  macrosPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 12,
    borderRadius: 12,
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: 11,
    color: '#8B92A8',
  },
  macroDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});
