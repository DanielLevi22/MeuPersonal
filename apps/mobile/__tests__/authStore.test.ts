import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '../src/store/authStore';

// Mock Supabase
vi.mock('@meupersonal/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      insert: vi.fn().mockReturnThis(),
    })),
  },
  setSupabaseStorage: vi.fn(),
  getUserContextJWT: vi.fn(),
  defineAbilitiesFor: vi.fn(),
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
