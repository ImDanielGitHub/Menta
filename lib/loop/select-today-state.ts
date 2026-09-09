import { isAcceptedReceiptFresh } from '@/lib/loop/receipt';
import type {
  DailyLoopInput,
  DailyLoopPrimaryAction,
  DailyLoopSelection,
  DailyLoopState,
  LocalProofOverlayFact,
  ServerGroupRiskFact,
  ServerObligationFact,
  ServerReviewFact,
} from '@/lib/loop/types';

/**
 * Strict precedence for the dominant daily-loop state.
 * Higher index = lower priority. Tests assert this order.
 */
export const DAILY_LOOP_STATE_PRECEDENCE: readonly DailyLoopState[] = [
  'loading',
  'offline-stale',
  'load-failed',
  'correction-requested',
  'proof-saved-local',
  'proof-uploading',
  'returning',
  'streak-broken',
  'proof-due',
  'proof-pending-review',
  'review-required',
  'group-at-risk',
  'accepted-today',
  'no-promises',
  'all-clear',
] as const;

const RISK_LEVELS_NEEDING_ATTENTION = new Set(['at_risk', 'critical']);

const CONTENT_STATE_REASONS = {
  correction: 'server-correction-requested',
  saved: 'local-proof-saved',
  uploading: 'local-proof-uploading',
  unknown: 'local-proof-unknown-result',
  terminal: 'local-proof-terminal-failure',
  returning: 'server-confirmed-returning',
  streakBroken: 'server-confirmed-streak-broken',
  due: 'server-proof-due',
  pending: 'server-proof-pending-review',
  review: 'server-review-required',
  risk: 'server-group-at-risk',
  empty: 'no-active-obligations',
  accepted: 'fresh-accepted-receipt',
  clear: 'all-obligations-clear',
} as const;

