import { useDietPlans, useImportDiet } from '@/lib/hooks/useNutrition';
import { useStudents } from '@/lib/hooks/useStudents';
import { useState } from 'react';

interface ImportDietModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStudentId?: string;
}

export function ImportDietModal({ isOpen, onClose, targetStudentId }: ImportDietModalProps) {
  const [selectedSourceStudent, setSelectedSourceStudent] = useState('');
  const [selectedDietPlan, setSelectedDietPlan] = useState('');
  const [selectedTargetStudent, setSelectedTargetStudent] = useState(targetStudentId || '');

  const { data: students = [] } = useStudents();
  const { data: sourceDietPlans = [] } = useDietPlans(selectedSourceStudent);
  const importDietMutation = useImportDiet();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDietPlan || !selectedTargetStudent) {
      alert('Selecione um plano e um aluno de destino');
      return;
    }

    try {
      await importDietMutation.mutateAsync({
        sourceDietPlanId: selectedDietPlan,
        targetStudentId: selectedTargetStudent,
      });
      
      // Reset form
      setSelectedSourceStudent('');
      setSelectedDietPlan('');
      setSelectedTargetStudent(targetStudentId || '');
      onClose();
      
      alert('Dieta importada com sucesso!');
    } catch (error: any) {
      console.error('Error importing diet:', error);
      alert(error.message || 'Erro ao importar dieta');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-surface border border-white/10 rounded-xl w-full max-w-md shadow-2xl">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-foreground">Importar Dieta</h2>
            <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Aluno de Origem
              </label>
              <select
                value={selectedSourceStudent}
                onChange={(e) => {
                  setSelectedSourceStudent(e.target.value);
                  setSelectedDietPlan(''); // Reset diet plan when changing student
                }}
                className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">Selecione um aluno</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name}
                  </option>
                ))}
              </select>
            </div>

            {selectedSourceStudent && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Plano de Dieta
                </label>
                <select
                  value={selectedDietPlan}
                  onChange={(e) => setSelectedDietPlan(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Selecione um plano</option>
                  {sourceDietPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} ({plan.status === 'active' ? 'Ativo' : 'Inativo'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!targetStudentId && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Aluno de Destino
                </label>
                <select
                  value={selectedTargetStudent}
                  onChange={(e) => setSelectedTargetStudent(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Selecione um aluno</option>
                  {students
                    .filter(s => s.id !== selectedSourceStudent)
                    .map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.full_name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {selectedDietPlan && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  ⚠️ Importante:
                </p>
                <p className="text-xs text-muted-foreground">
                  A dieta será copiada completamente, incluindo todas as refeições e alimentos.
                  O aluno de destino não pode ter um plano ativo.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={importDietMutation.isPending}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importDietMutation.isPending ? 'Importando...' : 'Importar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
