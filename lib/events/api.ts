import { supabase } from '@/lib/supabase';
import { translate } from '@/lib/localization';
import {
  EVENT_MEDIA_BUCKET,
  EVENT_MEDIA_CONTENT_TYPES,
  type EventAction,
  type EventAlbumItem,
  type EventAttendeeAlbum,
  type EventAttendance,
  type EventCheckInConfirmed,
  type EventCheckInInput,
  type EventCreated,
  type EventCreateInput,
  type EventDiscovery,
  type EventJoinInput,
  type EventMediaContentType,
  type EventMediaUploadResult,
  type EventMyOccurrence,
  type EventOrganiserReviewItem,
  type EventOrganiserReviewQueue,
  type EventOrganiserRecap,
  type EventOwnPost,
  type EventPostDeletionResult,
  type EventPostFinalised,
  type EventPostReviewResult,
  type EventPostUploadGrant,
  type EventPostUploadInput,
  type EventReceipt,
  type EventReviewDecision,
  type EventSummary,
} from '@/types/event';

type UnknownRecord = Record<string, unknown>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_PATTERN.test(value);

const isOpaqueToken = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length >= 16 &&
  value.length <= 512 &&
  /^[A-Za-z0-9._~-]+$/.test(value);

const isIsoString = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value));

const asNullableString = (value: unknown): string | null =>
  typeof value === 'string' ? value : null;

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

const isEventMediaContentType = (
  value: unknown
): value is EventMediaContentType =>
  typeof value === 'string' &&
  EVENT_MEDIA_CONTENT_TYPES.includes(value as EventMediaContentType);

const isEventSummary = (value: unknown): value is EventSummary => {
  if (!isRecord(value)) return false;

  return (
    isUuid(value.eventId) &&
    isUuid(value.occurrenceId) &&
    typeof value.title === 'string' &&
    asNullableString(value.description) === value.description &&
    asNullableString(value.venueName) === value.venueName &&
    isIsoString(value.startsAt) &&
    isIsoString(value.endsAt) &&
    typeof value.timeZone === 'string' &&
    typeof value.consentVersion === 'string' &&
    value.consentVersion.length > 0 &&
    (value.visibility === 'public' ||
      value.visibility === 'unlisted' ||
      value.visibility === 'invite_only') &&
    (value.occurrenceState === 'scheduled' ||
      value.occurrenceState === 'live' ||
      value.occurrenceState === 'ended' ||
      value.occurrenceState === 'cancelled') &&
    (value.capacity === null ||
      (typeof value.capacity === 'number' &&
        Number.isInteger(value.capacity))) &&
    typeof value.reservedCount === 'number' &&
    Number.isInteger(value.reservedCount) &&
    (value.inviterName === undefined ||
      value.inviterName === null ||
      (typeof value.inviterName === 'string' &&
        value.inviterName.trim().length > 0 &&
        value.inviterName.trim().length <= 120))
  );
};

const isEventDiscoveryList = (value: unknown): value is EventDiscovery[] =>
  Array.isArray(value) && value.every(isEventSummary);

const isEventCreated = (value: unknown): value is EventCreated => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      'summary',
      'publishedAt',
      'shareToken',
      'inviteToken',
      'organiserCheckInCode',
      'checkInExpiresAt',
    ]) ||
    !isEventSummary(value.summary) ||
    !isIsoString(value.publishedAt) ||
    !isOpaqueToken(value.organiserCheckInCode) ||
    !isIsoString(value.checkInExpiresAt)
  ) {
    return false;
  }

  const shareToken =
    value.shareToken === null || isOpaqueToken(value.shareToken);
  const inviteToken =
    value.inviteToken === null || isOpaqueToken(value.inviteToken);
  if (!shareToken || !inviteToken) return false;

  return (
    (value.summary.visibility === 'public' &&
      value.shareToken === null &&
      value.inviteToken === null) ||
    (value.summary.visibility === 'unlisted' &&
      isOpaqueToken(value.shareToken) &&
      value.inviteToken === null) ||
    (value.summary.visibility === 'invite_only' &&
      value.shareToken === null &&
      isOpaqueToken(value.inviteToken))
  );
};

