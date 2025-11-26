
import { Food } from '@/modules/nutrition/routes/index';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@meupersonal/supabase';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface FoodSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectFood: (food: Food, quantity?: number) => void;
}

const ITEMS_PER_PAGE = 10;

type MacroType = 'protein' | 'carbs' | 'fat' | 'calories';

interface MacroTargets {
  protein?: string;
  carbs?: string;
  fat?: string;
  calories?: string;
}

export function FoodSearchModal({ visible, onClose, onSelectFood }: FoodSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  
  // Reverse Calculator State
  const [targets, setTargets] = useState<MacroTargets>({});
  const [activeMacros, setActiveMacros] = useState<MacroType[]>([]);

  // Load initial foods when modal opens
  useEffect(() => {
    if (visible) {
      loadInitialFoods();
    } else {
      // Reset when modal closes
      setSearchQuery('');
      setFoods([]);
      setPage(0);
      setHasMore(true);
      setTargets({});
      setActiveMacros([]);
    }
  }, [visible]);

  const loadInitialFoods = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .order('name', { ascending: true })
        .range(0, ITEMS_PER_PAGE - 1);

      if (error) throw error;
      
      setFoods(data || []);
      setHasMore((data?.length || 0) === ITEMS_PER_PAGE);
      setPage(1);
    } catch (error) {
      console.error('Error loading initial foods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      // Reset to initial foods
      loadInitialFoods();
      return;
    }

    setIsLoading(true);
    setPage(0);
    
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .or(`name.ilike.%${query}%`)
        .order('name', { ascending: true })
        .range(0, ITEMS_PER_PAGE - 1);

      if (error) throw error;
      
      setFoods(data || []);
      setHasMore((data?.length || 0) === ITEMS_PER_PAGE);
      setPage(1);
    } catch (error) {
      console.error('Error searching foods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    
    try {
      const start = page * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('foods')
        .select('*')
        .order('name', { ascending: true });

      // Apply search filter if exists
      if (searchQuery.length >= 2) {
        query = query.or(`name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.range(start, end);

      if (error) throw error;
      
      setFoods(prev => [...prev, ...(data || [])]);
      setHasMore((data?.length || 0) === ITEMS_PER_PAGE);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading more foods:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

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

  // Calculate match quality and required quantity
  const calculateMatch = (food: Food) => {
    if (activeMacros.length === 0) return null;

    const quantities: number[] = [];
    let validTargets = 0;

    for (const macro of activeMacros) {
      const targetVal = parseFloat(targets[macro] || '0');
      if (targetVal > 0) {
        const foodVal = food[macro];
        if (foodVal > 0) {
          // Q = (Target / FoodVal) * ServingSize
          quantities.push((targetVal / foodVal) * food.serving_size);
          validTargets++;
        } else {
          // Food doesn't have this macro but target requires it -> Impossible match (Infinity)
          quantities.push(Infinity);
          validTargets++;
        }
      }
    }

    if (validTargets === 0) return null;

    // If any quantity is Infinity, it's a bad match (missing a required macro)
    if (quantities.some(q => q === Infinity)) {
      return { quantity: 0, score: 0, isMatch: false };
    }

    // Calculate average quantity needed
    const avgQuantity = quantities.reduce((a, b) => a + b, 0) / quantities.length;

    // Calculate variance (how far apart are the required quantities?)
    // Lower variance = Better match (the food naturally has the right ratio)
    const variance = quantities.reduce((acc, q) => acc + Math.pow(q - avgQuantity, 2), 0) / quantities.length;
    
    // Score: Inverse of variance (normalized somewhat). 
    // Perfect match (variance 0) -> Score 100.
    // We use a simple heuristic: Score = 100 / (1 + variance/1000)
    const score = 100 / (1 + variance / 1000);

    return {
      quantity: avgQuantity,
      score,
      isMatch: true
    };
  };

  // Sort foods based on match score if targets are active
  const sortedFoods = useMemo(() => {
    if (activeMacros.length === 0) return foods;

    return [...foods].sort((a, b) => {
      const matchA = calculateMatch(a);
      const matchB = calculateMatch(b);

      const scoreA = matchA?.isMatch ? matchA.score : -1;
      const scoreB = matchB?.isMatch ? matchB.score : -1;

      return scoreB - scoreA; // Descending score
    });
  }, [foods, targets, activeMacros]);

  const handleSelectFood = (food: Food) => {
    const match = calculateMatch(food);
    onSelectFood(food, match?.isMatch ? match.quantity : undefined);
    setSearchQuery('');
    onClose();
  };

  const renderFoodItem = ({ item }: { item: Food }) => {
    const match = calculateMatch(item);
    
    return (
      <TouchableOpacity
        className="bg-card rounded-xl p-4 mb-3 border-2 border-border"
        onPress={() => handleSelectFood(item)}
        activeOpacity={0.7}
      >
        <View className="mb-2">
          <Text className="text-base font-bold text-foreground mb-1">{item.name}</Text>
          <Text className="text-xs text-muted-foreground">{item.category}</Text>
        </View>
        
        {match?.isMatch ? (
          <View className="bg-primary/5 p-3 rounded-lg mt-1">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-lg font-bold text-primary">
                {Math.round(match.quantity)}{item.serving_unit}
              </Text>
              {activeMacros.length > 1 && (
                <View 
                  className={`px-2 py-1 rounded-md ${
                    match.score > 80 ? 'bg-primary/20' : match.score > 40 ? 'bg-yellow-500/20' : 'bg-orange-500/20'
                  }`}
                >
                  <Text 
                    className={`text-[10px] font-bold ${
                      match.score > 80 ? 'text-primary' : match.score > 40 ? 'text-yellow-500' : 'text-orange-500'
                    }`}
                  >
                    {match.score > 80 ? 'Combinação Perfeita' : match.score > 40 ? 'Boa Combinação' : 'Baixa Combinação'}
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-[11px] text-muted-foreground">
              para atingir metas
            </Text>
            <View className="flex-row flex-wrap gap-2 mt-1">
               {activeMacros.map(macro => {
                 const val = (item[macro] * match.quantity) / item.serving_size;
                 const target = parseFloat(targets[macro] || '0');
                 return (
                   <Text key={macro} className="text-[11px] text-muted-foreground">
                     {macro === 'calories' ? 'Kcal' : macro.charAt(0).toUpperCase() + macro.slice(1, 3)}: {Math.round(val)}/{Math.round(target)}
                   </Text>
                 );
               })}
            </View>
          </View>
        ) : (
          <View className="flex-row justify-between items-center">
            <Text className="text-xs font-semibold text-primary">
              {item.calories}kcal | {item.protein}p | {item.carbs}c | {item.fat}g
            </Text>
            <Text className="text-[11px] text-muted-foreground">
              por {item.serving_size}{item.serving_unit}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!hasMore) return null;

    if (isLoadingMore) {
      return (
        <View className="flex-row items-center justify-center py-4 gap-2">
          <ActivityIndicator size="small" color="#CCFF00" />
          <Text className="text-muted-foreground text-sm">Carregando mais...</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity className="flex-row items-center justify-center py-4 gap-1.5" onPress={loadMore}>
        <Text className="text-primary text-sm font-semibold">Carregar mais alimentos</Text>
        <Ionicons name="chevron-down" size={16} color="#CCFF00" />
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/80 justify-end">
        <View className="bg-background rounded-t-3xl h-[85%] pt-5">
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 mb-5">
            <Text className="text-2xl font-extrabold text-foreground">Buscar Alimento</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="#FAFAFA" />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View className="flex-row items-center bg-card rounded-xl mx-6 mb-4 px-4 border-2 border-border">
            <Ionicons name="search" size={20} color="#A1A1AA" className="mr-3" />
            <TextInput
              className="flex-1 text-foreground text-base py-3.5"
              placeholder="Digite o nome do alimento..."
              placeholderTextColor="#A1A1AA"
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
            />
          </View>

          {/* Reverse Calculator */}
          <View className="mx-6 mb-4 p-3 bg-card rounded-xl border border-border">
            <Text className="text-xs text-muted-foreground mb-3 font-semibold">Calculadora Reversa (Multimeta)</Text>
            <View className="flex-row flex-wrap gap-2">
              {(['protein', 'carbs', 'fat', 'calories'] as const).map((macro) => (
                <View key={macro} className="flex-row items-center bg-muted/30 rounded-lg border border-border overflow-hidden">
                  <TouchableOpacity
                    className={`py-2 px-3 border-r border-border ${activeMacros.includes(macro) ? 'bg-primary/10' : 'bg-muted/30'}`}
                    onPress={() => toggleMacro(macro)}
                  >
                    <Text
                      className={`text-xs font-semibold ${activeMacros.includes(macro) ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      {macro === 'protein' ? 'Prot' : macro === 'carbs' ? 'Carb' : macro === 'fat' ? 'Gord' : 'Kcal'}
                    </Text>
                  </TouchableOpacity>
                  
                  {activeMacros.includes(macro) && (
                    <View className="w-[60px] px-2">
                       <TextInput
                        className="text-foreground text-sm py-2 font-semibold text-center"
                        placeholder="0"
                        placeholderTextColor="#A1A1AA"
                        keyboardType="numeric"
                        value={targets[macro] || ''}
                        onChangeText={(val) => updateTarget(macro, val)}
                      />
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Results Count */}
          {foods.length > 0 && !isLoading && (
            <View className="px-6 py-2 bg-card mx-6 mb-3 rounded-lg">
              <Text className="text-xs text-muted-foreground text-center">
                {foods.length} alimento{foods.length !== 1 ? 's' : ''} encontrado{foods.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {/* Results */}
          {isLoading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#F97316" />
              <Text className="text-muted-foreground mt-4 text-base">Buscando...</Text>
            </View>
          ) : (
            <FlatList
              data={sortedFoods}
              renderItem={renderFoodItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={
                <View className="flex-1 justify-center items-center py-16">
                  <Ionicons name="search-outline" size={48} color="#A1A1AA" />
                  <Text className="text-muted-foreground text-base mt-4 text-center">
                    {searchQuery.length < 2
                      ? 'Digite para buscar alimentos'
                      : 'Nenhum alimento encontrado'}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
