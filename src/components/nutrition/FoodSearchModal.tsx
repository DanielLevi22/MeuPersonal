import { supabase } from '@/lib/supabase';
import { Food } from '@/store/nutritionStore';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
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
  onSelectFood: (food: Food) => void;
}

const ITEMS_PER_PAGE = 10;

export function FoodSearchModal({ visible, onClose, onSelectFood }: FoodSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

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

  const handleSelectFood = (food: Food) => {
    onSelectFood(food);
    setSearchQuery('');
    onClose();
  };

  const renderFoodItem = ({ item }: { item: Food }) => (
    <TouchableOpacity
      style={styles.foodItem}
      onPress={() => handleSelectFood(item)}
      activeOpacity={0.7}
    >
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.foodCategory}>{item.category}</Text>
      </View>
      <View style={styles.macrosPreview}>
        <Text style={styles.macroText}>
          {item.calories}kcal | {item.protein}p | {item.carbs}c | {item.fat}g
        </Text>
        <Text style={styles.servingText}>
          por {item.serving_size}{item.serving_unit}
        </Text>
      </View>
    </TouchableOpacity>
  );

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
              data={foods}
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
    height: '80%',
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
    marginBottom: 20,
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
  macroText: {
    fontSize: 12,
    color: '#00FF88',
    fontWeight: '600',
  },
  servingText: {
    fontSize: 11,
    color: '#5A6178',
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
