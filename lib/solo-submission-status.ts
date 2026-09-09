import { formatLocalDay } from '@/lib/loop/day-context';

export type SoloTodayStatus = 'none' | 'pending' | 'approved' | 'rejected';

export type SoloSubmissionStatusSource = {
  status: string | null;
  submission_date: string | null;
  local_day?: string | null;
};

export type SoloTodayAction = 'submit' | 'view-details';

type UnknownRecord = Record<string, unknown>;

const SOLO_SUBMISSION_STATUSES: ReadonlySet<string> = new Set([
  'pending',
  'approved',
  'rejected',
]);

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const decodeSubmissionStatus = (
  value: unknown
): Exclude<SoloTodayStatus, 'none'> | null =>
  typeof value === 'string' && SOLO_SUBMISSION_STATUSES.has(value)
    ? (value as Exclude<SoloTodayStatus, 'none'>)
    : null;

/**
 * Decode the one-row result from get_todays_submission_status. A malformed
 * server response is deliberately unknown rather than treated as no proof,
 * because "no proof" would invite a duplicate submission for that local day.
 */
export const decodeTodaysSubmissionStatus = (
  value: unknown
): SoloTodayStatus | null => {
  const row = Array.isArray(value) ? value[0] : value;
  if (!isRecord(row) || typeof row.has_submitted !== 'boolean') {
    return null;
  }

  if (!row.has_submitted) return 'none';

  return decodeSubmissionStatus(row.submission_status);
};

/**
 * Legacy rows created before local_day existed cannot be matched by the
 * server's local-day uniqueness key. Use a device-timezone timestamp fallback
 * only for those rows; never override an authoritative local_day.
 */
export const getLegacyTodayStatus = (
  submissions: readonly SoloSubmissionStatusSource[] | undefined,
  args: { timezone: string; now?: Date }
): SoloTodayStatus => {
  if (!submissions) return 'none';

  const today = formatLocalDay(args.now ?? new Date(), args.timezone);
  const legacySubmission = submissions.find(submission => {
    if (submission.local_day !== null && submission.local_day !== undefined) {
      return false;
    }

    if (!submission.submission_date) return false;

    try {
      return (
        formatLocalDay(submission.submission_date, args.timezone) === today
      );
    } catch {
      return false;
    }
  });

  return legacySubmission
    ? (decodeSubmissionStatus(legacySubmission.status) ?? 'none')
    : 'none';
};

/** Rows with any stored local_day are governed by the server status RPC. */
export const hasAuthoritativeLocalDay = (
  submissions: readonly SoloSubmissionStatusSource[] | undefined
): boolean =>
  submissions?.some(
    submission =>
      submission.local_day !== null && submission.local_day !== undefined
  ) ?? false;

/** Existing same-day proof is view-only from the list to avoid duplicate-submit copy. */
export const getSoloTodayAction = (status: SoloTodayStatus): SoloTodayAction =>
  status === 'none' ? 'submit' : 'view-details';
