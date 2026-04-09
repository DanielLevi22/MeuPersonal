import { DietPlan } from '@meupersonal/core';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DietCardProps {
  dietPlan: DietPlan;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function DietCard({ dietPlan, onView, onEdit, onDelete }: DietCardProps) {
  const statusColors = {
    active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    completed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    finished: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    draft: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  };

  const statusLabels = {
    active: 'Ativo',
    completed: 'Concluído',
    finished: 'Finalizado',
    draft: 'Rascunho',
  };

  return (
    <div className="group relative bg-surface border border-white/10 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
            {dietPlan.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {dietPlan.plan_type === 'unique' ? 'Dieta Única' : 'Dieta Cíclica'}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[dietPlan.status]}`}>
          {statusLabels[dietPlan.status]}
        </span>
      </div>

      {/* Macros Summary */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <div className="bg-background/50 p-2 rounded-lg text-center">
          <p className="text-xs text-muted-foreground">Calorias</p>
          <p className="text-sm font-bold text-foreground">{dietPlan.target_calories}</p>
        </div>
        <div className="bg-background/50 p-2 rounded-lg text-center">
          <p className="text-xs text-muted-foreground">Prot</p>
          <p className="text-sm font-bold text-emerald-400">{dietPlan.target_protein}g</p>
        </div>
        <div className="bg-background/50 p-2 rounded-lg text-center">
          <p className="text-xs text-muted-foreground">Carb</p>
          <p className="text-sm font-bold text-blue-400">{dietPlan.target_carbs}g</p>
        </div>
        <div className="bg-background/50 p-2 rounded-lg text-center">
          <p className="text-xs text-muted-foreground">Gord</p>
          <p className="text-sm font-bold text-yellow-400">{dietPlan.target_fat}g</p>
        </div>
      </div>

      {/* Dates */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6">
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {format(new Date(dietPlan.start_date), "d 'de' MMM", { locale: ptBR })}
        </div>
        <span>→</span>
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {format(new Date(dietPlan.end_date), "d 'de' MMM", { locale: ptBR })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-white/5">
        {onView && (
          <button
            onClick={() => onView(dietPlan.id)}
            className="flex-1 px-3 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-lg text-sm font-medium transition-colors"
          >
            Ver Detalhes
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(dietPlan.id)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-colors"
            title="Editar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(dietPlan.id)}
            className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Excluir"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
