import type { ProgressionAnalysis, ProgressionMetric, SessionItem, WorkoutItem } from '../types';

/**
 * Calculates the change between current and previous metric values
 * @param current - Current metric value
 * @param previous - Previous metric value
 * @param unit - Unit of measurement (e.g., 'kg', 'reps')
 * @returns ProgressionMetric object or null if no change or values are zero
 */
export function calculateMetricChange(
  current: number,
  previous: number,
  unit: string
): ProgressionMetric | null {
  if (current === 0 && previous === 0) return null;

  if (current > previous) {
    return {
      type: 'improved',
      diff: `+${(current - previous).toFixed(1)}${unit}`,
      previous,
      current,
    };
  } else if (current < previous) {
    return {
      type: 'decreased',
      diff: `-${(previous - current).toFixed(1)}${unit}`,
      previous,
      current,
    };
  } else if (current > 0) {
    return {
      type: 'maintained',
      diff: '=',
      previous,
      current,
    };
  }

  return null;
}

/**
 * Analyzes progression for a single exercise comparing current and previous session
 * @param currentItem - Current workout item
 * @param previousSessionItem - Previous session data for this exercise
 * @param currentSetsCompleted - Number of sets completed in current session
 * @returns ProgressionAnalysis object with metrics for weight, sets, and reps
 */
export function analyzeExerciseProgression(
  currentItem: WorkoutItem,
  previousSessionItem: SessionItem,
  currentSetsCompleted: number
): ProgressionAnalysis {
  const analysis: ProgressionAnalysis = {};

  // Analyze weight progression
  const currentWeight = parseFloat(String(currentItem.weight)) || 0;
  const previousWeight = parseFloat(String(previousSessionItem.weight)) || 0;

  const weightChange = calculateMetricChange(currentWeight, previousWeight, 'kg');
  if (weightChange) {
    analysis.weight = weightChange;
  }

  // Analyze sets completed progression
  const previousSetsCompleted = previousSessionItem.sets_completed || 0;

  if (currentSetsCompleted > 0 || previousSetsCompleted > 0) {
    const setsChange = calculateMetricChange(currentSetsCompleted, previousSetsCompleted, '');
    if (setsChange) {
      analysis.sets = {
        ...setsChange,
        diff: setsChange.diff.replace(/\.0$/, ''), // Remove decimal for whole numbers
      };
    }
  }

  // Could add reps analysis here in the future if needed
  // const repsChange = calculateMetricChange(currentItem.reps, previousSessionItem.reps, '');

  return analysis;
}
