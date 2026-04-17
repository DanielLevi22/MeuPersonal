import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function getCallerProfessional(request: NextRequest) {
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
    const caller = await getCallerProfessional(request);
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: studentId } = await params;

    // Verify this student belongs to the caller
    const { data: coaching } = await supabaseAdmin
      .from("coachings")
      .select("client_id")
      .eq("professional_id", caller.id)
      .eq("client_id", studentId)
      .limit(1)
      .single();

    if (!coaching) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    // Fetch all history in parallel
    const [sessionsResult, assessmentsResult, dietPlansResult] = await Promise.all([
      supabaseAdmin
        .from("workout_sessions")
        .select("id, started_at, completed_at, workouts(title)")
        .eq("student_id", studentId)
        .order("started_at", { ascending: false })
        .limit(50),

      supabaseAdmin
        .from("physical_assessments")
        .select("id, created_at, weight, body_fat_percentage")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(50),

      supabaseAdmin
        .from("nutrition_plans")
        .select("id, name, created_at, is_active")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const events: HistoryEvent[] = [];

    // Workout sessions
    for (const s of sessionsResult.data ?? []) {
      const workout = s.workouts as unknown as { title: string } | null;
      events.push({
        id: s.id,
        type: "workout_session",
        title: workout?.title ?? "Treino",
        subtitle: s.completed_at ? "Treino concluído" : "Treino iniciado",
        date: s.started_at,
        status: s.completed_at ? "completed" : "in_progress",
      });
    }

    // Physical assessments
    for (const a of assessmentsResult.data ?? []) {
      const detail =
        a.weight && a.body_fat_percentage
          ? `${a.weight} kg · ${a.body_fat_percentage}% gordura`
          : a.weight
            ? `${a.weight} kg`
            : "Medidas registradas";
      events.push({
        id: a.id,
        type: "physical_assessment",
        title: "Avaliação física",
        subtitle: detail,
        date: a.created_at,
      });
    }

    // Diet plans
    for (const p of dietPlansResult.data ?? []) {
      events.push({
        id: p.id,
        type: "diet_plan",
        title: p.name,
        subtitle: p.is_active ? "Plano de dieta ativo" : "Plano de dieta",
        date: p.created_at,
      });
    }

    // Sort by date descending
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ events: events.slice(0, 100) });
  } catch (error) {
    console.error("[GET /api/students/:id/history]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
