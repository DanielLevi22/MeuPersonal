"use client";

import Link from "next/link";
import { useWorkout } from "@/shared/hooks/useWorkouts";

interface Props {
  workoutId: string;
}

export function StudentWorkoutDetailPage({ workoutId }: Props) {
  const { data: workout, isLoading } = useWorkout(workoutId);

  if (isLoading) {
    return <div className="h-64 bg-zinc-900/40 border border-white/5 rounded-2xl animate-pulse" />;
  }

  if (!workout) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500">Treino não encontrado.</p>
        <Link
          href="/dashboard/student/workouts"
          className="text-primary text-sm font-bold mt-4 inline-block"
        >
          Voltar para treinos
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/student/workouts"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800 border border-white/5 text-zinc-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            {workout.title}
          </h1>
          {workout.description && (
            <p className="text-sm text-zinc-500 mt-0.5">{workout.description}</p>
          )}
        </div>
      </div>

      <div className="bg-zinc-900/40 border border-white/5 rounded-2xl px-4 py-2">
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-2 py-3">
          {workout.exercises?.length ?? 0} exercícios — execução no app mobile
        </p>
        <div className="flex flex-col divide-y divide-white/5">
          {(workout.exercises ?? []).map((ex, idx) => (
            <div key={ex.id} className="flex items-center gap-4 px-2 py-4">
              <span className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-500 text-xs font-black flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {ex.exercise?.name ?? "Exercício"}
                </p>
                {ex.exercise?.muscle_group && (
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mt-0.5">
                    {ex.exercise.muscle_group}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-zinc-300">
                  {ex.sets} × {ex.reps}
                </p>
                {ex.rest_seconds && (
                  <p className="text-[10px] text-zinc-600 font-bold">{ex.rest_seconds}s descanso</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
