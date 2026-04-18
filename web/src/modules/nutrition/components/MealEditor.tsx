"use client";

import type { DietMeal, DietMealItem, Food } from "@meupersonal/shared";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmModal } from "@/shared/components/ui/ConfirmModal";
import {
  useAddFoodToMeal,
  useAddMeal,
  useDeleteMeal,
  useDietMeals,
  useRemoveMealItem,
  useUpdateMeal,
  useUpdateMealItem,
} from "@/shared/hooks/useNutrition";
import { AddFoodQuantityModal } from "./AddFoodQuantityModal";
import { AddMealModal } from "./AddMealModal";
import { EditFoodModal } from "./EditFoodModal";
import { EditMealTimeModal } from "./EditMealTimeModal";
import { FoodSelector } from "./FoodSelector";
import { MealCard } from "./MealCard";

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
  const deleteMealMutation = useDeleteMeal();

  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditTimeModalOpen, setIsEditTimeModalOpen] = useState(false);
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);
  const [isConfirmDeleteMealOpen, setIsConfirmDeleteMealOpen] = useState(false);

  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<DietMealItem | null>(null);
  const [editingMeal, setEditingMeal] = useState<DietMeal | null>(null);
  const [pendingFood, setPendingFood] = useState<{
    food: Food;
    calculatedQuantity?: number;
  } | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [mealToDeleteId, setMealToDeleteId] = useState<string | null>(null);

  const meals = allMeals.filter((m) => m.day_of_week === dayOfWeek);

  const handleDeleteMeal = async (id: string) => {
    try {
      await deleteMealMutation.mutateAsync(id);
      toast.success("Refeição removida com sucesso!");
      setIsConfirmDeleteMealOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover refeição.");
    }
  };

  const handleConfirmQuantity = async (quantity: number, food?: Food) => {
    const foodToAdd = food || pendingFood?.food;
    if (!selectedMealId || !foodToAdd) return;

    try {
      setIsFoodModalOpen(false);
      setIsQuantityModalOpen(false);
      setPendingFood(null);

      await addFoodMutation.mutateAsync({
        diet_meal_id: selectedMealId,
        food_id: foodToAdd.id,
        quantity,
        unit: foodToAdd.serving_unit,
        order_index: 999,
      });
      toast.success(`${foodToAdd.name} adicionado!`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar alimento.");
    }
  };

  if (isLoading && allMeals.length === 0)
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Carregando refeições...
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          Refeições do Dia
        </h3>
      </div>

      <div className="space-y-4">
        {meals
          .sort((a, b) => a.meal_order - b.meal_order)
          .map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onAddFood={(id) => {
                setSelectedMealId(id);
                setIsFoodModalOpen(true);
              }}
              onEditTime={(m) => {
                setEditingMeal(m);
                setIsEditTimeModalOpen(true);
              }}
              onEditItem={(item) => {
                setEditingItem(item);
                setIsEditModalOpen(true);
              }}
              onRemoveItem={(id) => {
                setItemToDelete(id);
                setIsDeleteConfirmOpen(true);
              }}
              onDeleteMeal={() => {
                setMealToDeleteId(meal.id);
                setIsConfirmDeleteMealOpen(true);
              }}
            />
          ))}

        <button
          onClick={() => setIsAddMealModalOpen(true)}
          className="w-full py-8 border-2 border-dashed border-white/5 rounded-3xl text-zinc-500 hover:text-zinc-400 hover:border-white/10 transition-all flex flex-col items-center justify-center gap-3 group mt-4"
        >
          <div className="p-3 rounded-full bg-white/5 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <span className="font-black text-[10px] uppercase tracking-[0.3em]">
            Provisionar Nova Refeição
          </span>
        </button>
      </div>

      {isFoodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsFoodModalOpen(false)}
          />
          <div className="relative bg-surface border border-white/10 rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-foreground">Seleção de Alimentos</h3>
              <button
                onClick={() => setIsFoodModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4 flex-1 overflow-hidden">
              <FoodSelector
                onSelect={(food, q) => {
                  if (q) handleConfirmQuantity(q, food);
                  else {
                    setPendingFood({ food, calculatedQuantity: q });
                    setIsQuantityModalOpen(true);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      <EditFoodModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={(id, q) => {
          updateItemMutation.mutate({ id, quantity: q });
        }}
        item={editingItem}
      />

      <EditMealTimeModal
        isOpen={isEditTimeModalOpen}
        onClose={() => {
          setIsEditTimeModalOpen(false);
          setEditingMeal(null);
        }}
        onSave={(time) =>
          editingMeal && updateMealMutation.mutate({ id: editingMeal.id, meal_time: time })
        }
        currentTime={editingMeal?.meal_time || undefined}
        mealName={editingMeal?.name || ""}
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

      <AddMealModal
        isOpen={isAddMealModalOpen}
        onClose={() => setIsAddMealModalOpen(false)}
        onSave={async (name, time) => {
          try {
            await addMealMutation.mutateAsync({
              diet_plan_id: dietPlanId,
              day_of_week: dayOfWeek,
              name,
              meal_time: time,
              meal_type: "custom" as any,
              meal_order: meals.length + 1,
            });
            setIsAddMealModalOpen(false);
          } catch (error: any) {
            toast.error(error.message || "Erro ao adicionar refeição.");
          }
        }}
      />

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsDeleteConfirmOpen(false)}
          />
          <div className="relative bg-surface border border-white/10 rounded-xl w-full max-w-sm shadow-2xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Remover Alimento?</h3>
            <p className="text-muted-foreground mb-6">
              Esta ação removerá permanentemente o alimento desta refeição.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 text-muted-foreground hover:text-foreground text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (itemToDelete) {
                    removeFoodMutation.mutate(itemToDelete, {
                      onSuccess: () => toast.success("Alimento removido!"),
                      onError: () => toast.error("Erro ao remover alimento."),
                    });
                  }
                  setIsDeleteConfirmOpen(false);
                }}
                className="px-6 py-2 bg-red-500 text-white rounded-lg font-bold text-sm hover:bg-red-600 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmDeleteMealOpen}
        onClose={() => setIsConfirmDeleteMealOpen(false)}
        onConfirm={() => mealToDeleteId && handleDeleteMeal(mealToDeleteId)}
        title="Excluir Refeição"
        description="Tem certeza que deseja remover esta refeição e todos os alimentos nela? Esta ação não pode ser desfeita."
        confirmLabel="Excluir Refeição"
        variant="danger"
      />
    </div>
  );
}

function _CustomMealModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, time: string) => void;
}) {
  return <AddMealModal isOpen={isOpen} onClose={onClose} onSave={onSave} />;
}
