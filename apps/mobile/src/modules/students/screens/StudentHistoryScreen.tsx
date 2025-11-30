import { useAuthStore } from '@/auth';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useStudentStore } from '../store/studentStore';

export default function StudentHistoryScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { students, fetchStudents, isLoading } = useStudentStore();
  const { user } = useAuthStore();
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    if (user?.id && !students.length) {
      fetchStudents(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (students.length > 0 && id) {
      const found = students.find(s => s.id === id);
      setStudent(found);
    }
  }, [students, id]);

  if (isLoading || !student) {
    return (
      <ScreenLayout className="justify-center items-center">
        <ActivityIndicator size="large" color="#FF6B35" />
      </ScreenLayout>
    );
  }

  // Mock History Data (Replace with real data later)
  const historyData = [
    { id: '1', type: 'workout', title: 'Treino A - Peito e Tríceps', date: '2023-11-25', status: 'completed' },
    { id: '2', type: 'diet', title: 'Dieta de Cutting', date: '2023-11-24', status: 'updated' },
    { id: '3', type: 'assessment', title: 'Avaliação Física', date: '2023-11-20', status: 'completed' },
    { id: '4', type: 'workout', title: 'Treino B - Costas e Bíceps', date: '2023-11-18', status: 'completed' },
  ];

  const renderItem = ({ item }: { item: any }) => (
    <View className="flex-row mb-6">
      {/* Timeline Line */}
      <View className="items-center mr-4">
        <View className={`w-3 h-3 rounded-full ${
          item.type === 'workout' ? 'bg-orange-500' : 
          item.type === 'diet' ? 'bg-emerald-500' : 'bg-zinc-500'
        }`} />
        <View className="w-0.5 flex-1 bg-zinc-800 my-1" />
      </View>

      {/* Content Card */}
      <View className="flex-1 bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-row items-center">
            <Ionicons 
              name={
                item.type === 'workout' ? 'barbell' : 
                item.type === 'diet' ? 'restaurant' : 'body'
              } 
              size={16} 
              color={
                item.type === 'workout' ? '#FF6B35' : 
                item.type === 'diet' ? '#10B981' : '#A1A1AA'
              } 
              style={{ marginRight: 8 }}
            />
            <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
              {item.type === 'workout' ? 'Treino' : item.type === 'diet' ? 'Dieta' : 'Avaliação'}
            </Text>
          </View>
          <Text className="text-zinc-500 text-xs font-sans">
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>

        <Text className="text-white text-base font-bold mb-1 font-display">
          {item.title}
        </Text>
        
        <View className="flex-row items-center mt-2">
          <View className={`px-2 py-1 rounded-lg ${
            item.status === 'completed' ? 'bg-emerald-500/15' : 'bg-zinc-800'
          }`}>
            <Text className={`text-xs font-bold ${
              item.status === 'completed' ? 'text-emerald-400' : 'text-zinc-400'
            }`}>
              {item.status === 'completed' ? 'Concluído' : 'Atualizado'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenLayout>
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 mb-4">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="bg-zinc-900 p-2.5 rounded-xl mr-4 border border-zinc-800"
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-extrabold text-white font-display">
            Histórico
          </Text>
          <Text className="text-zinc-400 font-sans">
            {student.full_name}
          </Text>
        </View>
      </View>

      {/* Timeline */}
      <FlatList
        data={historyData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-10">
            <Text className="text-zinc-500 font-sans">Nenhum histórico encontrado.</Text>
          </View>
        }
      />
    </ScreenLayout>
  );
}
