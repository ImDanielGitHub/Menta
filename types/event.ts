/**
 * Event participation is deliberately separate from promises, groups and
 * streaks. These contracts model a private, receipt-led event flow only.
 */

export const EVENT_MEDIA_BUCKET = 'event-media' as const;

export const EVENT_MEDIA_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type EventMediaContentType = (typeof EVENT_MEDIA_CONTENT_TYPES)[number];

export const EVENT_ACTIONS = [
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

export type EventAction = (typeof EVENT_ACTIONS)[number];

export type EventVisibility = 'public' | 'unlisted' | 'invite_only';

export type EventOccurrenceState = 'scheduled' | 'live' | 'ended' | 'cancelled';

export type EventAttendanceState = 'joined' | 'left' | 'removed';

export type EventPostStatus =
  | 'upload_pending'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'deleting'
  | 'deleted';

export type EventCheckInMethod = 'rotating_qr' | 'roster_single_use';

export type EventReviewDecision = 'approve' | 'reject';

export type EventOutcome = 'completed' | 'failed' | 'unknown_result';

/**
 * A completed receipt is authoritative. `unknown_result` means that the
 * client must reconcile or retry with the same clientEventId, never claim a
 * successful join, upload or deletion.
 */
export type EventReceipt<TData> = {
  action: EventAction;
  outcome: EventOutcome;
  code: string;
  message: string;
  clientEventId: string | null;
  data: TData | null;
  retryable: boolean;
  idempotent: boolean;
};

export type EventSummary = {
  eventId: string;
  occurrenceId: string;
  title: string;
  description: string | null;
  venueName: string | null;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  consentVersion: string;
  visibility: EventVisibility;
  occurrenceState: EventOccurrenceState;
  capacity: number | null;
  reservedCount: number;
  /** Present only for a possession-scoped invitation preview. */
  inviterName?: string | null;
};

/**
 * Discovery is deliberately a list of the same bounded public summaries used
 * by detail. It never exposes attendee identity, media, or private events.
 */
export type EventDiscovery = EventSummary;

export type EventCreateInput = {
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

/**
 * The server-issued organiser capabilities are shown only on the confirmed
 * publishing receipt. Event rows store hashes, never these raw values.
 */
export type EventCreated = {
  summary: EventSummary;
  publishedAt: string;
  shareToken: string | null;
  inviteToken: string | null;
  organiserCheckInCode: string;
  checkInExpiresAt: string;
};

export type EventAttendance = {
  attendanceId: string;
  occurrenceId: string;
  state: EventAttendanceState;
  consentVersion: string;
  joinedAt: string;
  checkedInAt: string | null;
  checkInMethod: EventCheckInMethod | null;
};

/**
 * This DTO only ever represents the current user's post. It intentionally
 * contains no attendee roster or other attendees' private media paths.
 */
export type EventOwnPost = {
  postId: string;
  occurrenceId: string;
  status: EventPostStatus;
  revision: number;
  caption: string | null;
  mediaPath: string | null;
  contentType: EventMediaContentType;
  byteSize: number;
  createdAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
};

export type EventMyOccurrence = {
  summary: EventSummary;
  attendance: EventAttendance | null;
  ownPosts: EventOwnPost[];
};

/**
 * An approved event moment returned to an eligible attendee or organiser.
 * The database DTO is path-free; the Edge Function attaches only a one-minute
 * read capability after validating the exact approved post row.
 */
export type EventAlbumItem = {
  postId: string;
  occurrenceId: string;
  caption: string | null;
  createdAt: string;
  attendeeUsername: string;
  checkedInAt: string;
  approvedAt: string;
  mediaPreviewUrl: string;
  mediaPreviewExpiresInSeconds: number;
};

export type EventAttendeeAlbum = {
  eventId: string;
  occurrenceId: string;
  eventTitle: string;
  viewerRole: 'attendee' | 'organiser';
  viewerCanPost: boolean;
  /** Downloads are deliberately unavailable in the v1 privacy contract. */
  downloadsAllowed: false;
  approvedPostCount: number;
  items: EventAlbumItem[];
};

export type EventRecapCounts = {
  joined: number;
  checkedIn: number;
  posted: number;
  verified: number;
};

export type EventOrganiserRecap = {
  eventId: string;
  occurrenceId: string;
  eventTitle: string;
  endedAt: string;
  timeZone: string;
  counts: EventRecapCounts;
  approvedPostCount: number;
  albumItems: EventAlbumItem[];
};

export type EventJoinInput = {
  occurrenceId: string;
  clientEventId: string;
  consentVersion: string;
  inviteToken?: string | null;
  shareToken?: string | null;
};

export type EventCheckInInput = {
  occurrenceId: string;
  clientEventId: string;
  token: string;
};

export type EventPostUploadInput = {
  occurrenceId: string;
  clientEventId: string;
  caption: string | null;
  contentType: EventMediaContentType;
  byteSize: number;
};

/**
 * `storagePath` is an internal, server-issued upload capability. It is never
 * supplied by the caller to finalise or delete an event post.
 */
export type EventPostUploadGrant = {
  postId: string;
  occurrenceId: string;
  storagePath: string;
  uploadToken: string;
  /** Supabase does not expose a reliable signed-upload expiry in this API. */
  expiresAt: string | null;
  contentType: EventMediaContentType;
  byteSize: number;
};

export type EventPostFinalised = {
  post: EventOwnPost;
};

export type EventCheckInConfirmed = {
  attendance: EventAttendance;
  checkInId: string;
  checkedInAt: string;
  method: EventCheckInMethod;
};

export type EventPostReviewResult = {
  post: EventOwnPost;
};

/**
 * The organiser queue is deliberately a different, bounded DTO from an
 * attendee's own post. It contains only the identity and receipt facts needed
 * for an organiser to make a manual decision: never an email, durable storage
 * path, upload capability, or long-lived media capability. The preview is a
 * one-minute organiser-scoped view capability issued by the Edge Function.
 */
export type EventOrganiserReviewItem = {
  postId: string;
  occurrenceId: string;
  revision: number;
  caption: string | null;
  createdAt: string;
  attendeeUsername: string;
  attendanceState: EventAttendanceState | null;
  checkedInAt: string | null;
  checkInMethod: EventCheckInMethod | null;
  hasUploadedMedia: boolean;
  /** A short-lived Edge-issued preview; never a storage path or capability. */
  mediaPreviewUrl: string;
  mediaPreviewExpiresInSeconds: number;
};

export type EventOrganiserReviewQueue = {
  eventId: string;
  occurrenceId: string;
  eventTitle: string;
  pendingCount: number;
  items: EventOrganiserReviewItem[];
};

export type EventPostDeletionResult = {
  postId: string;
  deletedAt: string;
};

export type EventPostQueueStatus =
  | 'saved_local'
  | 'uploading'
  | 'pending_review'
  | 'failed'
  | 'unknown_result';

export type EventUploadQueueItem = {
  userId: string;
  clientEventId: string;
  eventId: string;
  occurrenceId: string;
  localUri: string;
  caption: string | null;
  contentType: EventMediaContentType;
  byteSize: number;
  status: EventPostQueueStatus;
  postId: string | null;
  storagePath: string | null;
  lastReceiptCode: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EventMediaUploadResult = {
  outcome: 'completed' | 'failed' | 'unknown_result';
  code: string;
  message: string;
};

export const isEventMediaContentType = (
  value: unknown
): value is EventMediaContentType =>
  typeof value === 'string' &&
  EVENT_MEDIA_CONTENT_TYPES.includes(value as EventMediaContentType);

export const isCompletedEventReceipt = <TData>(
  receipt: EventReceipt<TData>
): receipt is EventReceipt<TData> & { outcome: 'completed'; data: TData } =>
  receipt.outcome === 'completed' && receipt.data !== null;
