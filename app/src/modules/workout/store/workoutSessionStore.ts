// Ephemeral module-level store for a single active workout session.
// Lives only in JS memory — data is batch-saved to DB when the session finishes.

export interface SetState {
  repsActual: number | null;
  weightActual: number | null;
  restActual: number | null;
  completed: boolean;
  skipped: boolean;
}

export interface ExerciseSessionState {
  workoutExerciseId: string;
  exerciseId: string;
  repsPrescribed: string | null;
  setsCount: number;
  weightPrescribed: string | null;
  restPrescribed: number | null;
  sets: SetState[];
}

let _sessionId: string | null = null;
const _exercises = new Map<string, ExerciseSessionState>();

function parseReps(reps: string | null): number | null {
  if (!reps) return null;
  const n = parseInt(reps, 10);
  return Number.isNaN(n) ? null : n;
}

function parseWeight(weight: string | null): number | null {
  if (!weight) return null;
  const n = parseFloat(weight);
  return Number.isNaN(n) ? null : n;
}

function buildDefaultSets(ex: Omit<ExerciseSessionState, 'sets'>): SetState[] {
  return Array.from({ length: ex.setsCount }, () => ({
    repsActual: parseReps(ex.repsPrescribed),
    weightActual: parseWeight(ex.weightPrescribed),
    restActual: ex.restPrescribed,
    completed: false,
    skipped: false,
  }));
}

export const workoutSessionStore = {
  init(sessionId: string): void {
    _sessionId = sessionId;
    _exercises.clear();
  },

  addExercise(state: Omit<ExerciseSessionState, 'sets'>): void {
    if (_exercises.has(state.workoutExerciseId)) return;
    _exercises.set(state.workoutExerciseId, { ...state, sets: buildDefaultSets(state) });
  },

  saveExerciseSets(workoutExerciseId: string, sets: SetState[]): void {
    const ex = _exercises.get(workoutExerciseId);
    if (ex) _exercises.set(workoutExerciseId, { ...ex, sets });
  },

  swapExercise(workoutExerciseId: string, newExerciseId: string): void {
    const ex = _exercises.get(workoutExerciseId);
    if (ex) _exercises.set(workoutExerciseId, { ...ex, exerciseId: newExerciseId });
  },

  isExerciseComplete(workoutExerciseId: string): boolean {
    const ex = _exercises.get(workoutExerciseId);
    if (!ex || ex.sets.length === 0) return false;
    return ex.sets.every((s) => s.completed || s.skipped);
  },

  getExerciseState(workoutExerciseId: string): ExerciseSessionState | undefined {
    return _exercises.get(workoutExerciseId);
  },

  getAll(): ExerciseSessionState[] {
    return [..._exercises.values()];
  },

  getSessionId(): string | null {
    return _sessionId;
  },

  clear(): void {
    _sessionId = null;
    _exercises.clear();
  },
};
