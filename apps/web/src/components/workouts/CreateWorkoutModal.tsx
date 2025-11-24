'use client';

import type { Exercise } from '@/lib/hooks/useExercises';
import { useStudents } from '@/lib/hooks/useStudents';
import { useCreateWorkout, useUpdateWorkout } from '@/lib/hooks/useWorkoutMutations';
import { useWorkout } from '@/lib/hooks/useWorkouts';
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
}

export function CreateWorkoutModal({ isOpen, onClose, workoutId }: CreateWorkoutModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
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
      // TODO: Load workout items if editing
    }
  }, [existingWorkout]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
      setSelectedStudentIds([]);
      setSelectedExercises([]);
    }
  }, [isOpen]);

  const handleSelectExercise = (exercise: Exercise) => {
    // Check if already selected
    const alreadySelected = selectedExercises.some((ex) => ex.id === exercise.id);
    
    if (alreadySelected) {
      // Edit existing
      const index = selectedExercises.findIndex((ex) => ex.id === exercise.id);
      setEditingIndex(index);
      setCurrentExercise(exercise);
      setShowConfigModal(true);
    } else {
      // Add new
      setCurrentExercise(exercise);
      setEditingIndex(null);
      setShowConfigModal(true);
    }
  };

  const handleSaveExercise = (exercise: SelectedExercise) => {
    if (editingIndex !== null) {
      // Update existing
      const updated = [...selectedExercises];
      updated[editingIndex] = exercise;
      setSelectedExercises(updated);
    } else {
      // Add new
      setSelectedExercises([...selectedExercises, exercise]);
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
      video_url: exercise.video_url || null,
    });
    setEditingIndex(index);
    setShowConfigModal(true);
  };

  const handleRemoveExercise = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

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
        // Create workout with items
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Create workout
        const { data: workout, error: workoutError } = await supabase
          .from('workouts')
          .insert({
            title,
            description: description || null,
            personal_id: user.id,
          })
          .select()
          .single();

        if (workoutError) throw workoutError;

        // Create workout items
        if (selectedExercises.length > 0) {
          const workoutItems = selectedExercises.map((exercise, index) => ({
            workout_id: workout.id,
            exercise_id: exercise.id,
            sets: exercise.sets,
            reps: exercise.reps.toString(),
            weight: exercise.weight || null,
            rest_time: exercise.rest_seconds,
            order: index,
          }));

          const { error: itemsError } = await supabase
            .from('workout_items')
            .insert(workoutItems);

          if (itemsError) throw itemsError;
        }

        // Create workout assignments
        if (selectedStudentIds.length > 0) {
          const assignments = selectedStudentIds.map((studentId) => ({
            workout_id: workout.id,
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
    }
  };

  if (!isOpen) return null;

  return (
    <>
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Atribuir a Alunos (Opcional)
              </label>
              <StudentMultiSelect
                students={students.filter((s) => !s.is_invite)}
                selectedIds={selectedStudentIds}
                onSelectionChange={setSelectedStudentIds}
              />
            </div>

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
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                disabled={isLoading}
              />
            </div>

            {/* Exercises Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-foreground">
                  Exercícios
                </label>
                <span className="text-sm text-muted-foreground">
                  {selectedExercises.length} {selectedExercises.length === 1 ? 'exercício' : 'exercícios'}
                </span>
              </div>

              {selectedExercises.length > 0 ? (
                <div className="space-y-3 mb-3">
                  {selectedExercises.map((exercise, index) => (
                    <ExerciseListItem
                      key={`${exercise.id}-${index}`}
                      exercise={exercise}
                      index={index}
                      onEdit={() => handleEditExercise(index)}
                      onRemove={() => handleRemoveExercise(index)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-lg p-8 text-center mb-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Adicione exercícios ao seu treino
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowSelectModal(true)}
                className="w-full px-4 py-3 bg-primary/10 border-2 border-primary rounded-lg text-primary font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Adicionar Exercícios
              </button>
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

      {/* Select Exercises Modal */}
      <SelectExercisesModal
        isOpen={showSelectModal}
        onClose={() => setShowSelectModal(false)}
        onSelectExercise={handleSelectExercise}
        selectedIds={selectedExercises.map((ex) => ex.id)}
      />

      {/* Exercise Config Modal */}
      {currentExercise && (
        <ExerciseConfigModal
          isOpen={showConfigModal}
          onClose={() => {
            setShowConfigModal(false);
            setCurrentExercise(null);
            setEditingIndex(null);
          }}
          exercise={currentExercise}
          initialData={editingIndex !== null ? selectedExercises[editingIndex] : undefined}
          onSave={handleSaveExercise}
        />
      )}
    </>
  );
}
