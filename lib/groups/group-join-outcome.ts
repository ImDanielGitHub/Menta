import {
  translate,
  type TranslationValues,
} from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

type JoinResponseRecord = Record<string, unknown>;
type TranslateCopy = (
  key: TranslationKey,
  values?: TranslationValues
) => string;

export type GroupJoinOutcome =
  | {
      kind: 'joined';
      groupId: string | null;
      groupName: string;
      cost: number | null;
    }
  | {
      kind: 'already_member';
      groupId: string | null;
      groupName: string;
    }
  | {
      kind: 'quota_limit';
      title: string;
      message: string;
    }
  | {
      kind: 'stale_code';
      title: string;
      message: string;
    }
  | {
      kind: 'session_required';
      title: string;
      message: string;
    }
  | {
      kind: 'funding_required';
      title: string;
      message: string;
    }
  | {
      kind: 'group_inactive';
      title: string;
      message: string;
    }
  | {
      kind: 'retryable_error';
      title: string;
      message: string;
    };

export type GroupJoinErrorOutcome = Exclude<
  GroupJoinOutcome,
  { kind: 'joined' } | { kind: 'already_member' }
>;

const readString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const readSpend = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0
    ? value
    : null;

const readRecord = (value: unknown): JoinResponseRecord | null =>
  value && typeof value === 'object' ? (value as JoinResponseRecord) : null;

const getOutcomeMessages = (t?: TranslateCopy) => ({
  staleCode: {
    title: t
      ? t('groups.join.outcome_stale_title')
      : translate('en-NZ', 'groups.join.outcome_stale_title'),
    message: t
      ? t('groups.join.outcome_stale_detail')
      : translate('en-NZ', 'groups.join.outcome_stale_detail'),
  },
  sessionRequired: {
    title: t
      ? t('groups.join.outcome_sign_in_title')
      : translate('en-NZ', 'groups.join.outcome_sign_in_title'),
    message: t
      ? t('groups.join.outcome_sign_in_detail')
      : translate('en-NZ', 'groups.join.outcome_sign_in_detail'),
  },
  fundingRequired: {
    title: t
      ? t('groups.join.outcome_momenta_title')
      : translate('en-NZ', 'groups.join.outcome_momenta_title'),
    message: t
      ? t('groups.join.outcome_momenta_detail')
      : translate('en-NZ', 'groups.join.outcome_momenta_detail'),
  },
  quotaLimit: {
    title: t
      ? t('groups.join.outcome_quota_title')
      : translate('en-NZ', 'groups.join.outcome_quota_title'),
    message: t
      ? t('groups.join.outcome_quota_detail')
      : translate('en-NZ', 'groups.join.outcome_quota_detail'),
  },
  groupInactive: {
    title: t
      ? t('groups.join.outcome_closed_title')
      : translate('en-NZ', 'groups.join.outcome_closed_title'),
    message: t
      ? t('groups.join.outcome_closed_detail')
      : translate('en-NZ', 'groups.join.outcome_closed_detail'),
  },
  retryable: {
    title: t
      ? t('groups.join.outcome_retry_title')
      : translate('en-NZ', 'groups.join.outcome_retry_title'),
    message: t
      ? t('groups.join.outcome_retry_detail')
      : translate('en-NZ', 'groups.join.outcome_retry_detail'),
  },
});

const staleCodes = new Set([
  'INVALID_CODE',
  'EXPIRED_CODE',
  'STALE_CODE',
  'INVITE_EXPIRED',
  'INVITE_NOT_ACTIVE',
]);

const sessionCodes = new Set([
  'AUTH_REQUIRED',
  'INVALID_SESSION',
  'SESSION_EXPIRED',
  'UNAUTHORIZED',
]);

export const resolveGroupJoinOutcome = (
  value: unknown,
  translateCopy?: TranslateCopy
): GroupJoinOutcome => {
  const outcomeMessages = getOutcomeMessages(translateCopy);
  const response = readRecord(value);
  const code = readString(response?.code ?? response?.error)?.toUpperCase();
  const groupId = readString(response?.group_id);
  const groupName = readString(response?.group_name) ?? 'this group';

  if (response?.success === true) {
    return {
      kind: 'joined',
      groupId,
      groupName,
      cost: readSpend(response.cost),
    };
  }

  if (code === 'ALREADY_MEMBER') {
    return { kind: 'already_member', groupId, groupName };
  }

  if (code === 'QUOTA_ACTIVE_GROUPS') {
    return { kind: 'quota_limit', ...outcomeMessages.quotaLimit };
  }

  if (code && staleCodes.has(code)) {
    return { kind: 'stale_code', ...outcomeMessages.staleCode };
  }

  if (code && sessionCodes.has(code)) {
    return { kind: 'session_required', ...outcomeMessages.sessionRequired };
  }

  if (code === 'INSUFFICIENT_BALANCE') {
    return { kind: 'funding_required', ...outcomeMessages.fundingRequired };
  }

  if (code === 'GROUP_INACTIVE') {
    return { kind: 'group_inactive', ...outcomeMessages.groupInactive };
  }

  return { kind: 'retryable_error', ...outcomeMessages.retryable };
};

export const resolveGroupJoinError = (
  error: unknown,
  translateCopy?: TranslateCopy
): GroupJoinErrorOutcome => {
  const outcomeMessages = getOutcomeMessages(translateCopy);
  const candidate = readRecord(error);
  const code = readString(candidate?.code)?.toUpperCase();
  const status = candidate?.status;
  const message = readString(candidate?.message)?.toLowerCase() ?? '';

  if (code && sessionCodes.has(code)) {
    return { kind: 'session_required', ...outcomeMessages.sessionRequired };
  }

  if (
    status === 401 ||
    status === 403 ||
    message.includes('session') ||
    message.includes('unauthorized')
  ) {
    return { kind: 'session_required', ...outcomeMessages.sessionRequired };
  }

  if (
    code === 'GROUP_INACTIVE' ||
    message.includes('group inactive') ||
    message.includes('group closed')
  ) {
    return { kind: 'group_inactive', ...outcomeMessages.groupInactive };
  }

  if (
    code === 'INSUFFICIENT_BALANCE' ||
    message.includes('insufficient balance')
  ) {
    return { kind: 'funding_required', ...outcomeMessages.fundingRequired };
  }

  if (
    code === 'QUOTA_ACTIVE_GROUPS' ||
    message.includes('quota_active_groups') ||
    message.includes('active group limit')
  ) {
    return { kind: 'quota_limit', ...outcomeMessages.quotaLimit };
  }

  if (
    (code && staleCodes.has(code)) ||
    message.includes('expired code') ||
    message.includes('invalid code')
  ) {
    return { kind: 'stale_code', ...outcomeMessages.staleCode };
  }

  return { kind: 'retryable_error', ...outcomeMessages.retryable };
};
