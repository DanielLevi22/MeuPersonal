# Arquitetura de Orquestração de IA

**Status:** draft (para aprovação junto com ai-student-coach-core)
**ADR relacionado:** [ADR-003](../../decisions/ADR-003-ai-architecture.md)
**Cobre:** estrutura de providers, orquestradores, context loaders e configuração central

---

## Visão geral

```
ai.config.ts
  └── aiProviders { reasoning, fast, vision }
        └── AIProvider (interface)
              ├── AnthropicProvider
              └── OpenAIProvider (futuro)

Orquestradores (estendem BaseOrchestrator)
  ├── WorkoutOrchestrator       — especialista, planos de treino
  ├── StudentCoachOrchestrator  — aluno, coach personalizado
  └── NutritionOrchestrator     — (futuro) especialista, dieta

Context Loaders
  ├── SpecialistContextLoader   — contexto para o especialista
  └── StudentContextLoader      — contexto para o aluno
```

---

## 1. AIProvider — interface e implementações

### Interface

```typescript
// web/src/modules/ai/providers/types.ts

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | ContentBlock[];
}

export interface LLMCompletionOptions {
  messages: LLMMessage[];
  systemPrompt?: string;
  tools?: ToolDefinition[];
  maxTokens?: number;
  cacheControl?: boolean;  // ativa prompt caching no provider que suporta
}

export interface LLMStreamChunk {
  type: 'text_delta' | 'tool_use_start' | 'tool_use_delta' | 'tool_use_end' | 'done';
  content?: string;
  toolName?: string;
  toolInput?: unknown;
}

export interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage?: { input_tokens: number; output_tokens: number };
}

export interface LLMVisionOptions extends LLMCompletionOptions {
  images: Array<{ data: string; mediaType: 'image/jpeg' | 'image/png' }>;
}

export interface AIProvider {
  complete(options: LLMCompletionOptions): Promise<LLMResponse>;
  stream(options: LLMCompletionOptions): AsyncIterable<LLMStreamChunk>;
  completeWithVision(options: LLMVisionOptions): Promise<LLMResponse>;
}
```

### AnthropicProvider

```typescript
// web/src/modules/ai/providers/anthropic.provider.ts

import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, LLMCompletionOptions, LLMResponse, LLMStreamChunk, LLMVisionOptions } from './types';

export class AnthropicProvider implements AIProvider {
  private client = new Anthropic();

  constructor(private model: string) {}

  async complete(options: LLMCompletionOptions): Promise<LLMResponse> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options.maxTokens ?? 4096,
      system: options.systemPrompt
        ? options.cacheControl
          ? [{ type: 'text', text: options.systemPrompt, cache_control: { type: 'ephemeral' } }]
          : options.systemPrompt
        : undefined,
      messages: options.messages as Anthropic.MessageParam[],
      tools: options.tools as Anthropic.Tool[],
    });

    return {
      content: response.content.find(b => b.type === 'text')?.text ?? '',
      toolCalls: response.content
        .filter(b => b.type === 'tool_use')
        .map(b => ({ name: b.name, input: b.input, id: b.id })),
      usage: response.usage,
    };
  }

  async *stream(options: LLMCompletionOptions): AsyncIterable<LLMStreamChunk> {
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: options.maxTokens ?? 4096,
      system: options.systemPrompt as string,
      messages: options.messages as Anthropic.MessageParam[],
      tools: options.tools as Anthropic.Tool[],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { type: 'text_delta', content: event.delta.text };
      }
      if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
        yield { type: 'tool_use_start', toolName: event.content_block.name };
      }
      if (event.type === 'message_stop') {
        yield { type: 'done' };
      }
    }
  }

  async completeWithVision(options: LLMVisionOptions): Promise<LLMResponse> {
    const imageContent = options.images.map(img => ({
      type: 'image' as const,
      source: { type: 'base64' as const, media_type: img.mediaType, data: img.data },
    }));

    return this.complete({
      ...options,
      messages: [
        ...options.messages.slice(0, -1),
        {
          role: 'user' as const,
          content: [...imageContent, { type: 'text', text: options.messages.at(-1)?.content as string }],
        },
      ],
    });
  }
}
```

### Configuração central

