# PRD: shared-workouts-service

**Data de criação:** 2026-04-17
**Status:** approved
**Branch:** feature/shared-workouts-service
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Criar `shared/src/services/workouts.service.ts` com `createWorkoutsService(supabase)` — todas as queries do módulo workouts como funções puras async, seguindo o padrão de `students.service.ts`.

### Por quê?
`app/workoutStore.ts` tem 1055 linhas com queries Supabase inline. `web/` tem 6 hooks com queries duplicadas. Qualquer mudança de schema exige mexer nos dois. O service centralizado elimina a duplicação e habilita consumo por Server Components no Next.js.

### Como saberemos que está pronto?
- [ ] `shared/src/services/workouts.service.ts` com `createWorkoutsService(supabase)`
- [ ] `shared/src/types/workouts.types.ts` com tipos canônicos
- [ ] `app/workoutStore.ts` migrado — queries inline removidas
- [ ] `web/useWorkouts.ts`, `useWorkoutMutations.ts`, `usePeriodizations.ts`, `usePeriodizationMutations.ts`, `useTrainingPlans.ts`, `useTrainingPlanMutations.ts`, `useExercises.ts` migrados
- [ ] `web/useWorkouts.ts` corrigido: `personal_id` → `specialist_id`
- [ ] `tsc --noEmit` e `biome check` limpos
- [ ] Testes existentes passando

---

## Escopo

### Incluído

**Exercises:** `fetchExercises`, `createExercise`

**Workouts:** `fetchWorkouts(specialistId)`, `fetchWorkoutById(id)`, `createWorkout`, `updateWorkout`, `deleteWorkout`, `addExercisesToWorkout`, `removeExerciseFromWorkout`

**Periodizations:** `fetchPeriodizations(specialistId)`, `createPeriodization`, `updatePeriodization`, `deletePeriodization`

**Training Plans:** `createTrainingPlan`, `updateTrainingPlan`, `deleteTrainingPlan`, `cloneTrainingPlan`

**Workout Sessions:** `createWorkoutSession`, `saveSessionExercises`

### Fora do escopo
- Refatoração de UI (componentes, telas)
- `workoutLogStore.ts` — lógica de estado em tempo real, avaliar separado
- Novas features ou campos no schema

---

## Tabelas do banco

| Tabela | Operação |
|--------|----------|
| `exercises` | SELECT, INSERT |
| `workouts` | SELECT, INSERT, UPDATE, DELETE |
| `workout_exercises` | SELECT, INSERT, DELETE |
| `training_periodizations` | SELECT, INSERT, UPDATE, DELETE |
| `training_plans` | SELECT, INSERT, UPDATE, DELETE |
| `workout_sessions` | INSERT |
| `workout_session_exercises` | INSERT |

---

## Decisões técnicas

**`workoutLogStore` fora do escopo:** timer e progresso em tempo real — risco alto, dívida separada.

**`web/useWorkouts.ts` usa `personal_id`:** campo do schema antigo. Corrigir para `specialist_id` durante a migração.

---

## Checklist de done

- [ ] Código passou em lint + typecheck + testes
- [ ] PR mergeado em `development`
- [ ] `docs/features/shared-workouts-service.md` criado
- [ ] `docs/STATUS.md` atualizado
