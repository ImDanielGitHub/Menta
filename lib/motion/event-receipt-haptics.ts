import {
  createConfirmedReceipt,
  emitConfirmedOutcome,
  emitConfirmedSuccess,
  emitHaptic,
} from '@/lib/motion/haptics';
import type {
  EventCheckInConfirmed,
  EventPostFinalised,
  EventPostReviewResult,
  EventReceipt,
} from '@/types/event';

const emitUnknown = () => emitHaptic({ type: 'unknown' });

const emitFailed = (operation: 'submit' | 'review') =>
  emitHaptic({ type: 'failed', operation });

/**
 * Emits only for the receipt returned by an explicit check-in attempt. A
 * hydrated `checkedInAt` value is deliberately outside this boundary.
 */
export function emitEventCheckInReceiptHaptic(
  receipt: EventReceipt<EventCheckInConfirmed>
): Promise<boolean> {
  if (receipt.outcome === 'unknown_result') return emitUnknown();
  if (receipt.outcome === 'failed') {
    return receipt.code === 'AUTHENTICATION_REQUIRED'
      ? emitHaptic({ type: 'blocked', reason: 'permission' })
      : emitFailed('submit');
  }

  const checkInId = receipt.data?.checkInId?.trim();
  if (!checkInId) return emitUnknown();

  return emitConfirmedOutcome(
    'event-check-in',
    createConfirmedReceipt('event-check-in', checkInId)
  );
}

/**
 * Maps the authoritative result of an explicit event-proof send/status check.
 * Passive draft or occurrence hydration must not call this helper.
 */
export function emitEventProofReceiptHaptic(
  receipt: EventReceipt<EventPostFinalised>
): Promise<boolean> {
  if (receipt.outcome === 'unknown_result') return emitUnknown();
  if (receipt.outcome === 'failed') {
    return receipt.code === 'AUTHENTICATION_REQUIRED'
      ? emitHaptic({ type: 'blocked', reason: 'permission' })
      : emitFailed('submit');
  }

  const post = receipt.data?.post;
  const postId = post?.postId?.trim();
  if (!post || !postId) return emitUnknown();

  if (post.status === 'approved') {
    const approvedReceiptId = `${postId}:${post.status}:${post.reviewedAt ?? post.revision}`;
    return emitConfirmedOutcome(
      'event-proof-approved',
      createConfirmedReceipt('event-proof', approvedReceiptId)
    );
  }
  if (post.status === 'rejected') {
    return emitHaptic({ type: 'warning' });
  }
  if (post.status === 'pending_review') {
    return emitConfirmedSuccess(
      createConfirmedReceipt(
        'event-proof',
        `${postId}:${post.status}:${post.revision}`
      )
    );
  }

  return emitUnknown();
}

/**
 * Uses the server-echoed idempotency key from a completed organiser decision.
 * A requested decision alone never owns the cue; the returned post status does.
 */
export function emitEventOrganiserReviewReceiptHaptic(
  receipt: EventReceipt<EventPostReviewResult>
): Promise<boolean> {
  if (receipt.outcome === 'unknown_result') return emitUnknown();
  if (receipt.outcome === 'failed') {
    return receipt.code === 'AUTHENTICATION_REQUIRED'
      ? emitHaptic({ type: 'blocked', reason: 'permission' })
      : emitFailed('review');
  }

  const receiptId = receipt.clientEventId?.trim();
  const status = receipt.data?.post.status;
  if (!receiptId || (status !== 'approved' && status !== 'rejected')) {
    return emitUnknown();
  }

  return emitConfirmedOutcome(
    status === 'approved' ? 'event-proof-approved' : 'correction-requested',
    createConfirmedReceipt('review-decision', receiptId)
  );
}
