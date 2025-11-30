import { useAuthStore } from '@/auth';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo } from 'react';
import {
    ActivityIndicator,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useNutritionStore } from '../store/nutritionStore';

export function DailyNutrition() {
  const { user } = useAuthStore();
  const {
    currentDietPlan,
    meals,
    mealItems,
    dailyLogs,
    fetchDietPlan,
    fetchMeals,
    fetchMealItems,
    fetchDailyLogs,
    toggleMealCompletion,
    isLoading,
  } = useNutritionStore();

  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.id) return;
    await fetchDietPlan(user.id);
    await fetchDailyLogs(user.id, today);
  };

  useEffect(() => {
    if (currentDietPlan) {
      fetchMeals(currentDietPlan.id);
    }
  }, [currentDietPlan]);

  useEffect(() => {
    meals.forEach((meal) => {
      if (!mealItems[meal.id]) {
        fetchMealItems(meal.id);
      }
    });
  }, [meals]);

  // Filter meals for today
  const todayMeals = useMemo(() => {
    return meals.filter((meal) => meal.day_of_week === dayOfWeek);
  }, [meals, dayOfWeek]);

  // Calculate consumed macros
  const consumedMacros = useMemo(() => {
    return todayMeals.reduce(
      (total, meal) => {
        const isCompleted = dailyLogs[meal.id]?.completed;
        if (!isCompleted) return total;

        const items = mealItems[meal.id] || [];
        items.forEach((item) => {
          if (item.food) {
            const multiplier = item.quantity / item.food.serving_size;
            total.calories += item.food.calories * multiplier;
            total.protein += item.food.protein * multiplier;
            total.carbs += item.food.carbs * multiplier;
            total.fat += item.food.fat * multiplier;
          }
        });
        return total;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [todayMeals, mealItems, dailyLogs]);

  // Calculate progress percentages
  const getProgress = (current: number, target: number) => {
    if (!target) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  };

  if (isLoading && !currentDietPlan) {
    return (
      <View className="p-6 items-center">
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  if (!currentDietPlan) {
    return (
      <View className="p-6 items-center bg-card rounded-2xl border border-border">
        <Ionicons name="restaurant-outline" size={48} color="#A1A1AA" />
        <Text className="text-muted-foreground mt-3 text-base">Nenhum plano de dieta ativo</Text>
      </View>
    );
  }

  return (
    <View className="mb-6">
      {/* Header */}
      <View className="flex-row justify-between items-start mb-6">
        <View>
          <Text className="text-2xl font-extrabold text-foreground mb-1">Nutrição de Hoje</Text>
          <Text className="text-sm text-muted-foreground capitalize">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>
        </View>
        <View className="bg-card px-3 py-2 rounded-xl border border-border items-end">
          <Text className="text-lg font-bold text-orange-500">
            {consumedMacros.calories.toFixed(0)}
          </Text>
          <Text className="text-xs text-muted-foreground">
            / {currentDietPlan.target_calories.toFixed(0)} kcal
          </Text>
        </View>
      </View>

      {/* Macro Bars */}
      <View className="bg-card p-4 rounded-2xl border border-border mb-6 gap-4">
        <MacroBar
          label="Proteína"
          current={consumedMacros.protein}
          target={currentDietPlan.target_protein}
          colorClass="bg-primary"
        />
        <MacroBar
          label="Carboidratos"
          current={consumedMacros.carbs}
          target={currentDietPlan.target_carbs}
          colorClass="bg-secondary"
        />
        <MacroBar
          label="Gordura"
          current={consumedMacros.fat}
          target={currentDietPlan.target_fat}
          colorClass="bg-yellow-400"
        />
      </View>

      {/* Meals List */}
      <View className="gap-3">
        <Text className="text-lg font-bold text-foreground mb-1">Refeições</Text>
        {todayMeals.length === 0 ? (
          <Text className="text-muted-foreground italic">Nenhuma refeição planejada para hoje.</Text>
        ) : (
          todayMeals.map((meal) => {
            const isCompleted = dailyLogs[meal.id]?.completed;
            const items = mealItems[meal.id] || [];
            const totalCalories = items.reduce((sum, item) => {
              return (
                sum +
                (item.food ? (item.food.calories * item.quantity) / item.food.serving_size : 0)
              );
            }, 0);

            return (
              <TouchableOpacity
                key={meal.id}
                className={`bg-card p-4 rounded-2xl border border-border ${isCompleted ? 'opacity-60 border-primary bg-primary/5' : ''}`}
                onPress={() => toggleMealCompletion(meal.id, today, !isCompleted)}
                activeOpacity={0.7}
              >
                <View className="flex-row justify-between items-center mb-1">
                  <View className="flex-1">
                    <Text
                      className={`text-xs text-muted-foreground mb-0.5 ${isCompleted ? 'line-through' : ''}`}
                    >
                      {meal.meal_time || 'Sem horário'}
                    </Text>
                    <Text
                      className={`text-base font-semibold text-foreground ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
                    >
                      {meal.name || getMealTypeName(meal.meal_type)}
                    </Text>
                  </View>
                  <View
                    className={`w-6 h-6 rounded-full border-2 border-muted-foreground items-center justify-center ${isCompleted ? 'bg-primary border-primary' : ''}`}
                  >
                    {isCompleted && (
                      <Ionicons name="checkmark" size={16} color="#0A0E1A" />
                    )}
                  </View>
                </View>
                <Text
                  className={`text-xs text-muted-foreground ${isCompleted ? 'line-through' : ''}`}
                >
                  {totalCalories.toFixed(0)} kcal • {items.length} itens
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </View>
  );
}

function MacroBar({
  label,
  current,
  target,
  colorClass,
}: {
  label: string;
  current: number;
  target: number;
  colorClass: string;
}) {
  const progress = Math.min((current / target) * 100, 100);

  return (
    <View className="gap-2">
      <View className="flex-row justify-between">
        <Text className="text-sm font-semibold text-foreground">{label}</Text>
        <Text className="text-xs text-muted-foreground">
          {current.toFixed(0)} / {target.toFixed(0)}g
        </Text>
      </View>
      <View className="h-2 bg-muted/30 rounded-full overflow-hidden">
        <View
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${progress}%` }}
        />
      </View>
    </View>
  );
}

function getMealTypeName(type: string) {
  const types: Record<string, string> = {
    breakfast: 'Café da Manhã',
    morning_snack: 'Lanche da Manhã',
    lunch: 'Almoço',
    afternoon_snack: 'Lanche da Tarde',
    dinner: 'Jantar',
    evening_snack: 'Ceia',
  };
  return types[type] || type;
}