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

export type SseEvent =
  | { type: "text"; content: string }
  | { type: "proposal"; data: PeriodizationProposal }
  | { type: "saved"; entity: "periodization"; id: string; name: string }
  | { type: "done" }
  | { type: "error"; message: string };
