import { Input } from '@/components/ui/Input';
import { tailwindColors } from '@/constants/colors';
import { useNutritionStore } from '@/modules/nutrition/store/nutritionStore';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FoodSearchScreenProps {
  mealId?: string;
  initialData?: {
    name: string;
    time: string;
    type: string;
    order: number;
  };
  onSelect: (food: any, quantity?: number) => void;
  onClose: () => void;
  onSave?: (items: any[]) => Promise<void>;
  dailyTotals?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  mealTime?: string;
  onTimeChange?: (time: string) => void;
}

type MacroType = 'protein' | 'carbs' | 'fat' | 'calories';

interface MacroTargets {
  protein?: string;
  carbs?: string;
  fat?: string;
  calories?: string;
}

export default function FoodSearchScreen({ mealId, initialData, onSelect, onClose, onSave, dailyTotals, mealTime, onTimeChange }: FoodSearchScreenProps) {
  const insets = useSafeAreaInsets();
  const { searchFoods, foods, meals, mealItems, fetchMealItems } = useNutritionStore();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Time Picker Logic
  const [showTimePicker, setShowTimePicker] = useState(false);

  const parseTime = (timeStr: string) => {
    if (!timeStr) return new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours || 0);
    date.setMinutes(minutes || 0);
    return date;
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate && onTimeChange) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      onTimeChange(`${hours}:${minutes}`);
    }
  };

  // Local state for items (Draft Mode)
  const [localItems, setLocalItems] = useState<any[]>([]);

  // Initialize items
  useEffect(() => {
    if (mealId) {
      fetchMealItems(mealId);
      // Sync local items with store items when they load
      if (mealItems[mealId]) {
        setLocalItems(mealItems[mealId]);
      }
    }
  }, [mealId, mealId ? mealItems[mealId]?.length : 0]); // Re-sync if store updates

  // Get meal details (from store or initial data)
  const mealName = mealId ? meals.find(m => m.id === mealId)?.name : initialData?.name;
  
  // Calculate Meal Macros from LOCAL items
  const mealMacros = useMemo(() => {
    return localItems.reduce((acc, item) => {
      const ratio = item.quantity / (item.food?.serving_size || 100);
      return {
        calories: acc.calories + (item.food?.calories || 0) * ratio,
        protein: acc.protein + (item.food?.protein || 0) * ratio,
        carbs: acc.carbs + (item.food?.carbs || 0) * ratio,
        fat: acc.fat + (item.food?.fat || 0) * ratio,
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [localItems]);

  const handleLocalSelect = (food: any) => {
    // Add to local state
    const match = calculateMatch(food);
    const quantity = match?.isMatch ? match.quantity : 100; // Default 100g/ml
    
    const newItem = {
      id: Math.random().toString(), // Temp ID
      food: food,
      food_id: food.id,
      quantity: Math.round(quantity),
      unit: food.serving_unit,
      order_index: localItems.length
    };
    
    setLocalItems([...localItems, newItem]);
    // Clear query to show added items
    setQuery('');
  };

  const handleLocalRemove = (itemId: string) => {
    setLocalItems(localItems.filter(i => i.id !== itemId));
  };

  // Default Meal Times
  const DEFAULT_TIMES: Record<string, string> = {
    'Café da Manhã': '08:00',
    'Lanche da Manhã': '10:00',
    'Almoço': '12:00',
    'Lanche da Tarde': '16:00',
    'Jantar': '20:00',
    'Ceia': '22:00',
  };

  // Auto-fill time if empty and name matches
  useEffect(() => {
    if (!mealTime && mealName && onTimeChange) {
      const defaultTime = DEFAULT_TIMES[mealName];
      if (defaultTime) {
        onTimeChange(defaultTime);
      }
    }
  }, [mealName]);

  const handleSavePress = async () => {
    if (!onSave) return;

    // Validate Time
    if (onTimeChange && !mealTime) {
      Alert.alert('Horário Obrigatório', 'Por favor, defina o horário da refeição antes de concluir.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(localItems);
      onClose();
    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert('Erro', 'Falha ao salvar refeição');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Reverse Calculator State
  const [targets, setTargets] = useState<MacroTargets>({});
  const [activeMacros, setActiveMacros] = useState<MacroType[]>([]);
  const [showCalculator, setShowCalculator] = useState(true);

  const loadFoods = async (reset = false) => {
    if (isLoading) return;
    
    const nextPage = reset ? 0 : page + 1;
    setIsLoading(true);
    
    try {
      const results = await searchFoods(query, nextPage, 10);
      if (reset) {
        setPage(0);
        setHasMore(results.length === 10);
      } else {
        setPage(nextPage);
        setHasMore(results.length === 10);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadFoods(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  // --- Reverse Calculator Logic ---

  const toggleMacro = (macro: MacroType) => {
    setActiveMacros(prev => {
      if (prev.includes(macro)) {
        const newMacros = prev.filter(m => m !== macro);
        const newTargets = { ...targets };
        delete newTargets[macro];
        setTargets(newTargets);
        return newMacros;
      } else {
        return [...prev, macro];
      }
    });
  };

  const updateTarget = (macro: MacroType, value: string) => {
    setTargets(prev => ({ ...prev, [macro]: value }));
  };

  const calculateMatch = (food: any) => {
    if (activeMacros.length === 0) return null;

    const quantities: number[] = [];
    let validTargets = 0;

    for (const macro of activeMacros) {
      const targetVal = parseFloat(targets[macro] || '0');
      if (targetVal > 0) {
        const foodVal = food[macro];
        if (foodVal > 0) {
          quantities.push((targetVal / foodVal) * (food.serving_size || 100));
          validTargets++;
        } else {
          quantities.push(Infinity);
          validTargets++;
        }
      }
    }

    if (validTargets === 0) return null;
    if (quantities.some(q => q === Infinity)) return { quantity: 0, score: 0, isMatch: false };

    const avgQuantity = quantities.reduce((a, b) => a + b, 0) / quantities.length;
    const variance = quantities.reduce((acc, q) => acc + Math.pow(q - avgQuantity, 2), 0) / quantities.length;
    const score = 100 / (1 + variance / 1000);

    return { quantity: avgQuantity, score, isMatch: true };
  };

  const sortedFoods = useMemo(() => {
    if (activeMacros.length === 0) return foods;
    return [...foods].sort((a, b) => {
      const matchA = calculateMatch(a);
      const matchB = calculateMatch(b);
      const scoreA = matchA?.isMatch ? matchA.score : -1;
      const scoreB = matchB?.isMatch ? matchB.score : -1;
      return scoreB - scoreA;
    });
  }, [foods, targets, activeMacros]);

  const handleSelectFood = (food: any) => {
    const match = calculateMatch(food);
    onSelect(food, match?.isMatch ? match.quantity : undefined);
  };

  return (
    <View className="flex-1 bg-background-primary">
      <View style={{ paddingTop: insets.top }} className="bg-background-secondary pb-4 rounded-b-[32px] border-b border-zinc-800 z-10">
        <View className="px-6 flex-row items-center justify-between mb-4 mt-2">
          <Text className="text-2xl font-extrabold text-white font-display">
            Buscar Alimento
          </Text>
          <TouchableOpacity onPress={onClose} className="bg-zinc-800 p-2 rounded-full">
            <Ionicons name="close" size={24} color="#A1A1AA" />
          </TouchableOpacity>
        </View>
        
        {/* Draft Mode Header Actions */}
        {(onTimeChange || localItems.length > 0 || mealId) && (
          <View className="px-6 mb-4 flex-row justify-between items-center">
             <View>
               <Text className="text-zinc-400 text-xs font-bold">REFEIÇÃO</Text>
               <Text className="text-white font-bold text-lg">{mealName || 'Nova Refeição'}</Text>
                {onTimeChange && (
                  <View className="mt-2">
                    <TouchableOpacity 
                      onPress={() => setShowTimePicker(true)}
                      className="bg-background-primary rounded-lg border-2 border-zinc-800 px-4 py-2 flex-row items-center justify-center shadow-md"
                      style={{ shadowColor: tailwindColors.primary[400], shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
                    >
                      <Text className="text-primary-400 font-mono text-xl font-bold tracking-[4px]">
                        {mealTime || '00:00'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
               </View>
               <TouchableOpacity 
                 onPress={handleSavePress}
                 disabled={isSaving}
                 className="bg-primary-400 px-4 py-2 rounded-full"
               >
                 {isSaving ? (
                   <ActivityIndicator size="small" color="#000" />
                 ) : (
                   <Text className="text-black font-bold text-sm">Concluir</Text>
                 )}
               </TouchableOpacity>
            </View>
         )}

         {showTimePicker && (
           <DateTimePicker
             value={parseTime(mealTime || '00:00')}
             mode="time"
             is24Hour={true}
             display="default"
             onChange={handleTimeChange}
           />
         )}
 
          {/* Meal Macros Summary */}
          <View className="px-6 mb-4">
            <View className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex-row justify-between items-center">
              <View className="items-center flex-1">
                <Text className="text-zinc-500 text-[10px] font-bold uppercase">Kcal</Text>
                <Text className="text-white font-bold">{Math.round(mealMacros.calories)}</Text>
              </View>
              <View className="w-[1px] h-8 bg-zinc-800" />
              <View className="items-center flex-1">
                <Text className="text-emerald-500 text-[10px] font-bold uppercase">Prot</Text>
                <Text className="text-white font-bold">{Math.round(mealMacros.protein)}g</Text>
              </View>
              <View className="w-[1px] h-8 bg-zinc-800" />
              <View className="items-center flex-1">
                <Text className="text-purple-500 text-[10px] font-bold uppercase">Carb</Text>
                <Text className="text-white font-bold">{Math.round(mealMacros.carbs)}g</Text>
              </View>
              <View className="w-[1px] h-8 bg-zinc-800" />
              <View className="items-center flex-1">
                <Text className="text-amber-500 text-[10px] font-bold uppercase">Gord</Text>
                <Text className="text-white font-bold">{Math.round(mealMacros.fat)}g</Text>
              </View>
            </View>
          </View>
 
         <View className="px-6">
           <Input
             placeholder="Digite o nome do alimento..."
             value={query}
             onChangeText={setQuery}
             autoFocus
             className="mb-4"
           />
           <TouchableOpacity 
             onPress={() => setShowCalculator(!showCalculator)}
             className="flex-row items-center justify-between bg-background-primary p-3 rounded-xl border border-zinc-800"
           >
             <View className="flex-row items-center gap-2">
               <Ionicons name="calculator-outline" size={20} color={tailwindColors.secondary.DEFAULT} />
               <Text className="text-zinc-300 font-bold text-sm">Calculadora Reversa</Text>
             </View>
             <Ionicons name={showCalculator ? "chevron-up" : "chevron-down"} size={20} color="#71717A" />
           </TouchableOpacity>
 
           {showCalculator && (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {(['protein', 'carbs', 'fat', 'calories'] as const).map((macro) => (
                <View key={macro} className={`flex-row items-center rounded-lg border overflow-hidden h-12 w-[48%] ${
                  activeMacros.includes(macro) ? 'bg-primary-400/10 border-primary-400/30' : 'bg-background-primary border-zinc-800'
                }`}>
                  <TouchableOpacity
                    className={`h-full px-3 justify-center items-center flex-1 ${activeMacros.includes(macro) ? 'border-r border-primary-400/30' : ''}`}
                    onPress={() => toggleMacro(macro)}
                  >
                    <Text className={`text-xs font-bold ${
                      activeMacros.includes(macro) ? 'text-primary-400' : 'text-zinc-500'
                    }`}>
                      {macro === 'protein' ? 'PROT' : macro === 'carbs' ? 'CARB' : macro === 'fat' ? 'GORD' : 'KCAL'}
                    </Text>
                  </TouchableOpacity>
                  
                  {activeMacros.includes(macro) && (
                    <View className="w-16 h-full justify-center">
                       <TextInput
                        className="h-full w-full text-center text-sm p-0 text-white font-bold"
                        placeholder="0"
                        placeholderTextColor="rgba(255, 255, 255, 0.3)"
                        keyboardType="numeric"
                        value={targets[macro] || ''}
                        onChangeText={(val) => updateTarget(macro, val)}
                        style={{ fontSize: 14, textAlignVertical: 'center', includeFontPadding: false }}
                      />
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={sortedFoods}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        onEndReached={() => {
          if (hasMore && !isLoading) {
            loadFoods();
          }
        }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={() => (
          <View className="mb-6">
            {/* Added Foods List */}
            {localItems.length > 0 && (
              <View className="mb-6">
                <Text className="text-zinc-400 font-bold text-sm mb-3">ALIMENTOS ADICIONADOS</Text>
                {localItems.map((item, idx) => (
                  <View key={idx} className="flex-row justify-between items-center py-2 border-b border-zinc-800">
                    <View className="flex-1">
                      <Text className="text-white font-bold">{item.food?.name}</Text>
                      <Text className="text-zinc-500 text-xs">{item.quantity}{item.unit}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleLocalRemove(item.id)}>
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <Text className="text-zinc-400 font-bold text-sm mb-2">RESULTADOS DA BUSCA</Text>
          </View>
        )}
        renderItem={({ item }) => {
            const match = calculateMatch(item);
            return (
              <TouchableOpacity 
                className="bg-background-secondary p-4 rounded-2xl mb-3 border border-zinc-800 flex-row justify-between items-center"
                onPress={() => handleLocalSelect(item)}
              >
                <View className="flex-1 mr-4">
                  <Text className="text-white font-bold text-base mb-1">{item.name}</Text>
                  
                  {match?.isMatch ? (
                    <View>
                      <Text className="text-secondary-DEFAULT font-bold text-lg">
                        {Math.round(match.quantity)}{item.serving_unit}
                      </Text>
                      <Text className="text-zinc-500 text-xs">
                        Sugerido para bater metas
                      </Text>
                      {match.score > 80 && (
                        <View className="bg-secondary-DEFAULT/20 self-start px-2 py-0.5 rounded-md mt-1">
                          <Text className="text-secondary-DEFAULT text-xs font-bold">COMBINAÇÃO PERFEITA</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View className="flex-row gap-3">
                      <Text className="text-zinc-400 text-xs font-bold">{item.calories} kcal</Text>
                      <Text className="text-emerald-400 text-xs font-bold">P: {item.protein}g</Text>
                      <Text className="text-purple-400 text-xs font-bold">C: {item.carbs}g</Text>
                      <Text className="text-amber-400 text-xs font-bold">G: {item.fat}g</Text>
                    </View>
                  )}
                </View>
                
                <Ionicons name="add-circle" size={28} color={tailwindColors.primary[400]} />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={() => (
            <View className="items-center justify-center mt-10">
              <Ionicons name="search-outline" size={48} color="#3F3F46" />
              <Text className="text-zinc-500 mt-4 font-bold">
                {query ? 'Nenhum alimento encontrado' : 'Digite para buscar'}
              </Text>
            </View>
          )}
          ListFooterComponent={() => (
            isLoading ? <ActivityIndicator size="small" color={tailwindColors.primary[400]} className="mt-4" /> : null
          )}
      />
    </View>
  );
}
