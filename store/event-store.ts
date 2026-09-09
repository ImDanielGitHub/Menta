import { create } from 'zustand';
import { createClientEventId } from '@/lib/client-event-id';
import { translate } from '@/lib/localization';
import {
  checkInToEventOccurrence,
  createEvent,
  createLocalEventReceipt,
  deleteOwnEventPost,
  finaliseEventPost,
  getAttendeeEventAlbum,
  getOrganiserReviewQueue,
  getOrganiserEventRecap,
  getEventSummary,
  getMyEventOccurrence,
  joinEventOccurrence,
  listPublicEvents,
  leaveEventOccurrence,
  prepareEventPostUpload,
  reviewEventPost,
  uploadEventMediaBytes,
} from '@/lib/events/api';
import {
  drainEventUploadQueue,
  getEventUploadDraft,
  removeEventUploadDraft,
  serialiseEventUploadForUser,
  updateEventUploadDraft,
  upsertEventUploadDraft,
} from '@/lib/events/upload-queue';
import { supabase } from '@/lib/supabase';
import type {
  EventAction,
  EventAttendance,
  EventAttendeeAlbum,
  EventCheckInConfirmed,
  EventCheckInInput,
  EventCreated,
  EventCreateInput,
  EventDiscovery,
  EventJoinInput,
  EventMyOccurrence,
  EventOrganiserReviewQueue,
  EventOrganiserRecap,
  EventOwnPost,
  EventPostDeletionResult,
  EventPostFinalised,
  EventPostQueueStatus,
  EventPostReviewResult,
  EventReceipt,
  EventReviewDecision,
  EventSummary,
  EventUploadQueueItem,
} from '@/types/event';

type EventStore = {
  publicEvents: EventDiscovery[];
  publicEventsLoading: boolean;
  publicEventsError: string | null;
  summary: EventSummary | null;
  myOccurrence: EventMyOccurrence | null;
  attendeeAlbum: EventAttendeeAlbum | null;
  attendeeAlbumAccountId: string | null;
  attendeeAlbumOccurrenceId: string | null;
  attendeeAlbumLoading: boolean;
  attendeeAlbumError: string | null;
  organiserReviewQueue: EventOrganiserReviewQueue | null;
  organiserReviewAccountId: string | null;
  organiserReviewLoading: boolean;
  organiserReviewError: string | null;
  organiserRecap: EventOrganiserRecap | null;
  organiserRecapAccountId: string | null;
  organiserRecapEventId: string | null;
  organiserRecapLoading: boolean;
  organiserRecapError: string | null;
  loading: boolean;
  error: string | null;
  clearEventData: () => void;
  loadPublicEvents: () => Promise<EventReceipt<EventDiscovery[]>>;
  publishEvent: (
    input: EventCreateInput,
    expectedUserId: string
  ) => Promise<EventReceipt<EventCreated>>;
  loadSummary: (input: {
    eventId: string;
    shareToken?: string | null;
    inviteToken?: string | null;
  }) => Promise<EventReceipt<EventSummary>>;
  loadMyOccurrence: (
    occurrenceId: string
  ) => Promise<EventReceipt<EventMyOccurrence>>;
  loadAttendeeAlbum: (
    occurrenceId: string
  ) => Promise<EventReceipt<EventAttendeeAlbum>>;
  loadOrganiserReviewQueue: (
    occurrenceId: string
  ) => Promise<EventReceipt<EventOrganiserReviewQueue>>;
  loadOrganiserRecap: (
    eventId: string
  ) => Promise<EventReceipt<EventOrganiserRecap>>;
  joinEvent: (input: EventJoinInput) => Promise<EventReceipt<EventAttendance>>;
  leaveEvent: (input: {
    occurrenceId: string;
    clientEventId?: string;
  }) => Promise<EventReceipt<EventAttendance>>;
  checkIn: (
    input: EventCheckInInput
  ) => Promise<EventReceipt<EventCheckInConfirmed>>;
  submitPost: (input: {
    eventId: string;
    occurrenceId: string;
    localUri: string;
    caption: string | null;
    contentType: EventUploadQueueItem['contentType'];
    byteSize: number;
    clientEventId?: string;
  }) => Promise<EventReceipt<EventPostFinalised>>;
  resumePost: (
    clientEventId: string
  ) => Promise<EventReceipt<EventPostFinalised>>;
  drainPosts: () => Promise<EventReceipt<EventPostFinalised>[]>;
  reviewPost: (input: {
    postId: string;
    expectedRevision: number;
    decision: EventReviewDecision;
    note?: string | null;
    clientEventId?: string;
  }) => Promise<EventReceipt<EventPostReviewResult>>;
  reviewOrganiserPost: (input: {
    occurrenceId: string;
    postId: string;
    expectedRevision: number;
    decision: EventReviewDecision;
    note?: string | null;
    clientEventId: string;
  }) => Promise<EventReceipt<EventPostReviewResult>>;
  deletePost: (input: {
    postId: string;
    clientEventId?: string;
  }) => Promise<EventReceipt<EventPostDeletionResult>>;
};

