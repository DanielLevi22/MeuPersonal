import { useMemo } from 'react';
import type { EditedWorkoutItems, ProgressionAnalysis, Workout, WorkoutSession } from '../types';
import { analyzeExerciseProgression } from '../utils/progressionUtils';

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
  completedSets: Record<string, number>
): Record<string, ProgressionAnalysis> {
  return useMemo(() => {
    if (!workout || !previousSession) return {};

    const analysis: Record<string, ProgressionAnalysis> = {};

    workout.items?.forEach((item) => {
      // Use edited item if available, otherwise use original
      const effectiveItem = editedWorkoutItems[item.id] || item;

      // Find matching item from previous session
      const previousItem = previousSession.items?.find(
        (prevItem) => prevItem.workout_item_id === item.id
      );

      if (previousItem) {
        const currentSetsCompleted = completedSets[item.id] || 0;
        const itemAnalysis = analyzeExerciseProgression(
          effectiveItem,
          previousItem,
          currentSetsCompleted
        );
        analysis[item.id] = itemAnalysis;
      }
    });

    return analysis;
  }, [workout, previousSession, editedWorkoutItems, completedSets]);
}
