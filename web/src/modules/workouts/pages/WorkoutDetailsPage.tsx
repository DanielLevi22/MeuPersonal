"use client";

import { supabase } from "@meupersonal/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useDeleteWorkoutItem } from "@/shared/hooks/useWorkoutMutations";
import { useWorkout, useWorkoutItems } from "@/shared/hooks/useWorkouts";
import { CreateWorkoutModal } from "../components/CreateWorkoutModal";
import { ExerciseConfigModal, type SelectedExercise } from "../components/ExerciseConfigModal";
import { SelectExercisesModal } from "../components/SelectExercisesModal";

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

export default function WorkoutDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const workoutId = params.workoutId as string;
  const queryClient = useQueryClient();

  const [editWorkoutOpen, setEditWorkoutOpen] = useState(false);
  const [selectExercisesOpen, setSelectExercisesOpen] = useState(false);
  const [configExercise, setConfigExercise] = useState<{
    id: string;
    name: string;
    muscle_group: string | null;
    video_url?: string | null;
  } | null>(null);

  const { data: workout, isLoading: loadingWorkout } = useWorkout(workoutId);
  const { data: items = [], isLoading: loadingItems } = useWorkoutItems(workoutId);
  const deleteItemMutation = useDeleteWorkoutItem();

  const isLoading = loadingWorkout || loadingItems;

  const handleAddExercise = (exercise: {
    id: string;
    name: string;
    muscle_group: string | null;
    video_url?: string | null;
  }) => {
    setSelectExercisesOpen(false);
    setConfigExercise(exercise);
  };

  const handleSaveExercise = async (ex: SelectedExercise) => {
    await supabase.from("workout_exercises").insert({
      workout_id: workoutId,
      exercise_id: ex.id,
      order: items.length,
      sets: ex.sets,
      reps: ex.reps,
      rest_time: ex.rest_seconds,
      weight: ex.weight || null,
      notes: null,
    });
    queryClient.invalidateQueries({ queryKey: ["workout-items", workoutId] });
    queryClient.invalidateQueries({ queryKey: ["workout", workoutId] });
    queryClient.invalidateQueries({ queryKey: ["workouts-by-plan"] });
    setConfigExercise(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-surface rounded-lg animate-pulse w-48" />
        <div className="h-28 bg-surface rounded-2xl animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-surface rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Treino não encontrado.</p>
        <button onClick={() => router.back()} className="mt-4 text-primary hover:underline text-sm">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => router.back()} className="hover:text-foreground transition-colors">
          ← Voltar
        </button>
      </nav>

      {/* Header card */}
      <div className="bg-surface border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-4">
            {workout.identifier && (
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold">{workout.identifier}</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground">{workout.title}</h1>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                {workout.difficulty_level && (
                  <span className="px-2 py-0.5 rounded-md bg-white/5">
                    {DIFFICULTY_LABELS[workout.difficulty_level]}
                  </span>
                )}
                {workout.estimated_duration && <span>{workout.estimated_duration} min</span>}
                <span>
                  {items.length} exercício{items.length !== 1 ? "s" : ""}
                </span>
              </div>
              {workout.description && (
                <p className="text-sm text-muted-foreground mt-2">{workout.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setEditWorkoutOpen(true)}
            className="px-4 py-2 bg-white/5 border border-white/10 text-muted-foreground rounded-lg text-sm hover:bg-white/10 transition-colors self-start shrink-0"
          >
            Editar Treino
          </button>
        </div>
      </div>

      {/* Exercícios */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Exercícios</h2>
          <button
            onClick={() => setSelectExercisesOpen(true)}
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
            Adicionar Exercício
          </button>
        </div>

        {items.length === 0 ? (
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
              Nenhum exercício adicionado. Comece adicionando exercícios ao treino.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="bg-surface border border-white/10 rounded-xl p-4 flex items-center gap-4"
              >
                {/* Order */}
                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <span className="text-xs text-muted-foreground font-medium">{index + 1}</span>
                </div>

                {/* Exercise info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {item.exercise?.name ?? "Exercício desconhecido"}
                  </p>
                  {item.exercise?.muscle_group && (
                    <p className="text-xs text-muted-foreground">{item.exercise.muscle_group}</p>
                  )}
                </div>

                {/* Config */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                  <div className="text-center">
                    <p className="text-foreground font-semibold">{item.sets}</p>
                    <p>séries</p>
                  </div>
                  <div className="text-center">
                    <p className="text-foreground font-semibold">{item.reps}</p>
                    <p>reps</p>
                  </div>
                  {item.weight && (
                    <div className="text-center">
                      <p className="text-foreground font-semibold">{item.weight}</p>
                      <p>carga</p>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-foreground font-semibold">{item.rest_time}s</p>
                    <p>descanso</p>
                  </div>
                </div>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() =>
                    deleteItemMutation.mutate(item.id, {
                      onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ["workout-items", workoutId] });
                        queryClient.invalidateQueries({ queryKey: ["workout", workoutId] });
                        queryClient.invalidateQueries({ queryKey: ["workouts-by-plan"] });
                      },
                    })
                  }
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors shrink-0"
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
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateWorkoutModal
        isOpen={editWorkoutOpen}
        onClose={() => setEditWorkoutOpen(false)}
        workoutId={workoutId}
        trainingPlanId={workout.training_plan_id ?? undefined}
      />

      <SelectExercisesModal
        isOpen={selectExercisesOpen}
        onClose={() => setSelectExercisesOpen(false)}
        onSelectExercise={handleAddExercise}
        selectedIds={items.map((i) => i.exercise_id)}
      />

      {configExercise && (
        <ExerciseConfigModal
          isOpen={true}
          onClose={() => setConfigExercise(null)}
          exercise={configExercise}
          onSave={handleSaveExercise}
        />
      )}
    </div>
  );
}
