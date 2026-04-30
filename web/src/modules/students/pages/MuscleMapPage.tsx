"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useStudents } from "@/shared/hooks/useStudents";
import { useWorkoutMetrics } from "@/shared/hooks/useWorkoutMetrics";

// Three.js requires browser APIs — disable SSR
const MuscleMapViewer = dynamic(
  () =>
    import("../components/muscle-map/MuscleMapViewer").then((m) => ({
      default: m.MuscleMapViewer,
    })),
  { ssr: false, loading: () => <CanvasSkeleton /> },
);

// ── Skeleton shown while the dynamic import loads ─────────────────────────────

function CanvasSkeleton() {
  return (
    <div className="bg-surface border border-white/10 rounded-xl h-[600px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <span className="text-sm">Carregando modelo 3D…</span>
      </div>
    </div>
  );
}

// ── Period selector ───────────────────────────────────────────────────────────

const PERIODS = [
  { label: "90 dias", value: 90 },
  { label: "180 dias", value: 180 },
  { label: "365 dias", value: 365 },
] as const;

// ── Top muscles panel ─────────────────────────────────────────────────────────

interface TopMusclesPanelProps {
  volumeByMuscle: { muscle: string; volume: number }[];
  selectedMuscle: string | null;
  onSelect: (muscle: string | null) => void;
}

function TopMusclesPanel({ volumeByMuscle, selectedMuscle, onSelect }: TopMusclesPanelProps) {
  const total = volumeByMuscle.reduce((s, m) => s + m.volume, 0);
  const top5 = volumeByMuscle.slice(0, 5);

  return (
    <div className="bg-surface border border-white/10 rounded-xl p-5 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-foreground">Top músculos</h3>
      {top5.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem dados no período.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {top5.map((m, i) => {
            const pct = total > 0 ? Math.round((m.volume / total) * 100) : 0;
            const isSelected = selectedMuscle === m.muscle;
            return (
              <li key={m.muscle}>
                <button
                  type="button"
                  onClick={() => onSelect(isSelected ? null : m.muscle)}
                  className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${
                    isSelected
                      ? "bg-primary/15 border border-primary/30"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}.</span>
                      <span
                        className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}
                      >
                        {m.muscle}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden ml-6">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 ml-6">
                    {m.volume.toLocaleString("pt-BR")} kg·rep
                  </p>
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {selectedMuscle && (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
        >
          ✕ Limpar seleção
        </button>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MuscleMapPage() {
  const params = useParams();
  const studentId = params.id as string;
  const { data: students = [] } = useStudents();
  const student = students.find((s) => s.id === studentId);

  const [days, setDays] = useState<90 | 180 | 365>(90);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const { data: metrics, isLoading } = useWorkoutMetrics(studentId, days);
  const volumeByMuscle = metrics?.volumeByMuscle ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/students/${studentId}`}
            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mapa Muscular</h1>
            {student && <p className="text-sm text-muted-foreground mt-0.5">{student.full_name}</p>}
          </div>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-1 bg-surface border border-white/10 rounded-lg p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setDays(p.value as 90 | 180 | 365)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                days === p.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface border border-white/10 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Grupos treinados</p>
          <p className="text-2xl font-bold text-foreground">
            {isLoading ? "—" : volumeByMuscle.length}
          </p>
        </div>
        <div className="bg-surface border border-white/10 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Volume total</p>
          <p className="text-2xl font-bold text-foreground">
            {isLoading ? "—" : `${(metrics?.totalVolume ?? 0).toLocaleString("pt-BR")} kg·rep`}
          </p>
        </div>
        <div className="bg-surface border border-white/10 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Músculo + treinado</p>
          <p className="text-2xl font-bold text-primary">
            {isLoading ? "—" : (metrics?.topMuscle ?? "—")}
          </p>
        </div>
      </div>

      {/* Main layout: viewer + side panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 items-start">
        <MuscleMapViewer volumeByMuscle={volumeByMuscle} onMuscleSelect={setSelectedMuscle} />

        <TopMusclesPanel
          volumeByMuscle={volumeByMuscle}
          selectedMuscle={selectedMuscle}
          onSelect={setSelectedMuscle}
        />
      </div>
    </div>
  );
}
