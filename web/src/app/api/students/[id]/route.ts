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

async function verifyOwnership(specialistId: string, studentId: string) {
  const { data } = await supabaseAdmin
    .from("student_specialists")
    .select("id")
    .eq("specialist_id", specialistId)
    .eq("student_id", studentId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  return !!data;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = await getCallerSpecialist(request);
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: studentId } = await params;
    if (!(await verifyOwnership(caller.id, studentId))) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const { full_name, measurements } = body as {
      full_name?: string;
      measurements?: Record<string, string | number | null>;
    };

    // profiles only has: id, email, full_name, avatar_url, account_type, account_status, created_at
    if (full_name !== undefined) {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ full_name })
        .eq("id", studentId);
      if (error) throw error;
    }

    // Upsert measurements into physical_assessments
    if (measurements && Object.values(measurements).some((v) => v !== null && v !== "")) {
      const numeric: Record<string, number | null> = {};
      for (const [key, val] of Object.entries(measurements)) {
        numeric[key] = val !== null && val !== "" ? Number(val) : null;
      }

      const { data: latest } = await supabaseAdmin
        .from("physical_assessments")
        .select("id")
        .eq("student_id", studentId)
        .eq("specialist_id", caller.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latest) {
        await supabaseAdmin.from("physical_assessments").update(numeric).eq("id", latest.id);
      } else {
        await supabaseAdmin
          .from("physical_assessments")
          .insert({ student_id: studentId, specialist_id: caller.id, ...numeric });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/students/:id]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const caller = await getCallerSpecialist(request);
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: studentId } = await params;
    if (!(await verifyOwnership(caller.id, studentId))) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    // Soft delete — status → inactive (preserva histórico)
    const { error } = await supabaseAdmin
      .from("student_specialists")
      .update({
        status: "inactive",
        ended_by: caller.id,
        ended_at: new Date().toISOString(),
      })
      .eq("specialist_id", caller.id)
      .eq("student_id", studentId)
      .eq("status", "active");

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/students/:id]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
