'use client';

import type { Exercise } from '@/shared/hooks/useExercises';
import { useStudents } from '@/shared/hooks/useStudents';
import { useCreateWorkout, useUpdateWorkout } from '@/shared/hooks/useWorkoutMutations';
import { useWorkout } from '@/shared/hooks/useWorkouts';
import { supabase } from '@meupersonal/supabase';
import { useEffect, useState } from 'react';
import { ExerciseConfigModal, type SelectedExercise } from './ExerciseConfigModal';
import { ExerciseListItem } from './ExerciseListItem';
import { SelectExercisesModal } from './SelectExercisesModal';
import { StudentMultiSelect } from './StudentMultiSelect';

interface CreateWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutId?: string;
  trainingPlanId?: string;
}

export function CreateWorkoutModal({ isOpen, onClose, workoutId, trainingPlanId }: CreateWorkoutModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  // Current exercise being configured (can be a new Exercise or an existing SelectedExercise)
  const [currentExercise, setCurrentExercise] = useState<{
    id: string;
    name: string;
    muscle_group: string | null;
    video_url?: string | null;
  } | null>(null);
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const { data: existingWorkout } = useWorkout(workoutId || '');
  const { data: students = [] } = useStudents();
  const createMutation = useCreateWorkout();
  const updateMutation = useUpdateWorkout();

  const isEditing = !!workoutId;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Load existing workout data
  useEffect(() => {
    if (existingWorkout) {
      setTitle(existingWorkout.title);
      setDescription(existingWorkout.description || '');
      setIdentifier(existingWorkout.identifier || '');
      setEstimatedDuration(existingWorkout.estimated_duration?.toString() || '');
      setDifficultyLevel(existingWorkout.difficulty_level || 'intermediate');
      // TODO: Load workout items if editing
    }
  }, [existingWorkout]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
      setIdentifier('');
      setEstimatedDuration('');
      setDifficultyLevel('intermediate');
      setSelectedStudentIds([]);
      setSelectedExercises([]);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const workoutData = {
        title,
        description,
        training_plan_id: trainingPlanId,
        identifier: trainingPlanId ? identifier : null,
        estimated_duration: estimatedDuration ? parseInt(estimatedDuration) : null,
        difficulty_level: difficultyLevel,
      };

      let newWorkoutId = workoutId;

      if (isEditing && workoutId) {
        await updateMutation.mutateAsync({
          id: workoutId,
          ...workoutData,
        });
      } else {
        const result = await createMutation.mutateAsync(workoutData);
        newWorkoutId = result.id;
      }

      if (newWorkoutId) {
        // Create workout items
        if (selectedExercises.length > 0) {
          // Delete existing items if editing
          if (isEditing) {
            await supabase.from('workout_items').delete().eq('workout_id', newWorkoutId);
          }

          const items = selectedExercises.map((ex, index) => ({
            workout_id: newWorkoutId,
            exercise_id: ex.id,
            order_index: index,
            sets: ex.sets,
            reps: ex.reps,
            rest_seconds: ex.rest_seconds,
            weight: ex.weight || null,
            notes: null, // SelectedExercise doesn't have notes yet, can add later
          }));

          const { error: itemsError } = await supabase
            .from('workout_items')
            .insert(items);

          if (itemsError) throw itemsError;
        }

        // Create workout assignments (only if not part of a training plan)
        if (!trainingPlanId && selectedStudentIds.length > 0) {
          // Delete existing assignments if editing
          if (isEditing) {
            await supabase.from('workout_assignments').delete().eq('workout_id', newWorkoutId);
          }

          const assignments = selectedStudentIds.map(studentId => ({
            workout_id: newWorkoutId,
            student_id: studentId,
          }));

          const { error: assignmentError } = await supabase
            .from('workout_assignments')
            .insert(assignments);

          if (assignmentError) throw assignmentError;
        }
      }

      onClose();
    } catch (error) {
      console.error('Error saving workout:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      alert(`Erro ao salvar treino: ${JSON.stringify(error)}`);
    }
  };

  const handleAddExercise = (exercise: Exercise) => {
    setCurrentExercise({
      id: exercise.id,
      name: exercise.name,
      muscle_group: exercise.muscle_group,
      video_url: exercise.video_url,
    });
    setEditingIndex(null);
    setShowSelectModal(false);
    setShowConfigModal(true);
  };

  const handleSaveExerciseConfig = (config: SelectedExercise) => {
    if (editingIndex !== null) {
      // Edit existing
      const newExercises = [...selectedExercises];
      newExercises[editingIndex] = config;
      setSelectedExercises(newExercises);
    } else {
      // Add new
      setSelectedExercises([...selectedExercises, config]);
    }
    setShowConfigModal(false);
    setCurrentExercise(null);
    setEditingIndex(null);
  };

  const handleEditExercise = (index: number) => {
    const exercise = selectedExercises[index];
    setCurrentExercise({
      id: exercise.id,
      name: exercise.name,
      muscle_group: exercise.muscle_group,
      video_url: exercise.video_url,
    });
    setEditingIndex(index);
    setShowConfigModal(true);
  };

  const handleRemoveExercise = (index: number) => {
    const newExercises = [...selectedExercises];
    newExercises.splice(index, 1);
    setSelectedExercises(newExercises);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-surface z-10 flex-none">
          <h2 className="text-2xl font-bold text-foreground">
            {isEditing ? 'Editar Treino' : 'Novo Treino'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Nome do Treino
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground/50"
                    placeholder="Ex: Treino A - Peito e Tríceps"
                    required
                  />
                </div>

                {trainingPlanId && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Identificador
                      </label>
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full px-4 py-2 bg-background border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground/50"
                        placeholder="Ex: A, B, C"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Duração (min)
                      </label>
                      <input
                        type="number"
                        value={estimatedDuration}
                        onChange={(e) => setEstimatedDuration(e.target.value)}
                        className="w-full px-4 py-2 bg-background border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground/50"
                        placeholder="Ex: 60"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Descrição (Opcional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground/50 min-h-[100px]"
                    placeholder="Instruções gerais para o treino..."
                  />
                </div>

                {trainingPlanId && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Nível de Dificuldade
                    </label>
                    <div className="flex gap-2">
                      {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setDifficultyLevel(level)}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            difficultyLevel === level
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-background border border-white/10 text-muted-foreground hover:bg-white/5'
                          }`}
                        >
                          {level === 'beginner' && 'Iniciante'}
                          {level === 'intermediate' && 'Intermediário'}
                          {level === 'advanced' && 'Avançado'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Student Selection - Only if not in a training plan */}
                {!trainingPlanId && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Atribuir a Alunos (Opcional)
                    </label>
                    <StudentMultiSelect
                      students={students}
                      selectedIds={selectedStudentIds}
                      onSelectionChange={setSelectedStudentIds}
                    />
                  </div>
                )}
              </div>

              {/* Exercises List */}
              <div className="flex flex-col h-full min-h-[500px]">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-muted-foreground">
                    Exercícios ({selectedExercises.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSelectModal(true)}
                    className="text-sm text-secondary hover:text-secondary/80 font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Adicionar Exercício
                  </button>
                </div>

                <div className="flex-1 bg-background/30 border border-white/10 rounded-xl overflow-hidden flex flex-col relative">
                  {selectedExercises.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <p className="text-lg font-medium mb-1">Seu treino está vazio</p>
                      <p className="text-sm opacity-70 mb-4">Adicione exercícios para começar a montar o treino.</p>
                      <button
                        type="button"
                        onClick={() => setShowSelectModal(true)}
                        className="px-4 py-2 bg-secondary/10 text-secondary rounded-lg hover:bg-secondary/20 transition-colors"
                      >
                        Selecionar exercícios
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-y-auto absolute inset-0 p-3 space-y-2">
                      {selectedExercises.map((item, index) => (
                        <ExerciseListItem
                          key={`${item.id}-${index}`}
                          exercise={item}
                          index={index}
                          onEdit={() => handleEditExercise(index)}
                          onRemove={() => handleRemoveExercise(index)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-none p-6 border-t border-white/10 bg-surface flex justify-end gap-3 z-10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
              {isEditing ? 'Salvar Alterações' : 'Criar Treino'}
            </button>
          </div>
        </form>
      </div>

      {/* Modals */}
      <SelectExercisesModal
        isOpen={showSelectModal}
        onClose={() => setShowSelectModal(false)}
        onSelectExercise={handleAddExercise}
        selectedIds={selectedExercises.map(ex => ex.id)}
      />

      {showConfigModal && currentExercise && (
        <ExerciseConfigModal
          isOpen={showConfigModal}
          onClose={() => {
            setShowConfigModal(false);
            setCurrentExercise(null);
            setEditingIndex(null);
          }}
          exercise={currentExercise}
          onSave={handleSaveExerciseConfig}
          initialData={editingIndex !== null ? selectedExercises[editingIndex] : undefined}
        />
      )}
    </div>
  );
}
