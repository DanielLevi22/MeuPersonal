import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authorization.replace("Bearer ", "");
    const callerClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    );

    const {
      data: { user },
    } = await callerClient.auth.getUser(token);

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const meta = user.user_metadata ?? {};
    const accountType = (meta.account_type ?? "specialist") as string;

    // Ensure profile row exists
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!existing) {
      await supabaseAdmin.from("profiles" as never).insert({
        id: user.id,
        email: user.email,
        full_name: meta.full_name ?? "",
        account_type: accountType,
        account_status: "active",
      } as never);
    }

    // Ensure specialist_services rows exist
    if (accountType === "specialist" && Array.isArray(meta.service_types)) {
      const links = (meta.service_types as string[]).map((service_type) => ({
        specialist_id: user.id,
        service_type,
      }));
      if (links.length > 0) {
        await supabaseAdmin.from("specialist_services" as never).upsert(links as never[], {
          onConflict: "specialist_id,service_type",
          ignoreDuplicates: true,
        });
      }
    }

    return NextResponse.json({ ok: true, created: !existing });
  } catch (error) {
    console.error("[POST /api/auth/ensure-profile]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
