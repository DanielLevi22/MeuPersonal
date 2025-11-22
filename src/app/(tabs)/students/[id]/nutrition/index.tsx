import { useNutritionStore } from '@/store/nutritionStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NutritionDashboard() {
  const { id: studentId } = useLocalSearchParams();
  const router = useRouter();
  const {
    currentDietPlan,
    fetchDietPlan,
    isLoading,
    // We might need a new action to fetch ALL plans, not just active
    // For now, let's assume fetchDietPlan gets the active one.
    // We'll need to implement fetchAllDietPlans in the store later if needed.
    // But for now, let's show the active one and a button to create.
  } = useNutritionStore();

  useEffect(() => {
    if (studentId && typeof studentId === 'string') {
      fetchDietPlan(studentId);
    }
  }, [studentId]);

  const handleCreateNew = () => {
    // Navigate to create screen
    // We need to pass the student ID to pre-select them?
    // The create screen currently selects from a list.
    // We can pass a param or just let them select.
    // Ideally, we pass the student ID.
    router.push({
      pathname: '/nutrition/create',
      params: { preselectedStudentId: studentId }
    } as any);
  };

  const handleOpenPlan = (planId: string) => {
    router.push(`/students/${studentId}/nutrition/full-diet` as any);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Nutrição</Text>
            <Text style={styles.headerSubtitle}>Gerenciar planos</Text>
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Active Plan Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Plano Ativo</Text>
            
            {isLoading ? (
              <ActivityIndicator size="small" color="#FF6B35" />
            ) : currentDietPlan ? (
              <TouchableOpacity 
                style={styles.planCard}
                onPress={() => handleOpenPlan(currentDietPlan.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#141B2D', '#1E2A42']}
                  style={styles.planCardGradient}
                >
                  <View style={styles.planHeader}>
                    <View>
                      <Text style={styles.planName}>{currentDietPlan.name}</Text>
                      <Text style={styles.planDate}>
                        Início: {new Date(currentDietPlan.start_date).toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeText}>ATIVO</Text>
                    </View>
                  </View>

                  <View style={styles.macrosContainer}>
                    <View style={styles.macroItem}>
                      <Text style={styles.macroValue}>{currentDietPlan.target_calories}</Text>
                      <Text style={styles.macroLabel}>Kcal</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.macroItem}>
                      <Text style={[styles.macroValue, { color: '#00FF88' }]}>
                        {currentDietPlan.target_protein}g
                      </Text>
                      <Text style={styles.macroLabel}>Prot</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.macroItem}>
                      <Text style={[styles.macroValue, { color: '#00D9FF' }]}>
                        {currentDietPlan.target_carbs}g
                      </Text>
                      <Text style={styles.macroLabel}>Carb</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.macroItem}>
                      <Text style={[styles.macroValue, { color: '#FFDE59' }]}>
                        {currentDietPlan.target_fat}g
                      </Text>
                      <Text style={styles.macroLabel}>Gord</Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.editLink}>Toque para editar</Text>
                    <Ionicons name="chevron-forward" size={20} color="#FF6B35" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="restaurant-outline" size={48} color="#5A6178" />
                <Text style={styles.emptyText}>Nenhum plano ativo</Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <TouchableOpacity 
            onPress={handleCreateNew}
            activeOpacity={0.8}
            style={styles.createButton}
          >
            <LinearGradient
              colors={['#FF6B35', '#E85A2A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.createButtonGradient}
            >
              <Ionicons name="add-circle" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.createButtonText}>Criar Novo Plano</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* History Section (Placeholder for now) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Histórico</Text>
            <Text style={styles.historyPlaceholder}>
              Planos anteriores aparecerão aqui quando arquivados.
            </Text>
          </View>
        </ScrollView>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  planCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  planCardGradient: {
    padding: 20,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  planDate: {
    fontSize: 14,
    color: '#8B92A8',
  },
  activeBadge: {
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00FF88',
  },
  activeText: {
    color: '#00FF88',
    fontSize: 12,
    fontWeight: '700',
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: '#8B92A8',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editLink: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#141B2D',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1E2A42',
    borderStyle: 'dashed',
  },
  emptyText: {
    color: '#8B92A8',
    marginTop: 12,
    fontSize: 16,
  },
  createButton: {
    marginBottom: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  historyPlaceholder: {
    color: '#8B92A8',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
});
