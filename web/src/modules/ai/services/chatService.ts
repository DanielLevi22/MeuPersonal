import type { Json } from "@/lib/database.types";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { AiSessionState, ChatMessage, ChatSession } from "../types";

export async function getOrCreateSession(
  studentId: string,
  specialistId: string,
  module: "workout" | "nutrition" | "general" = "workout",
): Promise<string> {
  const { data: existing } = await supabaseAdmin
    .from("ai_chat_sessions")
    .select("id")
    .eq("student_id", studentId)
    .eq("specialist_id", specialistId)
    .eq("module", module)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabaseAdmin
    .from("ai_chat_sessions")
    .insert({ student_id: studentId, specialist_id: specialistId, module })
    .select("id")
    .single();

  if (error || !created) throw new Error("Failed to create chat session");
  return created.id;
}

export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  const { data } = await supabaseAdmin
    .from("ai_chat_messages")
    .select("id, role, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    role: row.role as "user" | "assistant",
    content: row.content,
    createdAt: row.created_at ?? "",
  }));
}

export async function saveMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await supabaseAdmin
    .from("ai_chat_messages")
    .insert({ session_id: sessionId, role, content, metadata: (metadata ?? {}) as Json });
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
    .from("training_periodizations")
    .insert({
      student_id: studentId,
      specialist_id: specialistId,
      name: data.name,
      objective: data.goal,
      duration_weeks: data.durationWeeks,
      level: data.level,
      status: "active",
    })
    .select("id")
    .single();

  if (periodError || !period)
    throw new Error(`Failed to save periodization: ${periodError?.message}`);

  const phaseRows = data.phases.map((ph) => ({
    periodization_id: period.id,
    name: ph.name,
    duration_weeks: ph.weeks,
    focus: ph.focus,
  }));

  const { error: phaseError } = await supabaseAdmin.from("training_plans").insert(phaseRows);

  if (phaseError) throw new Error(`Failed to save phases: ${phaseError.message}`);

  return period.id;
}

export async function getSessionState(sessionId: string): Promise<AiSessionState> {
  const { data } = await supabaseAdmin
    .from("ai_chat_sessions")
    .select("state")
    .eq("id", sessionId)
    .single();
  const state = data?.state as AiSessionState | null;
  return state ?? { savedWorkouts: [] };
}

export async function updateSessionState(
  sessionId: string,
  patch: Partial<AiSessionState>,
): Promise<void> {
  const current = await getSessionState(sessionId);
  const next = { ...current, ...patch };
  await supabaseAdmin
    .from("ai_chat_sessions")
    .update({ state: next as unknown as Json })
    .eq("id", sessionId);
}

export type { ChatMessage, ChatSession };
