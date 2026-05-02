# PRD: AI Student Personalized Coach — Índice

**Data de criação:** 2026-05-02
**Status:** approved
**Autor:** Daniel Levi

> Este documento é o índice. Cada fase tem seu próprio PRD detalhado.
> Consulte os sub-PRDs para implementação.

---

## As 3 perguntas obrigatórias

### O quê?
Um sistema de coaching de IA especializado para alunos com duas modalidades de interação — **Expresso** (plano completo com mínima fricção, anamnese pré-carregada) e **Analítico** (cada decisão explicada com problema que resolve, ciência por trás e alternativas descartadas) — combinado com análise visual de fotos corporais e de refeições que alimentam diretamente o raciocínio da IA.

### Por quê?
- **Aluno Pragmático** (50% da base): não quer configurar nada, quer o plano em 3 minutos. Hoje a experiência exige muitas trocas desnecessárias.
- **Aluno Experiente** (30%): tem histórico, questiona cada escolha, quer entender a lógica. Hoje a IA não oferece essa camada.
- **Análise visual subaproveitada**: scan de alimentos existe no mobile mas não está conectado ao coaching. Fotos corporais são coletadas mas o feedback é texto genérico.

### Como saberemos que está pronto?
- [ ] Aluno com anamnese completa cria plano completo em modo expresso com zero perguntas — apenas confirmação de dados e um toque
- [ ] Aluno sem anamnese suficiente é redirecionado para preenchê-la com campos faltantes indicados
- [ ] Em modo analítico, cada exercício e refeição inclui card de explicação (diagnóstico / por que este / alternativas descartadas)
- [ ] Aluno envia fotos corporais e a IA usa a análise para justificar prioridades de treino
- [ ] Aluno envia foto de refeição e recebe análise de macros + feedback conectado ao plano
- [ ] Botão "Adaptar treino de hoje" visível na tela de treino — sem abrir o chat
- [ ] Card de ganho/perda compara treino adaptado vs. plano original vs. não treinar nada
- [ ] ProgressionCard exibe projeção matemática honesta (intervalo, não número exato)
- [ ] Checkpoints na semana 2, mês 1 e mês 3 — coach proativo, não reativo

---

## Sub-PRDs (uma feature por documento)

| PRD | Fase | O que entrega | Status |
|---|---|---|---|
| [ai-student-coach-core.md](ai-student-coach-core.md) | 1 | Anamnese adaptativa (4 tracks), gate de perfil, modo expresso, `StudentCoachOrchestrator` | approved |
| [ai-student-coach-visual-analysis.md](ai-student-coach-visual-analysis.md) | 2 + 4 | Análise corporal (Sonnet + Vision), análise de refeição (Haiku + Vision), tabela `student_body_analyses` | approved |
| [ai-student-coach-explanation-engine.md](ai-student-coach-explanation-engine.md) | 3 | Modo analítico, motor de explicabilidade, Explanation Cards, tabela `ai_explanation_cards` | approved |
| [ai-student-coach-adaptive-surfaces.md](ai-student-coach-adaptive-surfaces.md) | 5 | Botões contextuais, card ganho/perda, ProgressionCard, notificações proativas, checkpoints, diagnóstico de plateau | approved |

---

## Arquitetura

| Documento | Propósito |
|---|---|
| [ai-orchestration-architecture.md](ai-orchestration-architecture.md) | Estrutura técnica: AIProvider interface, BaseOrchestrator, context loaders, pastas |
| [../../decisions/ADR-003-ai-architecture.md](../../decisions/ADR-003-ai-architecture.md) | Por que essa arquitetura — decisão formal |

---

## Relacionamento com outros PRDs

| PRD | Relação |
|---|---|
| [ai-student-autonomous.md](ai-student-autonomous.md) | Este PRD implementa onboarding e check-in visual com mais profundidade — complementa, não conflita |
| [ai-coach-chat.md](ai-coach-chat.md) | Reutiliza orquestradores existentes. Nenhuma mudança nos endpoints do especialista |
| [ai-pricing.md](ai-pricing.md) | Gates de feature por plano (análises/mês, modo analítico) referenciados nos sub-PRDs |

---

## Modelos por função

| Função | Modelo | Justificativa |
|---|---|---|
| Coach analítico (conversa) | Claude Sonnet 4.6 | Raciocínio multidimensional, formatação estruturada |
| Geração de plano expresso | Claude Sonnet 4.6 | Mesma qualidade, prompt mais conciso |
| Análise visual corporal | Claude Sonnet 4.6 + Vision | Vision nativa + context window adequada |
| Análise de refeição | Claude Haiku 4.5 + Vision | Tarefa estruturada, custo 10× menor |
| Assistente diário (modo expresso) | Claude Haiku 4.5 | Latência baixa, Q&A contextual |
| Adaptation/Plateau diagnostic | Claude Haiku 4.5 | Tarefa estruturada baseada em dados |

---

## Fases de entrega

```
Fase 1 — Core + Modo Expresso         (1 semana)
  Anamnese 4 tracks, gate de perfil, StudentCoachOrchestrator,
  onboarding expresso, PlanProposalCard
  → Sub-PRD: ai-student-coach-core.md

Fase 2 — Análise Corporal              (1 semana)
  Upload de fotos, BodyAnalysisFeedbackCard,
  prioridades alimentando o orquestrador
  → Sub-PRD: ai-student-coach-visual-analysis.md

Fase 3 — Motor de Explicabilidade      (1 semana)
  Modo analítico, ExplanationCards, alternância de modo
  → Sub-PRD: ai-student-coach-explanation-engine.md

Fase 4 — Análise de Refeição           (3-4 dias)
  MealFeedbackCard, integração com diário
  → Sub-PRD: ai-student-coach-visual-analysis.md

Fase 5 — Superfícies Adaptativas       (1-2 semanas)
  Botões contextuais, card ganho/perda, ProgressionCard,
  notificações, checkpoints, plateau diagnostic
  → Sub-PRD: ai-student-coach-adaptive-surfaces.md
```

**Pré-requisito antes da Fase 1:** refatoração da arquitetura de IA conforme `ai-orchestration-architecture.md` (estimativa: 2-3 dias).

---

## Novas tabelas (resumo)

| Tabela | Criada em | Propósito |
|---|---|---|
| `student_body_analyses` | Fase 2 | Análises visuais corporais com prioridades e risk flags |
| `ai_explanation_cards` | Fase 3 | Cards de explicação por item de treino/nutrição |
| `plan_projections` | Fase 5 | Projeção matemática de progresso + recalibrações |

**Colunas adicionadas a tabelas existentes:**
- `profiles.coach_mode` — Fase 1
- `profiles.persona_track` — Fase 1
- `profiles.ai_preferences` — Fase 5

---

## LGPD

Fotos corporais são dados biométricos sensíveis (tabela `student_body_analyses`). Consultar `docs/LGPD_COMPLIANCE.md` antes de implementar o upload. Base legal: consentimento explícito (art. 11, II, a). Implementar antes da Fase 2.
