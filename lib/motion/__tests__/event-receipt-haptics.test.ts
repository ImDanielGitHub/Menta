import {
  emitEventCheckInReceiptHaptic,
  emitEventOrganiserReviewReceiptHaptic,
  emitEventProofReceiptHaptic,
} from '@/lib/motion/event-receipt-haptics';
import {
  createConfirmedReceipt,
  emitConfirmedOutcome,
  emitConfirmedSuccess,
  emitHaptic,
} from '@/lib/motion/haptics';
import type {
  EventCheckInConfirmed,
  EventOwnPost,
  EventPostFinalised,
  EventPostReviewResult,
  EventReceipt,
} from '@/types/event';

jest.mock('@/lib/motion/haptics', () => ({
  createConfirmedReceipt: jest.fn((source: string, receiptId: string) => ({
    confirmed: true,
    receiptId,
    source,
  })),
  emitConfirmedOutcome: jest.fn(() => Promise.resolve(true)),
  emitConfirmedSuccess: jest.fn(() => Promise.resolve(true)),
  emitHaptic: jest.fn(() => Promise.resolve(false)),
}));

const makePost = (status: EventOwnPost['status']): EventOwnPost => ({
  postId: 'post-1',
  occurrenceId: 'occurrence-1',
  status,
  revision: 1,
  caption: null,
  mediaPath: null,
  contentType: 'image/jpeg',
  byteSize: 128,
  createdAt: '2026-09-01T00:00:00.000Z',
  reviewedAt:
    status === 'approved' || status === 'rejected'
      ? '2026-09-01T00:01:00.000Z'
      : null,
  reviewNote: status === 'rejected' ? 'Show the full activity.' : null,
});

const makeReceipt = <TData>({
  action,
  code,
  data,
  outcome,
  clientEventId = 'client-event-1',
}: {
  action: EventReceipt<TData>['action'];
  code: string;
  data: TData | null;
  outcome: EventReceipt<TData>['outcome'];
  clientEventId?: string | null;
}): EventReceipt<TData> => ({
  action,
  outcome,
  code,
  message: code,
  clientEventId,
  data,
  retryable: outcome !== 'completed',
  idempotent: true,
});

