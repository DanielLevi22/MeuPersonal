# Ordem de Implementação — MeuPersonal

> Sequência definitiva de features. Cada PRD só começa quando o anterior está com `Status: done`.
> Exceção: features marcadas com `(paralelo)` podem ser implementadas simultaneamente.

---

## Fase 0 — Fundação (infraestrutura e arquitetura)

| # | Feature | PRD | Status |
|---|---------|-----|--------|
| 0.1 | Ambiente de desenvolvimento local | [local-dev-environment.md](local-dev-environment.md) | ✅ done |
| 0.2 | Auditoria e refactor do banco | [database-audit-and-refactor.md](database-audit-and-refactor.md) | ✅ done |
| 0.3 | Mapeamento do sistema | [system-analysis.md](system-analysis.md) | ✅ done |
| 0.4 | Arquitetura do schema completo | [schema-architecture.md](schema-architecture.md) | 🔄 em andamento |
| 0.5 | CI e otimização Vercel | [ci-and-vercel-optimization.md](ci-and-vercel-optimization.md) | ⏳ pendente |
| 0.6 | Pipeline de deploy Vercel | [vercel-pipeline-deploy.md](vercel-pipeline-deploy.md) | ⏳ pendente |

---

## Fase 1 — Auth

> Pré-requisito: 0.4 concluído (schema aprovado e migrations geradas)

| # | Feature | PRD | Status |
|---|---------|-----|--------|
| 1.1 | Setup do pacote shared (AuthService, authStore, tipos) | [auth/01-shared-setup.md](auth/01-shared-setup.md) | ✅ done |
| 1.2 | Cadastro do especialista (web + mobile) | [auth/02-professional-registration.md](auth/02-professional-registration.md) | ✅ done |
| 1.3 | Login (web + mobile) | auth/03-login.md | ⏳ pendente |
| 1.4 | Recuperação de senha | auth/04-password-recovery.md | ⏳ pendente |

---

## Fase 2 — Students

> Pré-requisito: 1.2 concluído (especialista consegue se cadastrar)

| # | Feature | PRD | Status |
|---|---------|-----|--------|
| 2.1 | Vínculo aluno ↔ especialista (criação de conta + códigos de convite) | [students/01-student-linking.md](students/01-student-linking.md) | 🔄 aprovado, aguarda migrations |
| 2.2 | Perfil e anamnese do aluno | students/02-student-anamnesis.md | ⏳ pendente |
| 2.3 | Avaliação física | students/03-physical-assessments.md | ⏳ pendente |

---

## Fase 3 — Workouts

> Pré-requisito: 2.1 concluído (alunos vinculados existem no sistema)

| # | Feature | PRD | Status |
|---|---------|-----|--------|
| 3.1 | Catálogo de exercícios | workouts/01-exercises-catalog.md | ⏳ pendente |
| 3.2 | Periodizações e planos de treino | workouts/02-periodizations.md | ⏳ pendente |
| 3.3 | Execução de treino (mobile) | workouts/03-workout-execution.md | ⏳ pendente |
| 3.4 | Histórico de sessões | workouts/04-workout-history.md | ⏳ pendente |

---

## Fase 4 — Nutrition

> Pré-requisito: 2.1 concluído (paralelo com Fase 3)

| # | Feature | PRD | Status |
|---|---------|-----|--------|
| 4.1 | Catálogo de alimentos | nutrition/01-foods-catalog.md | ⏳ pendente |
| 4.2 | Planos alimentares e refeições | nutrition/02-diet-plans.md | ⏳ pendente |
| 4.3 | Registro de refeições (meal log) | nutrition/03-meal-logging.md | ⏳ pendente |

---

## Fase 5 — Gamification

> Pré-requisito: 3.3 e 4.3 concluídos (há eventos para gamificar)

| # | Feature | PRD | Status |
|---|---------|-----|--------|
| 5.1 | Streaks e metas diárias | gamification/01-streaks.md | ⏳ pendente |
| 5.2 | Conquistas e XP | gamification/02-achievements.md | ⏳ pendente |

---

## Fase 6 — Chat

> Pré-requisito: 2.1 concluído (precisa do vínculo para existir conversa)

| # | Feature | PRD | Status |
|---|---------|-----|--------|
| 6.1 | Conversas e mensagens em tempo real | chat/01-conversations.md | ⏳ pendente |

---

## Fase 7 — System / Admin

> Pré-requisito: todas as fases anteriores em produção

| # | Feature | PRD | Status |
|---|---------|-----|--------|
| 7.1 | Feature flags e controle de acesso por plano | system/01-feature-flags.md | ⏳ pendente |
| 7.2 | Painel admin | system/02-admin-panel.md | ⏳ pendente |

---

## Fase 8 — Roadmap futuro (fora do MVP)

| Feature | Observação |
|---------|-----------|
| `member` (aluno autônomo) | Depende do módulo de IA estar pronto |
| Pagamentos (Stripe + Asaas) | Após lançamento do MVP |
| Notificações push | Infraestrutura pronta, integração pendente |
| AI body scan (assessment) | Feature de roadmap |

---

## Regras desta tabela

- Ao criar um novo PRD, adicionar aqui na fase correta com status `⏳ pendente`
- Ao aprovar o PRD, manter `⏳ pendente` — o status do PRD em si controla aprovação
- Ao concluir a feature (PR mergeado, docs atualizados), mudar para `✅ done`
- Nunca pular uma fase sem justificativa registrada
