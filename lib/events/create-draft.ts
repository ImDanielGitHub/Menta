import AsyncStorage from '@react-native-async-storage/async-storage';
import { translate } from '@/lib/localization';

const EVENT_CREATE_DRAFT_PREFIX = 'menta.event-create-draft.v3';
const PREVIOUS_EVENT_CREATE_DRAFT_PREFIX = 'menta.event-create-draft.v2';
const LEGACY_EVENT_CREATE_DRAFT_PREFIX = 'menta.event-create-draft.v1';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type EventCreateVisibility = 'public' | 'unlisted' | 'invite_only';
export type EventDurationMinutes = 60 | 90 | 120 | 180;

export const EVENT_DURATION_OPTIONS: readonly EventDurationMinutes[] = [
  60, 90, 120, 180,
];

/**
 * A private device draft for a server-authoritative publishing flow. It is
 * never treated as an event or displayed outside the owning account.
 */
export type EventCreateDraft = {
  version: 3;
  ownerUserId: string;
  name: string;
  date: string;
  startTime: string;
  durationMinutes: EventDurationMinutes;
  description: string;
  visibility: EventCreateVisibility;
  location: string;
  capacity: string;
  /** Stable across every retry of one logical publish request. */
  publishClientEventId: string | null;
  updatedAt: string;
};

type EventCreateDraftFields = Omit<
  EventCreateDraft,
  'version' | 'publishClientEventId' | 'updatedAt'
>;

export type EventCreateDraftInput = EventCreateDraftFields & {
  /**
   * Omit to preserve an existing key only when every publish fact is unchanged.
   * Pass a UUID for the first attempt, or null for an explicit reset.
   */
  publishClientEventId?: string | null;
};

export type EventCreateDraftLoadRequest = {
  ownerUserId: string | null;
  requestId: number;
};

export type EventCreateSchedule =
  | {
      ok: true;
      startsAt: string;
      endsAt: string;
      timeZone: string;
    }
  | { ok: false; message: string };

/**
 * AsyncStorage reads can settle after a sign-out or account switch. Routes use
 * this ownership check before painting a draft or clearing their loader.
 */
export const isActiveEventCreateDraftRequest = (
  active: EventCreateDraftLoadRequest,
  request: EventCreateDraftLoadRequest
): boolean =>
  active.requestId === request.requestId &&
  active.ownerUserId === request.ownerUserId;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasBoundedString = (value: unknown, maximum: number): value is string =>
  typeof value === 'string' && value.length <= maximum;

const isVisibility = (value: unknown): value is EventCreateVisibility =>
  value === 'public' || value === 'unlisted' || value === 'invite_only';

const isDuration = (value: unknown): value is EventDurationMinutes =>
  EVENT_DURATION_OPTIONS.includes(value as EventDurationMinutes);

const isIsoDate = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value));

const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_PATTERN.test(value);

export const getEventCreateDraftKey = (userId: string): string =>
  `${EVENT_CREATE_DRAFT_PREFIX}:${userId}`;

const getLegacyEventCreateDraftKey = (userId: string): string =>
  `${LEGACY_EVENT_CREATE_DRAFT_PREFIX}:${userId}`;

const getPreviousEventCreateDraftKey = (userId: string): string =>
  `${PREVIOUS_EVENT_CREATE_DRAFT_PREFIX}:${userId}`;

const decodeCurrentDraft = (
  value: Record<string, unknown>
): EventCreateDraft | null => {
  if (
    value.version !== 3 ||
    !hasBoundedString(value.ownerUserId, 128) ||
    value.ownerUserId.trim().length === 0 ||
    !hasBoundedString(value.name, 120) ||
    !hasBoundedString(value.date, 10) ||
    !hasBoundedString(value.startTime, 5) ||
    !isDuration(value.durationMinutes) ||
    !hasBoundedString(value.description, 500) ||
    !isVisibility(value.visibility) ||
    !hasBoundedString(value.location, 160) ||
    !hasBoundedString(value.capacity, 5) ||
    (value.publishClientEventId !== null &&
      !isUuid(value.publishClientEventId)) ||
    !isIsoDate(value.updatedAt)
  ) {
    return null;
  }

  return value as EventCreateDraft;
};

