/**
 * Shared daily-loop domain contract for Today and Proof Lifecycle.
 *
 * Paper: 03 Today + 05 Proof Lifecycle
 * (file 01KYSFHARFSPAWEKMPKXSV4R3Y)
 *
 * This module is pure. Store/route wiring belongs to a later wave.
 */

/** Dominant Today / daily-loop states from the Paper parity plan. */
export type DailyLoopState =
  | 'loading'
  | 'offline-stale'
  | 'load-failed'
  | 'streak-broken'
  | 'returning'
  | 'no-promises'
  | 'proof-due'
  | 'proof-saved-local'
  | 'proof-uploading'
  | 'proof-pending-review'
  | 'correction-requested'
  | 'review-required'
  | 'group-at-risk'
  | 'accepted-today'
  | 'all-clear';

/**
 * Durable proof lifecycle states. Local drafts never promote to
 * `sent` / `pending-review` / `accepted` without a server receipt.
 */
export type ProofLifecycleState =
  | 'idle'
  | 'saved-local'
  | 'uploading'
  | 'sent'
  | 'pending-review'
  | 'accepted'
  | 'correction-requested'
  | 'unknown-result'
  | 'terminal-failure';

/** Authoritative per-obligation proof status for the local day. */
export type ObligationProofStatus =
  | 'none'
  | 'pending'
  | 'approved'
  | 'rejected';

export type GroupRiskLevel =
  | 'safe'
  | 'at_risk'
  | 'critical'
  | 'failed'
  | 'expired';

/**
 * Fetch lifecycle for the atomic daily-loop snapshot.
 * Empty arrays are only trustworthy after `ready`.
 */
export type DailyLoopFetchStatus = 'idle' | 'loading' | 'ready' | 'failed';

export type ConfirmedReceiptKind =
  | 'accepted'
  | 'pending-review'
  | 'correction-requested'
  | 'sent';

/** Timezone + calendar day fields shared by Today and proof receipts. */
export type LoopDayContext = {
  timezone: string;
  localDay: string;
  nowIso: string;
};

/** Last server-confirmed receipt for the loop. */
export type ConfirmedReceipt = {
  kind: ConfirmedReceiptKind;
  challengeId: string;
  localDay: string;
  confirmedAtIso: string;
  verificationId?: string | null;
  groupId?: string | null;
};

/** One active promise/challenge obligation for the current local day. */
export type ServerObligationFact = {
  /** Stable server obligation identity, or group/challenge legacy fallback. */
  obligationKey: string;
  challengeId: string;
  title: string;
  verificationType?: 'photo' | 'video' | 'text';
  localDay: string;
  timezone: string;
  proofStatus: ObligationProofStatus;
  isSolo: boolean;
  groupId?: string | null;
  dueAtIso?: string | null;
  verificationId?: string | null;
  correctionReason?: string | null;
  streakCount?: number | null;
  longestStreak?: number | null;
  atRisk?: boolean;
  /** Null means the server supplied no resolved consequence. */
  streakOutcome?: 'missed' | 'protected' | null;
  outcomeLocalDay?: string | null;
  previousStreak?: number | null;
  resultingStreak?: number | null;
  freezeUsed?: boolean;
  freezesRemaining?: number | null;
  daysSinceAcceptedCheckIn?: number | null;
};

/** Peer review the signed-in user still owes. */
export type ServerReviewFact = {
  reviewId: string;
  challengeId: string;
  challengeTitle: string;
  groupId?: string | null;
  groupName?: string | null;
  submitterName: string;
  submittedAtIso: string;
};

/** Group pressure fact for Today risk surfaces. */
export type ServerGroupRiskFact = {
  groupId: string;
  groupName: string;
  level: GroupRiskLevel;
  /** Server-owned group totals. Absent for legacy snapshots only. */
  totalMembers?: number;
  submittedToday?: number;
  pendingSubmissions?: number;
  pendingReviews?: number;
  endOfDayIso?: string;
  secondsRemaining?: number;
  missesToBreakStreak?: number;
};

/**
 * Atomic server snapshot. Failure without a prior ready snapshot must
 * never be interpreted as an empty / all-clear day.
 */
export type DailyLoopServerFacts = {
  fetchStatus: DailyLoopFetchStatus;
  /** True only after at least one successful ready snapshot. */
  hasServerSnapshot: boolean;
  fetchedAtIso: string | null;
  timezone: string;
  localDay: string;
  obligations: readonly ServerObligationFact[];
  pendingReviews: readonly ServerReviewFact[];
  groupRisks: readonly ServerGroupRiskFact[];
  lastConfirmedReceipt: ConfirmedReceipt | null;
};

export type LocalProofOverlayStatus =
  | 'saved-local'
  | 'uploading'
  | 'unknown-result'
  | 'terminal-failure';

/**
 * Client-only overlay. Must never be treated as a server receipt.
 * `clientEventId` is the stable idempotency key across retries.
 */
export type LocalProofOverlayFact = {
  clientEventId: string;
  challengeId: string;
  status: LocalProofOverlayStatus;
  localDay: string;
  updatedAtIso: string;
  localMediaUri?: string | null;
  groupId?: string | null;
};

export type DailyLoopLocalOverlay = {
  isOnline: boolean;
  overlays: readonly LocalProofOverlayFact[];
};

export type DailyLoopInput = {
  server: DailyLoopServerFacts;
  local: DailyLoopLocalOverlay;
  /** Injected clock for deterministic tests and selectors. */
  nowIso: string;
  /**
   * How long an accepted receipt stays dominant as `accepted-today`
   * within the same local day. Defaults in the selector.
   */
  acceptedReceiptFreshMs?: number;
};

export type DailyLoopPrimaryAction =
  | 'wait'
  | 'retry-load'
  | 'create-promise'
  | 'resume-local-proof'
  | 'wait-upload'
  | 'submit-proof'
  | 'view-pending-proof'
  | 'resubmit-proof'
  | 'open-review'
  | 'open-group'
  | 'none';

/** Selector output suited for later Today integration. */
export type DailyLoopSelection = {
  state: DailyLoopState;
  timezone: string;
  localDay: string;
  nowIso: string;
  hasServerSnapshot: boolean;
  /** True when acting on a prior ready snapshot while offline or after failed refresh. */
  isStale: boolean;
  primaryAction: DailyLoopPrimaryAction;
  primaryChallengeId: string | null;
  primaryGroupId: string | null;
  primaryReviewId: string | null;
  primaryClientEventId: string | null;
  dueCount: number;
  pendingOwnProofCount: number;
  correctionCount: number;
  pendingReviewCount: number;
  atRiskGroupCount: number;
  lastConfirmedReceipt: ConfirmedReceipt | null;
  receiptIsFresh: boolean;
  /** Latest server-confirmed protected day; never inferred from absence. */
  protectedOutcome: ServerObligationFact | null;
  /** Stable machine reason for tests and diagnostics. */
  reason: string;
};

export type ProofLifecycleInput = {
  challengeId: string;
  localDay: string;
  serverProofStatus: ObligationProofStatus | null;
  /** Null when no local draft/upload exists for this challenge+day. */
  localOverlay: LocalProofOverlayFact | null;
  /**
   * True only after the submit RPC resolved successfully for this
   * clientEventId. Distinct from server pending/approved status.
   */
  submitAcknowledged: boolean;
};

export type ProofLifecycleSelection = {
  state: ProofLifecycleState;
  challengeId: string;
  localDay: string;
  clientEventId: string | null;
  isServerConfirmed: boolean;
  isLocalOnly: boolean;
  reason: string;
};
