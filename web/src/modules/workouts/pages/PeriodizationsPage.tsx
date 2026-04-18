"use client";

import Link from "next/link";
import { useState } from "react";
import type { Periodization, PeriodizationStatus } from "@/shared/hooks/usePeriodizations";
import { usePeriodizations } from "@/shared/hooks/usePeriodizations";
import { CreatePeriodizationModal } from "../components/CreatePeriodizationModal";

const OBJECTIVE_LABELS: Record<string, string> = {
  hypertrophy: "Hipertrofia",
  strength: "Força",
  endurance: "Resistência",
  weight_loss: "Emagrecimento",
  conditioning: "Condicionamento",
  general_fitness: "Saúde Geral",
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  planned: { label: "Planejada", className: "bg-blue-500/10 text-blue-400" },
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

function PeriodizationCard({ p }: { p: Periodization }) {
  const status = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.planned;
  const objective = OBJECTIVE_LABELS[p.objective ?? ""] ?? p.objective;

  return (
    <Link
      href={`/dashboard/workouts/periodizations/${p.id}`}
      className="group bg-surface border border-white/10 rounded-2xl p-5 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5 flex flex-col gap-4"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {p.name}
          </h3>
          {p.student && (
            <p className="text-sm text-muted-foreground mt-0.5">{p.student.full_name}</p>
          )}
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="px-2 py-0.5 rounded-md bg-white/5">{objective}</span>
        <span>
          {p.start_date ? formatDate(p.start_date) : "—"} →{" "}
          {p.end_date ? formatDate(p.end_date) : "—"}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-white/5 pt-3">
        <span>
          {p.training_plans_count ?? 0} {(p.training_plans_count ?? 0) === 1 ? "fase" : "fases"}
        </span>
        <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">
          Ver detalhes →
        </span>
      </div>
    </Link>
  );
}

export default function PeriodizationsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<PeriodizationStatus | "all">("all");

  const { data: periodizations = [], isLoading } = usePeriodizations();

  const filtered = periodizations.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.student?.full_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Periodizações</h1>
          <p className="text-muted-foreground mt-1">
            Planeje ciclos de treino completos para seus alunos
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 self-start md:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Periodização
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou aluno..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <div className="flex gap-2">
          {(["all", "active", "planned", "completed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface border border-white/10 text-muted-foreground hover:bg-white/5"
              }`}
            >
              {s === "all" && "Todas"}
              {s === "active" && "Ativas"}
              {s === "planned" && "Planejadas"}
              {s === "completed" && "Concluídas"}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-surface border border-white/10 rounded-2xl p-5 animate-pulse h-36"
            />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16 bg-surface border border-white/10 rounded-2xl">
          <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">
            {search || filterStatus !== "all"
              ? "Nenhuma periodização encontrada"
              : "Nenhuma periodização criada"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {search || filterStatus !== "all"
              ? "Tente outros filtros"
              : "Crie a primeira periodização para um aluno."}
          </p>
          {!search && filterStatus === "all" && (
            <button
              onClick={() => setModalOpen(true)}
              className="px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Nova Periodização
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <PeriodizationCard key={p.id} p={p} />
          ))}
        </div>
      )}

      <CreatePeriodizationModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
