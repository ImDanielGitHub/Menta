import type {
  MentaCheckOutcome,
  MentaCheckOverview,
  MentaCheckReason,
  MentaCheckTip,
  MentaHistoryItem,
  MentaPromiseSetting,
  MentaReviewSource,
  MentaTodayItem,
  MentaTodayState,
  PromiseReviewMode,
} from '@/lib/menta-check/types';

type Row = Record<string, unknown>;

const isRow = (value: unknown): value is Row =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const str = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value : null;

const num = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const oneOf = <T extends string>(
  value: unknown,
  allowed: readonly T[]
): T | null =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;

const OUTCOMES = [
  'counted',
  'counted_tip',
  'not_yet',
  'backup_counted',
  'unavailable',
  'access_ended',
  'hint_only',
  'left_for_people',
] as const satisfies readonly MentaCheckOutcome[];
const REASONS = [
  'cant_see_rule',
  'shows_something_else',
  'too_unclear',
  'old_photo',
  'screenshot',
  'duplicate',
] as const satisfies readonly MentaCheckReason[];
const TIPS = [
  'show_display',
  'get_closer',
  'more_light',
  'show_whole_activity',
  'add_detail',
  'video_counted',
] as const satisfies readonly MentaCheckTip[];
const SOURCES = [
  'human',
  'self',
  'menta',
  'menta_backup',
  'menta_unavailable',
  'self_override',
] as const satisfies readonly MentaReviewSource[];
const MODES = [
  'self',
  'people',
  'menta',
] as const satisfies readonly PromiseReviewMode[];
const KINDS = ['photo', 'video', 'text'] as const;
const STATUSES = ['pending', 'approved', 'rejected'] as const;

/** A proof that has waited this long reads as "still looking", not "checking". */
export const MENTA_SLOW_AFTER_MS = 60_000;

/**
 * One state per promise, derived only from what the server stored. The copy
 * for each state is fixed, so the app never shows model-written text.
 */
export function deriveMentaTodayState(
  item: Pick<
    MentaTodayItem,
    'status' | 'reviewSource' | 'outcome' | 'reviewMode' | 'submittedAt'
  >,
  now: number = Date.now()
): MentaTodayState {
  if (!item.status) return 'due';
  if (item.status === 'pending') {
    if (item.reviewMode !== 'menta') return 'with_people';
    const sent = item.submittedAt ? Date.parse(item.submittedAt) : NaN;
    return Number.isFinite(sent) && now - sent > MENTA_SLOW_AFTER_MS
      ? 'slow'
      : 'checking';
  }
  if (item.status === 'rejected') {
    return item.reviewSource === 'menta' ? 'not_yet' : 'due';
  }
  switch (item.reviewSource) {
    case 'self_override':
      return 'counted_by_you';
    case 'menta_backup':
      return 'backup_counted';
    case 'menta_unavailable':
      return 'unavailable';
    case 'self':
      return item.outcome === 'access_ended' ? 'access_ended' : 'due';
    case 'menta':
      return item.outcome === 'counted_tip' ? 'counted_tip' : 'counted';
    default:
      return 'due';
  }
}

export function decodeMentaToday(
  value: unknown,
  now: number = Date.now()
): MentaTodayItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRow).flatMap(row => {
    const challengeId = str(row.challenge_id);
    if (!challengeId) return [];
    const base = {
      challengeId,
      title: str(row.title) ?? '',
      rule: str(row.rule) ?? str(row.title) ?? '',
      reviewMode: oneOf(row.review_mode, MODES),
      backupHours:
        typeof row.backup_hours === 'number' ? row.backup_hours : null,
      proofKind: oneOf(row.proof_kind, KINDS) ?? 'photo',
      localDay: str(row.local_day) ?? '',
      submissionId: str(row.submission_id),
      status: oneOf(row.status, STATUSES),
      mediaType: oneOf(row.media_type, KINDS),
      mediaUrl: str(row.media_url),
      submittedAt: str(row.submitted_at),
      reviewSource: oneOf(row.review_source, SOURCES),
      outcome: oneOf(row.outcome, OUTCOMES),
      reason: oneOf(row.reason, REASONS),
      tip: oneOf(row.tip, TIPS),
      flagged: row.flagged === true,
      notYetsToday: num(row.not_yets_today),
      overridesLeft: num(row.overrides_left),
      graceUntil: str(row.grace_until),
    };
    return [{ ...base, state: deriveMentaTodayState(base, now) }];
  });
}

