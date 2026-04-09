import { useStudentStore } from '../studentStore';

// biome-ignore lint/suspicious/noExplicitAny: Required for mock definitions
const { mockSupabase } = global as unknown as { mockSupabase: jest.Mocked<any> };

describe('studentStore', () => {
  const mockSupabaseQuery = (data: unknown, error: unknown = null, count: number | null = null) => {
    const query = Promise.resolve({ data, error, count });
    // biome-ignore lint/suspicious/noExplicitAny: Adding chainable methods
    const q = query as any;
    q.select = jest.fn().mockReturnValue(q);
    q.insert = jest.fn().mockReturnValue(q);
    q.update = jest.fn().mockReturnValue(q);
    q.delete = jest.fn().mockReturnValue(q);
    q.eq = jest.fn().mockReturnValue(q);
    q.in = jest.fn().mockReturnValue(q);
    q.order = jest.fn().mockReturnValue(q);
    q.range = jest.fn().mockReturnValue(q);
    q.single = jest.fn().mockReturnValue(q);
    q.limit = jest.fn().mockReturnValue(q);
    q.ilike = jest.fn().mockReturnValue(q);
    return q;
  };

  beforeEach(async () => {
    useStudentStore.getState().reset();
    jest.clearAllMocks();

    // Reset global supabase mocks to prevent pollution
    mockSupabase.from.mockClear();
    mockSupabase.rpc.mockClear();
    mockSupabase.auth.getSession.mockClear();

    mockSupabase.from.mockImplementation(() => mockSupabaseQuery(null));
  });

  it('should be initially empty', () => {
    const state = useStudentStore.getState();
    expect(state.students).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it('should fetch students successfully with assessments', async () => {
    // 1. coachings query resolution
    // 2. assessments query resolution
    mockSupabase.from
      .mockReturnValueOnce(
        mockSupabaseQuery(
          [{ status: 'active', student: { id: '1', full_name: 'Student 1' } }],
          null,
          1
        )
      )
      .mockReturnValueOnce(
        mockSupabaseQuery([{ student_id: '1', weight: 80, height: 180, notes: 'Some notes' }])
      );

    await useStudentStore.getState().fetchStudents('personal-123');

    const state = useStudentStore.getState();
    expect(state.students).toHaveLength(1);
    expect(state.students[0].weight).toBe('80');
    expect(state.totalCount).toBe(1);
  });

  it('should append students when append param is true', async () => {
    useStudentStore.setState({ students: [{ id: 'prev' } as never] });

    mockSupabase.from
      .mockReturnValueOnce(
        mockSupabaseQuery([{ status: 'active', student: { id: 'new', full_name: 'New' } }], null, 2)
      )
      .mockReturnValueOnce(mockSupabaseQuery([]));

    await useStudentStore.getState().fetchStudents('p1', { append: true, page: 2 });

    const state = useStudentStore.getState();
    expect(state.students).toHaveLength(2);
    expect(state.students[0].id).toBe('prev');
    expect(state.students[1].id).toBe('new');
  });

  it('should handle fetch students error', async () => {
    mockSupabase.from.mockReturnValue(mockSupabaseQuery(null, { message: 'Fetch failed' }));

    await useStudentStore.getState().fetchStudents('personal-123');

    expect(useStudentStore.getState().students).toHaveLength(0);
  });

  it('should update student data (pending invite)', async () => {
    useStudentStore.setState({
      students: [
        {
          id: '1',
          full_name: 'Original',
          status: 'invited',
          is_invite: true,
          email: 't@t.com',
          avatar_url: null,
        },
      ],
    });

    mockSupabase.from.mockReturnValue(mockSupabaseQuery(null));

    const result = await useStudentStore.getState().updateStudent('1', { name: 'Updated Name' });

    expect(result.success).toBe(true);
    expect(useStudentStore.getState().students[0].full_name).toBe('Updated Name');
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
  });

  it('should update linked student and insert assessment', async () => {
    useStudentStore.setState({
      students: [
        {
          id: '1',
          full_name: 'Linked',
          status: 'active',
          is_invite: false,
          email: 't@t.com',
          avatar_url: null,
        },
      ],
    });

    mockSupabase.from.mockReturnValue(mockSupabaseQuery(null));

    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'p1' } } },
    });

    const result = await useStudentStore.getState().updateStudent('1', {
      name: 'Linked Updated',
      weight: '85',
      waist: '90',
    });

    expect(result.success).toBe(true);
    expect(useStudentStore.getState().students[0].full_name).toBe('Linked Updated');
    expect(useStudentStore.getState().students[0].weight).toBe('85');
  });

  it('should create student invite successfully', async () => {
    const inviteData = {
      personal_id: 'p1',
      name: 'New Student',
      email: 'new@student.com',
      password: 'password123',
      weight: '75',
    };

    mockSupabase.rpc.mockResolvedValueOnce({
      data: {
        success: true,
        student_id: 'new-id',
        invite_code: 'CODE123',
        email: inviteData.email,
      },
      error: null,
    });

    mockSupabase.from.mockImplementation(() => mockSupabaseQuery(null));

    const result = await useStudentStore.getState().createStudentInvite(inviteData);

    expect(result.success).toBe(true);
    expect(result.code).toBe('CODE123');

    const state = useStudentStore.getState();
    expect(state.students).toHaveLength(1);
    expect(state.students[0].id).toBe('new-id');
    expect(state.students[0].weight).toBe('75');
  });

  it('should handle create invite error', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: new Error('Auth error'),
    });

    const result = await useStudentStore.getState().createStudentInvite({
      personal_id: 'p1',
      name: 'Fail',
      email: 'fail@test.com',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Auth error');
  });

  it('should cancel invite successfully', async () => {
    useStudentStore.setState({
      students: [
        {
          id: 'invite-1',
          full_name: 'Invited',
          status: 'invited',
          avatar_url: null,
          email: 'i@i.com',
        },
      ],
    });

    mockSupabase.from.mockReturnValue(mockSupabaseQuery(null));

    await useStudentStore.getState().cancelInvite('invite-1');

    expect(useStudentStore.getState().students).toHaveLength(0);
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
  });

  it('should generate invite code', async () => {
    mockSupabase.from
      .mockReturnValueOnce(mockSupabaseQuery({ invite_code: null }))
      .mockReturnValueOnce(mockSupabaseQuery(null));

    const code = await useStudentStore.getState().generateInviteCode('u1');

    expect(code).toHaveLength(6);
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
  });

  it('should return existing invite code if available', async () => {
    mockSupabase.from.mockReturnValue(mockSupabaseQuery({ invite_code: 'EXISTING' }));

    const code = await useStudentStore.getState().generateInviteCode('u1');

    expect(code).toBe('EXISTING');
  });

  it('should link student successfully', async () => {
    mockSupabase.from
      .mockReturnValueOnce(mockSupabaseQuery({ id: 'p1' }))
      .mockReturnValueOnce(mockSupabaseQuery(null))
      .mockReturnValueOnce(mockSupabaseQuery(null));

    const result = await useStudentStore.getState().linkStudent('s1', 'CODE12');

    expect(result.success).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('coachings');
  });

  it('should handle invalid invite code when linking', async () => {
    mockSupabase.from.mockReturnValue(mockSupabaseQuery(null, { message: 'Not found' }));

    const result = await useStudentStore.getState().linkStudent('s1', 'WRONG');

    expect(result.success).toBe(false);
    expect(result.error).toContain('personal não encontrado');
  });

  it('should remove student and all related data', async () => {
    useStudentStore.setState({
      students: [
        { id: 's1', full_name: 'ToDelete', email: 'd@d.com', status: 'active', avatar_url: null },
      ],
    });

    mockSupabase.from.mockReturnValue(mockSupabaseQuery(null));

    await useStudentStore.getState().removeStudent('p1', 's1');

    expect(useStudentStore.getState().students).toHaveLength(0);
  });

  it('should add physical assessment and refresh history', async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'p1' } } },
    });

    mockSupabase.from
      .mockReturnValueOnce(mockSupabaseQuery(null))
      .mockReturnValueOnce(mockSupabaseQuery([{ id: 'a1', weight: 80 }]));

    const result = await useStudentStore
      .getState()
      .addPhysicalAssessment('s1', { weight: 80 } as never);

    expect(result.success).toBe(true);
    expect(useStudentStore.getState().history).toHaveLength(1);
    expect(useStudentStore.getState().history[0].weight).toBe(80);
  });

  it('should handle add physical assessment error', async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'p1' } } },
    });

    mockSupabase.from.mockReturnValue(mockSupabaseQuery(null, { message: 'Insert failed' }));

    const result = await useStudentStore
      .getState()
      .addPhysicalAssessment('s1', { weight: 80 } as never);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Insert failed');
  });
});
