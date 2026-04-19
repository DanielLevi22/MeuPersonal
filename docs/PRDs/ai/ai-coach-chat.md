# PRD: AI Coach Chat — Sistema Multi-Agente de Planejamento

**Data de criação:** 2026-04-19
**Status:** approved
**Branch:** feature/ai-coach-chat
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Um sistema de chat por aluno onde o especialista conversa com uma IA multi-agente para planejar, revisar e salvar periodizações, fases, treinos, exercícios e dietas. A IA lê o estado atual do aluno no banco, conduz a conversa de forma progressiva e só persiste dados quando especialista e IA concordam que a etapa está pronta.

### Por quê?
Hoje o especialista monta planos manualmente — é lento e não aproveita o contexto da anamnese e avaliação física do aluno. A tentativa anterior no mobile usou um único agente com contexto enorme e muitas tools, o que degradou a qualidade das respostas. Mover para web com orquestradores especializados por módulo resolve o problema de contexto e entrega resultados de qualidade real.

### Como saberemos que está pronto?
- [ ] Especialista abre o perfil de um aluno e encontra a aba "AI Coach"
- [ ] IA inicia a conversa com o contexto real do aluno (periodizações existentes, fases, treinos, anamnese)
- [ ] Especialista consegue criar uma periodização completa (fases → treinos → exercícios) via chat
- [ ] Dados são salvos nas tabelas existentes (`training_periodizations`, `training_plans`, `workouts`, `workout_exercises`) somente após confirmação de ambos
- [ ] IA consegue retomar uma conversa incompleta (ex: periodização sem treinos) e continuar de onde parou
- [ ] Especialista consegue pedir alterações no que já foi criado e a IA aplica
- [ ] Módulo de nutrição: especialista consegue criar um plano alimentar completo via chat
- [ ] Respostas chegam em streaming (sem esperar a resposta completa)

---

## Contexto

O mobile tem um `WorkoutAIService` usando Gemini com um único agente e muitas tools. O contexto ficou muito grande e os resultados degradaram. A decisão é mover toda a lógica de IA para o backend Next.js (BFF), com uma arquitetura de orquestradores especializados por módulo. Mobile e web continuam funcionando — ambos chamam os endpoints do BFF.

---

## Escopo

### Incluído — Módulo Treino
- Chat UI no perfil do aluno (web) com streaming de respostas
- Workout Orchestrator: conduz conversa sobre periodização, fases, treinos e exercícios
- Context loader: lê estado atual do aluno antes de iniciar o chat
- Salvamento progressivo com confirmação (periodização → fase → treino → exercícios)
- Edição de itens já criados via chat ("troca o supino por crucifixo na fase 2")
- Persistência do histórico de conversas por aluno

### Incluído — Módulo Nutrição
- Nutrition Orchestrator: conduz conversa sobre plano alimentar, refeições e alimentos
- Considera anamnese (restrições, preferências), avaliação física (TDEE estimado) e objetivo
- Salva em `diet_plans`, `diet_meals`, `diet_meal_items`

### Fora do escopo desta entrega
- App mobile recebendo o chat (mobile chama APIs existentes, chat só no web)
- Geração automática sem interação (batch AI sem chat)
- IA analisando fotos de postura em tempo real
- Integração com wearables ou apps externos
- Múltiplos idiomas

---

## Arquitetura técnica

### Visão geral

```
Web UI (chat por aluno)
    │ SSE streaming
    ▼
POST /api/ai/chat/[studentId]
    │
    ▼
Context Loader
(lê Supabase: anamnese, avaliações, periodizações, dietas)
    │
    ▼
Module Router
(identifica módulo: treino ou nutrição, baseado na conversa)
    │
    ├─────────────────────────────────────┐
    ▼                                     ▼
Workout Orchestrator              Nutrition Orchestrator
(Claude Sonnet 4.6)               (Claude Sonnet 4.6)
    │                                     │
 tools (sub-agentes):              tools (sub-agentes):
 ├── analyze_anamnesis             ├── calculate_macros
 ├── propose_periodization        ├── propose_diet_plan
 ├── propose_phases               ├── propose_meals
 ├── propose_workouts             └── propose_foods
 ├── propose_exercises
 ├── save_periodization  ─────────────── salva em training_periodizations
 ├── save_phase          ─────────────── salva em training_plans
 ├── save_workout        ─────────────── salva em workouts
 └── save_exercises      ─────────────── salva em workout_exercises
```

