"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useTrainingPlan } from "@/shared/hooks/useTrainingPlans";
import type { Workout } from "@/shared/hooks/useWorkouts";
import { useWorkoutsByPlan } from "@/shared/hooks/useWorkouts";
import { CreateWorkoutModal } from "../components/CreateWorkoutModal";

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

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function WorkoutRow({ workout, onClick }: { workout: Workout; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full bg-surface border border-white/10 rounded-xl p-4 hover:border-primary/40 transition-all flex items-center gap-4 text-left"
    >
      {/* Identifier badge */}
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
        <span className="text-primary font-bold text-sm">{workout.identifier ?? "?"}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {workout.title}
        </p>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
          {workout.difficulty_level && <span>{DIFFICULTY_LABELS[workout.difficulty_level]}</span>}
          {workout.estimated_duration && <span>{workout.estimated_duration} min</span>}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-muted-foreground">
          {workout.exercise_count ?? 0} exercício
          {(workout.exercise_count ?? 0) !== 1 ? "s" : ""}
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
    </button>
  );
}

export default function PhaseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const periodizationId = params.id as string;
  const phaseId = params.phaseId as string;

  const [createWorkoutOpen, setCreateWorkoutOpen] = useState(false);

  const { data: plan, isLoading: loadingPlan } = useTrainingPlan(phaseId);
  const { data: workouts = [], isLoading: loadingWorkouts } = useWorkoutsByPlan(phaseId);

  const isLoading = loadingPlan || loadingWorkouts;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-surface rounded-lg animate-pulse w-48" />
        <div className="h-28 bg-surface rounded-2xl animate-pulse" />
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

  const split = SPLIT_LABELS[plan.training_split] ?? plan.training_split;

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

      {/* Header card */}
      <div className="bg-surface border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">{plan.name}</h1>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="px-2 py-0.5 rounded-md bg-white/5 text-xs">{split}</span>
              <span>{plan.weekly_frequency}×/semana</span>
              <span>
                {formatDate(plan.start_date)} → {formatDate(plan.end_date)}
              </span>
              <span>
                {workouts.length} ficha{workouts.length !== 1 ? "s" : ""}
              </span>
            </div>
            {plan.description && (
              <p className="text-sm text-muted-foreground mt-3 border-t border-white/5 pt-3">
                {plan.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Fichas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Fichas</h2>
          <button
            onClick={() => setCreateWorkoutOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors text-sm flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nova Ficha
          </button>
        </div>

        {workouts.length === 0 ? (
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <p className="text-muted-foreground text-sm">
              Nenhuma ficha criada. Crie a primeira ficha desta fase.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {workouts.map((workout) => (
              <WorkoutRow
                key={workout.id}
                workout={workout}
                onClick={() => router.push(`/dashboard/workouts/${workout.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <CreateWorkoutModal
        isOpen={createWorkoutOpen}
        onClose={() => setCreateWorkoutOpen(false)}
        trainingPlanId={phaseId}
      />
    </div>
  );
}
