import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  getOrCreateSession,
  getSessionMessages,
  saveMessage,
  savePeriodization,
} from "@/modules/ai/services/chatService";
import { formatContextForPrompt, loadStudentContext } from "@/modules/ai/services/contextLoader";
import { runWorkoutOrchestrator } from "@/modules/ai/services/workoutOrchestrator";
import type { SseEvent } from "@/modules/ai/types";

async function getCallerSpecialist(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const client = createClient(supabaseUrl, supabaseAnonKey);

  const { data } = await client.auth.getUser(token);
  return data.user?.id ?? null;
}

async function handleQueryExercises(input: Record<string, unknown>): Promise<string> {
  let query = supabaseAdmin
    .from("exercises" as never)
    .select("name, muscle_group")
    .limit(15);

  if (input.muscle_group) {
    query = query.ilike("muscle_group", `%${input.muscle_group}%` as never);
  }
  if (input.search_term) {
    query = query.ilike("name", `%${input.search_term}%` as never);
  }

  const { data } = await query;
  const exercises = (data as { name: string; muscle_group: string }[] | null) ?? [];
  return JSON.stringify({ exercises });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const { studentId } = await params;

  const specialistId = await getCallerSpecialist(request);
  if (!specialistId) {
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
        const [sessionId, studentCtx] = await Promise.all([
          getOrCreateSession(studentId, specialistId, "workout"),
          loadStudentContext(studentId, specialistId),
        ]);

        const storedMessages = await getSessionMessages(sessionId);
        const history = storedMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

        const contextText = formatContextForPrompt(studentCtx);

        await saveMessage(sessionId, "user", userMessage);

        let assistantFullText = "";
        let savedPeriodizationId: string | undefined;

        const onToolCall = async (name: string, input: unknown): Promise<string> => {
          const typedInput = input as Record<string, unknown>;

          if (name === "save_periodization") {
            try {
              const periodId = await savePeriodization(studentId, specialistId, {
                name: typedInput.name as string,
                goal: typedInput.goal as string,
                durationWeeks: typedInput.durationWeeks as number,
                level: typedInput.level as string,
                phases: typedInput.phases as { name: string; weeks: number; focus: string }[],
              });
              savedPeriodizationId = periodId;
              controller.enqueue(
                sseChunk({
                  type: "saved",
                  entity: "periodization",
                  id: periodId,
                  name: typedInput.name as string,
                }),
              );
              return JSON.stringify({ success: true, periodization_id: periodId });
            } catch (err) {
              return JSON.stringify({ error: String(err) });
            }
          }

          if (name === "query_exercises") {
            return handleQueryExercises(typedInput);
          }

          return JSON.stringify({ error: "unknown tool" });
        };

        const generator = runWorkoutOrchestrator(userMessage, history, contextText, onToolCall);

        for await (const event of generator) {
          if (event.type === "text") {
            assistantFullText += event.content;
          }
          controller.enqueue(sseChunk(event));
        }

        if (assistantFullText.trim()) {
          await saveMessage(
            sessionId,
            "assistant",
            assistantFullText,
            savedPeriodizationId ? { saved_periodization_id: savedPeriodizationId } : undefined,
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const { studentId } = await params;

  const specialistId = await getCallerSpecialist(request);
  if (!specialistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionId = await getOrCreateSession(studentId, specialistId, "workout");
  const messages = await getSessionMessages(sessionId);

  return NextResponse.json({ sessionId, messages });
}
