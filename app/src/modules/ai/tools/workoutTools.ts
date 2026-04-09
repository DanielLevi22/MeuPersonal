import { GeminiTool } from '../services/GeminiService';

export const WORKOUT_TOOLS: GeminiTool[] = [
  {
    functionDeclarations: [
      {
        name: 'propose_periodization',
        description:
          'Propose a training periodization (macrocycle) structure for the student. Use this ONLY after discussing and agreeing on: the main goal, total duration in weeks, and the phases/mesocycles. Do NOT include workout split or exercises — those come later.',
        parameters: {
          type: 'OBJECT',
          properties: {
            name: {
              type: 'STRING',
              description: 'Name of the periodization (e.g. "Hipertrofia Fase 1")',
            },
            goal: {
              type: 'STRING',
              description: 'Main goal (Hipertrofia, Força, Emagrecimento, Condicionamento)',
            },
            durationWeeks: {
              type: 'NUMBER',
              description: 'Total duration in weeks',
            },
            level: {
              type: 'STRING',
              description: 'Student level (Iniciante, Intermediário, Avançado)',
            },
            phases: {
              type: 'ARRAY',
              description: 'List of training phases (mesocycles)',
              items: {
                type: 'OBJECT',
                properties: {
                  name: {
                    type: 'STRING',
                    description: 'Phase name (e.g. Adaptação, Choque, Recuperação)',
                  },
                  weeks: { type: 'NUMBER', description: 'Duration of this phase in weeks' },
                  focus: {
                    type: 'STRING',
                    description:
                      'Focus of this phase (e.g. Resistência Muscular, Hipertrofia Máxima)',
                  },
                },
                required: ['name', 'weeks', 'focus'],
              },
            },
          },
          required: ['name', 'goal', 'durationWeeks', 'level', 'phases'],
        },
      },
      {
        name: 'generate_workouts',
        description:
          'Generate and save workouts for an already-approved periodization. Use this ONLY after the periodization has been approved AND you have discussed the workout split and preferred exercises with the professor.',
        parameters: {
          type: 'OBJECT',
          properties: {
            periodization_id: {
              type: 'STRING',
              description: 'The ID of the approved periodization to generate workouts for.',
            },
            split: {
              type: 'STRING',
              description:
                'Workout split division chosen by the user (e.g., A, AB, ABC, ABCD, ABCDE, Upper/Lower)',
            },
            agreed_exercises: {
              type: 'ARRAY',
              description:
                'List of specific exercises explicitly agreed upon or requested by the user',
              items: {
                type: 'STRING',
                description: 'Name of the exercise (e.g., Supino Reto, Agachamento Livre)',
              },
            },
            excluded_exercises: {
              type: 'ARRAY',
              description: 'List of exercises the user explicitly wants to AVOID',
              items: {
                type: 'STRING',
                description: 'Name of the exercise to exclude',
              },
            },
          },
          required: ['periodization_id', 'split'],
        },
      },
      {
        name: 'query_exercises',
        description:
          'Search for available exercises that can be prescribed to the student. Use this to look up exercises by muscle group or name so you can discuss options with the professor.',
        parameters: {
          type: 'OBJECT',
          properties: {
            muscle_group: {
              type: 'STRING',
              description:
                'Optional. Filter exercises by a specific muscle group (e.g., Peito, Costas, Pernas, Braços, Ombros, Abs).',
            },
            search_term: {
              type: 'STRING',
              description: 'Optional. Search exercises by name (e.g., Supino, Agachamento).',
            },
          },
        },
      },
    ],
  },
];
