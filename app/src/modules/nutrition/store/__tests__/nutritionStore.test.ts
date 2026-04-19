import { useNutritionStore } from '../nutritionStore';

// Use global mocks defined in jest.setup.ts
// biome-ignore lint/suspicious/noExplicitAny: Jest global mock object
const { mockSupabase } = global as any;

describe('nutritionStore', () => {
  beforeEach(() => {
    useNutritionStore.getState().reset();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be initially empty', () => {
    const state = useNutritionStore.getState();
    expect(state.foods).toEqual([]);
    expect(state.meals).toEqual([]);
    expect(state.currentDietPlan).toBeNull();
  });

  it('should fetch foods successfully', async () => {
    const mockFoods = [{ id: '1', name: 'Banana', calories: 89 }];

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'foods') {
        return {
          select: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          ilike: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({ data: mockFoods, error: null }),
        };
      }
      return {};
    });

    await useNutritionStore.getState().searchFoods('Banana');

    expect(useNutritionStore.getState().foods).toEqual(mockFoods);
  });

  it('should toggle meal completion and update gamification', async () => {
    const mockMealId = 'meal-1';
    const mockDate = '2024-01-01';
    const mockStudentId = 'student-1';

    useNutritionStore.setState({
      // biome-ignore lint/suspicious/noExplicitAny: Mocking partial diet plan
      currentDietPlan: { id: 'plan-1', student_id: mockStudentId } as any,
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'meal_logs') {
        return {
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          // toggleMealLog first does a maybeSingle SELECT to check for existing log
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          // then inserts and calls single() for the result
          single: jest.fn().mockResolvedValue({
            data: { id: 'log-1', completed: true, diet_meal_id: mockMealId },
            error: null,
          }),
        };
      }
      return {};
    });

    await useNutritionStore.getState().toggleMealCompletion(mockMealId, mockDate, true);

    const state = useNutritionStore.getState();
    expect(state.dailyLogs[mockMealId].completed).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('meal_logs');
  });

  it('should handle food search edge cases (empty results)', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'foods') {
        return {
          select: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          ilike: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return {};
    });

    const results = await useNutritionStore.getState().searchFoods('NonExistentFood');
    expect(results).toEqual([]);
    expect(useNutritionStore.getState().foods).toEqual([]);
  });

  it('should handle custom food creation with edge case values', async () => {
    const customFood = {
      name: 'Super Food',
      calories: 999999, // Edge case: very high calories
      protein: 0, // Edge case: zero protein
      carbs: 0.0001, // Edge case: tiny decimal
      fat: 0,
    };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'foods') {
        return {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { ...customFood, id: 'new-food', is_custom: true },
            error: null,
          }),
        };
      }
      return {};
    });

    // biome-ignore lint/suspicious/noExplicitAny: Mocking custom food payload
    await useNutritionStore.getState().createCustomFood(customFood as any);

    const state = useNutritionStore.getState();
    expect(state.foods).toHaveLength(1);
    expect(state.foods[0].name).toBe('Super Food');
    expect(state.foods[0].calories).toBe(999999);
  });
});
