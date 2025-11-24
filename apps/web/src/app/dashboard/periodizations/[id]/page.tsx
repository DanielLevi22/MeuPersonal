'use client';

import { CreateTrainingPlanModal } from '@/components/training-plans/CreateTrainingPlanModal';
import { ExpandableTrainingPlanCard } from '@/components/training-plans/ExpandableTrainingPlanCard';
import { useUpdatePeriodizationStatus } from '@/lib/hooks/usePeriodizationMutations';
import { usePeriodization } from '@/lib/hooks/usePeriodizations';
import { useStudents } from '@/lib/hooks/useStudents';
import { useCloneTrainingPlan, useDeleteTrainingPlan } from '@/lib/hooks/useTrainingPlanMutations';
import { useTrainingPlans } from '@/lib/hooks/useTrainingPlans';
import { exportPeriodizationToPDF } from '@/lib/utils/exportPeriodizationPDF';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';

export default function PeriodizationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params); // Unwrap the params Promise
  const { data: periodization, isLoading } = usePeriodization(id);
  const { data: trainingPlans = [], isLoading: plansLoading } = useTrainingPlans(id);
  const { data: students = [] } = useStudents();
  const deletePlanMutation = useDeleteTrainingPlan();
  const clonePlanMutation = useCloneTrainingPlan();
  const updateStatusMutation = useUpdatePeriodizationStatus();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!periodization) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Periodização não encontrada</h2>
          <button
            onClick={() => router.push('/dashboard/periodizations')}
            className="text-primary hover:underline"
          >
            Voltar para periodizações
          </button>
        </div>
      </div>
    );
  }

  const startDate = new Date(periodization.start_date);
  const endDate = new Date(periodization.end_date);
  const now = new Date();
  const totalDays = differenceInDays(endDate, startDate);
  const elapsedDays = differenceInDays(now, startDate);
  const progress = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100);

  const handleDeletePlan = async (planId: string) => {
    if (deleteConfirm === planId) {
      try {
        await deletePlanMutation.mutateAsync(planId);
        setDeleteConfirm(null);
      } catch (error) {
        console.error('Error deleting training plan:', error);
      }
    } else {
      setDeleteConfirm(planId);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleClonePlan = async (planId: string) => {
    try {
      await clonePlanMutation.mutateAsync(planId);
    } catch (error) {
      console.error('Error cloning training plan:', error);
    }
  };

  const handleActivate = async () => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: 'active' });
    } catch (error) {
      console.error('Error activating periodization:', error);
    }
  };

  const handleComplete = async () => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: 'completed' });
    } catch (error) {
      console.error('Error completing periodization:', error);
    }
  };

  const handleExportPDF = async () => {
    if (!periodization) return;
    
    try {
      const student = students.find(s => s.id === periodization.student_id);
      const studentName = student?.full_name || 'Aluno';
      
      // Transform training plans into phases format
      const phases = trainingPlans.map((plan: any, index: number) => ({
        id: plan.id,
        name: `Fase ${index + 1}`,
        start_week: index * 4 + 1,
        end_week: (index + 1) * 4,
        description: plan.description || '',
        workouts: Array.isArray(plan.workouts) ? plan.workouts : [],
      }));
      
      // Create periodization object with required fields
      const periodizationData = {
        ...periodization,
        duration_weeks: periodization.duration_weeks || Math.ceil((new Date(periodization.end_date).getTime() - new Date(periodization.start_date).getTime()) / (7 * 24 * 60 * 60 * 1000)),
      };
      
      await exportPeriodizationToPDF(periodizationData as any, phases, studentName);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Erro ao exportar PDF');
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard/periodizations')}
          className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>

        {/* Header */}
        <div className="bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-foreground mb-2">{periodization.name}</h1>
              {periodization.student && (
                <p className="text-lg text-muted-foreground">
                  👤 {periodization.student.full_name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-surface border border-white/10 text-foreground rounded-lg font-medium hover:bg-white/5 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar PDF
              </button>
              {periodization.status === 'planned' && (
                <button
                  onClick={handleActivate}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:scale-[1.02] transition-all"
                >
                  Ativar
                </button>
              )}
              {periodization.status === 'active' && (
                <button
                  onClick={handleComplete}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:scale-[1.02] transition-all"
                >
                  Concluir
                </button>
              )}
            </div>
          </div>

          {/* Progress */}
          {periodization.status === 'active' && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Progresso</span>
                <span className="font-bold">{Math.round(progress)}%</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Início</p>
              <p className="text-lg font-bold text-foreground">
                {format(startDate, "dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Término</p>
              <p className="text-lg font-bold text-foreground">
                {format(endDate, "dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Duração</p>
              <p className="text-lg font-bold text-foreground">{totalDays} dias</p>
            </div>
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Fichas</p>
              <p className="text-lg font-bold text-foreground">{trainingPlans.length}</p>
            </div>
          </div>

          {periodization.notes && (
            <div className="mt-6 p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Observações:</p>
              <p className="text-foreground">{periodization.notes}</p>
            </div>
          )}
        </div>

        {/* Training Plans Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Fichas de Treino</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:scale-[1.02] hover:shadow-lg hover:shadow-secondary/50 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nova Ficha
            </button>
          </div>

          {/* Loading */}
          {plansLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-[350px] bg-surface/50 backdrop-blur-xl border border-white/10 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!plansLoading && trainingPlans.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 bg-surface/50 backdrop-blur-xl border border-white/10 rounded-2xl">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Nenhuma ficha criada</h3>
              <p className="text-muted-foreground mb-4">Crie a primeira ficha de treino para esta periodização</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:scale-[1.02] transition-all"
              >
                Criar Primeira Ficha
              </button>
            </div>
          )}

          {/* Training Plans Grid */}
          {!plansLoading && trainingPlans.length > 0 && (
            <div className="space-y-6">
              {trainingPlans.map((plan) => (
                <ExpandableTrainingPlanCard
                  key={plan.id}
                  trainingPlan={plan}
                  onEdit={() => console.log('Edit', plan.id)}
                  onDelete={() => handleDeletePlan(plan.id)}
                  onClone={() => handleClonePlan(plan.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Toast */}
        {deleteConfirm && (
          <div className="fixed bottom-4 right-4 bg-destructive/90 backdrop-blur-xl border border-destructive rounded-lg p-4 shadow-2xl animate-in slide-in-from-bottom">
            <p className="text-destructive-foreground font-medium">
              Clique novamente para confirmar exclusão
            </p>
          </div>
        )}
      </div>

      {/* Create Training Plan Modal */}
      <CreateTrainingPlanModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        periodizationId={id}
      />
    </div>
  );
}