describe('event receipt semantic haptics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the server check-in id only after a completed check-in receipt', async () => {
    const data: EventCheckInConfirmed = {
      attendance: {
        attendanceId: 'attendance-1',
        occurrenceId: 'occurrence-1',
        state: 'joined',
        consentVersion: 'v1',
        joinedAt: '2026-09-01T00:00:00.000Z',
        checkedInAt: '2026-09-01T00:01:00.000Z',
        checkInMethod: 'rotating_qr',
      },
      checkInId: 'check-in-1',
      checkedInAt: '2026-09-01T00:01:00.000Z',
      method: 'rotating_qr',
    };

    await emitEventCheckInReceiptHaptic(
      makeReceipt({
        action: 'check_in',
        code: 'CHECK_IN_CONFIRMED',
        data,
        outcome: 'completed',
      })
    );

    expect(createConfirmedReceipt).toHaveBeenCalledWith(
      'event-check-in',
      'check-in-1'
    );
    expect(emitConfirmedOutcome).toHaveBeenCalledWith(
      'event-check-in',
      expect.objectContaining({ receiptId: 'check-in-1' })
    );
  });

  it('keeps unknown check-in results silent and distinguishes permission from definitive failure', async () => {
    await emitEventCheckInReceiptHaptic(
      makeReceipt<EventCheckInConfirmed>({
        action: 'check_in',
        code: 'FUNCTION_TRANSPORT_FAILED',
        data: null,
        outcome: 'unknown_result',
      })
    );
    await emitEventCheckInReceiptHaptic(
      makeReceipt<EventCheckInConfirmed>({
        action: 'check_in',
        code: 'AUTHENTICATION_REQUIRED',
        data: null,
        outcome: 'failed',
      })
    );
    await emitEventCheckInReceiptHaptic(
      makeReceipt<EventCheckInConfirmed>({
        action: 'check_in',
        code: 'CHECK_IN_REJECTED',
        data: null,
        outcome: 'failed',
      })
    );

    expect(emitHaptic).toHaveBeenNthCalledWith(1, { type: 'unknown' });
    expect(emitHaptic).toHaveBeenNthCalledWith(2, {
      type: 'blocked',
      reason: 'permission',
    });
    expect(emitHaptic).toHaveBeenNthCalledWith(3, {
      type: 'failed',
      operation: 'submit',
    });
    expect(emitConfirmedOutcome).not.toHaveBeenCalled();
  });

  it('distinguishes a submitted event proof, an approval, and a correction request', async () => {
    for (const status of ['pending_review', 'approved', 'rejected'] as const) {
      const data: EventPostFinalised = { post: makePost(status) };
      await emitEventProofReceiptHaptic(
        makeReceipt({
          action: 'finalise_post',
          code: 'POST_FINALISED',
          data,
          outcome: 'completed',
          clientEventId: `proof-${status}`,
        })
      );
    }

    expect(emitConfirmedSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'event-proof',
        receiptId: 'post-1:pending_review:1',
      })
    );
    expect(emitConfirmedOutcome).toHaveBeenCalledWith(
      'event-proof-approved',
      expect.objectContaining({
        source: 'event-proof',
        receiptId: 'post-1:approved:2026-09-01T00:01:00.000Z',
      })
    );
    expect(emitHaptic).toHaveBeenCalledWith({ type: 'warning' });
  });

  it('does not claim a completed event proof without authoritative post data', async () => {
    await emitEventProofReceiptHaptic(
      makeReceipt<EventPostFinalised>({
        action: 'finalise_post',
        code: 'MALFORMED_RECEIPT',
        data: null,
        outcome: 'completed',
      })
    );

    expect(emitHaptic).toHaveBeenCalledWith({ type: 'unknown' });
    expect(emitConfirmedSuccess).not.toHaveBeenCalled();
    expect(emitConfirmedOutcome).not.toHaveBeenCalled();
  });

  it('uses the returned organiser-review status and server-echoed operation id', async () => {
    const approved: EventPostReviewResult = { post: makePost('approved') };
    const rejected: EventPostReviewResult = { post: makePost('rejected') };

    await emitEventOrganiserReviewReceiptHaptic(
      makeReceipt({
        action: 'review_post',
        code: 'POST_APPROVED',
        data: approved,
        outcome: 'completed',
        clientEventId: 'review-approved-1',
      })
    );
    await emitEventOrganiserReviewReceiptHaptic(
      makeReceipt({
        action: 'review_post',
        code: 'POST_REJECTED',
        data: rejected,
        outcome: 'completed',
        clientEventId: 'review-rejected-1',
      })
    );

    expect(emitConfirmedOutcome).toHaveBeenNthCalledWith(
      1,
      'event-proof-approved',
      expect.objectContaining({ receiptId: 'review-approved-1' })
    );
    expect(emitConfirmedOutcome).toHaveBeenNthCalledWith(
      2,
      'correction-requested',
      expect.objectContaining({ receiptId: 'review-rejected-1' })
    );
  });

  it('keeps unknown organiser results silent and marks definitive review failures', async () => {
    await emitEventOrganiserReviewReceiptHaptic(
      makeReceipt<EventPostReviewResult>({
        action: 'review_post',
        code: 'FUNCTION_TRANSPORT_FAILED',
        data: null,
        outcome: 'unknown_result',
      })
    );
    await emitEventOrganiserReviewReceiptHaptic(
      makeReceipt<EventPostReviewResult>({
        action: 'review_post',
        code: 'STALE_REVIEW',
        data: null,
        outcome: 'failed',
      })
    );

    expect(emitHaptic).toHaveBeenNthCalledWith(1, { type: 'unknown' });
    expect(emitHaptic).toHaveBeenNthCalledWith(2, {
      type: 'failed',
      operation: 'review',
    });
    expect(emitConfirmedOutcome).not.toHaveBeenCalled();
  });
});
