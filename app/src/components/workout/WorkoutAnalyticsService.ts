import { supabase } from '@elevapro/supabase';

interface SessionExerciseRow {
  id: string;
  session_id: string;
  exercise_id: string | null;
}

interface SessionSetRow {
  session_exercise_id: string;
  reps_actual: number | null;
  weight_actual: number | null;
  completed: boolean;
}

interface ExerciseDetail {
  id: string;
  name: string;
  muscle_group: string | null;
}

export interface WorkoutStats {
  volumeByMuscle: { label: string; value: number; color: string }[];
  weeklyLoad: { weekLabel: string; load: number }[];
  stimulus: { label: string; value: number; color: string }[];
}

const MUSCLE_COLORS: Record<string, string> = {
  Peito: '#3B82F6',
  Costas: '#60A5FA',
  Pernas: '#A855F7',
  Ombros: '#FACC15',
  Bíceps: '#FB923C',
  Tríceps: '#F472B6',
};

function weekLabel(completedAt: string): string {
  const date = new Date(completedAt);
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  return `${start.getDate()}/${start.getMonth() + 1}`;
}

export const WorkoutAnalyticsService = {
  getWorkoutStats: async (studentId: string): Promise<WorkoutStats> => {
    const { data: sessions, error: sessionError } = await supabase
      .from('workout_sessions')
      .select('id, completed_at')
      .eq('student_id', studentId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: true });

    if (sessionError || !sessions?.length) {
      return { volumeByMuscle: [], weeklyLoad: [], stimulus: [] };
    }

    const sessionIds = sessions.map((s) => s.id);

    const { data: sessionExercises } = await supabase
      .from('workout_session_exercises')
      .select('id, session_id, exercise_id')
      .in('session_id', sessionIds);

    const exerciseIds = new Set(
      (sessionExercises ?? [])
        .map((e: SessionExerciseRow) => e.exercise_id)
        .filter(Boolean) as string[]
    );

    const { data: exercises } = await supabase
      .from('exercises')
      .select('id, name, muscle_group')
      .in('id', [...exerciseIds]);

    const exerciseMap = new Map(((exercises ?? []) as ExerciseDetail[]).map((e) => [e.id, e]));

    const sessionExerciseIds = (sessionExercises ?? []).map((e: SessionExerciseRow) => e.id);

    const { data: sets } = await supabase
      .from('workout_session_sets')
      .select('session_exercise_id, reps_actual, weight_actual, completed')
      .in('session_exercise_id', sessionExerciseIds);

    const setsByExercise = new Map<string, SessionSetRow[]>();
    for (const s of (sets ?? []) as SessionSetRow[]) {
      if (!setsByExercise.has(s.session_exercise_id)) setsByExercise.set(s.session_exercise_id, []);
      setsByExercise.get(s.session_exercise_id)?.push(s);
    }

    const exercisesBySession = new Map<string, SessionExerciseRow[]>();
    for (const e of (sessionExercises ?? []) as SessionExerciseRow[]) {
      if (!exercisesBySession.has(e.session_id)) exercisesBySession.set(e.session_id, []);
      exercisesBySession.get(e.session_id)?.push(e);
    }

    const muscleVolume: Record<string, number> = {};
    const weeklyLoad: Record<string, number> = {};
    const stimulus = { strength: 0, hypertrophy: 0, endurance: 0 };
    let totalSets = 0;

    for (const session of sessions) {
      const exRows = exercisesBySession.get(session.id) ?? [];
      for (const ex of exRows) {
        if (!ex.exercise_id) continue;
        const muscle = exerciseMap.get(ex.exercise_id)?.muscle_group ?? 'Outros';
        const label = weekLabel(session.completed_at ?? '');

        for (const s of setsByExercise.get(ex.id) ?? []) {
          if (!s.completed) continue;
          const reps = s.reps_actual ?? 0;
          const weight = s.weight_actual ?? 0;
          const volume = weight * reps;

          muscleVolume[muscle] = (muscleVolume[muscle] ?? 0) + volume;
          weeklyLoad[label] = (weeklyLoad[label] ?? 0) + volume;
          totalSets++;

          if (reps <= 6) stimulus.strength++;
          else if (reps <= 12) stimulus.hypertrophy++;
          else stimulus.endurance++;
        }
      }
    }

    const volumeByMuscle = Object.entries(muscleVolume)
      .map(([label, value]) => ({ label, value, color: MUSCLE_COLORS[label] ?? '#9CA3AF' }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const weeklyLoadArr = Object.entries(weeklyLoad)
      .map(([wl, load]) => ({ weekLabel: wl, load }))
      .slice(-7);

    const stimulusArr = [
      { label: 'Força', value: totalSets ? stimulus.strength / totalSets : 0, color: '#FACC15' },
      {
        label: 'Hipertrofia',
        value: totalSets ? stimulus.hypertrophy / totalSets : 0,
        color: '#60A5FA',
      },
      {
        label: 'Resistência',
        value: totalSets ? stimulus.endurance / totalSets : 0,
        color: '#3B82F6',
      },
    ].filter((s) => s.value > 0);

    return { volumeByMuscle, weeklyLoad: weeklyLoadArr, stimulus: stimulusArr };
  },

  getExerciseHistory: async (studentId: string, exerciseId: string) => {
    const { data: sessionExercises, error } = await supabase
      .from('workout_session_exercises')
      .select('id, session_id, workout_sessions!inner(completed_at, student_id)')
      .eq('exercise_id', exerciseId)
      .eq('workout_sessions.student_id', studentId);

    if (error || !sessionExercises?.length) return [];

    const sessionExerciseIds = sessionExercises.map((e) => e.id);

    const { data: sets } = await supabase
      .from('workout_session_sets')
      .select('session_exercise_id, weight_actual, reps_actual, completed')
      .in('session_exercise_id', sessionExerciseIds);

    const setsByExercise = new Map<string, SessionSetRow[]>();
    for (const s of (sets ?? []) as SessionSetRow[]) {
      if (!setsByExercise.has(s.session_exercise_id)) setsByExercise.set(s.session_exercise_id, []);
      setsByExercise.get(s.session_exercise_id)?.push(s);
    }

    return sessionExercises
      .map((ex) => {
        const session = Array.isArray(ex.workout_sessions)
          ? ex.workout_sessions[0]
          : ex.workout_sessions;
        const maxWeight = (setsByExercise.get(ex.id) ?? [])
          .filter((s) => s.completed)
          .reduce((max, s) => Math.max(max, s.weight_actual ?? 0), 0);

        if (!maxWeight) return null;
        const completedAt = (session as { completed_at: string }).completed_at;
        return {
          date: new Date(completedAt).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
          }),
          weight: maxWeight,
          rawDate: completedAt,
        };
      })
      .filter((h): h is { date: string; weight: number; rawDate: string } => h !== null);
  },

  getExercisesWithHistory: async (studentId: string) => {
    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select('id')
      .eq('student_id', studentId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(50);

    if (!sessions?.length) return [];

    const { data: sessionExercises } = await supabase
      .from('workout_session_exercises')
      .select('exercise_id')
      .in(
        'session_id',
        sessions.map((s) => s.id)
      )
      .not('exercise_id', 'is', null);

    const exerciseIds = new Set((sessionExercises ?? []).map((e) => e.exercise_id as string));

    if (!exerciseIds.size) return [];

    const { data: exercises } = await supabase
      .from('exercises')
      .select('id, name, muscle_group')
      .in('id', [...exerciseIds]);

    return ((exercises ?? []) as ExerciseDetail[])
      .filter((e): e is ExerciseDetail & { muscle_group: string } => Boolean(e.muscle_group))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
};
