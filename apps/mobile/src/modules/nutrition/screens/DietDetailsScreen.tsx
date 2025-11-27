import { useAuthStore } from '@/auth';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNutritionStore } from '../routes';

export default function DietDetailsScreen() {
  const { id, studentId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { dietPlans, fetchDietPlans, isLoading } = useNutritionStore();
  const [plan, setPlan] = useState<any>(null);

  useEffect(() => {
    if (user?.id && !dietPlans.length) {
      fetchDietPlans(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (dietPlans.length > 0 && id) {
      const found = dietPlans.find(p => p.id === id);
      setPlan(found);
    }
  }, [dietPlans, id]);

  if (isLoading || !plan) {
    return (
      <ScreenLayout className="justify-center items-center">
        <ActivityIndicator size="large" color="#00D9FF" />
      </ScreenLayout>
    );
  }

  // Mock Meals Data (Replace with real data later)
  const meals = [
    { id: '1', name: 'Café da Manhã', time: '07:00', calories: 450, protein: 30, carbs: 40, fat: 15 },
    { id: '2', name: 'Almoço', time: '13:00', calories: 600, protein: 45, carbs: 50, fat: 20 },
    { id: '3', name: 'Lanche da Tarde', time: '16:00', calories: 300, protein: 20, carbs: 30, fat: 10 },
    { id: '4', name: 'Jantar', time: '20:00', calories: 500, protein: 40, carbs: 20, fat: 25 },
  ];

  return (
    <ScreenLayout>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="items-center pt-8 pb-8 px-6 bg-zinc-900 rounded-b-[32px] border-b border-zinc-800">
          <View className="flex-row items-center justify-between w-full mb-6">
            <TouchableOpacity 
              onPress={() => router.back()} 
              className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800"
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View className="flex-row gap-2">
              <TouchableOpacity 
                onPress={() => Alert.alert('Em breve', 'Edição em desenvolvimento')}
                className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800"
              >
                <Ionicons name="pencil" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="w-20 h-20 rounded-full bg-cyan-400/10 items-center justify-center mb-4 border-2 border-cyan-400/20">
            <Ionicons name="restaurant" size={40} color="#00D9FF" />
          </View>
          
          <Text className="text-2xl font-extrabold text-white mb-1 font-display text-center">
            {plan.name}
          </Text>
          <Text className="text-zinc-400 font-sans mb-6 text-center">
            {plan.description || 'Sem descrição'}
          </Text>

          {/* Macros Grid */}
          <View className="flex-row gap-3 w-full">
            <View className="flex-1 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 items-center">
              <Text className="text-emerald-400 text-xs font-bold mb-1">PROTEÍNA</Text>
              <Text className="text-white text-xl font-bold">{plan.target_protein}g</Text>
            </View>
            <View className="flex-1 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 items-center">
              <Text className="text-purple-400 text-xs font-bold mb-1">CARBO</Text>
              <Text className="text-white text-xl font-bold">{plan.target_carbs}g</Text>
            </View>
            <View className="flex-1 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 items-center">
              <Text className="text-amber-400 text-xs font-bold mb-1">GORDURA</Text>
              <Text className="text-white text-xl font-bold">{plan.target_fat}g</Text>
            </View>
          </View>

          <View className="mt-4 bg-zinc-950 px-6 py-3 rounded-xl border border-zinc-800 flex-row items-center">
            <Ionicons name="flame" size={20} color="#FF6B35" style={{ marginRight: 8 }} />
            <Text className="text-white font-bold text-lg">
              {plan.target_calories} <Text className="text-zinc-500 font-normal text-sm">kcal/dia</Text>
            </Text>
          </View>
        </View>

        {/* Meals List */}
        <View className="p-6">
          <Text className="text-white text-lg font-bold mb-4 font-display tracking-wide">
            REFEIÇÕES
          </Text>
          
          <View className="gap-4">
            {meals.map((meal) => (
              <View key={meal.id} className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                <View className="flex-row justify-between items-center mb-3">
                  <View className="flex-row items-center">
                    <View className="bg-zinc-800 px-2 py-1 rounded-md mr-3">
                      <Text className="text-zinc-400 text-xs font-bold">{meal.time}</Text>
                    </View>
                    <Text className="text-white font-bold text-base">{meal.name}</Text>
                  </View>
                  <Text className="text-orange-500 font-bold text-sm">{meal.calories} kcal</Text>
                </View>
                
                <View className="flex-row gap-4 pl-12">
                  <Text className="text-zinc-500 text-xs">P: <Text className="text-emerald-400 font-bold">{meal.protein}g</Text></Text>
                  <Text className="text-zinc-500 text-xs">C: <Text className="text-purple-400 font-bold">{meal.carbs}g</Text></Text>
                  <Text className="text-zinc-500 text-xs">G: <Text className="text-amber-400 font-bold">{meal.fat}g</Text></Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity 
            className="mt-6 border-2 border-dashed border-zinc-700 rounded-2xl p-4 items-center justify-center"
            onPress={() => Alert.alert('Em breve', 'Adicionar refeição em desenvolvimento')}
          >
            <Ionicons name="add-circle-outline" size={24} color="#71717A" />
            <Text className="text-zinc-500 font-bold mt-2">Adicionar Refeição</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
