# Status dos Módulos — MeuPersonal

> **Atualizado em:** 2026-04-18 (shared-nutrition-service)
> **Regra:** atualizar ao fechar cada PR. Nenhuma feature é `done` sem este arquivo atualizado.

---

## Legenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Completo e documentado |
| 🔄 | Implementado, spec técnica pendente |
| ⚠️ | Parcial / em andamento |
| ❌ | Não iniciado |
| N/A | Não aplicável nesta plataforma |

---

## Estado atual dos módulos

| Módulo | Web | Mobile | Spec (`docs/features/`) | Testes Web | Testes Mobile |
|--------|-----|--------|--------------------------|------------|---------------|
| **Auth** | ✅ | ✅ | 🔄 pendente | N/A | ⚠️ parcial |
| **Nutrition** | ✅ | ✅ | ✅ | ⚠️ parcial | ⚠️ parcial |
| **Workouts** | ✅ | ✅ | 🔄 pendente | ⚠️ parcial | ⚠️ parcial |
| **Students** | ✅ | ⚠️ parcial | 🔄 pendente | ⚠️ parcial | ⚠️ parcial |
| **Assessment** | N/A | ✅ | 🔄 pendente | N/A | ⚠️ parcial |
| **Chat** | ⚠️ parcial | ⚠️ parcial | ❌ | ❌ | ❌ |
| **Gamification** | ⚠️ parcial | ⚠️ parcial | ❌ | ❌ | ❌ |
| **AI / Agentes** | ❌ | ❌ | ⚠️ draft (blueprint) | ❌ | ❌ |
| **Packages / Shared** | ✅ centralizado (students + auth + workouts + nutrition) | ✅ centralizado (students + auth + workouts + nutrition) | ✅ | N/A | N/A |
| **Database Schema** | ✅ | ✅ | ✅ | N/A | N/A |

---

## PRDs ativos

| PRD | Feature | Status | Branch |
|-----|---------|--------|--------|
| [ci-and-vercel-optimization](PRDs/ci-and-vercel-optimization.md) | CI path filters + Vercel ignoreCommand | ✅ done | `feature/ci-and-vercel-optimization` |
| [vercel-pipeline-deploy](PRDs/vercel-pipeline-deploy.md) | Deploy via GitHub Actions + Vercel CLI | ✅ done | `feature/ci-and-vercel-optimization` |
| [database-audit-and-refactor](PRDs/database-audit-and-refactor.md) | Schema limpo: 21 tabelas, RLS, RPC, seeds | ✅ done | `feature/database-audit-and-refactor` |
| [students-schema-alignment](PRDs/students-schema-alignment.md) | Alinha módulo students ao novo schema | ✅ done | `feature/students-schema-alignment` |
| [shared-students-service](PRDs/shared-students-service.md) | Serviço centralizado students + auth em shared/ | ✅ done | `feature/shared-students-service` |
| [shared-workouts-service](PRDs/shared-workouts-service.md) | Serviço centralizado workouts em shared/ | ✅ done | `feature/shared-workouts-service` |
| [shared-nutrition-service](PRDs/shared-nutrition-service.md) | Serviço centralizado nutrition em shared/ | ✅ done | `feature/shared-nutrition-service` |
| [local-dev-environment](PRDs/local-dev-environment.md) | 3 ambientes: Local→Preview→Production | draft | — |
| [social-and-engagement](PRDs/social-and-engagement.md) | Comunidade, ranking, chat, notificações | draft | — |

> Adicionar linha aqui ao criar um novo PRD via `node scripts/new-feature.js`.

---

## Dívidas técnicas ativas

| # | Descrição | Prioridade | ADR relacionado |
|---|-----------|------------|-----------------|
| 1 | `packages/core` e `packages/supabase` duplicados em web e app — já divergiram (students, auth, workouts e nutrition centralizados) | 🟡 Média | [ADR-002](decisions/002-flat-monorepo.md) |
| 2 | Specs técnicas dos módulos implementados pendentes (auth, workouts, students) | 🟡 Média | — |
| 3 | Separação de ambientes Supabase (dev/preview/prod) pendente — dev e prod no mesmo projeto | 🔴 Alta | — |
| 4 | Testes de cobertura insuficientes em todos os módulos | 🟡 Média | — |
| 5 | Código mobile/web ainda referencia tabelas antigas (meals, nutrition_plans, coachings) — precisa ser atualizado para o novo schema | 🔴 Alta | — |

---

## Próximas features planejadas

> Mover para `docs/PRDs/` ao iniciar. Não começar sem PRD aprovado.

1. **Criar projetos Supabase Preview + Production** e aplicar as 3 migrations (`local-dev-environment`)
2. **Atualizar código** para usar novo schema (diet_plans, diet_meals, student_professionals...)
3. Migração de packages para `/packages/` na raiz (ADR-002)
4. Spec técnica de Nutrição (`docs/features/nutrition.md`)
5. Spec técnica de Workouts (`docs/features/workouts.md`)
6. AI: primeiro agente — nutrição via Next.js BFF (ADR-001)
