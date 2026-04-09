'use client';

import { CreatePeriodizationModal } from '@/dashboard';
import { PeriodizationCard } from '@/dashboard';
import { useDeletePeriodization } from '@/shared/hooks/usePeriodizationMutations';
import { usePeriodizations } from '@/shared/hooks/usePeriodizations';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function PeriodizationsPage() {
  const router = useRouter();
  const { data: periodizations = [], isLoading } = usePeriodizations();
  const deleteMutation = useDeletePeriodization();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      try {
        await deleteMutation.mutateAsync(id);
        setDeleteConfirm(null);
      } catch (error) {
        console.error('Error deleting periodization:', error);
      }
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      {/* Background Effects Removed */}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">
              Periodizações
            </h1>
            <p className="text-muted-foreground">
              Gerencie os ciclos de treinamento dos seus alunos
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/50 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nova Periodização
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[400px] bg-surface/50 backdrop-blur-xl border border-white/10 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && periodizations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Nenhuma periodização criada
            </h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Crie sua primeira periodização para começar a planejar os ciclos de treinamento dos seus alunos
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/50 transition-all"
            >
              Criar Primeira Periodização
            </button>
          </div>
        )}

        {/* Periodizations Grid */}
        {!isLoading && periodizations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {periodizations.map((periodization) => (
              <PeriodizationCard
                key={periodization.id}
                periodization={periodization}
                onEdit={() => {
                  // TODO: Implement edit
                  console.log('Edit', periodization.id);
                }}
                onView={() => router.push(`/dashboard/periodizations/${periodization.id}`)}
                onDelete={() => handleDelete(periodization.id)}
              />
            ))}
          </div>
        )}

        {/* Delete Confirmation Toast */}
        {deleteConfirm && (
          <div className="fixed bottom-4 right-4 bg-destructive/90 backdrop-blur-xl border border-destructive rounded-lg p-4 shadow-2xl animate-in slide-in-from-bottom">
            <p className="text-destructive-foreground font-medium">
              Clique novamente para confirmar exclusão
            </p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreatePeriodizationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