const updateMyOccurrenceAttendance = (
  current: EventMyOccurrence | null,
  attendance: EventAttendance
): EventMyOccurrence | null =>
  current && current.summary.occurrenceId === attendance.occurrenceId
    ? { ...current, attendance }
    : current;

const updateMyOccurrencePost = (
  current: EventMyOccurrence | null,
  post: EventOwnPost
): EventMyOccurrence | null => {
  if (!current || current.summary.occurrenceId !== post.occurrenceId) {
    return current;
  }

  const index = current.ownPosts.findIndex(item => item.postId === post.postId);
  const ownPosts =
    index < 0
      ? [...current.ownPosts, post]
      : current.ownPosts.map(item =>
          item.postId === post.postId ? post : item
        );
  return { ...current, ownPosts };
};

const activeUserId = async (): Promise<string | null> => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  // This identity only scopes in-memory state across auth changes. Every read
  // and mutation is still authorised by the server against its request JWT.
  return error ? null : (session?.user.id ?? null);
};

let eventPrivateStateEpoch = 0;

type EventPrivateRequestScope = {
  accountId: string | null;
  epoch: number;
};

const captureEventPrivateRequestScope =
  async (): Promise<EventPrivateRequestScope | null> => {
    const epoch = eventPrivateStateEpoch;
    const accountId = await activeUserId();

    return epoch === eventPrivateStateEpoch ? { accountId, epoch } : null;
  };

const isEventPrivateRequestScopeCurrent = async (
  scope: EventPrivateRequestScope
): Promise<boolean> => {
  if (scope.epoch !== eventPrivateStateEpoch) return false;

  const accountId = await activeUserId();
  return (
    scope.epoch === eventPrivateStateEpoch && accountId === scope.accountId
  );
};

const isEventPrivateRequestEpochCurrent = (
  scope: EventPrivateRequestScope
): boolean => scope.epoch === eventPrivateStateEpoch;

const createEventAccountChangedActionReceipt = <TData>(input: {
  action: EventAction;
  clientEventId: string | null;
  outcome: 'failed' | 'unknown_result';
  message: string;
}): EventReceipt<TData> =>
  createLocalEventReceipt<TData>({
    action: input.action,
    clientEventId: input.clientEventId,
    outcome: input.outcome,
    code: 'EVENT_ACCOUNT_CHANGED',
    message: input.message,
    retryable: true,
  });

const createEventAccountChangedReceipt = (
  input: EventCreateInput,
  outcome: 'failed' | 'unknown_result'
): EventReceipt<EventCreated> =>
  createLocalEventReceipt<EventCreated>({
    action: 'create_event',
    clientEventId: input.clientEventId,
    outcome,
    code: 'EVENT_ACCOUNT_CHANGED',
    message:
      outcome === 'unknown_result'
        ? translate('en-NZ', 'domain.eventStore.publishing_account_changed')
        : translate('en-NZ', 'domain.eventStore.event_other_account'),
    retryable: true,
  });

const localStatusForReceipt = (
  receipt: EventReceipt<unknown>
): EventPostQueueStatus =>
  receipt.outcome === 'unknown_result'
    ? 'unknown_result'
    : receipt.outcome === 'completed'
      ? 'pending_review'
      : 'failed';