### Modelo de IA por papel

| Papel | Modelo | Justificativa |
|---|---|---|
| Workout Orchestrator | **Claude Sonnet 4.6** | Raciocínio complexo, tool use nativo, prompt caching |
| Nutrition Orchestrator | **Claude Sonnet 4.6** | Idem |
| Sub-agentes estruturados | **Claude Haiku 4.5** | 10x mais barato, rápido, suficiente para gerar JSON |
| Fallback / tarefas simples | **Gemini 1.5 Flash** | API key já existe, boa para lookup de alimentos |

**Prompt caching (crítico para custo):**
O contexto do aluno (anamnese + avaliação + periodizações) é cacheado pelo Claude por 5 min. Em uma sessão de 10 mensagens, o contexto completo é enviado uma vez e cacheado — redução de ~85% no custo por sessão.

---

## Fluxo de dados — Módulo Treino

### Início do chat
```
Especialista abre chat do aluno João
  → Context Loader lê Supabase
    → training_periodizations (status, fases)
    → training_plans (fases de cada periodização)
    → workouts + workout_exercises (treinos de cada fase)
    → student_anamnesis (objetivos, restrições, lesões, disponibilidade)
    → physical_assessments (último assessment)
  → Orquestrador monta mensagem inicial:
    "João tem 1 periodização (Hipertrofia, 12 sem, Fase 2 sem treinos).
     Deseja continuar montando os treinos da Fase 2 ou criar algo novo?"
```

### Fluxo de confirmação e salvamento
```
IA propõe fase → Especialista revisa → "ok, pode salvar"
  → Orquestrador chama tool save_phase(dados)
  → API Route grava em training_plans
  → IA confirma: "Fase salva ✓ Vamos montar os treinos?"
  → Histórico da conversa salvo em ai_chat_messages
```

### Fluxo de edição
```
Especialista: "No Treino A troca o supino por crucifixo"
  → Orquestrador identifica: edição de exercício específico
  → Chama Exercise Agent com contexto mínimo (só aquele treino)
  → Propõe alteração → Especialista confirma
  → save_exercises atualiza workout_exercises
```

---

## Tabelas do banco envolvidas

| Tabela | Operação | Observação |
|--------|----------|------------|
| `training_periodizations` | SELECT, INSERT, UPDATE | Lê existentes, salva novas via tool |
| `training_plans` | SELECT, INSERT, UPDATE | Fases da periodização |
| `workouts` | SELECT, INSERT, UPDATE | Treinos de cada fase |
| `workout_exercises` | SELECT, INSERT, UPDATE | Exercícios de cada treino |
| `diet_plans` | SELECT, INSERT | Plano alimentar gerado |
| `diet_meals` | SELECT, INSERT | Refeições do plano |
| `diet_meal_items` | SELECT, INSERT | Alimentos com quantidades |
| `student_anamnesis` | SELECT | Contexto do aluno (readonly para IA) |
| `physical_assessments` | SELECT | Último assessment (readonly para IA) |
| `exercises` | SELECT | Banco de exercícios disponíveis |
| `foods` | SELECT | Banco de alimentos disponíveis |
| `ai_chat_sessions` | SELECT, INSERT, UPDATE | **NOVA** — sessão de chat por aluno |
| `ai_chat_messages` | SELECT, INSERT | **NOVA** — histórico de mensagens |

### Novas tabelas necessárias

