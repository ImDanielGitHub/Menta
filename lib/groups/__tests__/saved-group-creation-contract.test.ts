import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClientEventId } from '@/lib/client-event-id';
import { supabase } from '@/lib/supabase';
import {
  clearSavedGroupCreationAttempt,
  getSavedGroupCreationAttemptKey,
  loadSavedGroupCreationAttempt,
  normaliseSavedGroupCreationRequest,
  prepareSavedGroupCreationAttempt,
  readSavedGroupCreationStatus,
  submitSavedGroupCreation,
} from '../saved-group-creation-contract';

jest.mock('@/lib/supabase', () => ({
  supabase: { rpc: jest.fn() },
}));

jest.mock('@/lib/client-event-id', () => ({
  createClientEventId: jest.fn(),
}));

const mockedRpc = jest.mocked(supabase.rpc);
const mockedCreateClientEventId = jest.mocked(createClientEventId);

const accountA = '10000000-0000-4000-8000-000000000001';
const accountB = '10000000-0000-4000-8000-000000000002';
const clientEventA = '10000000-0000-4000-8000-000000000003';
const clientEventB = '10000000-0000-4000-8000-000000000004';
const receiptId = '10000000-0000-4000-8000-000000000005';
const groupId = '10000000-0000-4000-8000-000000000006';

const request = normaliseSavedGroupCreationRequest({
  name: '  Morning   Miles  ',
  description: ' Walk before work ',
  durationDays: 14,
  privacy: 'private',
  imagePreset: 'move',
  notifyOnMemberMiss: true,
});

const confirmedEnvelope = (clientEventId = clientEventA) => ({
  success: true,
  operation: 'SAVED_GROUP_CREATE',
  status: 'confirmed',
  code: 'GROUP_CREATED',
  receipt: {
    receipt_id: receiptId,
    client_event_id: clientEventId,
    canonical_client_event_id: clientEventA,
    group_id: groupId,
    group_name: 'Morning Miles',
    description: 'Walk before work',
    privacy: 'private',
    duration_days: 14,
    image_url: 'menta-preset:move',
    notify_on_member_miss: true,
    debit_amount: 50,
    new_balance: 50,
    created_at: '2026-08-31T08:00:00.000Z',
    idempotent: false,
  },
});

