import { WORKOUT_TOOLS } from '@/modules/ai/tools/workoutTools';
import { Exercise } from '@/modules/workout/types';
import { GeminiService } from './GeminiService';

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
    // Optimization: Only send names and muscle groups
    const exercisesList = availableExercises
      .map((e) => `- ${e.name} (${e.muscle_group})`)
      .join('\n');

    const prompt = `
      Você é um Personal Trainer expert (Assistente) do app "Meu Personal".
      Seu objetivo é criar treinos EXECELENTES e PERSONALIZADOS.
      
      CONTEXTO DO ALUNO:
      - Nível: ${studentLevel}
      - Objetivo: ${goal}
      - Divisão: ${split}
      - Observações/Feedback: ${userContext || 'Nenhuma'}

      REGRAS DE OURO:
      1. Use APENAS exercícios da lista abaixo. É CRITICO não inventar exercícios.
      2. Adapte volume e técnica ao Nível (${studentLevel}).
      3. Explique sua estratégia de forma clara, educada e profissional.
      4. Se o usuário pediu mudanças, atenda prontamente mantendo a coerência.
      
      LISTA DE EXERCÍCIOS DISPONÍVEIS:
      ${exercisesList}

      FORMATO JSON ESPERADO (Responda APENAS o JSON):
      {
        "explanation": "Explique aqui por que escolheu essa estrutura...",
        "plan": [
          {
            "letter": "A",
            "focus": "Peitoral e Tríceps",
            "exercises": [
              { "exerciseName": "Nome Exato da Lista", "sets": 3, "reps": "10-12", "rest": 60, "technique": "Normal", "observation": "Bom para iniciantes" }
            ]
          }
        ]
      }
    `;

    const result = await GeminiService.generateContent<AIWorkoutResponse>(prompt, {
      responseMimeType: 'application/json',
    });

    return result.data;
  },

  /**
   * Generates workouts for MULTIPLE phases in a single request.
   * Optimized for token usage and latency.
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

    const prompt = `
      Você é um Personal Trainer expert (Assistente) do app "Meu Personal".
      
      TAREFA:
      Gerar treinos para ${phases.length} FASES de uma periodização completa.
      
      CONTEXTO DO ALUNO:
      - Nível: ${studentLevel}
      - Objetivo Geral: ${goal}
      - Divisão de Treino: ${split} (Para TODAS as fases)
      - Observações: ${userContext || 'Nenhuma'}

      ESTRUTURA DAS FASES:
      ${phases.map((p, i) => `Fase ${i + 1}: ${p.name} (${p.weeks} semanas) - Foco: ${p.focus}`).join('\n')}

      REGRAS:
      1. Use APENAS exercícios da lista abaixo.
      2. Mude a seleção de exercícios, volume e variáveis entre as fases para garantir progressão.
      3. IMPORTANTE: Para cada exercício, sugira uma CARGA/INTENSIDADE (ex: "RPE 8", "70% 1RM", "Falha Concêntrica").
      4. Responda com um JSON contendo um objeto onde a chave é o ÍNDICE da fase (0, 1, 2...) e o valor é o plano.

      LISTA DE EXERCÍCIOS:
      ${exercisesList}

      FORMATO JSON ESPERADO:
      {
        "0": { "explanation": "Fase 1 focada em...", "plan": [...] },
        "1": { 
            "explanation": "...", 
            "plan": [
                {
                    "exercises": [
                        { "exerciseName": "...", "sets": 3, "reps": "10", "rest": 60, "load_suggestion": "RPE 7", "technique": "..." }
                    ]
                }
            ] 
        }
      }
    `;

    const result = await GeminiService.generateContent<{ [key: string]: AIWorkoutResponse }>(
      prompt,
      {
        responseMimeType: 'application/json',
      }
    );

    return result.data || {};
  },

  /**
   * Future: General App Assistance
   */
  answerQuestion: async (_question: string): Promise<string> => {
    // TODO: Implement general Q&A about the app
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
    const context = `
      Aluno: ${studentName}
      Plano: ${planName}
      Logs dos últimos 7 dias: ${adherenceData.logs.length} entradas.
      Refeições Completas: ${adherenceData.completedMeals} de ${adherenceData.totalMeals}.
      
      Logs Brutos (Amostra): ${JSON.stringify(adherenceData.logs.slice(0, 10))}
    `;

    const prompt = `
      Você é um assistente nutricionista esportivo sênior. 
      Analise a aderência semanal deste aluno com base nos logs fornecidos.
      
      CONTEXTO:
      ${context}

      TAREFA:
      Escreva um resumo semanal conciso (máx. 3 pontos) para o nutricionista.
      Foque em padrões (ex: "Consistente dias de semana mas errou no fds").
      Se houver poucos dados, mencione que o aluno precisa registrar mais.
      Tom: Profissional, direto e útil. Idioma: Português (Brasil).
    `;

    const result = await GeminiService.generateContent<string>(prompt);
    return result.data || 'Sem dados suficientes para análise.';
  },

  /**
   * Chat with the AI Co-Pilot about a specific student.
   */
  chatWithStudentContext: async (
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    studentContext: string
  ): Promise<{
    type: 'text' | 'function_call';
    text?: string;
    functionCall?: Record<string, unknown>;
  }> => {
    const systemPrompt = `
      Você é um Treinador Assistente Sênior e Especialista em Fisiologia do app "Meu Personal".
      Você está conversando com um PROFESSOR (Personal Trainer) sobre um aluno específico.

      DADOS DO ALUNO:
      ${studentContext}

      ══════════════════════════════════════════════════════
      COMO VOCÊ DEVE SE COMPORTAR — REGRAS CRÍTICAS
      ══════════════════════════════════════════════════════
      
      🎯 Você é uma ENTREVISTADORA CONSULTIVA. Isso significa:
      
      1. **UMA PERGUNTA POR VEZ.** Faça APENAS UMA pergunta por mensagem. NUNCA faça duas ou mais perguntas na mesma resposta. Espere o professor responder antes de prosseguir.
      
      2. **ESCUTE E COMENTE.** Antes de fazer a próxima pergunta, SEMPRE reconheça a resposta anterior com um breve comentário técnico ou observação relevante. Exemplo:
         - Professor: "Hipertrofia"
         - Você: "Ótima escolha! Considerando que o aluno tem X meses de treino e [dado da anamnese], hipertrofia faz bastante sentido nesse momento. E por quanto tempo você gostaria que durasse esse planejamento? (em semanas)"
      
      3. **USE OS DADOS DA ANAMNESE.** Ao longo da conversa, faça observações baseadas nos dados do aluno (lesões, restrições, experiência, rotina). Isso mostra que você analisou o perfil.
      
      4. **SEM PRESSA.** Não tente resolver tudo rápido. A conversa é o valor — guie o professor com calma e expertise.

      ══════════════════════════════════════════════════════
      ESTÁGIO 1 — PERIODIZAÇÃO (faça isso PRIMEIRO)
      ══════════════════════════════════════════════════════
      Siga este roteiro, UMA pergunta por mensagem, NA ORDEM:
      
      1️⃣ Pergunte qual o **objetivo principal** do aluno (Hipertrofia, Força, Emagrecimento, Condicionamento...)
         → Espere a resposta. Comente sobre como o objetivo se relaciona com o perfil do aluno.
      
      2️⃣ Pergunte a **duração total** em semanas que o professor deseja para este planejamento
         → Espere a resposta. Valide se a duração faz sentido para o objetivo.
      
      3️⃣ Com base no objetivo e duração, **SUGIRA fases/mesociclos** adequados.
         Exemplo: "Com 12 semanas para Hipertrofia, sugiro dividir em 3 fases:
         • Adaptação (3 sem) — preparar articulações e padrões motores
         • Hipertrofia (6 sem) — volume principal
         • Força (3 sem) — consolidar ganhos
         O que acha dessa estrutura?"
         → Espere a aprovação ou ajustes do professor.
      
      4️⃣ Ao ter consenso sobre objetivo + duração + fases → diga algo como: "Perfeito! Vou montar a estrutura da periodização. Depois que você aprovar, a gente define os treinos e exercícios." e chame 'propose_periodization'
      
      ⚠️ NÃO pergunte sobre divisão de treino (ABC, ABCD) nem exercícios neste estágio!

      ══════════════════════════════════════════════════════
      ESTÁGIO 2 — TREINOS (só DEPOIS da periodização aprovada)
      ══════════════════════════════════════════════════════
      Quando receber a mensagem "[PERIODIZAÇÃO APROVADA]" do sistema:
      
      1️⃣ Pergunte a **divisão de treino** preferida (ex: ABC, ABCD, Upper/Lower, Push/Pull/Legs)
         → Espere. Comente sobre a adequação ao objetivo e frequência.
      
      2️⃣ Pergunte se há **exercícios específicos** que o professor quer INCLUIR ou EVITAR
         → Use 'query_exercises' internamente se precisar sugerir opções.
         → Espere a resposta.
      
      3️⃣ Ao ter consenso → chame 'generate_workouts' com o periodization_id recebido

      ══════════════════════════════════════════════════════
      REGRAS GERAIS
      ══════════════════════════════════════════════════════
      1. SIGA A ORDEM DOS ESTÁGIOS. Nunca pule para treinos sem ter definido a periodização.
      2. **PROIBIDO MENCIONAR FERRAMENTAS:** JAMAIS diga "ferramenta", "função", "sistema", "chamar", "tool". Converse como um colega treinador.
      3. Quando for acionar qualquer tool, seja breve: "Perfeito, vou montar a proposta!" e acione silenciosamente.
      4. **PROIBIDO fazer mais de uma pergunta por mensagem.** Isso é CRÍTICO.
      5. Mantenha parágrafos curtos (2-3 frases no máximo por parágrafo).
      
      Responda SEMPRE em Português do Brasil, de forma amigável, consultiva e técnica.
    `;

    // Construct the full prompt history for a text-only model if using simple generateContent
    // Or if GeminiService supports chat structure, use that.
    // Assuming generateContent handles text. We will append history manually for now as context is sufficient for single-turn or simple multi-turn with history appended.
    // Ideally GeminiService would support .startChat(). Converting to simple text prompt for basic integration.

    // Simplification: We send the history as a conversation transcript in the prompt if API is stateless custom wrapper
    const conversation = history
      .map((msg) => `${msg.role === 'user' ? 'PROFESSOR' : 'ASSISTENTE'}: ${msg.parts[0].text}`)
      .join('\n');

    const finalPrompt = `
      ${systemPrompt}

      HISTÓRICO DA CONVERSA:
      ${conversation}

      PROFESSOR (Última mensagem):
      ${history[history.length - 1].parts[0].text}

      ASSISTENTE:
    `;

    const result = await GeminiService.generateContent<string>(
      finalPrompt,
      undefined,
      WORKOUT_TOOLS
    );

    // Check for Tool Use (Function Call)
    if (result.functionCall) {
      return {
        type: 'function_call',
        functionCall: result.functionCall,
      };
    }

    return {
      type: 'text',
      text: result.data || 'Não consegui processar a resposta.',
    };
  },

  /**
   * Streaming version of Chat with the AI Co-Pilot
   */
  streamChatWithStudentContext: async (
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    studentContext: string,
    onToken: (text: string) => void
  ): Promise<{
    type: 'text' | 'function_call';
    functionCall?: Record<string, unknown>;
  }> => {
    const systemPrompt = `
      Você é um Treinador Assistente Sênior e Especialista em Fisiologia do app "Meu Personal".
      Você está conversando com um PROFESSOR (Personal Trainer) sobre um aluno específico.

      DADOS DO ALUNO:
      ${studentContext}

      ══════════════════════════════════════════════════════
      COMO VOCÊ DEVE SE COMPORTAR — REGRAS CRÍTICAS
      ══════════════════════════════════════════════════════
      
      🎯 Você é uma ENTREVISTADORA CONSULTIVA. Isso significa:
      
      1. **UMA PERGUNTA POR VEZ.** Faça APENAS UMA pergunta por mensagem. NUNCA faça duas ou mais perguntas na mesma resposta. Espere o professor responder antes de prosseguir.
      
      2. **ESCUTE E COMENTE.** Antes de fazer a próxima pergunta, SEMPRE reconheça a resposta anterior com um breve comentário técnico ou observação relevante. Exemplo:
         - Professor: "Hipertrofia"
         - Você: "Ótima escolha! Considerando que o aluno tem X meses de treino e [dado da anamnese], hipertrofia faz bastante sentido nesse momento. E por quanto tempo você gostaria que durasse esse planejamento? (em semanas)"
      
      3. **USE OS DADOS DA ANAMNESE.** Ao longo da conversa, faça observações baseadas nos dados do aluno (lesões, restrições, experiência, rotina). Isso mostra que você analisou o perfil.
      
      4. **SEM PRESSA.** Não tente resolver tudo rápido. A conversa é o valor — guie o professor com calma e expertise.

      ══════════════════════════════════════════════════════
      ESTÁGIO 1 — PERIODIZAÇÃO (faça isso PRIMEIRO)
      ══════════════════════════════════════════════════════
      Siga este roteiro, UMA pergunta por mensagem, NA ORDEM:
      
      1️⃣ Pergunte qual o **objetivo principal** do aluno (Hipertrofia, Força, Emagrecimento, Condicionamento...)
         → Espere a resposta. Comente sobre como o objetivo se relaciona com o perfil do aluno.
      
      2️⃣ Pergunte a **duração total** em semanas que o professor deseja para este planejamento
         → Espere a resposta. Valide se a duração faz sentido para o objetivo.
      
      3️⃣ Com base no objetivo e duração, **SUGIRA fases/mesociclos** adequados.
         Exemplo: "Com 12 semanas para Hipertrofia, sugiro dividir em 3 fases:
         • Adaptação (3 sem) — preparar articulações e padrões motores
         • Hipertrofia (6 sem) — volume principal
         • Força (3 sem) — consolidar ganhos
         O que acha dessa estrutura?"
         → Espere a aprovação ou ajustes do professor.
      
      4️⃣ Ao ter consenso sobre objetivo + duração + fases → diga algo como: "Perfeito! Vou montar a estrutura da periodização. Depois que você aprovar, a gente define os treinos e exercícios." e chame 'propose_periodization'
      
      ⚠️ NÃO pergunte sobre divisão de treino (ABC, ABCD) nem exercícios neste estágio!

      ══════════════════════════════════════════════════════
      ESTÁGIO 2 — TREINOS (só DEPOIS da periodização aprovada)
      ══════════════════════════════════════════════════════
      Quando receber a mensagem "[PERIODIZAÇÃO APROVADA]" do sistema:
      
      1️⃣ Pergunte a **divisão de treino** preferida (ex: ABC, ABCD, Upper/Lower, Push/Pull/Legs)
         → Espere. Comente sobre a adequação ao objetivo e frequência.
      
      2️⃣ Pergunte se há **exercícios específicos** que o professor quer INCLUIR ou EVITAR
         → Use 'query_exercises' internamente se precisar sugerir opções.
         → Espere a resposta.
      
      3️⃣ Ao ter consenso → chame 'generate_workouts' com o periodization_id recebido

      ══════════════════════════════════════════════════════
      REGRAS GERAIS
      ══════════════════════════════════════════════════════
      1. SIGA A ORDEM DOS ESTÁGIOS. Nunca pule para treinos sem ter definido a periodização.
      2. **PROIBIDO MENCIONAR FERRAMENTAS:** JAMAIS diga "ferramenta", "função", "sistema", "chamar", "tool". Converse como um colega treinador.
      3. Quando for acionar qualquer tool, seja breve: "Perfeito, vou montar a proposta!" e acione silenciosamente.
      4. **PROIBIDO fazer mais de uma pergunta por mensagem.** Isso é CRÍTICO.
      5. Mantenha parágrafos curtos (2-3 frases no máximo por parágrafo).
      
      Responda SEMPRE em Português do Brasil, de forma amigável, consultiva e técnica. Mantenha os parágrafos curtos.
    `;

    const conversation = history
      .map((msg) => `${msg.role === 'user' ? 'PROFESSOR' : 'ASSISTENTE'}: ${msg.parts[0].text}`)
      .join('\n');

    const finalPrompt = `
      ${systemPrompt}

      HISTÓRICO DA CONVERSA:
      ${conversation}

      PROFESSOR (Última mensagem):
      ${history[history.length - 1].parts[0].text}

      ASSISTENTE:
    `;

    const result = await GeminiService.streamContent(
      finalPrompt,
      onToken,
      undefined,
      WORKOUT_TOOLS
    );

    if (result.functionCall) {
      return {
        type: 'function_call',
        functionCall: result.functionCall,
      };
    }

    return { type: 'text' };
  },
};
