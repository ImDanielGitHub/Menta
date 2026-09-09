import {
  decodePromiseMutationEnvelope,
  readReceiptBoundPromiseMutationStatus,
  submitReceiptBoundPromiseMutation,
} from '@/lib/promises/mutation-result';

const mockRpc = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { rpc: (...args: unknown[]) => mockRpc(...args) },
}));

const request = {
  operation: 'leave' as const,
  challengeId: '11234567-89ab-4def-8123-456789abcdef',
  clientEventId: '21234567-89ab-4def-8123-456789abcdef',
};

const confirmedEnvelope = {
  operation: 'PROMISE_ACCOUNTABILITY_LEAVE',
  outcome: 'confirmed',
  code: 'LEAVE_CONFIRMED',
  message: 'You left this promise.',
  challenge_id: request.challengeId,
  client_event_id: request.clientEventId,
  receipt: {
    receipt_id: request.clientEventId,
    challenge_id: request.challengeId,
    client_event_id: request.clientEventId,
  },
};

describe('promise mutation result contract', () => {
  beforeEach(() => mockRpc.mockReset());

  it('decodes a matching authoritative receipt as confirmed', () => {
    expect(
      decodePromiseMutationEnvelope(
        confirmedEnvelope,
        request,
        'mutation-response'
      )
    ).toMatchObject({
      outcome: 'confirmed',
      message: 'You left this promise.',
      receipt: {
        id: request.clientEventId,
        verifiedBy: 'mutation-response',
      },
    });
  });

  it('decodes a returned domain rejection as failed', () => {
    expect(
      decodePromiseMutationEnvelope(
        {
          operation: 'PROMISE_ACCOUNTABILITY_LEAVE',
          outcome: 'failed',
          code: 'OWNER_CANNOT_LEAVE',
          message: 'The owner cannot leave.',
          client_event_id: request.clientEventId,
          safe_to_retry: false,
        },
        request,
        'mutation-response'
      )
    ).toMatchObject({
      outcome: 'failed',
      code: 'OWNER_CANNOT_LEAVE',
      message: 'The promise was not changed. Please try again.',
      safeToRetry: false,
    });
  });

  it('never exposes backend result copy to the customer', () => {
    const localise = jest.fn((key: string) => `translated:${key}`);

    expect(
      decodePromiseMutationEnvelope(
        {
          ...confirmedEnvelope,
          message: 'Provider-only English that must not be displayed.',
        },
        request,
        'mutation-response',
        localise
      )
    ).toMatchObject({
      outcome: 'confirmed',
      message: 'translated:todayProof.promise.left_detail',
    });
  });

  it('treats transport response loss as unknown', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Connection closed after commit' },
    });

    await expect(
      submitReceiptBoundPromiseMutation(request)
    ).resolves.toMatchObject({
      contract: 'available',
      result: { outcome: 'unknown', recovery: 'status-check' },
    });
  });

  it('reconciles with the same event ID through a status-only call', async () => {
    mockRpc.mockResolvedValue({
      data: { ...confirmedEnvelope, idempotent: true },
      error: null,
    });

    await expect(
      readReceiptBoundPromiseMutationStatus(request)
    ).resolves.toMatchObject({
      contract: 'available',
      result: {
        outcome: 'confirmed',
        receipt: { idempotent: true, verifiedBy: 'status-check' },
      },
    });
    expect(mockRpc).toHaveBeenCalledWith('leave_promise_accountability_v2', {
      p_challenge_id: request.challengeId,
      p_client_event_id: request.clientEventId,
      p_check_only: true,
    });
  });

  it('does not accept a receipt for a different event ID', () => {
    expect(
      decodePromiseMutationEnvelope(
        {
          ...confirmedEnvelope,
          receipt: {
            ...confirmedEnvelope.receipt,
            client_event_id: '31234567-89ab-4def-8123-456789abcdef',
          },
        },
        request,
        'mutation-response'
      )
    ).toMatchObject({ outcome: 'unknown', code: 'RECEIPT_MISMATCH' });
  });
});
