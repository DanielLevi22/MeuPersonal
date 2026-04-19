# PRD: AI Student Autonomous — Assistente Autônomo do Aluno

**Data de criação:** 2026-04-19
**Status:** approved
**Branch:** feature/ai-student-autonomous
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Um módulo de IA autônomo para o aluno (gerenciado ou não-gerenciado) que permite criar seu próprio plano de treino e dieta via chat, fazer check-ins periódicos com fotos analisadas por visão computacional, acompanhar o progresso com diffs de antes/depois, e receber orientação diária de um assistente contextual — tudo limitado pelo plano de assinatura.

### Por quê?
Hoje o aluno é passivo: recebe o plano do especialista e segue. Alunos não-gerenciados não têm nenhum suporte de IA. Mesmo alunos gerenciados ficam sem acompanhamento entre as consultas. O objetivo é manter o foco 100% com IA: plano criado pelo próprio aluno, análise visual de progresso, assistente diário respondendo dúvidas e ajustando o plano com confirmação.

### Como saberemos que está pronto?
- [ ] Aluno (mobile ou web) consegue criar um plano completo de treino e dieta via chat de onboarding
- [ ] Aluno consegue fazer check-in com foto e receber análise de composição corporal estimada
- [ ] Sistema exibe card de antes/depois com diff explícito quando IA propõe alteração no plano
- [ ] Assistente diário responde perguntas contextuais ("posso trocar a refeição 2 por X?")
- [ ] Assistente diário sugere ajustes proativos baseados no histórico de check-ins
- [ ] Frequência de check-ins e análises é limitada pelo plano de assinatura
- [ ] Notificações chegam no mobile (push) e no web (perfil)
- [ ] Relatório semanal automático gerado por cron job
- [ ] Aluno sempre aprova mudanças antes de serem salvas no plano

---

## Contexto

O mobile já tem: fotos de alimentos com análise de macros, cozinha com sugestão de receitas baseadas no plano prescrito. A IA do especialista (ai-coach-chat) cria e gerencia planos do lado do profissional. Este módulo é o lado do aluno — auto-suficiente para não-gerenciados, complementar para gerenciados.

Os orquestradores de Treino e Nutrição do ai-coach-chat serão reaproveitados com prompts diferentes (contexto de aluno autônomo, sem especialista na conversa).

---

## Escopo

### Incluído

**Onboarding via chat (criação de plano)**
- Chat guiado para aluno sem plano (ou com plano antigo)
- Reaproveitamento dos orquestradores Workout + Nutrition (prompts adaptados para aluno autônomo)
- Salvamento progressivo com confirmação do aluno
- Disponível em mobile e web

**Check-in periódico com visão**
- Upload de foto(s) no check-in (frente, lado, costas)
- Análise com Claude Sonnet 4.6 + Vision: estimativa de progresso, composição corporal relativa
- Comparação com check-in anterior (diff visual e textual)
- Frequência de check-ins limitada por plano de assinatura
- Histórico de check-ins com galeria antes/depois

**Assistente diário contextual**
- Chat disponível todos os dias para perguntas e orientações
- Contexto: plano atual, último check-in, histórico de logs de treino e refeições
- Modelo: Claude Haiku 4.5 (rápido e barato para perguntas do dia a dia)
- Limite de interações por dia/semana definido pelo plano
- Disponível em mobile e web

**Ajustes de plano com aprovação**
- IA propõe ajuste (ex: "com base no check-in, reduzir carboidratos 15%")
- Aluno vê card antes/depois com diff explícito do que mudaria
- Aluno aprova ou rejeita
- Apenas após aprovação o plano é atualizado nas tabelas existentes

**Relatório semanal automático**
- Cron job (toda segunda-feira) gera relatório: check-ins da semana, aderência ao plano, progresso estimado
- Entregue como notificação + mensagem no assistente

**Notificações**
- Mobile: push via Expo Notifications
- Web: notificações no perfil do aluno (bell icon no dashboard)
- Tipos: lembrete de check-in, relatório semanal pronto, sugestão proativa do assistente, aprovação pendente de ajuste de plano

