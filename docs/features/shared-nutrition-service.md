# Spec Técnica: shared-nutrition-service

**PRD:** [docs/PRDs/shared-nutrition-service.md](../PRDs/shared-nutrition-service.md)
**Branch:** `feature/shared-nutrition-service`
**Data:** 2026-04-18

---

## O que foi implementado

Centralização de todas as queries do módulo nutrition em `shared/src/services/nutrition.service.ts`,
eliminando duplicação entre app e web e alinhando os nomes de tabelas ao schema canônico.

---

## Arquivos criados

### `shared/src/services/nutrition.service.ts`

Factory `createNutritionService(supabase)` com as operações:

| Grupo | Funções |
|-------|---------|
| Foods | `fetchFoods`, `searchFoods`, `createFood` |
| Diet Plans | `fetchDietPlans`, `fetchDietPlanById`, `createDietPlan`, `updateDietPlan`, `deleteDietPlan`, `finishDietPlan`, `cloneDietPlan` |
| Diet Meals | `fetchDietMeals`, `createDietMeal`, `updateDietMeal`, `deleteDietMeal`, `pasteDietDay`, `clearDietDay` |
| Diet Meal Items | `addFoodToMeal`, `updateMealItem`, `removeFoodFromMeal` |
| Meal Logs | `fetchMealLogs`, `fetchMealLogsByRange`, `toggleMealLog`, `updateMealLogItems` |

### `shared/src/types/nutrition.types.ts`

Tipos canônicos alinhados ao schema PostgreSQL:

- `Food` — `calories/protein/carbs/fat: number | null`
- `DietPlan` — `name: string | null`, `status: 'active' | 'finished'` (sem `is_active`, sem `description`)
- `DietMeal` — `name: string`, `day_of_week: number | null`, `meal_time: string | null`
- `DietMealItem` — com `food: Food` aninhado nas queries join
- `MealLog` — `actual_items: unknown | null`
- `CreateDietMealInput` — `name: string` obrigatório

---

## Arquivos modificados

### `shared/src/index.ts`

Exporta `createNutritionService`, todos os tipos canônicos e `CreateDietMealInput`.

### `web/src/shared/hooks/useNutrition.ts`

Reescrito para delegar ao service. Instância de módulo:
```ts
const nutritionService = createNutritionService(supabase);
```

Inline queries removidas. `useNutritionProgress` e `useStudentNutritionStats` mantidos inline
(tabelas fora do escopo do service).

### `app/src/modules/nutrition/store/nutritionStore.ts`

- `addMeal` agora aceita `CreateDietMealInput` (com `name: string` obrigatório)
- `dailyLogs` tipado como `Record<string, MealLog>` (antes `DailyLog[]`)
- `DailyLog` local removido; usa `MealLog` do shared

### Componentes mobile atualizados

| Arquivo | Mudança |
|---------|---------|
| `DailyNutrition.tsx` | `?? 0` em todos os acessos de macros nullable |
| `MealCard.tsx` | Interface food aceita `number \| null` |
| `NutritionScreen.tsx` | `item.notes` (era `item.description`); import de shared |
| `StudentNutritionScreen.tsx` | `meal_time ?? undefined`; food param nullable |
| `FoodSearchScreen.tsx` | `FoodItem` interface com macros nullable |
| `NutriBotService.ts` | Import de shared (era core) |
| `ShoppingListService.ts` | Import de shared (era core) |
| `routes/index.ts` | Removida re-exportação de `DailyLog` (tipo removido) |
| `progress.tsx` | `?? 0` em food macro arithmetic |
| `full-diet.tsx` | `name` obrigatório no `addMeal`; null guards |
| `students/[id]/nutrition/index.tsx` | Tipos nullable no renderItem |

### Componentes web atualizados

| Arquivo | Mudança |
|---------|---------|
| `FoodSelector.tsx` | Import de shared |
| `MealEditor.tsx` | Import de shared |
| `DietDetailsHeader.tsx` | Import de shared; `?? 0` em target macros; `name ?? ""` |
| `DietCard.tsx` | Import de shared; date null guards |
| `AddFoodQuantityModal.tsx` | Import de shared; `?? 0` em macro arithmetic |
| `EditFoodModal.tsx` | Import de shared |
| `MealCard.tsx` | Import de shared; `?? 0` em mealTotals reducer |
| `ProgressCharts.tsx` | `actual_items` cast para `Record<string, number> \| null` |
| `exportDietPDF.ts` | Interfaces locais com campos nullable; null guards |
| `diets/new/page.tsx` | Removido `personal_id: ""` (campo não existe no schema canônico) |

### Testes atualizados

| Arquivo | Mudança |
|---------|---------|
| `nutritionSubstitution.test.ts` | 3 mocks `.then` para cobrir SELECT + INSERT + UPDATE do `toggleMealLog` |
| `nutritionStore.test.ts` | Mock de `meal_logs` inclui `maybeSingle` para o SELECT inicial |

---

## Decisões técnicas

**`meal_foods` como alias:** `useDietMeals` mapeia `diet_meal_items → meal_foods` internamente para
manter compatibilidade com `MealCard` (web) e `exportDietPDF` sem alterar escopo do PRD.

**`isActive` ignorado em `useUpdateDietPlanStatus`:** parâmetro preservado na assinatura pública
(backward compat com `DietDetailsHeader`) mas ignorado — apenas `status` é persistido.

**`useNutritionProgress` e `useStudentNutritionStats` inline:** dependem de `nutrition_progress`
e lógica de stats complexa — fora do escopo do service, mantidos inline no hook.

**Tipos `number | null`:** o schema Supabase permite NULL em campos de macros. O código anterior
usava `number` não-nullable via tipos do `@meupersonal/core`, causando erros silenciosos.
A migração expõe esses nulls e força `?? 0` nos pontos de uso aritmético.
