import { useStudentStore } from '@/store/studentStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StudentDashboard() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { students, fetchStudents, isLoading } = useStudentStore();
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    if (id && typeof id === 'string') {
      // If we have students in store, try to find the student
      const found = students.find(s => s.id === id);
      if (found) {
        setStudent(found);
      } else {
        // If not found (maybe deep link or refresh), we might need to fetch
        // For now, let's rely on the list being populated or fetch if empty
        // We don't have a direct fetchStudentById in the store shown, 
        // but fetchStudents fetches all linked students.
        // We can trigger a fetch if students is empty.
        // Ideally we would have a fetchStudentById.
      }
    }
  }, [id, students]);

  if (!student && isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00FF88" />
      </View>
    );
  }

  if (!student && !isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aluno não encontrado</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil do Aluno</Text>
          <View style={{ width: 40 }} /> 
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Student Info Card */}
          <View style={styles.studentCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={40} color="#00D9FF" />
              </View>
            </View>
            <Text style={styles.studentName}>{student.full_name}</Text>
            <Text style={styles.studentEmail}>{student.email}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {student.status === 'active' ? 'Ativo' : 'Pendente'}
              </Text>
            </View>
          </View>

          {/* Menu Grid */}
          <View style={styles.menuGrid}>
            {/* Nutrition */}
            <Link href={`/(tabs)/students/${id}/nutrition` as any} asChild>
              <TouchableOpacity activeOpacity={0.8} style={styles.menuItem}>
                <LinearGradient
                  colors={['rgba(255, 107, 53, 0.1)', 'rgba(255, 107, 53, 0.05)']}
                  style={styles.menuItemGradient}
                >
                  <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 107, 53, 0.2)' }]}>
                    <Ionicons name="restaurant" size={32} color="#FF6B35" />
                  </View>
                  <Text style={styles.menuTitle}>Nutrição</Text>
                  <Text style={styles.menuSubtitle}>Planos e dieta</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Link>

            {/* History */}
            <Link href={`/(tabs)/students/${id}/history` as any} asChild>
              <TouchableOpacity activeOpacity={0.8} style={styles.menuItem}>
                <LinearGradient
                  colors={['rgba(0, 217, 255, 0.1)', 'rgba(0, 217, 255, 0.05)']}
                  style={styles.menuItemGradient}
                >
                  <View style={[styles.iconContainer, { backgroundColor: 'rgba(0, 217, 255, 0.2)' }]}>
                    <Ionicons name="time" size={32} color="#00D9FF" />
                  </View>
                  <Text style={styles.menuTitle}>Histórico</Text>
                  <Text style={styles.menuSubtitle}>Avaliações físicas</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Link>

             {/* Workouts (Placeholder for now, or link if available) */}
             {/* Assuming workouts will be implemented later or linked differently */}
             <TouchableOpacity 
                activeOpacity={0.8} 
                style={styles.menuItem}
                onPress={() => Alert.alert('Em breve', 'Funcionalidade de treinos para aluno em desenvolvimento.')}
              >
                <LinearGradient
                  colors={['rgba(0, 255, 136, 0.1)', 'rgba(0, 255, 136, 0.05)']}
                  style={styles.menuItemGradient}
                >
                  <View style={[styles.iconContainer, { backgroundColor: 'rgba(0, 255, 136, 0.2)' }]}>
                    <Ionicons name="barbell" size={32} color="#00FF88" />
                  </View>
                  <Text style={styles.menuTitle}>Treinos</Text>
                  <Text style={styles.menuSubtitle}>Fichas de treino</Text>
                </LinearGradient>
              </TouchableOpacity>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0E1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    backgroundColor: '#141B2D',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    padding: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#8B92A8',
    fontSize: 16,
  },
  studentCard: {
    alignItems: 'center',
    marginBottom: 32,
    padding: 24,
    backgroundColor: '#141B2D',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1E2A42',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00D9FF',
  },
  studentName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  studentEmail: {
    fontSize: 14,
    color: '#8B92A8',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00FF88',
  },
  statusText: {
    color: '#00FF88',
    fontSize: 12,
    fontWeight: '700',
  },
  menuGrid: {
    gap: 16,
  },
  menuItem: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 100,
  },
  menuItemGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#8B92A8',
  },
});