```sql
CREATE TABLE ai_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  specialist_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module text NOT NULL CHECK (module IN ('workout', 'nutrition', 'general')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}', -- tools chamadas, itens salvos, etc
  created_at timestamptz DEFAULT now()
);
```

---

## Protocolo de confirmação — regra central

A IA **nunca salva dados sem confirmação explícita** do especialista.

**Frases que disparam salvamento:**
- "ok", "pode salvar", "confirma", "salva", "aprovado", "perfeito"

**Frases que disparam revisão:**
- "muda", "troca", "ajusta", "não", "diferente", "outro"

**Fluxo de cada nível:**
```
1. IA propõe (texto + estrutura JSON interna)
2. Especialista revisa e responde
3. Se aprovado → IA chama save_[entidade]() → confirma no chat
4. Se rejeitado → IA ajusta e volta ao passo 1
5. Só avança para o próximo nível após salvar o atual
```

---

## Fases de entrega

### Fase 1 — Fundação (1 semana)
- [ ] Criar tabelas `ai_chat_sessions` e `ai_chat_messages` com RLS
- [ ] Context Loader: endpoint que agrega dados do aluno
- [ ] API route `/api/ai/chat/[studentId]` com streaming SSE
- [ ] Workout Orchestrator básico (Claude Sonnet 4.6 + prompt caching)
- [ ] Tools: `propose_periodization`, `save_periodization`
- [ ] Chat UI básico no perfil do aluno (sem histórico ainda)

### Fase 2 — Fluxo completo de treino (1 semana)
- [ ] Tools completas: fases, treinos, exercícios
- [ ] Edição de itens existentes via chat
- [ ] Retomada de conversa incompleta
- [ ] Histórico de mensagens salvo e carregado

### Fase 3 — Módulo nutrição (1 semana)
- [ ] Nutrition Orchestrator
- [ ] Tools: `propose_diet_plan`, `propose_meals`, `propose_foods`
- [ ] Salvamento em `diet_plans`, `diet_meals`, `diet_meal_items`

### Fase 4 — Qualidade e polish (3-4 dias)
- [ ] UI de chat com markdown renderizado
- [ ] Indicadores de "IA salvando...", "Salvo ✓"
- [ ] Limite de contexto e resumo automático de conversas longas
- [ ] Métricas: custo por sessão (tokens usados)

---

## Decisões técnicas

**Por que orquestradores no Next.js e não Edge Functions?**
Edge Functions têm limite de CPU e memória que inviabiliza chamadas encadeadas de IA. Next.js Route Handlers rodam no Node.js sem esses limites.

**Por que streaming SSE e não WebSocket?**
SSE é unidirecional (servidor → cliente), suficiente para streaming de texto. Mais simples de implementar no Next.js e funciona com `ReadableStream` nativo.

**Por que salvar nas tabelas existentes e não em tabelas de "draft"?**
O especialista já conhece a UI de periodizações/treinos. Salvando direto, ele pode sair do chat e ver o resultado na tela normal — sem UX extra para "publicar" o draft.

**Por que Haiku para sub-agentes e não Sonnet em tudo?**
Sub-agentes recebem inputs estruturados e produzem JSON estruturado — tarefa mecânica onde Haiku entrega o mesmo resultado a 1/10 do custo.

---

## Impacto em outros módulos

- **Módulo de treino (web)**: nenhum — AI salva nas mesmas tabelas, UI existente continua funcionando
- **Módulo de nutrição (web)**: nenhum — idem
- **Mobile**: nenhuma mudança, pode evoluir para chamar os endpoints BFF no futuro
- **WorkoutAIService (mobile)**: será depreciado gradualmente, não quebrado imediatamente

---

## Checklist de done

- [ ] Código funciona e passou em lint + typecheck + testes
- [ ] PR mergeado em `development`
- [ ] `docs/features/ai-coach-chat.md` criado
- [ ] `docs/STATUS.md` atualizado
- [ ] RLS configurado para `ai_chat_sessions` e `ai_chat_messages`
- [ ] Custo por sessão documentado (tokens médios)
