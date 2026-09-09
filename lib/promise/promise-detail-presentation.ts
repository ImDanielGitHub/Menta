import type { TranslationKey } from '@/lib/localization/en-NZ';
import { translate } from '@/lib/localization/translate';

export type SoloActivePromiseGate = {
  allowSelfReview: boolean | null | undefined;
  groupId: string | null | undefined;
  isUserParticipant: boolean;
  challengeStatus: string | null | undefined;
  isExpired: boolean;
  isDetailLoading: boolean;
  submissionStatusUnavailable: boolean;
  canSubmit: boolean;
  shouldShowPending: boolean;
  shouldShowApproved: boolean;
  shouldShowRejected: boolean;
};

/**
 * Keeps the solo active Promise sheet behind the same authority boundaries as
 * the server projection. A missing or contradictory fact falls back to the
 * existing general Promise route instead of enabling proof submission.
 */
export const shouldShowSoloActivePromise = (
  gate: SoloActivePromiseGate
): boolean =>
  gate.allowSelfReview === true &&
  !gate.groupId &&
  gate.isUserParticipant &&
  gate.challengeStatus === 'active' &&
  !gate.isExpired &&
  !gate.isDetailLoading &&
  !gate.submissionStatusUnavailable &&
  gate.canSubmit &&
  !gate.shouldShowPending &&
  !gate.shouldShowApproved &&
  !gate.shouldShowRejected;

/** A server-projected zero is a real result and must not fall through. */
export const resolveApprovedDayCount = (
  serverApprovedDays: number | null | undefined,
  proofRowApprovedDays: number
): number => serverApprovedDays ?? proofRowApprovedDays;

export const isPromiseTermComplete = (input: {
  isExpired: boolean;
  serverCompleted: boolean | null | undefined;
  challengeStatus: string | null | undefined;
}): boolean =>
  input.isExpired ||
  input.serverCompleted === true ||
  input.challengeStatus === 'completed' ||
  input.challengeStatus === 'expired';

export const formatPromiseFrequency = (
  value: string | null | undefined,
  localise?: (key: TranslationKey) => string
): string => {
  const normalized = value?.trim().toLocaleLowerCase('en-NZ');
  if (!normalized || normalized === 'daily' || normalized === 'every day') {
    return localise
      ? localise('fullAuth.onboarding.every_day')
      : translate('en-NZ', 'fullAuth.onboarding.every_day');
  }
  if (normalized === 'weekly' || normalized === 'once a week') {
    return localise
      ? localise('fullAuth.promise.frequency.once_a_week')
      : translate('en-NZ', 'fullAuth.promise.frequency.once_a_week');
  }

  const words = normalized.replace(/[_-]+/g, ' ');
  return `${words.charAt(0).toLocaleUpperCase('en-NZ')}${words.slice(1)}`;
};

/**
 * Reminder preferences are stored as a local wall-clock value, not a UTC
 * instant. Formatting through a local Date preserves the person's device
 * locale without presenting an internal `HH:mm:ss` value in the Promise UI.
 */
export const formatPromiseReminderTime = (
  value: string | null | undefined,
  locale: string,
  fallback: string
): string => {
  const [hoursRaw, minutesRaw] = value?.trim().split(':') ?? [];
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return fallback;
  }

  const localClock = new Date();
  localClock.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(localClock);
};

export type PromiseDetailBranch =
  | 'history'
  | 'rules'
  | 'proof'
  | 'proof-unavailable'
  | 'waiting'
  | 'complete'
  | 'active'
  | 'queued'
  | 'correction'
  | 'approved'
  | 'recovery'
  | 'unknown'
  | 'general';

export const resolvePromiseDetailBranch = (input: {
  requestedView: 'summary' | 'history' | 'rules' | 'proof';
  hasSelectedProof: boolean;
  showWaiting: boolean;
  showComplete: boolean;
  showActive: boolean;
  showQueued?: boolean;
  showCorrection?: boolean;
  showApproved?: boolean;
  showRecovery?: boolean;
  showUnknown?: boolean;
}): PromiseDetailBranch => {
  if (input.requestedView === 'history') return 'history';
  if (input.requestedView === 'rules') return 'rules';
  if (input.requestedView === 'proof') {
    return input.hasSelectedProof ? 'proof' : 'proof-unavailable';
  }
  if (input.showWaiting) return 'waiting';
  if (input.showComplete) return 'complete';
  if (input.showQueued) return 'queued';
  if (input.showCorrection) return 'correction';
  if (input.showApproved) return 'approved';
  if (input.showRecovery) return 'recovery';
  if (input.showUnknown) return 'unknown';
  if (input.showActive) return 'active';
  return 'general';
};
