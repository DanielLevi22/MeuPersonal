import {
  ANALYTICAL_COACH_PROMPT,
  EXPRESS_COACH_PROMPT,
  STUDENT_COACH_BASE_PROMPT,
} from "../prompts/student-coach.prompts";
import type { AIProvider, SystemBlock, ToolDefinition } from "../providers/types";
import { STUDENT_COACH_TOOLS } from "../tools/studentCoachTools";
import type { PlanProposalData, SseEvent } from "../types";
import { BaseOrchestrator, type ToolCallHandler } from "./base.orchestrator";

type CoachMode = "express" | "analytical";
type PersonaTrack = "beginner" | "returning" | "intermediate" | "advanced";

const TRACK_HINTS: Record<PersonaTrack, string> = {
  beginner:
    "O aluno é iniciante — use linguagem simples, evite jargões, priorize exercícios básicos e segurança.",
  returning:
    "O aluno retornou após pausa — reintroduza gradualmente, pergunte sobre nível atual de condicionamento.",
  intermediate:
    "O aluno tem experiência intermediária — pode usar variações e progressões moderadas.",
  advanced:
    "O aluno é avançado — pode usar técnicas como drop-sets, periodização ondulatória e volumes maiores.",
};

export class StudentCoachOrchestrator extends BaseOrchestrator {
  constructor(
    provider: AIProvider,
    private mode: CoachMode,
    private track: PersonaTrack,
  ) {
    super(provider);
  }

  buildSystemBlocks(contextText: string): SystemBlock[] {
    const modePrompt = this.mode === "express" ? EXPRESS_COACH_PROMPT : ANALYTICAL_COACH_PROMPT;
    return [
      { text: STUDENT_COACH_BASE_PROMPT, cacheControl: true },
      { text: modePrompt, cacheControl: true },
      {
        text: `PERFIL DO ALUNO:\n${contextText}\n\nPERSONA: ${TRACK_HINTS[this.track]}`,
        cacheControl: true,
      },
    ];
  }

  getTools(): ToolDefinition[] {
    return STUDENT_COACH_TOOLS;
  }

  // propose_plan yields a plan_proposal SSE event so the UI can render the confirmation card.
  // save_plan delegates to onToolCall which persists the plan to the database.
  protected async handleTool(
    name: string,
    input: unknown,
    onToolCall: ToolCallHandler | undefined,
  ): Promise<{ sseEvents: SseEvent[]; result: string }> {
    if (name === "propose_plan") {
      return {
        sseEvents: [{ type: "plan_proposal", data: input as PlanProposalData }],
        result: "Plano apresentado ao aluno. Aguardando confirmacao.",
      };
    }
    if (name === "save_plan") {
      const result = onToolCall
        ? await onToolCall(name, input)
        : JSON.stringify({ error: "save_plan handler not provided" });
      return { sseEvents: [], result };
    }
    return super.handleTool(name, input, onToolCall);
  }
}
