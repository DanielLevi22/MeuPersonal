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

  if (profile?.account_type !== "professional") return null;
  return user;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const body = await request.json();
    const { fullName, phone, notes, measurements } = body;

    // Update basic profile fields
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        ...(fullName !== undefined && { full_name: fullName }),
        ...(phone !== undefined && { phone }),
        ...(notes !== undefined && { notes }),
      })
      .eq("id", studentId);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 422 });
    }

    // Insert new physical assessment if measurements provided
    if (measurements && Object.values(measurements).some((v) => v !== null && v !== "")) {
      const parseNum = (v: unknown) => (v !== "" && v != null ? parseFloat(String(v)) : null);

      await supabaseAdmin.from("physical_assessments").insert({
        student_id: studentId,
        personal_id: caller.id,
        weight: parseNum(measurements.weight),
        height: parseNum(measurements.height),
        neck: parseNum(measurements.neck),
        shoulder: parseNum(measurements.shoulder),
        chest: parseNum(measurements.chest),
        waist: parseNum(measurements.waist),
        abdomen: parseNum(measurements.abdomen),
        hips: parseNum(measurements.hips),
        arm_right_relaxed: parseNum(measurements.armRightRelaxed),
        arm_left_relaxed: parseNum(measurements.armLeftRelaxed),
        thigh_proximal_right: parseNum(measurements.thighRight),
        thigh_proximal_left: parseNum(measurements.thighLeft),
        calf_right: parseNum(measurements.calfRight),
        calf_left: parseNum(measurements.calfLeft),
      });
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

    // Remove all coachings between this professional and student
    await supabaseAdmin
      .from("coachings")
      .delete()
      .eq("professional_id", caller.id)
      .eq("client_id", studentId);

    // Check if student still has coachings with other professionals
    const { data: remaining } = await supabaseAdmin
      .from("coachings")
      .select("client_id")
      .eq("client_id", studentId)
      .limit(1);

    // If no other professional manages this student, delete the auth user
    if (!remaining || remaining.length === 0) {
      await supabaseAdmin.auth.admin.deleteUser(studentId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/students/:id]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
