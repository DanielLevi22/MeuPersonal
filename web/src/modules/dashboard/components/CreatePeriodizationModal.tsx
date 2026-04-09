'use client';

import { useCreatePeriodization } from '@/shared/hooks/usePeriodizationMutations';
import type { PeriodizationObjective } from '@/shared/hooks/usePeriodizations';
import { useStudents } from '@/shared/hooks/useStudents';
import { useState } from 'react';

interface CreatePeriodizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const objectives: { value: PeriodizationObjective; label: string; description: string }[] = [
  { value: 'hypertrophy', label: 'Hipertrofia', description: 'Ganho de massa muscular' },
  { value: 'strength', label: 'Força', description: 'Aumento de força máxima' },
  { value: 'endurance', label: 'Resistência', description: 'Melhora da resistência muscular' },
  { value: 'weight_loss', label: 'Emagrecimento', description: 'Perda de gordura corporal' },
  { value: 'conditioning', label: 'Condicionamento', description: 'Melhora do condicionamento físico' },
  { value: 'general_fitness', label: 'Fitness Geral', description: 'Saúde e bem-estar geral' },
];

export function CreatePeriodizationModal({ isOpen, onClose }: CreatePeriodizationModalProps) {
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [objective, setObjective] = useState<PeriodizationObjective>('hypertrophy');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  const { data: students = [] } = useStudents();
  const createMutation = useCreatePeriodization();

  const isLoading = createMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentId || !name || !startDate || !endDate) return;

    try {
      await createMutation.mutateAsync({
        student_id: studentId,
        name,
        objective,
        start_date: startDate,
        end_date: endDate,
        notes: notes || undefined,
      });
      
      // Reset form
      setStudentId('');
      setName('');
      setObjective('hypertrophy');
      setStartDate('');
      setEndDate('');
      setNotes('');
      
      onClose();
    } catch (error) {
      console.error('Error creating periodization:', error);
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
          <h2 className="text-2xl font-bold text-foreground">
            Nova Periodização
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Selection */}
          <div>
            <label htmlFor="student" className="block text-sm font-medium text-foreground mb-2">
              Aluno *
            </label>
            <select
              id="student"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              required
              disabled={isLoading}
            >
              <option value="">Selecione um aluno</option>
              {students.filter((s) => !s.is_invite).map((student) => (
                <option key={student.id} value={student.id}>
                  {student.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              Nome da Periodização *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Ciclo de Hipertrofia - Q1 2024"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              required
              disabled={isLoading}
            />
          </div>

          {/* Objective */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Objetivo *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {objectives.map((obj) => (
                <button
                  key={obj.value}
                  type="button"
                  onClick={() => setObjective(obj.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    objective === obj.value
                      ? 'bg-primary/10 border-primary'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                  disabled={isLoading}
                >
                  <p className="font-semibold text-foreground mb-1">{obj.label}</p>
                  <p className="text-xs text-muted-foreground">{obj.description}</p>
                </button>
              ))}
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

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-2">
              Observações
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre esta periodização..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Error Message */}
          {createMutation.isError && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3">
              <p className="text-sm text-destructive">
                {(createMutation.error as Error)?.message || 'Erro ao criar periodização'}
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
              disabled={isLoading || !studentId || !name || !startDate || !endDate}
            >
              {isLoading ? 'Criando...' : 'Criar Periodização'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
