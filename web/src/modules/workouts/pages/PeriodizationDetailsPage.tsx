"use client";

import { supabase } from "@meupersonal/supabase";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  useActivatePeriodization,
  useCompletePeriodization,
} from "@/shared/hooks/usePeriodizationMutations";
import type { PeriodizationStatus } from "@/shared/hooks/usePeriodizations";
import { usePeriodization } from "@/shared/hooks/usePeriodizations";
import type { TrainingPlan } from "@/shared/hooks/useTrainingPlans";
import { useTrainingPlans } from "@/shared/hooks/useTrainingPlans";

const OBJECTIVE_LABELS: Record<string, string> = {
  hypertrophy: "Hipertrofia",
  strength: "Força",
  endurance: "Resistência",
  weight_loss: "Emagrecimento",
  conditioning: "Condicionamento",
  general_fitness: "Saúde Geral",
};

const STATUS_CONFIG: Record<PeriodizationStatus, { label: string; className: string }> = {
  planned: { label: "Planejada", className: "bg-blue-500/10 text-blue-400" },
  active: { label: "Ativa", className: "bg-emerald-500/10 text-emerald-400" },
  completed: { label: "Concluída", className: "bg-white/5 text-muted-foreground" },
  cancelled: { label: "Cancelada", className: "bg-red-500/10 text-red-400" },
};

const SPLIT_LABELS: Record<string, string> = {
  abc: "ABC",
  abcd: "ABCD",
  abcde: "ABCDE",
  abcdef: "ABCDEF",
  upper_lower: "Superior / Inferior",
  full_body: "Full Body",
  push_pull_legs: "Push / Pull / Legs",
  custom: "Personalizado",
};

const PLAN_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: "Rascunho", className: "bg-white/5 text-muted-foreground" },
  active: { label: "Ativa", className: "bg-emerald-500/10 text-emerald-400" },
  completed: { label: "Concluída", className: "bg-white/5 text-muted-foreground" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function PlanCard({ plan, periodizationId }: { plan: TrainingPlan; periodizationId: string }) {
  const statusCfg = PLAN_STATUS_CONFIG[plan.status] ?? PLAN_STATUS_CONFIG.draft;
  const split = SPLIT_LABELS[plan.training_split] ?? plan.training_split;

  return (
    <Link
      href={`/dashboard/workouts/periodizations/${periodizationId}/phases/${plan.id}`}
      className="group bg-surface border border-white/10 rounded-xl p-4 hover:border-primary/40 transition-all flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {plan.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {split} · {plan.weekly_frequency}×/semana · {formatDate(plan.start_date)} →{" "}
            {formatDate(plan.end_date)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-muted-foreground">
          {plan.workouts_count ?? 0} ficha{(plan.workouts_count ?? 0) !== 1 ? "s" : ""}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.className}`}>
          {statusCfg.label}
        </span>
        <svg
          className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

export default function PeriodizationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const periodizationId = params.id as string;
  const queryClient = useQueryClient();
  const [addingPhase, setAddingPhase] = useState(false);

  const { data: periodization, isLoading: loadingP } = usePeriodization(periodizationId);
  const { data: plans = [], isLoading: loadingPlans } = useTrainingPlans(periodizationId);
  const activateMutation = useActivatePeriodization();
  const completeMutation = useCompletePeriodization();

  const handleAddPhase = async () => {
    setAddingPhase(true);
    try {
      const { error } = await supabase.from("training_plans").insert({
        periodization_id: periodizationId,
        name: `Fase ${plans.length + 1}`,
        description: null,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["training-plans", periodizationId] });
      queryClient.invalidateQueries({ queryKey: ["periodization", periodizationId] });
    } finally {
      setAddingPhase(false);
    }
  };

  const isLoading = loadingP || loadingPlans;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-surface rounded-lg animate-pulse w-48" />
        <div className="h-32 bg-surface rounded-2xl animate-pulse" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-surface rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!periodization) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Periodização não encontrada.</p>
        <button
          onClick={() => router.push("/dashboard/workouts")}
          className="mt-4 text-primary hover:underline text-sm"
        >
          Voltar
        </button>
      </div>
    );
  }

  const status = STATUS_CONFIG[periodization.status] ?? STATUS_CONFIG.planned;
  const objective = OBJECTIVE_LABELS[periodization.objective] ?? periodization.objective;

  return (
    <div className="space-y-6">
      {/* Back */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={() => router.push("/dashboard/workouts")}
          className="hover:text-foreground transition-colors"
        >
          Periodizações
        </button>
        <span>/</span>
        <span className="text-foreground">{periodization.name}</span>
      </div>

      {/* Header card */}
      <div className="bg-surface border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-foreground">{periodization.name}</h1>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.className}`}>
                {status.label}
              </span>
            </div>
            {periodization.student && (
              <p className="text-muted-foreground">{periodization.student.full_name}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
              <span className="px-2 py-0.5 rounded-md bg-white/5 text-xs">{objective}</span>
              <span>
                {formatDate(periodization.start_date)} → {formatDate(periodization.end_date)}
              </span>
              <span>
                {plans.length} fase{plans.length !== 1 ? "s" : ""}
              </span>
            </div>
            {periodization.notes && (
              <p className="text-sm text-muted-foreground mt-3 border-t border-white/5 pt-3">
                {periodization.notes}
              </p>
            )}
          </div>

          {/* Status actions */}
          <div className="flex gap-2 shrink-0">
            {periodization.status === "planned" && (
              <button
                onClick={() => activateMutation.mutateAsync(periodizationId)}
                disabled={activateMutation.isPending}
                className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
              >
                Ativar
              </button>
            )}
            {periodization.status === "active" && (
              <button
                onClick={() => completeMutation.mutateAsync(periodizationId)}
                disabled={completeMutation.isPending}
                className="px-4 py-2 bg-white/5 text-muted-foreground border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                Concluir
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Fichas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Fases</h2>
          <button
            onClick={handleAddPhase}
            disabled={addingPhase}
            className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors text-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addingPhase ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            )}
            Nova Fase
          </button>
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-12 bg-surface border border-white/10 rounded-2xl">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-muted-foreground text-sm">
              Nenhuma fase criada. Adicione a primeira fase desta periodização.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} periodizationId={periodizationId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
