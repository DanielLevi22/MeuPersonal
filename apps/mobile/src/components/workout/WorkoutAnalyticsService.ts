import { supabase } from '@meupersonal/supabase';

export interface WorkoutStats {
  volumeByMuscle: { label: string; value: number; color: string }[];
  weeklyLoad: { weekLabel: string; load: number }[]; // Last 6 weeks
  stimulus: { label: string; value: number; color: string }[];
}

export const WorkoutAnalyticsService = {
  /**
   * Fetches and generates all analytics data for the student.
   */
  getWorkoutStats: async (studentId: string): Promise<WorkoutStats> => {
    try {
      // 1. Fetch Workout History (Sessions + Items + Exercises)
      // Limit to last 60 days for relevant recent history
      const { data: history, error } = await supabase
        .from('workout_sessions')
        .select(`
          started_at,
          completed_at,
          workout_session_items (
            check_status,
            sets: workout_session_sets (
              reps,
              weight,
              completed
            ),
            exercise: exercises (
              muscle_group,
              name
            )
          )
        `)
        .eq('student_id', studentId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: true });

      if (error) throw error;

      if (!history || history.length === 0) {
        return {
          volumeByMuscle: [],
          weeklyLoad: [],
          stimulus: []
        };
      }

      // --- Aggregation Logic ---

      const muscleVolumeMap: Record<string, number> = {};
      const weeklyLoadMap: Record<string, number> = {};
      const stimulusCounts = { strength: 0, hypertrophy: 0, endurance: 0 };
      let totalSets = 0;

      history.forEach(session => {
        const date = new Date(session.completed_at);
        // Week key: "Year-Week" (simplified)
        // A better way is to find the start of the week
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay()); // Sunday
        const weekLabel = `${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1}`;

        session.workout_session_items.forEach((item: any) => {
          if (!item.exercise) return;
          const muscle = item.exercise.muscle_group || 'Outros';

          item.sets.forEach((set: any) => {
            if (!set.completed) return;

            const reps = Number(set.reps) || 0;
            const weight = Number(set.weight) || 0; // Assuming weight is numeric now, or parsing it
            
            // 1. Volume Calculation (Weight * Reps * Sets) - Simplified as 1 set entry per row
            const volume = weight * reps;
            
            // Add to Muscle Volume
            muscleVolumeMap[muscle] = (muscleVolumeMap[muscle] || 0) + volume;

            // Add to Weekly Load
            weeklyLoadMap[weekLabel] = (weeklyLoadMap[weekLabel] || 0) + volume;

            // 2. Stimulus Check
            totalSets++;
            if (reps <= 6) stimulusCounts.strength++;
            else if (reps <= 12) stimulusCounts.hypertrophy++;
            else stimulusCounts.endurance++;
          });
        });
      });

      // --- Formatting Results ---

      // 1. Volume by Muscle (Top 5 + Color Mapping)
      const muscleColors: Record<string, string> = {
        'Peito': '#3B82F6', // Blue
        'Costas': '#60A5FA', // Light Blue
        'Pernas': '#A855F7', // Purple
        'Ombros': '#FACC15', // Yellow
        'Bíceps': '#FB923C', // Orange
        'Tríceps': '#F472B6', // Pink
      };

      const volumeByMuscle = Object.entries(muscleVolumeMap)
        .map(([label, value]) => ({
          label,
          value,
          color: muscleColors[label] || '#9CA3AF' // Default Gray
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Limit to top 5

      // 2. Weekly Load (Sorted array)
      // Extract keys, sort by date context, return array
      // For simplicity, we assume the query order (ascending) keeps weeks roughly in order or we sort manually.
      // Since map keys are not ordered, we need to reconstruct.
      const weeklyLoad = Object.entries(weeklyLoadMap).map(([weekLabel, load]) => ({
        weekLabel,
        load
      })).slice(-7); // Last 7 weeks

      // 3. Stimulus Distribution
      const stimulus = [
        { label: 'Força', value: totalSets ? stimulusCounts.strength / totalSets : 0, color: '#FACC15' },
        { label: 'Hipertrofia', value: totalSets ? stimulusCounts.hypertrophy / totalSets : 0, color: '#60A5FA' },
        { label: 'Resistência', value: totalSets ? stimulusCounts.endurance / totalSets : 0, color: '#3B82F6' },
      ].filter(s => s.value > 0);

      return {
        volumeByMuscle,
        weeklyLoad,
        stimulus
      };

    } catch (err) {
      console.error('Error fetching workout stats:', err);
      return { volumeByMuscle: [], weeklyLoad: [], stimulus: [] };
    }
  }
};
