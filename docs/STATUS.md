# Status dos Módulos — MeuPersonal

> **Atualizado em:** 2026-04-12 (ci-and-vercel-optimization)
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
| **Nutrition** | ✅ | ✅ | 🔄 pendente | ⚠️ parcial | ⚠️ parcial |
| **Workouts** | ✅ | ✅ | 🔄 pendente | ⚠️ parcial | ⚠️ parcial |
| **Students** | ✅ | ⚠️ parcial | 🔄 pendente | ⚠️ parcial | ⚠️ parcial |
| **Assessment** | N/A | ✅ | 🔄 pendente | N/A | ⚠️ parcial |
| **Chat** | ⚠️ parcial | ⚠️ parcial | ❌ | ❌ | ❌ |
| **Gamification** | ⚠️ parcial | ⚠️ parcial | ❌ | ❌ | ❌ |
| **AI / Agentes** | ❌ | ❌ | ⚠️ draft (blueprint) | ❌ | ❌ |
| **Packages / Shared** | ⚠️ duplicado | ⚠️ duplicado | N/A | N/A | N/A |

---

## PRDs ativos

| PRD | Feature | Status | Branch |
|-----|---------|--------|--------|
| [ci-and-vercel-optimization](PRDs/ci-and-vercel-optimization.md) | CI path filters + Vercel ignoreCommand | ✅ done | `feature/ci-and-vercel-optimization` |
| [vercel-pipeline-deploy](PRDs/vercel-pipeline-deploy.md) | Deploy via GitHub Actions + Vercel CLI | ✅ done | `feature/ci-and-vercel-optimization` |
| [database-audit-and-refactor](PRDs/database-audit-and-refactor.md) | Auditoria e refatoração do banco | draft | — |
| [local-dev-environment](PRDs/local-dev-environment.md) | 3 ambientes: Local→Preview→Production | draft | — |

> Adicionar linha aqui ao criar um novo PRD via `node scripts/new-feature.js`.

---

## Dívidas técnicas ativas

| # | Descrição | Prioridade | ADR relacionado |
|---|-----------|------------|-----------------|
| 1 | `packages/core` e `packages/supabase` duplicados em web e app — já divergiram | 🔴 Alta | [ADR-002](decisions/002-flat-monorepo.md) |
| 2 | Specs técnicas de todos os módulos implementados estão pendentes | 🟡 Média | — |
| 3 | Separação de ambientes Supabase (dev/staging/prod) pendente | 🔴 Alta | — |
| 4 | Testes de cobertura insuficientes em todos os módulos | 🟡 Média | — |

---

## Próximas features planejadas

> Mover para `docs/PRDs/` ao iniciar. Não começar sem PRD aprovado.

1. Migração de packages para `/packages/` na raiz (ADR-002)
2. Spec técnica de Nutrição (`docs/features/nutrition.md`)
3. Spec técnica de Workouts (`docs/features/workouts.md`)
4. AI: primeiro agente — nutrição via Next.js BFF (ADR-001)
5. Students: completar web (perfil completo do aluno)
