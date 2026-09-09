import { translate } from '@/lib/localization';

export const sanitizeCorrectionReason = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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
