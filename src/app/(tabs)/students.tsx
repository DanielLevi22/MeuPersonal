import { useAuthStore } from '@/store/authStore';
import { useStudentStore } from '@/store/studentStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StudentsScreen() {
  const { students, isLoading, fetchStudents, removeStudent } = useStudentStore();
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user?.id) {
      fetchStudents(user.id);
    }
  }, [user]);

  const handleRemove = (studentId: string, studentName: string) => {
    Alert.alert(
      'Remover Aluno',
      `Tem certeza que deseja remover ${studentName}? Ele perderá o acesso aos treinos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: async () => {
            if (user?.id) {
              await removeStudent(user.id, studentId);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View 
      style={{
        backgroundColor: '#141B2D',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#1E2A42',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
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
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 4 }} numberOfLines={1}>
            {item.full_name || 'Aluno sem nome'}
          </Text>
          <Text style={{ color: '#8B92A8', fontSize: 14 }} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Status Badge */}
        <View style={{
          backgroundColor: item.status === 'active' ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 184, 0, 0.15)',
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 12,
          marginRight: 12
        }}>
          <Text style={{
            color: item.status === 'active' ? '#00FF88' : '#FFB800',
            fontSize: 12,
            fontWeight: '700'
          }}>
            {item.status === 'active' ? 'Ativo' : 'Pendente'}
          </Text>
        </View>

        {/* Remove Button */}
        <TouchableOpacity 
          onPress={() => handleRemove(item.id, item.full_name)}
          style={{ padding: 8 }}
        >
          <Ionicons name="trash-outline" size={20} color="#FF4444" />
        </TouchableOpacity>
      </View>
    </View>
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
