import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useActivityInbox } from '@/hooks/use-activity-inbox';
import {
  loadActivityInbox,
  markActivityRead,
  type ActivityItem,
} from '@/lib/notifications/activity-inbox';

let mockUserId: string | undefined = 'account-a';
const mockOn = jest.fn().mockReturnThis();
const mockSubscribe = jest.fn().mockReturnThis();
const mockRemove = jest.fn();
jest.mock('@/store/auth-store', () => ({
  useAuthStore: (select: (state: unknown) => unknown) =>
    select({
      isAuthenticated: Boolean(mockUserId),
      user: mockUserId ? { id: mockUserId } : null,
    }),
}));
jest.mock('@/lib/supabase', () => ({
  supabase: {
    channel: () => ({ on: mockOn, subscribe: mockSubscribe }),
    removeChannel: (...args: unknown[]) => mockRemove(...args),
  },
}));
jest.mock('@/lib/app-state-manager', () => ({
  appStateManager: { addListener: () => jest.fn() },
}));
jest.mock('@/lib/notifications/activity-inbox', () => ({
  loadActivityInbox: jest.fn(),
  markActivityRead: jest.fn(),
}));
const load = jest.mocked(loadActivityInbox);
const mark = jest.mocked(markActivityRead);
const item = (userId: string): ActivityItem => ({
  id: 42,
  user_id: userId,
  title: 'Proof approved',
  body: 'Your result is ready',
  is_read: false,
  created_at: '2026-10-01T00:00:00Z',
  payload: { action: 'open_today' },
});

describe('activity inbox account and read boundaries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = 'account-a';
    load.mockResolvedValue([item('account-a')]);
    mark.mockResolvedValue(undefined);
  });
  it('hides old-account items immediately and ignores a late previous-account fetch', async () => {
    let resolveA!: (items: ActivityItem[]) => void;
    load.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveA = resolve;
        })
    );
    const hook = renderHook(() => useActivityInbox());
    mockUserId = 'account-b';
    load.mockResolvedValue([item('account-b')]);
    hook.rerender({});
    expect(hook.result.current.items).toEqual([]);
    await waitFor(() =>
      expect(hook.result.current.items[0]?.user_id).toBe('account-b')
    );
    await act(async () => resolveA([item('account-a')]));
    expect(hook.result.current.items[0]?.user_id).toBe('account-b');
  });
  it('keeps a failed read unread and allows retry', async () => {
    const hook = renderHook(() => useActivityInbox());
    await waitFor(() => expect(hook.result.current.items).toHaveLength(1));
    mark.mockRejectedValueOnce(new Error('write failed'));
    await act(async () => {
      await expect(hook.result.current.markRead(42)).rejects.toThrow(
        'write failed'
      );
    });
    expect(hook.result.current.items[0].is_read).toBe(false);
    await act(async () => {
      expect(await hook.result.current.markRead(42)).toBe(true);
    });
    expect(hook.result.current.items[0].is_read).toBe(true);
  });
  it('does not navigate or mark the new account when an old read completes late', async () => {
    let resolveRead!: () => void;
    mark.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveRead = resolve;
        })
    );
    const hook = renderHook(() => useActivityInbox());
    await waitFor(() => expect(hook.result.current.items).toHaveLength(1));
    const pending = hook.result.current.markRead(42);
    mockUserId = 'account-b';
    load.mockResolvedValue([item('account-b')]);
    hook.rerender({});
    await waitFor(() =>
      expect(hook.result.current.items[0]?.user_id).toBe('account-b')
    );
    await act(async () => {
      resolveRead();
      expect(await pending).toBe(false);
    });
    expect(hook.result.current.items[0].is_read).toBe(false);
  });
  it('cannot restore unread state from a fetch started before a confirmed read', async () => {
    const hook = renderHook(() => useActivityInbox());
    await waitFor(() => expect(hook.result.current.items).toHaveLength(1));
    let resolveRefresh!: (items: ActivityItem[]) => void;
    load.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveRefresh = resolve;
        })
    );
    const staleRefresh = hook.result.current.refresh();
    await act(async () => {
      await hook.result.current.markRead(42);
    });
    await act(async () => {
      resolveRefresh([item('account-a')]);
      await staleRefresh;
    });
    expect(hook.result.current.items[0].is_read).toBe(true);
  });

  it('refreshes on delivery updates without duplicating receipt ids', async () => {
    const hook = renderHook(() => useActivityInbox());
    await waitFor(() => expect(hook.result.current.items).toHaveLength(1));
    const refresh = mockOn.mock.calls[0][2] as () => void;
    await act(async () => {
      refresh();
      refresh();
    });
    expect(hook.result.current.items).toHaveLength(1);
  });
});
