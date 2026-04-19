import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!supabaseUrl || !serviceRoleKey || serviceRoleKey === "PREENCHER_service_role_key") {
  if (process.env.NODE_ENV !== "test") {
    console.warn(
      "[supabase-admin] Missing or placeholder service role key — admin calls will fail",
    );
  }
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey || "placeholder", {
  auth: { autoRefreshToken: false, persistSession: false },
});
