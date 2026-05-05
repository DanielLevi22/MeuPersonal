import { createWorkoutsService } from "@elevapro/shared";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import PeriodizationDetailsPage from "@/modules/workouts/pages/PeriodizationDetailsPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workoutsService = createWorkoutsService(supabase as any);

  const [periodization, plans] = await Promise.all([
    workoutsService.fetchPeriodizationById(id),
    workoutsService.fetchTrainingPlans(id),
  ]);

  if (!periodization) notFound();

  return <PeriodizationDetailsPage periodization={periodization} plans={plans} />;
}
