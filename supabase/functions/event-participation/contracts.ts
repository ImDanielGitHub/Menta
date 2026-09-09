import {
  isOwnedEventMediaPath,
  parseEventMediaPath,
  type EventMediaPath,
} from './storage-paths.ts';

/**
 * The Edge Function accepts a deliberately small, typed command surface.
 * Parsing lives separately from the Deno entry point so it can be unit-tested
 * without a network, service role, or Storage account.
 */

export const EVENT_FUNCTION_ACTIONS = [
  'create_event',
  'list_public_events',
  'get_event_summary',
  'get_my_occurrence',
  'get_attendee_album',
  'get_organiser_review_queue',
  'get_organiser_recap',
  'join',
  'leave',
  'check_in',
  'prepare_post_upload',
  'finalise_post',
  'review_post',
  'delete_own_post',
] as const;

export type EventFunctionAction = (typeof EVENT_FUNCTION_ACTIONS)[number];

export type EventMediaContentType = 'image/jpeg' | 'image/png' | 'image/webp';

export type EventReviewDecision = 'approve' | 'reject';

export type EventVisibility = 'public' | 'unlisted' | 'invite_only';

type BaseCommand<TAction extends EventFunctionAction> = {
  action: TAction;
};

export type GetEventSummaryCommand = BaseCommand<'get_event_summary'> & {
  eventId: string;
  shareToken: string | null;
  inviteToken: string | null;
};

export type ListPublicEventsCommand = BaseCommand<'list_public_events'>;

export type CreateEventCommand = BaseCommand<'create_event'> & {
  clientEventId: string;
  title: string;
  description: string | null;
  venueName: string | null;
  timeZone: string;
  visibility: EventVisibility;
  startsAt: string;
  endsAt: string;
  capacity: number | null;
};

export type GetMyOccurrenceCommand = BaseCommand<'get_my_occurrence'> & {
  occurrenceId: string;
};

export type GetAttendeeAlbumCommand = BaseCommand<'get_attendee_album'> & {
  occurrenceId: string;
};

export type GetOrganiserReviewQueueCommand =
  BaseCommand<'get_organiser_review_queue'> & {
    occurrenceId: string;
  };

export type GetOrganiserRecapCommand = BaseCommand<'get_organiser_recap'> & {
  eventId: string;
};

export type JoinCommand = BaseCommand<'join'> & {
  occurrenceId: string;
  clientEventId: string;
  consentVersion: string;
  shareToken: string | null;
  inviteToken: string | null;
};

export type LeaveCommand = BaseCommand<'leave'> & {
  occurrenceId: string;
  clientEventId: string;
};

export type CheckInCommand = BaseCommand<'check_in'> & {
  occurrenceId: string;
  clientEventId: string;
  token: string;
};

export type PreparePostUploadCommand = BaseCommand<'prepare_post_upload'> & {
  occurrenceId: string;
  clientEventId: string;
  caption: string | null;
  contentType: EventMediaContentType;
  byteSize: number;
};

export type FinalisePostCommand = BaseCommand<'finalise_post'> & {
  postId: string;
  clientEventId: string;
};

export type ReviewPostCommand = BaseCommand<'review_post'> & {
  postId: string;
  clientEventId: string;
  expectedRevision: number;
  decision: EventReviewDecision;
  note: string | null;
};

export type DeleteOwnPostCommand = BaseCommand<'delete_own_post'> & {
  postId: string;
  clientEventId: string;
};

export type EventFunctionCommand =
  | CreateEventCommand
  | ListPublicEventsCommand
  | GetEventSummaryCommand
  | GetMyOccurrenceCommand
  | GetAttendeeAlbumCommand
  | GetOrganiserReviewQueueCommand
  | GetOrganiserRecapCommand
  | JoinCommand
  | LeaveCommand
  | CheckInCommand
  | PreparePostUploadCommand
  | FinalisePostCommand
  | ReviewPostCommand
  | DeleteOwnPostCommand;

export type EventCommandParseResult =
  | { ok: true; command: EventFunctionCommand }
  | {
      ok: false;
      action: EventFunctionAction | null;
      clientEventId: string | null;
      code: 'INVALID_REQUEST';
      message: string;
    };

export type EventMediaPathParts = EventMediaPath;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const OPAQUE_TOKEN_PATTERN = /^[A-Za-z0-9._~-]{16,512}$/;

const CANONICAL_UTC_TIMESTAMP_PATTERN =
  /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{3}Z$/;

