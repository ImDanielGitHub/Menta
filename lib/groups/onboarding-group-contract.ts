import type { Json } from '@/lib/database.types';
import { translate } from '@/lib/localization/translate';

export type OnboardingGroupLinkReceipt = {
  resultCode: 'ONBOARDING_GROUP_LINKED_V1';
  replayed: boolean;
  group: {
    id: string;
    name: string;
    description: string | null;
    privacy: 'public' | 'private';
    imageUrl: string | null;
    durationDays: number;
    startDate: string;
    endDate: string;
    notifyOnMemberMiss: boolean;
  };
  firstPromise: {
    id: string;
    title: string;
    allowSelfReview: false;
    submissionExpectations: Json;
  };
  economy: { cost: number; newBalance: number };
};

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (value: unknown, maximum = 500): string | null =>
  typeof value === 'string' && value.trim() && value.trim().length <= maximum
    ? value.trim()
    : null;

const readNullableString = (
  value: unknown,
  maximum = 500
): string | null | undefined =>
  value === null ? null : (readString(value, maximum) ?? undefined);

const readInteger = (value: unknown): number | null =>
  typeof value === 'number' && Number.isSafeInteger(value) ? value : null;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const readUuid = (value: unknown): string | null => {
  const id = readString(value, 36);
  return id && UUID_PATTERN.test(id) ? id : null;
};

const readCivilDate = (value: unknown): string | null | undefined => {
  if (value === null) return null;
  const date = readString(value, 10);
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined;
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
    ? date
    : undefined;
};

export const decodeOnboardingGroupLinkReceipt = (
  value: unknown
): OnboardingGroupLinkReceipt | null => {
  if (
    !isRecord(value) ||
    value.success !== true ||
    value.result_code !== 'ONBOARDING_GROUP_LINKED_V1' ||
    typeof value.replayed !== 'boolean' ||
    !isRecord(value.group) ||
    !isRecord(value.first_promise) ||
    !isRecord(value.economy)
  ) {
    return null;
  }

  const groupId = readUuid(value.group.id);
  const groupName = readString(value.group.name, 100);
  const groupDescription = readNullableString(value.group.description);
  const privacy = value.group.privacy;
  const imageUrl = readNullableString(value.group.image_url, 200);
  const durationDays = readInteger(value.group.duration_days);
  const startDate = readCivilDate(value.group.start_date);
  const endDate = readCivilDate(value.group.end_date);
  const notifyOnMemberMiss = value.group.notify_on_member_miss;
  const firstPromiseId = readUuid(value.first_promise.id);
  const firstPromiseTitle = readString(value.first_promise.title, 200);
  const expectations = value.first_promise.submission_expectations;
  const cost = readInteger(value.economy.cost);
  const newBalance = readInteger(value.economy.new_balance);

  if (
    !groupId ||
    !groupName ||
    groupDescription === undefined ||
    (privacy !== 'public' && privacy !== 'private') ||
    imageUrl === undefined ||
    !durationDays ||
    ![7, 14, 30].includes(durationDays) ||
    !startDate ||
    !endDate ||
    (Date.parse(`${endDate}T00:00:00Z`) -
      Date.parse(`${startDate}T00:00:00Z`)) /
      86_400_000 +
      1 !==
      durationDays ||
    typeof notifyOnMemberMiss !== 'boolean' ||
    !firstPromiseId ||
    !firstPromiseTitle ||
    value.first_promise.allow_self_review !== false ||
    !isRecord(expectations) ||
    expectations.requires_peer_review !== true ||
    expectations.reviewers_required !== 1 ||
    cost !== 0 ||
    newBalance === null ||
    newBalance < 0
  ) {
    return null;
  }

  return {
    resultCode: 'ONBOARDING_GROUP_LINKED_V1',
    replayed: value.replayed,
    group: {
      id: groupId,
      name: groupName,
      description: groupDescription,
      privacy,
      imageUrl,
      durationDays,
      startDate,
      endDate,
      notifyOnMemberMiss,
    },
    firstPromise: {
      id: firstPromiseId,
      title: firstPromiseTitle,
      allowSelfReview: false,
      submissionExpectations: expectations as Json,
    },
    economy: { cost, newBalance },
  };
};

export const onboardingGroupLinkErrorMessage = (code: unknown): string => {
  if (
    code === 'FIRST_PROMISE_NOT_LINKABLE' ||
    code === 'FIRST_PROMISE_ALREADY_LINKED' ||
    code === 'FIRST_PROMISE_ALREADY_STARTED'
  ) {
    return translate('en-NZ', 'groups.create.promise_not_linkable');
  }
  if (code === 'IDEMPOTENCY_CONFLICT') {
    return translate('en-NZ', 'groups.create.group_already_confirmed');
  }
  if (code === 'ONBOARDING_FIRST_GROUP_UNAVAILABLE') {
    return translate('en-NZ', 'groups.create.first_group_unavailable');
  }
  if (code === 'INSUFFICIENT_BALANCE') {
    return translate('en-NZ', 'groups.create.insufficient_momenta');
  }
  return translate('en-NZ', 'groups.create.link_failed');
};
