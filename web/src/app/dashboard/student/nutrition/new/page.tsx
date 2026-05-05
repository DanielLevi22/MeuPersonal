import { getUserContextJWT } from "@elevapro/supabase";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DietCreatorPage } from "@/modules/nutrition/pages/DietCreatorPage";

export default async function Page() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/auth/login");

  const context = await getUserContextJWT(session.user.id, session);
  if (context.accountType !== "member") redirect("/dashboard/student/nutrition");

  return <DietCreatorPage />;
}
