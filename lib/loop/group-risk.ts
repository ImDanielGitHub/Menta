import type { GroupRiskLevel } from '@/lib/loop/types';

type UnknownRecord = Record<string, unknown>;

export type AuthoritativeGroupRiskLevel = Extract<
  GroupRiskLevel,
  'safe' | 'at_risk'
>;

/**
 * Membership-scoped group facts returned by `get_group_risk_data`.
 *
 * `critical` is intentionally absent until the server owns a documented
 * threshold. Consumers must not infer it from a device clock.
 */
export type GroupRiskSnapshot = {
  groupId: string;
  level: AuthoritativeGroupRiskLevel;
  totalMembers: number;
  submittedToday: number;
  pendingSubmissions: number;
  pendingReviews: number;
  endOfDayIso: string;
  secondsRemaining: number;
  missesToBreakStreak: number;
};

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const firstRecord = (value: unknown): UnknownRecord | null => {
  if (Array.isArray(value)) {
    return value.find(isRecord) ?? null;
  }
  return isRecord(value) ? value : null;
};

const nonEmptyString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

const nonNegativeInteger = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0
    ? value
    : null;

const riskLevel = (value: unknown): AuthoritativeGroupRiskLevel | null =>
  value === 'safe' || value === 'at_risk' ? value : null;

/**
 * Decode the RPC boundary without filling absent or inconsistent facts.
 * A malformed payload stays unknown instead of becoming a false all-clear.
 */
export const decodeGroupRiskSnapshot = (
  value: unknown,
  expectedGroupId?: string
): GroupRiskSnapshot | null => {
  const row = firstRecord(value);
  if (!row) return null;

  const groupId = nonEmptyString(row.group_id);
  const level = riskLevel(row.risk_level);
  const totalMembers = nonNegativeInteger(row.total_members);
  const submittedToday = nonNegativeInteger(row.submitted_today);
  const pendingSubmissions = nonNegativeInteger(row.pending_submissions);
  const pendingReviews = nonNegativeInteger(row.pending_reviews);
  const endOfDayIso = nonEmptyString(row.end_of_day_utc);
  const secondsRemaining = nonNegativeInteger(row.seconds_remaining);
  const missesToBreakStreak = nonNegativeInteger(row.misses_to_break_streak);

  if (
    !groupId ||
    !level ||
    totalMembers === null ||
    submittedToday === null ||
    pendingSubmissions === null ||
    pendingReviews === null ||
    !endOfDayIso ||
    !Number.isFinite(Date.parse(endOfDayIso)) ||
    secondsRemaining === null ||
    missesToBreakStreak === null
  ) {
    return null;
  }

  if (expectedGroupId && groupId !== expectedGroupId) return null;
  if (submittedToday + pendingSubmissions !== totalMembers) return null;
  if (level === 'safe' && pendingSubmissions > 0) return null;
  if (level === 'at_risk' && pendingSubmissions === 0) return null;

  return {
    groupId,
    level,
    totalMembers,
    submittedToday,
    pendingSubmissions,
    pendingReviews,
    endOfDayIso,
    secondsRemaining,
    missesToBreakStreak,
  };
};