### Fora do escopo desta entrega
- Análise de postura em tempo real (streaming de câmera)
- Comparação entre alunos diferentes
- Integração com wearables (Apple Watch, Garmin)
- Relatório exportável em PDF
- Aluno gerenciado sobrescrevendo plano do especialista (conflito de permissões — escopo separado)

---

## Limites por plano de assinatura

| Feature | Plano Basic | Plano Pro | Plano Elite |
|---|---|---|---|
| Check-ins com análise visual | 2/mês | 8/mês | Ilimitado |
| Interações com assistente diário | 5/dia | 20/dia | Ilimitado |
| Criação de plano via chat | 1x | Ilimitado | Ilimitado |
| Relatório semanal | Mensal | Semanal | Semanal + diário |

> Nota: os limites exatos são definição de produto — os valores acima são referência para implementação. A lógica de gate usa a tabela `subscription_plans` (a criar).

---

## Arquitetura técnica

### Visão geral

```
Mobile / Web UI
    │ SSE streaming (chat) / REST (check-in upload)
    ▼
POST /api/ai/student/chat          → Assistente diário (Haiku 4.5)
POST /api/ai/student/onboarding    → Onboarding (Sonnet 4.6, orquestradores)
POST /api/ai/student/checkin       → Análise de check-in (Sonnet 4.6 + Vision)
GET  /api/ai/student/checkin/diff  → Diff antes/depois
POST /api/ai/student/plan/approve  → Aprovação de ajuste de plano
GET  /api/ai/student/report/weekly → Relatório semanal (gerado por cron)
```

### Modelos por função

| Função | Modelo | Justificativa |
|---|---|---|
| Onboarding (criação de plano) | Claude Sonnet 4.6 | Reaproveitamento dos orquestradores — raciocínio complexo |
| Análise de check-in com foto | Claude Sonnet 4.6 + Vision | Única opção com vision nativa no Claude |
| Assistente diário (perguntas) | Claude Haiku 4.5 | 10x mais barato, latência baixa, suficiente para Q&A |
| Geração de relatório semanal | Claude Haiku 4.5 | Tarefa estruturada, sem necessidade de raciocínio profundo |
| Lookup de alimentos (fallback) | Gemini 1.5 Flash | API key já existe, boa para busca de alimentos |

### Prompt caching

O contexto do aluno (plano atual + últimos 3 check-ins + logs da semana) é cacheado por 5 min. Em uma sessão de assistente com 10 perguntas, o contexto é enviado uma vez — redução de ~85% no custo da sessão.

---

## Fluxo de dados

### Onboarding (criação de plano)

```
Aluno abre "Criar meu plano" (sem especialista)
  → Verificar se já tem plano ativo
  → Se não: iniciar chat de onboarding
    → Módulo Router pergunta preferência: treino, nutrição ou ambos
    → Workout Orchestrator (prompt autônomo) conduz:
      objetivo → disponibilidade → nível → periodização → fases → treinos → exercícios
    → Nutrition Orchestrator (prompt autônomo) conduz:
      objetivo calórico → restrições → preferências → refeições → alimentos
  → Salvamento progressivo com confirmação do aluno
  → Histórico salvo em ai_chat_sessions (module='student_onboarding')
```

### Check-in com análise visual

```
Aluno faz upload de foto(s) no check-in
  → Verificar limite do plano (check-ins restantes no mês)
  → Se dentro do limite:
    → Buscar último check-in para comparação
    → Enviar foto(s) + contexto para Claude Sonnet 4.6 + Vision
    → Análise retorna: progresso estimado, pontos de atenção, sugestão de ajuste
    → Salvar análise em student_checkins
    → Se sugestão de ajuste → criar pending_plan_adjustment (aguarda aprovação)
    → Notificar aluno: "Análise pronta — veja o relatório"
```

### Aprovação de ajuste de plano

