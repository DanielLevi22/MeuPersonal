import { useAuthStore } from '../src/modules/auth/store/authStore';

// Mock Supabase
jest.mock('@elevapro/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest
        .fn()
        .mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn().mockReturnThis(),
    })),
  },
  setSupabaseStorage: jest.fn(),
  getUserContextJWT: jest.fn(),
  defineAbilitiesFor: jest.fn(),
}));

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, session: null, isLoading: false });
  });

  it('should have initial state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('should set loading state', () => {
    useAuthStore.setState({ isLoading: true });
    expect(useAuthStore.getState().isLoading).toBe(true);
  });
});
