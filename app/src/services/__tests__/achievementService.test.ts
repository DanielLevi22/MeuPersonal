import * as Notifications from 'expo-notifications';
import { achievementService } from '../achievementService';

// Use global mocks
// biome-ignore lint/suspicious/noExplicitAny: test infrastructure — global mock object
const { mockSupabase } = global as any;

// Mock Notifications
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn().mockResolvedValue('id'),
}));

// Helper to mock Supabase query results with chainable methods
// biome-ignore lint/suspicious/noExplicitAny: Mock helper for tests
const mockSupabaseQuery = (data: any, error: any = null, count: number | null = null) => {
  const query = Promise.resolve({ data, error, count });
  // biome-ignore lint/suspicious/noExplicitAny: Adding chainable methods
  const q = query as any;
  q.select = jest.fn().mockReturnValue(q);
  q.insert = jest.fn().mockReturnValue(q);
  q.eq = jest.fn().mockReturnValue(q);
  q.gte = jest.fn().mockReturnValue(q);
  q.lte = jest.fn().mockReturnValue(q);
  q.order = jest.fn().mockReturnValue(q);
  q.single = jest.fn().mockReturnValue(q);
  return q;
};

describe('achievementService', () => {
  const mockStudentId = 'student-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should unlock streak achievements correctly', async () => {
    // Mock data for streak condition
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'student_streaks') {
        return mockSupabaseQuery({ current_streak: 3 });
      }
      if (table === 'achievements') {
        return mockSupabaseQuery([]);
      }
      // Totals and Weekly data mocks
      return mockSupabaseQuery([]);
    });

    const newAchievements = await achievementService.checkAchievements(mockStudentId);

    // Should find '3 Dias Seguidos! 🔥'
    expect(newAchievements.length).toBeGreaterThan(0);
    expect(newAchievements[0].title).toContain('3 Dias Seguidos');
    expect(mockSupabase.from).toHaveBeenCalledWith('achievements');
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
  });

  it('should not unlock achievements that are already earned', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'student_streaks') {
        return mockSupabaseQuery({ current_streak: 3 });
      }
      if (table === 'achievements') {
        return mockSupabaseQuery([{ title: '3 Dias Seguidos! 🔥' }]);
      }
      return mockSupabaseQuery([]);
    });

    const newAchievements = await achievementService.checkAchievements(mockStudentId);

    expect(newAchievements.length).toBe(0);
  });

  it('should unlock milestone achievements (perfect week)', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'daily_goals') {
        return mockSupabaseQuery(
          Array(7).fill({
            meals_target: 4,
            meals_completed: 4,
            workout_target: 1,
            workout_completed: 1,
          }),
          null,
          7
        );
      }
      if (table === 'achievements') {
        return mockSupabaseQuery([]);
      }
      return mockSupabaseQuery(null);
    });

    const newAchievements = await achievementService.checkAchievements(mockStudentId);

    const hasPerfectWeek = newAchievements.some((a) => a.id === 'perfect_week');
    expect(hasPerfectWeek).toBe(true);
  });
});
