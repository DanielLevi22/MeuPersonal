# PRD: AI Coach Chat — Sistema Multi-Agente de Planejamento

**Data de criação:** 2026-04-19
**Status:** approved
**Branch:** feature/ai-coach-chat
**Autor:** Daniel Levi

> Spec completa: [docs/PRDs/ai/ai-coach-chat.md](ai/ai-coach-chat.md)

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
- [ ] Dados são salvos nas tabelas existentes somente após confirmação de ambos
- [ ] IA consegue retomar uma conversa incompleta e continuar de onde parou
- [ ] Respostas chegam em streaming (sem esperar a resposta completa)

---

## Escopo desta entrega (Fase 1)

### Incluído
- Instalar `@anthropic-ai/sdk` no web
- Migration: tabelas `ai_chat_sessions` e `ai_chat_messages` com RLS
- Context Loader: agrega dados do aluno (anamnese, periodizações, treinos, avaliação)
- Workout Orchestrator: Claude Sonnet 4.6 + prompt caching + tools `propose_periodization` e `save_periodization`
- API route `POST /api/ai/chat/[studentId]` com streaming SSE
- Chat UI básico na aba "AI Coach" do perfil do aluno (web)
- Migrar lógica de tools e prompts do mobile (AssistantService, workoutTools) para o BFF Next.js

### Fora do escopo (explicitamente)
- Tools completas de fases, treinos e exercícios (Fase 2)
- Módulo de nutrição via chat (Fase 3)
- App mobile recebendo o chat
- Aluno autônomo (PRD separado)

---

## Tabelas do banco envolvidas

| Tabela | Operação | Observação |
|--------|----------|------------|
| `ai_chat_sessions` | INSERT, SELECT | NOVA — sessão de chat por aluno |
| `ai_chat_messages` | INSERT, SELECT | NOVA — histórico de mensagens |
| `training_periodizations` | SELECT, INSERT | Lê existentes, salva via tool |
| `training_plans` | SELECT, INSERT | Fases da periodização |
| `workouts` | SELECT | Treinos de cada fase |
| `workout_exercises` | SELECT | Exercícios |
| `student_anamnesis` | SELECT | Contexto readonly |
| `physical_assessments` | SELECT | Último assessment readonly |
| `exercises` | SELECT | Banco de exercícios disponíveis |

---

## Decisões técnicas

- Orquestradores no Next.js Route Handlers (não Edge Functions — sem limite de CPU)
- SSE para streaming, não WebSocket (unidirecional, suficiente, mais simples)
- Salva direto nas tabelas existentes, não em draft
- Sonnet 4.6 para orquestradores, Haiku 4.5 para sub-agentes
- Prompt caching no contexto do aluno (~85% redução de custo por sessão)

---

## Checklist de done

- [ ] Código funciona e passou em lint + typecheck + testes
- [ ] PR mergeado em `development`
- [ ] `docs/features/ai-coach-chat.md` criado ou atualizado
- [ ] `docs/STATUS.md` atualizado
- [ ] RLS configurado para `ai_chat_sessions` e `ai_chat_messages`
