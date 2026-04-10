import { useNutritionStore } from '../nutritionStore';

// Use global mocks
// biome-ignore lint/suspicious/noExplicitAny: Jest global mock object
const { mockSupabase, mockSupabaseBuilder } = global as any;

describe('nutritionStore - Food Substitution', () => {
  beforeEach(() => {
    useNutritionStore.getState().reset();
    jest.clearAllMocks();
  });

  it('should substitute a food successfully by creating a new daily log', async () => {
    const mealId = 'meal-123';
    const date = '2024-03-20';
    const originalItemId = 'item-1';
    const newFood = {
      id: 'food-new',
      name: 'New Food',
      calories: 200,
      protein: 20,
      carbs: 30,
      fat: 5,
      serving_size: 100,
      // biome-ignore lint/suspicious/noExplicitAny: test fixture — dynamic food shape
    } as any;

    // Mock initial meal items
    useNutritionStore.setState({
      // biome-ignore lint/suspicious/noExplicitAny: Mocking subset structure for testing
      currentDietPlan: { id: 'plan-1', student_id: 'student-1' } as any,
      mealItems: {
        [mealId]: [
          {
            id: 'item-1',
            food_id: 'food-old',
            quantity: 100,
            unit: 'g',
            food: { name: 'Old Food' },
            // biome-ignore lint/suspicious/noExplicitAny: Mocking subset structure for testing
          } as any,
        ],
      },
    });

    // biome-ignore lint/suspicious/noExplicitAny: Testing specific Builder
    const builder = mockSupabaseBuilder as any;
    // 1. Insert daily log
    // biome-ignore lint/suspicious/noExplicitAny: Promise handler allows dynamic resolutions
    builder.then.mockImplementationOnce((resolve: any) =>
      resolve({
        data: {
          id: 'log-1',
          student_id: 'student-1',
          diet_meal_id: mealId,
          actual_items: [
            {
              id: `sub_${Date.now()}`,
              food_id: 'food-new',
              quantity: 150,
              unit: 'g',
              is_substitution: true,
            },
          ],
        },
        error: null,
      })
    );

    await useNutritionStore
      .getState()
      .substituteFood(mealId, date, originalItemId, newFood, 150, 'g');

    const state = useNutritionStore.getState();
    const log = state.dailyLogs[mealId];
    expect(log).toBeDefined();
    // biome-ignore lint/style/noNonNullAssertion: log.actual_items is expected to be non-null in this test path
    expect(log.actual_items!).toHaveLength(1);
    // biome-ignore lint/suspicious/noExplicitAny: Mocking subset structure for testing
    // biome-ignore lint/style/noNonNullAssertion: actual_items is guaranteed non-null by test setup
    expect((log.actual_items![0] as any).food_id).toBe('food-new');
    // biome-ignore lint/style/noNonNullAssertion: actual_items guaranteed non-null by test setup
    expect(log.actual_items![0].is_substitution).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('diet_logs');
  });

  it('should update existing daily log with actual_items', async () => {
    const mealId = 'meal-123';
    const date = '2024-03-20';
    const originalItemId = 'item-1';
    // biome-ignore lint/suspicious/noExplicitAny: Mocking subset structure for testing
    const newFood = { id: 'food-new-2', name: 'New Food 2', calories: 150 } as any;

    // Mock state with existing log
    useNutritionStore.setState({
      // biome-ignore lint/suspicious/noExplicitAny: Mocking subset structure for testing
      currentDietPlan: { id: 'plan-1', student_id: 'student-1' } as any,
      dailyLogs: {
        [mealId]: {
          id: 'log-existing',
          // biome-ignore lint/suspicious/noExplicitAny: Mocking subset structure for testing
          actual_items: [{ id: 'item-1', food_id: 'food-old' }] as any,
          // biome-ignore lint/suspicious/noExplicitAny: Mocking subset structure for testing
        } as any,
      },
    });

    // biome-ignore lint/suspicious/noExplicitAny: Testing specific Builder
    const builder = mockSupabaseBuilder as any;
    // biome-ignore lint/suspicious/noExplicitAny: Promise handler allows dynamic resolutions
    builder.then.mockImplementationOnce((resolve: any) => resolve({ error: null }));

    await useNutritionStore
      .getState()
      .substituteFood(mealId, date, originalItemId, newFood, 100, 'g');

    expect(mockSupabaseBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        actual_items: expect.arrayContaining([expect.objectContaining({ food_id: 'food-new-2' })]),
      })
    );
  });
});
