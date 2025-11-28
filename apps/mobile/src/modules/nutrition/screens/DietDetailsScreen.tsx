import { useAuthStore } from '@/auth';
import AddFoodQuantityModal from '@/components/AddFoodQuantityModal';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { tailwindColors } from '@/constants/colors';
import { DayActionsModal } from '@/modules/nutrition/components/DayActionsModal';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
    Extrapolation,
    interpolate,
    runOnUI,
    scrollTo,
    useAnimatedRef,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue
} from 'react-native-reanimated';
import { FoodSearchModal, useNutritionStore } from '../routes';

export default function DietDetailsScreen() {
  const { id: studentId, planId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { 
    dietPlans, 
    fetchDietPlans, 
    isLoading,
    meals,
    fetchMeals,
    mealItems,
    fetchMealItems,
    addMeal,
    updateMeal,
    addFoodToMeal,
    updateMealItem,
    removeFoodFromMeal,
    copyDay,
    pasteDay,
    clearDay,
    copiedDay
  } = useNutritionStore();

  const [plan, setPlan] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState(0); // 0 = Sunday, etc.
  
  // UI States
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [showDayActions, setShowDayActions] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [selectedItemToEdit, setSelectedItemToEdit] = useState<any>(null);
  const [initialMealData, setInitialMealData] = useState<{
    name: string;
    time: string;
    type: string;
    order: number;
  } | null>(null);

  const [showMealModal, setShowMealModal] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [mealName, setMealName] = useState('');
  const [mealTime, setMealTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);

  const scrollY = useSharedValue(0);
  const scrollRef = useAnimatedRef<ScrollView>();
  const HEADER_MAX_HEIGHT = 420;
  const HEADER_MIN_HEIGHT = 120;

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const toggleHeader = () => {
    runOnUI(() => {
      'worklet';
      if (scrollY.value > (HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT) / 2) {
        // Expand
        scrollTo(scrollRef, 0, 0, true);
      } else {
        // Collapse
        scrollTo(scrollRef, 0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT, true);
      }
    })();
  };

  const headerStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
      [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
      Extrapolation.CLAMP
    );
    return { height };
  });

  const arrowStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      scrollY.value,
      [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
      [180, 0],
      Extrapolation.CLAMP
    );
    return { transform: [{ rotate: `${rotate}deg` }] };
  });

  const contentStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100], // Fade out faster (by 100px scroll)
      [1, 0],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, 100],
      [0, -20],
      Extrapolation.CLAMP
    );
    return { 
      opacity,
      transform: [{ translateY }],
      // Hide completely when faded out to avoid touch events
      display: opacity === 0 ? 'none' : 'flex'
    };
  });

  const titleStyle = useAnimatedStyle(() => {
    const scrollRange = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
    const opacity = interpolate(
      scrollY.value,
      [scrollRange * 0.5, scrollRange * 0.8], // Start fading in at 50%, fully visible at 80%
      [0, 1],
      Extrapolation.CLAMP
    );
    return { 
      opacity,
      zIndex: 10 
    };
  });

  useEffect(() => {
    if (user?.id && !dietPlans.length) {
      fetchDietPlans(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (dietPlans.length > 0 && planId) {
      const found = dietPlans.find(p => p.id === planId);
      setPlan(found);
      if (found) {
        fetchMeals(found.id);
      }
    }
  }, [dietPlans, planId]);

  // Fetch items for meals when meals change
  useEffect(() => {
    if (meals.length > 0) {
      meals.forEach(meal => {
        fetchMealItems(meal.id);
      });
    }
  }, [meals]);

  const handleSaveMeal = async () => {
    if (!mealName.trim() || !plan) return;

    if (!mealTime.trim()) {
      Alert.alert('Erro', 'Por favor, informe o horário da refeição.');
      return;
    }
    
    try {
      if (editingMealId) {
        // Update existing meal
        await updateMeal(editingMealId, {
          name: mealName,
          meal_time: mealTime || '00:00',
        });
      } else {
        // Create new meal
        await addMeal({
          diet_plan_id: plan.id,
          day_of_week: selectedDay,
          name: mealName,
          meal_time: mealTime || '00:00',
          meal_type: 'snack', // Default type
          meal_order: meals.filter(m => m.day_of_week === selectedDay).length,
          target_calories: 0
        } as any);
      }
      setShowMealModal(false);
      setMealName('');
      setMealTime('');
      setEditingMealId(null);
    } catch (error: any) {
      if (error?.code === '23503' && error?.details?.includes('daily_goals')) {
        Alert.alert(
          'Erro de Cadastro',
          'O aluno não possui um perfil completo. Por favor, peça ao administrador para verificar o cadastro do aluno ou execute o script de correção de perfis.'
        );
      } else {
        Alert.alert('Erro', 'Não foi possível salvar a refeição.');
      }
    }
  };

  const handleEditMealPress = (meal: any) => {
    setEditingMealId(meal.id);
    setMealName(meal.name);
    setMealTime(meal.meal_time || '');
    setShowMealModal(true);
  };

  const handleAddMealPress = () => {
    setEditingMealId(null);
    setMealName('');
    setMealTime('');
    setShowMealModal(true);
  };

  // --- Day Management ---

  const handleGenerateStandardMeals = async () => {
    if (!plan) return;
    
    const standardMeals = [
      { name: 'Café da Manhã', time: '08:00', type: 'breakfast' },
      { name: 'Almoço', time: '12:00', type: 'lunch' },
      { name: 'Lanche da Tarde', time: '16:00', type: 'snack' },
      { name: 'Jantar', time: '20:00', type: 'dinner' },
    ];

    try {
      for (let i = 0; i < standardMeals.length; i++) {
        const meal = standardMeals[i];
        await addMeal({
          diet_plan_id: plan.id,
          day_of_week: selectedDay,
          name: meal.name,
          meal_time: meal.time,
          meal_type: meal.type,
          meal_order: i,
          target_calories: 0
        } as any);
      }
      fetchMeals(plan.id);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao gerar refeições.');
    }
  };

  const handleCopyDay = async () => {
    await copyDay(selectedDay);
    Alert.alert('Sucesso', 'Dia copiado com sucesso!');
  };

  const handlePasteDay = async () => {
    Alert.alert(
      'Colar Dia',
      'Isso substituirá todas as refeições deste dia. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Colar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await pasteDay(selectedDay, plan.id);
              fetchMeals(plan.id);
            } catch (error: any) {
              if (error?.code === '23503' && (error?.details?.includes('daily_goals') || error?.details?.includes('leaderboard') || error?.details?.includes('streak') || error?.details?.includes('achievement'))) {
                Alert.alert(
                  'Erro de Cadastro',
                  'O aluno não possui um perfil completo. Por favor, peça ao administrador para verificar o cadastro do aluno ou execute o script de correção de perfis.'
                );
              } else {
                Alert.alert('Erro', `Falha ao colar dia: ${error.message || JSON.stringify(error)}`);
              }
            }
          }
        }
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
              await clearDay(selectedDay, plan.id);
              fetchMeals(plan.id);
            } catch (error) {
              Alert.alert('Erro', 'Falha ao limpar dia.');
            }
          }
        }
      ]
    );
  };

  // --- Food Management ---

  const handleAddFoodPress = (mealId: string) => {
    setSelectedMealId(mealId);
    setSelectedItemToEdit(null);
    setShowFoodSearch(true);
  };

  const handleEditItemPress = (item: any, mealId: string) => {
    setSelectedMealId(mealId);
    setSelectedItemToEdit(item);
    setSelectedFood(item.food);
    setShowQuantityModal(true);
  };

  const handleFoodSelect = (food: any, quantity?: number) => {
    if (quantity) {
      // Direct add from reverse calculator
      if (selectedMealId) {
        addFoodToMeal(selectedMealId, food.id, quantity, food.serving_unit)
          .then(() => fetchMealItems(selectedMealId))
          .catch(() => Alert.alert('Erro', 'Falha ao adicionar alimento'));
      }
      setShowFoodSearch(false);
    } else {
      // Open quantity modal
      setSelectedFood(food);
      setShowFoodSearch(false);
      setShowQuantityModal(true);
    }
  };

  const handleQuantityConfirm = async (quantity: number) => {
    if (!selectedMealId || !selectedFood) return;

    try {
      if (selectedItemToEdit) {
        // Update existing item
        await updateMealItem(selectedItemToEdit.id, {
          quantity,
        });
      } else {
        // Add new item
        await addFoodToMeal(
          selectedMealId,
          selectedFood.id,
          quantity,
          selectedFood.serving_unit
        );
      }
      setShowQuantityModal(false);
      setSelectedFood(null);
      setSelectedItemToEdit(null);
      // Refresh items
      fetchMealItems(selectedMealId);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar o alimento.');
    }
  };

  const handleRemoveItem = (itemId: string, mealId: string) => {
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
              fetchMealItems(mealId);
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível remover o alimento.');
            }
          }
        }
      ]
    );
  };

  const handleUpdateMealTime = async (mealId: string, time: string) => {
    try {
      await updateMeal(mealId, { meal_time: time });
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar horário');
    }
  };



  if (isLoading || !plan) {
    return (
      <ScreenLayout className="justify-center items-center">
        <ActivityIndicator size="large" color={tailwindColors.primary[400]} />
      </ScreenLayout>
    );
  }

  const currentDayMeals = meals.filter(m => m.day_of_week === selectedDay);

  // Calculate daily totals
  const dailyTotals = currentDayMeals.reduce((acc, meal) => {
    const items = mealItems[meal.id] || [];
    items.forEach(item => {
      const ratio = item.quantity / (item.food?.serving_size || 100);
      acc.calories += (item.food?.calories || 0) * ratio;
      acc.protein += (item.food?.protein || 0) * ratio;
      acc.carbs += (item.food?.carbs || 0) * ratio;
      acc.fat += (item.food?.fat || 0) * ratio;
    });
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const days = [
    { id: 0, label: 'DOM' },
    { id: 1, label: 'SEG' },
    { id: 2, label: 'TER' },
    { id: 3, label: 'QUA' },
    { id: 4, label: 'QUI' },
    { id: 5, label: 'SEX' },
    { id: 6, label: 'SÁB' },
  ];



  return (
    <ScreenLayout>
      <Animated.View 
        style={[headerStyle]} 
        className="absolute top-0 left-0 right-0 bg-background-secondary rounded-b-[32px] border-b border-zinc-800 z-10 overflow-hidden"
      >
        <View className="pt-12 px-6">
          {/* Collapsed Title - Positioned absolutely relative to the container */}
          <Animated.View 
            style={[titleStyle]} 
            className="absolute top-12 left-0 right-0 h-11 justify-center items-center z-10"
            pointerEvents="none"
          >
            <Text className="text-white font-bold text-lg" numberOfLines={1}>
              {plan?.name}
            </Text>
          </Animated.View>

          {/* Navigation Row */}
          <View className="flex-row items-center justify-between w-full mb-2 z-20 h-11">
            <TouchableOpacity 
              onPress={() => router.back()} 
              className="bg-background-primary p-2.5 rounded-xl border border-zinc-800"
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View className="flex-row gap-2">
              <TouchableOpacity 
                onPress={() => Alert.alert('Em breve', 'Edição em desenvolvimento')}
                className="bg-background-primary p-2.5 rounded-xl border border-zinc-800"
              >
                <Ionicons name="pencil" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Expanded Content */}
          <Animated.View style={[contentStyle]} className="items-center w-full">
            <View className="w-20 h-20 rounded-full bg-primary-400/10 items-center justify-center mb-4 border-2 border-primary-400/20">
              <Ionicons name="restaurant" size={40} color={tailwindColors.primary[400]} />
            </View>
            
            <Text className="text-2xl font-extrabold text-white mb-1 font-display text-center">
              {plan.name}
            </Text>
            <Text className="text-zinc-400 font-sans mb-6 text-center">
              {plan.description || 'Sem descrição'}
            </Text>

            {/* Macros Grid */}
            <View className="flex-row gap-3 w-full">
              <View className="flex-1 bg-background-primary p-4 rounded-2xl border border-zinc-800 items-center">
                <Text className="text-emerald-400 text-xs font-bold mb-1">PROTEÍNA</Text>
                <Text className="text-white text-xl font-bold">{plan.target_protein}g</Text>
              </View>
              <View className="flex-1 bg-background-primary p-4 rounded-2xl border border-zinc-800 items-center">
                <Text className="text-purple-400 text-xs font-bold mb-1">CARBO</Text>
                <Text className="text-white text-xl font-bold">{plan.target_carbs}g</Text>
              </View>
              <View className="flex-1 bg-background-primary p-4 rounded-2xl border border-zinc-800 items-center">
                <Text className="text-amber-400 text-xs font-bold mb-1">GORDURA</Text>
                <Text className="text-white text-xl font-bold">{plan.target_fat}g</Text>
              </View>
            </View>

            <View className="mt-4 bg-background-primary px-6 py-3 rounded-xl border border-zinc-800 flex-row items-center mb-6">
              <Ionicons name="flame" size={20} color={tailwindColors.primary[400]} style={{ marginRight: 8 }} />
              <Text className="text-white font-bold text-lg">
                {plan.target_calories} <Text className="text-zinc-500 font-normal text-sm">kcal/dia</Text>
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Expand/Collapse Indicator */}
        <TouchableOpacity 
          onPress={toggleHeader}
          className="absolute bottom-1 left-0 right-0 items-center justify-center py-2 z-50"
          activeOpacity={0.7}
          hitSlop={{ top: 20, bottom: 20, left: 50, right: 50 }}
        >
          <Animated.View style={[arrowStyle]} className="bg-zinc-800/50 rounded-full p-1">
            <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView 
        ref={scrollRef as any}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20, paddingBottom: 100 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >

        {/* Day Selector */}
        <View className="px-6 mt-6 mb-2">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-zinc-400 font-bold text-sm">DIA DA SEMANA</Text>
            <TouchableOpacity 
              onPress={() => setShowDayActions(true)}
              className="flex-row items-center gap-1 bg-background-secondary px-3 py-1.5 rounded-full border border-zinc-800"
            >
              <Ionicons name="ellipsis-horizontal" size={16} color={tailwindColors.secondary.DEFAULT} />
              <Text className="text-secondary-DEFAULT text-xs font-bold">Opções</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {days.map((day) => (
                <TouchableOpacity
                  key={day.id}
                  onPress={() => setSelectedDay(day.id)}
                  className={`px-4 py-2 rounded-full border ${
                    selectedDay === day.id
                      ? 'bg-primary-400 border-primary-400'
                      : 'bg-background-secondary border-zinc-800'
                  }`}
                >
                  <Text className={`font-bold text-xs ${
                    selectedDay === day.id ? 'text-white' : 'text-zinc-400'
                  }`}>
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Meals List */}
        <View className="p-6">
          <Text className="text-white text-lg font-bold mb-4 font-display tracking-wide">
            REFEIÇÕES
          </Text>
          
          <View className="gap-4">
            {/* Standard Meals List */}
            {(() => {
              const STANDARD_MEALS = [
                { name: 'Café da Manhã', defaultTime: '08:00', type: 'breakfast' },
                { name: 'Lanche da Manhã', defaultTime: '10:00', type: 'snack' },
                { name: 'Almoço', defaultTime: '12:00', type: 'lunch' },
                { name: 'Lanche da Tarde', defaultTime: '16:00', type: 'snack' },
                { name: 'Jantar', defaultTime: '20:00', type: 'dinner' },
                { name: 'Ceia', defaultTime: '22:00', type: 'snack' },
              ];

              return STANDARD_MEALS.map((stdMeal, index) => {
                // Find existing meal that matches the name (fuzzy match or exact)
                // We use exact name match here as we are standardizing it
                const existingMeal = currentDayMeals.find(
                  m => m.name === stdMeal.name
                );

                if (existingMeal) {
                  const items = mealItems[existingMeal.id] || [];
                  const totalCals = items.reduce((acc, item) => {
                    const ratio = item.quantity / (item.food?.serving_size || 100);
                    return acc + (item.food?.calories || 0) * ratio;
                  }, 0);
                  
                  // Calculate other macros for the meal card
                  const totalProtein = items.reduce((acc, item) => {
                    const ratio = item.quantity / (item.food?.serving_size || 100);
                    return acc + (item.food?.protein || 0) * ratio;
                  }, 0);
                  const totalCarbs = items.reduce((acc, item) => {
                    const ratio = item.quantity / (item.food?.serving_size || 100);
                    return acc + (item.food?.carbs || 0) * ratio;
                  }, 0);
                  const totalFat = items.reduce((acc, item) => {
                    const ratio = item.quantity / (item.food?.serving_size || 100);
                    return acc + (item.food?.fat || 0) * ratio;
                  }, 0);

                  return (
                    <View key={existingMeal.id} className="bg-background-secondary rounded-2xl p-4 border border-zinc-800">
                      <View className="flex-row justify-between items-center mb-3">
                        <TouchableOpacity 
                          className="flex-row items-center flex-1"
                          onPress={() => handleEditMealPress(existingMeal)}
                        >
                          <Ionicons name="chevron-forward" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                          <Text className="text-white font-bold text-base mr-2">{existingMeal.name}</Text>
                        </TouchableOpacity>
                        <View className="flex-row items-center gap-2">
                          <Text className="text-emerald-400 font-bold text-sm">{Math.round(totalCals)} kcal</Text>
                          <Text className="text-zinc-500 text-xs">{items.length} item{items.length !== 1 ? 's' : ''}</Text>
                        </View>
                      </View>
                      
                      {/* Meal Macros Summary */}
                      {items.length > 0 && (
                        <View className="flex-row gap-4 mb-3 pl-6">
                           <Text className="text-zinc-500 text-xs">P: <Text className="text-zinc-300">{Math.round(totalProtein)}g</Text></Text>
                           <Text className="text-zinc-500 text-xs">C: <Text className="text-zinc-300">{Math.round(totalCarbs)}g</Text></Text>
                           <Text className="text-zinc-500 text-xs">G: <Text className="text-zinc-300">{Math.round(totalFat)}g</Text></Text>
                        </View>
                      )}

                      {items.length > 0 ? (
                        <View className="gap-2 pl-2 border-l-2 border-zinc-800 ml-2">
                          {items.map((item, idx) => (
                            <TouchableOpacity 
                              key={idx} 
                              className="flex-row justify-between items-center py-1"
                              onPress={() => handleEditItemPress(item, existingMeal.id)}
                              onLongPress={() => handleRemoveItem(item.id, existingMeal.id)}
                            >
                              <Text className="text-zinc-400 text-sm flex-1 mr-2">
                                {item.food?.name}
                              </Text>
                              <Text className="text-zinc-500 text-sm">
                                {item.quantity}{item.unit}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : (
                        <Text className="text-zinc-600 text-xs italic ml-6">Sem alimentos</Text>
                      )}
                      
                      <TouchableOpacity 
                        onPress={() => handleAddFoodPress(existingMeal.id)}
                        className="mt-3 bg-background-primary p-2 rounded-xl border border-zinc-800 flex-row justify-center items-center"
                      >
                         <Ionicons name="add" size={16} color={tailwindColors.primary[400]} style={{ marginRight: 4 }} />
                         <Text className="text-primary-400 text-xs font-bold">Adicionar Alimento</Text>
                      </TouchableOpacity>
                    </View>
                  );
                } else {
                  // Render "Add [Meal Name]" button
                  return (
                    <TouchableOpacity
                      key={stdMeal.name}
                      onPress={() => {
                        // Open Draft Mode
                        setInitialMealData({
                          name: stdMeal.name,
                          time: stdMeal.defaultTime,
                          type: stdMeal.type,
                          order: index
                        });
                        setMealTime(stdMeal.defaultTime); // Pre-fill time
                        setShowFoodSearch(true);
                      }}
                      className="bg-background-secondary/50 p-4 rounded-2xl border border-dashed border-zinc-800 flex-row items-center justify-center mb-2"
                    >
                      <Ionicons name="add-circle-outline" size={24} color={tailwindColors.primary[400]} style={{ marginRight: 8 }} />
                      <Text className="text-primary-400 font-bold text-base">Adicionar {stdMeal.name}</Text>
                    </TouchableOpacity>
                  );
                }
              });
            })()}
          </View>

          <TouchableOpacity 
            className="mt-6 border-2 border-dashed border-zinc-700 rounded-2xl p-4 items-center justify-center"
            onPress={handleAddMealPress}
          >
            <Ionicons name="add-circle-outline" size={24} color="#71717A" />
            <Text className="text-zinc-500 font-bold mt-2">Adicionar Refeição</Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>

      {/* Modals */}
      {(selectedMealId || initialMealData) && (
        <FoodSearchModal
          visible={showFoodSearch}
          onClose={() => {
            setShowFoodSearch(false);
            setSelectedMealId(null);
            setInitialMealData(null);
          }}
          onSelect={handleFoodSelect}
          mealId={selectedMealId || undefined}
          initialData={initialMealData || undefined}
          dailyTotals={dailyTotals}
          mealTime={mealTime}
          onTimeChange={setMealTime}
          onSave={async (items) => {
            try {
              if (selectedMealId) {
                // Editing existing meal - logic to be refined if needed
                // For now, we assume direct edits on existing meals are handled via store
                // But if we want draft mode for edits, we'd implement diffing here.
                // Current request focuses on NEW meals.
              } else if (initialMealData) {
                // Creating NEW meal
                const newMeal = await addMeal({
                  diet_plan_id: plan.id,
                  day_of_week: selectedDay,
                  name: initialMealData.name,
                  meal_time: initialMealData.time,
                  meal_type: initialMealData.type,
                  meal_order: initialMealData.order,
                  target_calories: 0
                } as any);

                // Add items
                for (const item of items) {
                  await addFoodToMeal(
                    newMeal.id,
                    item.food_id,
                    item.quantity,
                    item.unit
                  );
                }
                
                // Refresh
                await fetchMeals(plan.id);
              }
              } catch (error: any) {
              console.error('Error saving draft meal:', error);
              
              if (error?.code === '23503' && error?.details?.includes('daily_goals')) {
                Alert.alert(
                  'Erro de Cadastro',
                  'O aluno não possui um perfil completo. Por favor, peça ao administrador para verificar o cadastro do aluno ou execute o script de correção de perfis.'
                );
              } else {
                Alert.alert('Erro', `Falha ao salvar refeição: ${error.message || JSON.stringify(error)}`);
              }
              throw error; // Re-throw to keep modal open or handle in child
            }
          }}
        />
      )}

      <AddFoodQuantityModal
        visible={showQuantityModal}
        onClose={() => setShowQuantityModal(false)}
        onConfirm={handleQuantityConfirm}
        food={selectedFood}
        initialQuantity={selectedItemToEdit?.quantity}
      />

      <DayActionsModal
        visible={showDayActions}
        onClose={() => setShowDayActions(false)}
        onCopy={handleCopyDay}
        onPaste={handlePasteDay}
        onClear={handleClearDay}
        onGenerate={handleGenerateStandardMeals}
        hasCopiedDay={!!copiedDay}
        dayName={days.find(d => d.id === selectedDay)?.label || ''}
      />

      <Modal visible={showMealModal} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-background-secondary w-full max-w-sm rounded-3xl p-6 border border-zinc-800">
            <Text className="text-xl font-bold text-white font-display mb-4">
              {editingMealId ? 'Editar Refeição' : 'Nova Refeição'}
            </Text>
            
            <Text className="text-zinc-400 text-sm font-bold mb-2 ml-1">Sugestões</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 max-h-10">
              {[
                { name: 'Café da Manhã', time: '08:00' },
                { name: 'Lanche da Manhã', time: '10:00' },
                { name: 'Almoço', time: '12:00' },
                { name: 'Lanche da Tarde', time: '16:00' },
                { name: 'Jantar', time: '20:00' },
                { name: 'Ceia', time: '22:00' },
                { name: 'Pré-Treino', time: '18:00' },
                { name: 'Pós-Treino', time: '19:30' },
              ].map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.name}
                  onPress={() => {
                    setMealName(suggestion.name);
                    setMealTime(suggestion.time);
                  }}
                  className="bg-background-primary px-3 py-2 rounded-lg mr-2 border border-zinc-700"
                >
                  <Text className="text-zinc-300 text-xs font-bold">{suggestion.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text className="text-zinc-400 text-sm font-bold mb-2 ml-1">Nome</Text>
            <TextInput
              className="bg-background-primary text-white p-4 rounded-xl border border-zinc-800 mb-4"
              placeholder="Ex: Lanche da Manhã"
              placeholderTextColor="#52525B"
              value={mealName}
              onChangeText={setMealName}
            />

            <Text className="text-zinc-400 text-sm font-bold mb-2 ml-1">Horário</Text>
            <TouchableOpacity
              className="bg-background-primary p-4 rounded-xl border border-zinc-800 mb-6 flex-row items-center justify-between"
              onPress={() => setShowTimePicker(true)}
            >
              <Text className="text-white text-base">
                {mealTime || '00:00'}
              </Text>
              <Ionicons name="time-outline" size={20} color="#52525B" />
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={(() => {
                  const [hours, minutes] = (mealTime || '00:00').split(':').map(Number);
                  const date = new Date();
                  date.setHours(hours || 0);
                  date.setMinutes(minutes || 0);
                  return date;
                })()}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  if (Platform.OS === 'android') {
                    setShowTimePicker(false);
                  }
                  if (selectedDate) {
                    const hours = selectedDate.getHours().toString().padStart(2, '0');
                    const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
                    setMealTime(`${hours}:${minutes}`);
                  }
                }}
                textColor="#FFFFFF"
                themeVariant="dark"
              />
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity 
                className="flex-1 bg-background-primary p-4 rounded-xl items-center"
                onPress={() => setShowMealModal(false)}
              >
                <Text className="text-zinc-400 font-bold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 bg-primary-400 p-4 rounded-xl items-center"
                onPress={handleSaveMeal}
              >
                <Text className="text-white font-bold">Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScreenLayout>
  );
}
