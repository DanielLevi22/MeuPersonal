import { supabase } from '@meupersonal/supabase';

type SessionItem = {
  id: string;
  workout_session_id: string;
  exercise_id: string;
  check_status: string;
};
type SessionSet = {
  workout_session_item_id: string;
  reps: number;
  weight: number;
  completed: boolean;
};
type HistoryItem = {
  workout_sessions: { completed_at: string }[];
  sets: { weight: number; reps: number; completed: boolean }[];
};
type ExerciseRow = { exercise_id: string };

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
      // 1. Fetch Workout Sessions (Last 60 days)
      const { data: sessions, error: sessionError } = await supabase
        .from('workout_sessions')
        .select('id, started_at, completed_at, status')
        .eq('student_id', studentId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: true });

      if (sessionError) throw sessionError;
      if (!sessions || sessions.length === 0) {
        return { volumeByMuscle: [], weeklyLoad: [], stimulus: [] };
      }

      const sessionIds = sessions.map((s) => s.id);

      // 2. Fetch Session Items (Exercises)
      const { data: items, error: itemsError } = await supabase
        .from('workout_session_items')
        .select('id, workout_session_id, exercise_id, check_status')
        .in('workout_session_id', sessionIds);

      if (itemsError) throw itemsError;

      const exerciseIds = new Set<string>();
      items?.forEach((item: SessionItem) => {
        if (item.exercise_id) {
          exerciseIds.add(item.exercise_id);
        }
      });

      // 3. Fetch Exercises Details
      const { data: exercises, error: exercisesError } = await supabase
        .from('exercises')
        .select('id, name, muscle_group')
        .in('id', Array.from(exerciseIds));

      if (exercisesError) throw exercisesError;

      const exerciseMap = new Map();
      exercises?.forEach((e) => {
        exerciseMap.set(e.id, e);
      });

      // 4. Fetch Sets
      const itemIds = items?.map((i: SessionItem) => i.id) || [];
      const { data: sets, error: setsError } = await supabase
        .from('workout_session_sets')
        .select('workout_session_item_id, reps, weight, completed')
        .in('workout_session_item_id', itemIds);

      if (setsError) {
        // Fallback if table name is different or query fails
        console.warn('Could not fetch sets via item_id:', setsError);
      }

      // --- Aggregation Logic ---

      const muscleVolumeMap: Record<string, number> = {};
      const weeklyLoadMap: Record<string, number> = {};
      const stimulusCounts = { strength: 0, hypertrophy: 0, endurance: 0 };
      let totalSets = 0;

      // Build lookup maps
      const setsByItem: Record<string, SessionSet[]> = {};
      sets?.forEach((s: SessionSet) => {
        if (!setsByItem[s.workout_session_item_id]) setsByItem[s.workout_session_item_id] = [];
        setsByItem[s.workout_session_item_id].push(s);
      });

      const itemsBySession: Record<string, SessionItem[]> = {};
      items?.forEach((i: SessionItem) => {
        if (!itemsBySession[i.workout_session_id]) itemsBySession[i.workout_session_id] = [];
        itemsBySession[i.workout_session_id].push(i);
      });

      // Iterate Sessions
      sessions.forEach((session) => {
        const date = new Date(session.completed_at);
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay()); // Sunday
        const weekLabel = `${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1}`;

        const sessionItems = itemsBySession[session.id] || [];

        sessionItems.forEach((item) => {
          const exercise = exerciseMap.get(item.exercise_id);
          if (!exercise) return;

          const muscle = exercise.muscle_group || 'Outros';
          const itemSets = setsByItem[item.id] || [];

          itemSets.forEach((set: SessionSet) => {
            if (!set.completed) return;

            const reps = Number(set.reps) || 0;
            const weight = Number(set.weight) || 0;

            const volume = weight * reps;

            muscleVolumeMap[muscle] = (muscleVolumeMap[muscle] || 0) + volume;
            weeklyLoadMap[weekLabel] = (weeklyLoadMap[weekLabel] || 0) + volume;

            totalSets++;
            if (reps <= 6) stimulusCounts.strength++;
            else if (reps <= 12) stimulusCounts.hypertrophy++;
            else stimulusCounts.endurance++;
          });
        });
      });

      // --- Formatting Results ---

      const muscleColors: Record<string, string> = {
        Peito: '#3B82F6',
        Costas: '#60A5FA',
        Pernas: '#A855F7',
        Ombros: '#FACC15',
        Bíceps: '#FB923C',
        Tríceps: '#F472B6',
      };

      const volumeByMuscle = Object.entries(muscleVolumeMap)
        .map(([label, value]) => ({
          label,
          value,
          color: muscleColors[label] || '#9CA3AF',
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      const weeklyLoad = Object.entries(weeklyLoadMap)
        .map(([weekLabel, load]) => ({
          weekLabel,
          load,
        }))
        .slice(-7);

      const stimulus = [
        {
          label: 'Força',
          value: totalSets ? stimulusCounts.strength / totalSets : 0,
          color: '#FACC15',
        },
        {
          label: 'Hipertrofia',
          value: totalSets ? stimulusCounts.hypertrophy / totalSets : 0,
          color: '#60A5FA',
        },
        {
          label: 'Resistência',
          value: totalSets ? stimulusCounts.endurance / totalSets : 0,
          color: '#3B82F6',
        },
      ].filter((s) => s.value > 0);

      return {
        volumeByMuscle,
        weeklyLoad,
        stimulus,
      };
    } catch (err) {
      console.error('Error fetching workout stats:', err);
      return { volumeByMuscle: [], weeklyLoad: [], stimulus: [] };
    }
  },

  /**
   * Fetches history for a specific exercise to track load evolution (Max Weight or 1RM Estimate).
   */
  getExerciseHistory: async (studentId: string, exerciseId: string) => {
    try {
      const { data, error } = await supabase
        .from('workout_session_items')
        .select(`
          workout_sessions!inner (
            completed_at
          ),
          sets: workout_session_sets (
            weight,
            reps,
            completed
          )
        `)
        .eq('exercise_id', exerciseId)
        .eq('workout_sessions.student_id', studentId)
        .eq('workout_sessions.status', 'completed')
        .order('created_at', { ascending: true }); // Order by creation (chronological)

      if (error) throw error;

      // Process: Find max weight for each session
      const history = data
        .map((item: HistoryItem) => {
          const sessionData = Array.isArray(item.workout_sessions)
            ? item.workout_sessions[0]
            : item.workout_sessions;
          const date = new Date(sessionData.completed_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
          });

          let maxWeight = 0;

          for (const set of item.sets) {
            if (set.completed && Number(set.weight) > maxWeight) {
              maxWeight = Number(set.weight);
            }
          }

          return {
            date,
            weight: maxWeight,
            rawDate: sessionData.completed_at,
          };
        })
        .filter((h) => h.weight > 0);

      return history;
    } catch (error) {
      console.error('Error fetching exercise history:', error);
      return [];
    }
  },

  /**
   * Fetches the list of exercises that have history for this student.
   */
  getExercisesWithHistory: async (studentId: string) => {
    try {
      // Step 1: Get recent session IDs for this student
      const { data: sessions, error: sessionError } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('student_id', studentId)
        .order('completed_at', { ascending: false })
        .limit(50);

      if (sessionError) throw sessionError;
      if (!sessions || sessions.length === 0) return [];

      const sessionIds = sessions.map((s) => s.id);

      // Step 2: Get exercise IDs from these sessions
      const { data: items, error: itemsError } = await supabase
        .from('workout_session_items')
        .select('exercise_id')
        .in('workout_session_id', sessionIds);

      if (itemsError) throw itemsError;
      if (!items || items.length === 0) return [];

      const exerciseIds = new Set<string>();
      items.forEach((item: ExerciseRow) => {
        if (item.exercise_id) exerciseIds.add(item.exercise_id);
      });

      if (exerciseIds.size === 0) return [];

      // Step 3: Fetch details for these unique exercises
      const { data: exercises, error: exerciseError } = await supabase
        .from('exercises')
        .select('id, name, muscle_group')
        .in('id', Array.from(exerciseIds));

      if (exerciseError) throw exerciseError;

      return (exercises || []).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error fetching exercises with history:', error);
      return [];
    }
  },
};
