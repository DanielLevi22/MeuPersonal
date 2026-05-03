"use client";

import { useAuthStore } from "@/modules/auth";
import { DayOverviewCard } from "../components/DayOverviewCard";
import { GamificationBar } from "../components/GamificationBar";
import {
  useCurrentStudentId,
  useStudentAchievements,
  useStudentActiveDietPlan,
  useStudentStreak,
  useStudentWorkoutPlans,
} from "../hooks/useStudentDashboardData";

export function StudentHomePage() {
  const accountType = useAuthStore((s) => s.accountType);
  const studentId = useCurrentStudentId();

  const { data: workouts, isLoading: loadingWorkouts } = useStudentWorkoutPlans(studentId);
  const { data: activeDiet, isLoading: loadingDiet } = useStudentActiveDietPlan(studentId);
  const { data: streak } = useStudentStreak(studentId);
  const { data: achievements = [] } = useStudentAchievements(studentId);

  const isMember = accountType === "member";
  // Most recent workout as "today's workout" — mobile owns execution scheduling
  const todayWorkout = workouts?.[0] ?? null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">Seu dia</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {isMember
            ? "Acompanhe seus planos e progresso"
            : "Veja o que seu personal preparou para hoje"}
        </p>
      </div>

      <GamificationBar streak={streak} achievements={achievements} />

      <DayOverviewCard
        todayWorkout={todayWorkout}
        activeDietPlan={activeDiet}
        isLoading={loadingWorkouts || loadingDiet}
      />
    </div>
  );
}
