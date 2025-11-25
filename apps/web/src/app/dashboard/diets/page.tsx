'use client';

import { CreateDietModal } from '@/nutrition';
import { DietCard } from '@/nutrition';
import { ImportDietModal } from '@/nutrition';
import { useDietPlans, useFinishDietPlan } from '@/shared/hooks/useNutrition';
import { useStudents } from '@/shared/hooks/useStudents';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DietsPage() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  
  // Fetch students to filter by student if needed, or just to have the list
  const { data: students = [] } = useStudents();
  
  // For now, we list all diets or filter by a selected student. 
  // Ideally, we might want to see all active diets.
  // The hook expects a studentId, let's adjust it to be optional or handle "all".
  // Since the hook `useDietPlans` currently requires `studentId` to be enabled, 
  // we might need to update the hook to support fetching ALL diets if no ID is provided, 
  // or iterate through students. 
  // For this MVP, let's assume we select a student to view their diets, 
  // OR we update the hook to fetch all diets for the personal trainer.
  
  // Let's update the hook usage pattern. 
  // If we want a dashboard view of "All Diets", we need a new query in the hook.
  // For now, let's just show a student selector to view their diets.
  
  const { data: dietPlans = [], isLoading } = useDietPlans(selectedStudentId);
  const finishMutation = useFinishDietPlan();

  const handleFinish = async (id: string) => {
    if (confirm('Tem certeza que deseja finalizar este plano?')) {
      await finishMutation.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-8 relative">
      {/* Header */}
      <div className="relative">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Dietas e Nutrição
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie os planos alimentares dos seus alunos
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-6 py-3 bg-surface border border-white/10 text-foreground rounded-lg font-medium hover:bg-white/5 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Importar Dieta
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/50 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Criar Plano
            </button>
          </div>
        </div>
      </div>

      {/* Student Filter */}
      <div className="bg-surface border border-white/10 rounded-xl p-4 flex items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">Filtrar por Aluno:</span>
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="bg-background border border-white/10 rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent min-w-[200px]"
        >
          <option value="">Selecione um aluno...</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.full_name}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-white/10 rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-white/10 rounded w-3/4 mb-4" />
              <div className="h-4 bg-white/10 rounded w-full mb-2" />
              <div className="h-4 bg-white/10 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : !selectedStudentId ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Selecione um aluno
          </h3>
          <p className="text-muted-foreground">
            Selecione um aluno acima para visualizar seus planos alimentares
          </p>
        </div>
      ) : dietPlans.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Nenhum plano encontrado
          </h3>
          <p className="text-muted-foreground mb-6">
            Este aluno ainda não possui planos alimentares cadastrados.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/50 transition-all"
          >
            Criar Primeiro Plano
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dietPlans.map((plan) => (
            <DietCard
              key={plan.id}
              dietPlan={plan}
              onDelete={() => handleFinish(plan.id)}
              onEdit={(id) => router.push(`/dashboard/diets/${id}`)}
              onView={(id) => router.push(`/dashboard/diets/${id}`)}
            />
          ))}
        </div>
      )}

      <CreateDietModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <ImportDietModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        targetStudentId={selectedStudentId}
      />
    </div>
  );
}
