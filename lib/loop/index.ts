/**
 * Shared daily-loop domain contract.
 *
 * Integration assumptions (Wave 2 Today worker):
 * - Build `DailyLoopServerFacts` from challenge/group store reads:
 *   `getTodaysSubmissionStatus` / `getComprehensiveSubmissionStatus`,
 *   `getTodaysSubmissions`, `getPendingReviewsForUser`, `getGroupRiskData`.
 * - Never map a boolean `hasSubmittedToday` alone; use granular
 *   none|pending|approved|rejected so pending/rejected never read as done.
 * - Feed local proof queue/draft overlays into `DailyLoopLocalOverlay`.
 * - Call `selectDailyLoopState` for Today; call `selectProofLifecycleState`
 *   for verification/camera receipts.
 * - Do not treat empty arrays as trustworthy until `hasServerSnapshot`
 *   and `fetchStatus === 'ready'`.
 */

export {
  addCivilDays,
  buildLoopDayContext,
  formatLocalDay,
  isSameLocalDay,
} from '@/lib/loop/day-context';
export {
  DEFAULT_ACCEPTED_RECEIPT_FRESH_MS,
  isAcceptedReceiptFresh,
} from '@/lib/loop/receipt';
export { decodeGroupRiskSnapshot } from '@/lib/loop/group-risk';
export {
  isMissingAccountabilityRpcError,
  isMissingTodayHomeRpcError,
  normalizeStreakOutcome,
  parseStreakOutcomeFact,
  readStreakOutcomeHistory,
  readTodayAccountability,
} from '@/lib/loop/accountability';
export type {
  StreakOutcome,
  StreakOutcomeFact,
  StreakOutcomeHistoryFact,
  TodayAccountabilityRead,
  TodayAccountabilitySource,
} from '@/lib/loop/accountability';
export type {
  AuthoritativeGroupRiskLevel,
  GroupRiskSnapshot,
} from '@/lib/loop/group-risk';
export {
  mustPreserveLocalProofMedia,
  proofLifecycleFactLabel,
  selectProofLifecycleState,
} from '@/lib/loop/proof-lifecycle';
export {
  DAILY_LOOP_STATE_PRECEDENCE,
  dailyLoopStateRank,
  selectDailyLoopState,
} from '@/lib/loop/select-today-state';
export type {
  ConfirmedReceipt,
  ConfirmedReceiptKind,
  DailyLoopFetchStatus,
  DailyLoopInput,
  DailyLoopLocalOverlay,
  DailyLoopPrimaryAction,
  DailyLoopSelection,
  DailyLoopServerFacts,
  DailyLoopState,
  GroupRiskLevel,
  LocalProofOverlayFact,
  LocalProofOverlayStatus,
  LoopDayContext,
  ObligationProofStatus,
  ProofLifecycleInput,
  ProofLifecycleSelection,
  ProofLifecycleState,
  ServerGroupRiskFact,
  ServerObligationFact,
  ServerReviewFact,
} from '@/lib/loop/types';
