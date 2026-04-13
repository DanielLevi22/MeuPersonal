# System Mapping — Mapeamento Completo do Sistema

> **Status:** ✅ Concluído em 2026-04-13
> **Objetivo:** Entender feature por feature o que existe, o que funciona, o que é código morto e quais decisões de schema tomar — antes de qualquer reescrita.
> **Resultado:** Base para a reescrita modular completa do sistema.

---

## Status geral dos módulos

| Módulo | Status | Relatório detalhado |
|--------|--------|---------------------|
| **Auth** | ✅ Mapeado | [AUTH_MODULE_REPORT.md](AUTH_MODULE_REPORT.md) |
| **Students** | ✅ Mapeado | [STUDENTS_MODULE_REPORT.md](STUDENTS_MODULE_REPORT.md) |
| **Nutrition** | ✅ Mapeado | [NUTRITION_MODULE_REPORT.md](NUTRITION_MODULE_REPORT.md) |
| **Workouts** | ✅ Mapeado | [WORKOUTS_MODULE_REPORT.md](WORKOUTS_MODULE_REPORT.md) |
| **Assessment** | ✅ Mapeado | [ASSESSMENT_MODULE_REPORT.md](ASSESSMENT_MODULE_REPORT.md) |
| **Gamification** | ✅ Mapeado | [GAMIFICATION_MODULE_REPORT.md](GAMIFICATION_MODULE_REPORT.md) |
| **Chat** | ✅ Mapeado | [CHAT_MODULE_REPORT.md](CHAT_MODULE_REPORT.md) |
| **System/Admin** | ✅ Mapeado | [SYSTEM_MODULE_REPORT.md](SYSTEM_MODULE_REPORT.md) |

---

## Decisões tomadas — Auth

**Roles (account_type):**
- `admin` — Daniel gerencia a plataforma
- `professional` — personal trainer e/ou nutricionista
- `managed_student` — criado e gerenciado pelo profissional
- `autonomous_student` — fluxo de cadastro autônomo (roadmap, não existe ainda)

**Aprovação de profissional:**
- Profissional se cadastra → `account_status = pending`
- Admin aprova manualmente → `account_status = active`
- Enquanto `pending`: acesso bloqueado por RLS

**Tipos de serviço do profissional:**
- Escolhidos no cadastro (personal_training, nutrition_consulting, ou ambos)
- Tabela separada `professional_services` — um profissional pode ter múltiplos tipos

**Campos a remover de `profiles`:**
`invite_code`, `phone`, `cref`, `crn`, `professional_bio`, `is_verified`, `verified_at`,
`admin_notes`, `last_login_at` — todos legados, nunca usados de forma funcional

**Campos a mover de `profiles`:**
- `weight`, `height` → `physical_assessments`
- `xp`, `level` → gamification (campo na própria tabela ou `student_streaks`)

---

## Divergências críticas identificadas (schema Drizzle vs produção real)

| Schema Drizzle (errado) | Produção real (correto) | Ação |
|------------------------|------------------------|------|
| `student_professionals` | `coachings` | Renomear para `student_professionals` no novo schema |
| `periodizations` | `training_periodizations` | Manter `periodizations` (mais simples) |
| `diet_plans` / `diet_meals` / `diet_meal_items` | `nutrition_plans` / `meals` / `meal_foods` | Manter nomes do Drizzle (mais específicos) |
| — | `student_anamnesis` | Adicionar ao schema |
| — | `conversations` + `messages` | Adicionar ao schema |

> **Decisão:** projeto novo, nomes novos. Drizzle vence — nomes mais semânticos e sem colisões.

---

## Schema canônico — tabelas finais

