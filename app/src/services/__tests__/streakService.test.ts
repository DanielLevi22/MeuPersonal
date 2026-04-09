import { achievementService } from '../achievementService';
import { streakService } from '../streakService';

// Use global mocks
// biome-ignore lint/suspicious/noExplicitAny: test infrastructure — global mock object
const { mockSupabase } = global as any;

// Mock achievementService
jest.mock('../achievementService', () => ({
  achievementService: {
    checkAchievements: jest.fn().mockResolvedValue([]),
  },
}));

describe('streakService', () => {
  const mockStudentId = 'student-123';

  // biome-ignore lint/suspicious/noExplicitAny: test helper accepts dynamic mock data
  const mockSupabaseQuery = (data: any, error: any = null, count: number | null = null) => {
    const builder = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockReturnThis(),
      csv: jest.fn().mockReturnThis(),
      // biome-ignore lint/suspicious/noExplicitAny: test fixture — builder mock needs dynamic shape
    } as any;

    const promise = Promise.resolve({ data, error, count });
    // biome-ignore lint/suspicious/noThenProperty: test mock needs to be a PromiseLike
    builder.then = promise.then.bind(promise);
    builder.catch = promise.catch.bind(promise);
    builder.finally = promise.finally.bind(promise);

    return builder;
  };

  beforeEach(() => {
    mockSupabase.from.mockReturnValue(mockSupabaseQuery(null));
    jest.clearAllMocks();
  });

  it('should create a new streak if none exists', async () => {
    const mockDate = '2024-01-01';

    mockSupabase.from.mockReturnValueOnce(mockSupabaseQuery(null, { code: 'PGRST116' }));
    mockSupabase.from.mockReturnValueOnce(mockSupabaseQuery(null, null));

    const result = await streakService.updateStreak(mockStudentId, mockDate);

    expect(result.current_streak).toBe(1);
    expect(mockSupabase.from).toHaveBeenCalledWith('student_streaks');
    expect(achievementService.checkAchievements).toHaveBeenCalledWith(mockStudentId);
  });

  it('should increment streak on consecutive days', async () => {
    const lastActivity = '2024-01-01';
    const today = '2024-01-02';

    mockSupabase.from.mockReturnValueOnce(
      mockSupabaseQuery({ current_streak: 5, longest_streak: 5, last_activity_date: lastActivity })
    );
    mockSupabase.from.mockReturnValueOnce(mockSupabaseQuery(null, null));

    const result = await streakService.updateStreak(mockStudentId, today);

    expect(result.current_streak).toBe(6);
  });

  it('should reset streak if more than one day passed', async () => {
    const lastActivity = '2024-01-01';
    const today = '2024-01-05'; // 4 days later

    mockSupabase.from.mockReturnValueOnce(
      mockSupabaseQuery({
        current_streak: 10,
        longest_streak: 10,
        last_activity_date: lastActivity,
      })
    );
    mockSupabase.from.mockReturnValueOnce(mockSupabaseQuery(null, null));

    const result = await streakService.updateStreak(mockStudentId, today);

    expect(result.current_streak).toBe(1);
  });

  it('should handle timezone edge case (same day activity)', async () => {
    const date = '2024-01-01T10:00:00Z';
    const lateDate = '2024-01-01T22:00:00Z';

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'student_streaks') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { current_streak: 3, longest_streak: 3, last_activity_date: date },
            error: null,
          }),
        };
      }
      return {};
    });

    const result = await streakService.updateStreak(mockStudentId, lateDate);

    // Should return existing streak without incrementing (daysDiff === 0)
    expect(result.current_streak).toBe(3);
  });
});
