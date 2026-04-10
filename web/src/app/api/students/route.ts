import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    // Authenticate the caller using their JWT
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authorization.replace("Bearer ", "");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    const callerClient = createClient(supabaseUrl, anonKey);
    const {
      data: { user: caller },
    } = await callerClient.auth.getUser(token);

    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify caller is a professional
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("account_type")
      .eq("id", caller.id)
      .single();

    if (profile?.account_type !== "professional") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { fullName, email, password, phone } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: "fullName, email e password são obrigatórios" },
        { status: 400 },
      );
    }

    // Create auth user using Admin SDK (no SQL function needed)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        account_type: "managed_student",
        phone: phone ?? null,
      },
    });

    if (createError) {
      const message =
        createError.message.includes("already registered") || createError.code === "email_exists"
          ? "Email já cadastrado"
          : createError.message;
      return NextResponse.json({ error: message }, { status: 422 });
    }

    const studentId = newUser.user.id;

    // Create profile (trigger may already do this, upsert to be safe)
    await supabaseAdmin.from("profiles").upsert(
      {
        id: studentId,
        email,
        full_name: fullName,
        account_type: "managed_student",
        account_status: "active",
        phone: phone ?? null,
      },
      { onConflict: "id" },
    );

    // Create coaching relationships for each active service of the professional
    const { data: services } = await supabaseAdmin
      .from("professional_services")
      .select("service_category")
      .eq("user_id", caller.id)
      .eq("is_active", true);

    // Fallback to user_metadata when professional_services is empty
    const serviceList =
      services && services.length > 0
        ? services.map((s) => s.service_category)
        : ((caller.user_metadata?.services as string[] | undefined) ?? ["personal_training"]);

    if (serviceList.length > 0) {
      const coachings = serviceList.map((service) => ({
        client_id: studentId,
        professional_id: caller.id,
        service_type: service,
        status: "active",
      }));

      await supabaseAdmin.from("coachings").upsert(coachings, {
        onConflict: "client_id,professional_id,service_type",
        ignoreDuplicates: true,
      });
    }

    return NextResponse.json({ success: true, student_id: studentId }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/students]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
