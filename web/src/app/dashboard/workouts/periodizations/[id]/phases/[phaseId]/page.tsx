import { createWorkoutsService } from "@elevapro/shared";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import PhaseDetailsPage from "@/modules/workouts/pages/PhaseDetailsPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; phaseId: string }>;
}) {
  const { id: periodizationId, phaseId } = await params;
  const supabase = await createServerSupabaseClient();
  const workoutsService = createWorkoutsService(supabase as never);

  const [plan, workouts] = await Promise.all([
    workoutsService.fetchTrainingPlanById(phaseId),
    workoutsService.fetchWorkoutsByPlan(phaseId),
  ]);

  if (!plan) notFound();

  return (
    <PhaseDetailsPage
      plan={plan}
      workouts={workouts}
      periodizationId={periodizationId}
      phaseId={phaseId}
    />
  );
}
