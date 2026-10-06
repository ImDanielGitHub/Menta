import { formatLocalDay } from '@/lib/loop/day-context';
import { translate } from '@/lib/localization';

export type CorrectionNoteSource = {
  status?: string | null;
  review_notes?: string | null;
  local_day?: string | null;
  submission_date?: string | null;
};

export const sanitizeCorrectionReason = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/** Keeps a reviewer note on compose params without inventing an empty one. */
export const withCorrectionReasonParams = <T extends Record<string, string>>(
  params: T,
  reason: string | null | undefined
): T & { correctionReason?: string } => {
  const correctionReason = sanitizeCorrectionReason(reason);
  return correctionReason ? { ...params, correctionReason } : params;
};

const isTodaySubmission = (
  submission: CorrectionNoteSource,
  today: string,
  timezone: string
): boolean => {
  if (submission.local_day) return submission.local_day === today;
  if (!submission.submission_date) return false;
  try {
    return formatLocalDay(submission.submission_date, timezone) === today;
  } catch {
    return false;
  }
};

/** Newest rejected proof from today's local day, if the reviewer left a note. */
export const pickTodayRejectedReviewNote = (
  submissions: readonly CorrectionNoteSource[],
  args: { timezone: string; now?: Date }
): string | null => {
  const today = formatLocalDay(args.now ?? new Date(), args.timezone);
  const match = submissions
    .filter(
      submission =>
        submission.status === 'rejected' &&
        isTodaySubmission(submission, today, args.timezone)
    )
    .sort((left, right) => {
      const leftTime = left.submission_date
        ? Date.parse(left.submission_date)
        : 0;
      const rightTime = right.submission_date
        ? Date.parse(right.submission_date)
        : 0;
      return rightTime - leftTime;
    })[0];

  return sanitizeCorrectionReason(match?.review_notes);
};

export const getCorrectionComposeNotice = (
  reason: string | null,
  locale = 'en-NZ'
): { title: string; description: string } | null => {
  if (!reason) return null;
  return {
    title: translate(locale, 'todayProof.residual.what_to_change'),
    description: reason,
  };
};

export const getCorrectionFollowUpNote = (
  reason: string | null,
  locale = 'en-NZ'
): string =>
  reason
    ? reason
    : translate(
        locale,
        'todayProof.residual.your_last_check_in_needs_a_clearer_follow_up_before_the_day_clos'
      );