const processQueuedPost = async (
  item: EventUploadQueueItem,
  existingScope?: EventPrivateRequestScope
): Promise<EventReceipt<EventPostFinalised>> => {
  const requestScope =
    existingScope ?? (await captureEventPrivateRequestScope());
  if (
    !requestScope ||
    requestScope.accountId !== item.userId ||
    !isEventPrivateRequestEpochCurrent(requestScope)
  ) {
    return createEventAccountChangedActionReceipt<EventPostFinalised>({
      action: 'finalise_post',
      clientEventId: item.clientEventId,
      outcome: 'failed',
      message: translate('en-NZ', 'domain.eventStore.photo_other_account'),
    });
  }

  if (item.status === 'unknown_result' && item.postId) {
    const reconciliation = await finaliseEventPost({
      postId: item.postId,
      clientEventId: item.clientEventId,
    });

    if (!isEventPrivateRequestEpochCurrent(requestScope)) {
      return createEventAccountChangedActionReceipt<EventPostFinalised>({
        action: 'finalise_post',
        clientEventId: item.clientEventId,
        outcome: 'unknown_result',
        message: translate('en-NZ', 'domain.eventStore.checking_saved_photo'),
      });
    }

    if (reconciliation.outcome === 'completed') {
      await removeEventUploadDraft(item.userId, item.clientEventId);
      return reconciliation;
    }

    if (
      reconciliation.outcome === 'unknown_result' ||
      reconciliation.code !== 'OBJECT_NOT_READY'
    ) {
      await updateEventUploadDraft(item.userId, item.clientEventId, {
        status: localStatusForReceipt(reconciliation),
        lastReceiptCode: reconciliation.code,
        lastError: reconciliation.message,
      });
      return reconciliation;
    }
  }

  const preparation = await prepareEventPostUpload({
    occurrenceId: item.occurrenceId,
    clientEventId: item.clientEventId,
    caption: item.caption,
    contentType: item.contentType,
    byteSize: item.byteSize,
  });

  if (!isEventPrivateRequestEpochCurrent(requestScope)) {
    return createEventAccountChangedActionReceipt<EventPostFinalised>({
      action: 'finalise_post',
      clientEventId: item.clientEventId,
      outcome: 'unknown_result',
      message: translate(
        'en-NZ',
        'domain.eventStore.prepare_photo_account_changed'
      ),
    });
  }

  if (preparation.outcome !== 'completed' || !preparation.data) {
    await updateEventUploadDraft(item.userId, item.clientEventId, {
      status: localStatusForReceipt(preparation),
      lastReceiptCode: preparation.code,
      lastError: preparation.message,
    });
    return createLocalEventReceipt({
      action: 'finalise_post',
      clientEventId: item.clientEventId,
      outcome: preparation.outcome,
      code: preparation.code,
      message: preparation.message,
      retryable: preparation.retryable,
    });
  }

  await updateEventUploadDraft(item.userId, item.clientEventId, {
    status: 'uploading',
    postId: preparation.data.postId,
    storagePath: preparation.data.storagePath,
    lastReceiptCode: preparation.code,
    lastError: null,
  });

  if (!isEventPrivateRequestEpochCurrent(requestScope)) {
    return createEventAccountChangedActionReceipt<EventPostFinalised>({
      action: 'finalise_post',
      clientEventId: item.clientEventId,
      outcome: 'unknown_result',
      message: translate(
        'en-NZ',
        'domain.eventStore.send_photo_account_changed'
      ),
    });
  }

  const upload = await uploadEventMediaBytes({
    localUri: item.localUri,
    grant: preparation.data,
  });
  if (!isEventPrivateRequestEpochCurrent(requestScope)) {
    return createEventAccountChangedActionReceipt<EventPostFinalised>({
      action: 'finalise_post',
      clientEventId: item.clientEventId,
      outcome: 'unknown_result',
      message: translate('en-NZ', 'domain.eventStore.checking_photo_arrival'),
    });
  }

  if (upload.outcome !== 'completed') {
    await updateEventUploadDraft(item.userId, item.clientEventId, {
      status: upload.outcome === 'unknown_result' ? 'unknown_result' : 'failed',
      lastReceiptCode: upload.code,
      lastError: upload.message,
    });
    return createLocalEventReceipt({
      action: 'finalise_post',
      clientEventId: item.clientEventId,
      outcome: upload.outcome,
      code: upload.code,
      message: upload.message,
      retryable: upload.outcome === 'unknown_result',
    });
  }

  const finalisation = await finaliseEventPost({
    postId: preparation.data.postId,
    clientEventId: item.clientEventId,
  });
  if (!(await isEventPrivateRequestScopeCurrent(requestScope))) {
    return createEventAccountChangedActionReceipt<EventPostFinalised>({
      action: 'finalise_post',
      clientEventId: item.clientEventId,
      outcome: 'unknown_result',
      message: translate('en-NZ', 'domain.eventStore.photo_status_updating'),
    });
  }

  if (finalisation.outcome === 'completed') {
    await removeEventUploadDraft(item.userId, item.clientEventId);
  } else {
    await updateEventUploadDraft(item.userId, item.clientEventId, {
      status: localStatusForReceipt(finalisation),
      lastReceiptCode: finalisation.code,
      lastError: finalisation.message,
    });
  }

  return finalisation;
};

