"use client";

import { supabase } from "@meupersonal/supabase";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  useDeleteTrainingPlan,
  useUpdateTrainingPlan,
} from "@/shared/hooks/useTrainingPlanMutations";
import { useTrainingPlan } from "@/shared/hooks/useTrainingPlans";
import type { Workout } from "@/shared/hooks/useWorkouts";
import { useWorkoutsByPlan } from "@/shared/hooks/useWorkouts";

const SPLITS = ["A", "AB", "ABC", "ABCD", "ABCDE", "ABCDEF"];

const PLAN_STATUS_CONFIG = {
  draft: {
    label: "Rascunho",
    className: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  },
  active: {
    label: "Ativo",
    className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  },
  completed: {
    label: "Concluído",
    className: "bg-white/5 text-muted-foreground border border-white/10",
  },
} as const;

function WorkoutCard({ workout }: { workout: Workout }) {
  return (
    <Link
      href={`/dashboard/workouts/${workout.id}`}
      className="group bg-surface border border-white/10 rounded-xl p-4 hover:border-primary/40 transition-all flex items-center gap-4"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
        <span className="text-primary font-bold text-sm">{workout.identifier ?? "?"}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {workout.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {workout.exercise_count ?? 0} exercício{(workout.exercise_count ?? 0) !== 1 ? "s" : ""}
          {workout.estimated_duration ? ` · ${workout.estimated_duration} min` : ""}
        </p>
      </div>
      <svg
        className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

export default function PhaseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const periodizationId = params.id as string;
  const phaseId = params.phaseId as string;

  const [showSplitPicker, setShowSplitPicker] = useState(false);
  const [changingSplit, setChangingSplit] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const { data: plan, isLoading: loadingPlan } = useTrainingPlan(phaseId);
  const { data: workouts = [], isLoading: loadingWorkouts } = useWorkoutsByPlan(phaseId);
  const updateMutation = useUpdateTrainingPlan();
  const deletePhaseMutation = useDeleteTrainingPlan();

  // Unique muscle groups from workouts for filter tabs
  const muscleGroups = Array.from(
    new Set(workouts.flatMap((w) => w.focus_areas ?? []).filter(Boolean)),
  );

  const filteredWorkouts = selectedMuscle
    ? workouts.filter((w) => w.focus_areas?.includes(selectedMuscle))
    : workouts;

  const handleSelectSplit = useCallback(
    async (split: string) => {
      if (!plan) return;
      setChangingSplit(true);
      setShowSplitPicker(false);
      try {
        // 1. Update training_split on the plan
        await updateMutation.mutateAsync({
          id: phaseId,
          data: { training_split: split as never },
        });

        // 2. Delete all existing workouts for this plan
        await supabase.from("workouts").delete().eq("training_plan_id", phaseId);

        // 3. Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Não autenticado");

        // 4. Create one empty workout per letter
        for (const letter of split.split("")) {
          await supabase.from("workouts").insert({
            training_plan_id: phaseId,
            title: `Treino ${letter}`,
            description: "",
            personal_id: user.id,
            identifier: letter,
          });
        }

        queryClient.invalidateQueries({ queryKey: ["workouts-by-plan", phaseId] });
        queryClient.invalidateQueries({ queryKey: ["training-plan", phaseId] });
      } finally {
        setChangingSplit(false);
      }
    },
    [plan, phaseId, updateMutation, queryClient],
  );

  const handleDeletePhase = useCallback(async () => {
    if (!confirm(`Excluir a fase "${plan?.name}"? Todos os treinos serão perdidos.`)) return;
    await deletePhaseMutation.mutateAsync(phaseId);
    router.push(`/dashboard/workouts/periodizations/${periodizationId}`);
  }, [plan, phaseId, periodizationId, deletePhaseMutation, router]);

  const handleUpdateDate = useCallback(
    async (field: "start_date" | "end_date", value: string) => {
      await updateMutation.mutateAsync({ id: phaseId, data: { [field]: value } });
    },
    [phaseId, updateMutation],
  );

  const handleUpdateStatus = useCallback(
    async (status: "draft" | "active" | "completed") => {
      await supabase.from("training_plans").update({ status }).eq("id", phaseId);
      queryClient.invalidateQueries({ queryKey: ["training-plan", phaseId] });
      queryClient.invalidateQueries({ queryKey: ["training-plans"] });
    },
    [phaseId, queryClient],
  );

  const isLoading = loadingPlan || loadingWorkouts;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-surface rounded-lg animate-pulse w-48" />
        <div className="h-36 bg-surface rounded-2xl animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-surface rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Fase não encontrada.</p>
        <button
          onClick={() => router.push(`/dashboard/workouts/periodizations/${periodizationId}`)}
          className="mt-4 text-primary hover:underline text-sm"
        >
          Voltar
        </button>
      </div>
    );
  }

  const statusCfg =
    PLAN_STATUS_CONFIG[plan.status as keyof typeof PLAN_STATUS_CONFIG] ?? PLAN_STATUS_CONFIG.draft;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={() => router.push("/dashboard/workouts")}
          className="hover:text-foreground transition-colors"
        >
          Periodizações
        </button>
        <span>/</span>
        <button
          onClick={() => router.push(`/dashboard/workouts/periodizations/${periodizationId}`)}
          className="hover:text-foreground transition-colors"
        >
          Fases
        </button>
        <span>/</span>
        <span className="text-foreground">{plan.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">{plan.name}</h1>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusCfg.className}`}>
            {statusCfg.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Status cycle */}
          {plan.status === "draft" && (
            <button
              onClick={() => handleUpdateStatus("active")}
              disabled={updateMutation.isPending}
              className="px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
            >
              Ativar
            </button>
          )}
          {plan.status === "active" && (
            <button
              onClick={() => handleUpdateStatus("completed")}
              disabled={updateMutation.isPending}
              className="px-3 py-1.5 text-xs font-medium bg-white/5 text-muted-foreground border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Concluir
            </button>
          )}
          {/* Delete */}
          <button
            onClick={handleDeletePhase}
            disabled={deletePhaseMutation.isPending}
            className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
            title="Excluir fase"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Config card */}
      <div className="bg-surface border border-white/10 rounded-2xl p-6 space-y-5">
        {/* Split + Frequency */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Divisão de Treino
            </p>
            <div className="relative">
              <button
                onClick={() => setShowSplitPicker((v) => !v)}
                disabled={changingSplit}
                className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <span className="text-foreground font-bold text-lg uppercase">
                  {plan.training_split || "--"}
                </span>
                <svg
                  className="w-4 h-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showSplitPicker && (
                <div className="absolute left-0 top-full mt-1 bg-surface border border-white/10 rounded-xl shadow-xl z-20 p-2 flex flex-col gap-1 min-w-[120px]">
                  {SPLITS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSelectSplit(s)}
                      className={`px-4 py-2 rounded-lg text-left text-sm font-bold hover:bg-primary/10 hover:text-primary transition-colors ${
                        plan.training_split === s ? "bg-primary/20 text-primary" : "text-foreground"
                      }`}
                    >
                      {s}
                      <span className="text-xs font-normal text-muted-foreground ml-2">
                        ({s.length} ficha{s.length !== 1 ? "s" : ""})
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Frequência
            </p>
            <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-4 py-2.5 rounded-xl">
              <svg
                className="w-4 h-4 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="text-primary font-bold text-lg">{plan.weekly_frequency ?? 0}x</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5" />

        {/* Dates */}
        <div className="flex gap-4">
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Início
            </p>
            <input
              type="date"
              defaultValue={plan.start_date?.split("T")[0] ?? ""}
              onBlur={(e) => {
                if (e.target.value && e.target.value !== plan.start_date?.split("T")[0]) {
                  handleUpdateDate("start_date", e.target.value);
                }
              }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Término
            </p>
            <input
              type="date"
              defaultValue={plan.end_date?.split("T")[0] ?? ""}
              onBlur={(e) => {
                if (e.target.value && e.target.value !== plan.end_date?.split("T")[0]) {
                  handleUpdateDate("end_date", e.target.value);
                }
              }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </div>

      {/* Workouts section */}
      <div className="space-y-4">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Treinos da Fase <span className="text-foreground">{workouts.length}</span>
          </h2>
        </div>

        {/* Muscle filter tabs */}
        {muscleGroups.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedMuscle(null)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                !selectedMuscle
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface border border-white/10 text-muted-foreground hover:bg-white/5"
              }`}
            >
              Todos
            </button>
            {muscleGroups.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMuscle(m === selectedMuscle ? null : m)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedMuscle === m
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface border border-white/10 text-muted-foreground hover:bg-white/5"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        {/* Loading overlay when changing split */}
        {changingSplit && (
          <div className="flex items-center gap-3 py-4 text-muted-foreground">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Criando treinos para a divisão...</span>
          </div>
        )}

        {/* Empty state */}
        {!changingSplit && filteredWorkouts.length === 0 && (
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <p className="text-muted-foreground text-sm">
              {selectedMuscle
                ? `Nenhum treino com foco em ${selectedMuscle}.`
                : "Selecione uma divisão de treino acima para criar as fichas automaticamente."}
            </p>
          </div>
        )}

        {/* Workout list */}
        {!changingSplit && filteredWorkouts.length > 0 && (
          <div className="flex flex-col gap-3">
            {filteredWorkouts.map((workout) => (
              <WorkoutCard key={workout.id} workout={workout} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
