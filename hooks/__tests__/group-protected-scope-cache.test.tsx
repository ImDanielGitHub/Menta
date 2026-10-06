import React, { type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { defaultScheduler, notifyManager } from '@tanstack/query-core';
import { useGroupAccountabilityBoard } from '@/hooks/useGroupAccountabilityBoard';
import { usePromiseAccountability } from '@/hooks/usePromiseAccountability';
import { groupQueryKeys } from '@/lib/group-query-keys';

const mockBoardRead = jest.fn();
const mockProofRead = jest.fn();
const mockPromiseRead = jest.fn();
let mockUserId = 'viewer-1';
let mockChallengeIds = ['promise-1'];
jest.mock('@/store/auth-store', () => ({
  useAuthStore: (select: (state: unknown) => unknown) =>
    select({ isAuthenticated: true, user: { id: mockUserId } }),
}));
jest.mock('@/lib/promises/accountability', () => ({
  fetchPromiseAccountability: (...args: unknown[]) => mockPromiseRead(...args),
}));
jest.mock('@/lib/queryClient', () => ({
  interactiveQueryConfig: { staleTime: Infinity },
}));
jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: () => mockBoardRead(),
    from: () => {
      const chain = {
        select: () => chain,
        in: () => chain,
        not: () => chain,
        order: () => chain,
        limit: () => mockProofRead(),
      };
      return chain;
    },
  },
}));

const groupId = 'group-1';
const promiseId = 'promise-1';
const boardKey = [
  'groupAccountabilityBoard',
  'viewer-1',
  groupId,
  'en-NZ',
  [promiseId],
  [],
  null,
];
const promiseAuthorityKey = [
  'promise-accountability',
  promiseId,
  'account',
  'viewer-1',
];
const promiseKey = [...promiseAuthorityKey, 'group', groupId];
const standalonePromiseKey = [...promiseAuthorityKey, 'group', ''];
const snapshot = { members: [], recentProof: [{ id: 'private-proof' }] };
const summary = {
  members: [{ id: 'private-person' }],
  promise: { title: 'Private promise' },
};

