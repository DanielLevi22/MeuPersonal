'use client';

import { DayOptionsModal, MealEditor } from '@/nutrition';
import { useClearDay, useCopyDay, useDietMeals, useDietPlan, usePasteDay } from '@/shared/hooks/useNutrition';
import { useStudents } from '@/shared/hooks/useStudents';
import { exportDietToPDF } from '@/shared/utils/exportDietPDF';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

const DAYS_OF_WEEK = [
  { id: 0, label: 'Domingo', short: 'Dom' },
  { id: 1, label: 'Segunda', short: 'Seg' },
  { id: 2, label: 'Terça', short: 'Ter' },
  { id: 3, label: 'Quarta', short: 'Qua' },
  { id: 4, label: 'Quinta', short: 'Qui' },
  { id: 5, label: 'Sexta', short: 'Sex' },
  { id: 6, label: 'Sábado', short: 'Sáb' },
];

export default function DietDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: dietPlan, isLoading } = useDietPlan(id);
  const { data: meals = [] } = useDietMeals(id);
  const { data: students = [] } = useStudents();
  const [selectedDay, setSelectedDay] = useState(1); // Default to Monday
  const [isDayOptionsOpen, setIsDayOptionsOpen] = useState(false);
  const [copiedDay, setCopiedDay] = useState<{ meals: any[]; dayOfWeek: number } | null>(null);

  const copyDayMutation = useCopyDay();
  const pasteDayMutation = usePasteDay();
  const clearDayMutation = useClearDay();

  const handleCopyDay = async () => {
    try {
      const result = await copyDayMutation.mutateAsync({ 
        dietPlanId: id, 
        dayOfWeek: selectedDay 
      });
      setCopiedDay(result);
    } catch (error) {
      console.error('Error copying day:', error);
      alert('Erro ao copiar dia');
    }
  };

  const handlePasteDay = async () => {
    if (!copiedDay) return;
    
    try {
      await pasteDayMutation.mutateAsync({
        dietPlanId: id,
        targetDay: selectedDay,
        copiedMeals: copiedDay.meals || [],
      });
    } catch (error) {
      console.error('Error pasting day:', error);
      alert('Erro ao colar dia');
    }
  };

  const handleClearDay = async () => {
    try {
      await clearDayMutation.mutateAsync({
        dietPlanId: id,
        dayOfWeek: selectedDay,
      });
    } catch (error) {
      console.error('Error clearing day:', error);
      alert('Erro ao limpar dia');
    }
  };

  const handleExportPDF = async () => {
    if (!dietPlan) return;
    
    try {
      const student = students.find(s => s.id === dietPlan.student_id);
      const studentName = student?.full_name || 'Aluno';
      
      await exportDietToPDF(dietPlan, meals, studentName);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Erro ao exportar PDF');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando plano...</div>;
  }

  if (!dietPlan) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">Plano não encontrado</p>
        <button
          onClick={() => router.back()}
          className="text-primary hover:underline"
        >
          Voltar
        </button>
      </div>
    );
  }

  const isCyclic = dietPlan.plan_type === 'cyclic';
  const currentDayName = DAYS_OF_WEEK.find(d => d.id === selectedDay)?.label || '';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para Dietas
          </button>
          <h1 className="text-3xl font-bold text-foreground">{dietPlan.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className={`px-2 py-0.5 rounded-full border text-xs ${
              dietPlan.status === 'active' 
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
            }`}>
              {dietPlan.status === 'active' ? 'Ativo' : 'Inativo'}
            </span>
            <span>
              {format(new Date(dietPlan.start_date), "d 'de' MMM", { locale: ptBR })} - {format(new Date(dietPlan.end_date), "d 'de' MMM", { locale: ptBR })}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar PDF
          </button>
          
          {isCyclic && (
            <button
              onClick={() => setIsDayOptionsOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
              Opções do Dia
            </button>
          )}
        </div>
      </div>

      {/* Day Selector (Tabs) */}
      {isCyclic ? (
        <div className="flex overflow-x-auto pb-2 gap-2 custom-scrollbar">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedDay === day.id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'bg-surface border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              <span className="md:hidden">{day.short}</span>
              <span className="hidden md:inline">{day.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-surface border border-white/10 rounded-lg p-4 text-center text-muted-foreground">
          Este é um plano de dieta única (todos os dias seguem o mesmo cardápio).
        </div>
      )}

      {/* Meal Editor */}
      <MealEditor 
        dietPlanId={id} 
        dayOfWeek={isCyclic ? selectedDay : -1} 
      />

      {/* Day Options Modal */}
      <DayOptionsModal
        isOpen={isDayOptionsOpen}
        onClose={() => setIsDayOptionsOpen(false)}
        onCopy={handleCopyDay}
        onPaste={handlePasteDay}
        onClear={handleClearDay}
        canPaste={!!copiedDay}
        dayName={currentDayName}
      />
    </div>
  );
}
