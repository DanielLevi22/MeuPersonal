import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { aiProviders } from "@/modules/ai/ai.config";
import { StudentCoachOrchestrator } from "@/modules/ai/orchestrators/student-coach.orchestrator";
import {
  formatStudentCoachContext,
  loadStudentCoachContext,
} from "@/modules/ai/services/studentCoachContextLoader";
import {
  getOrCreateStudentCoachSession,
  getStudentSessionMessages,
  saveStudentCoachPlan,
  saveStudentMessage,
} from "@/modules/ai/services/studentCoachService";
import type { PlanProposalData, SseEvent } from "@/modules/ai/types";

async function getStudentId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
  const { data } = await client.auth.getUser(token);
  return data.user?.id ?? null;
}

export async function POST(request: NextRequest) {
  const studentId = await getStudentId(request);
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const userMessage: string = body.message;
  const encoder = new TextEncoder();

  function sseChunk(event: SseEvent): Uint8Array {
    return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const ctx = await loadStudentCoachContext(studentId);

        const sessionId = await getOrCreateStudentCoachSession(studentId);
        const storedMessages = await getStudentSessionMessages(sessionId);

        const history = storedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const contextText = formatStudentCoachContext(ctx);

        await saveStudentMessage(sessionId, "user", userMessage);

        const orchestrator = new StudentCoachOrchestrator(
          aiProviders.reasoning,
          ctx.coachMode,
          ctx.personaTrack,
        );

        let assistantFullText = "";
        let savedPlanId: string | undefined;

        const onToolCall = async (name: string, input: unknown): Promise<string> => {
          if (name === "save_plan") {
            try {
              const plan = input as PlanProposalData;
              const planId = await saveStudentCoachPlan(studentId, plan.workout, plan.nutrition);
              savedPlanId = planId;
              return JSON.stringify({ success: true, plan_id: planId });
            } catch (err) {
              return JSON.stringify({ error: String(err) });
            }
          }
          return JSON.stringify({ error: "unknown tool" });
        };

        for await (const event of orchestrator.run({
          userMessage,
          history,
          contextText,
          onToolCall,
        })) {
          if (event.type === "text") {
            assistantFullText += event.content;
          }
          controller.enqueue(sseChunk(event));
        }

        if (assistantFullText.trim()) {
          await saveStudentMessage(
            sessionId,
            "assistant",
            assistantFullText,
            savedPlanId ? { saved_plan_id: savedPlanId } : undefined,
          );
        }
      } catch (err) {
        controller.enqueue(
          sseChunk({ type: "error", message: err instanceof Error ? err.message : String(err) }),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