const isEventAttendance = (value: unknown): value is EventAttendance => {
  if (!isRecord(value)) return false;

  return (
    isUuid(value.attendanceId) &&
    isUuid(value.occurrenceId) &&
    (value.state === 'joined' ||
      value.state === 'left' ||
      value.state === 'removed') &&
    typeof value.consentVersion === 'string' &&
    isIsoString(value.joinedAt) &&
    (value.checkedInAt === null || isIsoString(value.checkedInAt)) &&
    (value.checkInMethod === null ||
      value.checkInMethod === 'rotating_qr' ||
      value.checkInMethod === 'roster_single_use')
  );
};

const isEventOwnPost = (value: unknown): value is EventOwnPost => {
  if (!isRecord(value)) return false;

  return (
    isUuid(value.postId) &&
    isUuid(value.occurrenceId) &&
    (value.status === 'upload_pending' ||
      value.status === 'pending_review' ||
      value.status === 'approved' ||
      value.status === 'rejected' ||
      value.status === 'deleting' ||
      value.status === 'deleted') &&
    typeof value.revision === 'number' &&
    Number.isInteger(value.revision) &&
    asNullableString(value.caption) === value.caption &&
    asNullableString(value.mediaPath) === value.mediaPath &&
    isEventMediaContentType(value.contentType) &&
    typeof value.byteSize === 'number' &&
    Number.isInteger(value.byteSize) &&
    isIsoString(value.createdAt) &&
    (value.reviewedAt === null || isIsoString(value.reviewedAt)) &&
    asNullableString(value.reviewNote) === value.reviewNote
  );
};

const isMyOccurrence = (value: unknown): value is EventMyOccurrence => {
  if (!isRecord(value) || !Array.isArray(value.ownPosts)) return false;

  return (
    isEventSummary(value.summary) &&
    (value.attendance === null || isEventAttendance(value.attendance)) &&
    value.ownPosts.every(isEventOwnPost)
  );
};

const hasOnlyKeys = (
  value: UnknownRecord,
  permitted: readonly string[]
): boolean => Object.keys(value).every(key => permitted.includes(key));

const isOrganiserReviewItem = (
  value: unknown
): value is EventOrganiserReviewItem => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      'postId',
      'occurrenceId',
      'revision',
      'caption',
      'createdAt',
      'attendeeUsername',
      'attendanceState',
      'checkedInAt',
      'checkInMethod',
      'hasUploadedMedia',
      'mediaPreviewUrl',
      'mediaPreviewExpiresInSeconds',
    ])
  ) {
    return false;
  }

  return (
    isUuid(value.postId) &&
    isUuid(value.occurrenceId) &&
    typeof value.revision === 'number' &&
    Number.isInteger(value.revision) &&
    value.revision > 0 &&
    asNullableString(value.caption) === value.caption &&
    isIsoString(value.createdAt) &&
    typeof value.attendeeUsername === 'string' &&
    value.attendeeUsername.length > 0 &&
    (value.attendanceState === null ||
      value.attendanceState === 'joined' ||
      value.attendanceState === 'left' ||
      value.attendanceState === 'removed') &&
    (value.checkedInAt === null || isIsoString(value.checkedInAt)) &&
    (value.checkInMethod === null ||
      value.checkInMethod === 'rotating_qr' ||
      value.checkInMethod === 'roster_single_use') &&
    typeof value.hasUploadedMedia === 'boolean' &&
    typeof value.mediaPreviewUrl === 'string' &&
    value.mediaPreviewUrl.startsWith('https://') &&
    typeof value.mediaPreviewExpiresInSeconds === 'number' &&
    Number.isInteger(value.mediaPreviewExpiresInSeconds) &&
    value.mediaPreviewExpiresInSeconds > 0 &&
    value.mediaPreviewExpiresInSeconds <= 60
  );
};

