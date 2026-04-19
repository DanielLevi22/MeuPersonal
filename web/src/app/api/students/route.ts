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

  if ((profile as unknown as Record<string, unknown>)?.account_type !== "specialist") return null;
  return user;
}

export async function POST(request: NextRequest) {
  try {
    const caller = await getCallerSpecialist(request);
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { fullName, email, password } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: "fullName, email e password são obrigatórios" },
        { status: 400 },
      );
    }

    // Create auth user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, account_type: "student" },
    });

    if (createError) {
      const message =
        createError.message.includes("already registered") || createError.code === "email_exists"
          ? "Email já cadastrado"
          : createError.message;
      return NextResponse.json({ error: message }, { status: 422 });
    }

    const studentId = newUser.user.id;

    // Upsert profile with account_status = 'invited' (Fluxo A)
    await supabaseAdmin.from("profiles" as never).upsert(
      {
        id: studentId,
        email,
        full_name: fullName,
        account_type: "student",
        account_status: "invited",
      } as never,
      { onConflict: "id" },
    );

    // Fetch specialist's services
    const { data: services } = await supabaseAdmin
      .from("specialist_services")
      .select("service_type")
      .eq("specialist_id", caller.id);

    const serviceList =
      services && services.length > 0
        ? (services as { service_type: string }[]).map((s) => s.service_type)
        : ["personal_training"];

    // Create links in student_specialists
    const links = serviceList.map((service_type) => ({
      student_id: studentId,
      specialist_id: caller.id,
      service_type,
      status: "active",
    }));

    const { error: linkError } = await supabaseAdmin
      .from("student_specialists" as never)
      .upsert(links as never[], {
        onConflict: "student_id,specialist_id,service_type",
        ignoreDuplicates: true,
      });

    if (linkError) {
      console.error("[POST /api/students] student_specialists upsert error:", linkError);
      return NextResponse.json(
        { error: "Erro ao vincular aluno ao especialista" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, student_id: studentId }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/students]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
