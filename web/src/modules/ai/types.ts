export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  studentId: string;
  specialistId: string;
  module: "workout" | "nutrition" | "general";
  createdAt: string;
  updatedAt: string;
}

export interface PeriodizationProposal {
  name: string;
  goal: string;
  durationWeeks: number;
  level: string;
  phases: {
    name: string;
    weeks: number;
    focus: string;
  }[];
}

export interface StudentContext {
  studentId: string;
  name: string;
  anamnesis: Record<string, unknown> | null;
  lastAssessment: Record<string, unknown> | null;
  periodizations: {
    id: string;
    name: string;
    goal: string;
    status: string;
    phases: { id: string; name: string; weeks: number; focus: string }[];
  }[];
}

export interface BulkWorkoutExercise {
  exercise_name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes?: string;
}

export interface BulkWorkoutItem {
  title: string;
  muscle_group?: string;
  difficulty?: string;
  day_of_week?: string;
  description?: string;
  exercises?: BulkWorkoutExercise[];
}

export interface BulkWorkoutProposal {
  phase_id: string;
  phase_name: string;
  workouts: BulkWorkoutItem[];
}

export interface AiSessionState {
  savedWorkouts: { id: string; title: string; phaseId: string }[];
  pendingWorkoutProposal?: BulkWorkoutProposal;
}

export type SseEvent =
  | { type: "text"; content: string }
  | { type: "proposal"; data: PeriodizationProposal }
  | { type: "saved"; entity: "periodization"; id: string; name: string }
  | { type: "done" }
  | { type: "error"; message: string };
