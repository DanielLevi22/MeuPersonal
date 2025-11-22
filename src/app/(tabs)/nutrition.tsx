import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NutritionScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Nutrição</Text>
            <Text style={styles.headerSubtitle}>Gerencie planos de dieta</Text>
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
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ações Rápidas</Text>
            
            <Link href={'/nutrition/create' as any} asChild>
              <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
                <View style={styles.actionIcon}>
                  <Ionicons name="add-circle" size={32} color="#00FF88" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Novo Plano de Dieta</Text>
                  <Text style={styles.actionDescription}>
                    Crie um plano personalizado com cálculo automático de macros
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#5A6178" />
              </TouchableOpacity>
            </Link>

            <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
              <View style={styles.actionIcon}>
                <Ionicons name="restaurant" size={32} color="#7f5aff" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Banco de Alimentos</Text>
                <Text style={styles.actionDescription}>
                  Gerencie alimentos customizados
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#5A6178" />
            </TouchableOpacity>
          </View>

          {/* Info Cards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recursos</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Ionicons name="calculator" size={24} color="#00D9FF" />
                <Text style={styles.infoTitle}>Cálculo Automático</Text>
              </View>
              <Text style={styles.infoText}>
                TMB e TDEE calculados automaticamente usando a fórmula Mifflin-St Jeor
              </Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Ionicons name="nutrition" size={24} color="#00FF88" />
                <Text style={styles.infoTitle}>Distribuição de Macros</Text>
              </View>
              <Text style={styles.infoText}>
                Proteína, carboidratos e gordura ajustados por objetivo (cutting, bulking, manutenção)
              </Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Ionicons name="fast-food" size={24} color="#ffde59" />
                <Text style={styles.infoTitle}>Banco de Alimentos</Text>
              </View>
              <Text style={styles.infoText}>
                ~100 alimentos brasileiros comuns + possibilidade de adicionar alimentos customizados
              </Text>
            </View>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
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
  actionCard: {
    backgroundColor: '#141B2D',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#1E2A42',
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: '#8B92A8',
  },
  infoCard: {
    backgroundColor: '#141B2D',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#1E2A42',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#8B92A8',
    lineHeight: 20,
  },
});
