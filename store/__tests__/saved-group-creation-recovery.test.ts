import { act } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import {
  clearSavedGroupCreationAttempt,
  loadSavedGroupCreationAttempt,
  prepareSavedGroupCreationAttempt,
  readSavedGroupCreationStatus,
  submitSavedGroupCreation,
  type SavedGroupCreationAttempt,
  type SavedGroupCreationFailureCode,
  type SavedGroupCreationReceipt,
} from '@/lib/groups/saved-group-creation-contract';
import { useAuthStore } from '@/store/auth-store';
import {
  SavedGroupCreationFailureError,
  SavedGroupCreationUnknownError,
  useGroupStore,
} from '@/store/group-store';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    functions: { invoke: jest.fn() },
    auth: { getSession: jest.fn() },
  },
}));

jest.mock('@/lib/groups/saved-group-creation-contract', () => {
  const actual = jest.requireActual(
    '@/lib/groups/saved-group-creation-contract'
  );
  return {
    ...actual,
    clearSavedGroupCreationAttempt: jest.fn(),
    loadSavedGroupCreationAttempt: jest.fn(),
    prepareSavedGroupCreationAttempt: jest.fn(),
    readSavedGroupCreationStatus: jest.fn(),
    submitSavedGroupCreation: jest.fn(),
  };
});

jest.mock('@/lib/error-monitoring', () => ({
  logCreationError: jest.fn(),
  logCreationSuccess: jest.fn(),
}));

jest.mock('@/lib/services/notification-service', () => ({
  notificationService: {},
}));

jest.mock('@/lib/operational-flags', () => ({
  isOperationalFeatureEnabled: jest.fn().mockResolvedValue(false),
}));

const mockedSupabase = supabase as jest.Mocked<typeof supabase>;
const mockedPrepare = jest.mocked(prepareSavedGroupCreationAttempt);
const mockedSubmit = jest.mocked(submitSavedGroupCreation);
const mockedLoad = jest.mocked(loadSavedGroupCreationAttempt);
const mockedRead = jest.mocked(readSavedGroupCreationStatus);
const mockedClear = jest.mocked(clearSavedGroupCreationAttempt);

const accountId = '10000000-0000-4000-8000-000000000001';
const otherAccountId = '10000000-0000-4000-8000-000000000002';
const clientEventId = '10000000-0000-4000-8000-000000000003';
const receiptId = '10000000-0000-4000-8000-000000000004';
const groupId = '10000000-0000-4000-8000-000000000005';

const attempt: SavedGroupCreationAttempt = {
  version: 1,
  accountId,
  clientEventId,
  requestFingerprint: JSON.stringify({ test: true }),
  request: {
    name: 'Morning Miles',
    description: 'Walk before work',
    durationDays: 14,
    privacy: 'private',
    imagePreset: 'move',
    notifyOnMemberMiss: true,
  },
  createdAt: '2026-08-31T08:00:00.000Z',
};

const receipt: SavedGroupCreationReceipt = {
  source: 'server',
  receiptId,
  clientEventId,
  canonicalClientEventId: clientEventId,
  groupId,
  groupName: 'Morning Miles',
  description: 'Walk before work',
  privacy: 'private',
  durationDays: 14,
  imageUrl: 'menta-preset:move',
  notifyOnMemberMiss: true,
  debitAmount: 50,
  newBalance: 50,
  createdAt: '2026-08-31T08:00:00.000Z',
  idempotent: false,
};

const groupInput = {
  name: 'Morning Miles',
  description: 'Walk before work',
  owner_id: accountId,
  duration_days: 14,
  cost: 50,
  privacy: 'private' as const,
  notify_on_member_miss: true,
  image_preset: 'move' as const,
};

type SupabaseResult = { data: unknown; error: unknown; count?: number | null };

const createQuery = (result: SupabaseResult) => {
  const query: Record<string, jest.Mock | unknown> = {};
  for (const method of [
    'select',
    'insert',
    'update',
    'eq',
    'in',
    'order',
    'limit',
  ]) {
    query[method] = jest.fn(() => query);
  }
  query.single = jest.fn(() => Promise.resolve(result));
  query.then = jest.fn((resolve, reject) =>
    Promise.resolve(result).then(resolve, reject)
  );
  return query as never;
};

const queueGroupRead = () => {
  const queries = [
    createQuery({
      data: {
        id: groupId,
        name: 'Morning Miles',
        description: 'Walk before work',
        owner_id: accountId,
        status: 'active',
        kind: 'saved',
        duration_days: 14,
        current_streak: 0,
        created_at: '2026-08-31T08:00:00.000Z',
        privacy: 'private',
        image_url: 'menta-preset:move',
      },
      error: null,
    }),
    createQuery({ data: null, error: null, count: 1 }),
  ];
  (mockedSupabase.from as jest.Mock).mockImplementation(() => queries.shift());
};

