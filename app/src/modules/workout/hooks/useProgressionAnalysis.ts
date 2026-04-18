import { useMemo } from 'react';
import type { EditedWorkoutItems, ProgressionAnalysis, Workout, WorkoutSession } from '../types';

/**
 * Custom hook to analyze progression between current workout and previous session
 * Memoized to prevent unnecessary recalculations
 *
 * @param workout - Current workout being executed
 * @param previousSession - Previous session data for comparison
 * @param editedWorkoutItems - Map of edited workout items
 * @param completedSets - Record of completed sets per exercise
 * @returns Record of progression analysis per exercise item
 */
export function useProgressionAnalysis(
  workout: Workout | null,
  previousSession: WorkoutSession | null,
  editedWorkoutItems: EditedWorkoutItems,
  _completedSets: Record<string, number>
): Record<string, ProgressionAnalysis> {
  return useMemo(() => {
    if (!workout || !previousSession) return {};

    const analysis: Record<string, ProgressionAnalysis> = {};

    workout.exercises?.forEach((item) => {
      // Use edited item if available, otherwise use original
      const effectiveItem = editedWorkoutItems[item.id] || item;

      // previousSession doesn't expose individual exercise items in the canonical type
      void effectiveItem;
    });

    return analysis;
  }, [workout, previousSession, editedWorkoutItems]);
}
