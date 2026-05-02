# Feature: AI Coach Chat

**Status:** active
**Plataformas:** web
**Última atualização:** 2026-04-26

---

## O que é

Chat assistido por IA que permite ao Personal Trainer planejar periodizações e treinos de um aluno em linguagem natural, com salvamento automático no banco ao aprovar as propostas.

## Por que existe

Montar periodizações e treinos manualmente é lento e repetitivo. O AI Coach guia o especialista pelas perguntas certas, sugere estruturas baseadas no perfil do aluno, e salva tudo diretamente no banco com um clique — reduzindo o tempo de planejamento de 30+ minutos para ~5.

---

## Fluxo de dados

```
Especialista digita (ou fala) mensagem
  → AiCoachChat (client component)
  → POST /api/ai/chat/[studentId]  (SSE stream)
  → runWorkoutOrchestrator (Anthropic Haiku 4.5)
      ├── loadStudentContext()       → student context text
      ├── getSessionState()          → planning state text
      └── tool calls:
            propose_periodization   → SSE: proposal
            save_periodization      → Supabase insert + updateSessionState
            suggest_quick_replies   → SSE: quick_replies
            query_exercises         → Supabase select
            propose_all_phase_workouts → SSE: bulk_workout_proposal
            save_workout            → Supabase insert + updateSessionState
            save_workout_exercises  → Supabase insert
  ← SSE events streamed para o cliente
  ← Cards de proposta renderizados
  ← Aprovação via botão → sendMessage() → próximo ciclo
```

## Tabelas do banco

| Tabela | Operações | RLS ativo |
|--------|-----------|-----------|
| `ai_chat_sessions` | SELECT, INSERT, UPDATE (state) | ✅ |
| `ai_chat_messages` | SELECT, INSERT | ✅ |
| `training_periodizations` | INSERT | ✅ |
| `training_plans` | INSERT | ✅ |
| `workouts` | INSERT | ✅ |
| `workout_exercises` | INSERT | ✅ |
| `exercises` | SELECT | ✅ |
| `profiles` | SELECT | ✅ |
| `student_anamnesis` | SELECT | ✅ |
| `physical_assessments` | SELECT | ✅ |

---

## Implementação

### Web (`web/src/modules/ai/`)

| Tipo | Arquivo | Responsabilidade |
|------|---------|-----------------|
| Component | `components/AiCoachChat.tsx` | Chat UI: mensagens, cards de proposta, chips de resposta rápida, modo voz |
| Component | `components/BulkWorkoutProposalCard.tsx` | Card accordion com todos os treinos de uma fase para revisão e aprovação |
| Hook | `hooks/useVoiceChat.ts` | Web Speech API: STT (pt-BR) + TTS (pt-BR), strips markdown antes de falar |
| Service | `services/workoutOrchestrator.ts` | Loop Anthropic com tool use; gerencia `propose_*`, `save_*`, `suggest_quick_replies` |
| Service | `services/chatService.ts` | CRUD de sessões, mensagens e estado; wrappam supabaseAdmin |
| Service | `services/contextLoader.ts` | Carrega perfil, anamnese, avaliação e periodizações do aluno; formata como texto para o prompt |
| Tools | `tools/workoutTools.ts` | Schema JSON de todas as ferramentas disponíveis para o modelo |
| Types | `types.ts` | Todos os tipos do módulo: SSE events, proposals, SessionState |
| Route | `app/api/ai/chat/[studentId]/route.ts` | SSE endpoint: autenticação, orquestração, atualização de estado |

---

## Fluxo em 2 estágios

### Estágio 1 — Periodização
1. IA pergunta objetivo → mostra chips: [Hipertrofia] [Força] [Emagrecimento] …
2. IA pergunta duração → mostra chips: [8 semanas] [12 semanas] …
3. IA sugere fases → pede aprovação verbal
4. IA chama `propose_periodization` → card aparece com resumo completo
5. Especialista clica **Aprovar e Salvar** → IA chama `save_periodization`
6. `updateSessionState` avança stage para `"workouts"`

### Estágio 2 — Treinos
1. IA lê ESTADO DA SESSÃO → sabe que está em estágio de treinos
2. IA pergunta qual fase começar → chips com nomes das fases (dos DADOS DO ALUNO)
3. IA pergunta divisão → chips: [2 dias — AB] [3 dias — ABC] …
4. IA chama `query_exercises` para cada grupo muscular em sequência
5. IA chama `propose_all_phase_workouts` → card accordion com todos os treinos
6. Especialista expande cada treino para ver exercícios, clica **Aprovar e Salvar Todos**
7. IA chama `save_workout` + `save_workout_exercises` para cada treino em sequência
8. Cada `save_workout` bem-sucedido → `updateSessionState` adiciona ao `savedWorkouts`
9. Card exibe progresso: "2/4 salvos" → "✓ Todos salvos"

---

## Regras de negócio

1. O especialista só vê o chat do seu aluno — RLS em `ai_chat_sessions` filtra por `specialist_id`
2. IDs de fases nunca são pedidos ao especialista — vêm de `DADOS DO ALUNO` (contextLoader) ou `ESTADO DA SESSÃO`
3. Termos técnicos proibidos no texto do AI: "ferramenta", "sistema", "plataforma", "ID", "banco de dados", etc.
4. Histórico de mensagens é limitado a 10 no contexto do modelo — contexto estruturado (student + state) substitui dependência de histórico longo
5. `suggest_quick_replies` deve ser chamado após qualquer pergunta de múltipla escolha com opções fixas
6. `propose_all_phase_workouts` propõe todos os treinos da divisão de uma vez — proibido propor treino por treino
7. `save_workout_exercises` só é chamado após o `workout_id` retornado por `save_workout`

## Decisões técnicas não-óbvias

- **Haiku 4.5 em vez de Sonnet**: 37× mais barato; suficiente para seguir o system prompt estruturado. Se a qualidade cair, trocar o model ID em `workoutOrchestrator.ts`.
- **Prompt caching (`cache_control: ephemeral`)**: system prompt e student context são marcados como cacheáveis. Estado da sessão NÃO é cacheado (muda a cada request). Economiza ~60% dos tokens de input em sessões longas.
- **SSE em vez de WebSocket**: sem estado no servidor, compatível com Vercel Edge, fácil de depurar. O cliente reconecta automaticamente por ser uma nova requisição a cada mensagem.
- **Session state em JSONB (`ai_chat_sessions.state`)**: resolve o problema de perda de contexto ao cortar o histórico. A IA nunca perde o estágio atual nem a lista de treinos salvos, independente de quantas mensagens foram trocadas.
- **`onToolCall` como callback**: mantém a lógica de persistência no route.ts (tem acesso ao sessionId e ao controller SSE) enquanto o orchestrator permanece stateless e testável.
- **Fuzzy match em `handleSaveWorkoutExercises`**: exercícios são buscados primeiro por nome exato, depois por `ilike` para tolerar pequenas variações de capitalização retornadas pelo modelo.
- **`contextLoader` inclui `training_plan_id` no texto formatado**: garante que o modelo sempre tenha os IDs disponíveis mesmo quando o histórico é cortado.

## Divergências web ↔ mobile

- Mobile: não implementado. Funcionalidade exclusiva do dashboard web para Personal Trainers.
