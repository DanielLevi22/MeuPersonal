import { useAuthStore } from '@/auth';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { StatusModal, StatusModalType } from '@/components/ui/StatusModal';
import { useHealthData } from '@/hooks/useHealthData';
import { MealCard } from '@/modules/nutrition/components/MealCard';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNutritionStore } from '../store/nutritionStore';

const DAYS = [
  { id: 0, label: 'DOM' },
  { id: 1, label: 'SEG' },
  { id: 2, label: 'TER' },
  { id: 3, label: 'QUA' },
  { id: 4, label: 'QUI' },
  { id: 5, label: 'SEX' },
  { id: 6, label: 'SÁB' },
];


export function StudentNutritionScreen() {
  const { user } = useAuthStore();
  const { 
    currentDietPlan, 
    fetchDietPlan, 
    meals, 
    fetchMeals, 
    mealItems, 
    fetchMealItems, 
    isLoading,
    dailyLogs,
    fetchDailyLogs,
    toggleMealCompletion
  } = useNutritionStore();

  const { calories: burnedCalories } = useHealthData();

  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [refreshing, setRefreshing] = useState(false);

  // Status Modal State
  const [statusModal, setStatusModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: StatusModalType;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Helper to get the date object for the selected day index in the CURRENT week
  const getDateOfSelectedDay = (dayIndex: number) => {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = dayIndex - currentDay;
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    return targetDate;
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadData();
      }
    }, [user?.id, selectedDay]) // Reload when selectedDay changes
  );

  const loadData = async () => {
    if (!user?.id) return;
    
    // Only fetch plan if likely needed or stale, but here we just fetch to be safe
    if (!currentDietPlan) {
        await fetchDietPlan(user.id);
    }
    
    const targetDateObj = getDateOfSelectedDay(selectedDay);
    
    // Fix: Ensure we construct the ISO string correctly for the target date
    const offset = targetDateObj.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(targetDateObj.getTime() - offset)).toISOString().slice(0, 10);
    
    await fetchDailyLogs(user.id, localISOTime);
  };

  useEffect(() => {
    if (currentDietPlan) {
      fetchMeals(currentDietPlan.id);
    }
  }, [currentDietPlan]);

  useEffect(() => {
    if (meals.length > 0) {
      meals.forEach(meal => {
        fetchMealItems(meal.id);
      });
    }
  }, [meals]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleToggleCheck = async (mealId: string) => {
    const targetDateObj = getDateOfSelectedDay(selectedDay);
    const today = new Date();
    
    // Reset hours to compare only dates
    targetDateObj.setHours(0,0,0,0);
    const todayZero = new Date();
    todayZero.setHours(0,0,0,0);

    if (targetDateObj > todayZero) {
        setStatusModal({
            visible: true,
            title: "Ainda não!",
            message: "Você não pode marcar refeições de dias futuros. Planeje no presente! ✨",
            type: 'warning'
        });
        return;
    }

    const offset = targetDateObj.getTimezoneOffset() * 60000;
    const targetDateString = (new Date(targetDateObj.getTime() - offset)).toISOString().slice(0, 10);

    const isCompleted = dailyLogs[mealId]?.completed || false;
    await toggleMealCompletion(mealId, targetDateString, !isCompleted);
  };

  const dayMeals = meals
    .filter(m => m.day_of_week === selectedDay)
    .sort((a, b) => (a.meal_order || 0) - (b.meal_order || 0));

  const dayTotalMacros = dayMeals.reduce(
    (total, meal) => {
      const items = mealItems[meal.id] || [];
      items.forEach((item) => {
        if (item.food) {
          const multiplier = item.quantity / (item.food.serving_size || 100);
          total.calories += (item.food.calories || 0) * multiplier;
          total.protein += (item.food.protein || 0) * multiplier;
          total.carbs += (item.food.carbs || 0) * multiplier;
          total.fat += (item.food.fat || 0) * multiplier;
        }
      });
      return total;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const consumedMacros = dayMeals.reduce(
    (total, meal) => {
      // Check validation against logs (which are now fetched for the selected day)
      if (dailyLogs[meal.id]?.completed) {
        const items = mealItems[meal.id] || [];
        items.forEach((item) => {
          if (item.food) {
            const multiplier = item.quantity / (item.food.serving_size || 100);
            total.calories += (item.food.calories || 0) * multiplier;
            total.protein += (item.food.protein || 0) * multiplier;
            total.carbs += (item.food.carbs || 0) * multiplier;
            total.fat += (item.food.fat || 0) * multiplier;
          }
        });
      }
      return total;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const router = useRouter();

  if (isLoading && !refreshing && !currentDietPlan) {
    return (
      <ScreenLayout className="justify-center items-center">
        <ActivityIndicator size="large" color="#FF6B35" />
      </ScreenLayout>
    );
  }

  if (!currentDietPlan) {
    return (
      <ScreenLayout>
        <ScrollView 
          contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />}
        >
          <View className="bg-zinc-900/50 p-8 rounded-full mb-6 border border-zinc-800">
            <Ionicons name="restaurant-outline" size={64} color="#52525B" />
          </View>
          <Text className="text-white text-xl font-bold mb-2 text-center font-display">
            Nenhum plano ativo
          </Text>
          <Text className="text-zinc-400 text-center text-sm mb-8 font-sans leading-relaxed">
            Você ainda não possui um plano alimentar ativo. Entre em contato com seu nutricionista.
          </Text>
        </ScrollView>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <View className="px-6 pt-8 pb-4 flex-row justify-between items-center">
        <View>
            <Text className="text-3xl font-extrabold text-white font-display tracking-tight">
            Minha Dieta
            </Text>
            <Text className="text-zinc-400 font-sans font-medium mt-1">
            {currentDietPlan.name}
            </Text>
        </View>
        <View className="flex-row gap-3">
             <TouchableOpacity 
                onPress={() => router.push('/(tabs)/nutrition/shopping-list' as any)}
                className="bg-zinc-800 p-3 rounded-full border border-zinc-700 shadow-sm"
            >
                <Ionicons name="cart-outline" size={24} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity 
                onPress={() => router.push('/(tabs)/nutrition/scan' as any)}
                className="bg-zinc-800 p-3 rounded-full border border-zinc-700 shadow-sm"
            >
                <Ionicons name="camera" size={24} color="#FF6B35" />
            </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />}
      >
        {/* Day Selector */}
        <View className="px-6 mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {DAYS.map((day) => {
                 // Check if day is future to visually dim it? 
                 // Optional. For now keeping style same but logic blocks interactions.
                 const isSelected = selectedDay === day.id;
                 return (
                    <TouchableOpacity
                      key={day.id}
                      onPress={() => setSelectedDay(day.id)}
                      className={`px-4 py-2 rounded-full border ${
                        isSelected
                          ? 'bg-orange-500 border-orange-500'
                          : 'bg-zinc-900 border-zinc-800'
                      }`}
                    >
                      <Text className={`font-bold text-xs ${
                        isSelected ? 'text-white' : 'text-zinc-400'
                      }`}>
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Macros Summary */}
        <View className="px-6 mb-6">
          <View className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
            <Text className="text-white font-bold mb-4">Resumo do Dia</Text>
            
            {/* Calories Row */}
            <View className="flex-row justify-between mb-6 bg-zinc-950/50 p-3 rounded-xl">
              <View className="items-center flex-1 border-r border-zinc-800">
                <Text className="text-zinc-400 text-xs mb-1">Meta</Text>
                <Text className="text-white font-bold text-lg">
                  {Math.round(dayTotalMacros.calories)}
                </Text>
              </View>
              <View className="items-center flex-1 border-r border-zinc-800">
                <Text className="text-zinc-400 text-xs mb-1">Consumidas</Text>
                <Text className="text-orange-500 font-bold text-lg">
                  {Math.round(consumedMacros.calories)}
                </Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-zinc-400 text-xs mb-1">Gastas</Text>
                <Text className="text-emerald-500 font-bold text-lg">
                  {burnedCalories}
                </Text>
              </View>
            </View>

            {/* Macros Row */}
            <View className="flex-row justify-between mb-4 px-2">
              <View className="items-center">
                <Text className="text-zinc-400 text-xs mb-1">Proteína</Text>
                <Text className="text-emerald-400 font-bold text-base">
                  {Math.round(consumedMacros.protein)} <Text className="text-zinc-500 text-[10px]">/ {Math.round(dayTotalMacros.protein)}g</Text>
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-zinc-400 text-xs mb-1">Carbo</Text>
                <Text className="text-purple-400 font-bold text-base">
                  {Math.round(consumedMacros.carbs)} <Text className="text-zinc-500 text-[10px]">/ {Math.round(dayTotalMacros.carbs)}g</Text>
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-zinc-400 text-xs mb-1">Gordura</Text>
                <Text className="text-amber-400 font-bold text-base">
                  {Math.round(consumedMacros.fat)} <Text className="text-zinc-500 text-[10px]">/ {Math.round(dayTotalMacros.fat)}g</Text>
                </Text>
              </View>
            </View>
            
            {/* Progress Bar */}
            <View className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <View 
                className="h-full bg-orange-500 rounded-full" 
                style={{ width: `${Math.min((consumedMacros.calories / (dayTotalMacros.calories || 1)) * 100, 100)}%` }} 
              />
            </View>
          </View>
        </View>

        {/* Meals List */}
        <View className="px-6">
          {dayMeals.length > 0 ? (
            dayMeals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                items={mealItems[meal.id] || []}
                onAddFood={() => {}}
                onRemoveFood={() => {}}
                onUpdateMealTime={() => {}}
                onUpdateFood={() => {}}
                isEditable={false}
                isChecked={dailyLogs[meal.id]?.completed}
                onToggleCheck={() => handleToggleCheck(meal.id)}
                onCook={() => {
                   const items = mealItems[meal.id] || [];
                   if (items.length === 0) {
                       Alert.alert("Vazio", "Esta refeição não tem alimentos.");
                       return;
                   }
                   const ingredients = JSON.stringify(items.map(i => i.food?.name || "Item sem nome"));
                   router.push({
                       pathname: '/(tabs)/nutrition/cooking',
                       params: { mealName: meal.name, ingredients, mealId: meal.id }
                   });
                }}
              />
            ))
          ) : (
            <View className="items-center py-10">
              <Text className="text-zinc-500">Nenhuma refeição planejada para este dia.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* NutriBot FAB */}
      <TouchableOpacity 
        onPress={() => router.push('/(tabs)/nutrition/bot' as any)}
        className="absolute bottom-6 right-6 bg-orange-500 w-14 h-14 rounded-full items-center justify-center shadow-lg z-50"
        style={{ shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }}
      >
        <Ionicons name="chatbubbles" size={28} color="white" />
      </TouchableOpacity>

      {/* Status Modal */}
      <StatusModal 
        visible={statusModal.visible}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        onClose={() => setStatusModal(prev => ({ ...prev, visible: false }))}
      />
    </ScreenLayout>
  );
}
