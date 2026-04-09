import { supabase } from '@/lib/supabase';
import { useChatStore } from '../chatStore';

// Helper to mock Supabase query results with chainable methods
// biome-ignore lint/suspicious/noExplicitAny: Mock function helper accepts dynamic structures
const mockSupabaseQuery = (data: any, error: any = null) => {
  const query = Promise.resolve({ data, error });
  // biome-ignore lint/suspicious/noExplicitAny: Adding chainable methods to promise object for mocking
  const q = query as any;
  q.select = jest.fn().mockReturnValue(q);
  q.insert = jest.fn().mockReturnValue(q);
  q.eq = jest.fn().mockReturnValue(q);
  q.or = jest.fn().mockReturnValue(q);
  q.order = jest.fn().mockReturnValue(q);
  q.single = jest.fn().mockReturnValue(q);
  return q;
};

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.getState().reset();
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const state = useChatStore.getState();
    expect(state.conversations).toEqual([]);
    expect(state.messages).toEqual({});
    expect(state.isLoading).toBe(false);
  });

  it('should fetch students successfully', async () => {
    const mockRelationships = [
      {
        client_id: 'student-1',
        client: { id: 'student-1', full_name: 'Student One', email: 's1@test.com' },
      },
      {
        client_id: 'student-2',
        client: { id: 'student-2', full_name: 'Student Two', email: 's2@test.com' },
      },
    ];

    (supabase.from as jest.Mock).mockReturnValue(mockSupabaseQuery(mockRelationships));

    await useChatStore.getState().fetchStudents('personal-123');

    const state = useChatStore.getState();
    expect(state.students).toHaveLength(2);
    expect(state.students[0].full_name).toBe('Student One');
  });

  it('should get or create conversation (returning existing)', async () => {
    const mockExisting = { id: 'conv-123' };

    (supabase.from as jest.Mock).mockReturnValue(mockSupabaseQuery(mockExisting));

    const conversationId = await useChatStore.getState().getOrCreateConversation('p-1', 's-1');

    expect(conversationId).toBe('conv-123');
    expect(supabase.from).toHaveBeenCalledWith('conversations');
  });

  it('should get or create conversation (creating new)', async () => {
    // 1. Mock existing check as null
    // 2. Mock insert returning new record
    const mockNewConv = { id: 'new-conv-456' };

    const mockFrom = supabase.from as jest.Mock;

    // First call: select (existing) -> null
    // Second call: insert -> result
    mockFrom
      .mockReturnValueOnce(mockSupabaseQuery(null))
      .mockReturnValueOnce(mockSupabaseQuery(mockNewConv));

    // Mock fetchConversations internally
    const fetchSpy = jest
      .spyOn(useChatStore.getState(), 'fetchConversations')
      // biome-ignore lint/suspicious/noExplicitAny: Test spy undefined return
      .mockResolvedValue(undefined as any);

    const conversationId = await useChatStore.getState().getOrCreateConversation('p-1', 's-1');

    expect(conversationId).toBe('new-conv-456');
    expect(fetchSpy).toHaveBeenCalledWith('p-1');
    fetchSpy.mockRestore();
  });

  it('should fetch conversations with unread counts', async () => {
    const mockConvs = [
      {
        id: 'c1',
        personal_id: 'u1',
        student_id: 'u2',
        personal: { id: 'u1', full_name: 'Personal' },
        student: { id: 'u2', full_name: 'Student' },
      },
    ];
    const mockUnreads = [{ conversation_id: 'c1', unread_count: 5 }];

    (supabase.from as jest.Mock).mockReturnValue(mockSupabaseQuery(mockConvs));

    (supabase.rpc as jest.Mock).mockResolvedValue({ data: mockUnreads, error: null });

    await useChatStore.getState().fetchConversations('u1');

    const state = useChatStore.getState();
    expect(state.conversations[0].unread_count).toBe(5);
    expect(state.conversations[0]?.other_user?.full_name).toBe('Student');
  });

  it('should send message successfully', async () => {
    const mockUser = { id: 'sender-1' };
    const mockSentMessage = { id: 'm1', content: 'hello', sender_id: 'sender-1' };

    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    (supabase.from as jest.Mock).mockReturnValue(mockSupabaseQuery(mockSentMessage));

    await useChatStore.getState().sendMessage('c1', 'r1', 'hello');

    const state = useChatStore.getState();
    // biome-ignore lint/complexity/useLiteralKeys: dynamic key is required for test assertion
    expect(state.messages['c1']).toContainEqual(mockSentMessage);
  });

  it('should handle realtime subscription', () => {
    const mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    };
    (supabase.channel as jest.Mock).mockReturnValue(mockChannel);

    const unsubscribe = useChatStore.getState().subscribeToConversation('c1');

    expect(supabase.channel).toHaveBeenCalledWith('conversation:c1');
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ filter: 'conversation_id=eq.c1' }),
      expect.any(Function)
    );

    unsubscribe();
    expect(supabase.removeChannel).toHaveBeenCalled();
  });
});
