import { DayOptionsModal } from '@/modules/nutrition/components/DayOptionsModal';
import { FoodSearchModal } from '@/modules/nutrition/components/FoodSearchModal';
import { MealCard } from '@/modules/nutrition/components/MealCard';
import { Food, useNutritionStore } from '@/modules/nutrition/store/nutritionStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

const MEAL_TYPES = [
  { type: 'breakfast', label: 'Café da Manhã', order: 1 },
  { type: 'morning_snack', label: 'Lanche da Manhã', order: 2 },
  { type: 'lunch', label: 'Almoço', order: 3 },
  { type: 'afternoon_snack', label: 'Lanche da Tarde', order: 4 },
  { type: 'dinner', label: 'Janta', order: 5 },
  { type: 'evening_snack', label: 'Ceia', order: 6 },
];

export default function FullDietScreen() {
  const { id: studentId } = useLocalSearchParams();
  const router = useRouter();

  const {
    currentDietPlan,
    meals,
    mealItems,
    fetchDietPlan,
    fetchMeals,
    fetchMealItems,
    addMeal,
    updateMeal,
    addFoodToMeal,
    updateMealItem,
    removeFoodFromMeal,
    copyDay,
    pasteDay,
    clearDay,
    copiedDay,
    isLoading,
  } = useNutritionStore();

  const [selectedDay, setSelectedDay] = useState(1); // Segunda-feira por padrão
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [showDayOptions, setShowDayOptions] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);

  // Set default day based on plan type
  useEffect(() => {
    if (currentDietPlan?.plan_type === 'unique') {
      setSelectedDay(-1); // -1 represents "All Days" / "Unique"
    } else {
      setSelectedDay(1);
    }
  }, [currentDietPlan]);

  useEffect(() => {
    loadDietData();
  }, [studentId]);

  const loadDietData = async () => {
    if (!studentId || typeof studentId !== 'string') return;

    await fetchDietPlan(studentId);
  };

  useEffect(() => {
    if (currentDietPlan) {
      fetchMeals(currentDietPlan.id);
    }
  }, [currentDietPlan]);

  useEffect(() => {
    // Load meal items for all meals
    meals.forEach((meal) => {
      if (!mealItems[meal.id]) {
        fetchMealItems(meal.id);
      }
    });
  }, [meals]);

  const handleAddMeal = async (mealType: string, order: number) => {
    if (!currentDietPlan) {
      Alert.alert('Erro', 'Nenhum plano de dieta ativo encontrado.');
      return;
    }

    try {
      await addMeal({
        diet_plan_id: currentDietPlan.id,
        day_of_week: selectedDay,
        meal_type: mealType,
        meal_order: order,
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar a refeição.');
    }
  };

  const handleUpdateMealTime = async (mealId: string, mealTime: string) => {
    try {
      await updateMeal(mealId, { meal_time: mealTime });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o horário.');
    }
  };

  const handleAddFoodToMeal = (mealId: string) => {
    setSelectedMealId(mealId);
    setShowFoodSearch(true);
  };

  const handleSelectFood = async (food: Food, quantity?: number) => {
    if (!selectedMealId) return;

    try {
      // Use calculated quantity or default to 100g
      const finalQuantity = quantity || 100;
      await addFoodToMeal(selectedMealId, food.id, finalQuantity, 'g');
      setSelectedMealId(null);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar o alimento.');
    }
  };

  const handleUpdateFood = async (itemId: string, quantity: number) => {
    try {
      await updateMealItem(itemId, { quantity });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o alimento.');
    }
  };

  const handleRemoveFood = async (itemId: string) => {
    Alert.alert(
      'Remover Alimento',
      'Tem certeza que deseja remover este alimento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFoodFromMeal(itemId);
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível remover o alimento.');
            }
          },
        },
      ]
    );
  };

  // Day Operations
  const handleCopyDay = async () => {
    await copyDay(selectedDay);
    setShowDayOptions(false);
    Alert.alert('Sucesso', 'Dia copiado! Agora você pode colar em outro dia.');
  };

  const handlePasteDay = () => {
    Alert.alert(
      'Colar Dia',
      'Isso substituirá todas as refeições deste dia. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Colar',
          style: 'destructive',
          onPress: async () => {
            try {
              await pasteDay(selectedDay);
              setShowDayOptions(false);
              Alert.alert('Sucesso', 'Refeições coladas com sucesso!');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível colar as refeições.');
            }
          },
        },
      ]
    );
  };

  const handleClearDay = () => {
    Alert.alert(
      'Limpar Dia',
      'Tem certeza que deseja remover todas as refeições deste dia?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearDay(selectedDay);
              setShowDayOptions(false);
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível limpar o dia.');
            }
          },
        },
      ]
    );
  };

  // Filter meals for selected day
  const dayMeals = meals.filter((meal) => meal.day_of_week === selectedDay);

  // Calculate total macros for the day
  const dayTotalMacros = dayMeals.reduce(
    (total, meal) => {
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Carregando dieta...</Text>
      </View>
    );
  }

  if (!currentDietPlan) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="restaurant-outline" size={80} color="#5A6178" />
        <Text style={styles.emptyTitle}>Nenhum plano de dieta ativo</Text>
        <Text style={styles.emptyText}>
          Crie um plano de dieta para este aluno
        </Text>
        <TouchableOpacity style={styles.createButton}>
          <LinearGradient
            colors={['#00FF88', '#00CC6E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.createButtonGradient}
          >
            <Text style={styles.createButtonText}>Criar Plano de Dieta</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Dieta Completa</Text>
            <Text style={styles.headerSubtitle}>{currentDietPlan.name}</Text>
          </View>
          <TouchableOpacity
            style={styles.optionsButton}
            onPress={() => setShowDayOptions(true)}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Day Selector (Only for Cyclic Plans) */}
        {currentDietPlan.plan_type !== 'unique' ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.daySelector}
            contentContainerStyle={styles.daySelectorContent}
          >
            {DAYS_OF_WEEK.map((day) => (
              <TouchableOpacity
                key={day.value}
                style={[
                  styles.dayButton,
                  selectedDay === day.value && styles.dayButtonActive,
                ]}
                onPress={() => setSelectedDay(day.value)}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    selectedDay === day.value && styles.dayButtonTextActive,
                  ]}
                >
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.uniquePlanHeader}>
            <Ionicons name="repeat" size={20} color="#00FF88" />
            <Text style={styles.uniquePlanText}>Dieta Padrão (Todos os dias)</Text>
          </View>
        )}

        {/* Day Totals */}
        <View style={styles.dayTotals}>
          <Text style={styles.dayTotalsTitle}>Totais do Dia</Text>
          <View style={styles.macrosRow}>
            <View style={styles.macroBox}>
              <Text style={styles.macroValue}>{dayTotalMacros.calories.toFixed(0)}</Text>
              <Text style={styles.macroLabel}>kcal</Text>
            </View>
            <View style={styles.macroBox}>
              <Text style={[styles.macroValue, { color: '#00ff9d' }]}>
                {dayTotalMacros.protein.toFixed(0)}g
              </Text>
              <Text style={styles.macroLabel}>Proteína</Text>
            </View>
            <View style={styles.macroBox}>
              <Text style={[styles.macroValue, { color: '#7f5aff' }]}>
                {dayTotalMacros.carbs.toFixed(0)}g
              </Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroBox}>
              <Text style={[styles.macroValue, { color: '#ffde59' }]}>
                {dayTotalMacros.fat.toFixed(0)}g
              </Text>
              <Text style={styles.macroLabel}>Gordura</Text>
            </View>
          </View>
        </View>

        {/* Meals List */}
        <ScrollView
          style={styles.mealsList}
          contentContainerStyle={styles.mealsListContent}
          showsVerticalScrollIndicator={false}
        >
          {MEAL_TYPES.map((mealType) => {
            const meal = dayMeals.find((m) => m.meal_type === mealType.type);

            if (meal) {
              return (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  items={mealItems[meal.id] || []}
                  onAddFood={() => handleAddFoodToMeal(meal.id)}
                  onRemoveFood={handleRemoveFood}
                  onUpdateMealTime={handleUpdateMealTime}
                  onUpdateFood={handleUpdateFood}
                  isEditable={true}
                />
              );
            }

            // Show "Add Meal" button if meal doesn't exist
            return (
              <TouchableOpacity
                key={mealType.type}
                style={styles.addMealButton}
                onPress={() => handleAddMeal(mealType.type, mealType.order)}
              >
                <Ionicons name="add-circle-outline" size={24} color="#00FF88" />
                <Text style={styles.addMealText}>
                  Adicionar {mealType.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Food Search Modal */}
        <FoodSearchModal
          visible={showFoodSearch}
          onClose={() => {
            setShowFoodSearch(false);
            setSelectedMealId(null);
          }}
          onSelectFood={handleSelectFood}
        />

        {/* Day Options Modal */}
        <DayOptionsModal
          visible={showDayOptions}
          onClose={() => setShowDayOptions(false)}
          onCopy={handleCopyDay}
          onPaste={handlePasteDay}
          onClear={handleClearDay}
          canPaste={!!copiedDay}
          dayName={DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label || ''}
        />
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
    backgroundColor: '#0A0E1A',
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
    marginBottom: 32,
  },
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  createButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  createButtonText: {
    color: '#0A0E1A',
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    backgroundColor: '#141B2D',
    padding: 10,
    borderRadius: 12,
    marginRight: 16,
  },
  optionsButton: {
    backgroundColor: '#141B2D',
    padding: 10,
    borderRadius: 12,
    marginLeft: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8B92A8',
    marginTop: 4,
  },
  daySelector: {
    maxHeight: 60,
  },
  daySelectorContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  dayButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#141B2D',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1E2A42',
  },
  dayButtonActive: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderColor: '#00FF88',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B92A8',
  },
  dayButtonTextActive: {
    color: '#00FF88',
  },
  dayTotals: {
    backgroundColor: '#141B2D',
    marginHorizontal: 24,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#1E2A42',
  },
  dayTotalsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroBox: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 11,
    color: '#8B92A8',
  },
  mealsList: {
    flex: 1,
    marginTop: 16,
  },
  mealsListContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141B2D',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1E2A42',
    borderStyle: 'dashed',
    paddingVertical: 16,
    marginBottom: 12,
  },
  addMealText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00FF88',
    marginLeft: 8,
  },
  uniquePlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    marginHorizontal: 24,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00FF88',
    gap: 8,
  },
  uniquePlanText: {
    color: '#00FF88',
    fontSize: 14,
    fontWeight: '700',
  },
});


