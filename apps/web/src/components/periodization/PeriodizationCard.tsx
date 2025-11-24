'use client';

import type { Periodization } from '@/lib/hooks/usePeriodizations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PeriodizationCardProps {
  periodization: Periodization;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
}

const objectiveLabels: Record<string, string> = {
  hypertrophy: 'Hipertrofia',
  strength: 'Força',
  endurance: 'Resistência',
  weight_loss: 'Emagrecimento',
  conditioning: 'Condicionamento',
  general_fitness: 'Fitness Geral',
};

const objectiveColors: Record<string, string> = {
  hypertrophy: 'from-primary/20 to-primary/5 border-primary',
  strength: 'from-destructive/20 to-destructive/5 border-destructive',
  endurance: 'from-secondary/20 to-secondary/5 border-secondary',
  weight_loss: 'from-accent/20 to-accent/5 border-accent',
  conditioning: 'from-blue-500/20 to-blue-500/5 border-blue-500',
  general_fitness: 'from-green-500/20 to-green-500/5 border-green-500',
};

const statusLabels: Record<string, string> = {
  planned: 'Planejada',
  active: 'Ativa',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

const statusColors: Record<string, string> = {
  planned: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  active: 'bg-primary/10 text-primary border-primary/30',
  completed: 'bg-green-500/10 text-green-400 border-green-500/30',
  cancelled: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30',
};

export function PeriodizationCard({ periodization, onEdit, onView, onDelete }: PeriodizationCardProps) {
  const startDate = new Date(periodization.start_date);
  const endDate = new Date(periodization.end_date);
  const now = new Date();
  
  // Calculate progress
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const progress = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100);

  return (
    <div
      className="relative bg-surface border border-white/10 rounded-xl p-6 hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-black/20 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[periodization.status]}`}>
              {statusLabels[periodization.status]}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border bg-background/50 ${objectiveColors[periodization.objective]}`}>
              {objectiveLabels[periodization.objective]}
            </span>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
            {periodization.name}
          </h3>
          {periodization.student && (
            <p className="text-sm text-muted-foreground">
              👤 {periodization.student.full_name}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
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

      {/* Progress Bar */}
      {periodization.status === 'active' && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Progresso</span>
            <span className="font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-background/50 border border-white/5 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Fichas</p>
          <p className="text-lg font-bold text-foreground">{periodization.training_plans_count || 0}</p>
        </div>
        <div className="bg-background/50 border border-white/5 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Início</p>
          <p className="text-sm font-bold text-foreground">
            {format(startDate, 'dd/MM', { locale: ptBR })}
          </p>
        </div>
        <div className="bg-background/50 border border-white/5 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Fim</p>
          <p className="text-sm font-bold text-foreground">
            {format(endDate, 'dd/MM', { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Notes Preview */}
      {periodization.notes && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground line-clamp-2">
            📝 {periodization.notes}
          </p>
        </div>
      )}

      {/* View Button */}
      <button
        onClick={onView}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground font-medium hover:bg-white/10 hover:border-white/20 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Ver Detalhes
      </button>
    </div>
  );
}