describe('protected group scope denial cache', () => {
  let client: QueryClient;
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const board = () =>
    useGroupAccountabilityBoard({
      userId: mockUserId,
      groupId,
      challengeIds: mockChallengeIds,
      members: [],
    });
  const promise = () => usePromiseAccountability(promiseId, groupId);
  beforeEach(() => {
    client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    mockUserId = 'viewer-1';
    mockChallengeIds = [promiseId];
    mockBoardRead
      .mockReset()
      .mockResolvedValue({ data: [], error: null, status: 200 });
    mockProofRead
      .mockReset()
      .mockResolvedValue({ data: [], error: null, status: 200 });
    mockPromiseRead.mockReset().mockResolvedValue(summary);
    client.setQueryData(boardKey, snapshot);
    client.setQueryData(promiseKey, summary);
    client.setQueryData(standalonePromiseKey, summary);
    client.setQueryData(promiseAuthorityKey, summary);
    client.setQueryData(['promise-accountability', promiseId], summary);
    client.setQueryData(groupQueryKeys.detail('viewer-1', groupId), {
      id: groupId,
      privacy: 'private',
    });
    client.setQueryData(
      [...groupQueryKeys.members('viewer-1', groupId), 'self-access'],
      true
    );
  });
  afterEach(() => {
    notifyManager.setScheduler(defaultScheduler);
    client.clear();
  });

  it.each(['board', 'proof'] as const)(
    'retains %s denial through timeout/remount until that scope succeeds',
    async scope => {
      const read = scope === 'board' ? mockBoardRead : mockProofRead;
      let hook = renderHook(board, { wrapper });
      read.mockResolvedValue({
        data: null,
        error: { message: 'Network request failed' },
        status: 403,
      });
      await act(async () => {
        await hook.result.current.refetch();
      });
      await waitFor(() => expect(hook.result.current.accessDenied).toBe(true));
      expect(hook.result.current.data).toBeNull();
      expect(
        client.getQueryData([
          ...groupQueryKeys.members('viewer-1', groupId),
          'self-access',
        ])
      ).toBe(false);
      // Fresh detail and membership cannot clear a board/proof rejection.
      client.setQueryData(groupQueryKeys.detail('viewer-1', groupId), {
        id: groupId,
        privacy: 'private',
      });
      client.setQueryData(
        [...groupQueryKeys.members('viewer-1', groupId), 'self-access'],
        true
      );
      read.mockResolvedValue({
        data: null,
        error: { message: 'Network request failed' },
        status: 0,
      });
      await act(async () => {
        await hook.result.current.refetch();
      });
      hook.unmount();
      hook = renderHook(board, { wrapper });
      expect(hook.result.current.accessDenied).toBe(true);
      expect(hook.result.current.data).toBeNull();
      read.mockResolvedValue({ data: [], error: null, status: 200 });
      await act(async () => {
        await hook.result.current.refetch();
      });
      await waitFor(() => expect(hook.result.current.accessDenied).toBe(false));
      expect(hook.result.current.data).not.toBeNull();
    }
  );

  it('retains promise denial through timeout/remount until a fresh promise read succeeds', async () => {
    let hook = renderHook(promise, { wrapper });
    mockPromiseRead.mockRejectedValue({
      code: 'PROMISE_NOT_FOUND',
      status: 404,
    });
    await act(async () => {
      await hook.result.current.refetch();
    });
    await waitFor(() => expect(hook.result.current.accessDenied).toBe(true));
    expect(hook.result.current.data).toBeNull();
    mockPromiseRead.mockRejectedValue(new Error('Request timed out'));
    await act(async () => {
      await hook.result.current.refetch();
    });
    hook.unmount();
    hook = renderHook(promise, { wrapper });
    expect(hook.result.current.accessDenied).toBe(true);
    expect(hook.result.current.data).toBeNull();
    mockPromiseRead.mockResolvedValue(summary);
    await act(async () => {
      await hook.result.current.refetch();
    });
    await waitFor(() => expect(hook.result.current.accessDenied).toBe(false));
    expect(hook.result.current.data).toEqual(summary);
  });

  it('retains a confirmed board snapshot on transport failure without a denial', async () => {
    const { result } = renderHook(board, { wrapper });
    mockBoardRead.mockResolvedValue({
      data: null,
      error: { message: 'Network request failed' },
      status: 0,
    });
    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(Boolean(result.current.accessDenied)).toBe(false);
    expect(result.current.data).toEqual(snapshot);
  });

  it('does not reuse a prior account’s promise snapshot after account change', async () => {
    const { result, rerender } = renderHook(promise, { wrapper });
    expect(result.current.data).toEqual(summary);
    mockPromiseRead.mockRejectedValue(new Error('Request timed out'));
    mockUserId = 'viewer-2';
    rerender({});
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it('nulls all same-account/group board variants without clearing other scopes', async () => {
    const otherVariantKey = [
      'groupAccountabilityBoard',
      'viewer-1',
      groupId,
      'en-NZ',
      ['promise-2'],
      [],
      null,
    ];
    const otherGroupKey = [
      'groupAccountabilityBoard',
      'viewer-1',
      'group-2',
      [promiseId],
      [],
      null,
    ];
    const otherAccountKey = [
      'groupAccountabilityBoard',
      'viewer-2',
      groupId,
      [promiseId],
      [],
      null,
    ];
    for (const key of [otherVariantKey, otherGroupKey, otherAccountKey])
      client.setQueryData(key, snapshot);
    const { result, rerender } = renderHook(board, { wrapper });
    mockBoardRead.mockResolvedValue({
      data: null,
      error: { message: 'Permission denied' },
      status: 403,
    });
    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() => expect(result.current.accessDenied).toBe(true));
    expect(client.getQueryData(otherVariantKey)).toBeNull();
    expect(client.getQueryData(otherGroupKey)).toEqual(snapshot);
    expect(client.getQueryData(otherAccountKey)).toEqual(snapshot);
    mockBoardRead.mockResolvedValue({
      data: null,
      error: { message: 'Network request failed' },
      status: 0,
    });
    mockChallengeIds = ['promise-2'];
    rerender({});
    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.accessDenied).toBe(true);
    expect(result.current.data).toBeNull();
    mockBoardRead.mockResolvedValue({ data: [], error: null, status: 200 });
    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() => expect(result.current.accessDenied).toBe(false));
  });

  it('blocks a pre-denial response from another board variant', async () => {
    const otherVariantKey = [
      'groupAccountabilityBoard',
      'viewer-1',
      groupId,
      'en-NZ',
      ['promise-2'],
      [],
      null,
    ];
    client.setQueryData(otherVariantKey, snapshot);
    mockChallengeIds = ['promise-2'];
    const { result, rerender } = renderHook(board, { wrapper });
    let finish!: (value: unknown) => void;
    mockBoardRead.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finish = resolve;
        })
    );
    let pending!: ReturnType<typeof result.current.refetch>;
    await act(async () => {
      pending = result.current.refetch();
    });
    mockChallengeIds = [promiseId];
    rerender({});
    mockBoardRead.mockResolvedValue({
      data: null,
      error: { message: 'Permission denied' },
      status: 403,
    });
    await act(async () => {
      await result.current.refetch();
    });
    await act(async () => {
      finish({ data: [], error: null, status: 200 });
      await pending;
    });
    expect(client.getQueryData(otherVariantKey)).toBeNull();
  });

  const mixedPromiseConsumers = () => ({
    group: usePromiseAccountability(promiseId, groupId),
    standalone: usePromiseAccountability(promiseId),
  });

  it('keeps group and standalone promise denials independent after invalidating both variants', async () => {
    const { result } = renderHook(mixedPromiseConsumers, { wrapper });
    mockPromiseRead.mockRejectedValue({
      status: 403,
      message: 'Permission denied',
    });
    await act(async () => {
      await result.current.standalone.refetch();
    });
    await waitFor(() => expect(result.current.group.accessDenied).toBe(true));
    expect(result.current.standalone.accessDenied).toBe(true);
    mockPromiseRead.mockResolvedValue(summary);
    await act(async () => {
      await result.current.standalone.refetch();
    });
    await waitFor(() =>
      expect(result.current.standalone.accessDenied).toBe(false)
    );
    expect(result.current.group.accessDenied).toBe(true);
    expect(result.current.group.data).toBeNull();
    await act(async () => {
      await result.current.group.refetch();
    });
    await waitFor(() => expect(result.current.group.accessDenied).toBe(false));
  });

  it('blocks a standalone promise response started before group rejection', async () => {
    // Cache authority changes immediately; observer notifications are batched.
    notifyManager.setScheduler(callback => setTimeout(callback, 25));
    const { result } = renderHook(mixedPromiseConsumers, { wrapper });
    let finish!: (value: unknown) => void;
    mockPromiseRead.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finish = resolve;
        })
    );
    let pending!: ReturnType<typeof result.current.standalone.refetch>;
    await act(async () => {
      pending = result.current.standalone.refetch();
    });
    mockPromiseRead.mockRejectedValue({
      status: 403,
      message: 'Permission denied',
    });
    await act(async () => {
      await result.current.group.refetch();
    });
    expect(client.getQueryData(standalonePromiseKey)).toBeNull();
    expect(client.getQueryData(promiseKey)).toBeNull();
    await act(async () => {
      finish(summary);
      await pending;
    });
    expect(client.getQueryData(standalonePromiseKey)).toBeNull();
    expect(client.getQueryData(promiseKey)).toBeNull();
    await waitFor(() => {
      expect(result.current.standalone.data).toBeNull();
      expect(result.current.standalone.accessDenied).toBe(true);
      expect(result.current.group.accessDenied).toBe(true);
    });
  });
});
