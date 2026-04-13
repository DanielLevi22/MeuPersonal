# Feature: local-dev-environment

**Concluída em:** 2026-04-13
**Branch:** feature/local-dev-environment
**PRD:** [docs/PRDs/local-dev-environment.md](../PRDs/local-dev-environment.md)

---

## O que foi feito

### Schema Drizzle — reescrito do zero

24 tabelas canônicas em `app/drizzle/schema/`:

| Arquivo | Tabelas |
|---------|---------|
| `auth.ts` | `profiles`, `professional_services` |
| `students.ts` | `student_professionals`, `physical_assessments`, `student_anamnesis` |
| `nutrition.ts` | `foods`, `diet_plans`, `diet_meals`, `diet_meal_items`, `meal_logs` |
| `workouts.ts` | `exercises`, `periodizations`, `training_plans`, `workouts`, `workout_exercises`, `workout_sessions`, `workout_session_exercises` |
| `gamification.ts` | `student_streaks`, `daily_goals`, `achievements` |
| `chat.ts` | `conversations`, `messages` |
| `system.ts` | `feature_flags`, `feature_access` |

### Migrations — 3 arquivos

| Arquivo | Conteúdo |
|---------|----------|
| `0000_schema.sql` | DDL de todas as 24 tabelas (gerado via drizzle-kit) |
| `0001_rls_and_triggers.sql` | RLS em todas as tabelas, trigger `handle_new_user()`, helper `is_professional_of()` |
| `0002_rpcs.sql` | RPC `create_student_account()` — SECURITY DEFINER |

### Supabase CLI local (Docker)

- `supabase/config.toml` configurado na porta 54321
- Migrations espelhadas em `supabase/migrations/`
- `supabase/seed.sql` com 50 alimentos (TACO) e 55 exercícios
- `supabase db reset` passa sem erros

### Ambientes configurados

| Ambiente | URL | Arquivo local |
|----------|-----|---------------|
| Local (Docker) | `http://127.0.0.1:54321` | `app/.env.local`, `web/.env.local` |
| Dev (Supabase cloud) | `https://lcwzijtunmlvvrqtproh.supabase.co` | `app/.env.development`, `web/.env` |
| Prod (Supabase cloud) | `https://ceosfvvgaeffabqrfnit.supabase.co` | `app/.env.production` |

---

## Decisões técnicas

- **Schema novo vs migração**: schema reescrito do zero. Produção existente mantida como referência enquanto o rewrite acontece por módulo.
- **`supabase/migrations/` vs `app/drizzle/migrations/`**: ambos existem. Drizzle é fonte da verdade para DDL. Supabase CLI copia das migrations Drizzle.
- **Seed**: dados de referência (alimentos TACO + exercícios) inseridos no seed local. Não aplicar em prod manualmente.
- **Prod cloud**: projeto antigo (`ceosfvvgaeffabqrfnit`) mantido como produção. Novo projeto dev para desenvolvimento.

---

## Pendências conhecidas

- `web/.env`: `SUPABASE_SERVICE_ROLE_KEY` e `DATABASE_URL` do dev cloud ainda precisam ser preenchidos manualmente
- Migrations dev/prod cloud: aplicar via SQL Editor quando as features estiverem estabilizadas (não antes)