const isOrganiserReviewQueue = (
  value: unknown
): value is EventOrganiserReviewQueue => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      'eventId',
      'occurrenceId',
      'eventTitle',
      'pendingCount',
      'items',
    ]) ||
    !Array.isArray(value.items)
  ) {
    return false;
  }

  const uniquePostIds = new Set<string>();
  for (const item of value.items) {
    if (
      !isOrganiserReviewItem(item) ||
      item.occurrenceId !== value.occurrenceId
    ) {
      return false;
    }
    uniquePostIds.add(item.postId);
  }

  return (
    isUuid(value.eventId) &&
    isUuid(value.occurrenceId) &&
    typeof value.eventTitle === 'string' &&
    value.eventTitle.trim().length > 0 &&
    typeof value.pendingCount === 'number' &&
    Number.isInteger(value.pendingCount) &&
    value.pendingCount >= value.items.length &&
    value.items.length <= 100 &&
    uniquePostIds.size === value.items.length
  );
};

const isAlbumItem = (value: unknown): value is EventAlbumItem => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      'postId',
      'occurrenceId',
      'caption',
      'createdAt',
      'attendeeUsername',
      'checkedInAt',
      'approvedAt',
      'mediaPreviewUrl',
      'mediaPreviewExpiresInSeconds',
    ])
  ) {
    return false;
  }

  return (
    isUuid(value.postId) &&
    isUuid(value.occurrenceId) &&
    asNullableString(value.caption) === value.caption &&
    isIsoString(value.createdAt) &&
    typeof value.attendeeUsername === 'string' &&
    value.attendeeUsername.trim().length > 0 &&
    isIsoString(value.checkedInAt) &&
    isIsoString(value.approvedAt) &&
    typeof value.mediaPreviewUrl === 'string' &&
    value.mediaPreviewUrl.startsWith('https://') &&
    typeof value.mediaPreviewExpiresInSeconds === 'number' &&
    Number.isInteger(value.mediaPreviewExpiresInSeconds) &&
    value.mediaPreviewExpiresInSeconds > 0 &&
    value.mediaPreviewExpiresInSeconds <= 60
  );
};

const hasUniqueAlbumItemsForOccurrence = (
  items: unknown[],
  occurrenceId: unknown
): items is EventAlbumItem[] => {
  const postIds = new Set<string>();
  for (const item of items) {
    if (
      !isAlbumItem(item) ||
      item.occurrenceId !== occurrenceId ||
      postIds.has(item.postId)
    ) {
      return false;
    }
    postIds.add(item.postId);
  }
  return true;
};

const isAttendeeAlbum = (value: unknown): value is EventAttendeeAlbum => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      'eventId',
      'occurrenceId',
      'eventTitle',
      'viewerRole',
      'viewerCanPost',
      'downloadsAllowed',
      'approvedPostCount',
      'items',
    ]) ||
    !Array.isArray(value.items) ||
    !hasUniqueAlbumItemsForOccurrence(value.items, value.occurrenceId)
  ) {
    return false;
  }

  return (
    isUuid(value.eventId) &&
    isUuid(value.occurrenceId) &&
    typeof value.eventTitle === 'string' &&
    value.eventTitle.trim().length > 0 &&
    (value.viewerRole === 'attendee' || value.viewerRole === 'organiser') &&
    typeof value.viewerCanPost === 'boolean' &&
    value.downloadsAllowed === false &&
    isNonNegativeInteger(value.approvedPostCount) &&
    value.approvedPostCount >= value.items.length &&
    value.items.length <= 24
  );
};

const isOrganiserRecap = (value: unknown): value is EventOrganiserRecap => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      'eventId',
      'occurrenceId',
      'eventTitle',
      'endedAt',
      'timeZone',
      'counts',
      'approvedPostCount',
      'albumItems',
    ]) ||
    !isRecord(value.counts) ||
    !hasOnlyKeys(value.counts, ['joined', 'checkedIn', 'posted', 'verified']) ||
    !Array.isArray(value.albumItems) ||
    !hasUniqueAlbumItemsForOccurrence(value.albumItems, value.occurrenceId)
  ) {
    return false;
  }

  const { joined, checkedIn, posted, verified } = value.counts;
  return (
    isUuid(value.eventId) &&
    isUuid(value.occurrenceId) &&
    typeof value.eventTitle === 'string' &&
    value.eventTitle.trim().length > 0 &&
    isIsoString(value.endedAt) &&
    typeof value.timeZone === 'string' &&
    value.timeZone.length > 0 &&
    isNonNegativeInteger(joined) &&
    isNonNegativeInteger(checkedIn) &&
    isNonNegativeInteger(posted) &&
    isNonNegativeInteger(verified) &&
    checkedIn <= joined &&
    posted <= joined &&
    verified <= posted &&
    isNonNegativeInteger(value.approvedPostCount) &&
    value.approvedPostCount >= value.albumItems.length &&
    value.albumItems.length <= 12
  );
};

