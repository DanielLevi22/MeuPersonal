# Spec Técnica: shared-gamification-service

**PRD:** [docs/PRDs/shared-gamification-service.md](../PRDs/shared-gamification-service.md)
**Branch:** `feature/shared-gamification-service`
**Data:** 2026-04-18

---

## O que foi implementado

Centralização de todas as queries do módulo gamification em `shared/src/services/gamification.service.ts`,
criação do módulo estruturado `app/src/modules/gamification/`, e remoção de arquivos legados
(`achievementService`, `streakService`, `gamificationNotificationService`).

---

## Arquivos criados

### `shared/src/services/gamification.service.ts`

Factory `createGamificationService(supabase)` com as operações:

| Grupo | Funções |
|-------|---------|
| Daily Goals | `getDailyGoal`, `getWeeklyGoals`, `updateMealProgress`, `updateWorkoutProgress`, `calculateDailyGoals` |
| Streaks | `getStreak`, `useStreakFreeze` |
| Achievements | `getAchievements` |
| Ranking | `fetchLeaderboard(startDate, scope, specialistId?)` |

### `shared/src/types/gamification.types.ts`

Tipos canônicos: `DailyGoal`, `Achievement`, `StudentStreak`, `LeaderboardEntry`,
`LeaderboardPeriod`, `LeaderboardScope`.

### `app/src/modules/gamification/`

Módulo estruturado com:
- `store/gamificationStore.ts` — Zustand store usando `createGamificationService`
- `index.ts` — API pública do módulo

---

## Arquivos modificados

### `shared/src/index.ts`

Exporta `createGamificationService` e todos os tipos de gamification.

### `app/src/store/gamificationStore.ts`

Transformado em shim de re-exportação do novo local canônico, mantendo todos os
consumers existentes funcionando sem alteração.

### `app/src/app/(tabs)/ranking.tsx`

Lógica de leaderboard (duas estratégias: `my_students` e `global`) extraída para
`gamificationService.fetchLeaderboard`. Import de `supabase` mantido para instanciar o factory.
`LeaderboardEntry` agora importado de `@meupersonal/shared`.

### Componentes atualizados (type imports)

| Arquivo | Mudança |
|---------|---------|
| `components/gamification/ConsistencyHeatmap.tsx` | `DailyGoal` de shared |
| `components/gamification/WeeklyBarChart.tsx` | `DailyGoal` de shared |
| `components/gamification/WeeklyProgress.tsx` | `DailyGoal` de shared |
| `components/nutrition/StudentNutritionAnalytics.tsx` | `DailyGoal` + factory de shared |
| `app/(tabs)/students/[id]/analytics.tsx` | `DailyGoal` + factory de shared |

---

## Arquivos removidos

| Arquivo | Motivo |
|---------|--------|
| `app/src/services/gamification.ts` | Substituído pelo shared service |
| `app/src/services/achievementService.ts` | Nunca consumido fora dos testes |
| `app/src/services/streakService.ts` | Idem; usava tabela legada `student_streaks` |
| `app/src/services/gamificationNotificationService.ts` | Nunca consumido por ninguém |
| `app/src/packages/core/services/achievementService.ts` | Duplicata morta em packages/core |
| `app/src/packages/core/services/streakService.ts` | Idem |
| `app/src/services/__tests__/achievementService.test.ts` | Teste do service removido |
| `app/src/services/__tests__/streakService.test.ts` | Idem |

---

## Decisões técnicas

**Shim de re-exportação em `store/gamificationStore.ts`:** o arquivo antigo foi mantido como
re-export do novo local para evitar atualizar ~8 consumers — compatibilidade sem custo.

**`biome-ignore` em `useStreakFreeze`:** o Biome confunde `gamificationService.useStreakFreeze`
com um React hook pelo prefixo `use`. Supressão pontual com comentário explicativo.

**`gamificationNotificationService` removido:** dependia de `achievementService` e `streakService`
(deletados) e não tinha nenhum consumer — código morto.
