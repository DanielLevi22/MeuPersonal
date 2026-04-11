"use client";

import type { DietPlan } from "@meupersonal/core";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DietDetailsHeaderProps {
  dietPlan: DietPlan;
  onBack: () => void;
  onExportPDF: () => void;
  onDayOptions: () => void;
  isCyclic: boolean;
}

export function DietDetailsHeader({
  dietPlan,
  onBack,
  onExportPDF,
  onDayOptions,
  isCyclic,
}: DietDetailsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Voltar para Dietas
        </button>
        <h1 className="text-3xl font-bold text-foreground">{dietPlan.name}</h1>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span
            className={`px-2 py-0.5 rounded-full border text-xs ${
              dietPlan.status === "active"
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                : "bg-gray-500/10 text-gray-500 border-gray-500/20"
            }`}
          >
            {dietPlan.status === "active" ? "Ativo" : "Inativo"}
          </span>
          <span>
            {format(new Date(dietPlan.start_date), "d 'de' MMM", { locale: ptBR })} -{" "}
            {format(new Date(dietPlan.end_date), "d 'de' MMM", { locale: ptBR })}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-surface border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 00-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Exportar PDF
        </button>

        {isCyclic && (
          <button
            type="button"
            onClick={onDayOptions}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
            Opções do Dia
          </button>
        )}
      </div>
    </div>
  );
}
