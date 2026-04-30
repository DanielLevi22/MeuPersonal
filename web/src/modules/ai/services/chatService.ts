import { supabaseAdmin } from "@/lib/supabase-admin";
import type { AiSessionState, ChatMessage, ChatSession } from "../types";

export async function getOrCreateSession(
  studentId: string,
  specialistId: string,
  module: "workout" | "nutrition" | "general" = "workout",
): Promise<string> {
  const { data: existing } = await supabaseAdmin
    .from("ai_chat_sessions" as never)
    .select("id")
    .eq("student_id", studentId)
    .eq("specialist_id", specialistId)
    .eq("module", module)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return (existing as { id: string }).id;

  const { data: created, error } = await supabaseAdmin
    .from("ai_chat_sessions" as never)
    .insert({ student_id: studentId, specialist_id: specialistId, module })
    .select("id")
    .single();

  if (error || !created) throw new Error("Failed to create chat session");
  return (created as { id: string }).id;
}

export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  const { data } = await supabaseAdmin
    .from("ai_chat_messages" as never)
    .select("id, role, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return ((data as unknown[]) ?? []).map((row: unknown) => {
    const r = row as { id: string; role: string; content: string; created_at: string };
    return {
      id: r.id,
      role: r.role as "user" | "assistant",
      content: r.content,
      createdAt: r.created_at,
    };
  });
}

export async function saveMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await supabaseAdmin
    .from("ai_chat_messages" as never)
    .insert({ session_id: sessionId, role, content, metadata: metadata ?? {} });
}

export async function savePeriodization(
  studentId: string,
  specialistId: string,
  data: {
    name: string;
    goal: string;
    durationWeeks: number;
    level: string;
    phases: { name: string; weeks: number; focus: string }[];
  },
): Promise<string> {
  const { data: period, error: periodError } = await supabaseAdmin
    .from("training_periodizations" as never)
    .insert({
      student_id: studentId,
      specialist_id: specialistId,
      name: data.name,
      goal: data.goal,
      duration_weeks: data.durationWeeks,
      level: data.level,
      status: "active",
    })
    .select("id")
    .single();

  if (periodError || !period)
    throw new Error(`Failed to save periodization: ${periodError?.message}`);

  const periodId = (period as { id: string }).id;

  const phaseRows = data.phases.map((ph) => ({
    periodization_id: periodId,
    student_id: studentId,
    specialist_id: specialistId,
    name: ph.name,
    duration_weeks: ph.weeks,
    focus: ph.focus,
  }));

  const { error: phaseError } = await supabaseAdmin
    .from("training_plans" as never)
    .insert(phaseRows as never[]);

  if (phaseError) throw new Error(`Failed to save phases: ${phaseError.message}`);

  return periodId;
}

export async function getSessionState(sessionId: string): Promise<AiSessionState> {
  const { data } = await supabaseAdmin
    .from("ai_chat_sessions" as never)
    .select("state")
    .eq("id" as never, sessionId as never)
    .single();
  const row = data as { state: AiSessionState | null } | null;
  return row?.state ?? { savedWorkouts: [] };
}

export async function updateSessionState(
  sessionId: string,
  patch: Partial<AiSessionState>,
): Promise<void> {
  const current = await getSessionState(sessionId);
  const next = { ...current, ...patch };
  await supabaseAdmin
    .from("ai_chat_sessions" as never)
    .update({ state: next } as never)
    .eq("id" as never, sessionId as never);
}

export type { ChatMessage, ChatSession };
