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
  isChecked?: boolean;
  onToggleCheck?: () => void;
}

export function MealCard({
  meal,
  items,
  onAddFood,
  onRemoveFood,
  onUpdateMealTime,
  onUpdateFood,
  isEditable = false,
  isChecked = false,
  onToggleCheck,
  onCook,
}: MealCardProps & { onCook?: () => void }) {
  const totalCals = items.reduce((acc, item) => {
    const ratio = item.quantity / (item.food?.serving_size || 100);
    return acc + (item.food?.calories || 0) * ratio;
  }, 0);

  return (
    <View className={`bg-zinc-900 rounded-2xl p-4 border mb-4 ${isChecked ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-800'}`}>
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center flex-1">
          {onToggleCheck && (
            <TouchableOpacity 
              onPress={onToggleCheck}
              className={`mr-3 w-6 h-6 rounded-full border-2 items-center justify-center ${
                isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'
              }`}
            >
              {isChecked && <Ionicons name="checkmark" size={14} color="#000" />}
            </TouchableOpacity>
          )}
          <View className="bg-zinc-800 px-2 py-1 rounded-md mr-3">
            <Text className="text-zinc-400 text-xs font-bold">
              {meal.meal_time || '00:00'}
            </Text>
          </View>
          <Text className={`font-bold text-base mr-2 ${isChecked ? 'text-zinc-400 line-through' : 'text-white'}`}>
            {meal.name}
          </Text>
          {isEditable && (
             <TouchableOpacity onPress={() => {/* Handle edit meal name/time if needed */}}>
                 <Ionicons name="pencil" size={12} color="#52525B" />
             </TouchableOpacity>
          )}
        </View>
        <View className="flex-row items-center gap-2">
          <Text className={`${isChecked ? 'text-zinc-500' : 'text-orange-500'} font-bold text-sm`}>
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
        <View>
            <View className="gap-2 pl-2 border-l-2 border-zinc-800 ml-2 mb-3">
            {items.map((item, idx) => (
                <TouchableOpacity
                key={idx}
                className="flex-row justify-between items-center py-1"
                onPress={() => {}}
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

            {onCook && !isChecked && (
                <TouchableOpacity 
                    onPress={onCook}
                    className="flex-row items-center justify-center bg-orange-500/10 py-2 rounded-xl border border-orange-500/20"
                >
                     <Ionicons name="flame-outline" size={16} color="#FF6B35" style={{ marginRight: 6 }} />
                     <Text className="text-[#FF6B35] text-xs font-bold">Cozinhar Agora</Text>
                </TouchableOpacity>
            )}
        </View>
      ) : (
        <Text className="text-zinc-600 text-xs italic ml-11">Sem alimentos</Text>
      )}
    </View>
  );
}
