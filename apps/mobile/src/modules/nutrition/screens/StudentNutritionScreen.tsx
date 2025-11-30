import { useAuthStore } from '@/auth';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { MealCard } from '@/modules/nutrition/components/MealCard';
import { useNutritionStore } from '@/modules/nutrition/routes';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

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

  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadData();
      }
    }, [user?.id])
  );

  const loadData = async () => {
    if (!user?.id) return;
    await fetchDietPlan(user.id);
    const today = new Date().toISOString().split('T')[0];
    await fetchDailyLogs(user.id, today);
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
    const today = new Date().toISOString().split('T')[0];
    const isCompleted = dailyLogs[mealId]?.completed || false;
    await toggleMealCompletion(mealId, today, !isCompleted);
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
      <View className="px-6 pt-8 pb-4">
        <Text className="text-3xl font-extrabold text-white font-display tracking-tight">
          Minha Dieta
        </Text>
        <Text className="text-zinc-400 font-sans font-medium mt-1">
          {currentDietPlan.name}
        </Text>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />}
      >
        {/* Day Selector */}
        <View className="px-6 mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {DAYS.map((day) => (
                <TouchableOpacity
                  key={day.id}
                  onPress={() => setSelectedDay(day.id)}
                  className={`px-4 py-2 rounded-full border ${
                    selectedDay === day.id
                      ? 'bg-orange-500 border-orange-500'
                      : 'bg-zinc-900 border-zinc-800'
                  }`}
                >
                  <Text className={`font-bold text-xs ${
                    selectedDay === day.id ? 'text-white' : 'text-zinc-400'
                  }`}>
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Macros Summary */}
        <View className="px-6 mb-6">
          <View className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
            <Text className="text-white font-bold mb-4">Resumo do Dia</Text>
            <View className="flex-row justify-between mb-4">
              <View className="items-center">
                <Text className="text-zinc-400 text-xs mb-1">Calorias</Text>
                <Text className="text-white font-bold text-lg">
                  {Math.round(consumedMacros.calories)} <Text className="text-zinc-500 text-xs">/ {Math.round(dayTotalMacros.calories)}</Text>
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-zinc-400 text-xs mb-1">Proteína</Text>
                <Text className="text-emerald-400 font-bold text-lg">
                  {Math.round(consumedMacros.protein)} <Text className="text-zinc-500 text-xs">/ {Math.round(dayTotalMacros.protein)}g</Text>
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-zinc-400 text-xs mb-1">Carbo</Text>
                <Text className="text-purple-400 font-bold text-lg">
                  {Math.round(consumedMacros.carbs)} <Text className="text-zinc-500 text-xs">/ {Math.round(dayTotalMacros.carbs)}g</Text>
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-zinc-400 text-xs mb-1">Gordura</Text>
                <Text className="text-amber-400 font-bold text-lg">
                  {Math.round(consumedMacros.fat)} <Text className="text-zinc-500 text-xs">/ {Math.round(dayTotalMacros.fat)}g</Text>
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
              />
            ))
          ) : (
            <View className="items-center py-10">
              <Text className="text-zinc-500">Nenhuma refeição planejada para este dia.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
