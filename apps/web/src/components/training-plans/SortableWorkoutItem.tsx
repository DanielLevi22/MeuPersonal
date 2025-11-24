'use client';

import type { Workout } from '@/lib/hooks/useWorkouts';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableWorkoutItemProps {
  workout: Workout;
  index: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SortableWorkoutItem({ workout, index, onEdit, onDelete }: SortableWorkoutItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: workout.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {/* Drag Handle & Identifier */}
          <div className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="p-1.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
              title="Arrastar para reordenar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </button>
            <div className="w-10 h-10 bg-primary/20 border-2 border-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold">{workout.identifier || index + 1}</span>
            </div>
          </div>
          
          {/* Workout Info */}
          <div className="flex-1 min-w-0">
            <h5 className="font-semibold text-foreground mb-1 truncate">{workout.title}</h5>
            {workout.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">{workout.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {workout.estimated_duration && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {workout.estimated_duration}min
                </span>
              )}
              {workout.difficulty_level && (
                <span className="px-2 py-0.5 bg-white/10 rounded capitalize">
                  {workout.difficulty_level === 'beginner' && 'Iniciante'}
                  {workout.difficulty_level === 'intermediate' && 'Intermediário'}
                  {workout.difficulty_level === 'advanced' && 'Avançado'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-2">
          <button 
            onClick={() => onEdit(workout.id)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors" 
            title="Editar"
          >
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button 
            onClick={() => onDelete(workout.id)}
            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors" 
            title="Remover"
          >
            <svg className="w-4 h-4 text-muted-foreground hover:text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
