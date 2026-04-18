# PRD: shared-nutrition-service

**Data de criação:** 2026-04-18
**Status:** approved
**Branch:** feature/shared-nutrition-service
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Criar `shared/src/services/nutrition.service.ts` com `createNutritionService(supabase)` — todas as queries do módulo nutrition como funções puras async, seguindo o padrão de `workouts.service.ts`.

### Por quê?
`app/nutritionStore.ts` tem queries Supabase inline misturadas com estado Zustand. `web/useNutrition.ts` duplica as mesmas queries. Ambos usam nomes de tabelas divergentes do schema canônico (`nutrition_plans`/`meals` vs `diet_plans`/`diet_meals`). A centralização elimina duplicação, alinha ao schema real e habilita Server Components no Next.js.

### Como saberemos que está pronto?
- [ ] `shared/src/services/nutrition.service.ts` com `createNutritionService(supabase)`
- [ ] `shared/src/types/nutrition.types.ts` com tipos canônicos alinhados ao schema
- [ ] `app/nutritionStore.ts` migrado — queries inline removidas, delega ao service
- [ ] `web/src/shared/hooks/useNutrition.ts` migrado para usar o service
- [ ] Nomes de tabelas alinhados ao schema canônico: `diet_plans`, `diet_meals`, `diet_meal_items`, `meal_logs`, `foods`
- [ ] `tsc --noEmit` e `biome check` limpos
- [ ] Testes existentes passando

---

## Escopo

### Incluído

**Foods:** `fetchFoods(query)`, `createFood`

**Diet Plans:** `fetchDietPlans(specialistId)`, `fetchDietPlanById(id)`, `createDietPlan`, `updateDietPlan`, `deleteDietPlan`

**Diet Meals:** `fetchDietMeals(planId)`, `createDietMeal`, `updateDietMeal`, `deleteDietMeal`, `pasteDietDay(sourceDayIndex, targetDayIndex, planId)`

**Diet Meal Items:** `addFoodToMeal`, `updateMealItem`, `removeFoodFromMeal`, `clearDietDay`

**Meal Logs:** `fetchMealLogs(studentId, date)`, `createMealLog`, `importDiet`

### Fora do escopo
- `AnalysisService`, `FoodRecognitionService`, `NutiBot` — lógica de IA/análise, escopo separado
- Refatoração de componentes ou telas de UI
- Novas features ou campos no schema

---

## Tabelas do banco

| Tabela | Operação | Observação |
|--------|----------|------------|
| `foods` | SELECT, INSERT | Catálogo de alimentos |
| `diet_plans` | SELECT, INSERT, UPDATE, DELETE | Planos dietéticos (substitui `nutrition_plans`) |
| `diet_meals` | SELECT, INSERT, UPDATE, DELETE | Refeições do plano (substitui `meals`) |
| `diet_meal_items` | SELECT, INSERT, UPDATE, DELETE | Alimentos em refeições (substitui `meal_foods`) |
| `meal_logs` | SELECT, INSERT | Registro de refeições executadas |

---

## Decisões técnicas

**Alinhamento de nomes:** o schema canônico usa `diet_plans`/`diet_meals`/`diet_meal_items` — o código atual usa `nutrition_plans`/`meals`/`meal_foods`. A migração corrige esses nomes em todos os arquivos.

**`AnalysisService` fora do escopo:** tem lógica de IA (Gemini) e análise nutricional — risco alto de quebra, dívida separada.

**RPC `paste_diet_day`:** verificar se existe no Supabase atual; se não, implementar a lógica no service sem RPC.

---

## Checklist de done

- [ ] Código passou em lint + typecheck + testes
- [ ] PR mergeado em `development`
- [ ] `docs/features/shared-nutrition-service.md` criado
- [ ] `docs/STATUS.md` atualizado