const decodePreviousDraft = (
  value: Record<string, unknown>
): EventCreateDraft | null => {
  if (
    value.version !== 2 ||
    !hasBoundedString(value.ownerUserId, 128) ||
    value.ownerUserId.trim().length === 0 ||
    !hasBoundedString(value.name, 120) ||
    !hasBoundedString(value.date, 10) ||
    !hasBoundedString(value.startTime, 5) ||
    !isDuration(value.durationMinutes) ||
    !hasBoundedString(value.description, 500) ||
    !isVisibility(value.visibility) ||
    !hasBoundedString(value.location, 160) ||
    !hasBoundedString(value.capacity, 5) ||
    !isIsoDate(value.updatedAt)
  ) {
    return null;
  }

  return {
    version: 3,
    ownerUserId: value.ownerUserId,
    name: value.name,
    date: value.date,
    startTime: value.startTime,
    durationMinutes: value.durationMinutes,
    description: value.description,
    visibility: value.visibility,
    location: value.location,
    capacity: value.capacity,
    publishClientEventId: null,
    updatedAt: value.updatedAt,
  };
};

const decodeLegacyDraft = (
  value: Record<string, unknown>
): EventCreateDraft | null => {
  if (
    value.version !== 1 ||
    !hasBoundedString(value.ownerUserId, 128) ||
    value.ownerUserId.trim().length === 0 ||
    !hasBoundedString(value.name, 120) ||
    !hasBoundedString(value.description, 500) ||
    !isVisibility(value.visibility) ||
    !hasBoundedString(value.location, 160) ||
    !isIsoDate(value.updatedAt)
  ) {
    return null;
  }

  return {
    version: 3,
    ownerUserId: value.ownerUserId,
    name: value.name,
    date: '',
    startTime: '',
    durationMinutes: 90,
    description: value.description,
    visibility: value.visibility,
    location: value.location,
    capacity: '',
    publishClientEventId: null,
    updatedAt: value.updatedAt,
  };
};

export const decodeEventCreateDraft = (
  raw: string | null
): EventCreateDraft | null => {
  if (!raw) return null;

  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)) return null;
    return (
      decodeCurrentDraft(value) ??
      decodePreviousDraft(value) ??
      decodeLegacyDraft(value)
    );
  } catch {
    return null;
  }
};

export const buildEventCreateDraft = (
  input: EventCreateDraftInput
): EventCreateDraft => ({
  version: 3,
  ownerUserId: input.ownerUserId,
  name: input.name.slice(0, 120),
  date: input.date.slice(0, 10),
  startTime: input.startTime.slice(0, 5),
  durationMinutes: input.durationMinutes,
  description: input.description.slice(0, 500),
  visibility: input.visibility,
  location: input.location.slice(0, 160),
  capacity: input.capacity.replace(/\D/g, '').slice(0, 5),
  publishClientEventId: isUuid(input.publishClientEventId)
    ? input.publishClientEventId
    : null,
  updatedAt: new Date().toISOString(),
});

type EventCreatePublishFacts = Omit<
  EventCreateDraftFields,
  'description' | 'location' | 'capacity' | 'name'
> & {
  title: string;
  description: string | null;
  venueName: string | null;
  capacity: number | null | undefined;
};

const publishFactsFor = (
  input: EventCreateDraftFields | EventCreateDraft
): EventCreatePublishFacts => {
  const bounded = buildEventCreateDraft({
    ownerUserId: input.ownerUserId,
    name: input.name,
    date: input.date,
    startTime: input.startTime,
    durationMinutes: input.durationMinutes,
    description: input.description,
    visibility: input.visibility,
    location: input.location,
    capacity: input.capacity,
  });
  const capacity = bounded.capacity.trim() ? Number(bounded.capacity) : null;

  return {
    ownerUserId: bounded.ownerUserId,
    title: bounded.name.trim(),
    date: bounded.date,
    startTime: bounded.startTime,
    durationMinutes: bounded.durationMinutes,
    description: bounded.description.trim() || null,
    visibility: bounded.visibility,
    venueName: bounded.location.trim() || null,
    capacity:
      capacity === null ||
      (Number.isInteger(capacity) && capacity >= 1 && capacity <= 10_000)
        ? capacity
        : undefined,
  };
};

