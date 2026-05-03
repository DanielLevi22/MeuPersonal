"use client";

import Link from "next/link";
import { useAuthStore } from "@/modules/auth";
import { EmptyPlanState } from "../components/EmptyPlanState";
import { WorkoutCard } from "../components/WorkoutCard";
import { useCurrentStudentId, useStudentWorkoutPlans } from "../hooks/useStudentDashboardData";

export function StudentWorkoutsPage() {
  const accountType = useAuthStore((s) => s.accountType);
  const studentId = useCurrentStudentId();
  const { data: workouts = [], isLoading } = useStudentWorkoutPlans(studentId);

  const isMember = accountType === "member";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Treinos</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {isMember ? "Seus planos de treino" : "Treinos prescritos pelo seu personal"}
          </p>
        </div>
        {isMember && (
          <Link
            href="/dashboard/student/workouts/new"
            className="px-5 py-2.5 bg-primary text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-colors"
          >
            + Novo treino
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 bg-zinc-900/40 border border-white/5 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : workouts.length === 0 ? (
        <EmptyPlanState type="workout" isMember={isMember} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workouts.map((w) => (
            <WorkoutCard key={w.id} workout={w} />
          ))}
        </div>
      )}
    </div>
  );
}
