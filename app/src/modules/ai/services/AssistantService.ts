import { useAuthStore } from '@/modules/auth/store/authStore';
import { Exercise } from '@/modules/workout/types';

const bffBase = () => process.env.EXPO_PUBLIC_API_URL ?? '';

// Re-exporting types for consumers
export interface AIWorkoutItem {
  exerciseName: string;
  sets: number;
  reps: string;
  rest: number;
  technique?: string;
  observation?: string;
  load_suggestion?: string;
}

export interface AIWorkoutDay {
  letter: string;
  focus: string;
  exercises: AIWorkoutItem[];
}

export interface AIWorkoutResponse {
  explanation: string;
  plan: AIWorkoutDay[];
}

function getToken(): string {
  const token = useAuthStore.getState().session?.access_token;
  if (!token) throw new Error('Authentication required');
  return token;
}

async function postBff<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${bffBase()}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`BFF error ${response.status} at ${path}`);
  }

  return response.json() as Promise<T>;
}

export const AssistantService = {
  /**
   * Negotiates and generates a workout plan based on context and feedback.
   */
  negotiateWorkout: async (
    split: string,
    goal: string,
    studentLevel: string,
    availableExercises: Exercise[],
    userContext?: string
  ): Promise<AIWorkoutResponse | null> => {
    const exercisesList = availableExercises
      .map((e) => `- ${e.name} (${e.muscle_group})`)
      .join('\n');

    try {
      return await postBff<AIWorkoutResponse>('/api/ai/workout/negotiate', {
        split,
        goal,
        studentLevel,
        exercisesList,
        userContext,
      });
    } catch {
      return null;
    }
  },

  /**
   * Generates workouts for MULTIPLE phases in a single request.
   */
  generateBatchWorkoutPlan: async (
    phases: { name: string; focus: string; weeks: number }[],
    split: string,
    goal: string,
    studentLevel: string,
    availableExercises: Exercise[],
    userContext?: string
  ): Promise<{ [phaseIndex: number]: AIWorkoutResponse }> => {
    const exercisesList = availableExercises
      .map((e) => `- ${e.name} (${e.muscle_group})`)
      .join('\n');

    try {
      return await postBff<Record<number, AIWorkoutResponse>>('/api/ai/workout/batch', {
        phases,
        split,
        goal,
        studentLevel,
        exercisesList,
        userContext,
      });
    } catch {
      return {};
    }
  },

  /**
   * Future: General App Assistance
   */
  answerQuestion: async (_question: string): Promise<string> => {
    return 'Funcionalidade em desenvolvimento.';
  },

  /**
   * Generates a weekly nutrition adherence summary
   */
  analyzeNutritionAdherence: async (
    studentName: string,
    adherenceData: {
      totalMeals: number;
      completedMeals: number;
      logs: Record<string, unknown>[];
    },
    planName: string
  ): Promise<string> => {
    try {
      const result = await postBff<{ summary: string }>('/api/ai/nutrition/adherence', {
        studentName,
        planName,
        adherenceData,
      });
      return result.summary;
    } catch {
      return 'Não foi possível gerar a análise no momento.';
    }
  },

  /**
   * Chat with the AI Co-Pilot about a specific student.
   * @deprecated Use the web BFF /api/ai/chat/[studentId] directly for full-featured chat with SSE streaming.
   */
  chatWithStudentContext: async (
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    _studentContext: string
  ): Promise<{
    type: 'text' | 'function_call';
    text?: string;
    functionCall?: Record<string, unknown>;
  }> => {
    // Full-featured chat is handled by the web BFF with SSE streaming.
    // This stub preserves backwards compatibility with any existing callers.
    const lastMessage = history[history.length - 1]?.parts[0]?.text ?? '';
    try {
      const token = getToken();
      const response = await fetch(`${bffBase()}/api/ai/chat/stub`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: lastMessage }),
      });
      if (!response.ok) throw new Error(`BFF chat error ${response.status}`);
      const data = (await response.json()) as { text?: string };
      return { type: 'text', text: data.text ?? 'Não consegui processar.' };
    } catch {
      return { type: 'text', text: 'Não consegui processar a resposta.' };
    }
  },

  /**
   * @deprecated Use the web BFF /api/ai/chat/[studentId] with SSE streaming instead.
   */
  streamChatWithStudentContext: async (
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    studentContext: string,
    onToken: (text: string) => void
  ): Promise<{
    type: 'text' | 'function_call';
    functionCall?: Record<string, unknown>;
  }> => {
    const result = await AssistantService.chatWithStudentContext(history, studentContext);
    if (result.text) onToken(result.text);
    return { type: 'text' };
  },
};
