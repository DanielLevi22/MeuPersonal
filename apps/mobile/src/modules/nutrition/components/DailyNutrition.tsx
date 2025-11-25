import { useAuthStore } from '@/auth';
import { useNutritionStore } from '@/nutrition';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!currentDietPlan) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="restaurant-outline" size={48} color="#5A6178" />
        <Text style={styles.emptyText}>Nenhum plano de dieta ativo</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Nutrição de Hoje</Text>
          <Text style={styles.subtitle}>
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>
        </View>
        <View style={styles.caloriesBadge}>
          <Text style={styles.caloriesValue}>
            {consumedMacros.calories.toFixed(0)}
          </Text>
          <Text style={styles.caloriesLabel}>
            / {currentDietPlan.target_calories.toFixed(0)} kcal
          </Text>
        </View>
      </View>

      {/* Macro Bars */}
      <View style={styles.macrosContainer}>
        <MacroBar
          label="Proteína"
          current={consumedMacros.protein}
          target={currentDietPlan.target_protein}
          color="#00FF88"
        />
        <MacroBar
          label="Carboidratos"
          current={consumedMacros.carbs}
          target={currentDietPlan.target_carbs}
          color="#00D9FF"
        />
        <MacroBar
          label="Gordura"
          current={consumedMacros.fat}
          target={currentDietPlan.target_fat}
          color="#FFDE59"
        />
      </View>

      {/* Meals List */}
      <View style={styles.mealsContainer}>
        <Text style={styles.sectionTitle}>Refeições</Text>
        {todayMeals.length === 0 ? (
          <Text style={styles.noMealsText}>Nenhuma refeição planejada para hoje.</Text>
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
                style={[styles.mealCard, isCompleted && styles.mealCardCompleted]}
                onPress={() => toggleMealCompletion(meal.id, today, !isCompleted)}
                activeOpacity={0.7}
              >
                <View style={styles.mealHeader}>
                  <View style={styles.mealInfo}>
                    <Text
                      style={[
                        styles.mealTime,
                        isCompleted && styles.textCompleted,
                      ]}
                    >
                      {meal.meal_time || 'Sem horário'}
                    </Text>
                    <Text
                      style={[
                        styles.mealName,
                        isCompleted && styles.textCompleted,
                      ]}
                    >
                      {meal.name || getMealTypeName(meal.meal_type)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      isCompleted && styles.checkboxCompleted,
                    ]}
                  >
                    {isCompleted && (
                      <Ionicons name="checkmark" size={16} color="#0A0E1A" />
                    )}
                  </View>
                </View>
                <Text
                  style={[
                    styles.mealCalories,
                    isCompleted && styles.textCompleted,
                  ]}
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
  color,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
}) {
  const progress = Math.min((current / target) * 100, 100);

  return (
    <View style={styles.macroBarContainer}>
      <View style={styles.macroHeader}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>
          {current.toFixed(0)} / {target.toFixed(0)}g
        </Text>
      </View>
      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${progress}%`, backgroundColor: color },
          ]}
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

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#141B2D',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E2A42',
  },
  emptyText: {
    color: '#8B92A8',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8B92A8',
    textTransform: 'capitalize',
  },
  caloriesBadge: {
    backgroundColor: '#141B2D',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E2A42',
    alignItems: 'flex-end',
  },
  caloriesValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B35',
  },
  caloriesLabel: {
    fontSize: 12,
    color: '#8B92A8',
  },
  macrosContainer: {
    backgroundColor: '#141B2D',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E2A42',
    marginBottom: 24,
    gap: 16,
  },
  macroBarContainer: {
    gap: 8,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  macroValue: {
    fontSize: 12,
    color: '#8B92A8',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#0A0E1A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  mealsContainer: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  noMealsText: {
    color: '#8B92A8',
    fontStyle: 'italic',
  },
  mealCard: {
    backgroundColor: '#141B2D',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E2A42',
  },
  mealCardCompleted: {
    opacity: 0.6,
    borderColor: '#00FF88',
    backgroundColor: 'rgba(0, 255, 136, 0.05)',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mealInfo: {
    flex: 1,
  },
  mealTime: {
    fontSize: 12,
    color: '#8B92A8',
    marginBottom: 2,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mealCalories: {
    fontSize: 13,
    color: '#8B92A8',
  },
  textCompleted: {
    textDecorationLine: 'line-through',
    color: '#8B92A8',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#5A6178',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#00FF88',
    borderColor: '#00FF88',
  },
});