/**
 * A stored UUID is reusable only for the same server request facts. The server
 * remains authoritative and will still reject a UUID reused with another hash.
 */
export const canReuseEventCreatePublishClientEventId = (
  draft: EventCreateDraft | null,
  input: EventCreateDraftFields
): boolean =>
  Boolean(
    draft?.publishClientEventId &&
    JSON.stringify(publishFactsFor(draft)) ===
      JSON.stringify(publishFactsFor(input))
  );

export const buildEventCreateSchedule = (input: {
  date: string;
  startTime: string;
  durationMinutes: EventDurationMinutes;
  now?: Date;
}): EventCreateSchedule => {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.date.trim());
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(input.startTime.trim());
  if (!dateMatch || !timeMatch) {
    return {
      ok: false,
      message: translate('en-NZ', 'domain.events.date_format'),
    };
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const starts = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    starts.getFullYear() !== year ||
    starts.getMonth() !== month - 1 ||
    starts.getDate() !== day ||
    starts.getHours() !== hour ||
    starts.getMinutes() !== minute
  ) {
    return {
      ok: false,
      message: translate('en-NZ', 'domain.events.invalid_date_time'),
    };
  }

  const now = input.now ?? new Date();
  if (starts.getTime() <= now.getTime()) {
    return {
      ok: false,
      message: translate('en-NZ', 'domain.events.future_start'),
    };
  }

  const ends = new Date(starts.getTime() + input.durationMinutes * 60 * 1000);
  return {
    ok: true,
    startsAt: starts.toISOString(),
    endsAt: ends.toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  };
};

export const loadEventCreateDraft = async (
  userId: string
): Promise<EventCreateDraft | null> => {
  const current = decodeEventCreateDraft(
    await AsyncStorage.getItem(getEventCreateDraftKey(userId))
  );
  if (current?.ownerUserId === userId) return current;

  const previous = decodeEventCreateDraft(
    await AsyncStorage.getItem(getPreviousEventCreateDraftKey(userId))
  );
  if (previous?.ownerUserId === userId) return previous;

  const legacy = decodeEventCreateDraft(
    await AsyncStorage.getItem(getLegacyEventCreateDraftKey(userId))
  );
  return legacy?.ownerUserId === userId ? legacy : null;
};

export const saveEventCreateDraft = async (
  input: EventCreateDraftInput
): Promise<EventCreateDraft> => {
  const existing = await loadEventCreateDraft(input.ownerUserId);
  const publishClientEventId =
    input.publishClientEventId === undefined &&
    canReuseEventCreatePublishClientEventId(existing, input)
      ? existing?.publishClientEventId
      : input.publishClientEventId;
  const draft = buildEventCreateDraft({
    ...input,
    publishClientEventId,
  });
  await AsyncStorage.setItem(
    getEventCreateDraftKey(input.ownerUserId),
    JSON.stringify(draft)
  );
  await Promise.all([
    AsyncStorage.removeItem(getPreviousEventCreateDraftKey(input.ownerUserId)),
    AsyncStorage.removeItem(getLegacyEventCreateDraftKey(input.ownerUserId)),
  ]);
  return draft;
};

export const clearEventCreateDraft = async (userId: string): Promise<void> => {
  await Promise.all([
    AsyncStorage.removeItem(getEventCreateDraftKey(userId)),
    AsyncStorage.removeItem(getPreviousEventCreateDraftKey(userId)),
    AsyncStorage.removeItem(getLegacyEventCreateDraftKey(userId)),
  ]);
};