```typescript
// web/src/modules/ai/ai.config.ts

import { AnthropicProvider } from './providers/anthropic.provider';

// Único lugar para trocar de provider ou de modelo.
// Todos os orquestradores importam daqui — nunca criam providers diretamente.
export const aiProviders = {
  reasoning: new AnthropicProvider('claude-sonnet-4-6'),
  fast:      new AnthropicProvider('claude-haiku-4-5-20251001'),
  vision:    new AnthropicProvider('claude-sonnet-4-6'),
} as const;

export type AIProviderKey = keyof typeof aiProviders;
```

---

## 2. BaseOrchestrator — classe abstrata

```typescript
// web/src/modules/ai/orchestrators/base.orchestrator.ts

import type { AIProvider, LLMMessage, LLMStreamChunk, ToolDefinition } from '../providers/types';
import type { BaseContextLoader, OrchestratorContext } from './context.types';

export interface OrchestratorRunInput {
  sessionId: string;
  messages: LLMMessage[];
  attachments?: Array<{ data: string; mediaType: 'image/jpeg' | 'image/png' }>;
}

export abstract class BaseOrchestrator {
  constructor(
    protected provider: AIProvider,
    protected contextLoader: BaseContextLoader,
  ) {}

  // Subclasses implementam apenas o que é diferente
  abstract buildSystemPrompt(context: OrchestratorContext): string;
  abstract getTools(): ToolDefinition[];

  async *run(input: OrchestratorRunInput): AsyncIterable<LLMStreamChunk> {
    const context = await this.contextLoader.load();
    const systemPrompt = this.buildSystemPrompt(context);
    const tools = this.getTools();

    const hasImages = (input.attachments?.length ?? 0) > 0;
    const streamFn = hasImages
      ? () => this.provider.completeWithVision({
          messages: input.messages,
          systemPrompt,
          tools,
          images: input.attachments!,
          cacheControl: true,
        })
      : () => this.provider.stream({
          messages: input.messages,
          systemPrompt,
          tools,
          cacheControl: true,
        });

    yield* hasImages
      ? this.streamFromCompletion(await (streamFn as () => Promise<import('../providers/types').LLMResponse>)())
      : (streamFn as () => AsyncIterable<LLMStreamChunk>)();
  }

  private async *streamFromCompletion(response: import('../providers/types').LLMResponse): AsyncIterable<LLMStreamChunk> {
    if (response.content) yield { type: 'text_delta', content: response.content };
    for (const tool of response.toolCalls ?? []) {
      yield { type: 'tool_use_start', toolName: tool.name };
      yield { type: 'tool_use_end' };
    }
    yield { type: 'done' };
  }
}
```

---

## 3. Context Loaders

### Interface base

```typescript
// web/src/modules/ai/orchestrators/context.types.ts

export interface OrchestratorContext {
  formattedText: string;  // texto pré-formatado para o system prompt
  raw: unknown;           // dados brutos para uso programático nos tools
}

export interface BaseContextLoader {
  load(): Promise<OrchestratorContext>;
}
```

### StudentContextLoader

```typescript
// web/src/modules/ai/services/studentContextLoader.ts

import type { BaseContextLoader, OrchestratorContext } from '../orchestrators/context.types';
import type { StudentContext } from '../types';

export class StudentContextLoader implements BaseContextLoader {
  constructor(
    private studentId: string,
    private supabase: SupabaseClient,
  ) {}

  async load(): Promise<OrchestratorContext> {
    const [anamnese, assessment, activePlan, recentCheckins] = await Promise.all([
      this.loadAnamnese(),
      this.loadLatestAssessment(),
      this.loadActivePlan(),
      this.loadRecentCheckins(3),
    ]);

    const raw: StudentContext = { anamnese, assessment, activePlan, recentCheckins };
    return { formattedText: formatStudentContext(raw), raw };
  }

  // ... métodos privados de fetch
}
```

### SpecialistContextLoader (refatoração do contextLoader.ts existente)

```typescript
// web/src/modules/ai/services/specialistContextLoader.ts
// Refatoração do contextLoader.ts existente para implementar BaseContextLoader
```

---

## 4. WorkoutOrchestrator — refatoração

O `workoutOrchestrator.ts` existente deve ser refatorado para estender `BaseOrchestrator`:

```typescript
// web/src/modules/ai/orchestrators/workout.orchestrator.ts

import { BaseOrchestrator } from './base.orchestrator';
import { workoutTools } from '../tools/workoutTools';
import { SPECIALIST_COACH_SYSTEM_PROMPT } from '../prompts/specialist.prompts';

export class WorkoutOrchestrator extends BaseOrchestrator {
  buildSystemPrompt(context: OrchestratorContext): string {
    return `${SPECIALIST_COACH_SYSTEM_PROMPT}\n\n${context.formattedText}`;
  }

  getTools() {
    return workoutTools;
  }
}
```

