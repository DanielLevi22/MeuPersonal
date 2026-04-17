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

export interface Assessment {
  id: string;
  created_at: string;
  student_id: string;
  specialist_id: string;
  weight: number | null;
  height: number | null;
  notes: string | null;
  neck: number | null;
  shoulder: number | null;
  chest: number | null;
  arm_right_relaxed: number | null;
  arm_left_relaxed: number | null;
  arm_right_contracted: number | null;
  arm_left_contracted: number | null;
  forearm_right: number | null;
  forearm_left: number | null;
  waist: number | null;
  abdomen: number | null;
  hips: number | null;
  thigh_proximal_right: number | null;
  thigh_proximal_left: number | null;
  thigh_medial_right: number | null;
  thigh_medial_left: number | null;
  calf_right: number | null;
  calf_left: number | null;
  skinfold_chest: number | null;
  skinfold_abdominal: number | null;
  skinfold_thigh: number | null;
  skinfold_triceps: number | null;
  skinfold_suprailiac: number | null;
  skinfold_subscapular: number | null;
  skinfold_midaxillary: number | null;
}

const NUMERIC_FIELDS: Array<
  keyof Omit<Assessment, "id" | "created_at" | "student_id" | "specialist_id" | "notes">
> = [
  "weight",
  "height",
  "neck",
  "shoulder",
  "chest",
  "waist",
  "abdomen",
  "hips",
  "arm_right_relaxed",
  "arm_left_relaxed",
  "arm_right_contracted",
  "arm_left_contracted",
  "forearm_right",
  "forearm_left",
  "thigh_proximal_right",
  "thigh_proximal_left",
  "thigh_medial_right",
  "thigh_medial_left",
  "calf_right",
  "calf_left",
  "skinfold_chest",
  "skinfold_abdominal",
  "skinfold_thigh",
  "skinfold_triceps",
  "skinfold_suprailiac",
  "skinfold_subscapular",
  "skinfold_midaxillary",
];

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = await getCallerSpecialist(request);
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: studentId } = await params;
    if (!(await verifyOwnership(caller.id, studentId))) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from("physical_assessments")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ assessments: data ?? [] });
  } catch (error) {
    console.error("[GET /api/students/:id/assessments]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = await getCallerSpecialist(request);
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: studentId } = await params;
    if (!(await verifyOwnership(caller.id, studentId))) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const record: Record<string, unknown> = {
      student_id: studentId,
      specialist_id: caller.id,
      notes: body.notes || null,
    };

    for (const field of NUMERIC_FIELDS) {
      const val = body[field];
      record[field] = val !== undefined && val !== "" && val !== null ? Number(val) : null;
    }

    const { data, error } = await supabaseAdmin
      .from("physical_assessments")
      .insert(record)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ assessment: data }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/students/:id/assessments]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
