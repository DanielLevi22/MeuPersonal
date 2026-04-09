'use client';

import { useCreateTrainingPlan } from '@/shared/hooks/useTrainingPlanMutations';
import type { TrainingSplit } from '@/shared/hooks/useTrainingPlans';
import { useState } from 'react';

interface CreateTrainingPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodizationId: string;
}

const trainingSplits: { value: TrainingSplit; label: string; description: string }[] = [
  { value: 'abc', label: 'ABC', description: '3 treinos diferentes' },
  { value: 'abcd', label: 'ABCD', description: '4 treinos diferentes' },
  { value: 'abcde', label: 'ABCDE', description: '5 treinos diferentes' },
  { value: 'upper_lower', label: 'Superior/Inferior', description: 'Divisão por região' },
  { value: 'full_body', label: 'Full Body', description: 'Corpo inteiro' },
  { value: 'push_pull_legs', label: 'Push/Pull/Legs', description: 'Empurrar/Puxar/Pernas' },
  { value: 'custom', label: 'Personalizado', description: 'Divisão customizada' },
];

export function CreateTrainingPlanModal({ isOpen, onClose, periodizationId }: CreateTrainingPlanModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trainingSplit, setTrainingSplit] = useState<TrainingSplit>('abc');
  const [weeklyFrequency, setWeeklyFrequency] = useState(3);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState('');

  const createMutation = useCreateTrainingPlan();
  const isLoading = createMutation.isPending;

  const handleAddGoal = () => {
    if (newGoal.trim()) {
      setGoals([...goals, newGoal.trim()]);
      setNewGoal('');
    }
  };

  const handleRemoveGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !startDate || !endDate) return;

    try {
      await createMutation.mutateAsync({
        periodization_id: periodizationId,
        name,
        description: description || undefined,
        training_split: trainingSplit,
        weekly_frequency: weeklyFrequency,
        start_date: startDate,
        end_date: endDate,
        notes: notes || undefined,
        goals: goals.length > 0 ? goals : undefined,
      });

      // Reset form
      setName('');
      setDescription('');
      setTrainingSplit('abc');
      setWeeklyFrequency(3);
      setStartDate('');
      setEndDate('');
      setNotes('');
      setGoals([]);
      setNewGoal('');

      onClose();
    } catch (error) {
      console.error('Error creating training plan:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Nova Ficha de Treino</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              Nome da Ficha *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Ficha ABC - Semanas 1-4"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              required
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
              Descrição
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o objetivo desta ficha..."
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Training Split */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Divisão de Treino *</label>
            <div className="grid grid-cols-2 gap-3">
              {trainingSplits.map((split) => (
                <button
                  key={split.value}
                  type="button"
                  onClick={() => setTrainingSplit(split.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    trainingSplit === split.value
                      ? 'bg-secondary/10 border-secondary'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                  disabled={isLoading}
                >
                  <p className="font-semibold text-foreground text-sm mb-0.5">{split.label}</p>
                  <p className="text-xs text-muted-foreground">{split.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Weekly Frequency */}
          <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-foreground mb-2">
              Frequência Semanal * ({weeklyFrequency}x por semana)
            </label>
            <input
              id="frequency"
              type="range"
              min="1"
              max="7"
              value={weeklyFrequency}
              onChange={(e) => setWeeklyFrequency(parseInt(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
              disabled={isLoading}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1x</span>
              <span>7x</span>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-foreground mb-2">
                Data de Início *
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-foreground mb-2">
                Data de Término *
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Goals */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Metas (Opcional)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGoal())}
                placeholder="Ex: Aumentar carga em 10%"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={handleAddGoal}
                className="px-4 py-2 bg-primary/10 border border-primary rounded-lg text-primary hover:bg-primary/20 transition-colors"
                disabled={isLoading}
              >
                Adicionar
              </button>
            </div>
            {goals.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {goals.map((goal, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm flex items-center gap-2"
                  >
                    🎯 {goal}
                    <button
                      type="button"
                      onClick={() => handleRemoveGoal(index)}
                      className="hover:text-destructive"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-2">
              Observações
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre esta ficha..."
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Error */}
          {createMutation.isError && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3">
              <p className="text-sm text-destructive">
                {(createMutation.error as Error)?.message || 'Erro ao criar ficha'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground font-medium hover:bg-white/10 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !name || !startDate || !endDate}
            >
              {isLoading ? 'Criando...' : 'Criar Ficha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
