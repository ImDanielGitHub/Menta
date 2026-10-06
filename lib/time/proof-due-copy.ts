import { translate } from '@/lib/localization';
import type { TranslationKey } from '@/lib/localization/en-NZ';
import type { ProofDueCountdownState } from '@/lib/time/proof-due';

export type ProofDueTranslate = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

export type ProofDueHelperKind = 'extension' | 'reminder' | 'midnight';

const defaultTranslate: ProofDueTranslate = (key, values) =>
  translate('en-NZ', key, values);

/** Hours after the reminder still count; name that instead of an English clock. */
export const getProofDueRemainingCopy = (
  hours: number,
  minutes: number,
  t: ProofDueTranslate = defaultTranslate
): string => {
  const safeHours = Math.max(0, hours);
  const safeMinutes = Math.max(0, minutes);

  if (safeHours <= 0) {
    return safeMinutes === 1
      ? t('todayProof.streak.minute', { count: safeMinutes })
      : t('todayProof.streak.minutes', { count: safeMinutes });
  }

  if (safeMinutes <= 0) {
    return t('today.countdown.hours', { hours: safeHours });
  }

  return t('today.countdown.hours_minutes', {
    hours: safeHours,
    minutes: safeMinutes,
  });
};

/** Reminder time is preferred. Midnight or the extension is what still counts. */
export const getProofDueHelperKind = (
  state: Pick<ProofDueCountdownState, 'phase' | 'target'>
): ProofDueHelperKind => {
  if (state.target === 'extension') return 'extension';
  if (state.phase === 'due' && state.target === 'reminder') return 'reminder';
  return 'midnight';
};

export const getProofDueHelperCopy = (
  kind: ProofDueHelperKind,
  proofDueLabel: string,
  t: ProofDueTranslate = defaultTranslate
): string => {
  if (kind === 'extension') {
    return t('today.countdown.note_extension');
  }

  if (kind === 'midnight') {
    return t('today.countdown.note_midnight');
  }

  const preferred = t('todayProof.streak.preferred_time', {
    time: proofDueLabel,
  }).trim();
  const midnight = t('today.countdown.note_midnight');
  const preferredSentence = /[.!?]$/.test(preferred)
    ? preferred
    : `${preferred}.`;
  return `${preferredSentence} ${midnight}`;
};
