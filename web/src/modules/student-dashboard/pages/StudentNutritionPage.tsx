"use client";

import Link from "next/link";
import { useAuthStore } from "@/modules/auth";
import { EmptyPlanState } from "../components/EmptyPlanState";
import { useCurrentStudentId, useStudentActiveDietPlan } from "../hooks/useStudentDashboardData";

export function StudentNutritionPage() {
  const accountType = useAuthStore((s) => s.accountType);
  const studentId = useCurrentStudentId();
  const { data: activePlan, isLoading } = useStudentActiveDietPlan(studentId);

  const isMember = accountType === "member";

  if (isLoading) {
    return <div className="h-64 bg-zinc-900/40 border border-white/5 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Nutrição</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {isMember ? "Seu plano alimentar" : "Plano alimentar prescrito pelo seu nutricionista"}
          </p>
        </div>
        {isMember && (
          <Link
            href="/dashboard/student/nutrition/new"
            className="px-5 py-2.5 bg-primary text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-colors"
          >
            + Novo plano
          </Link>
        )}
      </div>

      {!activePlan ? (
        <EmptyPlanState type="nutrition" isMember={isMember} />
      ) : (
        <ActiveDietPlanView
          planId={activePlan.id}
          planName={activePlan.name ?? "Plano alimentar"}
        />
      )}
    </div>
  );
}

function ActiveDietPlanView({ planId, planName }: { planId: string; planName: string }) {
  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-white uppercase tracking-tight">{planName}</h2>
        <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg text-[10px] font-black text-primary uppercase tracking-widest">
          Ativo
        </span>
      </div>
      <p className="text-sm text-zinc-500">
        A execução do plano alimentar — registrar refeições e acompanhar macros — é feita pelo app
        mobile.
      </p>
      <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
        ID do plano: {planId}
      </div>
    </div>
  );
}
