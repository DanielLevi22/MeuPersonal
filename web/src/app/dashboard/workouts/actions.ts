"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function getAuthUserId(): Promise<string> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  return user.id;
}

// ── Exercise items ─────────────────────────────────────────────────────────

export async function addExerciseAction(
  workoutId: string,
  periodizationId: string,
  phaseId: string,
  input: {
    exercise_id: string;
    order_index: number;
    sets: number;
    reps: string;
    rest_seconds: number;
    weight: string | null;
  },
) {
  await getAuthUserId();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("workout_exercises" as never).insert({
    workout_id: workoutId,
    ...input,
  } as never);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/workouts/${workoutId}`);
  revalidatePath(`/dashboard/workouts/periodizations/${periodizationId}/phases/${phaseId}`);
}

export async function updateExerciseAction(
  itemId: string,
  workoutId: string,
  input: {
    sets: number;
    reps: string;
    rest_seconds: number;
    weight: string | null;
  },
) {
  await getAuthUserId();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("workout_exercises" as never)
    .update(input as never)
    .eq("id", itemId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/workouts/${workoutId}`);
}

export async function deleteExerciseAction(itemId: string, workoutId: string) {
  await getAuthUserId();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("workout_exercises" as never)
    .delete()
    .eq("id", itemId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/workouts/${workoutId}`);
}

// ── Import workout from library ────────────────────────────────────────────

export async function importWorkoutAction(sourceWorkoutId: string, phaseId: string) {
  const userId = await getAuthUserId();
  const supabase = await createServerSupabaseClient();

  // Fetch source workout
  const { data: source, error: srcErr } = await supabase
    .from("workouts" as never)
    .select("*")
    .eq("id", sourceWorkoutId)
    .maybeSingle();

  if (srcErr) throw new Error(srcErr.message);
  if (!source) throw new Error("Treino não encontrado na biblioteca");

  const src = source as Record<string, unknown>;

  // Duplicate workout linked to this phase
  const { data: created, error: wErr } = await supabase
    .from("workouts" as never)
    .insert({
      training_plan_id: phaseId,
      title: src.title,
      description: src.description,
      specialist_id: userId,
      muscle_group: src.muscle_group,
      difficulty: src.difficulty,
    } as never)
    .select()
    .maybeSingle();

  if (wErr) throw new Error(wErr.message);
  if (!created) throw new Error("Erro ao criar cópia do treino");

  const newWorkout = created as Record<string, unknown>;

  // Fetch and duplicate exercises
  const { data: sourceItems } = await supabase
    .from("workout_exercises" as never)
    .select("*")
    .eq("workout_id", sourceWorkoutId)
    .order("order_index", { ascending: true });

  if (sourceItems && (sourceItems as unknown[]).length > 0) {
    const newItems = (sourceItems as Record<string, unknown>[]).map((item) => ({
      workout_id: newWorkout.id,
      exercise_id: item.exercise_id,
      order_index: item.order_index,
      sets: item.sets,
      reps: item.reps,
      weight: item.weight,
      rest_seconds: item.rest_seconds,
      notes: item.notes,
    }));
    await supabase.from("workout_exercises" as never).insert(newItems as never[]);
  }

  revalidatePath(`/dashboard/workouts/periodizations`);
}

// ── Phase (training_plan) ──────────────────────────────────────────────────

export async function addPhaseAction(periodizationId: string) {
  await getAuthUserId();
  const supabase = await createServerSupabaseClient();

  const today = new Date().toISOString().split("T")[0];
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Count existing phases for auto-naming
  const { count } = await supabase
    .from("training_plans" as never)
    .select("id", { count: "exact", head: true })
    .eq("periodization_id", periodizationId);

  const { error } = await supabase.from("training_plans" as never).insert({
    periodization_id: periodizationId,
    name: `Fase ${(count ?? 0) + 1}`,
    start_date: today,
    end_date: in30Days,
    status: "planned",
  } as never);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/workouts/periodizations/${periodizationId}`);
}

export async function updatePhaseStatusAction(
  phaseId: string,
  periodizationId: string,
  status: "planned" | "active" | "completed",
) {
  await getAuthUserId();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("training_plans" as never)
    .update({ status } as never)
    .eq("id", phaseId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/workouts/periodizations/${periodizationId}/phases/${phaseId}`);
  revalidatePath(`/dashboard/workouts/periodizations/${periodizationId}`);
}
