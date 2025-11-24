'use client';

import { useCreateWorkout, useUpdateWorkout } from '@/lib/hooks/useWorkoutMutations';
import { useWorkout } from '@/lib/hooks/useWorkouts';
import { useEffect, useState } from 'react';

interface CreateWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutId?: string;
}

export function CreateWorkoutModal({ isOpen, onClose, workoutId }: CreateWorkoutModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const { data: existingWorkout } = useWorkout(workoutId || '');
  const createMutation = useCreateWorkout();
  const updateMutation = useUpdateWorkout();

  const isEditing = !!workoutId;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Load existing workout data
  useEffect(() => {
    if (existingWorkout) {
      setTitle(existingWorkout.title);
      setDescription(existingWorkout.description || '');
    }
  }, [existingWorkout]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    try {
      if (isEditing && workoutId) {
        await updateMutation.mutateAsync({
          id: workoutId,
          data: { title, description },
        });
      } else {
        await createMutation.mutateAsync({ title, description });
      }
      onClose();
    } catch (error) {
      console.error('Error saving workout:', error);
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
      <div className="relative bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {isEditing ? 'Editar Treino' : 'Novo Treino'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
              Título *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Treino A - Peito e Tríceps"
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
              placeholder="Descreva o objetivo deste treino..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Error Message */}
          {(createMutation.isError || updateMutation.isError) && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3">
              <p className="text-sm text-destructive">
                {(createMutation.error as Error)?.message || (updateMutation.error as Error)?.message || 'Erro ao salvar treino'}
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
              disabled={isLoading || !title.trim()}
            >
              {isLoading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar Treino'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
