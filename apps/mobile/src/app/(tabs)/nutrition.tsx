import { Card } from '@/components/ui/Card';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { useAuthStore } from '@/auth';
import { useStudentStore } from '@/students';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@meupersonal/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';

interface StudentWithPlan {
  id: string;
  full_name: string;
  email: string;
  status: string;
  activePlan?: {
    id: string;
    name: string;
    target_calories: number;
    target_protein: number;
    target_carbs: number;
    target_fat: number;
  };
}

export default function NutritionScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { students, fetchStudents } = useStudentStore();
  const [studentsWithPlans, setStudentsWithPlans] = useState<StudentWithPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchStudents(user.id);
      fetchPlans();
    }
  }, [user]);

  const fetchPlans = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('diet_plans')
      .select('*')
      .eq('personal_id', user.id)
      .eq('status', 'active');
    
    if (data) {
      setPlans(data);
    }
  };

  useEffect(() => {
    if (students.length > 0 || plans.length > 0) {
      processStudents();
    } else {
      setStudentsWithPlans([]);
      setLoading(false);
    }
  }, [students, plans]);

  const processStudents = () => {
    // Map students with their plans
    const studentsData: StudentWithPlan[] = students
      .filter(s => s.status === 'active')
      .map(student => ({
        ...student,
        activePlan: plans.find(p => p.student_id === student.id)
      }));

    setStudentsWithPlans(studentsData);
    setLoading(false);
  };

  const renderStudentItem = ({ item }: { item: StudentWithPlan }) => (
    <Link href={`/(tabs)/students/${item.id}/nutrition` as any} asChild>
      <TouchableOpacity activeOpacity={0.7} className="mb-3">
        <Card className="p-4 border-2 border-border">
          <View className="flex-row items-center mb-4">
            <View className="w-12 h-12 rounded-full bg-secondary/15 items-center justify-center mr-3">
              <Ionicons name="person" size={24} color="#00D9FF" />
            </View>
            <View className="flex-1">
              <Text className="text-foreground text-base font-bold mb-1 font-display">
                {item.full_name}
              </Text>
              {item.activePlan ? (
                <Text className="text-primary text-xs font-sans">{item.activePlan.name}</Text>
              ) : (
                <Text className="text-muted-foreground text-xs italic font-sans">Sem plano ativo</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#71717A" />
          </View>

          {item.activePlan && (
            <View className="flex-row justify-between bg-black/20 p-3 rounded-xl">
              <View className="items-center flex-1">
                <Text className="text-foreground text-base font-bold mb-1 font-display">
                  {item.activePlan.target_calories}
                </Text>
                <Text className="text-muted-foreground text-[10px] font-sans">kcal</Text>
              </View>
              <View className="w-[1px] bg-white/10" />
              <View className="items-center flex-1">
                <Text className="text-primary text-base font-bold mb-1 font-display">
                  {item.activePlan.target_protein}g
                </Text>
                <Text className="text-muted-foreground text-[10px] font-sans">Prot</Text>
              </View>
              <View className="w-[1px] bg-white/10" />
              <View className="items-center flex-1">
                <Text className="text-secondary text-base font-bold mb-1 font-display">
                  {item.activePlan.target_carbs}g
                </Text>
                <Text className="text-muted-foreground text-[10px] font-sans">Carb</Text>
              </View>
              <View className="w-[1px] bg-white/10" />
              <View className="items-center flex-1">
                <Text className="text-[#FFDE59] text-base font-bold mb-1 font-display">
                  {item.activePlan.target_fat}g
                </Text>
                <Text className="text-muted-foreground text-[10px] font-sans">Gord</Text>
              </View>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    </Link>
  );

  return (
    <ScreenLayout>
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pt-4 pb-6">
        <View>
          <Text className="text-4xl font-bold text-foreground mb-1 font-display">Nutrição</Text>
          <Text className="text-base text-muted-foreground font-sans">
            {studentsWithPlans.length} {studentsWithPlans.length === 1 ? 'aluno' : 'alunos'}
          </Text>
        </View>
        
        <Link href={'/nutrition/create' as any} asChild>
          <TouchableOpacity activeOpacity={0.8}>
            <LinearGradient
              colors={['#CCFF00', '#99CC00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="h-14 w-14 rounded-full items-center justify-center shadow-lg shadow-primary/30"
            >
              <Ionicons name="add" size={28} color="#000000" />
            </LinearGradient>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#CCFF00" />
        </View>
      ) : studentsWithPlans.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="people-outline" size={80} color="#71717A" />
          <Text className="text-foreground text-2xl font-bold mt-6 mb-2 font-display">
            Nenhum aluno ativo
          </Text>
          <Text className="text-muted-foreground text-center text-base font-sans">
            Adicione alunos para criar planos de dieta
          </Text>
        </View>
      ) : (
        <FlatList
          data={studentsWithPlans}
          renderItem={renderStudentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenLayout>
  );
}
