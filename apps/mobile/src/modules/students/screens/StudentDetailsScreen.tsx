import { useAuthStore } from '@/auth';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useStudentStore } from '../store/studentStore';

export default function StudentDetailsScreen() {
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

  const menuItems = [
    {
      title: 'Treinos',
      subtitle: 'Gerenciar fichas',
      icon: 'barbell-outline',
      color: '#FF6B35',
      gradient: ['#FF6B35', '#FF2E63'],
      route: `/(tabs)/students/${id}/workouts`,
    },
    {
      title: 'Dieta',
      subtitle: 'Plano alimentar',
      icon: 'restaurant-outline',
      color: '#00D9FF',
      gradient: ['#00D9FF', '#00B8D9'],
      route: `/(tabs)/students/${id}/nutrition`,
    },
    {
      title: 'Histórico',
      subtitle: 'Evolução e logs',
      icon: 'time-outline',
      color: '#00C9A7',
      gradient: ['#00C9A7', '#00A88E'],
      route: `/(tabs)/students/${id}/history`,
    },
    {
      title: 'Avaliação',
      subtitle: 'Medidas e fotos',
      icon: 'body-outline',
      color: '#FFB800',
      gradient: ['#FFB800', '#FF9500'],
      route: `/(tabs)/students/${id}/assessment`, // Future implementation
      disabled: true,
    },
  ];

  return (
    <ScreenLayout>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="items-center pt-8 pb-8 px-6 bg-zinc-900 rounded-b-[32px] border-b border-zinc-800">
          <View className="w-24 h-24 rounded-full bg-cyan-400/10 items-center justify-center mb-4 border-2 border-cyan-400/20">
            <Ionicons name="person" size={48} color="#00D9FF" />
          </View>
          
          <Text className="text-2xl font-extrabold text-white mb-1 font-display text-center">
            {student.full_name}
          </Text>
          <Text className="text-zinc-400 font-sans mb-6">
            {student.email}
          </Text>

          {/* Quick Stats */}
          <View className="flex-row gap-4 w-full">
            <View className="flex-1 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 items-center">
              <Text className="text-zinc-500 text-xs font-bold mb-1 uppercase tracking-wider">Status</Text>
              <Text className={`text-base font-bold ${student.status === 'active' ? 'text-emerald-400' : 'text-orange-500'}`}>
                {student.status === 'active' ? 'Ativo' : 'Pendente'}
              </Text>
            </View>
            <View className="flex-1 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 items-center">
              <Text className="text-zinc-500 text-xs font-bold mb-1 uppercase tracking-wider">Desde</Text>
              <Text className="text-white text-base font-bold">
                {new Date(student.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Grid */}
        <View className="p-6">
          <Text className="text-white text-lg font-bold mb-4 font-display tracking-wide">
            GERENCIAMENTO
          </Text>
          
          <View className="flex-row flex-wrap gap-4">
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                className={`w-[47%] h-40 rounded-3xl p-4 justify-between border ${item.disabled ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-900 border-zinc-800'}`}
                onPress={() => !item.disabled && router.push(item.route as any)}
                activeOpacity={item.disabled ? 1 : 0.7}
              >
                <View 
                  className="w-12 h-12 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: item.disabled ? '#27272A' : `${item.color}20` }}
                >
                  <Ionicons 
                    name={item.icon as any} 
                    size={24} 
                    color={item.disabled ? '#52525B' : item.color} 
                  />
                </View>
                
                <View>
                  <Text className={`text-base font-bold mb-1 font-display ${item.disabled ? 'text-zinc-600' : 'text-white'}`}>
                    {item.title}
                  </Text>
                  <Text className="text-zinc-500 text-xs font-sans">
                    {item.subtitle}
                  </Text>
                </View>

                {!item.disabled && (
                  <View className="absolute top-4 right-4">
                    <Ionicons name="arrow-forward" size={16} color={item.color} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Danger Zone */}
        <View className="px-6 mt-4">
          <TouchableOpacity 
            className="flex-row items-center justify-center p-4 rounded-2xl border border-red-500/20 bg-red-500/5"
            onPress={() => {
              Alert.alert('Em breve', 'Funcionalidade de arquivar aluno em desenvolvimento');
            }}
          >
            <Ionicons name="archive-outline" size={20} color="#FF4444" />
            <Text className="text-red-500 font-bold ml-2">Arquivar Aluno</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
