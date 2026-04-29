"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useExerciseLoadHistory,
  useExercisesWithHistory,
  useWorkoutMetrics,
} from "@/shared/hooks/useWorkoutMetrics";

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-surface border border-white/10 rounded-xl p-5">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-white/10 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-5">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-48 bg-white/5 rounded-lg animate-pulse" />
  );
}

const TOOLTIP_STYLE = {
  backgroundColor: "#1a1d27",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "8px",
  color: "#e2e8f0",
  fontSize: 12,
};

// ── Workout Metrics Tab ────────────────────────────────────────────────────────

function WorkoutMetricsTab({ studentId }: { studentId: string }) {
  const [days, setDays] = useState<30 | 60 | 90>(90);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const { data: metrics, isLoading } = useWorkoutMetrics(studentId, days);
  const { data: exercises = [] } = useExercisesWithHistory(studentId);
  const { data: loadHistory = [], isLoading: loadLoading } = useExerciseLoadHistory(
    studentId,
    selectedExercise ?? exercises[0]?.id ?? null,
  );

  const activeExercise = selectedExercise ?? exercises[0]?.id ?? null;

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-2">
        {([30, 60, 90] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              days === d
                ? "bg-primary text-primary-foreground"
                : "bg-surface border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            {d} dias
          </button>
        ))}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Treinos realizados"
          value={isLoading ? "—" : String(metrics?.totalSessions ?? 0)}
          sub={`nos últimos ${days} dias`}
        />
        <StatCard
          label="Volume total"
          value={
            isLoading
              ? "—"
              : metrics?.totalVolume
                ? `${(metrics.totalVolume / 1000).toFixed(1)}t`
                : "0 kg"
          }
          sub="peso × reps acumulado"
        />
        <StatCard
          label="Músculo mais treinado"
          value={isLoading ? "—" : (metrics?.topMuscle ?? "—")}
          sub="por volume total"
        />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly frequency */}
        <ChartCard title="Frequência Semanal">
          {isLoading ? (
            <ChartSkeleton />
          ) : !metrics?.weeklyFrequency.length ? (
            <EmptyState message="Nenhum treino registrado no período." />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={metrics.weeklyFrequency} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="sessions" name="Treinos" fill="#CCFF00" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Volume by muscle */}
        <ChartCard title="Volume por Músculo (kg × reps)">
          {isLoading ? (
            <ChartSkeleton />
          ) : !metrics?.volumeByMuscle.length ? (
            <EmptyState message="Sem dados de volume ainda." />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={metrics.volumeByMuscle} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)} />
                <YAxis dataKey="muscle" type="category" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={72} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.03)" }} formatter={(v) => [`${v} kg·rep`, "Volume"]} />
                <Bar dataKey="volume" name="Volume" fill="#60A5FA" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Stimulus distribution */}
      {!isLoading && metrics?.stimulus && metrics.stimulus.length > 0 && (
        <ChartCard title="Distribuição de Estímulo (por séries)">
          <div className="flex items-center gap-6">
            {metrics.stimulus.map((s) => (
              <div key={s.name} className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{s.name}</span>
                  <span className="text-sm font-bold text-foreground">{s.value}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${s.value}%`, backgroundColor: s.color }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {s.name === "Força" && "≤ 6 reps"}
                  {s.name === "Hipertrofia" && "7–12 reps"}
                  {s.name === "Resistência" && "≥ 13 reps"}
                </p>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      {/* Load evolution */}
      <ChartCard title="Evolução de Carga por Exercício">
        {exercises.length > 0 && (
          <div className="mb-4">
            <select
              value={activeExercise ?? ""}
              onChange={(e) => setSelectedExercise(e.target.value || null)}
              className="bg-background border border-white/10 text-foreground text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {loadLoading ? (
          <ChartSkeleton />
        ) : !loadHistory.length ? (
          <EmptyState message="Nenhum histórico de carga disponível." />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={loadHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} unit="kg" />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v} kg`, "Carga máx."]} />
              <Line
                type="monotone"
                dataKey="weight"
                name="Carga máx."
                stroke="#CCFF00"
                strokeWidth={2}
                dot={{ fill: "#CCFF00", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-48 flex items-center justify-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type MetricsTab = "workouts" | "nutrition";

export default function StudentMetricsPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const [activeTab, setActiveTab] = useState<MetricsTab>("workouts");

  const tabs: { id: MetricsTab; label: string; soon?: boolean }[] = [
    { id: "workouts", label: "Treinos" },
    { id: "nutrition", label: "Nutrição", soon: true },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="text-sm text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>
        <h1 className="text-3xl font-bold text-foreground">Métricas</h1>
        <p className="text-muted-foreground mt-1">Evolução e desempenho do aluno.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-surface border border-white/10 rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.soon && setActiveTab(tab.id)}
            disabled={tab.soon}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : tab.soon
                  ? "text-muted-foreground/40 cursor-not-allowed"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            {tab.label}
            {tab.soon && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground/60">
                Em breve
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "workouts" && <WorkoutMetricsTab studentId={studentId} />}
    </div>
  );
}
