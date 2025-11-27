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
    if (student.status === 'active') {
      setSelectedStudent(student);
      setIsEditModalVisible(true);
    }
  };

  const handlePressStudent = (student: any) => {
    if (student.status === 'active') {
      router.push(`/(tabs)/students/${student.id}` as any);
    } else {
      handleEdit(student);
    }
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
      <View className={`p-4 rounded-2xl border flex-row items-center justify-between bg-zinc-900 ${item.status === 'invited' ? 'border-orange-500/30' : 'border-zinc-800'}`}>
        <View className="flex-row items-center flex-1">
          {/* Avatar */}
          <View className={`h-14 w-14 rounded-full items-center justify-center mr-4 ${item.status === 'invited' ? 'bg-orange-500/15' : 'bg-cyan-400/15'}`}>
            <Ionicons 
              name={item.status === 'invited' ? "mail-outline" : "person"} 
              size={28} 
              color={item.status === 'invited' ? "#FF6B35" : "#00D9FF"} 
            />
          </View>

          {/* Info */}
          <View className="flex-1 mr-2">
            <Text className="text-white text-lg font-bold mb-1 font-display" numberOfLines={1}>
              {item.full_name || 'Aluno sem nome'}
            </Text>
            <Text className="text-zinc-400 text-sm font-sans" numberOfLines={1}>
              {item.status === 'invited' ? item.email : `Código: ${item.invite_code || 'N/A'}`}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center">
          {/* Status Badge */}
          <View className={`px-2.5 py-1.5 rounded-xl mr-3 ${
            item.status === 'active' 
              ? 'bg-emerald-500/15' 
              : item.status === 'invited'
                ? 'bg-orange-500/15'
                : 'bg-zinc-800'
          }`}>
            <Text className={`text-xs font-bold font-display ${
              item.status === 'active' 
                ? 'text-emerald-400' 
                : item.status === 'invited'
                  ? 'text-orange-500'
                  : 'text-zinc-400'
            }`}>
              {item.status === 'active' ? 'Ativo' : item.status === 'invited' ? 'Convite' : 'Pendente'}
            </Text>
          </View>

          {/* Edit Button (New) */}
          {item.status === 'active' && (
             <TouchableOpacity 
             onPress={() => handleEdit(item)}
             className="p-2 mr-1"
           >
             <Ionicons name="pencil-outline" size={20} color="#FFFFFF" />
           </TouchableOpacity>
          )}

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
