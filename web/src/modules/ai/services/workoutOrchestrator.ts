// Backward-compatibility shim.
// New code should use WorkoutOrchestrator directly from orchestrators/workout.orchestrator.ts.
import { aiProviders } from "../ai.config";
import { WorkoutOrchestrator } from "../orchestrators/workout.orchestrator";
import type { SseEvent } from "../types";

type MessageParam = { role: "user" | "assistant"; content: string };

export async function* runWorkoutOrchestrator(
  userMessage: string,
  history: MessageParam[],
  studentContextText: string,
  onToolCall?: (name: string, input: unknown) => Promise<string>,
): AsyncGenerator<SseEvent> {
  const orchestrator = new WorkoutOrchestrator(aiProviders.reasoning);
  yield* orchestrator.run({
    userMessage,
    history,
    contextText: studentContextText,
    onToolCall,
  });
}
