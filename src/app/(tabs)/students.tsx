import { useAuthStore } from '@/store/authStore';
import { useStudentStore } from '@/store/studentStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StudentsScreen() {
  const { students, isLoading, fetchStudents } = useStudentStore();
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user?.id) {
      fetchStudents(user.id);
    }
  }, [user]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      style={{
        backgroundColor: '#141B2D',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#1E2A42',
        flexDirection: 'row',
        alignItems: 'center'
      }}
    >
      {/* Avatar */}
      <View style={{
        height: 56,
        width: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(0, 217, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16
      }}>
        <Ionicons name="person" size={28} color="#00D9FF" />
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 4 }}>
          {item.full_name || 'Aluno sem nome'}
        </Text>
        <Text style={{ color: '#8B92A8', fontSize: 14 }}>
          {item.email}
        </Text>
      </View>

      {/* Status Badge */}
      <View style={{
        backgroundColor: item.status === 'active' ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 184, 0, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12
      }}>
        <Text style={{
          color: item.status === 'active' ? '#00FF88' : '#FFB800',
          fontSize: 12,
          fontWeight: '700'
        }}>
          {item.status === 'active' ? 'Ativo' : 'Pendente'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 24
        }}>
          <View>
            <Text style={{ fontSize: 36, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 }}>
              Meus Alunos
            </Text>
            <Text style={{ fontSize: 16, color: '#8B92A8' }}>
              {students.length} {students.length === 1 ? 'aluno' : 'alunos'}
            </Text>
          </View>
          
          <Link href={'/students/invite' as any} asChild>
            <TouchableOpacity activeOpacity={0.8}>
              <LinearGradient
                colors={['#FF6B35', '#E85A2A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  height: 56,
                  width: 56,
                  borderRadius: 28,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Ionicons name="add" size={28} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Content */}
        {students.length === 0 && !isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
            <View style={{
              backgroundColor: '#141B2D',
              padding: 32,
              borderRadius: 50,
              marginBottom: 24
            }}>
              <Ionicons name="people-outline" size={80} color="#5A6178" />
            </View>
            <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginBottom: 8 }}>
              Nenhum aluno ainda
            </Text>
            <Text style={{ color: '#8B92A8', textAlign: 'center', paddingHorizontal: 32, fontSize: 15, marginBottom: 32 }}>
              Comece convidando seu primeiro aluno
            </Text>
            
            <Link href={'/students/invite' as any} asChild>
              <TouchableOpacity activeOpacity={0.8}>
                <LinearGradient
                  colors={['#FF6B35', '#E85A2A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 16,
                    paddingVertical: 16,
                    paddingHorizontal: 32
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                    Convidar Aluno
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Link>
          </View>
        ) : (
          <FlatList
            data={students}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24 }}
            refreshControl={
              <RefreshControl 
                refreshing={isLoading} 
                onRefresh={() => user?.id && fetchStudents(user.id)} 
                tintColor="#FF6B35" 
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
