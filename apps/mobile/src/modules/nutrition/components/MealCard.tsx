import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

interface MealCardProps {
  meal: any;
  items: any[];
  onAddFood: () => void;
  onRemoveFood: (itemId: string) => void;
  onUpdateMealTime: (mealId: string, time: string) => void;
  onUpdateFood: (itemId: string, quantity: number) => void;
  isEditable?: boolean;
}

export function MealCard({
  meal,
  items,
  onAddFood,
  onRemoveFood,
  onUpdateMealTime,
  onUpdateFood,
  isEditable = false,
}: MealCardProps) {
  const totalCals = items.reduce((acc, item) => {
    const ratio = item.quantity / (item.food?.serving_size || 100);
    return acc + (item.food?.calories || 0) * ratio;
  }, 0);

  return (
    <View className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 mb-4">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center flex-1">
          <View className="bg-zinc-800 px-2 py-1 rounded-md mr-3">
            <Text className="text-zinc-400 text-xs font-bold">
              {meal.meal_time || '00:00'}
            </Text>
          </View>
          <Text className="text-white font-bold text-base mr-2">{meal.name}</Text>
          {isEditable && (
             <TouchableOpacity onPress={() => {/* Handle edit meal name/time if needed */}}>
                 <Ionicons name="pencil" size={12} color="#52525B" />
             </TouchableOpacity>
          )}
        </View>
        <View className="flex-row items-center gap-2">
          <Text className="text-orange-500 font-bold text-sm">
            {Math.round(totalCals)} kcal
          </Text>
          {isEditable && (
            <TouchableOpacity
              onPress={onAddFood}
              className="bg-zinc-800 p-1.5 rounded-lg"
            >
              <Ionicons name="add" size={16} color="#00D9FF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {items.length > 0 ? (
        <View className="gap-2 pl-2 border-l-2 border-zinc-800 ml-2">
          {items.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              className="flex-row justify-between items-center py-1"
              onPress={() => {
                  // If we want to support editing quantity, we might need to expose that via props or a modal
                  // For now, let's assume tapping might trigger an edit action if we had the UI for it
                  // The original DietDetailsScreen passed handleEditItemPress
                  // dieta-completa.tsx passes onUpdateFood but doesn't seem to have a UI to trigger it easily from here without a modal
                  // For now, I'll just leave it as a touchable
              }}
              onLongPress={() => isEditable && onRemoveFood(item.id)}
            >
              <Text className="text-zinc-400 text-sm flex-1 mr-2">
                {item.food?.name}
              </Text>
              <Text className="text-zinc-500 text-sm">
                {item.quantity}
                {item.unit || 'g'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text className="text-zinc-600 text-xs italic ml-11">Sem alimentos</Text>
      )}
    </View>
  );
}
