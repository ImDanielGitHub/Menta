import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EventCreateInput } from '@/types/event';

const EVENT_PUBLISH_RECOVERY_PREFIX = 'menta.event-publish-recovery.v1';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type EventPublishRecovery = {
  version: 1;
  ownerUserId: string;
  eventId: string;
  input: EventCreateInput;
  updatedAt: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isIsoDate = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value));

const isCreateInput = (value: unknown): value is EventCreateInput => {
  if (!isRecord(value)) return false;
  return (
    typeof value.clientEventId === 'string' &&
    UUID_PATTERN.test(value.clientEventId) &&
    typeof value.title === 'string' &&
    value.title.trim().length > 0 &&
    value.title.length <= 120 &&
    (value.description === null ||
      (typeof value.description === 'string' &&
        value.description.length <= 500)) &&
    (value.venueName === null ||
      (typeof value.venueName === 'string' && value.venueName.length <= 160)) &&
    typeof value.timeZone === 'string' &&
    value.timeZone.length > 0 &&
    (value.visibility === 'public' ||
      value.visibility === 'unlisted' ||
      value.visibility === 'invite_only') &&
    isIsoDate(value.startsAt) &&
    isIsoDate(value.endsAt) &&
    (value.capacity === null ||
      (typeof value.capacity === 'number' &&
        Number.isInteger(value.capacity) &&
        value.capacity > 0 &&
        value.capacity <= 10_000))
  );
};

export const getEventPublishRecoveryKey = (
  userId: string,
  eventId: string
): string => `${EVENT_PUBLISH_RECOVERY_PREFIX}:${userId}:${eventId}`;

export const decodeEventPublishRecovery = (
  raw: string | null
): EventPublishRecovery | null => {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !isRecord(value) ||
      value.version !== 1 ||
      typeof value.ownerUserId !== 'string' ||
      value.ownerUserId.length === 0 ||
      value.ownerUserId.length > 128 ||
      typeof value.eventId !== 'string' ||
      !UUID_PATTERN.test(value.eventId) ||
      !isCreateInput(value.input) ||
      !isIsoDate(value.updatedAt)
    ) {
      return null;
    }
    return value as EventPublishRecovery;
  } catch {
    return null;
  }
};

export const saveEventPublishRecovery = async (input: {
  ownerUserId: string;
  eventId: string;
  publishInput: EventCreateInput;
}): Promise<EventPublishRecovery> => {
  const recovery: EventPublishRecovery = {
    version: 1,
    ownerUserId: input.ownerUserId,
    eventId: input.eventId,
    input: input.publishInput,
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(
    getEventPublishRecoveryKey(input.ownerUserId, input.eventId),
    JSON.stringify(recovery)
  );
  return recovery;
};

export const loadEventPublishRecovery = async (
  userId: string,
  eventId: string
): Promise<EventPublishRecovery | null> => {
  const recovery = decodeEventPublishRecovery(
    await AsyncStorage.getItem(getEventPublishRecoveryKey(userId, eventId))
  );
  return recovery?.ownerUserId === userId && recovery.eventId === eventId
    ? recovery
    : null;
};

/**
 * Enumerate only the current organiser's recovery records. Each record remains
 * independently keyed by account and event, so a cold start can rediscover an
 * unlisted event without storing a second copy of its server-issued secrets.
 */
export const listEventPublishRecoveries = async (
  userId: string
): Promise<EventPublishRecovery[]> => {
  if (!userId) return [];

  const accountPrefix = `${EVENT_PUBLISH_RECOVERY_PREFIX}:${userId}:`;
  const recoveryKeys = (await AsyncStorage.getAllKeys()).filter(key =>
    key.startsWith(accountPrefix)
  );
  if (recoveryKeys.length === 0) return [];

  const recoveries = (await AsyncStorage.multiGet(recoveryKeys))
    .map(([, raw]) => decodeEventPublishRecovery(raw))
    .filter(
      (recovery): recovery is EventPublishRecovery =>
        recovery?.ownerUserId === userId
    );

  return recoveries.sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt)
  );
};
