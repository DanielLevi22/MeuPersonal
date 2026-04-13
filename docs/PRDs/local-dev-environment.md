# PRD: local-dev-environment

**Data de criação:** 2026-04-12
**Atualizado em:** 2026-04-13
**Status:** done
**Branch:** feature/local-dev-environment
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Reescrever o schema Drizzle com as 25 tabelas canônicas definidas no mapeamento, criar os 2 projetos Supabase (dev e prod), aplicar o schema limpo em ambos e configurar todos os ambientes — variáveis locais, GitHub Secrets e Vercel — de forma que seja impossível desenvolver contra produção por acidente.

### Por quê?
Dois problemas bloqueantes antes de qualquer reescrita de módulo:
1. O schema Drizzle está desalinhado com o que o sistema precisa (nomes errados, 4 tabelas faltando) — qualquer código escrito sobre ele vai precisar ser refeito
2. Dev e prod apontam para o mesmo banco — um erro de migration em desenvolvimento afeta dados reais

Resolver os dois juntos é o pré-requisito de tudo que vem depois.

### Como saberemos que está pronto?
- [ ] Schema Drizzle reescrito com as 25 tabelas canônicas — sem campos legados
- [ ] 3 migrations geradas e sem erros de SQL
- [ ] Projeto Supabase **dev** criado e schema aplicado (migrations 0000 + 0001 + 0002)
- [ ] Projeto Supabase **prod** criado e schema aplicado
- [ ] Seeds (foods + exercises) aplicados no projeto dev
- [ ] `app/.env.development` apontando para dev
- [ ] `app/.env.production` apontando para prod
- [ ] `web/.env.local` apontando para dev
- [ ] GitHub Secrets configurados para dev e prod
- [ ] Vercel: `development` → banco dev, `main` → banco prod
- [ ] App mobile rodando localmente contra banco dev (confirmado)
- [ ] Web rodando localmente contra banco dev (confirmado)
- [ ] `tsc --noEmit` limpo
- [ ] `docs/features/local-dev-environment.md` criado

---

## Contexto

O mapeamento completo do sistema (`docs/SYSTEM_MAPPING.md`) identificou que o schema Drizzle anterior tinha:
- 4 tabelas faltando: `professional_services`, `student_anamnesis`, `conversations`, `messages`
- Nomes errados: `coachings` → `student_professionals`, `training_periodizations` → `periodizations`
- Campos legados em `profiles` (cref, crn, invite_code, phone, etc.) que não devem existir
- Projeto Supabase único para dev e prod — risco crítico antes do lançamento

