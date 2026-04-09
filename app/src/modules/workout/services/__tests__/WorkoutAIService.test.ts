import { WorkoutAIService } from '../WorkoutAIService';

// Mock data
const mockExercises = [
  { id: '1', name: 'Supino Reto', muscle_group: 'Peito' },
  { id: '2', name: 'Tríceps Corda', muscle_group: 'Tríceps' },
] as never;

describe('WorkoutAIService', () => {
  const originalApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'mock-key';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_GEMINI_API_KEY = originalApiKey;
  });

  it('should return AI generated structure on success', async () => {
    const mockExplanation = 'Training Plan Logic...';
    const mockPlan = [
      {
        letter: 'A',
        focus: 'Peitoral e Tríceps',
        exercises: [
          { exerciseName: 'Supino Reto', sets: 3, reps: '10-12', rest: 60, technique: 'Normal' },
        ],
      },
    ];
    const mockResponse = { explanation: mockExplanation, plan: mockPlan };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockResponse) }] } }],
      }),
      ok: true,
    });

    const result = await WorkoutAIService.generateWorkoutStructure(
      'A',
      'Hipertrofia',
      'Intermediário',
      mockExercises
    );

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should return fallback structure on API failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    const result = await WorkoutAIService.generateWorkoutStructure(
      'AB',
      'Hipertrofia',
      'Intermediário',
      mockExercises
    );

    // Fallback checks
    expect(result.explanation).toContain('Não foi possível conectar');
    expect(result.plan).toHaveLength(2);
    expect(result.plan[0].letter).toBe('A');
    expect(result.plan[1].letter).toBe('B');
    expect(result.plan[0].exercises).toEqual([]);
  });

  it('should return fallback if no API key is present', async () => {
    process.env.EXPO_PUBLIC_GEMINI_API_KEY = '';

    const result = await WorkoutAIService.generateWorkoutStructure(
      'A',
      'Hipertrofia',
      'Intermediário',
      mockExercises
    );

    expect(result.plan).toHaveLength(1);
    expect(result.plan[0].letter).toBe('A');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
