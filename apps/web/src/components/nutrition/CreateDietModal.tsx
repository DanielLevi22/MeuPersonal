import { useCreateDietPlan } from '@/lib/hooks/useNutrition';
import { useStudents } from '@/lib/hooks/useStudents';
import { useState } from 'react';

interface CreateDietModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateDietModal({ isOpen, onClose }: CreateDietModalProps) {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [planType, setPlanType] = useState<'unique' | 'cyclic'>('cyclic');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [targetCalories, setTargetCalories] = useState(2000);
  const [targetProtein, setTargetProtein] = useState(150);
  const [targetCarbs, setTargetCarbs] = useState(200);
  const [targetFat, setTargetFat] = useState(60);

  const { data: students = [] } = useStudents();
  const createMutation = useCreateDietPlan();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;

    try {
      await createMutation.mutateAsync({
        name,
        student_id: studentId,
        personal_id: '', // Handled by hook
        plan_type: planType,
        start_date: startDate,
        end_date: endDate || new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        target_calories: targetCalories,
        target_protein: targetProtein,
        target_carbs: targetCarbs,
        target_fat: targetFat,
      });
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating diet plan:', error);
    }
  };

  const resetForm = () => {
    setName('');
    setStudentId('');
    setPlanType('cyclic');
    setTargetCalories(2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-surface border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h2 className="text-2xl font-bold text-foreground">Criar Plano Alimentar</h2>
            <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Nome do Plano</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ex: Dieta de Cutting"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Aluno</label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Tipo de Plano</label>
              <select
                value={planType}
                onChange={(e) => setPlanType(e.target.value as 'unique' | 'cyclic')}
                className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="cyclic">Cíclica (Dias da semana)</option>
                <option value="unique">Única (Todo dia igual)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Data de Início</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Metas Diárias (Macros)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Calorias (kcal)</label>
                <input
                  type="number"
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(Number(e.target.value))}
                  className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Proteína (g)</label>
                <input
                  type="number"
                  value={targetProtein}
                  onChange={(e) => setTargetProtein(Number(e.target.value))}
                  className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Carboidratos (g)</label>
                <input
                  type="number"
                  value={targetCarbs}
                  onChange={(e) => setTargetCarbs(Number(e.target.value))}
                  className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Gorduras (g)</label>
                <input
                  type="number"
                  value={targetFat}
                  onChange={(e) => setTargetFat(Number(e.target.value))}
                  className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? 'Criando...' : 'Criar Plano'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