const decodePromise = (row: Row): MentaPromiseSetting | null => {
  const challengeId = str(row.challenge_id);
  if (!challengeId) return null;
  return {
    challengeId,
    title: str(row.title) ?? '',
    reviewMode: oneOf(row.review_mode, MODES) ?? 'self',
    backupHours: typeof row.backup_hours === 'number' ? row.backup_hours : null,
    isSolo: row.is_solo === true,
    isCreator: row.is_creator === true,
    passActiveUntil: str(row.pass_active_until),
    passAutoRenew:
      typeof row.pass_auto_renew === 'boolean' ? row.pass_auto_renew : null,
  };
};

const decodeHistory = (row: Row): MentaHistoryItem | null => {
  const submissionId = str(row.submission_id);
  const status = oneOf(row.status, STATUSES);
  if (!submissionId || !status) return null;
  return {
    submissionId,
    challengeId: str(row.challenge_id) ?? '',
    title: str(row.title) ?? '',
    localDay: str(row.local_day) ?? '',
    submittedAt: str(row.submitted_at) ?? '',
    mediaType: oneOf(row.media_type, KINDS),
    mediaUrl: str(row.media_url),
    status,
    reviewSource: oneOf(row.review_source, SOURCES),
    outcome: oneOf(row.outcome, OUTCOMES),
    reason: oneOf(row.reason, REASONS),
    tip: oneOf(row.tip, TIPS),
    flagged: row.flagged === true,
    wasSecondPhoto: row.was_second_photo === true,
  };
};

/** Decode the authenticated v2 readback RPC, never a legacy receipt. */
export function decodeMentaMediaPermission(
  value: unknown
): 'allowed' | 'needs-review' | 'unavailable' {
  if (!isRow(value) || value.success !== true) return 'unavailable';
  if (
    value.consented === false &&
    value.policy_version === null &&
    value.acknowledgement_id === null &&
    value.acknowledged_at === null
  )
    return 'needs-review';
  if (
    value.consented !== true ||
    value.policy_version !== 2 ||
    typeof value.acknowledgement_id !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value.acknowledgement_id
    ) ||
    typeof value.acknowledged_at !== 'string' ||
    !Number.isFinite(Date.parse(value.acknowledged_at))
  )
    return 'unavailable';
  return 'allowed';
}

export function decodeMentaOverview(value: unknown): MentaCheckOverview | null {
  if (!isRow(value) || value.success !== true) return null;
  const stats = isRow(value.stats) ? value.stats : {};
  return {
    consented: value.consented === true,
    consentedAt: str(value.consented_at),
    isPro: value.is_pro === true,
    passCost: num(value.pass_cost, 20),
    overrideCost: num(value.override_cost, 15),
    overridesLeft: num(value.overrides_left),
    stats: {
      checks: num(stats.checks),
      notYets: num(stats.not_yets),
      overrides: num(stats.overrides),
    },
    promises: Array.isArray(value.promises)
      ? value.promises.filter(isRow).flatMap(row => {
          const item = decodePromise(row);
          return item ? [item] : [];
        })
      : [],
    history: Array.isArray(value.history)
      ? value.history.filter(isRow).flatMap(row => {
          const item = decodeHistory(row);
          return item ? [item] : [];
        })
      : [],
  };
}