describe('saved group creation client contract', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockedCreateClientEventId
      .mockReturnValueOnce(clientEventA)
      .mockReturnValue(clientEventB);
  });

  it('persists one event ID for the same logical request', async () => {
    const first = await prepareSavedGroupCreationAttempt(accountA, request);
    const second = await prepareSavedGroupCreationAttempt(accountA, request);

    expect(first).toMatchObject({
      kind: 'ready',
      reused: false,
      attempt: { accountId: accountA, clientEventId: clientEventA, request },
    });
    expect(second).toMatchObject({
      kind: 'ready',
      reused: true,
      attempt: { clientEventId: clientEventA },
    });
    expect(mockedCreateClientEventId).toHaveBeenCalledTimes(1);
    await expect(
      loadSavedGroupCreationAttempt(accountA)
    ).resolves.toMatchObject({ clientEventId: clientEventA });
  });

  it('blocks a different draft until the pending request is reconciled', async () => {
    await prepareSavedGroupCreationAttempt(accountA, request);
    const changed = await prepareSavedGroupCreationAttempt(accountA, {
      ...request,
      name: 'Evening Miles',
    });

    expect(changed).toMatchObject({
      kind: 'blocked',
      attempt: { clientEventId: clientEventA, request },
    });
    expect(mockedCreateClientEventId).toHaveBeenCalledTimes(1);
  });

  it('isolates pending requests by account and clears only the matching event', async () => {
    const first = await prepareSavedGroupCreationAttempt(accountA, request);
    const second = await prepareSavedGroupCreationAttempt(accountB, request);
    expect(first.kind).toBe('ready');
    expect(second).toMatchObject({
      kind: 'ready',
      attempt: { accountId: accountB, clientEventId: clientEventB },
    });

    await clearSavedGroupCreationAttempt(accountA, clientEventB);
    await expect(
      loadSavedGroupCreationAttempt(accountA)
    ).resolves.toMatchObject({ clientEventId: clientEventA });
    await clearSavedGroupCreationAttempt(accountA, clientEventA);
    await expect(loadSavedGroupCreationAttempt(accountA)).resolves.toBeNull();
    await expect(
      loadSavedGroupCreationAttempt(accountB)
    ).resolves.toMatchObject({ clientEventId: clientEventB });
    expect(getSavedGroupCreationAttemptKey(accountA)).not.toBe(
      getSavedGroupCreationAttemptKey(accountB)
    );
  });

  it('submits v3 once without a client-owned cost', async () => {
    const prepared = await prepareSavedGroupCreationAttempt(accountA, request);
    if (prepared.kind !== 'ready') throw new Error('expected ready attempt');
    mockedRpc.mockResolvedValueOnce({
      data: confirmedEnvelope(),
      error: null,
    } as never);

    await expect(
      submitSavedGroupCreation(prepared.attempt)
    ).resolves.toMatchObject({
      kind: 'confirmed',
      receipt: { groupId, clientEventId: clientEventA, debitAmount: 50 },
    });
    expect(mockedRpc).toHaveBeenCalledTimes(1);
    expect(mockedRpc).toHaveBeenCalledWith(
      'create_accountability_group_v3',
      expect.objectContaining({
        p_client_event_id: clientEventA,
        p_name: 'Morning Miles',
        p_notify_on_member_miss: true,
      })
    );
    expect(mockedRpc.mock.calls[0]?.[1]).not.toHaveProperty('p_cost');
  });

  it('treats transport loss as unknown without repeating the mutation', async () => {
    const prepared = await prepareSavedGroupCreationAttempt(accountA, request);
    if (prepared.kind !== 'ready') throw new Error('expected ready attempt');
    mockedRpc.mockRejectedValueOnce(new Error('connection closed'));

    await expect(submitSavedGroupCreation(prepared.attempt)).resolves.toEqual({
      kind: 'unknown',
      message: 'connection closed',
    });
    expect(mockedRpc).toHaveBeenCalledTimes(1);
    await expect(
      loadSavedGroupCreationAttempt(accountA)
    ).resolves.toMatchObject({ clientEventId: clientEventA });
  });

  it('reconciles a timeout-after-commit through status only', async () => {
    const prepared = await prepareSavedGroupCreationAttempt(accountA, request);
    if (prepared.kind !== 'ready') throw new Error('expected ready attempt');
    mockedRpc.mockResolvedValueOnce({
      data: {
        ...confirmedEnvelope(),
        operation: 'SAVED_GROUP_CREATE_STATUS',
        code: 'RECEIPT_FOUND',
        receipt: {
          ...confirmedEnvelope().receipt,
          idempotent: true,
        },
      },
      error: null,
    } as never);

    await expect(
      readSavedGroupCreationStatus(prepared.attempt)
    ).resolves.toMatchObject({
      kind: 'confirmed',
      receipt: { groupId, idempotent: true },
    });
    expect(mockedRpc).toHaveBeenCalledTimes(1);
    expect(mockedRpc).toHaveBeenCalledWith(
      'read_saved_group_creation_status_v1',
      { p_client_event_id: clientEventA }
    );
  });

  it('accepts a server no-receipt readback as the only safe retry gate', async () => {
    const prepared = await prepareSavedGroupCreationAttempt(accountA, request);
    if (prepared.kind !== 'ready') throw new Error('expected ready attempt');
    mockedRpc.mockResolvedValueOnce({
      data: {
        success: true,
        operation: 'SAVED_GROUP_CREATE_STATUS',
        status: 'not_found',
        code: 'NO_RECEIPT',
        snapshot: {
          client_event_id: clientEventA,
          safe_to_retry: true,
          available_balance: 100,
        },
      },
      error: null,
    } as never);

    await expect(
      readSavedGroupCreationStatus(prepared.attempt)
    ).resolves.toEqual({
      kind: 'not-found',
      snapshot: {
        clientEventId: clientEventA,
        safeToRetry: true,
        availableBalance: 100,
      },
    });
    expect(mockedRpc).toHaveBeenCalledTimes(1);
  });
});
