import { createWorkoutsService } from "@elevapro/shared";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import PeriodizationsPage from "@/modules/workouts/pages/PeriodizationsPage";

export default async function Page() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles" as never)
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle();

  const accountType = (profile as { account_type: string } | null)?.account_type ?? "specialist";
  const isMember = accountType === "member" || accountType === "student";

  const workoutsService = createWorkoutsService(supabase as never);
  const periodizations = isMember
    ? await workoutsService.fetchStudentPeriodizations(user.id)
    : await workoutsService.fetchPeriodizations(user.id);

  return (
    <PeriodizationsPage
      periodizations={periodizations}
      isMember={isMember}
      memberStudentId={isMember ? user.id : undefined}
    />
  );
}
