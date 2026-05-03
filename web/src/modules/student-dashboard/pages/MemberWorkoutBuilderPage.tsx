"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthUser } from "@/shared/hooks/useAuthUser";
import { useCreateWorkout } from "@/shared/hooks/useWorkoutMutations";
import { Field } from "../components/Field";

type Difficulty = "beginner" | "intermediate" | "advanced";
type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: "monday", label: "Segunda" },
  { value: "tuesday", label: "Terça" },
  { value: "wednesday", label: "Quarta" },
  { value: "thursday", label: "Quinta" },
  { value: "friday", label: "Sexta" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
];

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "beginner", label: "Iniciante" },
  { value: "intermediate", label: "Intermediário" },
  { value: "advanced", label: "Avançado" },
];

export function MemberWorkoutBuilderPage() {
  const router = useRouter();
  const { mutateAsync: createWorkout, isPending } = useCreateWorkout();
  const { data: authUser } = useAuthUser();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !authUser) return;
    setError(null);

    try {
      const workout = await createWorkout({
        student_id: authUser.id,
        specialist_id: null,
        title: title.trim(),
        description: description.trim() || null,
        muscle_group: muscleGroup.trim() || null,
        difficulty,
        day_of_week: dayOfWeek,
      });
      router.push(`/dashboard/student/workouts/${workout.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar treino");
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-lg">
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
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Novo treino</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Crie um treino personalizado</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Nome do treino *">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Treino A — Peito e Tríceps"
            required
            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary/40 transition-colors"
          />
        </Field>

        <Field label="Descrição">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Objetivo, observações..."
            rows={3}
            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary/40 transition-colors resize-none"
          />
        </Field>

        <Field label="Grupo muscular">
          <input
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value)}
            placeholder="Ex: Peito e Tríceps"
            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary/40 transition-colors"
          />
        </Field>

        <Field label="Dificuldade">
          <div className="flex gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDifficulty(d.value)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-colors ${
                  difficulty === d.value
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-zinc-900 border-white/10 text-zinc-500 hover:border-white/20"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Dia da semana">
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDayOfWeek(dayOfWeek === d.value ? null : d.value)}
                className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-colors ${
                  dayOfWeek === d.value
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-zinc-900 border-white/10 text-zinc-500 hover:border-white/20"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </Field>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={isPending || !title.trim()}
          className="mt-2 w-full py-3.5 bg-primary text-black font-black text-sm uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Criando..." : "Criar treino"}
        </button>
      </form>
    </div>
  );
}
