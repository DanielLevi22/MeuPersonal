import { Input } from '@/components/ui/Input';
import { useNutritionStore } from '@/modules/nutrition/store/nutritionStore';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FoodSearchScreenProps {
  onSelect: (food: any, quantity?: number) => void;
  onClose: () => void;
}

type MacroType = 'protein' | 'carbs' | 'fat' | 'calories';

interface MacroTargets {
  protein?: string;
  carbs?: string;
  fat?: string;
  calories?: string;
}

export default function FoodSearchScreen({ onSelect, onClose }: FoodSearchScreenProps) {
  const insets = useSafeAreaInsets();
  const { searchFoods, foods } = useNutritionStore();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Reverse Calculator State
  const [targets, setTargets] = useState<MacroTargets>({});
  const [activeMacros, setActiveMacros] = useState<MacroType[]>([]);
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        setIsLoading(true);
        searchFoods(query).finally(() => setIsLoading(false));
      } else if (query.length === 0) {
        // Load initial foods if needed, or just clear
        setIsLoading(true);
        searchFoods('').finally(() => setIsLoading(false));
      }
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
    <View className="flex-1 bg-zinc-950">
      <View style={{ paddingTop: insets.top }} className="bg-zinc-900 pb-4 rounded-b-[32px] border-b border-zinc-800 z-10">
        <View className="px-6 flex-row items-center justify-between mb-4 mt-2">
          <Text className="text-2xl font-extrabold text-white font-display">
            Buscar Alimento
          </Text>
          <TouchableOpacity onPress={onClose} className="bg-zinc-800 p-2 rounded-full">
            <Ionicons name="close" size={24} color="#A1A1AA" />
          </TouchableOpacity>
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
            className="flex-row items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800"
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="calculator-outline" size={20} color="#00D9FF" />
              <Text className="text-zinc-300 font-bold text-sm">Calculadora Reversa</Text>
            </View>
            <Ionicons name={showCalculator ? "chevron-up" : "chevron-down"} size={20} color="#71717A" />
          </TouchableOpacity>

          {showCalculator && (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {(['protein', 'carbs', 'fat', 'calories'] as const).map((macro) => (
                <View key={macro} className={`flex-row items-center rounded-lg border overflow-hidden ${
                  activeMacros.includes(macro) ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-zinc-950 border-zinc-800'
                }`}>
                  <TouchableOpacity
                    className="py-2 px-3 border-r border-zinc-800"
                    onPress={() => toggleMacro(macro)}
                  >
                    <Text className={`text-xs font-bold ${
                      activeMacros.includes(macro) ? 'text-cyan-400' : 'text-zinc-500'
                    }`}>
                      {macro === 'protein' ? 'PROT' : macro === 'carbs' ? 'CARB' : macro === 'fat' ? 'GORD' : 'KCAL'}
                    </Text>
                  </TouchableOpacity>
                  
                  {activeMacros.includes(macro) && (
                    <View className="w-16 px-1">
                       <Input
                        className="h-8 text-center text-sm p-0 border-0 bg-transparent"
                        placeholder="0"
                        keyboardType="numeric"
                        value={targets[macro] || ''}
                        onChangeText={(val) => updateTarget(macro, val)}
                        style={{ fontSize: 14 }}
                      />
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#00D9FF" />
          <Text className="text-zinc-500 mt-4 font-bold">Buscando alimentos...</Text>
        </View>
      ) : (
        <FlatList
          data={sortedFoods}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          renderItem={({ item }) => {
            const match = calculateMatch(item);
            return (
              <TouchableOpacity 
                className="bg-zinc-900 p-4 rounded-2xl mb-3 border border-zinc-800 flex-row justify-between items-center"
                onPress={() => handleSelectFood(item)}
              >
                <View className="flex-1 mr-4">
                  <Text className="text-white font-bold text-base mb-1">{item.name}</Text>
                  
                  {match?.isMatch ? (
                    <View>
                      <Text className="text-cyan-400 font-bold text-lg">
                        {Math.round(match.quantity)}{item.serving_unit}
                      </Text>
                      <Text className="text-zinc-500 text-xs">
                        Sugerido para bater metas
                      </Text>
                      {match.score > 80 && (
                        <View className="bg-cyan-500/20 self-start px-2 py-0.5 rounded-md mt-1">
                          <Text className="text-cyan-400 text-[10px] font-bold">COMBINAÇÃO PERFEITA</Text>
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
                
                <Ionicons name="add-circle" size={28} color="#00D9FF" />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={() => (
            <View className="items-center justify-center mt-20">
              <Ionicons name="search-outline" size={48} color="#3F3F46" />
              <Text className="text-zinc-500 mt-4 font-bold">
                {query ? 'Nenhum alimento encontrado' : 'Digite para buscar'}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
