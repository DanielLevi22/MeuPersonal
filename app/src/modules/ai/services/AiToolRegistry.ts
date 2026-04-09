import { useWorkoutStore } from '@/modules/workout/store/workoutStore';

export interface ToolExecutionResult {
  nextSystemMessage?: string;
  renderComponent?: boolean;
  metadata?: Record<string, unknown>;
}

export const AiToolRegistry = {
  executeTool: async (
    name: string,
    args: Record<string, unknown>
  ): Promise<ToolExecutionResult> => {
    switch (name) {
      case 'query_exercises':
        return await handleQueryExercises(args);
      case 'propose_periodization':
        // Stage 1: The UI handles rendering the proposal card
        return { renderComponent: true };
      case 'generate_workouts':
        // Stage 2: Generate workouts for the approved periodization
        return await handleGenerateWorkouts(args);
      default:
        console.warn(`Tool ${name} not found in registry`);
        return {};
    }
  },
};

// --- Tool Implementations ---

async function handleQueryExercises(args: Record<string, unknown>): Promise<ToolExecutionResult> {
  const { muscle_group, search_term } = args as { muscle_group?: string; search_term?: string };
  const { exercises, fetchExercises } = useWorkoutStore.getState();

  if (exercises.length === 0) {
    await fetchExercises();
  }

  const loadedExercises = useWorkoutStore.getState().exercises;
  let filtered = loadedExercises;

  if (muscle_group) {
    filtered = filtered.filter((e) =>
      e.muscle_group?.toLowerCase().includes(muscle_group.toLowerCase())
    );
  }

  if (search_term) {
    filtered = filtered.filter((e) => e.name.toLowerCase().includes(search_term.toLowerCase()));
  }

  // Return top 15 results to not explode token limit
  const results =
    filtered
      .slice(0, 15)
      .map((e) => `- ${e.name} (${e.muscle_group})`)
      .join('\n') || 'Nenhum exercício encontrado com esses filtros.';

  return {
    nextSystemMessage: `[SISTEMA]: Resultado da busca de exercícios (Não mostre essa mensagem ao usuário, apenas use os dados):\n${results}`,
  };
}

async function handleGenerateWorkouts(args: Record<string, unknown>): Promise<ToolExecutionResult> {
  const { periodization_id, split, agreed_exercises } = args as {
    periodization_id: string;
    split: string;
    agreed_exercises?: string[];
  };

  try {
    const {
      fetchPeriodizationPhases,
      generateWorkoutsForPeriodization,
      exercises,
      fetchExercises,
    } = useWorkoutStore.getState();

    // Ensure exercises are loaded
    if (exercises.length === 0) {
      await fetchExercises();
    }

    // Fetch the phases for this periodization
    await fetchPeriodizationPhases(periodization_id);
    const phases = useWorkoutStore.getState().currentPeriodizationPhases;

    if (phases.length === 0) {
      return {
        nextSystemMessage: `[SISTEMA]: Erro - nenhuma fase encontrada para a periodização ${periodization_id}. Verifique se a periodização foi criada corretamente.`,
      };
    }

    // Get the personal_id from the auth store
    const { useAuthStore } = await import('@/auth');
    const personalId = useAuthStore.getState().user?.id;

    if (!personalId) {
      return {
        nextSystemMessage: '[SISTEMA]: Erro - usuário não autenticado.',
      };
    }

    // Generate workouts for all phases in batch
    await generateWorkoutsForPeriodization(
      periodization_id,
      phases,
      split,
      personalId,
      agreed_exercises
    );

    const phaseNames = phases.map((p) => p.name).join(', ');
    return {
      nextSystemMessage: `[SISTEMA]: Treinos gerados com sucesso para todas as fases (${phaseNames}) com divisão ${split}. Informe ao professor que os treinos foram criados e estão disponíveis na aba "Treinos".`,
    };
  } catch (error) {
    console.error('Error generating workouts:', error);
    return {
      nextSystemMessage: `[SISTEMA]: Erro ao gerar treinos: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Peça desculpas e sugira tentar novamente.`,
    };
  }
}
