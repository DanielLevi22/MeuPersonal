# Feature: shared-workouts-service

**Status:** done  
**PR:** #42 (mergeado em `main`)  
**Data:** 2026-04-18  
**Branch:** `feature/shared-workouts-service`

---

## O que foi implementado

Centralização de toda a lógica de queries do módulo workouts em `shared/`, seguindo o padrão já estabelecido com `students.service.ts`.

### Arquivos criados

| Arquivo | Conteúdo |
|---------|----------|
| `shared/src/types/workouts.types.ts` | Tipos canônicos: `Workout`, `WorkoutExercise`, `Exercise`, `Periodization`, `TrainingPlan`, `WorkoutSession`, `SessionItem`, `TrainingStatus`, inputs de criação/update |
| `shared/src/services/workouts.service.ts` | `createWorkoutsService(supabase)` — factory injetável com todas as queries |

### Campos canônicos (breaking changes vs schema antigo)

| Campo antigo | Campo novo |
|---|---|
| `workout.items` | `workout.exercises` |
| `workoutExercise.rest_time` | `workoutExercise.rest_seconds` |
| `workoutExercise.order` | `workoutExercise.order_index` |
| `personal_id` / `professional_id` | `specialist_id` |
| `periodization.type` | `periodization.objective` |
| `status: 'draft'` | `status: 'planned'` |
| `TrainingPlan.training_split` | removido |
| `TrainingPlan.weekly_frequency` | removido |

### App (React Native) — arquivos migrados

- `workoutStore.ts` — queries inline removidas, delega ao service
- `screens/`: `WorkoutsScreen`, `WorkoutDetailsScreen`, `ExecuteWorkoutScreen`, `PeriodizationsScreen`, `PeriodizationDetailsScreen`, `PhaseDetailsScreen`, `CreatePeriodizationScreen`, `SelectExercisesScreen`
- `components/`: `EditExerciseModal`, `WorkoutExerciseCard`
- `hooks/useProgressionAnalysis.ts`
- `utils/progressionUtils.ts`
- `app/(tabs)/students/[id]/workouts/index.tsx`
- `app/student/execute-workout.tsx`
- `app/workouts/[id].tsx`
- `modules/ai/components/PlanProposalCard.tsx`

### Web (Next.js) — arquivos migrados

- `useWorkouts.ts`, `useWorkoutMutations.ts`
- `usePeriodizations.ts`, `usePeriodizationMutations.ts`
- `useTrainingPlans.ts`, `useTrainingPlanMutations.ts`
- `useExercises.ts`, `useExerciseMutations.ts`
- Componentes e páginas de training-plans e workouts

### Infra

- `web/vitest.config.ts` — adicionado alias `@elevapro/shared → ../shared/src`
- `shared/src/index.ts` — exporta types e service de workouts

---

## Decisões técnicas

**`createWorkoutsService(supabase)` injetável:** permite uso tanto no web (Server Components, passando o client do servidor) quanto no app (passando o client do Expo). Sem singleton — cada chamador injeta seu próprio client.

**`workoutLogStore` fora do escopo:** timer de execução em tempo real e progresso de séries têm estado efêmero (não persiste entre renders). Migrar seria alto risco sem ganho imediato.

**Testes web:** `vitest.config.ts` precisou do alias `@elevapro/shared` para resolver o import em testes. O hook `useCreateWorkout` foi refatorado para chamar `supabase.auth.getUser()` diretamente no `mutationFn` (em vez de `useAuthUser`) para evitar race condition nos testes.

---

## Gates de qualidade

- [x] `tsc --noEmit` limpo — app e web
- [x] `biome check .` limpo — app e web
- [x] Jest 26/26 passando (mobile)
- [x] Vitest 108/108 passando (web)
- [x] Pre-commit e pre-push hooks passaram
