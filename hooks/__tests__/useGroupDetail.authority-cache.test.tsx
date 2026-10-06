import React, { type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useGroupDetailData } from '@/hooks/useGroupDetail';
import { groupQueryKeys } from '@/lib/group-query-keys';

let mockUserId: string | null = 'viewer-1';
let mockIsAuthenticated = true;
const mockReadMembership = jest.fn();
const mockReadChallenges = jest.fn();
const mockFetchGroupDetails = jest.fn();
const mockFetchGroupMembers = jest.fn();

jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      isAuthenticated: mockIsAuthenticated,
      user: mockUserId ? { id: mockUserId } : null,
    }),
}));

jest.mock('@/store/group-store', () => ({
  useGroupStore: {
    getState: () => ({
      fetchGroupDetails: mockFetchGroupDetails,
      fetchGroupMembers: mockFetchGroupMembers,
      groupMembers: {},
    }),
  },
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: () => mockReadMembership() }),
          order: () => mockReadChallenges(),
        }),
      }),
    }),
  },
}));

jest.mock('@/lib/queryClient', () => ({
  interactiveQueryConfig: { staleTime: Infinity },
  staticQueryConfig: { staleTime: Infinity },
}));

const groupId = 'private-group';
const privateGroup = { id: groupId, privacy: 'private', name: 'Private group' };
const members = [{ user_id: 'private-member' }];
const challenges = [{ id: 'private-promise', title: 'Private promise' }];
const accessKey = (userId: string) => [
  ...groupQueryKeys.members(userId, groupId),
  'self-access',
];

