'use client';

import type { TrainingPlan } from '@/shared/hooks/useTrainingPlans';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TrainingPlanCardProps {
  trainingPlan: TrainingPlan;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
  onClone: () => void;
}

const splitLabels: Record<string, string> = {
  abc: 'ABC',
  abcd: 'ABCD',
  abcde: 'ABCDE',
  abcdef: 'ABCDEF',
  upper_lower: 'Superior/Inferior',
  full_body: 'Full Body',
  push_pull_legs: 'Push/Pull/Legs',
  custom: 'Personalizado',
};

const statusColors: Record<string, string> = {
  draft: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30',
  active: 'bg-primary/10 text-primary border-primary/30',
  completed: 'bg-green-500/10 text-green-400 border-green-500/30',
};

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  active: 'Ativa',
  completed: 'Concluída',
};

export function TrainingPlanCard({ trainingPlan, onEdit, onView, onDelete, onClone }: TrainingPlanCardProps) {
  const startDate = new Date(trainingPlan.start_date);
  const endDate = new Date(trainingPlan.end_date);

  return (
    <div className="relative bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-2xl group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[trainingPlan.status]}`}>
              {statusLabels[trainingPlan.status]}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-secondary/10 text-secondary border border-secondary/30">
              {splitLabels[trainingPlan.training_split]}
            </span>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
            {trainingPlan.name}
          </h3>
          {trainingPlan.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {trainingPlan.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClone}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Clonar"
          >
            <svg className="w-5 h-5 text-muted-foreground hover:text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={onEdit}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Editar"
          >
            <svg className="w-5 h-5 text-muted-foreground hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
            title="Excluir"
          >
            <svg className="w-5 h-5 text-muted-foreground hover:text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-background/50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Treinos</p>
          <p className="text-lg font-bold text-foreground">{trainingPlan.workouts_count || 0}</p>
        </div>
        <div className="bg-background/50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Frequência</p>
          <p className="text-lg font-bold text-foreground">{trainingPlan.weekly_frequency}x</p>
        </div>
        <div className="bg-background/50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Duração</p>
          <p className="text-sm font-bold text-foreground">
            {format(startDate, 'dd/MM', { locale: ptBR })} - {format(endDate, 'dd/MM', { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Goals */}
      {trainingPlan.goals && trainingPlan.goals.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">Metas:</p>
          <div className="flex flex-wrap gap-2">
            {trainingPlan.goals.map((goal, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-primary/10 text-primary rounded text-xs"
              >
                🎯 {goal}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* View Button */}
      <button
        onClick={onView}
        className="w-full px-4 py-3 bg-primary/10 border-2 border-primary rounded-lg text-primary font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Ver Treinos
      </button>

      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}
