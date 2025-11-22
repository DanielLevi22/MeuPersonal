import { StudentEditModal } from '@/components/StudentEditModal';
import { useAuthStore } from '@/store/authStore';
import { useStudentStore } from '@/store/studentStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    } else if (student.status === 'active') {
       // Navigate to details if active (Wait, the original code didn't navigate on press? 
       // Ah, renderItem has onPress={() => handleEdit(item)}. 
       // I should probably change this to navigate to details, and have an edit button separately?
       // The original code: onPress={() => handleEdit(item)} opens the modal.
       // But we want to navigate to the student details screen now.
       // Let's keep the edit modal for now, but maybe add a way to go to details.
       // Actually, the user wants to see diet plans, which are in student details.
       // So clicking a student should go to [id].
    }
    
    // Wait, previously how did we get to [id]? 
    // The original code didn't seem to have navigation to [id] in the list item?
    // Let me check the original code again.
    // renderItem: onPress={() => handleEdit(item)}
    // handleEdit: sets selectedStudent and opens modal.
    // So where was the navigation to student details?
    // Maybe it wasn't implemented or I missed it?
    // Ah, looking at the file list, `src/app/students/[id]` exists.
    // But `students.tsx` doesn't seem to link to it.
    // This might be why the user is confused or can't see things.
    // I should update the list item to navigate to `/(tabs)/students/${item.id}` on press.
    // And maybe put the edit action on a button.
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
    >
      <View 
        style={{
          backgroundColor: '#141B2D',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 2,
          borderColor: item.status === 'invited' ? 'rgba(255, 184, 0, 0.3)' : '#1E2A42',
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
            backgroundColor: item.status === 'invited' ? 'rgba(255, 184, 0, 0.15)' : 'rgba(0, 217, 255, 0.15)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16
          }}>
            <Ionicons 
              name={item.status === 'invited' ? "mail-outline" : "person"} 
              size={28} 
              color={item.status === 'invited' ? "#FFB800" : "#00D9FF"} 
            />
          </View>

          {/* Info */}
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 4 }} numberOfLines={1}>
              {item.full_name || 'Aluno sem nome'}
            </Text>
            <Text style={{ color: '#8B92A8', fontSize: 14 }} numberOfLines={1}>
              {item.status === 'invited' ? item.email : `Código: ${item.invite_code || 'N/A'}`}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Status Badge */}
          <View style={{
            backgroundColor: item.status === 'active' 
              ? 'rgba(0, 255, 136, 0.15)' 
              : item.status === 'invited'
                ? 'rgba(255, 184, 0, 0.15)'
                : 'rgba(255, 255, 255, 0.1)',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 12,
            marginRight: 12
          }}>
            <Text style={{
              color: item.status === 'active' 
                ? '#00FF88' 
                : item.status === 'invited'
                  ? '#FFB800'
                  : '#8B92A8',
              fontSize: 12,
              fontWeight: '700'
            }}>
              {item.status === 'active' ? 'Ativo' : item.status === 'invited' ? 'Convite' : 'Pendente'}
            </Text>
          </View>

          {/* Edit Button (New) */}
          {item.status === 'active' && (
             <TouchableOpacity 
             onPress={() => handleEdit(item)}
             style={{ padding: 8, marginRight: 4 }}
           >
             <Ionicons name="pencil-outline" size={20} color="#FFFFFF" />
           </TouchableOpacity>
          )}

          {/* Remove Button */}
          <TouchableOpacity 
            onPress={() => handleRemove(item)}
            style={{ padding: 8 }}
          >
            <Ionicons name="trash-outline" size={20} color="#FF4444" />
          </TouchableOpacity>
        </View>
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
          
          <Link href={'/(tabs)/students/create' as any} asChild>
            <TouchableOpacity activeOpacity={0.8}>
              <LinearGradient
                colors={['#00FF88', '#00CC6E']}
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
                <Ionicons name="add" size={28} color="#0A0E1A" />
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
              Comece cadastrando seu primeiro aluno
            </Text>
            
            <Link href={'/(tabs)/students/create' as any} asChild>
              <TouchableOpacity activeOpacity={0.8}>
                <LinearGradient
                  colors={['#00FF88', '#00CC6E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 16,
                    paddingVertical: 16,
                    paddingHorizontal: 32
                  }}
                >
                  <Text style={{ color: '#0A0E1A', fontSize: 16, fontWeight: '700' }}>
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
            contentContainerStyle={{ paddingHorizontal: 24 }}
            refreshControl={
              <RefreshControl 
                refreshing={isLoading} 
                onRefresh={() => user?.id && fetchStudents(user.id)} 
                tintColor="#00FF88" 
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
      </SafeAreaView>
    </View>
  );
}
