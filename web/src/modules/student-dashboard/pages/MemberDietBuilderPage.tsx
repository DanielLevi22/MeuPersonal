"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthUser } from "@/shared/hooks/useAuthUser";
import { useCreateDietPlan } from "@/shared/hooks/useNutrition";
import { Field } from "../components/Field";

export function MemberDietBuilderPage() {
  const router = useRouter();
  const { mutateAsync: createPlan, isPending } = useCreateDietPlan();
  const { data: authUser } = useAuthUser();

  const [name, setName] = useState("");
  const [targetCalories, setTargetCalories] = useState("");
  const [targetProtein, setTargetProtein] = useState("");
  const [targetCarbs, setTargetCarbs] = useState("");
  const [targetFat, setTargetFat] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !authUser) return;
    setError(null);

    try {
      await createPlan({
        student_id: authUser.id,
        name: name.trim(),
        target_calories: targetCalories ? Number(targetCalories) : null,
        target_protein: targetProtein ? Number(targetProtein) : null,
        target_carbs: targetCarbs ? Number(targetCarbs) : null,
        target_fat: targetFat ? Number(targetFat) : null,
        notes: notes.trim() || null,
      });
      router.push("/dashboard/student/nutrition");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar plano");
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-lg">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/student/nutrition"
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
            Novo plano alimentar
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">Defina suas metas nutricionais</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Nome do plano *">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Plano de hipertrofia"
            required
            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary/40 transition-colors"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Calorias (kcal)">
            <input
              type="number"
              min={0}
              value={targetCalories}
              onChange={(e) => setTargetCalories(e.target.value)}
              placeholder="2500"
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary/40 transition-colors"
            />
          </Field>
          <Field label="Proteína (g)">
            <input
              type="number"
              min={0}
              value={targetProtein}
              onChange={(e) => setTargetProtein(e.target.value)}
              placeholder="180"
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary/40 transition-colors"
            />
          </Field>
          <Field label="Carboidratos (g)">
            <input
              type="number"
              min={0}
              value={targetCarbs}
              onChange={(e) => setTargetCarbs(e.target.value)}
              placeholder="300"
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary/40 transition-colors"
            />
          </Field>
          <Field label="Gordura (g)">
            <input
              type="number"
              min={0}
              value={targetFat}
              onChange={(e) => setTargetFat(e.target.value)}
              placeholder="80"
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary/40 transition-colors"
            />
          </Field>
        </div>

        <Field label="Observações">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Restrições, preferências alimentares..."
            rows={3}
            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary/40 transition-colors resize-none"
          />
        </Field>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="mt-2 w-full py-3.5 bg-primary text-black font-black text-sm uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Criando..." : "Criar plano"}
        </button>
      </form>
    </div>
  );
}
