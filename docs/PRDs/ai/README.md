# PRDs — Módulo de IA

Todos os PRDs relacionados às funcionalidades de inteligência artificial da plataforma.

---

## Índice

| PRD | Status | Descrição |
|---|---|---|
| [ai-coach-chat.md](ai-coach-chat.md) | approved | Chat do especialista com IA multi-agente para criar periodizações, fases, treinos e dietas |
| [ai-student-autonomous.md](ai-student-autonomous.md) | approved | Aluno autônomo: criação de plano via chat, check-in com visão, assistente diário, aprovação de ajustes |
| [ai-pricing.md](ai-pricing.md) | draft | Planos Free / Starter / Pro, trial de 21 dias, gates de funcionalidade e ganchos de conversão |
| [ai-specialist-engagement.md](ai-specialist-engagement.md) | draft | Alertas de risco de abandono, dashboard de carteira, vitrine de resultados, comunicação integrada |
| [ai-marketplace.md](ai-marketplace.md) | draft | Marketplace de especialistas: discovery, perfil verificado, reviews reais, leads e monetização |

---

## Arquitetura geral dos módulos de IA

```
Aluno Autônomo                    Especialista
  │                                   │
  ├── Onboarding chat ──────────────► Workout Orchestrator (Sonnet 4.6)
  ├── Assistente diário ───────────── Haiku 4.5
  ├── Check-in com visão ──────────── Sonnet 4.6 + Vision
  ├── Review semanal ───────────────── Haiku 4.5
  │                                   │
  └── Marketplace ◄──────────────────► Perfil público + Reviews verificados
                                       │
                                       └── Alertas de engajamento (Haiku 4.5)
```

## Modelos de IA por papel

| Papel | Modelo | Justificativa |
|---|---|---|
| Orquestradores (treino + nutrição) | Claude Sonnet 4.6 | Raciocínio complexo, tool use, prompt caching |
| Sub-agentes estruturados | Claude Haiku 4.5 | 10x mais barato, suficiente para JSON estruturado |
| Assistente diário | Claude Haiku 4.5 | Latência baixa, custo baixo, Q&A contextual |
| Análise de check-in com foto | Claude Sonnet 4.6 + Vision | Vision nativa + prompt caching para fotos |
| Lookup de alimentos (fallback) | Gemini 1.5 Flash | API key já existe, boa para busca de alimentos |

## Custo estimado de IA por usuário/mês

| Plano | Custo IA/mês | Receita | Margem bruta IA |
|---|---|---|---|
| Free | ~R$0,10 | R$0 | — |
| Starter | ~R$0,45 | R$19 | ~97% |
| Pro | ~R$1,12 | R$39 | ~97% |
| Aluno gerenciado (incluso no plano do especialista) | ~R$0,80 | — (incluso) | — |
