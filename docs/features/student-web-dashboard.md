# Feature: Student Web Dashboard

**Status:** done
**Branch:** `feature/student-web-dashboard`
**PRD:** [docs/PRDs/student-web-dashboard.md](../PRDs/student-web-dashboard.md)
**Roles:** `student` (managed), `member` (autonomous)

---

## O que foi implementado

Dashboard web para alunos com duas variações de perfil: `student` (gerenciado por especialista, consumo apenas) e `member` (autônomo, cria e gerencia os próprios planos via fluxo de periodização completo).

---

## Rotas

| Rota | Componente | Acesso |
|------|-----------|--------|
| `/dashboard/student` | `StudentHomePage` | student + member |
| `/dashboard/student/workouts` | redireciona para `/dashboard/workouts` | ambos |
| `/dashboard/student/workouts/[id]` | `StudentWorkoutDetailPage` | ambos |
| `/dashboard/student/workouts/new` | redireciona para `/dashboard/workouts` | member only |
| `/dashboard/student/nutrition` | `StudentNutritionPage` | ambos |
| `/dashboard/student/nutrition/new` | `DietCreatorPage` | member only (guard via accountType) |
| `/dashboard/student/progress` | `StudentProgressPage` | ambos |
| `/dashboard/student/coach` | AI coach page existente | ambos |
| `/dashboard/student/profile` | `StudentProfilePage` | ambos |
| `/dashboard/workouts/*` | fluxo de periodização completo | member + specialist |

O layout `/dashboard/layout.tsx` redireciona `student` e `member` para `/dashboard/student` se tentarem acessar rotas do profissional. Exibe navegação própria: Início · Treinos · Nutrição · Progresso · Coach IA · Perfil.

### Fluxo de treinos para `member`

O aluno autônomo usa o mesmo fluxo hierárquico do especialista em `/dashboard/workouts/*`:

```
Periodização → Fase → Treino → Exercícios
```

- `WelcomeBanner` em todas as 4 páginas indica a etapa atual do fluxo
- `CreatePeriodizationModal` aceita `memberStudentId` e cria com `student_id = auth.uid()`
- `MemberWorkoutBuilderPage` e `StudentWorkoutsPage` foram **deletadas** — sem fluxo paralelo

---

## Módulos e arquivos principais

```
web/src/modules/student-dashboard/
  components/
    DayOverviewCard.tsx         — card de treino do dia + plano alimentar ativo
    EmptyPlanState.tsx          — empty state diferenciado: student passivo, member com CTAs
    Field.tsx                   — input label wrapper
    GamificationBar.tsx         — streak + badges
    SpecialistLinkSection.tsx   — lista vínculos ativos + gerar código
    WorkoutCard.tsx
  hooks/
    useStudentDashboardData.ts  — streak, achievements, diet, workouts, studentId
  pages/
    StudentHomePage.tsx
    StudentNutritionPage.tsx
    StudentProfilePage.tsx
    StudentProgressPage.tsx
    StudentWorkoutDetailPage.tsx

web/src/modules/workouts/
  components/
    WelcomeBanner.tsx           — banner de progresso do fluxo (etapas 1-4)
    CreatePeriodizationModal    — aceita memberStudentId para criar como member
  pages/
    PeriodizationsPage          — isMember prop altera copy e oculta seletor de aluno
    PeriodizationDetailsPage    — Server Component com data fetching
    PhaseDetailsPage
    WorkoutDetailsPage

web/src/modules/nutrition/
  components/
    HealthDataConsentModal.tsx  — consentimento LGPD antes de criar plano alimentar
  pages/
    DietCreatorPage.tsx         — criador completo de plano alimentar para member
```

---

## Decisões notáveis

- **Web = informação, mobile = execução**: telas web são somente leitura para sessões de treino e logs de refeição. A execução permanece no mobile.
- **`student` sem empty state de criação**: aluno gerenciado não vê CTAs de criação — vê mensagem passiva.
- **`member` usa fluxo de periodização completo**: sem tela simplificada separada. Mesmo hierarquia do especialista com adaptações de copy.
- **Consentimento LGPD no criador de dieta**: `HealthDataConsentModal` exibido na primeira vez; `useHealthDataConsent` persiste no localStorage + loga no Supabase.
- **Migrations adicionadas**: `0013_nutrition_rls.sql` (RLS para diet_plans/diet_meals), `0014_backfill_member_account_type.sql` (backfill de account_type para membros existentes).

---

## LGPD

- `HealthDataConsentModal` implementado para coleta de dados alimentares (`diet_plans`)
- `workout_sessions` acessada em `StudentProgressPage` — coberta pela RLS `student_id = auth.uid()`
- Migrations de RLS aplicadas para nutrição (`0013_nutrition_rls.sql`)
