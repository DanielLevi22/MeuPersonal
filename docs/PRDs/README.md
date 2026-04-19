# Eleva Pro — Índice de PRDs

> Leia este arquivo antes de qualquer sessão de trabalho.
> Todo PRD novo entra aqui antes de ser implementado.

---

## Estado atual do produto

**Nome:** Eleva Pro (era MeuPersonal)
**Launch target:** Abril 2026
**Stack:** React Native + Expo (mobile) / Next.js (web) / Supabase (backend)
**Implementado:** ~75% das features core

---

## Mapa de PRDs

### Aprovados — podem ser implementados agora

| PRD | Arquivo | Branch | Prioridade |
|---|---|---|---|
| AI Coach Chat (especialista) | [ai/ai-coach-chat.md](ai/ai-coach-chat.md) | `feature/ai-coach-chat` | 🔴 Alta |
| AI Aluno Autônomo | [ai/ai-student-autonomous.md](ai/ai-student-autonomous.md) | — | 🔴 Alta |

### Em draft — aprovação antes de implementar

| PRD | Arquivo | Bloqueia | Prioridade |
|---|---|---|---|
| Engagement Loop | [product/engagement-loop.md](product/engagement-loop.md) | Retenção de alunos | 🟠 Média-Alta |
| Billing / Assinaturas | [product/billing.md](product/billing.md) | Todos os gates de plano | 🟠 Média-Alta |
| Specialist Dashboard | [product/specialist-dashboard.md](product/specialist-dashboard.md) | — | 🟡 Média |
| Admin Panel | [product/admin-panel.md](product/admin-panel.md) | Launch público | 🟡 Média |
| AI Pricing (gates) | [ai/ai-pricing.md](ai/ai-pricing.md) | Depende do Billing | 🟡 Média |
| AI Specialist Engagement | [ai/ai-specialist-engagement.md](ai/ai-specialist-engagement.md) | WhatsApp | 🟢 Baixa |
| AI Marketplace | [ai/ai-marketplace.md](ai/ai-marketplace.md) | Billing + Dashboard | 🟢 Baixa |

### Fundação (não são features, são referências)

| Documento | Arquivo | Propósito |
|---|---|---|
| Branding Eleva Pro | [product/branding.md](product/branding.md) | Nome, cores, voz, posicionamento |
| Arquitetura Técnica | ../../ELEVA_ARCHITECTURE.md | North star técnico — ler antes de codar |
| Índice de IA | [ai/README.md](ai/README.md) | Visão geral dos módulos de IA e custos |

---

## Ordem de implementação recomendada

```
1. ai-coach-chat          ✅ PRD aprovado, branch criada
   ↓
2. engagement-loop        retém alunos desde o dia 1
   ↓
3. billing                infraestrutura bloqueante para todos os gates
   ↓
4. ai-student-autonomous  depende dos gates do billing
   ↓
5. specialist-dashboard   evolução do dashboard atual
   ↓
6. admin-panel            obrigatório antes do launch público
   ↓
7. ai-pricing (gates)     configuração fina dos planos
   ↓
8. ai-specialist-engagement  WhatsApp + alertas avançados
   ↓
9. ai-marketplace         feature de crescimento pós-launch
```

---

## Regras do processo

1. **Nenhuma feature começa sem PRD aprovado** (status: approved)
2. **Nenhuma adição de escopo** após aprovação — novo PRD para novas ideias
3. **Feature só é `done`** com: lint ✓ + testes ✓ + PR mergeado + docs/features/ atualizado
4. **Toda nova tabela:** RLS habilitado antes de qualquer dado entrar
5. **Toda feature de IA:** custo por sessão documentado antes de ir para prod

---

## Glossário rápido de papéis

| Termo | Significado |
|---|---|
| Especialista | Personal trainer ou nutricionista — paga o plano |
| Aluno gerenciado | Tem especialista ativo — usa a plataforma de graça |
| Aluno autônomo | Sem especialista — paga plano próprio |
| Orquestrador | Claude Sonnet 4.6 — conduz o chat de IA por módulo |
| Sub-agente | Claude Haiku 4.5 — gera JSON estruturado (mais barato) |
| BFF | Backend For Frontend — Next.js como camada de API |