describe('useGroupDetailData cached authority transitions', () => {
  let client: QueryClient;

  const seed = (userId: string, confirmed?: boolean) => {
    client.setQueryData(groupQueryKeys.detail(userId, groupId), privateGroup);
    client.setQueryData(groupQueryKeys.members(userId, groupId), members);
    client.setQueryData(groupQueryKeys.challenges(userId, groupId), challenges);
    if (confirmed !== undefined) {
      client.setQueryData(accessKey(userId), confirmed);
    }
  };

  const mount = () =>
    renderHook(() => useGroupDetailData(groupId), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });

  const failRefresh = async (error: unknown) => {
    mockReadMembership.mockResolvedValue({ data: null, error });
    await act(async () => {
      await client.refetchQueries({
        queryKey: accessKey('viewer-1'),
        exact: true,
      });
    });
  };

  beforeEach(() => {
    client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    mockUserId = 'viewer-1';
    mockIsAuthenticated = true;
    mockReadMembership.mockReset();
    mockFetchGroupDetails.mockReset().mockResolvedValue(privateGroup);
    mockFetchGroupMembers.mockReset().mockResolvedValue(undefined);
    mockReadChallenges
      .mockReset()
      .mockResolvedValue({ data: [], error: null, status: 200 });
    mockReadMembership.mockResolvedValue({
      data: { group_id: groupId },
      error: null,
    });
  });

  afterEach(() => client.clear());

  it.each([
    new Error('Network request failed'),
    new Error('Request timed out'),
    new Error('The device is offline'),
    new TypeError('Failed to fetch'),
  ])('keeps same-account confirmed content stale after %s', async error => {
    seed('viewer-1', true);
    const { result } = mount();
    await failRefresh(error);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.errorKind).toBe('network');
    expect(result.current.isStale).toBe(true);
    expect(result.current.privateAccessConfirmed).toBe(true);
    expect(result.current.group).toEqual(privateGroup);
    expect(result.current.members).toEqual(members);
    expect(result.current.challenges).toEqual(challenges);
  });

  it.each([
    { code: '42501', message: 'Permission denied' },
    { status: 401, message: 'Network request failed' },
    { code: 'OTHER', status: 403, message: 'Network request failed' },
    { code: 'PGRST301', message: 'JWT expired' },
    { code: 'session_not_found', message: 'Network request failed' },
    { name: 'AuthSessionMissingError', message: 'Auth session missing' },
    { message: 'Session expired while offline' },
    { code: 'PGRST116', message: 'Contains 0 rows' },
    { status: 404, message: 'Not found' },
    { code: 'UNRECOGNIZED', message: 'Network request failed' },
    { status: 500, message: 'Network request failed' },
    new Error('Unexpected failure'),
  ])(
    'does not revive rejected authority after a later timeout: %j',
    async error => {
      seed('viewer-1', true);
      const { result } = mount();
      await failRefresh(error);

      await waitFor(() =>
        expect(result.current.privateAccessConfirmed).toBe(false)
      );
      expect(result.current.group).toBeNull();
      expect(result.current.members).toEqual([]);
      expect(result.current.challenges).toEqual([]);
      expect(client.getQueryData(accessKey('viewer-1'))).toBe(false);

      await failRefresh(new Error('Request timed out'));
      await waitFor(() => expect(result.current.errorKind).toBe('network'));
      expect(result.current.privateAccessConfirmed).toBe(false);
      expect(result.current.group).toBeNull();
    }
  );

  it('does not grant access on an initial network failure', async () => {
    seed('viewer-1');
    mockReadMembership.mockResolvedValue({
      data: null,
      error: new Error('Request timed out'),
    });
    const { result } = mount();
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.privateAccessConfirmed).toBe(false);
    expect(result.current.group).toBeNull();
  });

  it.each([401, 403, 404, 500])(
    'does not treat a real-shaped HTTP %i response as transport failure',
    async status => {
      seed('viewer-1', true);
      const { result } = mount();
      mockReadMembership.mockResolvedValue({
        data: null,
        status,
        error: { message: 'Network request failed' },
      });
      await act(async () => {
        await client.refetchQueries({
          queryKey: accessKey('viewer-1'),
          exact: true,
        });
      });
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.privateAccessConfirmed).toBe(false);
      expect(result.current.group).toBeNull();
    }
  );

  it('retains confirmed access for a real-shaped status 0 transport response', async () => {
    seed('viewer-1', true);
    const { result } = mount();
    mockReadMembership.mockResolvedValue({
      data: null,
      status: 0,
      error: { code: '', message: 'TypeError: Network request failed' },
    });
    await act(async () => {
      await client.refetchQueries({
        queryKey: accessKey('viewer-1'),
        exact: true,
      });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.privateAccessConfirmed).toBe(true);
    expect(result.current.group).toEqual(privateGroup);
  });

  it.each(['detail', 'members', 'challenges'] as const)(
    'keeps %s rejection latched through timeout, remount and unrelated success',
    async scope => {
      seed('viewer-1', true);
      const denied = { code: '42501', message: 'Permission denied' };
      const timeout = new Error('Request timed out');
      const key = groupQueryKeys[scope]('viewer-1', groupId);
      const setFailure = (error: unknown) => {
        if (scope === 'detail') mockFetchGroupDetails.mockRejectedValue(error);
        if (scope === 'members') mockFetchGroupMembers.mockRejectedValue(error);
        if (scope === 'challenges')
          mockReadChallenges.mockResolvedValue({
            data: null,
            error,
            status: 0,
          });
      };
      setFailure(denied);
      let hook = mount();
      await act(async () => {
        await client.refetchQueries({ queryKey: key, exact: true });
      });
      await waitFor(() => expect(hook.result.current.group).toBeNull());
      expect(client.getQueryData(key)).toBeNull();
      setFailure(timeout);
      // A successful membership response cannot validate a rejected resource.
      await act(async () => {
        await client.refetchQueries({
          queryKey: accessKey('viewer-1'),
          exact: true,
        });
      });
      if (scope !== 'detail') {
        await act(async () => {
          await client.refetchQueries({
            queryKey: groupQueryKeys.detail('viewer-1', groupId),
            exact: true,
          });
        });
      }
      await act(async () => {
        await client.refetchQueries({ queryKey: key, exact: true });
      });
      hook.unmount();
      hook = mount();
      await waitFor(() => expect(hook.result.current.group).toBeNull());
      expect(hook.result.current.members).toEqual([]);
      expect(hook.result.current.challenges).toEqual([]);
      mockFetchGroupDetails.mockResolvedValue(privateGroup);
      mockFetchGroupMembers.mockResolvedValue(undefined);
      mockReadChallenges.mockResolvedValue({
        data: [],
        error: null,
        status: 200,
      });
      await act(async () => {
        await hook.result.current.refetch();
      });
      await waitFor(() =>
        expect(hook.result.current.group).toEqual(privateGroup)
      );
    }
  );

  it('does not resurrect a cached public header after a private/not-found response then timeout', async () => {
    seed('viewer-1', false);
    client.setQueryData(groupQueryKeys.detail('viewer-1', groupId), {
      ...privateGroup,
      privacy: 'public',
    });
    const { result } = mount();
    expect(result.current.group?.privacy).toBe('public');
    mockFetchGroupDetails.mockRejectedValue({ code: 'PGRST116' });
    await act(async () => {
      await client.refetchQueries({
        queryKey: groupQueryKeys.detail('viewer-1', groupId),
        exact: true,
      });
    });
    await waitFor(() => expect(result.current.group).toBeNull());
    mockFetchGroupDetails.mockRejectedValue(new Error('Request timed out'));
    await act(async () => {
      await client.refetchQueries({
        queryKey: groupQueryKeys.detail('viewer-1', groupId),
        exact: true,
      });
    });
    await waitFor(() => expect(result.current.errorKind).toBe('network'));
    expect(result.current.group).toBeNull();
    mockFetchGroupDetails.mockResolvedValue({
      ...privateGroup,
      privacy: 'public',
    });
    await act(async () => {
      await client.refetchQueries({
        queryKey: groupQueryKeys.detail('viewer-1', groupId),
        exact: true,
      });
    });
    await waitFor(() => expect(result.current.group?.privacy).toBe('public'));
  });

  it('rejects successful reads started before a different scope denied authority', async () => {
    seed('viewer-1', true);
    let finishDetail!: (value: unknown) => void;
    mockFetchGroupDetails.mockImplementation(
      () =>
        new Promise(resolve => {
          finishDetail = resolve;
        })
    );
    const { result } = mount();
    let pending!: Promise<void>;
    await act(async () => {
      pending = client.refetchQueries({
        queryKey: groupQueryKeys.detail('viewer-1', groupId),
        exact: true,
      });
    });
    await failRefresh({ code: '42501' });
    await waitFor(() => expect(result.current.group).toBeNull());
    await act(async () => {
      finishDetail(privateGroup);
      await pending;
    });
    expect(
      client.getQueryData(groupQueryKeys.detail('viewer-1', groupId))
    ).toBeNull();
    expect(result.current.group).toBeNull();
  });

  it('does not reuse another account’s confirmed membership on network failure', async () => {
    seed('viewer-1', true);
    seed('viewer-2');
    const { result, rerender } = mount();
    expect(result.current.privateAccessConfirmed).toBe(true);

    mockReadMembership.mockResolvedValue({
      data: null,
      error: new Error('Request timed out'),
    });
    mockUserId = 'viewer-2';
    rerender({});
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.privateAccessConfirmed).toBe(false);
    expect(result.current.group).toBeNull();
    expect(result.current.members).toEqual([]);
    expect(result.current.challenges).toEqual([]);
  });

  it('hides confirmed private content when the session becomes unauthenticated', () => {
    seed('viewer-1', true);
    const { result, rerender } = mount();
    expect(result.current.privateAccessConfirmed).toBe(true);
    mockIsAuthenticated = false;
    rerender({});
    expect(result.current.privateAccessConfirmed).toBe(false);
    expect(result.current.group).toBeNull();
  });

  it('keeps revoked membership denied through a timeout and restores after live confirmation', async () => {
    seed('viewer-1', true);
    const { result } = mount();
    mockReadMembership.mockResolvedValue({ data: null, error: null });
    await act(async () => {
      await client.refetchQueries({
        queryKey: accessKey('viewer-1'),
        exact: true,
      });
    });
    await waitFor(() =>
      expect(result.current.privateAccessConfirmed).toBe(false)
    );
    await failRefresh(new Error('Request timed out'));
    await waitFor(() => expect(result.current.errorKind).toBe('network'));
    expect(result.current.group).toBeNull();

    mockReadMembership.mockResolvedValue({
      data: { group_id: groupId },
      error: null,
    });
    await act(async () => {
      await client.refetchQueries({
        queryKey: accessKey('viewer-1'),
        exact: true,
      });
    });
    await waitFor(() =>
      expect(result.current.privateAccessConfirmed).toBe(true)
    );
    expect(result.current.group).toEqual(privateGroup);
  });
});
