import { useAuthStore } from '@/auth';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { StudentEditModal } from '../components/StudentEditModal';
import { useStudentStore } from '../store/studentStore';

export default function StudentsScreen() {
  const { students, isLoading, fetchStudents, removeStudent, cancelInvite, updateStudent } = useStudentStore();
  const { user } = useAuthStore();
  const router = useRouter();
  
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchStudents(user.id);
    }
  }, [user]);

  const handleRemove = (item: any) => {
    const isInvite = item.status === 'invited';
    const title = isInvite ? 'Cancelar Convite' : 'Remover Aluno';
    const message = isInvite 
      ? `Tem certeza que deseja cancelar o convite para ${item.full_name || 'este aluno'}?`
      : `Tem certeza que deseja remover ${item.full_name || 'este aluno'}? Ele perderá o acesso aos treinos.`;

    Alert.alert(
      title,
      message,
      [
        { text: 'Voltar', style: 'cancel' },
        { 
          text: isInvite ? 'Cancelar Convite' : 'Remover', 
          style: 'destructive',
          onPress: async () => {
            if (user?.id && item?.id) {
              if (isInvite) {
                await cancelInvite(item.id);
              } else {
                await removeStudent(user.id, item.id);
              }
            } else {
              Alert.alert('Erro', 'ID do aluno não encontrado.');
            }
          }
        }
      ]
    );
  };

  const handleEdit = (student: any) => {
    setSelectedStudent(student);
    setIsEditModalVisible(true);
  };

  const handlePressStudent = (student: any) => {
    handleEdit(student);
  };

  const handleEnterStudent = (student: any) => {
    router.push(`/(tabs)/students/${student.id}` as any);
  };

  const handleSaveEdit = async (data: any) => {
    if (selectedStudent) {
      const result = await updateStudent(selectedStudent.id, data);
      if (result.success) {
        setIsEditModalVisible(false);
        setSelectedStudent(null);
      } else {
        Alert.alert('Erro', result.error || 'Falha ao atualizar aluno');
      }
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => handlePressStudent(item)}
      disabled={false}
      className="mb-3"
    >
      <View className="p-4 rounded-2xl border border-zinc-800 flex-row items-center justify-between bg-zinc-900">
        <View className="flex-row items-center flex-1">
          {/* Avatar */}
          <View className="h-14 w-14 rounded-full items-center justify-center mr-4 bg-zinc-800">
            <Ionicons 
              name="person" 
              size={28} 
              color="#A1A1AA" 
            />
          </View>

          {/* Info */}
          <View className="flex-1 mr-2">
            <Text className="text-white text-lg font-bold mb-1 font-display" numberOfLines={1}>
              {item.full_name || 'Aluno sem nome'}
            </Text>
            <Text className="text-zinc-400 text-sm font-sans" numberOfLines={1}>
              {item.invite_code ? `Código: ${item.invite_code}` : (item.email || 'Sem código')}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          {/* Enter Button */}
          <TouchableOpacity 
            onPress={() => handleEnterStudent(item)}
            className="p-2 bg-zinc-800 rounded-xl"
          >
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Remove Button */}
          <TouchableOpacity 
            onPress={() => handleRemove(item)}
            className="p-2"
          >
            <Ionicons name="trash-outline" size={20} color="#FF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenLayout>
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pt-4 pb-6">
        <View>
          <Text className="text-4xl font-extrabold text-white mb-1 font-display">
            Meus Alunos
          </Text>
          <Text className="text-base text-zinc-400 font-sans">
            {students.length} {students.length === 1 ? 'aluno' : 'alunos'}
          </Text>
        </View>
        
        <Link href={'/(tabs)/students/create' as any} asChild>
          <TouchableOpacity activeOpacity={0.8}>
            <LinearGradient
              colors={['#FF6B35', '#FF2E63']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="h-14 w-14 rounded-full items-center justify-center shadow-lg shadow-orange-500/20"
            >
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Content */}
      {students.length === 0 && !isLoading ? (
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-zinc-900 p-8 rounded-full mb-6 border border-zinc-800">
            <Ionicons name="people-outline" size={80} color="#52525B" />
          </View>
          <Text className="text-white text-2xl font-bold mb-2 text-center font-display">
            Nenhum aluno ainda
          </Text>
          <Text className="text-zinc-400 text-center px-8 text-base mb-8 font-sans">
            Comece cadastrando seu primeiro aluno
          </Text>
          
          <Link href={'/(tabs)/students/create' as any} asChild>
            <TouchableOpacity activeOpacity={0.8}>
              <LinearGradient
                colors={['#FF6B35', '#FF2E63']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-2xl py-4 px-8 shadow-lg shadow-orange-500/20"
              >
                <Text className="text-white text-base font-bold font-display">
                  Novo Aluno
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Link>
        </View>
      ) : (
        <FlatList
          data={students}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id || `student-${index}`}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
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

      <StudentEditModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        onSave={handleSaveEdit}
        student={selectedStudent}
      />
    </ScreenLayout>
  );
}
