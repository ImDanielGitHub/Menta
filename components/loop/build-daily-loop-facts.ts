import {
  buildLoopDayContext,
  type ConfirmedReceipt,
  type DailyLoopServerFacts,
  type GroupRiskLevel,
  type ObligationProofStatus,
  type ServerGroupRiskFact,
  type ServerObligationFact,
  type ServerReviewFact,
} from '@/lib/loop';

export type TodaySubmissionLike = {
  obligationKey?: string;
  challengeId: string;
  challengeTitle: string;
  verificationType?: 'photo' | 'video' | 'text';
  groupId?: string;
  isSolo: boolean;
  localDay?: string;
  effectiveTimezone?: string;
  timeRemaining?: string;
};

export type TodayReviewLike = {
  id: string;
  challengeId: string;
  challengeTitle: string;
  groupId?: string;
  groupName?: string;
  submitterName: string;
  submissionDate: string;
};

export type TodayGroupRiskLike = {
  groupId: string;
  groupName: string;
  level: GroupRiskLevel;
  totalMembers?: number;
  submittedToday?: number;
  pendingSubmissions?: number;
  pendingReviews?: number;
  endOfDayIso?: string;
  secondsRemaining?: number;
  missesToBreakStreak?: number;
};

export type ObligationStatusRow = {
  obligationKey?: string;
  challengeId: string;
  groupId?: string | null;
  localDay?: string;
  effectiveTimezone?: string;
  proofStatus: ObligationProofStatus;
  verificationId?: string | null;
  correctionReason?: string | null;
  streakCount?: number | null;
  longestStreak?: number | null;
  atRisk?: boolean;
  streakOutcome?: 'missed' | 'protected' | null;
  outcomeLocalDay?: string | null;
  previousStreak?: number | null;
  resultingStreak?: number | null;
  freezeUsed?: boolean;
  freezesRemaining?: number | null;
  daysSinceAcceptedCheckIn?: number | null;
  extensionProofDueAtIso?: string | null;
  /**
   * Server-authored event time for this status. Snapshot fetch time is not a
   * receipt and must never be supplied here.
   */
  receiptConfirmedAtIso?: string | null;
};

const validIsoTimestamp = (value: string | null | undefined): string | null => {
  const candidate = value?.trim();
  return candidate && Number.isFinite(Date.parse(candidate)) ? candidate : null;
};

const PROOF_STATUSES: ReadonlySet<string> = new Set([
  'none',
  'pending',
  'approved',
  'rejected',
]);

const RISK_LEVELS: ReadonlySet<string> = new Set([
  'safe',
  'at_risk',
  'critical',
  'failed',
  'expired',
]);

export const normalizeObligationProofStatus = (
  value: unknown
): ObligationProofStatus => {
  if (typeof value === 'string' && PROOF_STATUSES.has(value)) {
    return value as ObligationProofStatus;
  }
  if (value === 'not_submitted') return 'none';
  return 'none';
};

export const normalizeGroupRiskLevel = (value: unknown): GroupRiskLevel => {
  if (typeof value === 'string' && RISK_LEVELS.has(value)) {
    return value as GroupRiskLevel;
  }
  return 'safe';
};

type ObligationIdentityLike = {
  obligationKey?: string | null;
  challengeId: string;
  groupId?: string | null;
};

/** Stable server identity, with the legacy group/challenge identity fallback. */
export const resolveObligationKey = (
  obligation: ObligationIdentityLike
): string =>
  obligation.obligationKey?.trim() ||
  `${obligation.groupId ?? 'solo'}:${obligation.challengeId}`;

const buildStatusLookup = (statuses: readonly ObligationStatusRow[]) => {
  const byObligationKey = new Map<string, ObligationStatusRow>();
  const legacyByChallenge = new Map<string, ObligationStatusRow>();

  for (const status of statuses) {
    if (status.obligationKey?.trim() || status.groupId) {
      byObligationKey.set(resolveObligationKey(status), status);
    } else {
      // Older callers supplied only challengeId. Retain that compatibility
      // path without letting it override an available obligation identity.
      legacyByChallenge.set(status.challengeId, status);
    }
  }

  return { byObligationKey, legacyByChallenge };
};

export const buildServerObligations = (args: {
  submissions: readonly TodaySubmissionLike[];
  statuses: readonly ObligationStatusRow[];
  localDay: string;
  timezone: string;
}): ServerObligationFact[] => {
  const statusLookup = buildStatusLookup(args.statuses);

  return args.submissions.map(submission => {
    const obligationKey = resolveObligationKey(submission);
    const statusRow =
      statusLookup.byObligationKey.get(obligationKey) ??
      statusLookup.legacyByChallenge.get(submission.challengeId);
    return {
      obligationKey,
      challengeId: submission.challengeId,
      title: submission.challengeTitle,
      verificationType: submission.verificationType,
      localDay: statusRow?.localDay ?? submission.localDay ?? args.localDay,
      timezone:
        statusRow?.effectiveTimezone ??
        submission.effectiveTimezone ??
        args.timezone,
      proofStatus: statusRow?.proofStatus ?? 'none',
      isSolo: submission.isSolo,
      groupId: submission.groupId ?? null,
      dueAtIso: validIsoTimestamp(statusRow?.extensionProofDueAtIso),
      verificationId: statusRow?.verificationId ?? null,
      correctionReason: statusRow?.correctionReason ?? null,
      streakCount: statusRow?.streakCount ?? null,
      longestStreak: statusRow?.longestStreak ?? null,
      atRisk: statusRow?.atRisk,
      streakOutcome: statusRow?.streakOutcome ?? null,
      outcomeLocalDay: statusRow?.outcomeLocalDay ?? null,
      previousStreak: statusRow?.previousStreak ?? null,
      resultingStreak: statusRow?.resultingStreak ?? null,
      freezeUsed: statusRow?.freezeUsed,
      freezesRemaining: statusRow?.freezesRemaining ?? null,
      daysSinceAcceptedCheckIn: statusRow?.daysSinceAcceptedCheckIn ?? null,
    };
  });
};

