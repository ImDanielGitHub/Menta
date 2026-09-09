import {
  attachPromiseToSavedGroup,
  decodePromiseSavedGroupLinkResult,
} from '@/lib/promises/saved-group-link';

const mockRpc = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

const request = {
  challengeId: '11234567-89ab-4def-8123-456789abcdef',
  groupId: '21234567-89ab-4def-8123-456789abcdef',
  clientEventId: '31234567-89ab-4def-8123-456789abcdef',
};

const confirmedEnvelope = {
  success: true,
  operation: 'PROMISE_SAVED_GROUP_LINK',
  status: 'confirmed',
  code: 'PROMISE_LINKED',
  receipt: {
    receipt_id: '41234567-89ab-4def-8123-456789abcdef',
    client_event_id: request.clientEventId,
    challenge_id: request.challengeId,
    challenge_title: 'Read the Bible daily',
    group_id: request.groupId,
    group_name: 'Sunday crew',
    linked_at: '2026-09-01T05:22:13.000Z',
    promise_container_preserved: true,
    confirmed_members_can_view: true,
    review_authority: 'confirmed_saved_group_members',
    idempotent: false,
  },
};

describe('personal promise to saved-group link', () => {
  beforeEach(() => mockRpc.mockReset());

  it('requires a matching authoritative receipt before confirming the link', () => {
    expect(
      decodePromiseSavedGroupLinkResult(confirmedEnvelope, request)
    ).toMatchObject({
      outcome: 'confirmed',
      code: 'PROMISE_LINKED',
      receipt: {
        challengeId: request.challengeId,
        groupId: request.groupId,
        clientEventId: request.clientEventId,
        groupName: 'Sunday crew',
        reviewAuthority: 'confirmed_saved_group_members',
      },
    });
  });

  it('keeps a mismatched receipt unknown', () => {
    expect(
      decodePromiseSavedGroupLinkResult(
        {
          ...confirmedEnvelope,
          receipt: {
            ...confirmedEnvelope.receipt,
            group_id: '51234567-89ab-4def-8123-456789abcdef',
          },
        },
        request
      )
    ).toEqual({
      outcome: 'unknown',
      code: 'RECEIPT_MISMATCH',
      request,
      retryWithSameClientEvent: true,
    });
  });

  it('keeps a known server rejection definitive and non-retryable', () => {
    expect(
      decodePromiseSavedGroupLinkResult(
        {
          success: false,
          operation: 'PROMISE_SAVED_GROUP_LINK',
          code: 'GROUP_NOT_AVAILABLE',
        },
        request
      )
    ).toEqual({
      outcome: 'failed',
      code: 'GROUP_NOT_AVAILABLE',
      safeToRetry: false,
    });
  });

  it('reuses the exact client event when retrying an unknown transport result', async () => {
    mockRpc
      .mockResolvedValueOnce({ data: null, error: { code: 'NETWORK' } })
      .mockResolvedValueOnce({
        data: {
          ...confirmedEnvelope,
          code: 'PROMISE_ALREADY_LINKED_TO_GROUP',
          receipt: { ...confirmedEnvelope.receipt, idempotent: true },
        },
        error: null,
      });

    const first = await attachPromiseToSavedGroup(request);
    expect(first).toMatchObject({ outcome: 'unknown', request });

    const second = await attachPromiseToSavedGroup(request);
    expect(second).toMatchObject({
      outcome: 'confirmed',
      code: 'PROMISE_ALREADY_LINKED_TO_GROUP',
      receipt: { idempotent: true },
    });
    expect(mockRpc).toHaveBeenNthCalledWith(
      1,
      'attach_personal_promise_to_saved_group_v1',
      {
        p_challenge_id: request.challengeId,
        p_group_id: request.groupId,
        p_client_event_id: request.clientEventId,
      }
    );
    expect(mockRpc.mock.calls[1]).toEqual(mockRpc.mock.calls[0]);
  });
});
