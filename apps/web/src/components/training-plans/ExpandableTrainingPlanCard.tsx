import type { TrainingPlan } from '@/lib/hooks/useTrainingPlans';
import { useDeleteWorkout, useUpdateWorkout } from '@/lib/hooks/useWorkoutMutations';
import { useWorkouts } from '@/lib/hooks/useWorkouts';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { CreateWorkoutModal } from '../workouts/CreateWorkoutModal';
import { SortableWorkoutItem } from './SortableWorkoutItem';

interface ExpandableTrainingPlanCardProps {
  trainingPlan: TrainingPlan;
  onEdit: () => void;
  onDelete: () => void;
  onClone: () => void;
}

const splitLabels: Record<string, string> = {
  abc: 'ABC',
  abcd: 'ABCD',
  abcde: 'ABCDE',
  abcdef: 'ABCDEF',
  upper_lower: 'Superior/Inferior',
  full_body: 'Full Body',
  push_pull_legs: 'Push/Pull/Legs',
  custom: 'Personalizado',
};

const statusColors: Record<string, string> = {
  draft: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30',
  active: 'bg-primary/10 text-primary border-primary/30',
  completed: 'bg-green-500/10 text-green-400 border-green-500/30',
};

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  active: 'Ativa',
  completed: 'Concluída',
};

export function ExpandableTrainingPlanCard({
  trainingPlan,
  onEdit,
  onDelete,
  onClone,
}: ExpandableTrainingPlanCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | undefined>(undefined);
  
  const { data: workouts = [], isLoading: workoutsLoading } = useWorkouts();
  const deleteWorkoutMutation = useDeleteWorkout();
  const updateWorkoutMutation = useUpdateWorkout();
  
  // Local state for optimistic updates
  const [orderedWorkouts, setOrderedWorkouts] = useState(workouts);

  // Sync with server data when it changes
  useEffect(() => {
    const planWorkouts = workouts
      .filter(w => w.training_plan_id === trainingPlan.id)
      .sort((a, b) => (a.identifier || '').localeCompare(b.identifier || ''));
    setOrderedWorkouts(planWorkouts);
  }, [workouts, trainingPlan.id]);

  const startDate = new Date(trainingPlan.start_date);
  const endDate = new Date(trainingPlan.end_date);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedWorkouts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        // Update identifiers based on new order (A, B, C...)
        const updates = newItems.map((item, index) => {
          const identifier = String.fromCharCode(65 + index); // A, B, C...
          return {
            id: item.id,
            identifier,
          };
        });

        // Optimistically update local state
        const optimisticItems = newItems.map((item, index) => ({
          ...item,
          identifier: String.fromCharCode(65 + index),
        }));

        // Trigger updates in background
        updates.forEach((update) => {
          updateWorkoutMutation.mutate({
            id: update.id,
            identifier: update.identifier,
          });
        });

        return optimisticItems;
      });
    }
  };

  const handleEditWorkout = (workoutId: string) => {
    setEditingWorkoutId(workoutId);
    setShowCreateModal(true);
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    if (confirm('Tem certeza que deseja excluir este treino?')) {
      try {
        await deleteWorkoutMutation.mutateAsync(workoutId);
      } catch (error) {
        console.error('Error deleting workout:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingWorkoutId(undefined);
  };

  return (
    <div className="relative bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 shadow-lg hover:shadow-2xl">
      {/* Header - Always Visible */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[trainingPlan.status]}`}>
                {statusLabels[trainingPlan.status]}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-secondary/10 text-secondary border border-secondary/30">
                {splitLabels[trainingPlan.training_split]}
              </span>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
              {trainingPlan.name}
            </h3>
            {trainingPlan.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {trainingPlan.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClone}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Clonar"
            >
              <svg className="w-5 h-5 text-muted-foreground hover:text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={onEdit}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Editar"
            >
              <svg className="w-5 h-5 text-muted-foreground hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
              title="Excluir"
            >
              <svg className="w-5 h-5 text-muted-foreground hover:text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-background/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Treinos</p>
            <p className="text-lg font-bold text-foreground">{orderedWorkouts.length}</p>
          </div>
          <div className="bg-background/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Frequência</p>
            <p className="text-lg font-bold text-foreground">{trainingPlan.weekly_frequency}x</p>
          </div>
          <div className="bg-background/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Duração</p>
            <p className="text-sm font-bold text-foreground">
              {format(startDate, 'dd/MM', { locale: ptBR })} - {format(endDate, 'dd/MM', { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* Goals */}
        {trainingPlan.goals && trainingPlan.goals.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Metas:</p>
            <div className="flex flex-wrap gap-2">
              {trainingPlan.goals.map((goal, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-primary/10 text-primary rounded text-xs"
                >
                  🎯 {goal}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 bg-primary/10 border-2 border-primary rounded-lg text-primary font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          {isExpanded ? 'Ocultar Treinos' : `Ver Treinos (${orderedWorkouts.length})`}
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expanded Content - Workouts List */}
      {isExpanded && (
        <div className="border-t border-white/10 bg-background/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-foreground">Treinos da Ficha</h4>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:scale-[1.02] transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Adicionar Treino
            </button>
          </div>

          {/* Loading */}
          {workoutsLoading && (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-white/5 rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!workoutsLoading && orderedWorkouts.length === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Nenhum treino adicionado ainda</p>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:scale-[1.02] transition-all text-sm"
              >
                Adicionar Primeiro Treino
              </button>
            </div>
          )}

          {/* Workouts List */}
          {!workoutsLoading && orderedWorkouts.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={orderedWorkouts.map(w => w.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {orderedWorkouts.map((workout, index) => (
                    <SortableWorkoutItem
                      key={workout.id}
                      workout={workout}
                      index={index}
                      onEdit={handleEditWorkout}
                      onDelete={handleDeleteWorkout}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}

      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent rounded-2xl opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Create/Edit Workout Modal */}
      {showCreateModal && (
        <CreateWorkoutModal
          isOpen={showCreateModal}
          onClose={handleCloseModal}
          trainingPlanId={trainingPlan.id}
          workoutId={editingWorkoutId}
        />
      )}
    </div>
  );
}