```
Aluno recebe notificação de ajuste pendente
  → Abre card antes/depois:
    ANTES: [treino atual] | DEPOIS: [treino proposto pela IA]
    Diff: "Removido: Leg Press 4x12 | Adicionado: Agachamento Búlgaro 3x10"
    Motivo: "Baseado no check-in de [data]: glúteo e posterior precisam de mais ativação"
  → Aluno aprova → plan/approve salva nas tabelas de treino/dieta
  → Aluno rejeita → pending_plan_adjustment marcado como rejected, IA aprende
```

### Assistente diário

```
Aluno: "Posso trocar o frango por atum no almoço de hoje?"
  → Haiku 4.5 com contexto: plano atual + refeição do dia + macros alvo
  → Resposta: "Sim — 100g de atum tem macros parecidos com 100g de frango.
     Fica: 31g proteína, 1g carb, 2g gordura. Deseja registrar a troca?"
  → Se aluno confirmar → registrar substituição em meal_logs
```

---

## Tabelas do banco envolvidas

| Tabela | Operação | Observação |
|--------|----------|------------|
| `training_periodizations` | SELECT, INSERT, UPDATE | Plano de treino criado no onboarding |
| `training_plans` | SELECT, INSERT, UPDATE | Fases do plano |
| `workouts` | SELECT, INSERT, UPDATE | Treinos de cada fase |
| `workout_exercises` | SELECT, INSERT, UPDATE | Exercícios |
| `diet_plans` | SELECT, INSERT, UPDATE | Plano alimentar |
| `diet_meals` | SELECT, INSERT, UPDATE | Refeições |
| `diet_meal_items` | SELECT, INSERT, UPDATE | Alimentos com quantidades |
| `meal_logs` | SELECT, INSERT | Logs diários de refeições |
| `workout_sessions` | SELECT | Histórico de treinos realizados |
| `student_anamnesis` | SELECT | Contexto do aluno (readonly) |
| `physical_assessments` | SELECT | Último assessment (readonly) |
| `ai_chat_sessions` | SELECT, INSERT | Reaproveitado do ai-coach-chat |
| `ai_chat_messages` | SELECT, INSERT | Reaproveitado do ai-coach-chat |
| `student_checkins` | SELECT, INSERT | **NOVA** — check-ins com fotos e análise |
| `pending_plan_adjustments` | SELECT, INSERT, UPDATE | **NOVA** — ajustes aguardando aprovação |
| `student_notifications` | SELECT, INSERT, UPDATE | **NOVA** — notificações web e mobile |

### Novas tabelas necessárias

