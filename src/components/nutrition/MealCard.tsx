import { DietMeal, DietMealItem } from '@/store/nutritionStore';
import { calculateFoodMacros } from '@/utils/nutrition';
  onRemoveFood: (itemId: string) => void;
  onUpdateMealTime: (mealId: string, mealTime: string) => void;
  isEditable?: boolean;
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Café da Manhã',
  morning_snack: 'Lanche da Manhã',
  lunch: 'Almoço',
  afternoon_snack: 'Lanche da Tarde',
  dinner: 'Janta',
  evening_snack: 'Ceia',
};

export function MealCard({ meal, items, onAddFood, onRemoveFood, onUpdateMealTime, isEditable = true }: MealCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Calculate total macros for this meal
  const totalMacros = items.reduce(
    (total, item) => {
      if (!item.food) return total;
      
      const macros = calculateFoodMacros(
        item.food,
        item.quantity,
        item.unit
      );
      
      return {
        calories: total.calories + macros.calories,
        protein: total.protein + macros.protein,
        carbs: total.carbs + macros.carbs,
        fat: total.fat + macros.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleAddFood = () => {
    if (!meal.meal_time) {
      Alert.alert(
        'Horário Necessário',
        'Por favor, defina o horário da refeição antes de adicionar alimentos.',
        [{ text: 'OK' }]
      );
      return;
    }
    onAddFood();
  };

  const handleSelectTime = (time: string) => {
    onUpdateMealTime(meal.id, time);
  };

  const mealLabel = meal.name || MEAL_TYPE_LABELS[meal.meal_type] || meal.meal_type;

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Ionicons
            name={isExpanded ? 'chevron-down' : 'chevron-forward'}
            size={20}
            color="#FFFFFF"
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.mealName}>{mealLabel}</Text>
            {meal.meal_time && (
              <Text style={styles.mealTime}>
                <Ionicons name="time-outline" size={12} color="#8B92A8" /> {meal.meal_time}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.calories}>{totalMacros.calories.toFixed(0)} kcal</Text>
          <Text style={styles.itemCount}>{items.length} {items.length === 1 ? 'item' : 'itens'}</Text>
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.content}>
          {/* Time Selector */}
          {isEditable && (
            <TouchableOpacity
              style={styles.timeSelector}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="time" size={20} color="#00FF88" />
              <Text style={styles.timeSelectorLabel}>
                {meal.meal_time ? `Horário: ${meal.meal_time}` : 'Definir Horário'}
              </Text>
              {!meal.meal_time && <Text style={styles.requiredBadge}>OBRIGATÓRIO</Text>}
              <Ionicons name="chevron-forward" size={20} color="#5A6178" />
            </TouchableOpacity>
          )}

          {/* Macros Summary */}
          <View style={styles.macrosSummary}>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Proteína</Text>
              <Text style={[styles.macroValue, { color: '#00ff9d' }]}>
                {totalMacros.protein.toFixed(1)}g
              </Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={[styles.macroValue, { color: '#7f5aff' }]}>
                {totalMacros.carbs.toFixed(1)}g
              </Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Gordura</Text>
              <Text style={[styles.macroValue, { color: '#ffde59' }]}>
                {totalMacros.fat.toFixed(1)}g
              </Text>
            </View>
          </View>

          {/* Food Items */}
          {items.map((item, index) => (
            <View key={item.id} style={styles.foodItem}>
              <View style={styles.foodInfo}>
                <Text style={styles.foodName}>
                  {item.food?.name || 'Alimento desconhecido'}
                </Text>
                <Text style={styles.foodQuantity}>
                  {item.quantity}{item.unit}
                </Text>
              </View>
              {isEditable && (
                <TouchableOpacity
                  onPress={() => onRemoveFood(item.id)}
                  style={styles.removeButton}
                >
                  <Ionicons name="close-circle" size={20} color="#ff6b6b" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Add Food Button */}
          {isEditable && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddFood}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={20} color="#00FF88" />
              <Text style={styles.addButtonText}>Adicionar Alimento</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Time Picker Modal */}
      <TimePickerModal
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onSelectTime={handleSelectTime}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#141B2D',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#1E2A42',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mealTime: {
    fontSize: 12,
    color: '#8B92A8',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  calories: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00FF88',
  },
  itemCount: {
    fontSize: 12,
    color: '#8B92A8',
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  macrosSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#0A0E1A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 11,
    color: '#8B92A8',
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2A42',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  foodQuantity: {
    fontSize: 12,
    color: '#8B92A8',
  },
  removeButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00FF88',
    marginLeft: 8,
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0E1A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#1E2A42',
    gap: 10,
  },
  timeSelectorLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  requiredBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
});