describe('saved group creation recovery store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useGroupStore.setState({
      groups: [],
      userGroups: [],
      discoverGroups: [],
      groupMembers: {},
      isLoading: false,
    });
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: accountId } as never,
      session: { user: { id: accountId } } as never,
    });
    (mockedSupabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: accountId } } },
      error: null,
    });
    mockedPrepare.mockResolvedValue({
      kind: 'ready',
      attempt,
      reused: false,
    });
    mockedLoad.mockResolvedValue(attempt);
    mockedClear.mockResolvedValue(undefined);
  });

  it('keeps an unknown event and reconciles by status without a second mutation', async () => {
    mockedSubmit.mockResolvedValue({
      kind: 'unknown',
      message: 'Connection ended before the receipt was read.',
    });
    mockedRead.mockResolvedValue({
      kind: 'pending',
      message: 'This group is still being confirmed.',
    });

    await expect(
      useGroupStore.getState().createGroupWithPayment(groupInput)
    ).rejects.toBeInstanceOf(SavedGroupCreationUnknownError);
    expect(mockedSubmit).toHaveBeenCalledTimes(1);
    expect(mockedClear).not.toHaveBeenCalled();

    await expect(
      useGroupStore.getState().reconcilePendingGroupCreation(accountId)
    ).resolves.toEqual({
      kind: 'pending',
      message: 'This group is still being confirmed.',
    });
    expect(mockedRead).toHaveBeenCalledTimes(1);
    expect(mockedSubmit).toHaveBeenCalledTimes(1);
  });

  it('recovers a timeout-after-commit receipt without calling the mutation', async () => {
    mockedRead.mockResolvedValue({
      kind: 'confirmed',
      receipt: { ...receipt, idempotent: true },
    });
    queueGroupRead();

    const recovery = await useGroupStore
      .getState()
      .reconcilePendingGroupCreation(accountId);

    expect(recovery).toMatchObject({
      kind: 'confirmed',
      group: { id: groupId, kind: 'saved' },
      receipt: { idempotent: true },
    });
    expect(mockedSubmit).not.toHaveBeenCalled();
    expect(mockedClear).toHaveBeenCalledWith(accountId, clientEventId);
    expect(useGroupStore.getState().userGroups).toContain(groupId);
  });

  it('requires a no-receipt status before resuming the same event', async () => {
    mockedRead.mockResolvedValue({
      kind: 'not-found',
      snapshot: {
        clientEventId,
        safeToRetry: true,
        availableBalance: 100,
      },
    });

    await expect(
      useGroupStore.getState().reconcilePendingGroupCreation(accountId)
    ).resolves.toMatchObject({
      kind: 'safe-to-retry',
      attempt: { clientEventId },
    });
    expect(mockedSubmit).not.toHaveBeenCalled();

    mockedPrepare.mockResolvedValue({
      kind: 'ready',
      attempt,
      reused: true,
    });
    mockedSubmit.mockResolvedValue({ kind: 'confirmed', receipt });
    queueGroupRead();

    await useGroupStore.getState().resumePendingGroupCreation(accountId);
    expect(mockedSubmit).toHaveBeenCalledTimes(1);
    expect(mockedSubmit).toHaveBeenCalledWith(attempt);
  });

  it.each<SavedGroupCreationFailureCode>([
    'INSUFFICIENT_BALANCE',
    'QUOTA_ACTIVE_GROUPS',
    'QUOTA_GROUPS_MONTH',
    'GROUP_CREATION_COOLDOWN',
  ])('clears a definitive %s receipt without retrying', async code => {
    mockedSubmit.mockResolvedValue({
      kind: 'failure',
      failure: {
        operation: 'SAVED_GROUP_CREATE',
        status: 'failed',
        code,
        message: `Definitive ${code}`,
        retryable: false,
        details: {},
      },
    });

    await expect(
      useGroupStore.getState().createGroupWithPayment(groupInput)
    ).rejects.toBeInstanceOf(SavedGroupCreationFailureError);
    expect(mockedSubmit).toHaveBeenCalledTimes(1);
    expect(mockedClear).toHaveBeenCalledWith(accountId, clientEventId);
  });

  it('does not attach a late receipt after the authenticated account changes', async () => {
    mockedSubmit.mockResolvedValue({ kind: 'confirmed', receipt });
    (mockedSupabase.auth.getSession as jest.Mock)
      .mockResolvedValueOnce({
        data: { session: { user: { id: accountId } } },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { session: { user: { id: accountId } } },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { session: { user: { id: otherAccountId } } },
        error: null,
      });

    await act(async () => {
      await expect(
        useGroupStore.getState().createGroupWithPayment(groupInput)
      ).rejects.toThrow(/account changed/i);
    });
    expect(mockedSupabase.from).not.toHaveBeenCalled();
    expect(useGroupStore.getState().groups).toEqual([]);
    expect(mockedClear).not.toHaveBeenCalled();
  });
});
