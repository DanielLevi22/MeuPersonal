# Feature: Student Web Dashboard

**Status:** done
**Branch:** `feature/auth-student-registration`
**PRD:** [docs/PRDs/student-web-dashboard.md](../PRDs/student-web-dashboard.md)
**Roles:** `student` (managed), `member` (autonomous)

---

## O que foi implementado

Dashboard web para alunos com duas variações de perfil: `student` (gerenciado por especialista, consumo apenas) e `member` (autônomo, cria e gerencia os próprios planos).

---

## Rotas

| Rota | Componente | Acesso |
|------|-----------|--------|
| `/dashboard/student` | `StudentHomePage` | student + member |
| `/dashboard/student/workouts` | `StudentWorkoutsPage` | student + member |
| `/dashboard/student/workouts/[id]` | `StudentWorkoutDetailPage` | student + member |
| `/dashboard/student/workouts/new` | `MemberWorkoutBuilderPage` | member only (redirect student) |
| `/dashboard/student/nutrition` | `StudentNutritionPage` | student + member |
| `/dashboard/student/nutrition/new` | `MemberDietBuilderPage` | member only (redirect student) |
| `/dashboard/student/progress` | `StudentProgressPage` | student + member |
| `/dashboard/student/coach` | `StudentCoachPage` (existente) | student + member |
| `/dashboard/student/profile` | `StudentProfilePage` | student + member |

O layout `/dashboard/layout.tsx` redireciona `student` e `member` para `/dashboard/student` e exibe navegação própria com 5 itens (Início, Treinos, Nutrição, Progresso, Coach IA, Perfil).

---

## Mudanças de schema

### Migration `0012_member_owned_workouts.sql`
- `workouts.specialist_id` passou de `NOT NULL` para `NULL`
- Adicionado `workouts.student_id uuid NULL FK → profiles.id`
- Constraint `CHECK (specialist_id IS NOT NULL OR student_id IS NOT NULL)` garante sempre um dono

### Tipos atualizados
- `Workout.specialist_id: string | null`
- `Workout.student_id: string | null`
- `CreateWorkoutInput.specialist_id?: string | null`
- `CreateWorkoutInput.student_id?: string | null`
- `CreateDietPlanInput.specialist_id?: string | null`

---

## Fluxo de vínculo aluno–especialista (Fluxo B)

1. Aluno acessa Perfil → gera código de 6 caracteres (válido 24h) via `student_link_codes`
2. Repassa o código ao especialista
3. Especialista insere o código no seu dashboard → cria registro em `student_specialists`

Tabelas envolvidas: `student_link_codes`, `student_specialists`.

O aluno pode encerrar um vínculo ativo pela mesma tela de Perfil.

---

## CASL — abilities do `member`

```typescript
can("manage", ["Workout", "Diet", "Exercise", "Food"]);
can("read",   "Profile");
can("update", "Profile");
```

---

## Módulos e arquivos principais

```
web/src/modules/student-dashboard/
  components/
    DayOverviewCard.tsx
    EmptyPlanState.tsx          — empty state com CTAs para member
    Field.tsx                   — input label wrapper compartilhado
    GamificationBar.tsx
    SpecialistLinkSection.tsx   — lista vínculos ativos + gerar código
    WorkoutCard.tsx
  hooks/
    useStudentDashboardData.ts  — streak, achievements, diet, workouts
    useStudentLinks.ts          — fetchLinks, generateCode, endLink
  pages/
    MemberDietBuilderPage.tsx
    MemberWorkoutBuilderPage.tsx
    StudentHomePage.tsx
    StudentNutritionPage.tsx
    StudentProfilePage.tsx
    StudentProgressPage.tsx
    StudentWorkoutDetailPage.tsx
    StudentWorkoutsPage.tsx
  __tests__/
    useStudentDashboardData.test.ts  — 13 testes
    useStudentLinks.test.ts          — 10 testes
```

Serviços adicionados em `shared/src/services/students.service.ts`:
- `fetchStudentLinks(studentId)` — vínculos ativos do aluno com nome do especialista
- `endStudentLink(linkId, studentId)` — encerra vínculo (status=inactive)

---

## Decisões notáveis

- **Web = informação, mobile = execução**: telas web são somente leitura para sessões de treino e logs de refeição. A execução permanece no mobile.
- **`student` sem empty state de criação**: aluno gerenciado não vê CTAs de criação — vê mensagem passiva orientando a aguardar o especialista.
- **`member` cria com IA ou manualmente**: empty state exibe dois botões — "Criar com IA" (→ `/coach`) e "Criar você mesmo" (→ `/workouts/new` ou `/nutrition/new`).
- **`CreateWorkoutInput.specialist_id` não auto-injetado**: o caller é responsável por passar `specialist_id` (specialist) ou `student_id` (member). Remoção do auto-inject de `supabase.auth.getUser()` do hook.
- **`SERVICE_TYPE` centralizado em `useStudentLinks.ts`**: `SpecialistLinkSection` importa de lá em vez de redeclarar.

---

## LGPD

O campo `workouts.student_id` e o acesso a `workout_sessions` em `StudentProgressPage` devem ser formalmente registrados em `docs/LGPD_COMPLIANCE.md`. Avaliar com `/lgpd-check` quando o skill estiver disponível.
