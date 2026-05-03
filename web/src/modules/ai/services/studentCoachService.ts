import { supabaseAdmin } from "@/lib/supabase-admin";
import type { NutritionProposal, WorkoutProposal } from "../tools/studentCoachTools";

export async function getOrCreateStudentCoachSession(studentId: string): Promise<string> {
  const module = "student_coach";
  const { data: existing } = await supabaseAdmin
    .from("ai_chat_sessions" as never)
    .select("id")
    .eq("student_id", studentId)
    .is("specialist_id", null)
    .eq("module", module)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return (existing as { id: string }).id;

  const { data: created, error } = await supabaseAdmin
    .from("ai_chat_sessions" as never)
    .insert({ student_id: studentId, specialist_id: null, module })
    .select("id")
    .single();

  if (error || !created) throw new Error("Failed to create student coach session");
  return (created as { id: string }).id;
}

export async function getStudentSessionMessages(
  sessionId: string,
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  const { data } = await supabaseAdmin
    .from("ai_chat_messages" as never)
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return ((data as unknown[]) ?? []).map((row: unknown) => {
    const r = row as { role: string; content: string };
    return { role: r.role as "user" | "assistant", content: r.content };
  });
}

export async function saveStudentMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await supabaseAdmin
    .from("ai_chat_messages" as never)
    .insert({ session_id: sessionId, role, content, metadata: metadata ?? {} });
}

export async function saveCoachMode(
  studentId: string,
  mode: "express" | "analytical",
): Promise<void> {
  await supabaseAdmin
    .from("profiles" as never)
    .update({ coach_mode: mode } as never)
    .eq("id", studentId);
}

export async function saveStudentCoachPlan(
  studentId: string,
  workout: WorkoutProposal,
  nutrition: NutritionProposal,
): Promise<string> {
  const { data: period, error: periodError } = await supabaseAdmin
    .from("training_periodizations" as never)
    .insert({
      student_id: studentId,
      specialist_id: null,
      name: workout.split_name,
      goal: workout.goal,
      duration_weeks: workout.duration_weeks,
      level: workout.level,
      status: "active",
    } as never)
    .select("id")
    .single();

  if (periodError || !period)
    throw new Error(`Failed to save student plan: ${periodError?.message}`);

  const periodId = (period as { id: string }).id;

  const phaseRows = workout.days.map((day) => ({
    periodization_id: periodId,
    student_id: studentId,
    specialist_id: null,
    name: day.day_label,
    duration_weeks: 1,
    focus: day.muscle_groups.join(", "),
  }));

  const { error: phaseError } = await supabaseAdmin
    .from("training_plans" as never)
    .insert(phaseRows as never[]);

  if (phaseError) throw new Error(`Failed to save plan days: ${phaseError.message}`);

  // Nutrition summary stored as session state — no separate table needed in Phase 1
  await supabaseAdmin
    .from("ai_chat_sessions" as never)
    .update({
      state: { nutrition_plan: nutrition, saved_periodization_id: periodId },
    } as never)
    .eq("student_id" as never, studentId as never)
    .is("specialist_id" as never, null as never);

  return periodId;
}
