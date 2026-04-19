import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const { email, password, full_name, service_types } = await request.json();

  if (!email || !password || !full_name || !service_types?.length) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  // Create auth user (auto-confirmed so immediate sign-in works)
  const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, account_type: "specialist", service_types },
  });

  if (authError) {
    const msg =
      authError.message.toLowerCase().includes("already registered") ||
      authError.code === "email_exists"
        ? "Este e-mail já possui uma conta."
        : authError.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (!data.user) {
    return NextResponse.json({ error: "Erro ao criar usuário." }, { status: 500 });
  }

  const userId = data.user.id;

  // Create profile
  const { error: profileError } = await supabaseAdmin.from("profiles" as never).insert({
    id: userId,
    email,
    full_name,
    account_type: "specialist",
    account_status: "active",
  } as never);

  if (profileError) {
    console.error("[register] profile insert error:", profileError);
    // Don't fail registration — ensure-profile will fix it on first login
  }

  // Create specialist_services — one row per service
  if (!profileError) {
    const serviceRows = (service_types as string[]).map((service_type) => ({
      specialist_id: userId,
      service_type,
    }));

    const { error: servicesError } = await supabaseAdmin
      .from("specialist_services" as never)
      .insert(serviceRows as never[]);

    if (servicesError) {
      console.error("[register] specialist_services insert error:", servicesError);
      // Logged but not fatal — ensure-profile will fix on first login
    }
  }

  return NextResponse.json({ success: true });
}
