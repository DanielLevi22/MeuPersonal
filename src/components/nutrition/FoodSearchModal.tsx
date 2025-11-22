import { supabase } from '@/lib/supabase';
import { Food } from '@/store/nutritionStore';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
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
        style={styles.foodItem}
        onPress={() => handleSelectFood(item)}
        activeOpacity={0.7}
      >
        <View style={styles.foodInfo}>
          <Text style={styles.foodName}>{item.name}</Text>
          <Text style={styles.foodCategory}>{item.category}</Text>
        </View>
        
        {match?.isMatch ? (
          <View style={styles.calculatedPreview}>
            <View style={styles.matchHeader}>
              <Text style={styles.calculatedQuantity}>
                {Math.round(match.quantity)}{item.serving_unit}
              </Text>
              {activeMacros.length > 1 && (
                <View style={[
                  styles.matchBadge,
                  { backgroundColor: match.score > 80 ? 'rgba(0, 255, 136, 0.2)' : match.score > 40 ? 'rgba(255, 222, 89, 0.2)' : 'rgba(255, 107, 53, 0.2)' }
                ]}>
                  <Text style={[
                    styles.matchBadgeText,
                    { color: match.score > 80 ? '#00FF88' : match.score > 40 ? '#ffde59' : '#FF6B35' }
                  ]}>
                    {match.score > 80 ? 'Combinação Perfeita' : match.score > 40 ? 'Boa Combinação' : 'Baixa Combinação'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.calculatedLabel}>
              para atingir metas
            </Text>
            <View style={styles.targetComparison}>
               {activeMacros.map(macro => {
                 const val = (item[macro] * match.quantity) / item.serving_size;
                 const target = parseFloat(targets[macro] || '0');
                 return (
                   <Text key={macro} style={styles.comparisonText}>
                     {macro === 'calories' ? 'Kcal' : macro.charAt(0).toUpperCase() + macro.slice(1, 3)}: {Math.round(val)}/{Math.round(target)}
                   </Text>
                 );
               })}
            </View>
          </View>
        ) : (
          <View style={styles.macrosPreview}>
            <Text style={styles.macroText}>
              {item.calories}kcal | {item.protein}p | {item.carbs}c | {item.fat}g
            </Text>
            <Text style={styles.servingText}>
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
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#00FF88" />
          <Text style={styles.footerText}>Carregando mais...</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}>
        <Text style={styles.loadMoreText}>Carregar mais alimentos</Text>
        <Ionicons name="chevron-down" size={16} color="#00FF88" />
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
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Buscar Alimento</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#8B92A8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Digite o nome do alimento..."
              placeholderTextColor="#5A6178"
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
            />
          </View>

          {/* Reverse Calculator */}
          <View style={styles.calculatorContainer}>
            <Text style={styles.calculatorTitle}>Calculadora Reversa (Multimeta)</Text>
            <View style={styles.macroGrid}>
              {(['protein', 'carbs', 'fat', 'calories'] as const).map((macro) => (
                <View key={macro} style={styles.macroInputGroup}>
                  <TouchableOpacity
                    style={[
                      styles.macroButton,
                      activeMacros.includes(macro) && styles.macroButtonActive,
                    ]}
                    onPress={() => toggleMacro(macro)}
                  >
                    <Text
                      style={[
                        styles.macroButtonText,
                        activeMacros.includes(macro) && styles.macroButtonTextActive,
                      ]}
                    >
                      {macro === 'protein' ? 'Prot' : macro === 'carbs' ? 'Carb' : macro === 'fat' ? 'Gord' : 'Kcal'}
                    </Text>
                  </TouchableOpacity>
                  
                  {activeMacros.includes(macro) && (
                    <View style={styles.targetInputWrapper}>
                       <TextInput
                        style={styles.targetInput}
                        placeholder="0"
                        placeholderTextColor="#5A6178"
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
            <View style={styles.resultsCount}>
              <Text style={styles.resultsCountText}>
                {foods.length} alimento{foods.length !== 1 ? 's' : ''} encontrado{foods.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {/* Results */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={styles.loadingText}>Buscando...</Text>
            </View>
          ) : (
            <FlatList
              data={sortedFoods}
              renderItem={renderFoodItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={48} color="#5A6178" />
                  <Text style={styles.emptyText}>
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

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0A0E1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141B2D',
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#1E2A42',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 14,
  },
  calculatorContainer: {
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#141B2D',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E2A42',
  },
  calculatorTitle: {
    fontSize: 12,
    color: '#8B92A8',
    marginBottom: 12,
    fontWeight: '600',
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  macroInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0E1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E2A42',
    overflow: 'hidden',
  },
  macroButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#0A0E1A',
    borderRightWidth: 1,
    borderRightColor: '#1E2A42',
  },
  macroButtonActive: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
  },
  macroButtonText: {
    fontSize: 12,
    color: '#8B92A8',
    fontWeight: '600',
  },
  macroButtonTextActive: {
    color: '#00FF88',
  },
  targetInputWrapper: {
    width: 60,
    paddingHorizontal: 8,
  },
  targetInput: {
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  foodItem: {
    backgroundColor: '#141B2D',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#1E2A42',
  },
  foodInfo: {
    marginBottom: 8,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  foodCategory: {
    fontSize: 12,
    color: '#8B92A8',
  },
  macrosPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calculatedPreview: {
    backgroundColor: 'rgba(0, 255, 136, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  matchBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  targetComparison: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  comparisonText: {
    fontSize: 11,
    color: '#8B92A8',
  },
  macroText: {
    fontSize: 12,
    color: '#00FF88',
    fontWeight: '600',
  },
  servingText: {
    fontSize: 11,
    color: '#5A6178',
  },
  calculatedQuantity: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00FF88',
  },
  calculatedLabel: {
    fontSize: 11,
    color: '#8B92A8',
  },
  loadingContainer: {
    flex: 1,
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
    paddingVertical: 60,
  },
  emptyText: {
    color: '#8B92A8',
    fontSize: 15,
    marginTop: 16,
    textAlign: 'center',
  },
  resultsCount: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: '#141B2D',
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 8,
  },
  resultsCountText: {
    fontSize: 12,
    color: '#8B92A8',
    textAlign: 'center',
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerText: {
    color: '#8B92A8',
    fontSize: 13,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  loadMoreText: {
    color: '#00FF88',
    fontSize: 14,
    fontWeight: '600',
  },
});
