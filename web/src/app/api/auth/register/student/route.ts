import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const { email, password, full_name } = await request.json();

  if (!email || !password || !full_name) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Senha deve ter no mínimo 8 caracteres" }, { status: 400 });
  }

  const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, account_type: "student" },
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

  const { error: profileError } = await supabaseAdmin.from("profiles" as never).insert({
    id: data.user.id,
    email,
    full_name,
    account_type: "student",
    account_status: "active",
  } as never);

  if (profileError) {
    console.error("[register/student] profile insert error:", profileError);
  }

  return NextResponse.json({ success: true });
}