export const useEventStore = create<EventStore>((set, get) => ({
  publicEvents: [],
  publicEventsLoading: false,
  publicEventsError: null,
  summary: null,
  myOccurrence: null,
  attendeeAlbum: null,
  attendeeAlbumAccountId: null,
  attendeeAlbumOccurrenceId: null,
  attendeeAlbumLoading: false,
  attendeeAlbumError: null,
  organiserReviewQueue: null,
  organiserReviewAccountId: null,
  organiserReviewLoading: false,
  organiserReviewError: null,
  organiserRecap: null,
  organiserRecapAccountId: null,
  organiserRecapEventId: null,
  organiserRecapLoading: false,
  organiserRecapError: null,
  loading: false,
  error: null,

  clearEventData: () => {
    eventPrivateStateEpoch += 1;
    set({
      publicEvents: [],
      publicEventsLoading: false,
      publicEventsError: null,
      summary: null,
      myOccurrence: null,
      attendeeAlbum: null,
      attendeeAlbumAccountId: null,
      attendeeAlbumOccurrenceId: null,
      attendeeAlbumLoading: false,
      attendeeAlbumError: null,
      organiserReviewQueue: null,
      organiserReviewAccountId: null,
      organiserReviewLoading: false,
      organiserReviewError: null,
      organiserRecap: null,
      organiserRecapAccountId: null,
      organiserRecapEventId: null,
      organiserRecapLoading: false,
      organiserRecapError: null,
      loading: false,
      error: null,
    });
  },

  loadPublicEvents: async () => {
    set({ publicEventsLoading: true, publicEventsError: null });
    const receipt = await listPublicEvents();
    set({
      publicEvents:
        receipt.outcome === 'completed' && receipt.data
          ? receipt.data
          : get().publicEvents,
      publicEventsLoading: false,
      publicEventsError:
        receipt.outcome === 'completed' ? null : receipt.message,
    });
    return receipt;
  },

  publishEvent: async (input, expectedUserId) => {
    const requestScope = await captureEventPrivateRequestScope();
    if (!requestScope || requestScope.accountId !== expectedUserId) {
      return createEventAccountChangedReceipt(input, 'failed');
    }

    const receipt = await createEvent(input);
    if (!(await isEventPrivateRequestScopeCurrent(requestScope))) {
      return createEventAccountChangedReceipt(input, 'unknown_result');
    }

    if (receipt.outcome === 'completed' && receipt.data) {
      const created = receipt.data;
      set(state => ({
        summary: created.summary,
        publicEvents:
          created.summary.visibility === 'public'
            ? [
                created.summary,
                ...state.publicEvents.filter(
                  event => event.eventId !== created.summary.eventId
                ),
              ].sort((left, right) =>
                left.startsAt.localeCompare(right.startsAt)
              )
            : state.publicEvents,
        error: null,
      }));
    } else {
      set({ error: receipt.message });
    }
    return receipt;
  },

  loadSummary: async input => {
    const requestScope = await captureEventPrivateRequestScope();
    if (!requestScope) {
      return createEventAccountChangedActionReceipt<EventSummary>({
        action: 'get_event_summary',
        clientEventId: null,
        outcome: 'failed',
        message: translate(
          'en-NZ',
          'domain.eventStore.event_open_account_changed'
        ),
      });
    }

    set({ loading: true, error: null });
    const receipt = await getEventSummary(input);
    if (!(await isEventPrivateRequestScopeCurrent(requestScope))) {
      return createEventAccountChangedActionReceipt<EventSummary>({
        action: 'get_event_summary',
        clientEventId: null,
        outcome: 'unknown_result',
        message: translate(
          'en-NZ',
          'domain.eventStore.event_load_account_changed'
        ),
      });
    }

    set({
      summary: receipt.outcome === 'completed' ? receipt.data : get().summary,
      loading: false,
      error: receipt.outcome === 'completed' ? null : receipt.message,
    });
    return receipt;
  },

  loadMyOccurrence: async occurrenceId => {
    const requestScope = await captureEventPrivateRequestScope();
    if (!requestScope) {
      return createEventAccountChangedActionReceipt<EventMyOccurrence>({
        action: 'get_my_occurrence',
        clientEventId: null,
        outcome: 'failed',
        message: translate(
          'en-NZ',
          'domain.eventStore.details_open_account_changed'
        ),
      });
    }

    set({ loading: true, error: null });
    const receipt = await getMyEventOccurrence(occurrenceId);
    if (!(await isEventPrivateRequestScopeCurrent(requestScope))) {
      return createEventAccountChangedActionReceipt<EventMyOccurrence>({
        action: 'get_my_occurrence',
        clientEventId: null,
        outcome: 'unknown_result',
        message: translate(
          'en-NZ',
          'domain.eventStore.details_load_account_changed'
        ),
      });
    }

    set({
      myOccurrence:
        receipt.outcome === 'completed' ? receipt.data : get().myOccurrence,
      loading: false,
      error: receipt.outcome === 'completed' ? null : receipt.message,
    });
    return receipt;
  },

  loadAttendeeAlbum: async occurrenceId => {
    const requestScope = await captureEventPrivateRequestScope();
    if (!requestScope) {
      return createEventAccountChangedActionReceipt<EventAttendeeAlbum>({
        action: 'get_attendee_album',
        clientEventId: null,
        outcome: 'failed',
        message: translate(
          'en-NZ',
          'domain.eventStore.album_open_account_changed'
        ),
      });
    }

    const accountId = requestScope.accountId;
    if (!accountId) {
      const receipt = createLocalEventReceipt<EventAttendeeAlbum>({
        action: 'get_attendee_album',
        clientEventId: null,
        outcome: 'failed',
        code: 'AUTHENTICATION_REQUIRED',
        message: translate('en-NZ', 'domain.eventStore.sign_in_album'),
        retryable: false,
      });
      set({
        attendeeAlbum: null,
        attendeeAlbumAccountId: null,
        attendeeAlbumOccurrenceId: null,
        attendeeAlbumLoading: false,
        attendeeAlbumError: receipt.message,
      });
      return receipt;
    }

    set(state => ({
      attendeeAlbum:
        state.attendeeAlbumAccountId === accountId &&
        state.attendeeAlbum?.occurrenceId === occurrenceId
          ? state.attendeeAlbum
          : null,
      attendeeAlbumAccountId: accountId,
      attendeeAlbumOccurrenceId: occurrenceId,
      attendeeAlbumLoading: true,
      attendeeAlbumError: null,
    }));
    const receipt = await getAttendeeEventAlbum(occurrenceId);
    if (!(await isEventPrivateRequestScopeCurrent(requestScope))) {
      set(state =>
        state.attendeeAlbumAccountId === accountId &&
        state.attendeeAlbumOccurrenceId === occurrenceId
          ? {
              attendeeAlbum: null,
              attendeeAlbumAccountId: null,
              attendeeAlbumOccurrenceId: null,
              attendeeAlbumLoading: false,
              attendeeAlbumError: null,
            }
          : state
      );
      return createLocalEventReceipt<EventAttendeeAlbum>({
        action: 'get_attendee_album',
        clientEventId: null,
        outcome: 'unknown_result',
        code: 'EVENT_ACCOUNT_CHANGED',
        message: translate(
          'en-NZ',
          'domain.eventStore.album_load_account_changed'
        ),
        retryable: true,
      });
    }

    if (receipt.outcome === 'completed' && receipt.data) {
      set(state =>
        state.attendeeAlbumAccountId === accountId &&
        state.attendeeAlbumOccurrenceId === occurrenceId
          ? {
              attendeeAlbum: receipt.data,
              attendeeAlbumLoading: false,
              attendeeAlbumError: null,
            }
          : state
      );
    } else {
      set(state =>
        state.attendeeAlbumAccountId === accountId &&
        state.attendeeAlbumOccurrenceId === occurrenceId
          ? {
              attendeeAlbum:
                state.attendeeAlbum?.occurrenceId === occurrenceId
                  ? state.attendeeAlbum
                  : null,
              attendeeAlbumLoading: false,
              attendeeAlbumError: receipt.message,
            }
          : state
      );
    }
    return receipt;
  },

  loadOrganiserReviewQueue: async occurrenceId => {
    const requestScope = await captureEventPrivateRequestScope();
    if (!requestScope) {
      return createEventAccountChangedActionReceipt<EventOrganiserReviewQueue>({
        action: 'get_organiser_review_queue',
        clientEventId: null,
        outcome: 'failed',
        message: translate(
          'en-NZ',
          'domain.eventStore.review_open_account_changed'
        ),
      });
    }

    const accountId = requestScope.accountId;
    if (!accountId) {
      const receipt = createLocalEventReceipt<EventOrganiserReviewQueue>({
        action: 'get_organiser_review_queue',
        clientEventId: null,
        outcome: 'failed',
        code: 'AUTHENTICATION_REQUIRED',
        message: translate('en-NZ', 'domain.eventStore.sign_in_review'),
        retryable: false,
      });
      set({
        organiserReviewQueue: null,
        organiserReviewAccountId: null,
        organiserReviewLoading: false,
        organiserReviewError: receipt.message,
      });
      return receipt;
    }

    // Clear before loading so a previous account's private queue cannot flash
    // while this account's server snapshot is still in flight.
    set({
      organiserReviewQueue: null,
      organiserReviewAccountId: accountId,
      organiserReviewLoading: true,
      organiserReviewError: null,
    });
    const receipt = await getOrganiserReviewQueue(occurrenceId);
    if (!(await isEventPrivateRequestScopeCurrent(requestScope))) {
      set(state =>
        state.organiserReviewAccountId === accountId
          ? {
              organiserReviewQueue: null,
              organiserReviewAccountId: null,
              organiserReviewLoading: false,
              organiserReviewError: null,
            }
          : state
      );
      return createLocalEventReceipt<EventOrganiserReviewQueue>({
        action: 'get_organiser_review_queue',
        clientEventId: null,
        outcome: 'unknown_result',
        code: 'EVENT_ACCOUNT_CHANGED',
        message: translate(
          'en-NZ',
          'domain.eventStore.review_load_account_changed'
        ),
        retryable: true,
      });
    }

    if (receipt.outcome === 'completed' && receipt.data) {
      set(state =>
        state.organiserReviewAccountId === accountId
          ? {
              organiserReviewQueue: receipt.data,
              organiserReviewLoading: false,
              organiserReviewError: null,
            }
          : state
      );
    } else {
      set(state =>
        state.organiserReviewAccountId === accountId
          ? {
              organiserReviewQueue: null,
              organiserReviewAccountId: null,
              organiserReviewLoading: false,
              organiserReviewError: receipt.message,
            }
          : state
      );
    }
    return receipt;
  },

  loadOrganiserRecap: async eventId => {
    const requestScope = await captureEventPrivateRequestScope();
    if (!requestScope) {
      return createEventAccountChangedActionReceipt<EventOrganiserRecap>({
        action: 'get_organiser_recap',
        clientEventId: null,
        outcome: 'failed',
        message: translate(
          'en-NZ',
          'domain.eventStore.recap_open_account_changed'
        ),
      });
    }

    const accountId = requestScope.accountId;
    if (!accountId) {
      const receipt = createLocalEventReceipt<EventOrganiserRecap>({
        action: 'get_organiser_recap',
        clientEventId: null,
        outcome: 'failed',
        code: 'AUTHENTICATION_REQUIRED',
        message: translate('en-NZ', 'domain.eventStore.sign_in_recap'),
        retryable: false,
      });
      set({
        organiserRecap: null,
        organiserRecapAccountId: null,
        organiserRecapEventId: null,
        organiserRecapLoading: false,
        organiserRecapError: receipt.message,
      });
      return receipt;
    }

    set(state => ({
      organiserRecap:
        state.organiserRecapAccountId === accountId &&
        state.organiserRecap?.eventId === eventId
          ? state.organiserRecap
          : null,
      organiserRecapAccountId: accountId,
      organiserRecapEventId: eventId,
      organiserRecapLoading: true,
      organiserRecapError: null,
    }));
    const receipt = await getOrganiserEventRecap(eventId);
    if (!(await isEventPrivateRequestScopeCurrent(requestScope))) {
      set(state =>
        state.organiserRecapAccountId === accountId &&
        state.organiserRecapEventId === eventId
          ? {
              organiserRecap: null,
              organiserRecapAccountId: null,
              organiserRecapEventId: null,
              organiserRecapLoading: false,
              organiserRecapError: null,
            }
          : state
      );
      return createLocalEventReceipt<EventOrganiserRecap>({
        action: 'get_organiser_recap',
        clientEventId: null,
        outcome: 'unknown_result',
        code: 'EVENT_ACCOUNT_CHANGED',
        message: translate(
          'en-NZ',
          'domain.eventStore.recap_load_account_changed'
        ),
        retryable: true,
      });
    }

    if (receipt.outcome === 'completed' && receipt.data) {
      set(state =>
        state.organiserRecapAccountId === accountId &&
        state.organiserRecapEventId === eventId
          ? {
              organiserRecap: receipt.data,
              organiserRecapLoading: false,
              organiserRecapError: null,
            }
          : state
      );
    } else {
      set(state =>
        state.organiserRecapAccountId === accountId &&
        state.organiserRecapEventId === eventId
          ? {
              organiserRecap:
                state.organiserRecap?.eventId === eventId
                  ? state.organiserRecap
                  : null,
              organiserRecapLoading: false,
              organiserRecapError: receipt.message,
            }
          : state
      );
    }
    return receipt;
  },

  joinEvent: async input => {
    const requestScope = await captureEventPrivateRequestScope();
    if (!requestScope) {
      return createEventAccountChangedActionReceipt<EventAttendance>({
        action: 'join',
        clientEventId: input.clientEventId,
        outcome: 'failed',
        message: translate(
          'en-NZ',
          'domain.eventStore.join_start_account_changed'
        ),
      });
    }

    const receipt = await joinEventOccurrence(input);
    if (!(await isEventPrivateRequestScopeCurrent(requestScope))) {
      return createEventAccountChangedActionReceipt<EventAttendance>({
        action: 'join',
        clientEventId: input.clientEventId,
        outcome: 'unknown_result',
        message: translate(
          'en-NZ',
          'domain.eventStore.join_save_account_changed'
        ),
      });
    }

    if (receipt.outcome === 'completed' && receipt.data) {
      set(state => ({
        myOccurrence: updateMyOccurrenceAttendance(
          state.myOccurrence,
          receipt.data as EventAttendance
        ),
        error: null,
      }));
    } else {
      set({ error: receipt.message });
    }
    return receipt;
  },

  leaveEvent: async input => {
    const clientEventId = input.clientEventId ?? createClientEventId();
    const requestScope = await captureEventPrivateRequestScope();
    if (!requestScope) {
      return createEventAccountChangedActionReceipt<EventAttendance>({
        action: 'leave',
        clientEventId,
        outcome: 'failed',
        message: translate(
          'en-NZ',
          'domain.eventStore.leave_start_account_changed'
        ),
      });
    }

    const receipt = await leaveEventOccurrence({
      occurrenceId: input.occurrenceId,
      clientEventId,
    });
    if (!(await isEventPrivateRequestScopeCurrent(requestScope))) {
      return createEventAccountChangedActionReceipt<EventAttendance>({
        action: 'leave',
        clientEventId,
        outcome: 'unknown_result',
        message: translate(
          'en-NZ',
          'domain.eventStore.leave_update_account_changed'
        ),
      });
    }

    if (receipt.outcome === 'completed' && receipt.data) {
      set(state => ({
        myOccurrence: updateMyOccurrenceAttendance(
          state.myOccurrence,
          receipt.data as EventAttendance
        ),
        error: null,
      }));
    } else {
      set({ error: receipt.message });
    }
    return receipt;
  },

  checkIn: async input => {
    const requestScope = await captureEventPrivateRequestScope();
    if (!requestScope) {
      return createEventAccountChangedActionReceipt<EventCheckInConfirmed>({
        action: 'check_in',
        clientEventId: input.clientEventId,
        outcome: 'failed',
        message: translate(
          'en-NZ',
          'domain.eventStore.checkin_start_account_changed'
        ),
      });
    }

    const receipt = await checkInToEventOccurrence(input);
    if (!(await isEventPrivateRequestScopeCurrent(requestScope))) {
      return createEventAccountChangedActionReceipt<EventCheckInConfirmed>({
        action: 'check_in',
        clientEventId: input.clientEventId,
        outcome: 'unknown_result',
        message: translate(
          'en-NZ',
          'domain.eventStore.checkin_finish_account_changed'
        ),
      });
    }

    if (receipt.outcome === 'completed' && receipt.data) {
      const confirmed = receipt.data;
      set(state => ({
        myOccurrence: updateMyOccurrenceAttendance(
          state.myOccurrence,
          confirmed.attendance
        ),
        error: null,
      }));
    } else {
      set({ error: receipt.message });
    }
    return receipt;
  },

  submitPost: async input => {
    const clientEventId = input.clientEventId ?? createClientEventId();
    const requestScope = await captureEventPrivateRequestScope();
    if (!requestScope) {
      return createEventAccountChangedActionReceipt<EventPostFinalised>({
        action: 'finalise_post',
        clientEventId,
        outcome: 'failed',
        message: translate(
          'en-NZ',
          'domain.eventStore.photo_send_start_account_changed'
        ),
      });
    }

    const userId = requestScope.accountId;
    if (!userId) {
      return createLocalEventReceipt({
        action: 'finalise_post',
        clientEventId,
        outcome: 'failed',
        code: 'AUTHENTICATION_REQUIRED',
        message: translate('en-NZ', 'domain.eventStore.sign_in_send_photo'),
        retryable: false,
      });
    }

    const draft = await upsertEventUploadDraft({
      userId,
      clientEventId,
      eventId: input.eventId,
      occurrenceId: input.occurrenceId,
      localUri: input.localUri,
      caption: input.caption,
      contentType: input.contentType,
      byteSize: input.byteSize,
      status: 'saved_local',
    });

    const receipt = await serialiseEventUploadForUser(userId, () =>
      processQueuedPost(draft, requestScope)
    );
    if (!(await isEventPrivateRequestScopeCurrent(requestScope))) {
      return createEventAccountChangedActionReceipt<EventPostFinalised>({
        action: 'finalise_post',
        clientEventId,
        outcome: 'unknown_result',
        message: translate(
          'en-NZ',
          'domain.eventStore.photo_status_check_account_changed'
        ),
      });
    }

    if (receipt.outcome === 'completed' && receipt.data) {
      const finalised = receipt.data;
      set(state => ({
        myOccurrence: updateMyOccurrencePost(
          state.myOccurrence,
          finalised.post
        ),
        error: null,
      }));
    } else {
      set({ error: receipt.message });
    }
    return receipt;
  },

  resumePost: async clientEventId => {
    const requestScope = await captureEventPrivateRequestScope();
    if (!requestScope) {
      return createEventAccountChangedActionReceipt<EventPostFinalised>({
        action: 'finalise_post',
        clientEventId,
        outcome: 'failed',
        message: translate(
          'en-NZ',
          'domain.eventStore.saved_photo_continue_account_changed'
        ),
      });
    }

    const userId = requestScope.accountId;
    if (!userId) {
      return createLocalEventReceipt({
        action: 'finalise_post',
        clientEventId,
        outcome: 'failed',
        code: 'AUTHENTICATION_REQUIRED',
        message: translate('en-NZ', 'domain.eventStore.sign_in_resume_photo'),
        retryable: false,
      });
    }

    const draft = await getEventUploadDraft(userId, clientEventId);
    if (!draft) {
      return createLocalEventReceipt({
        action: 'finalise_post',
        clientEventId,
        outcome: 'failed',
        code: 'LOCAL_DRAFT_NOT_FOUND',
        message: translate(
          'en-NZ',
          'domain.eventStore.saved_photo_unavailable'
        ),
        retryable: false,
      });
    }

    const receipt = await serialiseEventUploadForUser(userId, () =>
      processQueuedPost(draft, requestScope)
    );
    if (!(await isEventPrivateRequestScopeCurrent(requestScope))) {
      return createEventAccountChangedActionReceipt<EventPostFinalised>({
        action: 'finalise_post',
        clientEventId,
        outcome: 'unknown_result',
        message: translate(
          'en-NZ',
          'domain.eventStore.saved_photo_status_account_changed'
        ),
      });
    }

    if (receipt.outcome === 'completed' && receipt.data) {
      const finalised = receipt.data;
      set(state => ({
        myOccurrence: updateMyOccurrencePost(
          state.myOccurrence,
          finalised.post
        ),
        error: null,
      }));
    } else {
      set({ error: receipt.message });
    }
    return receipt;
  },

  drainPosts: async () => {
    const requestScope = await captureEventPrivateRequestScope();
    if (!requestScope) return [];

    const userId = requestScope.accountId;
    if (!userId) return [];

    const receipts = await drainEventUploadQueue(userId, item =>
      processQueuedPost(item, requestScope)
    );
    if (!(await isEventPrivateRequestScopeCurrent(requestScope))) {
      return receipts.map(receipt =>
        createEventAccountChangedActionReceipt<EventPostFinalised>({
          action: 'finalise_post',
          clientEventId: receipt.clientEventId,
          outcome: 'unknown_result',
          message: translate(
            'en-NZ',
            'domain.eventStore.saved_photos_status_account_changed'
          ),
        })
      );
    }

    for (const receipt of receipts) {
      if (receipt.outcome === 'completed' && receipt.data) {
        const finalised = receipt.data;
        set(state => ({
          myOccurrence: updateMyOccurrencePost(
            state.myOccurrence,
            finalised.post
          ),
        }));
      }
    }
    return receipts;
  },

  reviewPost: async input => {
    const clientEventId = input.clientEventId ?? createClientEventId();
    const requestScope = await captureEventPrivateRequestScope();
    if (!requestScope) {
      return createEventAccountChangedActionReceipt<EventPostReviewResult>({
        action: 'review_post',
        clientEventId,
        outcome: 'failed',
        message: translate(
          'en-NZ',
          'domain.eventStore.photo_review_start_account_changed'
        ),
      });
    }

    const receipt = await reviewEventPost({
      ...input,
      clientEventId,
    });
    if (!(await isEventPrivateRequestScopeCurrent(requestScope))) {
      return createEventAccountChangedActionReceipt<EventPostReviewResult>({
        action: 'review_post',
        clientEventId,
        outcome: 'unknown_result',
        message: translate(
          'en-NZ',
          'domain.eventStore.photo_decision_account_changed'
        ),
      });
    }

    if (receipt.outcome === 'completed' && receipt.data) {
      const reviewed = receipt.data;
      set(state => ({
        myOccurrence: updateMyOccurrencePost(state.myOccurrence, reviewed.post),
        error: null,
      }));
    } else {
      set({ error: receipt.message });
    }
    return receipt;
  },

  reviewOrganiserPost: async input => {
    const requestScope = await captureEventPrivateRequestScope();
    if (!requestScope) {
      return createEventAccountChangedActionReceipt<EventPostReviewResult>({
        action: 'review_post',
        clientEventId: input.clientEventId,
        outcome: 'failed',
        message: translate(
          'en-NZ',
          'domain.eventStore.organiser_decision_start_account_changed'
        ),
      });
    }

    const receipt = await reviewEventPost({
      postId: input.postId,
      expectedRevision: input.expectedRevision,
      decision: input.decision,
      note: input.note ?? null,
      clientEventId: input.clientEventId,
    });
    if (!(await isEventPrivateRequestScopeCurrent(requestScope))) {
      return createEventAccountChangedActionReceipt<EventPostReviewResult>({
        action: 'review_post',
        clientEventId: input.clientEventId,
        outcome: 'unknown_result',
        message: translate(
          'en-NZ',
          'domain.eventStore.organiser_decision_account_changed'
        ),
      });
    }

    if (receipt.outcome === 'completed' && receipt.data) {
      // The route reloads the queue after this receipt. Do not optimistically
      // remove a post here: the fresh organiser-scoped read is the source of
      // truth for what remains reviewable.
      set({ organiserReviewError: null });
    } else {
      set({ organiserReviewError: receipt.message });
    }
    return receipt;
  },

  deletePost: async input => {
    const clientEventId = input.clientEventId ?? createClientEventId();
    const requestScope = await captureEventPrivateRequestScope();
    if (!requestScope) {
      return createEventAccountChangedActionReceipt<EventPostDeletionResult>({
        action: 'delete_own_post',
        clientEventId,
        outcome: 'failed',
        message: translate(
          'en-NZ',
          'domain.eventStore.photo_delete_start_account_changed'
        ),
      });
    }

    const receipt = await deleteOwnEventPost({
      postId: input.postId,
      clientEventId,
    });
    if (!(await isEventPrivateRequestScopeCurrent(requestScope))) {
      return createEventAccountChangedActionReceipt<EventPostDeletionResult>({
        action: 'delete_own_post',
        clientEventId,
        outcome: 'unknown_result',
        message: translate(
          'en-NZ',
          'domain.eventStore.photo_delete_finish_account_changed'
        ),
      });
    }

    if (receipt.outcome === 'completed' && receipt.data) {
      set(state => ({
        myOccurrence: state.myOccurrence
          ? {
              ...state.myOccurrence,
              ownPosts: state.myOccurrence.ownPosts.filter(
                post => post.postId !== receipt.data?.postId
              ),
            }
          : null,
        error: null,
      }));
    } else {
      set({ error: receipt.message });
    }
    return receipt;
  },
}));
