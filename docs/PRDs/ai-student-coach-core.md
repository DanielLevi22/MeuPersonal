# PRD: AI Student Coach — Core (Fase 1)

**Status:** approved

Documento completo em [docs/PRDs/ai/ai-student-coach-core.md](ai/ai-student-coach-core.md).

## O que foi aprovado

- Orquestrador dedicado para o aluno (`StudentCoachOrchestrator`) com modos expresso e analítico
- Gate de readiness baseado em score da anamnese (blocked < 60% / warning < 80% / ready ≥ 80%)
- Tools `propose_plan` e `save_plan` com card de proposta antes de confirmar
- Sessões de chat com `specialist_id = null` (aluno sem vínculo com especialista)
- Contexto de persona por track (beginner / returning / intermediate / advanced)
- Rotas `/api/ai/student/coach/session` e `/api/ai/student/coach/message`
- Página `/dashboard/coach`
