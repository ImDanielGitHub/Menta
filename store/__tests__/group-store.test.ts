import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGroupStore, Group } from '../group-store';
import { supabase } from '@/lib/supabase';
import { notificationService } from '@/lib/services/notification-service';
import { useAuthStore } from '@/store/auth-store';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    functions: {
      invoke: jest.fn(),
    },
    auth: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock('@/lib/operational-flags', () => ({
  isOperationalFeatureEnabled: jest.fn().mockResolvedValue(false),
}));

jest.mock('@/lib/services/notification-service', () => ({
  notificationService: {
    sendGroupActivity: jest.fn().mockResolvedValue(undefined),
    sendGroupCreatedNotification: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockIsOperationalFeatureEnabled = (
  jest.requireMock('@/lib/operational-flags') as {
    isOperationalFeatureEnabled: jest.Mock;
  }
).isOperationalFeatureEnabled;
const ok = <T>(data: T) => ({ data, error: null });
const fail = (message: string) => ({ data: null, error: { message } });

type SupabaseResult = { data: unknown; error: unknown };

const createQuery = (
  result: SupabaseResult | Promise<SupabaseResult> = ok(null)
) => {
  const query: Record<string, jest.Mock | unknown> = {};
  const resolveResult = () => Promise.resolve(result);

  [
    'select',
    'insert',
    'upsert',
    'update',
    'delete',
    'eq',
    'neq',
    'not',
    'in',
    'order',
    'limit',
    'range',
    'maybeSingle',
  ].forEach(method => {
    query[method] = jest.fn(() => query);
  });

  query.single = jest.fn(() => resolveResult());
  query.maybeSingle = jest.fn(() => resolveResult());
  query.then = jest.fn((resolve, reject) =>
    resolveResult().then(resolve, reject)
  );
  query.catch = jest.fn(reject => resolveResult().catch(reject));
  query.finally = jest.fn(callback => resolveResult().finally(callback));

  return query as any;
};

const queueQueries = (...queries: any[]) => {
  (mockSupabase.from as jest.Mock).mockImplementation(() => {
    return queries.shift() ?? createQuery(ok(null));
  });
};

const groupRow = (overrides: Partial<Group> = {}) => ({
  id: 'group-1',
  name: 'Morning Miles',
  description: 'Walk before work',
  owner_id: 'user-1',
  status: 'active',
  duration_days: 30,
  current_streak: 0,
  created_at: '2024-01-01T00:00:00Z',
  privacy: 'public',
  image_url: null,
  ...overrides,
});

const resetGroupState = () => {
  useGroupStore.setState({
    groups: [],
    userGroups: [],
    discoverGroups: [],
    groupMembers: {},
    isLoading: false,
  });
};

describe('GroupStore', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockIsOperationalFeatureEnabled.mockResolvedValue(false);
    await AsyncStorage.clear();
    resetGroupState();
    (mockSupabase.functions.invoke as jest.Mock).mockResolvedValue(ok(null));
    (mockSupabase.rpc as jest.Mock).mockResolvedValue(ok(null));
    (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: 'user-1' } as any,
      session: { user: { id: 'user-1' } } as any,
    });
  });

  describe('Initial State', () => {
    it('has correct initial state', () => {
      const { result } = renderHook(() => useGroupStore());

      expect(result.current.groups).toEqual([]);
      expect(result.current.userGroups).toEqual([]);
      expect(result.current.groupMembers).toEqual({});
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('createOnboardingGroupWithFirstPromise', () => {
    const linkedGroupId = '11111111-1111-4111-8111-111111111111';
    const firstPromiseId = '22222222-2222-4222-8222-222222222222';
    const otherPromiseId = '33333333-3333-4333-8333-333333333333';
    const linkedReceipt = (replayed = false) => ({
      success: true,
      result_code: 'ONBOARDING_GROUP_LINKED_V1',
      replayed,
      group: {
        id: linkedGroupId,
        name: 'Evening walkers',
        description: 'Walk together',
        privacy: 'private',
        image_url: 'menta-preset:move',
        duration_days: 14,
        start_date: '2026-08-25',
        end_date: '2026-09-07',
        notify_on_member_miss: true,
      },
      first_promise: {
        id: firstPromiseId,
        title: 'Walk for 20 minutes after work',
        allow_self_review: false,
        submission_expectations: {
          requires_peer_review: true,
          reviewers_required: 1,
        },
      },
      economy: { cost: 0, new_balance: 100 },
    });

    const input = {
      first_promise_id: firstPromiseId,
      name: 'Evening walkers',
      description: 'Walk together',
      owner_id: 'user-1',
      privacy: 'private' as const,
      notify_on_member_miss: true,
      image_preset: 'move' as const,
    };

    it.each([false, true])(
      'accepts a confirmed replayed=%s server receipt without a retry RPC',
      async replayed => {
        (mockSupabase.rpc as jest.Mock).mockResolvedValue(
          ok(linkedReceipt(replayed))
        );
        queueQueries(
          createQuery(
            ok(
              groupRow({
                id: linkedGroupId,
                name: 'Evening walkers',
                owner_id: 'user-1',
                image_url: 'menta-preset:move',
              })
            )
          ),
          createQuery({ data: null, error: null, count: 1 } as any)
        );
        const { result } = renderHook(() => useGroupStore());

        let linked;
        await act(async () => {
          linked =
            await result.current.createOnboardingGroupWithFirstPromise(input);
        });

        expect(linked).toMatchObject({
          group: { id: linkedGroupId },
          receipt: {
            replayed,
            firstPromise: { id: firstPromiseId },
          },
        });
        expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
        expect(mockSupabase.rpc).toHaveBeenCalledWith(
          'create_onboarding_group_with_first_promise_v1',
          expect.objectContaining({ p_first_promise_id: firstPromiseId })
        );
      }
    );

    it('rejects a receipt for another first promise without updating caches', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue(
        ok({
          ...linkedReceipt(),
          first_promise: {
            ...linkedReceipt().first_promise,
            id: otherPromiseId,
          },
        })
      );
      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await expect(
          result.current.createOnboardingGroupWithFirstPromise(input)
        ).rejects.toThrow(/incomplete onboarding group receipt/i);
      });
      expect(result.current.groups).toEqual([]);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('rejects mismatched normalised descriptions before fetching or caching', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue(
        ok({
          ...linkedReceipt(),
          group: {
            ...linkedReceipt().group,
            description: 'A different group description',
          },
        })
      );
      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await expect(
          result.current.createOnboardingGroupWithFirstPromise({
            ...input,
            description: '  Walk together  ',
          })
        ).rejects.toThrow(/incomplete onboarding group receipt/i);
      });
      expect(result.current.groups).toEqual([]);
      expect(result.current.userGroups).toEqual([]);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('rejects a late receipt after the authenticated account changes', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue(ok(linkedReceipt()));
      (mockSupabase.auth.getSession as jest.Mock)
        .mockResolvedValueOnce({
          data: { session: { user: { id: 'user-1' } } },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { session: { user: { id: 'user-2' } } },
          error: null,
        });
      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await expect(
          result.current.createOnboardingGroupWithFirstPromise(input)
        ).rejects.toThrow(/account changed/i);
      });
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('does not call ordinary group creation when the promise is not linkable', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue(
        ok({ success: false, error: 'FIRST_PROMISE_ALREADY_STARTED' })
      );
      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await expect(
          result.current.createOnboardingGroupWithFirstPromise(input)
        ).rejects.toThrow(/cannot become this group’s promise/i);
      });
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('preserves the draft when the free onboarding group is unavailable', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue(
        ok({
          success: false,
          error: 'ONBOARDING_FIRST_GROUP_UNAVAILABLE',
        })
      );
      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await expect(
          result.current.createOnboardingGroupWithFirstPromise(input)
        ).rejects.toThrow(/only available before you create another group/i);
      });
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('fetchGroups', () => {
    it('successfully fetches groups with group_stats member counts', async () => {
      queueQueries(
        createQuery(
          ok([
            groupRow({ id: 'group-1', name: 'Morning Miles' }),
            groupRow({
              id: 'group-2',
              name: 'Reading Crew',
              owner_id: 'user-2',
            }),
          ])
        ),
        createQuery(
          ok([
            { group_id: 'group-1', total_members: 3 },
            { group_id: 'group-2', total_members: 2 },
          ])
        )
      );

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await result.current.fetchGroups();
      });

      expect(mockSupabase.from).toHaveBeenNthCalledWith(1, 'teams');
      expect(mockSupabase.from).toHaveBeenNthCalledWith(2, 'group_stats');
      expect(result.current.groups).toHaveLength(2);
      expect(result.current.groups[0]).toMatchObject({
        id: 'group-1',
        name: 'Morning Miles',
        member_count: 3,
      });
      expect(result.current.groups[1]).toMatchObject({
        id: 'group-2',
        name: 'Reading Crew',
        member_count: 2,
      });
      expect(result.current.isLoading).toBe(false);
    });

    it('handles groups fetch error', async () => {
      queueQueries(createQuery(fail('Database error')));

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await expect(result.current.fetchGroups()).rejects.toMatchObject({
          message: 'Database error',
        });
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('keeps groups when member count fetch fails', async () => {
      queueQueries(
        createQuery(ok([groupRow({ id: 'group-1', name: 'Test Group' })])),
        createQuery(fail('Member fetch failed'))
      );

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await result.current.fetchGroups();
      });

      expect(result.current.groups).toHaveLength(1);
      expect(result.current.groups[0]).toMatchObject({
        id: 'group-1',
        member_count: 0,
      });
    });

    it('sets loading state during fetch', async () => {
      let resolveFetch: (value: SupabaseResult) => void = () => {};
      const fetchPromise = new Promise<SupabaseResult>(resolve => {
        resolveFetch = resolve;
      });

      queueQueries(createQuery(fetchPromise));

      const { result } = renderHook(() => useGroupStore());

      act(() => {
        void result.current.fetchGroups();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await act(async () => {
        resolveFetch(ok([]));
        await fetchPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('fetchUserGroups', () => {
    it('successfully fetches a user membership list with nested teams', async () => {
      queueQueries(
        createQuery(
          ok([
            { group_id: 'group-1', teams: groupRow({ id: 'group-1' }) },
            {
              group_id: 'group-2',
              teams: groupRow({ id: 'group-2', name: 'Reading Crew' }),
            },
          ])
        ),
        createQuery(
          ok([
            { group_id: 'group-1', total_members: 3 },
            { group_id: 'group-2', total_members: 2 },
          ])
        )
      );

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await result.current.fetchUserGroups('user-1');
      });

      expect(result.current.userGroups).toEqual(['group-1', 'group-2']);
      expect(result.current.groups.map(group => group.member_count)).toEqual([
        3, 2,
      ]);
    });

    it('handles fetch user groups error', async () => {
      queueQueries(createQuery(fail('Access denied')));

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await expect(
          result.current.fetchUserGroups('user-1')
        ).rejects.toMatchObject({ message: 'Access denied' });
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('does not repopulate account A groups after account B becomes active', async () => {
      let resolveMemberships: (value: SupabaseResult) => void = () => {};
      const memberships = new Promise<SupabaseResult>(resolve => {
        resolveMemberships = resolve;
      });
      queueQueries(createQuery(memberships));

      const request = useGroupStore.getState().fetchUserGroups('user-1');
      await Promise.resolve();

      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'user-2' } } },
        error: null,
      });
      await useGroupStore.getState().clearGroupData();
      resolveMemberships(
        ok([{ group_id: 'group-a', teams: groupRow({ id: 'group-a' }) }])
      );
      await request;

      expect(useGroupStore.getState().groups).toEqual([]);
      expect(useGroupStore.getState().userGroups).toEqual([]);
    });
  });

  describe('economy authority', () => {
    it('reads the current create-group cost from the account-scoped RPC', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValueOnce(
        ok({ viewer: { createGroupCost: 50 } })
      );

      await expect(
        useGroupStore.getState().getCreateGroupCost('user-1')
      ).resolves.toBe(50);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_economy_contract_v1');
    });

    it('reads the current join-group quote from the same account-scoped RPC', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValueOnce(
        ok({
          viewer: { joinGroupCost: 0, activeGroups: 0, isPro: false },
        })
      );

      await expect(
        useGroupStore.getState().getJoinGroupQuote('user-1')
      ).resolves.toEqual({
        cost: 0,
        activeGroups: 0,
        isPro: false,
      });
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_economy_contract_v1');
    });
  });

  describe('fetchGroupMembers', () => {
    it('successfully fetches the authorised group member directory', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValueOnce(
        ok([
          {
            user_id: 'user-1',
            role: 'owner',
            joined_at: '2024-01-01T00:00:00Z',
            username: 'admin_user',
            display_name: 'Admin User',
            avatar_url: 'admin.jpg',
          },
          {
            user_id: 'user-2',
            role: 'member',
            joined_at: '2024-01-02T00:00:00Z',
            username: null,
            display_name: 'Member User',
            avatar_url: null,
          },
        ])
      );

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await result.current.fetchGroupMembers('group-1');
      });

      expect(result.current.groupMembers['group-1']).toHaveLength(2);
      expect(result.current.groupMembers['group-1'][0]).toMatchObject({
        userId: 'user-1',
        groupId: 'group-1',
        role: 'owner',
        username: 'admin_user',
        displayName: 'Admin User',
      });
      expect(result.current.groupMembers['group-1'][1]).toMatchObject({
        userId: 'user-2',
        groupId: 'group-1',
        role: 'member',
        username: 'Member User',
        displayName: 'Member User',
      });
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'list_authorized_group_members',
        { p_group_id: 'group-1' }
      );
    });

    it('handles fetch group members error', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValueOnce(fail('Not found'));

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await expect(
          result.current.fetchGroupMembers('group-1')
        ).rejects.toMatchObject({ message: 'Not found' });
      });
    });
  });

  describe('fetchDiscoverGroups', () => {
    it('only returns active, not-yet-ended public groups with normalised counts', async () => {
      queueQueries(
        createQuery(ok([{ group_id: 'already-joined' }])),
        createQuery(
          ok([
            groupRow({ id: 'active-public', current_streak: 3 }),
            groupRow({ id: 'already-joined' }),
            groupRow({ id: 'failed-public', status: 'failed' }),
            groupRow({
              id: 'ended-public',
              end_date: '2020-01-01T00:00:00.000Z',
            }),
          ])
        ),
        createQuery(ok([{ group_id: 'active-public', total_members: 4 }]))
      );

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await result.current.fetchDiscoverGroups('user-1');
      });

      expect(result.current.discoverGroups).toEqual([
        expect.objectContaining({
          id: 'active-public',
          status: 'active',
          member_count: 4,
        }),
      ]);
    });

    it('propagates discovery errors so the route can show a stale-data recovery state', async () => {
      queueQueries(createQuery(fail('Discovery is unavailable')));

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await expect(
          result.current.fetchDiscoverGroups('user-1')
        ).rejects.toMatchObject({ message: 'Discovery is unavailable' });
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('createGroup', () => {
    it('creates a group through the server authority and refreshes it', async () => {
      const createdGroupId = '10000000-0000-4000-8000-000000000010';
      const createdGroup = groupRow({
        id: createdGroupId,
        name: 'New Group',
        owner_id: 'user-1',
        kind: 'saved',
      });
      (mockSupabase.rpc as jest.Mock).mockImplementation(
        (_name: string, args: { p_client_event_id?: string }) =>
          ok({
            success: true,
            operation: 'SAVED_GROUP_CREATE',
            status: 'confirmed',
            code: 'GROUP_CREATED',
            receipt: {
              receipt_id: '10000000-0000-4000-8000-000000000011',
              client_event_id: args.p_client_event_id,
              canonical_client_event_id: args.p_client_event_id,
              group_id: createdGroupId,
              group_name: 'New Group',
              description: 'A test group',
              privacy: 'public',
              duration_days: 30,
              image_url: null,
              notify_on_member_miss: true,
              debit_amount: 0,
              new_balance: 100,
              created_at: '2026-08-31T08:00:00.000Z',
              idempotent: false,
            },
          })
      );
      useAuthStore.setState({
        isAuthenticated: true,
        user: { id: 'user-1' } as any,
        session: { user: { id: 'user-1' } } as any,
      });
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
        error: null,
      });

      queueQueries(
        createQuery(ok(createdGroup)),
        createQuery({ data: null, error: null, count: 1 } as any)
      );

      const { result } = renderHook(() => useGroupStore());

      let newGroup: Group | undefined;
      await act(async () => {
        newGroup = await result.current.createGroup({
          name: 'New Group',
          description: 'A test group',
          privacy: 'public',
          owner_id: 'user-1',
          duration_days: 30,
        });
      });

      expect(newGroup).toMatchObject({
        id: createdGroupId,
        name: 'New Group',
      });
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'create_accountability_group_v3',
        expect.objectContaining({
          p_name: 'New Group',
          p_privacy: 'public',
        })
      );
      expect(
        (mockSupabase.rpc as jest.Mock).mock.calls[0]?.[1]
      ).not.toHaveProperty('p_cost');
    });
  });

  describe('joinGroup', () => {
    it.each([
      [
        'failed',
        { id: 'group-f', status: 'failed', privacy: 'public', end_date: null },
        'This group is not active',
      ],
      [
        'secret',
        { id: 'group-s', status: 'active', privacy: 'secret', end_date: null },
        'This group is invite-only. Use an invite code.',
      ],
      [
        'private',
        { id: 'group-p', status: 'active', privacy: 'private', end_date: null },
        'This group requires approval to join',
      ],
    ])('blocks join to %s group', async (_label, row, message) => {
      queueQueries(createQuery(ok(row)));

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await expect(
          result.current.joinGroup('user-1', row.id)
        ).rejects.toThrow(message);
      });
    });

    it('handles missing or RLS-hidden groups with a friendly error', async () => {
      queueQueries(createQuery(ok(null)));

      act(() => {
        useGroupStore.setState({
          discoverGroups: [
            groupRow({ id: 'group-hidden', name: 'Hidden Group' }) as Group,
          ],
        });
      });

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await expect(
          result.current.joinGroup('user-1', 'group-hidden')
        ).rejects.toThrow(
          'This group is unavailable or invite-only. Refresh groups or use an invite code.'
        );
      });

      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
      expect(result.current.discoverGroups).toEqual([]);
    });

    it('maps join precheck permission failures to the same friendly path', async () => {
      queueQueries(
        createQuery({
          data: null,
          error: {
            code: '42501',
            message: 'permission denied for table teams',
          },
        })
      );

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await expect(
          result.current.joinGroup('user-1', 'group-private')
        ).rejects.toThrow(
          'This group is unavailable or invite-only. Refresh groups or use an invite code.'
        );
      });

      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
    });

    it('successfully joins an active public group and refreshes caches', async () => {
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'user-2' } } },
        error: null,
      });
      (mockSupabase.rpc as jest.Mock).mockImplementation((name: string) =>
        Promise.resolve(
          name === 'join_public_group_v1'
            ? ok({ success: true, group_id: 'group-1', cost: 10 })
            : ok([])
        )
      );

      queueQueries(
        createQuery(ok({ id: 'group-1', status: 'active', privacy: 'public' })),
        createQuery(ok([{ group_id: 'group-1', teams: groupRow() }])),
        createQuery(ok([{ group_id: 'group-1', total_members: 3 }])),
        createQuery(ok([{ group_id: 'group-1' }])),
        createQuery(ok([]))
      );

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await result.current.joinGroup('user-2', 'group-1');
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('join_public_group_v1', {
        p_group_id: 'group-1',
      });
      expect(result.current.userGroups).toEqual(['group-1']);
      expect(result.current.groups[0].member_count).toBe(3);
    });

    it('sends group notifications when the operational switch is enabled', async () => {
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'user-2' } } },
        error: null,
      });
      mockIsOperationalFeatureEnabled.mockResolvedValueOnce(true);
      (mockSupabase.rpc as jest.Mock).mockImplementation((name: string) =>
        Promise.resolve(
          name === 'join_public_group_v1'
            ? ok({ success: true, group_id: 'group-1', cost: 10 })
            : ok([])
        )
      );

      queueQueries(
        createQuery(ok({ id: 'group-1', status: 'active', privacy: 'public' })),
        createQuery(ok([{ group_id: 'group-1', teams: groupRow() }])),
        createQuery(ok([{ group_id: 'group-1', total_members: 2 }])),
        createQuery(ok([{ group_id: 'group-1' }])),
        createQuery(ok([])),
        createQuery(ok([{ user_id: 'user-1' }, { user_id: 'user-2' }])),
        createQuery(ok({ name: 'Morning Miles' })),
        createQuery(ok({ username: 'Maya', display_name: 'Maya' }))
      );

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await result.current.joinGroup('user-2', 'group-1');
      });

      expect(mockIsOperationalFeatureEnabled).toHaveBeenCalledWith(
        'group_notifications_enabled'
      );
      expect(notificationService.sendGroupActivity).toHaveBeenCalledWith(
        'user-1',
        'Maya',
        'Morning Miles',
        'group-1',
        'joined the group'
      );
    });

    it('handles join group error', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue(
        fail('Already a member')
      );
      queueQueries(
        createQuery(ok({ id: 'group-1', status: 'active', privacy: 'public' }))
      );

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await expect(
          result.current.joinGroup('user-1', 'group-1')
        ).rejects.toMatchObject({ message: 'Already a member' });
      });
    });
  });

  describe('joinGroupByInviteCode', () => {
    it('joins through the consume-join-code edge function', async () => {
      (mockSupabase.functions.invoke as jest.Mock).mockResolvedValue(
        ok({
          success: true,
          group: groupRow({ id: 'group-1', name: 'Invite Group' }),
        })
      );

      queueQueries(
        createQuery(
          ok([
            {
              group_id: 'group-1',
              teams: groupRow({ id: 'group-1', name: 'Invite Group' }),
            },
          ])
        ),
        createQuery(ok([{ group_id: 'group-1', total_members: 1 }]))
      );

      const { result } = renderHook(() => useGroupStore());

      let joinedGroup: Group | undefined;
      await act(async () => {
        joinedGroup = await result.current.joinGroupByInviteCode(
          'user-1',
          'abc123'
        );
      });

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'consume-join-code',
        {
          body: {
            code: 'ABC123',
            type: 'group',
            cost: 0,
          },
        }
      );
      expect(joinedGroup).toMatchObject({
        id: 'group-1',
        name: 'Invite Group',
      });
      expect(result.current.userGroups).toEqual(['group-1']);
    });

    it.each([
      ['INVALID_CODE', 'Invalid invite code'],
      ['EXPIRED_CODE', 'Invalid invite code'],
      ['GROUP_INACTIVE', 'This group is no longer active'],
      ['ALREADY_MEMBER', 'You are already a member of this group'],
    ])('maps %s invite response to a friendly error', async (code, message) => {
      (mockSupabase.functions.invoke as jest.Mock).mockResolvedValue(
        ok({ success: false, code })
      );

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await expect(
          result.current.joinGroupByInviteCode('user-1', 'ABC123')
        ).rejects.toThrow(message);
      });
    });
  });

  describe('previewGroupInvite', () => {
    it('uses the least-disclosure guest preview RPC', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue(
        ok({
          success: true,
          operation: 'GROUP_INVITE_GUEST_PREVIEW',
          code: 'PREVIEW_READY',
          preview: {
            group_name: 'Morning Miles',
            inviter_name: 'Maya',
            shared_promise: 'Walk for 20 minutes',
            expires_at: '2026-09-01T00:00:00.000Z',
          },
        })
      );

      await expect(
        useGroupStore
          .getState()
          .previewGuestGroupInvite('abcdefghjklmnpqrstuvwxyz23')
      ).resolves.toEqual({
        status: 'ACTIVE',
        groupName: 'Morning Miles',
        inviterName: 'Maya',
        sharedPromise: 'Walk for 20 minutes',
        expiresAt: '2026-09-01T00:00:00.000Z',
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'preview_group_invite_guest_v1',
        { p_invite_code: 'ABCDEFGHJKLMNPQRSTUVWXYZ23' }
      );
    });

    it('fails closed when guest preview is unavailable or over-disclosing', async () => {
      (mockSupabase.rpc as jest.Mock)
        .mockResolvedValueOnce(
          ok({
            success: false,
            operation: 'GROUP_INVITE_GUEST_PREVIEW',
            code: 'UNAVAILABLE',
          })
        )
        .mockResolvedValueOnce(
          ok({
            success: true,
            operation: 'GROUP_INVITE_GUEST_PREVIEW',
            code: 'PREVIEW_READY',
            preview: {
              group_name: 'Morning Miles',
              inviter_name: 'Maya',
              shared_promise: null,
              expires_at: '2026-09-01T00:00:00.000Z',
              group_id: 'group-1',
            },
          })
        );

      await expect(
        useGroupStore
          .getState()
          .previewGuestGroupInvite('ABCDEFGHJKLMNPQRSTUVWXYZ23')
      ).rejects.toMatchObject({ code: 'UNAVAILABLE' });
      await expect(
        useGroupStore
          .getState()
          .previewGuestGroupInvite('ABCDEFGHJKLMNPQRSTUVWXYZ23')
      ).rejects.toMatchObject({ code: 'INVALID_PREVIEW_RESPONSE' });
    });

    it('uses the non-consuming preview RPC and decodes its response', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue(
        ok({
          success: true,
          operation: 'GROUP_INVITE_PREVIEW',
          code: 'PREVIEW_READY',
          preview: {
            status: 'ACTIVE',
            invite_code: 'ABCD2345',
            group_id: 'group-1',
            group_name: 'Morning Miles',
            group_description: 'Walk before work',
            privacy: 'private',
            member_count: 4,
            inviter_name: 'Maya',
            shared_promise: 'Walk for 20 minutes',
            expires_at: null,
            is_member: false,
          },
        })
      );

      await expect(
        useGroupStore.getState().previewGroupInvite('abcd2345')
      ).resolves.toMatchObject({
        status: 'ACTIVE',
        inviteCode: 'ABCD2345',
        groupName: 'Morning Miles',
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('preview_group_invite_v2', {
        p_invite_code: 'ABCD2345',
      });
      expect(mockSupabase.functions.invoke).not.toHaveBeenCalled();
    });

    it('rejects malformed preview JSON without claiming an invite exists', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue(
        ok({
          success: true,
          operation: 'GROUP_INVITE_PREVIEW',
          code: 'PREVIEW_READY',
          preview: { status: 'ACTIVE' },
        })
      );

      await expect(
        useGroupStore.getState().previewGroupInvite('ABCD2345')
      ).rejects.toMatchObject({
        name: 'GroupInvitePreviewContractError',
        code: 'INVALID_PREVIEW_RESPONSE',
      });
    });
  });

  describe('group invite lifecycle', () => {
    it('reads the active invite without rotating it', async () => {
      (mockSupabase.functions.invoke as jest.Mock).mockResolvedValue(
        ok({
          success: true,
          code: 'ABCD2345',
          replaced: false,
          previous_code_invalidated: false,
        })
      );

      await expect(
        useGroupStore.getState().getOrCreateGroupInviteCode('group-1')
      ).resolves.toBe('ABCD2345');

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'generate-group-invite',
        { body: { groupId: 'group-1', replace: false } }
      );
    });

    it('returns a server-confirmed replacement receipt', async () => {
      (mockSupabase.functions.invoke as jest.Mock).mockResolvedValue(
        ok({
          success: true,
          code: 'PQRS6789',
          replaced: true,
          previous_code_invalidated: true,
        })
      );

      await expect(
        useGroupStore.getState().rotateGroupInviteCode('group-1', 'ABCD2345')
      ).resolves.toEqual({
        code: 'PQRS6789',
        previousCodeInvalidated: true,
      });

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'generate-group-invite',
        { body: { groupId: 'group-1', replace: true } }
      );
    });

    it('recovers a lost replacement response by reading the active code', async () => {
      (mockSupabase.functions.invoke as jest.Mock)
        .mockResolvedValueOnce(fail('Network response lost'))
        .mockResolvedValueOnce(
          ok({
            success: true,
            code: 'PQRS6789',
            replaced: false,
            previous_code_invalidated: false,
          })
        );

      await expect(
        useGroupStore.getState().rotateGroupInviteCode('group-1', 'ABCD2345')
      ).resolves.toEqual({
        code: 'PQRS6789',
        previousCodeInvalidated: true,
      });
    });
  });

  describe('leaveGroup', () => {
    it('successfully leaves a group and refreshes memberships', async () => {
      queueQueries(
        createQuery(ok({ role: 'member' })),
        createQuery(ok({ user_id: 'user-1' })),
        createQuery(
          ok([
            {
              group_id: 'group-2',
              teams: groupRow({ id: 'group-2', name: 'Still Here' }),
            },
          ])
        ),
        createQuery(ok([{ group_id: 'group-2', total_members: 2 }]))
      );

      act(() => {
        useGroupStore.setState({
          groups: [groupRow({ id: 'group-1' }) as Group],
          userGroups: ['group-1', 'group-2'],
        });
      });

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await result.current.leaveGroup('user-1', 'group-1');
      });

      expect(result.current.userGroups).toEqual(['group-2']);
      expect(result.current.groups[0]).toMatchObject({
        id: 'group-2',
        member_count: 2,
      });
    });

    it('does not continue an account A leave after account B becomes active', async () => {
      let resolveMembership: (value: SupabaseResult) => void = () => {};
      const membershipPromise = new Promise<SupabaseResult>(resolve => {
        resolveMembership = resolve;
      });
      queueQueries(createQuery(membershipPromise));

      const leavePromise = useGroupStore
        .getState()
        .leaveGroup('user-1', 'group-1');

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledTimes(1);
      });

      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'user-2' } } },
        error: null,
      });
      await useGroupStore.getState().clearGroupData();
      resolveMembership(ok({ role: 'member' }));

      await expect(leavePromise).resolves.toMatchObject({
        kind: 'unknown',
        action: 'leave-group',
        requiresStateCheck: true,
      });
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
      expect(useGroupStore.getState().userGroups).toEqual([]);
    });

    it('does not confirm leave when an RLS no-op returns no deleted row', async () => {
      queueQueries(
        createQuery(ok({ role: 'member' })),
        createQuery(ok(null)),
        createQuery(ok({ user_id: 'user-1' }))
      );

      act(() => {
        useGroupStore.setState({ userGroups: ['group-1'] });
      });

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await expect(
          result.current.leaveGroup('user-1', 'group-1')
        ).resolves.toMatchObject({
          kind: 'rejected',
          action: 'leave-group',
        });
      });

      expect(result.current.userGroups).toEqual(['group-1']);
    });

    it('keeps a response-loss leave outcome unconfirmed until state can be checked', async () => {
      queueQueries(createQuery(fail('Membership lookup failed')));

      act(() => {
        useGroupStore.setState({ userGroups: ['group-1'] });
      });

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await expect(
          result.current.leaveGroup('user-1', 'group-1')
        ).resolves.toMatchObject({
          kind: 'unknown',
          requiresStateCheck: true,
        });
      });

      expect(result.current.userGroups).toEqual(['group-1']);
    });
  });

  describe('Edge Cases and Data Integrity', () => {
    it('handles empty groups response', async () => {
      queueQueries(createQuery(ok(null)));

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await result.current.fetchGroups();
      });

      expect(result.current.groups).toEqual([]);
    });

    it('handles malformed group data with normalization defaults', async () => {
      queueQueries(
        createQuery(ok([{ id: 'group-1', name: 'Test Group' }])),
        createQuery(ok([]))
      );

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await result.current.fetchGroups();
      });

      expect(result.current.groups).toHaveLength(1);
      expect(result.current.groups[0]).toMatchObject({
        id: 'group-1',
        name: 'Test Group',
        description: null,
        privacy: null,
        member_count: 0,
        status: 'active',
        duration_days: 0,
      });
    });
  });

  describe('getGroupRiskData', () => {
    it('returns the membership-scoped JSON object without dropping its facts', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValueOnce(
        ok({
          group_id: 'group-1',
          risk_level: 'at_risk',
          total_members: 5,
          submitted_today: 4,
          pending_submissions: 1,
          pending_reviews: 0,
          end_of_day_utc: '2026-08-10T08:00:00.000Z',
          seconds_remaining: 7200,
          misses_to_break_streak: 2,
        })
      );

      const result = await useGroupStore.getState().getGroupRiskData('group-1');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_group_risk_data', {
        p_group_id: 'group-1',
      });
      expect(result).toEqual(
        expect.objectContaining({
          groupId: 'group-1',
          level: 'at_risk',
          totalMembers: 5,
          submittedToday: 4,
          pendingSubmissions: 1,
        })
      );
    });
  });

  describe('getTodaysSubmissions', () => {
    it('includes solo challenges when the joined challenge relation is an array', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const soloChallenge = {
        id: 'solo-1',
        title: 'Solo Focus',
        verification_type: 'text',
        start_date: yesterday.toISOString(),
        duration: 7,
        status: 'active',
        allow_self_review: true,
        submission_expectations: {
          daily_deadline_hour_utc: 23,
          grace_minutes: 0,
        },
      };

      queueQueries(
        createQuery(ok([{ challenge_id: 'solo-1' }])),
        createQuery(ok([])),
        createQuery(
          ok([
            {
              challenge_id: 'solo-1',
              challenges: [soloChallenge],
            },
          ])
        )
      );
      (mockSupabase.rpc as jest.Mock).mockResolvedValue(ok(false));

      const { result } = renderHook(() => useGroupStore());
      let submissions: Awaited<
        ReturnType<typeof result.current.getTodaysSubmissions>
      > = [];

      await act(async () => {
        submissions = await result.current.getTodaysSubmissions('user-1');
      });

      expect(mockSupabase.from).toHaveBeenNthCalledWith(
        1,
        'challenge_participants'
      );
      expect(mockSupabase.from).toHaveBeenNthCalledWith(2, 'team_members');
      expect(mockSupabase.from).toHaveBeenNthCalledWith(
        3,
        'challenge_participants'
      );
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'has_submitted_today',
        expect.objectContaining({
          p_challenge_id: 'solo-1',
          p_user_id: 'user-1',
        })
      );
      expect(submissions).toHaveLength(1);
      expect(submissions[0]).toMatchObject({
        id: 'solo-solo-1',
        challengeId: 'solo-1',
        challengeTitle: 'Solo Focus',
        memberCount: 1,
        submissionType: 'text',
        hasSubmittedToday: false,
        isSolo: true,
      });
    });

    it('skips group challenges the user is not enrolled on', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const runChallenge = {
        id: 'run-1',
        title: 'Morning run',
        verification_type: 'text',
        start_date: yesterday.toISOString(),
        duration: 30,
        status: 'active',
        submission_expectations: {
          daily_deadline_hour_utc: 23,
          grace_minutes: 0,
        },
      };
      const readingChallenge = {
        id: 'reading-1',
        title: 'Daily reading',
        verification_type: 'text',
        start_date: yesterday.toISOString(),
        duration: 30,
        status: 'active',
        submission_expectations: {
          daily_deadline_hour_utc: 23,
          grace_minutes: 0,
        },
      };

      queueQueries(
        createQuery(ok([{ challenge_id: 'reading-1' }])),
        createQuery(
          ok([
            {
              group_id: 'group-1',
              teams: [
                {
                  id: 'group-1',
                  name: 'Mixed Crew',
                  status: 'active',
                  team_challenges: [
                    { challenge_id: 'run-1', challenges: [runChallenge] },
                    {
                      challenge_id: 'reading-1',
                      challenges: [readingChallenge],
                    },
                  ],
                },
              ],
            },
          ])
        ),
        createQuery(ok([]))
      );
      (mockSupabase.rpc as jest.Mock).mockResolvedValue(ok(false));

      const { result } = renderHook(() => useGroupStore());
      let submissions: Awaited<
        ReturnType<typeof result.current.getTodaysSubmissions>
      > = [];

      await act(async () => {
        submissions = await result.current.getTodaysSubmissions('user-1');
      });

      expect(submissions).toHaveLength(1);
      expect(submissions[0]).toMatchObject({
        challengeId: 'reading-1',
        groupName: 'Mixed Crew',
        isSolo: false,
      });
    });
  });

  describe('Persistence', () => {
    it('does not persist account-scoped groups across sessions', async () => {
      const { result } = renderHook(() => useGroupStore());
      const mockGroup = groupRow({ id: 'group-1', member_count: 5 }) as Group;

      act(() => {
        useGroupStore.setState({
          groups: [mockGroup],
          userGroups: ['group-1'],
        });
      });

      await waitFor(async () => {
        const stored = await AsyncStorage.getItem('group-store');
        expect(stored).not.toContain('group-1');
        expect(JSON.parse(stored || '{}').state).toEqual({
          groups: [],
          userGroups: [],
        });
      });
    });

    it('drops a legacy version-zero group payload during rehydration', async () => {
      await AsyncStorage.setItem(
        'group-store',
        JSON.stringify({
          version: 0,
          state: {
            groups: [groupRow({ id: 'legacy-group' })],
            userGroups: ['legacy-group'],
          },
        })
      );

      await useGroupStore.persist.rehydrate();

      expect(useGroupStore.getState().groups).toEqual([]);
      expect(useGroupStore.getState().userGroups).toEqual([]);
    });
  });
});