const primaryActionForState = (
  state: DailyLoopState
): DailyLoopPrimaryAction => {
  switch (state) {
    case 'loading':
      return 'wait';
    case 'load-failed':
      return 'retry-load';
    case 'offline-stale':
      return 'retry-load';
    case 'no-promises':
      return 'create-promise';
    case 'proof-saved-local':
      return 'resume-local-proof';
    case 'proof-uploading':
      return 'wait-upload';
    case 'proof-due':
      return 'submit-proof';
    case 'proof-pending-review':
      return 'view-pending-proof';
    case 'correction-requested':
      return 'resubmit-proof';
    case 'review-required':
      return 'open-review';
    case 'group-at-risk':
      return 'open-group';
    case 'streak-broken':
      return 'submit-proof';
    case 'returning':
      return 'create-promise';
    case 'accepted-today':
      return 'none';
    case 'all-clear':
      return 'none';
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
};

const countAtRiskGroups = (
  groupRisks: readonly ServerGroupRiskFact[]
): number =>
  groupRisks.filter(group => RISK_LEVELS_NEEDING_ATTENTION.has(group.level))
    .length;

const overlaysForDay = (
  overlays: readonly LocalProofOverlayFact[],
  localDay: string
): LocalProofOverlayFact[] =>
  overlays.filter(overlay => overlay.localDay === localDay);

const firstOverlay = (
  overlays: readonly LocalProofOverlayFact[],
  status: LocalProofOverlayFact['status']
): LocalProofOverlayFact | null =>
  overlays.find(overlay => overlay.status === status) ?? null;

const firstObligation = (
  obligations: readonly ServerObligationFact[],
  status: ServerObligationFact['proofStatus']
): ServerObligationFact | null =>
  obligations.find(item => item.proofStatus === status) ?? null;

const firstMissedOutcome = (
  obligations: readonly ServerObligationFact[]
): ServerObligationFact | null =>
  obligations.find(
    item =>
      item.streakOutcome === 'missed' &&
      item.proofStatus === 'none' &&
      (item.streakCount ?? item.resultingStreak ?? 0) === 0
  ) ?? null;

const firstAtRiskGroup = (
  groupRisks: readonly ServerGroupRiskFact[]
): ServerGroupRiskFact | null =>
  groupRisks.find(group => RISK_LEVELS_NEEDING_ATTENTION.has(group.level)) ??
  null;

type ContentCandidate = {
  state: DailyLoopState;
  reason: string;
  primaryChallengeId: string | null;
  primaryGroupId: string | null;
  primaryReviewId: string | null;
  primaryClientEventId: string | null;
};

const selectContentState = (args: {
  obligations: readonly ServerObligationFact[];
  pendingReviews: readonly ServerReviewFact[];
  groupRisks: readonly ServerGroupRiskFact[];
  dayOverlays: readonly LocalProofOverlayFact[];
  receiptIsFresh: boolean;
  lastAcceptedChallengeId: string | null;
}): ContentCandidate => {
  const {
    obligations,
    pendingReviews,
    groupRisks,
    dayOverlays,
    receiptIsFresh,
    lastAcceptedChallengeId,
  } = args;

  const correction = firstObligation(obligations, 'rejected');
  if (correction) {
    return {
      state: 'correction-requested',
      reason: CONTENT_STATE_REASONS.correction,
      primaryChallengeId: correction.challengeId,
      primaryGroupId: correction.groupId ?? null,
      primaryReviewId: null,
      primaryClientEventId: null,
    };
  }

  const savedLocal = firstOverlay(dayOverlays, 'saved-local');
  if (savedLocal) {
    return {
      state: 'proof-saved-local',
      reason: CONTENT_STATE_REASONS.saved,
      primaryChallengeId: savedLocal.challengeId,
      primaryGroupId: savedLocal.groupId ?? null,
      primaryReviewId: null,
      primaryClientEventId: savedLocal.clientEventId,
    };
  }

  const uploading = firstOverlay(dayOverlays, 'uploading');
  if (uploading) {
    return {
      state: 'proof-uploading',
      reason: CONTENT_STATE_REASONS.uploading,
      primaryChallengeId: uploading.challengeId,
      primaryGroupId: uploading.groupId ?? null,
      primaryReviewId: null,
      primaryClientEventId: uploading.clientEventId,
    };
  }

  // unknown-result / terminal-failure still need user attention as local drafts
  const unknown = firstOverlay(dayOverlays, 'unknown-result');
  if (unknown) {
    return {
      state: 'proof-saved-local',
      reason: CONTENT_STATE_REASONS.unknown,
      primaryChallengeId: unknown.challengeId,
      primaryGroupId: unknown.groupId ?? null,
      primaryReviewId: null,
      primaryClientEventId: unknown.clientEventId,
    };
  }

  const terminal = firstOverlay(dayOverlays, 'terminal-failure');
  if (terminal) {
    return {
      state: 'proof-saved-local',
      reason: CONTENT_STATE_REASONS.terminal,
      primaryChallengeId: terminal.challengeId,
      primaryGroupId: terminal.groupId ?? null,
      primaryReviewId: null,
      primaryClientEventId: terminal.clientEventId,
    };
  }

  const missed = firstMissedOutcome(obligations);
  if (missed) {
    const hasBeenAway =
      typeof missed.daysSinceAcceptedCheckIn === 'number' &&
      missed.daysSinceAcceptedCheckIn >= 3;

    return {
      state: hasBeenAway ? 'returning' : 'streak-broken',
      reason: hasBeenAway
        ? CONTENT_STATE_REASONS.returning
        : CONTENT_STATE_REASONS.streakBroken,
      primaryChallengeId: missed.challengeId,
      primaryGroupId: missed.groupId ?? null,
      primaryReviewId: null,
      primaryClientEventId: null,
    };
  }

  const due = firstObligation(obligations, 'none');
  if (due) {
    return {
      state: 'proof-due',
      reason: CONTENT_STATE_REASONS.due,
      primaryChallengeId: due.challengeId,
      primaryGroupId: due.groupId ?? null,
      primaryReviewId: null,
      primaryClientEventId: null,
    };
  }

  const pendingOwn = firstObligation(obligations, 'pending');
  if (pendingOwn) {
    return {
      state: 'proof-pending-review',
      reason: CONTENT_STATE_REASONS.pending,
      primaryChallengeId: pendingOwn.challengeId,
      primaryGroupId: pendingOwn.groupId ?? null,
      primaryReviewId: null,
      primaryClientEventId: null,
    };
  }

  const review = pendingReviews[0];
  if (review) {
    return {
      state: 'review-required',
      reason: CONTENT_STATE_REASONS.review,
      primaryChallengeId: review.challengeId,
      primaryGroupId: review.groupId ?? null,
      primaryReviewId: review.reviewId,
      primaryClientEventId: null,
    };
  }

  const risk = firstAtRiskGroup(groupRisks);
  if (risk) {
    return {
      state: 'group-at-risk',
      reason: CONTENT_STATE_REASONS.risk,
      primaryChallengeId: null,
      primaryGroupId: risk.groupId,
      primaryReviewId: null,
      primaryClientEventId: null,
    };
  }

  if (receiptIsFresh) {
    return {
      state: 'accepted-today',
      reason: CONTENT_STATE_REASONS.accepted,
      primaryChallengeId: lastAcceptedChallengeId,
      primaryGroupId: null,
      primaryReviewId: null,
      primaryClientEventId: null,
    };
  }

  if (obligations.length === 0) {
    return {
      state: 'no-promises',
      reason: CONTENT_STATE_REASONS.empty,
      primaryChallengeId: null,
      primaryGroupId: null,
      primaryReviewId: null,
      primaryClientEventId: null,
    };
  }

  return {
    state: 'all-clear',
    reason: CONTENT_STATE_REASONS.clear,
    primaryChallengeId: null,
    primaryGroupId: null,
    primaryReviewId: null,
    primaryClientEventId: null,
  };
};

/**
 * Select the dominant daily-loop state for Today.
 *
 * Guarantees:
 * - fetch failure / missing snapshot never collapses to `all-clear`
 * - local overlays never count as server receipts
 * - precedence is deterministic and exported for contract tests
 */
export const selectDailyLoopState = (
  input: DailyLoopInput
): DailyLoopSelection => {
  const { server, local, nowIso } = input;
  const timezone = server.timezone;
  const localDay = server.localDay;
  const dayOverlays = overlaysForDay(local.overlays, localDay);

  const dueCount = server.obligations.filter(
    item => item.proofStatus === 'none'
  ).length;
  const pendingOwnProofCount = server.obligations.filter(
    item => item.proofStatus === 'pending'
  ).length;
  const correctionCount = server.obligations.filter(
    item => item.proofStatus === 'rejected'
  ).length;
  const pendingReviewCount = server.pendingReviews.length;
  const atRiskGroupCount = countAtRiskGroups(server.groupRisks);

  const receiptIsFresh = isAcceptedReceiptFresh({
    receipt: server.lastConfirmedReceipt,
    localDay,
    timezone,
    nowIso,
    freshMs: input.acceptedReceiptFreshMs,
  });

  const baseCounts = {
    timezone,
    localDay,
    nowIso,
    hasServerSnapshot: server.hasServerSnapshot,
    dueCount,
    pendingOwnProofCount,
    correctionCount,
    pendingReviewCount,
    atRiskGroupCount,
    lastConfirmedReceipt: server.lastConfirmedReceipt,
    receiptIsFresh,
    protectedOutcome:
      server.obligations.find(item => item.streakOutcome === 'protected') ??
      null,
  };

  const finish = (
    state: DailyLoopState,
    reason: string,
    extras: {
      isStale: boolean;
      primaryChallengeId: string | null;
      primaryGroupId: string | null;
      primaryReviewId: string | null;
      primaryClientEventId: string | null;
    }
  ): DailyLoopSelection => ({
    state,
    ...baseCounts,
    isStale: extras.isStale,
    primaryAction: primaryActionForState(state),
    primaryChallengeId: extras.primaryChallengeId,
    primaryGroupId: extras.primaryGroupId,
    primaryReviewId: extras.primaryReviewId,
    primaryClientEventId: extras.primaryClientEventId,
    reason,
  });

  // Gate states — never invent an all-clear from a missing snapshot.
  if (server.fetchStatus === 'loading' && !server.hasServerSnapshot) {
    return finish('loading', 'initial-load-in-progress', {
      isStale: false,
      primaryChallengeId: null,
      primaryGroupId: null,
      primaryReviewId: null,
      primaryClientEventId: null,
    });
  }

  // Idle without a snapshot is still loading from Today's POV.
  if (server.fetchStatus === 'idle' && !server.hasServerSnapshot) {
    return finish('loading', 'awaiting-first-fetch', {
      isStale: false,
      primaryChallengeId: null,
      primaryGroupId: null,
      primaryReviewId: null,
      primaryClientEventId: null,
    });
  }

  // Offline without a snapshot beats a bare network error (Paper HOME-03).
  if (!local.isOnline && !server.hasServerSnapshot) {
    return finish('offline-stale', 'offline-without-snapshot', {
      isStale: true,
      primaryChallengeId: null,
      primaryGroupId: null,
      primaryReviewId: null,
      primaryClientEventId: null,
    });
  }

  if (server.fetchStatus === 'failed' && !server.hasServerSnapshot) {
    return finish('load-failed', 'fetch-failed-without-snapshot', {
      isStale: false,
      primaryChallengeId: null,
      primaryGroupId: null,
      primaryReviewId: null,
      primaryClientEventId: null,
    });
  }

  const content = selectContentState({
    obligations: server.obligations,
    pendingReviews: server.pendingReviews,
    groupRisks: server.groupRisks,
    dayOverlays,
    receiptIsFresh,
    lastAcceptedChallengeId:
      server.lastConfirmedReceipt?.kind === 'accepted'
        ? server.lastConfirmedReceipt.challengeId
        : null,
  });

  // Pull-to-refresh keeps the last confirmed Today content in place. The
  // native RefreshControl is the only progress treatment until replacement
  // facts arrive; a refresh in progress does not make confirmed facts stale.
  const snapshotIsStale = !local.isOnline || server.fetchStatus === 'failed';

  // Failed/offline refresh must not claim all-clear / no-promises.
  if (
    snapshotIsStale &&
    (content.state === 'all-clear' || content.state === 'no-promises')
  ) {
    if (!local.isOnline) {
      return finish('offline-stale', 'stale-snapshot-offline-no-action', {
        isStale: true,
        primaryChallengeId: content.primaryChallengeId,
        primaryGroupId: content.primaryGroupId,
        primaryReviewId: content.primaryReviewId,
        primaryClientEventId: content.primaryClientEventId,
      });
    }

    if (server.fetchStatus === 'failed') {
      return finish('load-failed', 'stale-snapshot-fetch-failed-no-action', {
        isStale: true,
        primaryChallengeId: content.primaryChallengeId,
        primaryGroupId: content.primaryGroupId,
        primaryReviewId: content.primaryReviewId,
        primaryClientEventId: content.primaryClientEventId,
      });
    }

    return finish('load-failed', 'stale-snapshot-fetch-failed-no-action', {
      isStale: true,
      primaryChallengeId: content.primaryChallengeId,
      primaryGroupId: content.primaryGroupId,
      primaryReviewId: content.primaryReviewId,
      primaryClientEventId: content.primaryClientEventId,
    });
  }

  return finish(content.state, content.reason, {
    isStale: snapshotIsStale,
    primaryChallengeId: content.primaryChallengeId,
    primaryGroupId: content.primaryGroupId,
    primaryReviewId: content.primaryReviewId,
    primaryClientEventId: content.primaryClientEventId,
  });
};

/** Compare precedence rank; lower number wins. */
export const dailyLoopStateRank = (state: DailyLoopState): number => {
  const rank = DAILY_LOOP_STATE_PRECEDENCE.indexOf(state);
  if (rank < 0) {
    throw new Error(`Unknown daily loop state: ${state}`);
  }
  return rank;
};