const isPostUploadGrant = (value: unknown): value is EventPostUploadGrant => {
  if (!isRecord(value)) return false;

  return (
    isUuid(value.postId) &&
    isUuid(value.occurrenceId) &&
    typeof value.storagePath === 'string' &&
    typeof value.uploadToken === 'string' &&
    (value.expiresAt === null || isIsoString(value.expiresAt)) &&
    isEventMediaContentType(value.contentType) &&
    typeof value.byteSize === 'number' &&
    Number.isInteger(value.byteSize)
  );
};

const isPostFinalised = (value: unknown): value is EventPostFinalised =>
  isRecord(value) && isEventOwnPost(value.post);

const isPostReviewResult = (value: unknown): value is EventPostReviewResult =>
  isRecord(value) && isEventOwnPost(value.post);

const isCheckInConfirmed = (value: unknown): value is EventCheckInConfirmed =>
  isRecord(value) &&
  isEventAttendance(value.attendance) &&
  isUuid(value.checkInId) &&
  isIsoString(value.checkedInAt) &&
  (value.method === 'rotating_qr' || value.method === 'roster_single_use');

const isPostDeletionResult = (
  value: unknown
): value is EventPostDeletionResult =>
  isRecord(value) && isUuid(value.postId) && isIsoString(value.deletedAt);

const unknownReceipt = <TData>(
  action: EventAction,
  clientEventId: string | null,
  code: string,
  message: string
): EventReceipt<TData> => ({
  action,
  outcome: 'unknown_result',
  code,
  message,
  clientEventId,
  data: null,
  retryable: true,
  idempotent: false,
});

const parseReceipt = <TData>(
  body: unknown,
  action: EventAction,
  clientEventId: string | null,
  parseData: (value: unknown) => value is TData
): EventReceipt<TData> | null => {
  if (!isRecord(body) || !isRecord(body.receipt)) return null;

  const receipt = body.receipt;
  if (
    receipt.action !== action ||
    (receipt.outcome !== 'completed' &&
      receipt.outcome !== 'failed' &&
      receipt.outcome !== 'unknown_result') ||
    typeof receipt.code !== 'string' ||
    typeof receipt.message !== 'string' ||
    (receipt.clientEventId !== null && !isUuid(receipt.clientEventId)) ||
    typeof receipt.retryable !== 'boolean' ||
    typeof receipt.idempotent !== 'boolean'
  ) {
    return null;
  }

  if (receipt.outcome === 'completed') {
    if (!parseData(receipt.data)) return null;

    return {
      action,
      outcome: 'completed',
      code: receipt.code,
      message: receipt.message,
      clientEventId: receipt.clientEventId,
      data: receipt.data,
      retryable: receipt.retryable,
      idempotent: receipt.idempotent,
    };
  }

  return {
    action,
    outcome: receipt.outcome,
    code: receipt.code,
    message: receipt.message,
    clientEventId: receipt.clientEventId ?? clientEventId,
    data: null,
    retryable: receipt.retryable,
    idempotent: receipt.idempotent,
  };
};