```
Auth
  profiles                    → id, email, full_name, avatar_url, account_type,
                                account_status, is_super_admin, birth_date, gender
  professional_services       → professional_id, service_type, is_active

Students
  student_professionals       → professional_id, student_id, service_type, status
  physical_assessments        → student_id, peso, altura, dobras, circunferências, fotos, BMI, BMR
  student_anamnesis           → student_id, responses (jsonb), completed_at

Nutrition
  foods                       → name, calories, protein, carbs, fat, fiber, serving_size, is_custom
  diet_plans                  → professional_id, student_id, name, status
  diet_meals                  → diet_plan_id, name, meal_time, day_of_week
  diet_meal_items             → diet_meal_id, food_id, quantity
  meal_logs                   → student_id, diet_meal_id, logged_date, completed

Workouts
  exercises                   → name, muscle_group, is_verified, created_by
  periodizations              → professional_id, student_id, objective, status
  training_plans              → periodization_id, name, order
  workouts                    → training_plan_id, title, day_of_week
  workout_exercises           → workout_id, exercise_id, sets, reps, rest, notes
  workout_sessions            → student_id, workout_id, started_at, finished_at, intensity
  workout_session_exercises   → session_id, exercise_id, sets_data (jsonb)

Gamification
  student_streaks             → student_id, current_streak, longest_streak, xp, level
  daily_goals                 → student_id, date, water_target, water_completed,
                                meals_completed, workout_completed, completed
  achievements                → student_id, type, points, unlocked_at

Chat
  conversations               → professional_id, student_id, last_message_at
  messages                    → conversation_id, sender_id, receiver_id,
                                content, message_type, media_url, read_at

System
  feature_flags               → flag_key, is_enabled, rollout_percentage
  feature_access              → subscription_tier, feature_key, limit_value, is_enabled
```

**Total: 25 tabelas** (eram 21 no Drizzle anterior — faltavam anamnesis, conversations, messages, professional_services)

---

## Código morto confirmado

| Módulo | O que é | Ação |
|--------|---------|------|
| Auth | Fluxo de invite code (web + mobile) | Deletar na reescrita de Auth |
| Auth | Campos legados em profiles (cref, crn, phone, etc.) | Não criar no novo schema |
| Students | `student_invites` — 0 rows, não usado | Não criar no novo schema |
| Students | `coachings` — renomear, não recriar |  Migrar para `student_professionals` |
| Nutrition | Notificações de refeição (kill switch ativo) | Não portar para o novo código |
| Workouts | `workout_logs` — 0 referências no código | Não criar no novo schema |

---

## Plano de reescrita — ordem definida

> **Estratégia:** cada módulo é reescrito em uma branch. O legado convive durante a branch.
> O PR que entra em `development` já sai limpo — legado deletado no mesmo commit.

```
feature/schema-foundation   → Drizzle reescrito + aplicado nos projetos Supabase dev e prod
feature/rewrite-auth        → profiles, professional_services, fluxo de aprovação
feature/rewrite-students    → student_professionals, physical_assessments, anamnesis
feature/rewrite-nutrition   → diet_plans, diet_meals, diet_meal_items, meal_logs, foods
feature/rewrite-workouts    → periodizations, training_plans, workouts, workout_sessions
feature/rewrite-assessment  → AI body scan, integração com anamnesis
feature/rewrite-gamification→ streaks, daily_goals, achievements, xp
feature/rewrite-chat        → conversations, messages, realtime
feature/rewrite-system      → feature_flags, feature_access, admin panel
```

---

## Referências

Para detalhes técnicos de cada módulo, consultar os relatórios:

- [Auth](AUTH_MODULE_REPORT.md) · [Students](STUDENTS_MODULE_REPORT.md) · [Nutrition](NUTRITION_MODULE_REPORT.md)
- [Workouts](WORKOUTS_MODULE_REPORT.md) · [Assessment](ASSESSMENT_MODULE_REPORT.md)
- [Gamification](GAMIFICATION_MODULE_REPORT.md) · [Chat](CHAT_MODULE_REPORT.md) · [System](SYSTEM_MODULE_REPORT.md)
