# PRD: shared-gamification-service

**Data de criação:** 2026-04-18
**Status:** done
**Branch:** feature/shared-gamification-service
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Criar `shared/src/services/gamification.service.ts` com `createGamificationService(supabase)` centralizando todas as queries do módulo gamification. Mover o código de `app/src/services/gamification.ts` para o shared, criar `app/src/modules/gamification/` com a estrutura canônica de módulo, e migrar `gamificationStore.ts` e `ranking.tsx` para usar o service centralizado.

### Por quê?
O gamification não tem módulo estruturado — o service vive em `app/src/services/` (fora dos módulos) e usa `supabase` singleton importado diretamente, igual ao padrão legado que foi corrigido em students/workouts/nutrition. Há também duplicatas mortas em `app/src/packages/core/services/` (achievementService, streakService) que nunca foram consumidas e devem ser removidas.

### Como saberemos que está pronto?
- [ ] `shared/src/services/gamification.service.ts` com `createGamificationService(supabase)`
- [ ] `shared/src/types/gamification.types.ts` com tipos canônicos
- [ ] `app/src/modules/gamification/` criado com store, services, index
- [ ] `app/src/services/gamification.ts` removido (substituído pelo shared)
- [ ] `app/src/packages/core/services/achievementService.ts` e `streakService.ts` removidos
- [ ] `gamificationStore.ts` migrado para usar `createGamificationService`
- [ ] `ranking.tsx` migrado para usar o service (sem queries Supabase inline)
- [ ] `tsc --noEmit` e `biome check` limpos
- [ ] Testes existentes passando

---

## Escopo

### Incluído

**Daily Goals:** `getDailyGoal`, `getWeeklyGoals`, `updateMealProgress`, `updateWorkoutProgress`, `calculateDailyGoals`

**Streaks:** `getStreak`, `useStreakFreeze`

**Achievements:** `getAchievements`

**Ranking:** `fetchLeaderboard(specialistId?, period, startDate)` — extrai a lógica inline de `ranking.tsx`

### Fora do escopo
- Web (gamification não existe no web ainda)
- `achievementService.ts` em `packages/core` — remover sem substituir (nunca foi consumido)
- `streakService.ts` em `packages/core` — idem
- Novas features de gamification

---

## Tabelas do banco

| Tabela | Operação |
|--------|----------|
| `daily_goals` | SELECT, UPDATE |
| `student_streaks` | SELECT, UPDATE |
| `achievements` | SELECT |
| `ranking_scores` | SELECT |
| `coachings` | SELECT (para leaderboard de alunos do especialista) |
| `profiles` | SELECT (para nomes no leaderboard global) |

---

## Decisões técnicas

**`gamificationService` singleton → factory:** o padrão atual usa singleton com `supabase` importado diretamente. Migrar para `createGamificationService(supabase)` igual ao padrão adotado nos outros módulos.

**Ranking inline → service:** a lógica de leaderboard em `ranking.tsx` tem duas estratégias (my_students e global) com queries complexas — extrair para `fetchLeaderboard` no service.

**Duplicatas em `packages/core`:** `achievementService.ts` e `streakService.ts` nunca foram importados por ninguém. Remover sem substituir. A tabela correta é `student_streaks` (o nome `streaks` no PRD original estava errado).

---

## Checklist de done

- [ ] Código passou em lint + typecheck + testes
- [ ] PR mergeado em `development`
- [ ] `docs/features/shared-gamification-service.md` criado
- [ ] `docs/STATUS.md` atualizado
