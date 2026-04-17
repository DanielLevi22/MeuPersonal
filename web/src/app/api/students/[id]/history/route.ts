import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function getCallerSpecialist(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.replace("Bearer ", "");
  const callerClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
  const {
    data: { user },
  } = await callerClient.auth.getUser(token);
  if (!user) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .single();

  if (profile?.account_type !== "specialist") return null;
  return user;
}

export interface HistoryEvent {
  id: string;
  type: "workout_session" | "physical_assessment" | "diet_plan";
  title: string;
  subtitle: string;
  date: string;
  status?: "completed" | "in_progress";
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = await getCallerSpecialist(request);
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: studentId } = await params;

    // Verify active link exists
    const { data: link } = await supabaseAdmin
      .from("student_specialists")
      .select("id")
      .eq("specialist_id", caller.id)
      .eq("student_id", studentId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (!link) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });

    const [sessionsResult, assessmentsResult, dietPlansResult] = await Promise.all([
      supabaseAdmin
        .from("workout_sessions")
        .select("id, started_at, completed_at, workout:workouts(title)")
        .eq("student_id", studentId)
        .order("started_at", { ascending: false })
        .limit(50),

      supabaseAdmin
        .from("physical_assessments")
        .select("id, created_at, weight, height")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(50),

      supabaseAdmin
        .from("diet_plans")
        .select("id, name, created_at, status")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const events: HistoryEvent[] = [];

    for (const s of sessionsResult.data ?? []) {
      const workout = s.workout as unknown as { title: string } | null;
      events.push({
        id: s.id,
        type: "workout_session",
        title: workout?.title ?? "Treino",
        subtitle: s.completed_at ? "Treino concluído" : "Treino iniciado",
        date: s.started_at,
        status: s.completed_at ? "completed" : "in_progress",
      });
    }

    for (const a of assessmentsResult.data ?? []) {
      const detail = a.weight ? `${a.weight} kg` : "Medidas registradas";
      events.push({
        id: a.id,
        type: "physical_assessment",
        title: "Avaliação física",
        subtitle: detail,
        date: a.created_at,
      });
    }

    for (const p of dietPlansResult.data ?? []) {
      events.push({
        id: p.id,
        type: "diet_plan",
        title: p.name ?? "Plano alimentar",
        subtitle: p.status === "active" ? "Plano ativo" : "Plano encerrado",
        date: p.created_at,
      });
    }

    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ events: events.slice(0, 100) });
  } catch (error) {
    console.error("[GET /api/students/:id/history]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