const MEDIA_CONTENT_TYPES: readonly EventMediaContentType[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_PATTERN.test(value);

const isOpaqueToken = (value: unknown): value is string =>
  typeof value === 'string' && OPAQUE_TOKEN_PATTERN.test(value);

const isCanonicalUtcTimestamp = (value: unknown): value is string => {
  if (
    typeof value !== 'string' ||
    !CANONICAL_UTC_TIMESTAMP_PATTERN.test(value)
  ) {
    return false;
  }

  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
};

const isVisibility = (value: unknown): value is EventVisibility =>
  value === 'public' || value === 'unlisted' || value === 'invite_only';

export const isEventMediaContentType = (
  value: unknown
): value is EventMediaContentType =>
  typeof value === 'string' &&
  MEDIA_CONTENT_TYPES.includes(value as EventMediaContentType);

const isAction = (value: unknown): value is EventFunctionAction =>
  typeof value === 'string' &&
  EVENT_FUNCTION_ACTIONS.includes(value as EventFunctionAction);

const nullableOpaqueToken = (value: unknown): string | null | undefined => {
  if (value === null || value === undefined) return null;
  return isOpaqueToken(value) ? value : undefined;
};

const nullableText = (
  value: unknown,
  maximumLength: number
): string | null | undefined => {
  if (value === null || value === undefined) return null;
  return typeof value === 'string' && value.length <= maximumLength
    ? value
    : undefined;
};

const exactKeys = (
  body: Record<string, unknown>,
  permitted: readonly string[]
): boolean => Object.keys(body).every(key => permitted.includes(key));

const invalid = (body: unknown, message: string): EventCommandParseResult => {
  const action = isRecord(body) && isAction(body.action) ? body.action : null;
  const clientEventId =
    isRecord(body) && isUuid(body.clientEventId) ? body.clientEventId : null;

  return {
    ok: false,
    action,
    clientEventId,
    code: 'INVALID_REQUEST',
    message,
  };
};

const parseReadSummary = (
  body: Record<string, unknown>
): EventCommandParseResult => {
  if (
    !exactKeys(body, ['action', 'eventId', 'shareToken', 'inviteToken']) ||
    !isUuid(body.eventId)
  ) {
    return invalid(body, 'The event summary request is invalid.');
  }

  const shareToken = nullableOpaqueToken(body.shareToken);
  const inviteToken = nullableOpaqueToken(body.inviteToken);
  if (shareToken === undefined || inviteToken === undefined) {
    return invalid(body, 'The event access capability is invalid.');
  }

  return {
    ok: true,
    command: {
      action: 'get_event_summary',
      eventId: body.eventId,
      shareToken,
      inviteToken,
    },
  };
};

const parsePublicDiscovery = (
  body: Record<string, unknown>
): EventCommandParseResult =>
  exactKeys(body, ['action'])
    ? { ok: true, command: { action: 'list_public_events' } }
    : invalid(body, 'The public event discovery request is invalid.');

const parseCreateEvent = (
  body: Record<string, unknown>
): EventCommandParseResult => {
  if (
    !exactKeys(body, [
      'action',
      'clientEventId',
      'title',
      'description',
      'venueName',
      'timeZone',
      'visibility',
      'startsAt',
      'endsAt',
      'capacity',
    ]) ||
    !isUuid(body.clientEventId) ||
    typeof body.title !== 'string' ||
    body.title.trim().length < 1 ||
    body.title.length > 120 ||
    typeof body.timeZone !== 'string' ||
    body.timeZone.length < 1 ||
    body.timeZone.length > 64 ||
    !isVisibility(body.visibility) ||
    !isCanonicalUtcTimestamp(body.startsAt) ||
    !isCanonicalUtcTimestamp(body.endsAt)
  ) {
    return invalid(body, 'The event publishing request is invalid.');
  }

  const description = nullableText(body.description, 500);
  const venueName = nullableText(body.venueName, 160);
  const startsAt = Date.parse(body.startsAt);
  const endsAt = Date.parse(body.endsAt);
  const capacity = body.capacity;
  if (
    description === undefined ||
    venueName === undefined ||
    endsAt <= startsAt ||
    endsAt - startsAt > 24 * 60 * 60 * 1000 ||
    (capacity !== null &&
      (typeof capacity !== 'number' ||
        !Number.isInteger(capacity) ||
        capacity < 1 ||
        capacity > 10_000))
  ) {
    return invalid(body, 'The event publishing request is invalid.');
  }

  return {
    ok: true,
    command: {
      action: 'create_event',
      clientEventId: body.clientEventId,
      title: body.title.trim(),
      description,
      venueName,
      timeZone: body.timeZone,
      visibility: body.visibility,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      capacity,
    },
  };
};

const parseOccurrenceRead = (
  body: Record<string, unknown>,
  action: 'get_my_occurrence' | 'get_attendee_album'
): EventCommandParseResult => {
  if (
    !exactKeys(body, ['action', 'occurrenceId']) ||
    !isUuid(body.occurrenceId)
  ) {
    return invalid(body, 'The event occurrence request is invalid.');
  }

  return {
    ok: true,
    command:
      action === 'get_my_occurrence'
        ? { action: 'get_my_occurrence', occurrenceId: body.occurrenceId }
        : { action: 'get_attendee_album', occurrenceId: body.occurrenceId },
  };
};

const parseOrganiserRecap = (
  body: Record<string, unknown>
): EventCommandParseResult => {
  if (!exactKeys(body, ['action', 'eventId']) || !isUuid(body.eventId)) {
    return invalid(body, 'The organiser recap request is invalid.');
  }

  return {
    ok: true,
    command: { action: 'get_organiser_recap', eventId: body.eventId },
  };
};

const parseOrganiserReviewQueue = (
  body: Record<string, unknown>
): EventCommandParseResult => {
  if (
    !exactKeys(body, ['action', 'occurrenceId']) ||
    !isUuid(body.occurrenceId)
  ) {
    return invalid(body, 'The organiser review queue request is invalid.');
  }

  return {
    ok: true,
    command: {
      action: 'get_organiser_review_queue',
      occurrenceId: body.occurrenceId,
    },
  };
};

const parseMutationIds = (
  body: Record<string, unknown>,
  permitted: readonly string[]
): { occurrenceId: string; clientEventId: string } | null =>
  exactKeys(body, permitted) &&
  isUuid(body.occurrenceId) &&
  isUuid(body.clientEventId)
    ? { occurrenceId: body.occurrenceId, clientEventId: body.clientEventId }
    : null;

const parsePostMutationIds = (
  body: Record<string, unknown>,
  permitted: readonly string[]
): { postId: string; clientEventId: string } | null =>
  exactKeys(body, permitted) &&
  isUuid(body.postId) &&
  isUuid(body.clientEventId)
    ? { postId: body.postId, clientEventId: body.clientEventId }
    : null;

export const parseEventFunctionCommand = (
  body: unknown
): EventCommandParseResult => {
  if (!isRecord(body) || !isAction(body.action)) {
    return invalid(body, 'The event action is invalid.');
  }

  switch (body.action) {
    case 'create_event':
      return parseCreateEvent(body);

    case 'list_public_events':
      return parsePublicDiscovery(body);

    case 'get_event_summary':
      return parseReadSummary(body);

    case 'get_my_occurrence':
      return parseOccurrenceRead(body, 'get_my_occurrence');

    case 'get_attendee_album':
      return parseOccurrenceRead(body, 'get_attendee_album');

    case 'get_organiser_review_queue':
      return parseOrganiserReviewQueue(body);

    case 'get_organiser_recap':
      return parseOrganiserRecap(body);

    case 'join': {
      const ids = parseMutationIds(body, [
        'action',
        'occurrenceId',
        'clientEventId',
        'consentVersion',
        'shareToken',
        'inviteToken',
      ]);
      const shareToken = nullableOpaqueToken(body.shareToken);
      const inviteToken = nullableOpaqueToken(body.inviteToken);
      if (
        !ids ||
        typeof body.consentVersion !== 'string' ||
        body.consentVersion.length < 1 ||
        body.consentVersion.length > 128 ||
        shareToken === undefined ||
        inviteToken === undefined
      ) {
        return invalid(body, 'The event join request is invalid.');
      }

      return {
        ok: true,
        command: {
          action: 'join',
          ...ids,
          consentVersion: body.consentVersion,
          shareToken,
          inviteToken,
        },
      };
    }

    case 'leave': {
      const ids = parseMutationIds(body, [
        'action',
        'occurrenceId',
        'clientEventId',
      ]);
      return ids
        ? { ok: true, command: { action: 'leave', ...ids } }
        : invalid(body, 'The event leave request is invalid.');
    }

    case 'check_in': {
      const ids = parseMutationIds(body, [
        'action',
        'occurrenceId',
        'clientEventId',
        'token',
      ]);
      if (!ids || !isOpaqueToken(body.token)) {
        return invalid(body, 'The event check-in request is invalid.');
      }
      return {
        ok: true,
        command: { action: 'check_in', ...ids, token: body.token },
      };
    }

    case 'prepare_post_upload': {
      const ids = parseMutationIds(body, [
        'action',
        'occurrenceId',
        'clientEventId',
        'caption',
        'contentType',
        'byteSize',
      ]);
      const caption = nullableText(body.caption, 280);
      if (
        !ids ||
        caption === undefined ||
        !isEventMediaContentType(body.contentType) ||
        typeof body.byteSize !== 'number' ||
        !Number.isInteger(body.byteSize) ||
        body.byteSize < 1 ||
        body.byteSize > 10_000_000
      ) {
        return invalid(body, 'The event photo upload request is invalid.');
      }
      return {
        ok: true,
        command: {
          action: 'prepare_post_upload',
          ...ids,
          caption,
          contentType: body.contentType,
          byteSize: body.byteSize,
        },
      };
    }

    case 'finalise_post': {
      const ids = parsePostMutationIds(body, [
        'action',
        'postId',
        'clientEventId',
      ]);
      return ids
        ? { ok: true, command: { action: 'finalise_post', ...ids } }
        : invalid(
            body,
            'The event photo finalisation request is invalid. A storage path cannot be supplied by the client.'
          );
    }

    case 'review_post': {
      const ids = parsePostMutationIds(body, [
        'action',
        'postId',
        'clientEventId',
        'expectedRevision',
        'decision',
        'note',
      ]);
      const note = nullableText(body.note, 500);
      if (
        !ids ||
        note === undefined ||
        typeof body.expectedRevision !== 'number' ||
        !Number.isSafeInteger(body.expectedRevision) ||
        body.expectedRevision < 1 ||
        (body.decision !== 'approve' && body.decision !== 'reject')
      ) {
        return invalid(body, 'The event post review request is invalid.');
      }
      return {
        ok: true,
        command: {
          action: 'review_post',
          ...ids,
          expectedRevision: body.expectedRevision,
          decision: body.decision,
          note,
        },
      };
    }

    case 'delete_own_post': {
      const ids = parsePostMutationIds(body, [
        'action',
        'postId',
        'clientEventId',
      ]);
      return ids
        ? { ok: true, command: { action: 'delete_own_post', ...ids } }
        : invalid(body, 'The event photo deletion request is invalid.');
    }
  }
};

/**
 * Canonical, server-owned idempotency input. The client cannot provide this
 * hash, and every mutation stores the actor-bound result in the database.
 */
export const canonicalCommandForHash = (
  command: EventFunctionCommand
): string => {
  switch (command.action) {
    case 'create_event':
      return JSON.stringify({
        action: command.action,
        clientEventId: command.clientEventId,
        title: command.title,
        description: command.description,
        venueName: command.venueName,
        timeZone: command.timeZone,
        visibility: command.visibility,
        startsAt: command.startsAt,
        endsAt: command.endsAt,
        capacity: command.capacity,
      });
    case 'list_public_events':
      return JSON.stringify({ action: command.action });
    case 'get_event_summary':
      return JSON.stringify({
        action: command.action,
        eventId: command.eventId,
        shareToken: command.shareToken,
        inviteToken: command.inviteToken,
      });
    case 'get_my_occurrence':
      return JSON.stringify({
        action: command.action,
        occurrenceId: command.occurrenceId,
      });
    case 'get_attendee_album':
      return JSON.stringify({
        action: command.action,
        occurrenceId: command.occurrenceId,
      });
    case 'get_organiser_review_queue':
      return JSON.stringify({
        action: command.action,
        occurrenceId: command.occurrenceId,
      });
    case 'get_organiser_recap':
      return JSON.stringify({
        action: command.action,
        eventId: command.eventId,
      });
    case 'join':
      return JSON.stringify({
        action: command.action,
        occurrenceId: command.occurrenceId,
        clientEventId: command.clientEventId,
        consentVersion: command.consentVersion,
        shareToken: command.shareToken,
        inviteToken: command.inviteToken,
      });
    case 'leave':
      return JSON.stringify({
        action: command.action,
        occurrenceId: command.occurrenceId,
        clientEventId: command.clientEventId,
      });
    case 'check_in':
      return JSON.stringify({
        action: command.action,
        occurrenceId: command.occurrenceId,
        clientEventId: command.clientEventId,
        token: command.token,
      });
    case 'prepare_post_upload':
      return JSON.stringify({
        action: command.action,
        occurrenceId: command.occurrenceId,
        clientEventId: command.clientEventId,
        caption: command.caption,
        contentType: command.contentType,
        byteSize: command.byteSize,
      });
    case 'finalise_post':
      return JSON.stringify({
        action: command.action,
        postId: command.postId,
        clientEventId: command.clientEventId,
      });
    case 'review_post':
      return JSON.stringify({
        action: command.action,
        postId: command.postId,
        clientEventId: command.clientEventId,
        expectedRevision: command.expectedRevision,
        decision: command.decision,
        note: command.note,
      });
    case 'delete_own_post':
      return JSON.stringify({
        action: command.action,
        postId: command.postId,
        clientEventId: command.clientEventId,
      });
  }
};

export const parseCanonicalEventMediaPath = parseEventMediaPath;

export const isCanonicalEventMediaPathFor = isOwnedEventMediaPath;