const invokeEventAction = async <TData>(input: {
  action: EventAction;
  clientEventId: string | null;
  payload: UnknownRecord;
  parseData: (value: unknown) => value is TData;
}): Promise<EventReceipt<TData>> => {
  try {
    const { data, error } = await supabase.functions.invoke(
      'event-participation',
      {
        body: { action: input.action, ...input.payload },
      }
    );

    if (error) {
      return unknownReceipt(
        input.action,
        input.clientEventId,
        'FUNCTION_TRANSPORT_FAILED',
        "We couldn't tell whether the event action went through. Check its status before trying again."
      );
    }

    const parsed = parseReceipt(
      data,
      input.action,
      input.clientEventId,
      input.parseData
    );
    if (parsed) return parsed;

    return unknownReceipt(
      input.action,
      input.clientEventId,
      'MALFORMED_SERVER_RECEIPT',
      "Menta couldn't read the result. Check what changed before trying again."
    );
  } catch {
    return unknownReceipt(
      input.action,
      input.clientEventId,
      'FUNCTION_TRANSPORT_FAILED',
      "We couldn't tell whether the event action went through. Check its status before trying again."
    );
  }
};

export const getEventSummary = async (input: {
  eventId: string;
  shareToken?: string | null;
  inviteToken?: string | null;
}): Promise<EventReceipt<EventSummary>> =>
  invokeEventAction({
    action: 'get_event_summary',
    clientEventId: null,
    payload: {
      eventId: input.eventId,
      shareToken: input.shareToken ?? null,
      inviteToken: input.inviteToken ?? null,
    },
    parseData: isEventSummary,
  });

export const createEvent = async (
  input: EventCreateInput
): Promise<EventReceipt<EventCreated>> =>
  invokeEventAction({
    action: 'create_event',
    clientEventId: input.clientEventId,
    payload: input,
    parseData: isEventCreated,
  });

export const listPublicEvents = async (): Promise<
  EventReceipt<EventDiscovery[]>
> =>
  invokeEventAction({
    action: 'list_public_events',
    clientEventId: null,
    payload: {},
    parseData: isEventDiscoveryList,
  });

export const getMyEventOccurrence = async (
  occurrenceId: string
): Promise<EventReceipt<EventMyOccurrence>> =>
  invokeEventAction({
    action: 'get_my_occurrence',
    clientEventId: null,
    payload: { occurrenceId },
    parseData: isMyOccurrence,
  });

export const getAttendeeEventAlbum = async (
  occurrenceId: string
): Promise<EventReceipt<EventAttendeeAlbum>> =>
  invokeEventAction({
    action: 'get_attendee_album',
    clientEventId: null,
    payload: { occurrenceId },
    parseData: isAttendeeAlbum,
  });

export const getOrganiserReviewQueue = async (
  occurrenceId: string
): Promise<EventReceipt<EventOrganiserReviewQueue>> =>
  invokeEventAction({
    action: 'get_organiser_review_queue',
    clientEventId: null,
    payload: { occurrenceId },
    parseData: isOrganiserReviewQueue,
  });

export const getOrganiserEventRecap = async (
  eventId: string
): Promise<EventReceipt<EventOrganiserRecap>> =>
  invokeEventAction({
    action: 'get_organiser_recap',
    clientEventId: null,
    payload: { eventId },
    parseData: isOrganiserRecap,
  });

export const joinEventOccurrence = async (
  input: EventJoinInput
): Promise<EventReceipt<EventAttendance>> =>
  invokeEventAction({
    action: 'join',
    clientEventId: input.clientEventId,
    payload: {
      occurrenceId: input.occurrenceId,
      clientEventId: input.clientEventId,
      consentVersion: input.consentVersion,
      inviteToken: input.inviteToken ?? null,
      shareToken: input.shareToken ?? null,
    },
    parseData: isEventAttendance,
  });

export const leaveEventOccurrence = async (input: {
  occurrenceId: string;
  clientEventId: string;
}): Promise<EventReceipt<EventAttendance>> =>
  invokeEventAction({
    action: 'leave',
    clientEventId: input.clientEventId,
    payload: input,
    parseData: isEventAttendance,
  });

export const checkInToEventOccurrence = async (
  input: EventCheckInInput
): Promise<EventReceipt<EventCheckInConfirmed>> =>
  invokeEventAction({
    action: 'check_in',
    clientEventId: input.clientEventId,
    payload: {
      occurrenceId: input.occurrenceId,
      clientEventId: input.clientEventId,
      token: input.token,
    },
    parseData: isCheckInConfirmed,
  });

