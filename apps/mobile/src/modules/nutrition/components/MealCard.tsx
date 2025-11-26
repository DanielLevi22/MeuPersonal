import { Ionicons } from '@expo/vector-icons';
import { DietMeal, DietMealItem } from '@meupersonal/core';
import { useState } from 'react';
import {
  Alert,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { calculateFoodMacros } from '../utils/nutrition';
import { EditFoodModal } from './EditFoodModal';
import { TimePickerModal } from './TimePickerModal';

interface MealCardProps {
  meal: DietMeal;
  items: DietMealItem[];
  onAddFood: () => void;
  onRemoveFood: (itemId: string) => void;
  onUpdateMealTime: (mealId: string, mealTime: string) => void;
  onUpdateFood: (itemId: string, quantity: number) => void;
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

export function MealCard({ meal, items, onAddFood, onRemoveFood, onUpdateMealTime, onUpdateFood, isEditable = true }: MealCardProps) {
  const [isExpanded, setIsExpanded] = useState(!meal.meal_time);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingItem, setEditingItem] = useState<DietMealItem | null>(null);

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

  const handleUpdateFoodQuantity = (itemId: string, quantity: number) => {
    onUpdateFood(itemId, quantity);
  };

  const mealLabel = meal.name || MEAL_TYPE_LABELS[meal.meal_type] || meal.meal_type;

  return (
    <View className="bg-card rounded-xl mb-3 border-2 border-border overflow-hidden">
      {/* Header */}
      <TouchableOpacity
        className="flex-row justify-between items-center p-4"
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center flex-1">
          <Ionicons
            name={isExpanded ? 'chevron-down' : 'chevron-forward'}
            size={20}
            color="#FAFAFA" 
          />
          <View className="ml-2 flex-1">
            <Text className="text-base font-bold text-foreground">{mealLabel}</Text>
            {meal.meal_time ? (
              <Text className="text-xs text-muted-foreground mt-0.5">
                <Ionicons name="time-outline" size={12} color="#A1A1AA" /> {meal.meal_time}
              </Text>
            ) : (
              <Text className="text-xs text-orange-500 mt-0.5">
                <Ionicons name="alert-circle-outline" size={12} color="#F97316" /> Definir Horário
              </Text>
            )}
          </View>
        </View>
        <View className="items-end">
          <Text className="text-base font-bold text-primary">{totalMacros.calories.toFixed(0)} kcal</Text>
          <Text className="text-xs text-muted-foreground mt-0.5">{items.length} {items.length === 1 ? 'item' : 'itens'}</Text>
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View className="px-4 pb-4">
          {/* Time Selector */}
          {isEditable && (
            <TouchableOpacity
              className="flex-row items-center bg-muted/30 rounded-xl p-3.5 mb-3 border-2 border-border gap-2.5"
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="time" size={20} color="#CCFF00" />
              <Text className="flex-1 text-sm font-semibold text-foreground">
                {meal.meal_time ? `Horário: ${meal.meal_time}` : 'Definir Horário'}
              </Text>
              {!meal.meal_time && (
                <Text className="text-[10px] font-bold text-orange-500 bg-orange-500/15 px-2 py-1 rounded-md">
                  OBRIGATÓRIO
                </Text>
              )}
              <Ionicons name="chevron-forward" size={20} color="#71717A" />
            </TouchableOpacity>
          )}

          {/* Macros Summary */}
          <View className="flex-row justify-around bg-muted/30 rounded-lg p-3 mb-3">
            <View className="items-center">
              <Text className="text-[11px] text-muted-foreground mb-1">Proteína</Text>
              <Text className="text-sm font-bold text-[#00ff9d]">
                {totalMacros.protein.toFixed(1)}g
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-[11px] text-muted-foreground mb-1">Carbs</Text>
              <Text className="text-sm font-bold text-[#7f5aff]">
                {totalMacros.carbs.toFixed(1)}g
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-[11px] text-muted-foreground mb-1">Gordura</Text>
              <Text className="text-sm font-bold text-[#ffde59]">
                {totalMacros.fat.toFixed(1)}g
              </Text>
            </View>
          </View>

          {/* Food Items */}
          {items.map((item, index) => (
            <View key={item.id} className="flex-row justify-between items-center py-2 border-b border-border">
              <TouchableOpacity 
                className="flex-1"
                onPress={() => isEditable && setEditingItem(item)}
                activeOpacity={0.7}
              >
                <Text className="text-sm text-foreground mb-0.5">
                  {item.food?.name || 'Alimento desconhecido'}
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-xs text-muted-foreground">
                    {item.quantity}{item.unit}
                  </Text>
                  {isEditable && (
                    <Ionicons name="pencil" size={12} color="#A1A1AA" style={{ marginLeft: 4 }} />
                  )}
                </View>
              </TouchableOpacity>
              {isEditable && (
                <TouchableOpacity
                  onPress={() => onRemoveFood(item.id)}
                  className="p-1"
                >
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Add Food Button */}
          {isEditable && (
            <TouchableOpacity
              className="flex-row items-center justify-center py-3 mt-2"
              onPress={handleAddFood}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={20} color="#CCFF00" />
              <Text className="text-sm font-semibold text-primary ml-2">Adicionar Alimento</Text>
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

      {/* Edit Food Modal */}
      <EditFoodModal
        visible={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleUpdateFoodQuantity}
      />
    </View>
  );
}