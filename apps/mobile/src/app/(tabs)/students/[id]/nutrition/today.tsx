import { useAuthStore } from '@/auth';
import { useNutritionStore } from '@/modules/nutrition/store/nutritionStore';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function TodayScreen() {
  const { id: studentId } = useLocalSearchParams();
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
  } = useNutritionStore();

  const [loading, setLoading] = useState(true);
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const dayOfWeek = today.getDay();

  useEffect(() => {
    loadData();
  }, [studentId, user]);

  const loadData = async () => {
    if (!studentId || typeof studentId !== 'string') return;
    if (!user?.id) return;

    console.log('🔍 [TODAY] Loading data for student:', studentId);
    setLoading(true);
    try {
      await fetchDietPlan(studentId);
      console.log('✅ [TODAY] Diet plan fetched');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentDietPlan) {
      console.log('📋 [TODAY] Current diet plan:', currentDietPlan);
      fetchMeals(currentDietPlan.id);
      fetchDailyLogs(currentDietPlan.student_id, todayString);
    }
  }, [currentDietPlan]);

  useEffect(() => {
    console.log('🍽️ [TODAY] Meals loaded:', meals.length);
    // Fetch items for all meals
    meals.forEach((meal) => {
      if (!mealItems[meal.id]) {
        fetchMealItems(meal.id);
      }
    });
  }, [meals]);

  const handleToggleMeal = async (mealId: string, currentStatus: boolean) => {
    if (!currentDietPlan) return;
    await toggleMealCompletion(mealId, todayString, !currentStatus);
  };

  // Filter meals for today
  const todayMeals = meals
    .filter((meal) => {
      // For unique plans, show all meals (day_of_week should be -1)
      if (currentDietPlan?.plan_type === 'unique') {
        return true;
      }
      // For cyclic plans, show only today's meals
      return meal.day_of_week === dayOfWeek;
    })
    .sort((a, b) => a.meal_order - b.meal_order);

  console.log('📅 [TODAY] Day of week:', dayOfWeek, 'Plan type:', currentDietPlan?.plan_type);
  console.log('🎯 [TODAY] Filtered meals for today:', todayMeals.length);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00FF88" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (!currentDietPlan) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={80} color="#5A6178" />
            <Text style={styles.emptyTitle}>Nenhum plano ativo</Text>
            <Text style={styles.emptyText}>
              Você não possui um plano de dieta ativo no momento.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Hoje</Text>
            <Text style={styles.headerSubtitle}>{DAYS_OF_WEEK[dayOfWeek]}</Text>
          </View>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={20} color="#00D9FF" />
            <Text style={styles.dateText}>{today.toLocaleDateString('pt-BR')}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {todayMeals.length === 0 ? (
            <View style={styles.emptyMealsContainer}>
              <Ionicons name="fast-food-outline" size={60} color="#5A6178" />
              <Text style={styles.emptyMealsText}>
                Nenhuma refeição programada para hoje
              </Text>
            </View>
          ) : (
            todayMeals.map((meal) => {
              const items = mealItems[meal.id] || [];
              const isCompleted = dailyLogs[meal.id]?.completed || false;

              return (
                <View key={meal.id} style={styles.mealCard}>
                  <View style={styles.mealHeader}>
                    <View style={styles.mealInfo}>
                      <Text style={styles.mealName}>{meal.name || meal.meal_type}</Text>
                      {meal.meal_time && (
                        <View style={styles.timeContainer}>
                          <Ionicons name="time-outline" size={14} color="#8B92A8" />
                          <Text style={styles.mealTime}>{meal.meal_time}</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleToggleMeal(meal.id, isCompleted)}
                      style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}
                    >
                      {isCompleted && (
                        <Ionicons name="checkmark" size={20} color="#0A0E1A" />
                      )}
                    </TouchableOpacity>
                  </View>

                  {items.length > 0 && (
                    <View style={styles.foodList}>
                      {items.map((item) => (
                        <View key={item.id} style={styles.foodItem}>
                          <Text style={styles.foodName}>{item.food?.name}</Text>
                          <Text style={styles.foodQuantity}>
                            {item.quantity}
                            {item.unit}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E1A',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0E1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8B92A8',
    marginTop: 16,
    fontSize: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#8B92A8',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8B92A8',
    marginTop: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141B2D',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  emptyMealsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyMealsText: {
    fontSize: 15,
    color: '#8B92A8',
    marginTop: 16,
    textAlign: 'center',
  },
  mealCard: {
    backgroundColor: '#141B2D',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#1E2A42',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mealTime: {
    fontSize: 13,
    color: '#8B92A8',
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#5A6178',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#00FF88',
    borderColor: '#00FF88',
  },
  foodList: {
    borderTopWidth: 1,
    borderTopColor: '#1E2A42',
    paddingTop: 12,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  foodName: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  foodQuantity: {
    fontSize: 13,
    color: '#8B92A8',
    fontWeight: '600',
  },
});
