import { supabaseAdmin } from "@/lib/supabase-admin";
import type { StudentContext } from "../types";

export async function loadStudentContext(
  studentId: string,
  specialistId: string,
): Promise<StudentContext> {
  const [profileRes, anamnesisRes, assessmentRes, periodizationsRes] = await Promise.all([
    supabaseAdmin
      .from("profiles" as never)
      .select("full_name")
      .eq("id", studentId)
      .single(),

    supabaseAdmin
      .from("student_anamnesis" as never)
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabaseAdmin
      .from("physical_assessments" as never)
      .select("weight, height, body_fat_percentage, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabaseAdmin
      .from("training_periodizations" as never)
      .select(
        `
        id, name, goal, status,
        training_plans(id, name, duration_weeks, focus)
      `,
      )
      .eq("student_id", studentId)
      .eq("specialist_id", specialistId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const profile = (profileRes.data as { full_name: string } | null) ?? { full_name: "Aluno" };
  const periodizations = ((periodizationsRes.data as unknown[]) ?? []).map((p: unknown) => {
    const period = p as {
      id: string;
      name: string;
      goal: string;
      status: string;
      training_plans: { id: string; name: string; duration_weeks: number; focus: string }[];
    };
    return {
      id: period.id,
      name: period.name,
      goal: period.goal,
      status: period.status,
      phases: (period.training_plans ?? []).map((pl) => ({
        id: pl.id,
        name: pl.name,
        weeks: pl.duration_weeks,
        focus: pl.focus,
      })),
    };
  });

  return {
    studentId,
    name: profile.full_name,
    anamnesis: (anamnesisRes.data as Record<string, unknown> | null) ?? null,
    lastAssessment: (assessmentRes.data as Record<string, unknown> | null) ?? null,
    periodizations,
  };
}

export function formatContextForPrompt(ctx: StudentContext): string {
  const lines: string[] = [`Aluno: ${ctx.name}`];

  if (ctx.anamnesis) {
    const a = ctx.anamnesis as Record<string, unknown>;
    lines.push("\n--- ANAMNESE ---");
    if (a.objective) lines.push(`Objetivo: ${a.objective}`);
    if (a.training_experience) lines.push(`Experiência: ${a.training_experience}`);
    if (a.training_frequency) lines.push(`Frequência semanal: ${a.training_frequency}x`);
    if (a.injuries) lines.push(`Lesões/Restrições: ${a.injuries}`);
    if (a.health_conditions) lines.push(`Condições de saúde: ${a.health_conditions}`);
    if (a.available_days) lines.push(`Dias disponíveis: ${a.available_days}`);
  } else {
    lines.push("\n--- ANAMNESE ---\nNão preenchida.");
  }

  if (ctx.lastAssessment) {
    const a = ctx.lastAssessment as Record<string, unknown>;
    lines.push("\n--- ÚLTIMA AVALIAÇÃO ---");
    if (a.weight) lines.push(`Peso: ${a.weight} kg`);
    if (a.height) lines.push(`Altura: ${a.height} cm`);
    if (a.body_fat_percentage) lines.push(`% Gordura: ${a.body_fat_percentage}%`);
    if (a.created_at)
      lines.push(`Data: ${new Date(a.created_at as string).toLocaleDateString("pt-BR")}`);
  } else {
    lines.push("\n--- ÚLTIMA AVALIAÇÃO ---\nNenhuma avaliação registrada.");
  }

  if (ctx.periodizations.length > 0) {
    lines.push("\n--- PERIODIZAÇÕES EXISTENTES ---");
    for (const p of ctx.periodizations) {
      lines.push(`• ${p.name} (${p.goal}) — Status: ${p.status}`);
      if (p.phases.length > 0) {
        for (const ph of p.phases) {
          lines.push(`  - ${ph.name}: ${ph.weeks} semanas — ${ph.focus}`);
        }
      } else {
        lines.push("  (sem fases definidas)");
      }
    }
  } else {
    lines.push("\n--- PERIODIZAÇÕES EXISTENTES ---\nNenhuma periodização criada ainda.");
  }

  return lines.join("\n");
}
