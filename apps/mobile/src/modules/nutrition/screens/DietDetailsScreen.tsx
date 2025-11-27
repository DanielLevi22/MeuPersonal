import { useAuthStore } from '@/auth';
import AddFoodQuantityModal from '@/components/AddFoodQuantityModal';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { DayActionsModal } from '@/modules/nutrition/components/DayActionsModal';

import FoodSearchScreen from '@/modules/nutrition/screens/FoodSearchScreen';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNutritionStore } from '../routes';

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
  
  // For Adding/Editing Food


  const [showMealModal, setShowMealModal] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [mealName, setMealName] = useState('');
  const [mealTime, setMealTime] = useState('');

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
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a refeição.');
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
          onPress: async () => {
            try {
              await pasteDay(selectedDay);
              fetchMeals(plan.id);
            } catch (error) {
              Alert.alert('Erro', 'Falha ao colar dia.');
            }
          }
        }
      ]
    );
  };

  const handleClearDay = async () => {
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
              await clearDay(selectedDay);
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
        <ActivityIndicator size="large" color="#00D9FF" />
      </ScreenLayout>
    );
  }

  const currentDayMeals = meals.filter(m => m.day_of_week === selectedDay);

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
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="items-center pt-8 pb-8 px-6 bg-zinc-900 rounded-b-[32px] border-b border-zinc-800">
          <View className="flex-row items-center justify-between w-full mb-6">
            <TouchableOpacity 
              onPress={() => router.back()} 
              className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800"
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View className="flex-row gap-2">
              <TouchableOpacity 
                onPress={() => Alert.alert('Em breve', 'Edição em desenvolvimento')}
                className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800"
              >
                <Ionicons name="pencil" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="w-20 h-20 rounded-full bg-cyan-400/10 items-center justify-center mb-4 border-2 border-cyan-400/20">
            <Ionicons name="restaurant" size={40} color="#00D9FF" />
          </View>
          
          <Text className="text-2xl font-extrabold text-white mb-1 font-display text-center">
            {plan.name}
          </Text>
          <Text className="text-zinc-400 font-sans mb-6 text-center">
            {plan.description || 'Sem descrição'}
          </Text>

          {/* Macros Grid */}
          <View className="flex-row gap-3 w-full">
            <View className="flex-1 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 items-center">
              <Text className="text-emerald-400 text-xs font-bold mb-1">PROTEÍNA</Text>
              <Text className="text-white text-xl font-bold">{plan.target_protein}g</Text>
            </View>
            <View className="flex-1 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 items-center">
              <Text className="text-purple-400 text-xs font-bold mb-1">CARBO</Text>
              <Text className="text-white text-xl font-bold">{plan.target_carbs}g</Text>
            </View>
            <View className="flex-1 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 items-center">
              <Text className="text-amber-400 text-xs font-bold mb-1">GORDURA</Text>
              <Text className="text-white text-xl font-bold">{plan.target_fat}g</Text>
            </View>
          </View>

          <View className="mt-4 bg-zinc-950 px-6 py-3 rounded-xl border border-zinc-800 flex-row items-center">
            <Ionicons name="flame" size={20} color="#FF6B35" style={{ marginRight: 8 }} />
            <Text className="text-white font-bold text-lg">
              {plan.target_calories} <Text className="text-zinc-500 font-normal text-sm">kcal/dia</Text>
            </Text>
          </View>
        </View>

        {/* Day Selector */}
        <View className="px-6 mt-6 mb-2">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-zinc-400 font-bold text-sm">DIA DA SEMANA</Text>
            <TouchableOpacity 
              onPress={() => setShowDayActions(true)}
              className="flex-row items-center gap-1 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800"
            >
              <Ionicons name="ellipsis-horizontal" size={16} color="#00D9FF" />
              <Text className="text-cyan-400 text-xs font-bold">Opções</Text>
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
                      ? 'bg-cyan-500 border-cyan-400'
                      : 'bg-zinc-900 border-zinc-800'
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
            {currentDayMeals.length === 0 ? (
              <View className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 items-center">
                <Text className="text-zinc-500 text-center mb-4">Nenhuma refeição planejada para este dia.</Text>
                <TouchableOpacity 
                  onPress={handleGenerateStandardMeals}
                  className="bg-zinc-800 px-4 py-2 rounded-xl"
                >
                  <Text className="text-cyan-400 font-bold text-sm">Gerar Refeições Padrão</Text>
                </TouchableOpacity>
              </View>
            ) : (
              currentDayMeals.map((meal) => {
                const items = mealItems[meal.id] || [];
                const totalCals = items.reduce((acc, item) => {
                  const ratio = item.quantity / (item.food?.serving_size || 100);
                  return acc + (item.food?.calories || 0) * ratio;
                }, 0);

                return (
                  <View key={meal.id} className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                    <View className="flex-row justify-between items-center mb-3">
                      <TouchableOpacity 
                        className="flex-row items-center flex-1"
                        onPress={() => handleEditMealPress(meal)}
                      >
                        <View className="bg-zinc-800 px-2 py-1 rounded-md mr-3">
                          <Text className="text-zinc-400 text-xs font-bold">{meal.meal_time || '00:00'}</Text>
                        </View>
                        <Text className="text-white font-bold text-base mr-2">{meal.name}</Text>
                        <Ionicons name="pencil" size={12} color="#52525B" />
                      </TouchableOpacity>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-orange-500 font-bold text-sm">{Math.round(totalCals)} kcal</Text>
                        <TouchableOpacity 
                          onPress={() => handleAddFoodPress(meal.id)}
                          className="bg-zinc-800 p-1.5 rounded-lg"
                        >
                          <Ionicons name="add" size={16} color="#00D9FF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    {items.length > 0 ? (
                      <View className="gap-2 pl-2 border-l-2 border-zinc-800 ml-2">
                        {items.map((item, idx) => (
                          <TouchableOpacity 
                            key={idx} 
                            className="flex-row justify-between items-center py-1"
                            onPress={() => handleEditItemPress(item, meal.id)}
                            onLongPress={() => handleRemoveItem(item.id, meal.id)}
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
                      <Text className="text-zinc-600 text-xs italic ml-11">Sem alimentos</Text>
                    )}
                  </View>
                );
              })
            )}
          </View>

          <TouchableOpacity 
            className="mt-6 border-2 border-dashed border-zinc-700 rounded-2xl p-4 items-center justify-center"
            onPress={handleAddMealPress}
          >
            <Ionicons name="add-circle-outline" size={24} color="#71717A" />
            <Text className="text-zinc-500 font-bold mt-2">Adicionar Refeição</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals */}
      <Modal visible={showFoodSearch} animationType="slide" presentationStyle="pageSheet">
        <FoodSearchScreen 
          onSelect={handleFoodSelect} 
          onClose={() => setShowFoodSearch(false)} 
        />
      </Modal>

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
          <View className="bg-zinc-900 w-full max-w-sm rounded-3xl p-6 border border-zinc-800">
            <Text className="text-xl font-bold text-white font-display mb-4">
              {editingMealId ? 'Editar Refeição' : 'Nova Refeição'}
            </Text>
            
            <Text className="text-zinc-400 text-sm font-bold mb-2 ml-1">Nome</Text>
            <TextInput
              className="bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800 mb-4"
              placeholder="Ex: Lanche da Manhã"
              placeholderTextColor="#52525B"
              value={mealName}
              onChangeText={setMealName}
            />

            <Text className="text-zinc-400 text-sm font-bold mb-2 ml-1">Horário</Text>
            <TextInput
              className="bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800 mb-6"
              placeholder="Ex: 09:30"
              placeholderTextColor="#52525B"
              value={mealTime}
              onChangeText={setMealTime}
            />

            <View className="flex-row gap-3">
              <TouchableOpacity 
                className="flex-1 bg-zinc-800 p-4 rounded-xl items-center"
                onPress={() => setShowMealModal(false)}
              >
                <Text className="text-zinc-400 font-bold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 bg-cyan-500 p-4 rounded-xl items-center"
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