O `database-audit-and-refactor` foi concluído (PR #32 mergeado). As migrations antigas estão arquivadas. Esta branch começa do zero.

---

## Arquitetura de ambientes

```
LOCAL / feature/*   →   DEVELOPMENT          →   PRODUCTION
Banco dev               Banco dev                Banco prod
app/.env.development    GitHub Secrets DEV       GitHub Secrets PROD
web/.env.local          Vercel Preview URL       Vercel Production URL
```

| Branch | Ambiente | Supabase | Vercel |
|--------|----------|----------|--------|
| `feature/*` | Local | Projeto dev | — |
| `development` | Dev/Preview | Projeto dev | Preview URL |
| `main` | Production | Projeto prod | Production URL |

---

## Escopo

### Incluído

**Schema Drizzle — reescrita completa (`app/drizzle/schema/`):**
- `auth.ts` → `profiles`, `professional_services`
- `students.ts` → `student_professionals`, `physical_assessments`, `student_anamnesis`
- `nutrition.ts` → `foods`, `diet_plans`, `diet_meals`, `diet_meal_items`, `meal_logs`
- `workouts.ts` → `exercises`, `periodizations`, `training_plans`, `workouts`, `workout_exercises`, `workout_sessions`, `workout_session_exercises`
- `gamification.ts` → `student_streaks`, `daily_goals`, `achievements`
- `chat.ts` → `conversations`, `messages`
- `system.ts` → `feature_flags`, `feature_access`

**Migrations (`app/drizzle/migrations/`):**
- `0000` — todas as 25 tabelas e FKs (gerado via drizzle-kit)
- `0001` — RLS em todas as tabelas + trigger `on_auth_user_created` + helper `is_professional_of()`
- `0002` — RPCs: `create_student_account` (SECURITY DEFINER)

**Seeds (`app/drizzle/seeds/`):**
- `foods.sql` — 50 alimentos TACO
- `exercises.sql` — 55 exercícios por grupo muscular

**Infraestrutura:**
- Criar projetos Supabase dev e prod (Daniel no dashboard)
- Aplicar migrations em ambos (Daniel no SQL Editor)
- Configurar variáveis de ambiente locais
- Atualizar GitHub Secrets
- Configurar Vercel por branch

### Fora do escopo
- Reescrever qualquer código mobile ou web — zero mudanças em `app/src/` ou `web/src/`
- Migração de dados da produção atual — projetos novos, começam vazios
- RLS avançada por módulo — políticas básicas nesta fase
- Supabase CLI local / Supabase autohosted

---

## As 25 tabelas canônicas

```
Auth (2)
  profiles                  → id, email, full_name, avatar_url, account_type,
                              account_status, is_super_admin, birth_date, gender
  professional_services     → professional_id, service_type, is_active

Students (3)
  student_professionals     → professional_id, student_id, service_type, status
  physical_assessments      → student_id, weight, height, dobras, circunferências,
                              fotos, bmi, bmr, calculated fields
  student_anamnesis         → student_id, responses (jsonb), completed_at

Nutrition (5)
  foods                     → name, calories, protein, carbs, fat, fiber,
                              serving_size, is_custom, created_by
  diet_plans                → professional_id, student_id, name, status
  diet_meals                → diet_plan_id, name, meal_time, day_of_week
  diet_meal_items           → diet_meal_id, food_id, quantity
  meal_logs                 → student_id, diet_meal_id, logged_date, completed

Workouts (7)
  exercises                 → name, muscle_group, is_verified, created_by
  periodizations            → professional_id, student_id, objective, status
  training_plans            → periodization_id, name, order
  workouts                  → training_plan_id, title, day_of_week
  workout_exercises         → workout_id, exercise_id, sets, reps, rest, notes
  workout_sessions          → student_id, workout_id, started_at, finished_at, intensity
  workout_session_exercises → session_id, exercise_id, sets_data (jsonb)

Gamification (3)
  student_streaks           → student_id, current_streak, longest_streak, xp, level
  daily_goals               → student_id, date, water_target, water_completed,
                              meals_completed, workout_completed, completed
  achievements              → student_id, type, points, unlocked_at

Chat (2)
  conversations             → professional_id, student_id, last_message_at
  messages                  → conversation_id, sender_id, receiver_id,
                              content, message_type, media_url, read_at

System (2)
  feature_flags             → flag_key, is_enabled, rollout_percentage
  feature_access            → subscription_tier, feature_key, limit_value, is_enabled
```

---

## GitHub Secrets necessários

| Secret | Uso |
|--------|-----|
| `EXPO_PUBLIC_SUPABASE_URL_DEV` | CI mobile + builds dev |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV` | CI mobile + builds dev |
| `NEXT_PUBLIC_SUPABASE_URL_DEV` | CI web + Vercel preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV` | CI web + Vercel preview |
| `EXPO_PUBLIC_SUPABASE_URL_PROD` | Builds produção |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY_PROD` | Builds produção |
| `NEXT_PUBLIC_SUPABASE_URL_PROD` | Vercel production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD` | Vercel production |

---

## Ordem de execução

```
[Agente]  1. Reescreve schema Drizzle (25 tabelas)
[Agente]  2. Gera migrations via drizzle-kit
[Agente]  3. Escreve migration 0001 (RLS + triggers) manualmente
[Agente]  4. Escreve migration 0002 (RPCs) manualmente
[Daniel]  5. Cria projeto Supabase dev no dashboard
[Daniel]  6. Cria projeto Supabase prod no dashboard
[Daniel]  7. Aplica 0000 + 0001 + 0002 no dev (SQL Editor)
[Daniel]  8. Aplica 0000 + 0001 + 0002 no prod (SQL Editor)
[Daniel]  9. Aplica seeds no dev
[Daniel] 10. Configura app/.env.development e app/.env.production
[Daniel] 11. Configura web/.env.local
[Daniel] 12. Atualiza GitHub Secrets
[Daniel] 13. Configura Vercel por branch
[Agente] 14. Valida tsc --noEmit e fecha o PRD
```

---

## Checklist de done

- [ ] Schema Drizzle reescrito — 25 tabelas, sem campos legados
- [ ] 3 migrations geradas e documentadas
- [ ] Projeto Supabase dev criado e schema aplicado
- [ ] Projeto Supabase prod criado e schema aplicado
- [ ] Seeds aplicados no dev
- [ ] Variáveis de ambiente locais configuradas
- [ ] GitHub Secrets atualizados
- [ ] Vercel configurado por branch
- [ ] App e web rodando localmente contra banco dev
- [ ] `tsc --noEmit` limpo
- [ ] PR mergeado em `development`
- [ ] `docs/features/local-dev-environment.md` criado
- [ ] `docs/STATUS.md` atualizado
