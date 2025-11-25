import { DEFAULT_MEAL_TYPES } from '@/lib/constants/meals';
import { useAddFoodToMeal, useAddMeal, useDietMeals, useRemoveMealItem, useUpdateMeal, useUpdateMealItem } from '@/shared/hooks/useNutrition';
import { DietMeal, DietMealItem, Food } from '@meupersonal/core';
import { useState } from 'react';
import { AddFoodQuantityModal } from './AddFoodQuantityModal';
import { EditFoodModal } from './EditFoodModal';
import { EditMealTimeModal } from './EditMealTimeModal';
import { FoodSelector } from './FoodSelector';

interface MealEditorProps {
  dietPlanId: string;
  dayOfWeek: number; // 0-6 for cyclic, -1 for unique
}

export function MealEditor({ dietPlanId, dayOfWeek }: MealEditorProps) {
  const { data: allMeals = [], isLoading } = useDietMeals(dietPlanId);
  const addMealMutation = useAddMeal();
  const addFoodMutation = useAddFoodToMeal();
  const updateMealMutation = useUpdateMeal();
  const updateItemMutation = useUpdateMealItem();
  const removeFoodMutation = useRemoveMealItem();

  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditTimeModalOpen, setIsEditTimeModalOpen] = useState(false);
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<DietMealItem | null>(null);
  const [editingMeal, setEditingMeal] = useState<DietMeal | null>(null);
  const [pendingFood, setPendingFood] = useState<{ food: Food; calculatedQuantity?: number } | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Filter meals for the current day
  const meals = allMeals.filter((m) => m.day_of_week === dayOfWeek);

  const handleAddMeal = async (mealType: string, order: number, defaultTime: string) => {
    try {
      await addMealMutation.mutateAsync({
        diet_plan_id: dietPlanId,
        day_of_week: dayOfWeek,
        name: DEFAULT_MEAL_TYPES.find(m => m.type === mealType)?.label || mealType,
        meal_time: defaultTime,
        meal_type: mealType as any,
        meal_order: order,
      });
    } catch (error) {
      console.error('Error adding meal:', error);
    }
  };

  const handleUpdateMealTime = async (time: string) => {
    if (!editingMeal) return;
    try {
      await updateMealMutation.mutateAsync({
        id: editingMeal.id,
        meal_time: time,
      });
    } catch (error) {
      console.error('Error updating meal time:', error);
    }
  };

  const handleOpenFoodModal = (mealId: string) => {
    setSelectedMealId(mealId);
    setIsFoodModalOpen(true);
  };

  const handleSelectFood = (food: Food, calculatedQuantity?: number) => {
    if (!selectedMealId) return;

    if (calculatedQuantity) {
      handleConfirmQuantity(calculatedQuantity, food);
    } else {
      setPendingFood({ food, calculatedQuantity });
      setIsQuantityModalOpen(true);
    }
  };

  const handleConfirmQuantity = async (quantity: number, food?: Food) => {
    const foodToAdd = food || pendingFood?.food;
    if (!selectedMealId || !foodToAdd) return;

    try {
      await addFoodMutation.mutateAsync({
        diet_meal_id: selectedMealId,
        food_id: foodToAdd.id,
        quantity,
        unit: foodToAdd.serving_unit,
        order_index: 999,
      });
      setIsFoodModalOpen(false);
      setIsQuantityModalOpen(false);
      setPendingFood(null);
    } catch (error) {
      console.error('Error adding food:', error);
    }
  };

  const handleEditItem = (item: DietMealItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (itemId: string, quantity: number) => {
    try {
      await updateItemMutation.mutateAsync({
        id: itemId,
        quantity,
      });
    } catch (error) {
      console.error('Error updating food:', error);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setItemToDelete(itemId);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await removeFoodMutation.mutateAsync(itemToDelete);
      setIsDeleteConfirmOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error removing food:', error);
    }
  };

  // Calculate totals
  const totals = meals.reduce(
    (acc, meal) => {
      meal.diet_meal_items?.forEach((item) => {
        const ratio = item.quantity / item.food.serving_size;
        acc.calories += item.food.calories * ratio;
        acc.protein += item.food.protein * ratio;
        acc.carbs += item.food.carbs * ratio;
        acc.fat += item.food.fat * ratio;
      });
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Calculate meal totals
  const getMealTotals = (meal: DietMeal & { diet_meal_items?: (DietMealItem & { food: Food })[] }) => {
    return (meal.diet_meal_items || []).reduce(
      (acc: { calories: number; protein: number; carbs: number; fat: number }, item) => {
        const ratio = item.quantity / item.food.serving_size;
        acc.calories += item.food.calories * ratio;
        acc.protein += item.food.protein * ratio;
        acc.carbs += item.food.carbs * ratio;
        acc.fat += item.food.fat * ratio;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando refeições...</div>;

  return (
    <div className="space-y-6">
      {/* Totals Header */}
      <div className="grid grid-cols-4 gap-4 bg-surface border border-white/10 rounded-xl p-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Calorias</p>
          <p className="text-xl font-bold text-foreground">{Math.round(totals.calories)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Proteína</p>
          <p className="text-xl font-bold text-emerald-400">{Math.round(totals.protein)}g</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Carboidratos</p>
          <p className="text-xl font-bold text-blue-400">{Math.round(totals.carbs)}g</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Gorduras</p>
          <p className="text-xl font-bold text-yellow-400">{Math.round(totals.fat)}g</p>
        </div>
      </div>

      {/* Meals List */}
      <div className="space-y-4">
        {DEFAULT_MEAL_TYPES.map((mealType) => {
          const meal = meals.find((m) => m.meal_type === mealType.type);

          if (meal) {
            const mealTotals = getMealTotals(meal);
            
            return (
              <div key={meal.id} className="bg-surface border border-white/10 rounded-xl overflow-hidden">
                <div className="p-4 bg-white/5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground">{meal.name}</h3>
                      <button
                        onClick={() => {
                          setEditingMeal(meal);
                          setIsEditTimeModalOpen(true);
                        }}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mt-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {meal.meal_time || 'Definir horário'}
                      </button>
                    </div>
                    <button
                      onClick={() => handleOpenFoodModal(meal.id)}
                      className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      + Adicionar
                    </button>
                  </div>

                  {/* Meal Macros */}
                  {meal.diet_meal_items && meal.diet_meal_items.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 bg-background/30 rounded-lg p-2 mb-3">
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">Kcal</p>
                        <p className="text-sm font-bold text-foreground">{Math.round(mealTotals.calories)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">Prot</p>
                        <p className="text-sm font-bold text-emerald-400">{Math.round(mealTotals.protein)}g</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">Carb</p>
                        <p className="text-sm font-bold text-blue-400">{Math.round(mealTotals.carbs)}g</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">Gord</p>
                        <p className="text-sm font-bold text-yellow-400">{Math.round(mealTotals.fat)}g</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="divide-y divide-white/5">
                  {meal.diet_meal_items?.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Nenhum alimento adicionado
                    </div>
                  ) : (
                    meal.diet_meal_items?.map((item) => {
                      const ratio = item.quantity / item.food.serving_size;
                      return (
                        <div key={item.id} className="p-3 flex justify-between items-center hover:bg-white/5 transition-colors group">
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.food.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity}{item.unit} • {Math.round(item.food.calories * ratio)}kcal
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right text-xs text-muted-foreground hidden sm:block">
                              <span className="text-emerald-400 ml-2">P: {Math.round(item.food.protein * ratio)}</span>
                              <span className="text-blue-400 ml-2">C: {Math.round(item.food.carbs * ratio)}</span>
                              <span className="text-yellow-400 ml-2">G: {Math.round(item.food.fat * ratio)}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditItem(item)}
                                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Remover"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          }

          // Show "Add Meal" button if meal doesn't exist
          return (
            <button
              key={mealType.type}
              onClick={() => handleAddMeal(mealType.type, mealType.order, mealType.defaultTime)}
              className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar {mealType.label}
            </button>
          );
        })}
      </div>

      {/* Modals */}
      {isFoodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFoodModalOpen(false)} />
          <div className="relative bg-surface border border-white/10 rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-foreground">Adicionar Alimento</h3>
              <button onClick={() => setIsFoodModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 flex-1 overflow-hidden">
              <FoodSelector onSelect={handleSelectFood} />
            </div>
          </div>
        </div>
      )}

      <EditFoodModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveEdit}
        item={editingItem}
      />

      <EditMealTimeModal
        isOpen={isEditTimeModalOpen}
        onClose={() => {
          setIsEditTimeModalOpen(false);
          setEditingMeal(null);
        }}
        onSave={handleUpdateMealTime}
        currentTime={editingMeal?.meal_time || undefined}
        mealName={editingMeal?.name || ''}
      />

      <AddFoodQuantityModal
        isOpen={isQuantityModalOpen}
        onClose={() => {
          setIsQuantityModalOpen(false);
          setPendingFood(null);
        }}
        onConfirm={handleConfirmQuantity}
        food={pendingFood?.food || null}
        suggestedQuantity={pendingFood?.calculatedQuantity}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDeleteConfirmOpen(false)} />
          <div className="relative bg-surface border border-white/10 rounded-xl w-full max-w-sm shadow-2xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Confirmar Remoção</h3>
            <p className="text-muted-foreground mb-6">Tem certeza que deseja remover este alimento?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