---

## 5. StudentCoachOrchestrator

```typescript
// web/src/modules/ai/orchestrators/student-coach.orchestrator.ts

import { BaseOrchestrator } from './base.orchestrator';
import { studentCoachTools } from '../tools/studentCoachTools';
import {
  STUDENT_COACH_BASE_PROMPT,
  EXPRESS_MODE_PROMPT,
  ANALYTICAL_MODE_PROMPT,
  buildTrackPrompt,
} from '../prompts/student-coach.prompts';

export type CoachMode = 'express' | 'analytical';
export type PersonaTrack = 'beginner' | 'returning' | 'intermediate' | 'advanced';

export class StudentCoachOrchestrator extends BaseOrchestrator {
  constructor(
    provider: AIProvider,
    contextLoader: StudentContextLoader,
    private mode: CoachMode,
    private track: PersonaTrack,
  ) {
    super(provider, contextLoader);
  }

  buildSystemPrompt(context: OrchestratorContext): string {
    return [
      STUDENT_COACH_BASE_PROMPT,
      this.mode === 'express' ? EXPRESS_MODE_PROMPT : ANALYTICAL_MODE_PROMPT,
      buildTrackPrompt(this.track),
      context.formattedText,
    ].join('\n\n');
  }

  getTools() {
    return studentCoachTools;
    // Inclui: proposeWorkoutPlan, proposeNutritionPlan, generateExplanationCard,
    //         savePlanWithApproval, analyzeBodyPhotos, analyzeMealPhoto
  }
}
```

---

## 6. Estrutura de pastas resultante

```
web/src/modules/ai/
  ai.config.ts                        ← único lugar para trocar de provider/modelo
  index.ts
  types.ts

  providers/
    types.ts                          ← AIProvider interface + tipos
    anthropic.provider.ts             ← implementação Anthropic
    openai.provider.ts                ← (futuro)

  orchestrators/
    context.types.ts                  ← OrchestratorContext, BaseContextLoader
    base.orchestrator.ts              ← BaseOrchestrator abstract class
    workout.orchestrator.ts           ← refatoração do existente
    student-coach.orchestrator.ts     ← novo

  services/
    chatService.ts                    ← DB: sessões, mensagens (não muda)
    specialistContextLoader.ts        ← refatoração do contextLoader.ts
    studentContextLoader.ts           ← novo

  tools/
    workoutTools.ts                   ← existente (não muda)
    studentCoachTools.ts              ← novo

  prompts/
    specialist.prompts.ts             ← extrai de workoutOrchestrator.ts
    student-coach.prompts.ts          ← novo

  hooks/
    useVoiceChat.ts                   ← não muda

  components/
    AiCoachChat.tsx                   ← não muda (usa o orquestrador via route handler)
    BulkWorkoutProposalCard.tsx        ← não muda

  pages/
    AiCoachPage.tsx                   ← não muda
```

---

## 7. Ordem de implementação recomendada

1. **Criar `providers/types.ts` e `providers/anthropic.provider.ts`** — puro, sem breaking changes
2. **Criar `ai.config.ts`** — instanciar providers, exportar
3. **Criar `orchestrators/base.orchestrator.ts`** — abstrato, sem usar ainda
4. **Refatorar `workoutOrchestrator.ts`** → `orchestrators/workout.orchestrator.ts` extendendo `BaseOrchestrator`
5. **Criar `services/studentContextLoader.ts`**
6. **Criar `orchestrators/student-coach.orchestrator.ts`**
7. **Criar tools e prompts** para o Student Coach

Os passos 1–4 são refatoração interna sem mudança de comportamento. Os passos 5–7 são adição de funcionalidade nova.

---

## 8. Regras de uso

- **Nunca** instanciar `new Anthropic()` fora de `providers/anthropic.provider.ts`
- **Nunca** importar `@anthropic-ai/sdk` fora da camada de providers
- **Nunca** passar `model: 'claude-sonnet-4-6'` como string literal fora de `ai.config.ts`
- Orquestradores recebem `AIProvider` por injeção — nunca importam de `ai.config.ts` diretamente (facilita testes com provider mock)
- Route handlers (`/api/ai/...`) são responsáveis por instanciar o orquestrador correto com o provider correto de `ai.config.ts`
