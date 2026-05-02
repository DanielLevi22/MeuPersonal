# PRD: AI Orchestration Architecture

**Status:** approved
**Branch:** feature/ai-orchestration-architecture
**Documentação completa:** [docs/PRDs/ai/ai-orchestration-architecture.md](ai/ai-orchestration-architecture.md)
**ADR:** [docs/decisions/ADR-003-ai-architecture.md](../decisions/ADR-003-ai-architecture.md)

---

## As 3 perguntas obrigatórias

### O quê?
Refatoração da camada de IA para introduzir uma interface `AIProvider` que desacopla os orquestradores do SDK da Anthropic, e uma classe abstrata `BaseOrchestrator` que centraliza o loop de tool use — permitindo que futuros orquestradores implementem apenas o system prompt e as tools específicas.

### Por quê?
O `workoutOrchestrator.ts` existente referenciava o SDK da Anthropic diretamente em múltiplos pontos. Adicionar o `StudentCoachOrchestrator` sem essa abstração resultaria em duplicação do loop de orquestração e tornaria a troca de LLM provider uma mudança cirúrgica em vários arquivos.

### Como saberemos que está pronto?
- [x] `AIProvider` interface criada — nenhum orquestrador importa `@anthropic-ai/sdk` diretamente
- [x] `ai.config.ts` é o único arquivo que instancia providers — trocar de Claude para outro LLM é uma edição de 1 linha
- [x] `BaseOrchestrator` com loop de tool use implementado
- [x] `WorkoutOrchestrator` refatorado para estender `BaseOrchestrator` — comportamento idêntico ao anterior
- [x] Route handler existente sem nenhuma mudança (backward-compat shims)
- [x] `tsc --noEmit` e `biome check` passando com zero erros