export const prepareEventPostUpload = async (
  input: EventPostUploadInput
): Promise<EventReceipt<EventPostUploadGrant>> =>
  invokeEventAction({
    action: 'prepare_post_upload',
    clientEventId: input.clientEventId,
    payload: input,
    parseData: isPostUploadGrant,
  });

export const finaliseEventPost = async (input: {
  postId: string;
  clientEventId: string;
}): Promise<EventReceipt<EventPostFinalised>> =>
  invokeEventAction({
    action: 'finalise_post',
    clientEventId: input.clientEventId,
    payload: input,
    parseData: isPostFinalised,
  });

export const reviewEventPost = async (input: {
  postId: string;
  expectedRevision: number;
  decision: EventReviewDecision;
  note?: string | null;
  clientEventId: string;
}): Promise<EventReceipt<EventPostReviewResult>> =>
  invokeEventAction({
    action: 'review_post',
    clientEventId: input.clientEventId,
    payload: { ...input, note: input.note ?? null },
    parseData: isPostReviewResult,
  });

export const deleteOwnEventPost = async (input: {
  postId: string;
  clientEventId: string;
}): Promise<EventReceipt<EventPostDeletionResult>> =>
  invokeEventAction({
    action: 'delete_own_post',
    clientEventId: input.clientEventId,
    payload: input,
    parseData: isPostDeletionResult,
  });

/**
 * Uploads actual local bytes with the one-time, server-issued token. A storage
 * transport failure is deliberately `unknown_result`: the bytes may have made
 * it to Storage, so the caller should reconcile by finalising before reupload.
 */
export const uploadEventMediaBytes = async (input: {
  localUri: string;
  grant: EventPostUploadGrant;
}): Promise<EventMediaUploadResult> => {
  let blob: Blob;

  try {
    const localResponse = await fetch(input.localUri);
    if (!localResponse.ok) {
      return {
        outcome: 'failed',
        code: 'LOCAL_MEDIA_UNAVAILABLE',
        message: translate('en-NZ', 'domain.events.saved_photo_unavailable'),
      };
    }
    blob = await localResponse.blob();
  } catch {
    return {
      outcome: 'failed',
      code: 'LOCAL_MEDIA_UNAVAILABLE',
      message: translate('en-NZ', 'domain.events.saved_photo_unavailable'),
    };
  }

  if (blob.size !== input.grant.byteSize) {
    return {
      outcome: 'failed',
      code: 'LOCAL_MEDIA_SIZE_MISMATCH',
      message: translate('en-NZ', 'domain.events.saved_photo_changed'),
    };
  }

  try {
    const { error } = await supabase.storage
      .from(EVENT_MEDIA_BUCKET)
      .uploadToSignedUrl(
        input.grant.storagePath,
        input.grant.uploadToken,
        blob,
        {
          contentType: input.grant.contentType,
          upsert: false,
        }
      );

    if (error) {
      return {
        outcome: 'unknown_result',
        code: 'MEDIA_UPLOAD_UNCONFIRMED',
        message: translate('en-NZ', 'domain.events.photo_arrival_unknown'),
      };
    }

    return {
      outcome: 'completed',
      code: 'MEDIA_BYTES_UPLOADED',
      message: translate('en-NZ', 'domain.events.photo_status_updating'),
    };
  } catch {
    return {
      outcome: 'unknown_result',
      code: 'MEDIA_UPLOAD_UNCONFIRMED',
      message: translate('en-NZ', 'domain.events.photo_arrival_unknown'),
    };
  }
};

export const createLocalEventReceipt = <TData>(input: {
  action: EventAction;
  clientEventId: string | null;
  outcome: EventReceipt<TData>['outcome'];
  code: string;
  message: string;
  retryable: boolean;
}): EventReceipt<TData> => ({
  action: input.action,
  outcome: input.outcome,
  code: input.code,
  message: input.message,
  clientEventId: input.clientEventId,
  data: null,
  retryable: input.retryable,
  idempotent: false,
});