export const buildServerReviews = (
  reviews: readonly TodayReviewLike[]
): ServerReviewFact[] =>
  reviews.map(review => ({
    reviewId: review.id,
    challengeId: review.challengeId,
    challengeTitle: review.challengeTitle,
    groupId: review.groupId ?? null,
    groupName: review.groupName ?? null,
    submitterName: review.submitterName,
    submittedAtIso: review.submissionDate,
  }));

export const buildServerGroupRisks = (
  risks: readonly TodayGroupRiskLike[]
): ServerGroupRiskFact[] =>
  risks.map(risk => ({
    groupId: risk.groupId,
    groupName: risk.groupName,
    level: risk.level,
    totalMembers: risk.totalMembers,
    submittedToday: risk.submittedToday,
    pendingSubmissions: risk.pendingSubmissions,
    pendingReviews: risk.pendingReviews,
    endOfDayIso: risk.endOfDayIso,
    secondsRemaining: risk.secondsRemaining,
    missesToBreakStreak: risk.missesToBreakStreak,
  }));

/**
 * Derive the freshest confirmed receipt from server obligations.
 * Local drafts never contribute here.
 */
export const deriveLastConfirmedReceipt = (args: {
  obligations: readonly ServerObligationFact[];
  statuses: readonly ObligationStatusRow[];
}): ConfirmedReceipt | null => {
  const statusLookup = buildStatusLookup(args.statuses);

  const receipts = args.obligations.flatMap(obligation => {
    const status =
      statusLookup.byObligationKey.get(obligation.obligationKey) ??
      statusLookup.legacyByChallenge.get(obligation.challengeId);
    const confirmedAtIso = status?.receiptConfirmedAtIso?.trim();
    if (
      !status ||
      !confirmedAtIso ||
      status.proofStatus !== obligation.proofStatus ||
      Number.isNaN(Date.parse(confirmedAtIso))
    ) {
      return [];
    }

    const kind =
      obligation.proofStatus === 'approved'
        ? 'accepted'
        : obligation.proofStatus === 'pending'
          ? 'pending-review'
          : obligation.proofStatus === 'rejected'
            ? 'correction-requested'
            : null;
    if (!kind) return [];

    return [
      {
        kind,
        challengeId: obligation.challengeId,
        localDay: obligation.localDay,
        confirmedAtIso,
        verificationId: obligation.verificationId ?? null,
        groupId: obligation.groupId ?? null,
      } satisfies ConfirmedReceipt,
    ];
  });

  receipts.sort(
    (a, b) => Date.parse(b.confirmedAtIso) - Date.parse(a.confirmedAtIso)
  );
  return receipts[0] ?? null;
};

export const buildReadyServerFacts = (args: {
  nowIso: string;
  timezone: string;
  submissions: readonly TodaySubmissionLike[];
  statuses: readonly ObligationStatusRow[];
  reviews: readonly TodayReviewLike[];
  groupRisks: readonly TodayGroupRiskLike[];
  acceptedReceipt?: ConfirmedReceipt | null;
}): DailyLoopServerFacts => {
  const day = buildLoopDayContext(args.nowIso, args.timezone);
  const obligations = buildServerObligations({
    submissions: args.submissions,
    statuses: args.statuses,
    localDay: day.localDay,
    timezone: day.timezone,
  });
  const pendingReviews = buildServerReviews(args.reviews);
  const groupRisks = buildServerGroupRisks(args.groupRisks);
  const lastConfirmedReceipt =
    args.acceptedReceipt ??
    deriveLastConfirmedReceipt({
      obligations,
      statuses: args.statuses,
    });

  return {
    fetchStatus: 'ready',
    hasServerSnapshot: true,
    fetchedAtIso: args.nowIso,
    timezone: day.timezone,
    localDay: day.localDay,
    obligations,
    pendingReviews,
    groupRisks,
    lastConfirmedReceipt,
  };
};

/** Initial idle facts before the first fetch. Never all-clear. */
export const buildInitialServerFacts = (args: {
  nowIso: string;
  timezone: string;
}): DailyLoopServerFacts => {
  const day = buildLoopDayContext(args.nowIso, args.timezone);
  return {
    fetchStatus: 'idle',
    hasServerSnapshot: false,
    fetchedAtIso: null,
    timezone: day.timezone,
    localDay: day.localDay,
    obligations: [],
    pendingReviews: [],
    groupRisks: [],
    lastConfirmedReceipt: null,
  };
};

/**
 * Preserve a prior ready snapshot while marking refresh lifecycle.
 * The selector keeps this confirmed content visible while refresh is in flight.
 */
export const markServerFactsRefreshing = (
  previous: DailyLoopServerFacts
): DailyLoopServerFacts => ({
  ...previous,
  fetchStatus: 'loading',
});

export const markServerFactsFailed = (
  previous: DailyLoopServerFacts
): DailyLoopServerFacts => ({
  ...previous,
  fetchStatus: 'failed',
});
