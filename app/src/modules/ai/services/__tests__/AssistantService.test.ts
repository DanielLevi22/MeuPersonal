import { AssistantService } from '../AssistantService';
import { GeminiService } from '../GeminiService';

jest.mock('../GeminiService', () => ({
  GeminiService: {
    generateContent: jest.fn(),
    streamContent: jest.fn(),
  },
}));

describe('AssistantService', () => {
  // biome-ignore lint/suspicious/noExplicitAny: mock data fixture
  const mockExercises: any[] = [
    { name: 'Supino Reto', muscle_group: 'Peitoral' },
    { name: 'Agachamento Livre', muscle_group: 'Quadríceps' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should construct correct prompt in negotiateWorkout', async () => {
    const mockResponse = {
      explanation: 'Plano focado em peito.',
      plan: [],
    };

    (GeminiService.generateContent as jest.Mock).mockResolvedValue({
      data: mockResponse,
    });

    const result = await AssistantService.negotiateWorkout(
      'A',
      'Hipertrofia',
      'Intermediário',
      mockExercises,
      'Foco em peito'
    );

    expect(result).toEqual(mockResponse);
    expect(GeminiService.generateContent).toHaveBeenCalledWith(
      expect.stringContaining('Hipertrofia'),
      expect.objectContaining({ responseMimeType: 'application/json' })
    );
    expect(GeminiService.generateContent).toHaveBeenCalledWith(
      expect.stringContaining('Supino Reto (Peitoral)'),
      expect.any(Object)
    );
  });

  it('should construct correct prompt in generateBatchWorkoutPlan', async () => {
    const mockPhases = [
      { name: 'Adaptação', focus: 'Técnica', weeks: 2 },
      { name: 'Força', focus: 'Carga', weeks: 4 },
    ];
    const mockBatchResponse = {
      '0': { explanation: 'Fase 1', plan: [] },
      '1': { explanation: 'Fase 2', plan: [] },
    };

    (GeminiService.generateContent as jest.Mock).mockResolvedValue({
      data: mockBatchResponse,
    });

    const result = await AssistantService.generateBatchWorkoutPlan(
      mockPhases,
      'ABC',
      'Força',
      'Avançado',
      mockExercises
    );

    expect(result).toEqual(mockBatchResponse);
    expect(GeminiService.generateContent).toHaveBeenCalledWith(
      expect.stringContaining('Adaptação (2 semanas)'),
      expect.any(Object)
    );
    expect(GeminiService.generateContent).toHaveBeenCalledWith(
      expect.stringContaining('ABC'),
      expect.any(Object)
    );
  });

  it('should handle nutrition adherence analysis', async () => {
    const mockAdherence = {
      totalMeals: 10,
      completedMeals: 8,
      logs: [{ food: 'Arroz', calories: 200 }],
    };

    (GeminiService.generateContent as jest.Mock).mockResolvedValue({
      data: 'Ótima aderência!',
    });

    const result = await AssistantService.analyzeNutritionAdherence(
      'Daniel',
      mockAdherence,
      'Plano Bulk'
    );

    expect(result).toBe('Ótima aderência!');
    expect(GeminiService.generateContent).toHaveBeenCalledWith(expect.stringContaining('Bulk'));
  });

  it('should handle chat context with 2-stage prompt structure', async () => {
    // biome-ignore lint/suspicious/noExplicitAny: mock chat history fixture
    const history: any[] = [{ role: 'user', parts: [{ text: 'O aluno tem dor no joelho' }] }];

    (GeminiService.generateContent as jest.Mock).mockResolvedValue({
      data: 'Entendido, vamos evitar impactos.',
    });

    const result = await AssistantService.chatWithStudentContext(
      history,
      'Anamnese: Dor no joelho'
    );

    expect(result.type).toBe('text');
    expect(result.text).toBe('Entendido, vamos evitar impactos.');

    // Verify the 2-stage prompt structure
    const prompt = (GeminiService.generateContent as jest.Mock).mock.calls[0][0];
    expect(prompt).toContain('ESTÁGIO 1');
    expect(prompt).toContain('ESTÁGIO 2');
    expect(prompt).toContain('PERIODIZAÇÃO');
    expect(prompt).toContain('objetivo principal');

    // Verify tools are passed
    expect(GeminiService.generateContent).toHaveBeenCalledWith(
      expect.any(String),
      undefined,
      expect.any(Array) // WORKOUT_TOOLS
    );
  });

  it('should include Stage 2 trigger when periodization approval message is in history', async () => {
    // biome-ignore lint/suspicious/noExplicitAny: mock chat history fixture
    const history: any[] = [
      { role: 'user', parts: [{ text: 'Quero montar treinos' }] },
      { role: 'model', parts: [{ text: 'Qual o objetivo?' }] },
      { role: 'user', parts: [{ text: 'Hipertrofia, 12 semanas' }] },
      {
        role: 'user',
        parts: [{ text: '[PERIODIZAÇÃO APROVADA] ID: abc-123. Prossiga para Estágio 2.' }],
      },
    ];

    (GeminiService.generateContent as jest.Mock).mockResolvedValue({
      data: 'Ótimo! Agora vamos definir a divisão de treino.',
    });

    const result = await AssistantService.chatWithStudentContext(history, 'Anamnese: Saudável');

    expect(result.type).toBe('text');
    expect(result.text).toContain('divisão');
  });

  it('should handle function call for propose_periodization', async () => {
    // biome-ignore lint/suspicious/noExplicitAny: mock chat history fixture
    const history: any[] = [
      { role: 'user', parts: [{ text: 'Hipertrofia, 12 semanas, 3 fases' }] },
    ];

    (GeminiService.generateContent as jest.Mock).mockResolvedValue({
      data: null,
      functionCall: {
        name: 'propose_periodization',
        args: {
          name: 'Hipertrofia 12 semanas',
          goal: 'Hipertrofia',
          durationWeeks: 12,
          level: 'Intermediário',
          phases: [
            { name: 'Adaptação', weeks: 3, focus: 'Base' },
            { name: 'Hipertrofia', weeks: 6, focus: 'Volume' },
            { name: 'Força', weeks: 3, focus: 'Intensidade' },
          ],
        },
      },
    });

    const result = await AssistantService.chatWithStudentContext(history, 'Anamnese: Saudável');

    expect(result.type).toBe('function_call');
    expect(result.functionCall).toBeDefined();
    // biome-ignore lint/suspicious/noExplicitAny: test assertion on mock data
    expect((result.functionCall as any).name).toBe('propose_periodization');
  });

  it('streaming version should include 2-stage prompt', async () => {
    // biome-ignore lint/suspicious/noExplicitAny: mock chat history fixture
    const history: any[] = [{ role: 'user', parts: [{ text: 'Quero treinar' }] }];
    const onToken = jest.fn();

    (GeminiService.streamContent as jest.Mock).mockResolvedValue({});

    await AssistantService.streamChatWithStudentContext(history, 'Anamnese: Dor no ombro', onToken);

    // Verify the 2-stage prompt structure in the streaming version
    const prompt = (GeminiService.streamContent as jest.Mock).mock.calls[0][0];
    expect(prompt).toContain('ESTÁGIO 1');
    expect(prompt).toContain('ESTÁGIO 2');
    expect(prompt).toContain('PERIODIZAÇÃO');
    expect(prompt).toContain('divisão de treino');
  });
});