```sql
CREATE TABLE student_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_urls text[] NOT NULL,                    -- frente, lado, costas
  analysis_text text,                            -- análise da IA em linguagem natural
  analysis_metadata jsonb DEFAULT '{}',          -- dados estruturados: progresso estimado, pontos de atenção
  checkin_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE pending_plan_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_id uuid REFERENCES student_checkins(id),
  module text NOT NULL CHECK (module IN ('workout', 'nutrition')),
  before_snapshot jsonb NOT NULL,                -- estado atual do plano (snapshot)
  after_snapshot jsonb NOT NULL,                 -- plano proposto pela IA
  diff_summary text NOT NULL,                    -- descrição em linguagem natural do que muda
  reason text NOT NULL,                          -- motivo da IA para o ajuste
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE student_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'checkin_reminder',
    'weekly_report',
    'plan_adjustment_pending',
    'assistant_proactive',
    'checkin_analysis_ready'
  )),
  title text NOT NULL,
  body text NOT NULL,
  metadata jsonb DEFAULT '{}',                   -- link para checkin, adjustment_id, etc.
  read_at timestamptz,
  push_sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

---

## Protocolo de ajuste de plano — regra central

A IA **nunca altera o plano sem aprovação explícita** do aluno.

**O que a IA pode sugerir automaticamente:**
- Alteração de carga/volume em exercícios existentes
- Substituição de alimentos por equivalentes calóricos
- Redistribuição de macros entre refeições

**O que requer confirmação reforçada (card de diff obrigatório):**
- Remoção de exercício ou treino inteiro
- Mudança de objetivo calórico total
- Adição de nova fase de periodização

**Frases que disparam aprovação:**
- "aprovo", "pode aplicar", "ok", "sim", "confirmo"

**Frases que disparam rejeição:**
- "não", "rejeito", "mantém assim", "não quero mudar"

---

## Fases de entrega

### Fase 1 — Onboarding e criação de plano (1 semana)
- [ ] Reaproveitamento dos orquestradores com prompts de aluno autônomo
- [ ] API route `/api/ai/student/onboarding` com streaming SSE
- [ ] UI de onboarding no mobile (chat) e web (chat)
- [ ] Salvamento progressivo com confirmação do aluno
- [ ] Criar tabelas `student_checkins`, `pending_plan_adjustments`, `student_notifications` com RLS

### Fase 2 — Check-in com análise visual (1 semana)
- [ ] Upload de fotos no check-in (Supabase Storage)
- [ ] Integração Claude Sonnet 4.6 + Vision para análise
- [ ] Comparação com check-in anterior e geração de diff
- [ ] Card antes/depois na UI (mobile e web)
- [ ] Gate de limite por plano de assinatura
- [ ] `pending_plan_adjustments` criados após análise

### Fase 3 — Aprovação de ajustes e assistente diário (1 semana)
- [ ] API route `/api/ai/student/plan/approve`
- [ ] UI de aprovação: card antes/depois com diff explícito
- [ ] Assistente diário: `/api/ai/student/chat` com Haiku 4.5
- [ ] Contexto do assistente: plano + check-ins + logs da semana

### Fase 4 — Notificações e relatório semanal (3-4 dias)
- [ ] `student_notifications` com leitura no perfil web
- [ ] Push notifications no mobile via Expo Notifications
- [ ] Cron job (toda segunda-feira) para relatório semanal
- [ ] Lembrete automático de check-in quando próximo do prazo

### Fase 5 — Polish e limites de plano (2-3 dias)
- [ ] Implementar gate de features por plano de assinatura
- [ ] UI indicando check-ins restantes no mês
- [ ] Métricas: custo por análise, custo por sessão de assistente

---

## Decisões técnicas

**Por que reaproveitamento dos orquestradores do ai-coach-chat?**
Os orquestradores de treino e nutrição já conhecem as tabelas, tools e fluxo de salvamento. Mudar o prompt de sistema para contexto de aluno autônomo é suficiente — não é necessário criar novos agentes.

**Por que Haiku para o assistente diário e não Sonnet?**
Perguntas do dia a dia ("posso trocar X por Y?") são tarefas de lookup e cálculo simples. Haiku entrega o mesmo resultado com latência de ~1s e custo 10x menor que Sonnet.

**Por que Claude Sonnet 4.6 + Vision para check-in e não GPT-4V?**
Consistência de stack: todo o sistema de IA usa Claude. Sonnet 4.6 tem vision nativa e prompt caching, o que reduz custo quando analisamos múltiplas fotos do mesmo aluno na mesma sessão.

**Por que `pending_plan_adjustments` como tabela separada e não direto no plano?**
O aluno precisa ver o estado atual e o proposto lado a lado antes de decidir. Salvar na tabela de ajustes pendentes garante que o plano original não é tocado até aprovação explícita.

**Por que notificações em tabela própria e não só push?**
Alunos que acessam via web não têm push. A tabela `student_notifications` é a fonte de verdade — push é apenas um canal de entrega adicional.

---

## Impacto em outros módulos

- **ai-coach-chat (especialista)**: nenhum — orquestradores são reaproveitados, não modificados
- **Módulo de treino (web/mobile)**: nenhum — IA salva nas mesmas tabelas, UI existente continua funcionando
- **Módulo de nutrição (web/mobile)**: nenhum — idem
- **WorkoutAIService (mobile)**: será depreciado gradualmente, este módulo substitui as funcionalidades de aluno autônomo

---

## Checklist de done

- [ ] Código funciona e passou em lint + typecheck + testes
- [ ] PR mergeado em `development`
- [ ] `docs/features/ai-student-autonomous.md` criado
- [ ] `docs/STATUS.md` atualizado
- [ ] RLS configurado para todas as novas tabelas
- [ ] Custo por sessão e por check-in documentado (tokens médios)
- [ ] Limites de plano implementados e testados
