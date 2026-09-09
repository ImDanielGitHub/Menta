import { act, renderHook } from '@testing-library/react-native';
import { useEventStore } from '@/store/event-store';
import * as eventApi from '@/lib/events/api';
import * as uploadQueue from '@/lib/events/upload-queue';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
        error: null,
      }),
    },
  },
}));

jest.mock('@/lib/events/api');
jest.mock('@/lib/events/upload-queue', () => ({
  upsertEventUploadDraft: jest.fn(),
  updateEventUploadDraft: jest.fn(),
  removeEventUploadDraft: jest.fn(),
  getEventUploadDraft: jest.fn(),
  serialiseEventUploadForUser: jest.fn(
    async (_userId: string, operation: () => Promise<unknown>) => operation()
  ),
  drainEventUploadQueue: jest.fn(),
}));

const mockedPrepare = eventApi.prepareEventPostUpload as jest.MockedFunction<
  typeof eventApi.prepareEventPostUpload
>;
const mockedUpload = eventApi.uploadEventMediaBytes as jest.MockedFunction<
  typeof eventApi.uploadEventMediaBytes
>;
const mockedFinalise = eventApi.finaliseEventPost as jest.MockedFunction<
  typeof eventApi.finaliseEventPost
>;
const mockedCreateLocalReceipt =
  eventApi.createLocalEventReceipt as jest.MockedFunction<
    typeof eventApi.createLocalEventReceipt
  >;
const mockedListPublicEvents = eventApi.listPublicEvents as jest.MockedFunction<
  typeof eventApi.listPublicEvents
>;
const mockedCreateEvent = eventApi.createEvent as jest.MockedFunction<
  typeof eventApi.createEvent
>;
const mockedCheckIn = eventApi.checkInToEventOccurrence as jest.MockedFunction<
  typeof eventApi.checkInToEventOccurrence
>;
const mockedJoin = eventApi.joinEventOccurrence as jest.MockedFunction<
  typeof eventApi.joinEventOccurrence
>;
const mockedGetAttendeeAlbum =
  eventApi.getAttendeeEventAlbum as jest.MockedFunction<
    typeof eventApi.getAttendeeEventAlbum
  >;
const mockedGetMyOccurrence =
  eventApi.getMyEventOccurrence as jest.MockedFunction<
    typeof eventApi.getMyEventOccurrence
  >;
const mockedGetOrganiserRecap =
  eventApi.getOrganiserEventRecap as jest.MockedFunction<
    typeof eventApi.getOrganiserEventRecap
  >;
const mockedGetSession = supabase.auth.getSession as jest.Mock;

describe('event store upload workflow', () => {
  beforeEach(() => {
    useEventStore.setState({
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
    jest.clearAllMocks();
    mockedGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });
    mockedCreateLocalReceipt.mockImplementation(input => ({
      ...input,
      data: null,
      idempotent: false,
    }));
  });

  it('uploads local bytes before finalising and retains no false sent state', async () => {
    const order: string[] = [];
    const clientEventId = '11111111-1111-4111-8111-111111111111';
    const postId = '22222222-2222-4222-8222-222222222222';
    const occurrenceId = '33333333-3333-4333-8333-333333333333';

    (uploadQueue.upsertEventUploadDraft as jest.Mock).mockImplementation(
      async input => input
    );
    (uploadQueue.updateEventUploadDraft as jest.Mock).mockResolvedValue(null);
    (uploadQueue.removeEventUploadDraft as jest.Mock).mockResolvedValue(
      undefined
    );

    mockedPrepare.mockImplementation(async () => ({
      action: 'prepare_post_upload',
      outcome: 'completed',
      code: 'UPLOAD_READY',
      message: 'Ready',
      clientEventId,
      retryable: false,
      idempotent: false,
      data: {
        postId,
        occurrenceId,
        storagePath: `v1/user-1/${occurrenceId}/${postId}.jpg`,
        uploadToken: 'token',
        expiresAt: '2026-08-03T02:00:00.000Z',
        contentType: 'image/jpeg',
        byteSize: 42,
      },
    }));
    mockedUpload.mockImplementation(async () => {
      order.push('upload');
      return {
        outcome: 'completed',
        code: 'MEDIA_BYTES_UPLOADED',
        message: 'Uploaded',
      };
    });
    mockedFinalise.mockImplementation(async () => {
      order.push('finalise');
      return {
        action: 'finalise_post',
        outcome: 'completed',
        code: 'PENDING_REVIEW',
        message: 'Submitted',
        clientEventId,
        retryable: false,
        idempotent: false,
        data: {
          post: {
            postId,
            occurrenceId,
            status: 'pending_review',
            revision: 2,
            caption: null,
            mediaPath: `v1/user-1/${occurrenceId}/${postId}.jpg`,
            contentType: 'image/jpeg',
            byteSize: 42,
            createdAt: '2026-08-03T01:00:00.000Z',
            reviewedAt: null,
            reviewNote: null,
          },
        },
      };
    });

    const { result } = renderHook(() => useEventStore());
    let receipt: Awaited<ReturnType<typeof result.current.submitPost>> | null =
      null;
    await act(async () => {
      receipt = await result.current.submitPost({
        eventId: '44444444-4444-4444-8444-444444444444',
        occurrenceId,
        localUri: 'file:///tmp/event.jpg',
        caption: null,
        contentType: 'image/jpeg',
        byteSize: 42,
        clientEventId,
      });
    });

    expect(receipt).toMatchObject({
      outcome: 'completed',
      code: 'PENDING_REVIEW',
    });
    expect(order).toEqual(['upload', 'finalise']);
    expect(uploadQueue.removeEventUploadDraft).toHaveBeenCalledWith(
      'user-1',
      clientEventId
    );
  });

  it('does not finalise when the media upload is unconfirmed', async () => {
    const clientEventId = '55555555-5555-4555-8555-555555555555';
    const occurrenceId = '66666666-6666-4666-8666-666666666666';
    (uploadQueue.upsertEventUploadDraft as jest.Mock).mockImplementation(
      async input => input
    );
    (uploadQueue.updateEventUploadDraft as jest.Mock).mockResolvedValue(null);
    mockedPrepare.mockResolvedValue({
      action: 'prepare_post_upload',
      outcome: 'completed',
      code: 'UPLOAD_READY',
      message: 'Ready',
      clientEventId,
      retryable: false,
      idempotent: false,
      data: {
        postId: '77777777-7777-4777-8777-777777777777',
        occurrenceId,
        storagePath: `v1/user-1/${occurrenceId}/77777777-7777-4777-8777-777777777777.jpg`,
        uploadToken: 'token',
        expiresAt: '2026-08-03T02:00:00.000Z',
        contentType: 'image/jpeg',
        byteSize: 42,
      },
    });
    mockedUpload.mockResolvedValue({
      outcome: 'unknown_result',
      code: 'MEDIA_UPLOAD_UNCONFIRMED',
      message: 'Unknown',
    });

    const { result } = renderHook(() => useEventStore());
    await act(async () => {
      await result.current.submitPost({
        eventId: '88888888-8888-4888-8888-888888888888',
        occurrenceId,
        localUri: 'file:///tmp/event.jpg',
        caption: null,
        contentType: 'image/jpeg',
        byteSize: 42,
        clientEventId,
      });
    });

    expect(mockedFinalise).not.toHaveBeenCalled();
    expect(uploadQueue.updateEventUploadDraft).toHaveBeenLastCalledWith(
      'user-1',
      clientEventId,
      expect.objectContaining({ status: 'unknown_result' })
    );
  });

  it('keeps the prior discovery list when a refresh cannot be confirmed', async () => {
    const prior = {
      eventId: '11111111-1111-4111-8111-111111111111',
      occurrenceId: '22222222-2222-4222-8222-222222222222',
      title: 'Harbour Run Club',
      description: null,
      venueName: 'Silo Park',
      startsAt: '2026-08-06T06:15:00.000Z',
      endsAt: '2026-08-06T07:30:00.000Z',
      timeZone: 'Pacific/Auckland',
      consentVersion: 'attendance-v1',
      visibility: 'public' as const,
      occurrenceState: 'scheduled' as const,
      capacity: 60,
      reservedCount: 48,
    };
    useEventStore.setState({ publicEvents: [prior] });
    mockedListPublicEvents.mockResolvedValue({
      action: 'list_public_events',
      outcome: 'unknown_result',
      code: 'FUNCTION_TRANSPORT_FAILED',
      message: 'We could not confirm the event action.',
      clientEventId: null,
      data: null,
      retryable: true,
      idempotent: false,
    });

    const { result } = renderHook(() => useEventStore());
    await act(async () => {
      await result.current.loadPublicEvents();
    });

    expect(result.current.publicEvents).toEqual([prior]);
    expect(result.current.publicEventsError).toBe(
      'We could not confirm the event action.'
    );
  });

  it('discards a completed publish receipt when account A changes to account B in flight', async () => {
    const input = {
      clientEventId: '11111111-1111-4111-8111-111111111111',
      title: 'Harbour Run Club',
      description: null,
      venueName: 'Silo Park',
      timeZone: 'Pacific/Auckland',
      visibility: 'unlisted' as const,
      startsAt: '2026-08-23T21:00:00.000Z',
      endsAt: '2026-08-23T22:30:00.000Z',
      capacity: 60,
    };
    mockedGetSession
      .mockResolvedValueOnce({
        data: { session: { user: { id: 'user-1' } } },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { session: { user: { id: 'user-2' } } },
        error: null,
      });
    mockedCreateEvent.mockResolvedValue({
      action: 'create_event',
      outcome: 'completed',
      code: 'EVENT_CREATED',
      message: 'Event created.',
      clientEventId: input.clientEventId,
      retryable: false,
      idempotent: false,
      data: {
        summary: {
          eventId: '22222222-2222-4222-8222-222222222222',
          occurrenceId: '33333333-3333-4333-8333-333333333333',
          title: input.title,
          description: null,
          venueName: input.venueName,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          timeZone: input.timeZone,
          consentVersion: 'attendance-v1',
          visibility: input.visibility,
          occurrenceState: 'scheduled',
          capacity: input.capacity,
          reservedCount: 0,
        },
        publishedAt: '2026-08-09T01:00:00.000Z',
        shareToken: 'share-token',
        inviteToken: null,
        organiserCheckInCode: 'check-in-code',
        checkInExpiresAt: input.endsAt,
      },
    });

    const { result } = renderHook(() => useEventStore());
    let receipt: Awaited<
      ReturnType<typeof result.current.publishEvent>
    > | null = null;
    await act(async () => {
      receipt = await result.current.publishEvent(input, 'user-1');
    });

    expect(receipt).toMatchObject({
      outcome: 'unknown_result',
      code: 'EVENT_ACCOUNT_CHANGED',
    });
    expect(mockedCreateEvent).toHaveBeenCalledWith(input);
    expect(result.current.summary).toBeNull();
    expect(result.current.publicEvents).toEqual([]);
  });

  it('does not repopulate cleared event state from a stale same-account publish completion', async () => {
    const input = {
      clientEventId: '44444444-4444-4444-8444-444444444444',
      title: 'Cold Restart Walk',
      description: null,
      venueName: null,
      timeZone: 'Pacific/Auckland',
      visibility: 'public' as const,
      startsAt: '2026-08-24T01:00:00.000Z',
      endsAt: '2026-08-24T02:00:00.000Z',
      capacity: null,
    };
    mockedCreateEvent.mockImplementation(async () => {
      useEventStore.getState().clearEventData();
      return {
        action: 'create_event',
        outcome: 'completed',
        code: 'EVENT_CREATED',
        message: 'Event created.',
        clientEventId: input.clientEventId,
        retryable: false,
        idempotent: false,
        data: {
          summary: {
            eventId: '55555555-5555-4555-8555-555555555555',
            occurrenceId: '66666666-6666-4666-8666-666666666666',
            title: input.title,
            description: null,
            venueName: null,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            timeZone: input.timeZone,
            consentVersion: 'attendance-v1',
            visibility: input.visibility,
            occurrenceState: 'scheduled',
            capacity: null,
            reservedCount: 0,
          },
          publishedAt: '2026-08-09T01:00:00.000Z',
          shareToken: null,
          inviteToken: null,
          organiserCheckInCode: 'check-in-code',
          checkInExpiresAt: input.endsAt,
        },
      };
    });

    const { result } = renderHook(() => useEventStore());
    let receipt: Awaited<
      ReturnType<typeof result.current.publishEvent>
    > | null = null;
    await act(async () => {
      receipt = await result.current.publishEvent(input, 'user-1');
    });

    expect(receipt).toMatchObject({
      outcome: 'unknown_result',
      code: 'EVENT_ACCOUNT_CHANGED',
    });
    expect(result.current.summary).toBeNull();
    expect(result.current.publicEvents).toEqual([]);
  });

  it('does not repopulate a private occurrence after account state is cleared in flight', async () => {
    const eventId = '77777777-7777-4777-8777-777777777777';
    const occurrenceId = '88888888-8888-4888-8888-888888888888';
    mockedGetMyOccurrence.mockImplementation(async () => {
      useEventStore.getState().clearEventData();
      return {
        action: 'get_my_occurrence',
        outcome: 'completed',
        code: 'MY_OCCURRENCE_READY',
        message: 'Your event details are ready.',
        clientEventId: null,
        retryable: false,
        idempotent: false,
        data: {
          summary: {
            eventId,
            occurrenceId,
            title: 'Private walking club',
            description: null,
            venueName: null,
            startsAt: '2026-08-24T01:00:00.000Z',
            endsAt: '2026-08-24T02:00:00.000Z',
            timeZone: 'Pacific/Auckland',
            consentVersion: 'attendance-v1',
            visibility: 'invite_only' as const,
            occurrenceState: 'scheduled' as const,
            capacity: null,
            reservedCount: 1,
          },
          attendance: null,
          ownPosts: [],
        },
      };
    });

    const { result } = renderHook(() => useEventStore());
    let receipt: Awaited<
      ReturnType<typeof result.current.loadMyOccurrence>
    > | null = null;
    await act(async () => {
      receipt = await result.current.loadMyOccurrence(occurrenceId);
    });

    expect(receipt).toMatchObject({
      outcome: 'unknown_result',
      code: 'EVENT_ACCOUNT_CHANGED',
    });
    expect(result.current.myOccurrence).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('does not apply a confirmed private mutation after account state is cleared', async () => {
    const occurrenceId = '99999999-9999-4999-8999-999999999999';
    const clientEventId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    mockedCheckIn.mockImplementation(async () => {
      useEventStore.getState().clearEventData();
      return {
        action: 'check_in',
        outcome: 'completed',
        code: 'CHECKED_IN',
        message: 'Your event check-in is confirmed.',
        clientEventId,
        retryable: false,
        idempotent: false,
        data: {
          attendance: {
            attendanceId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            occurrenceId,
            state: 'joined' as const,
            consentVersion: 'attendance-v1',
            joinedAt: '2026-08-24T00:45:00.000Z',
            checkedInAt: '2026-08-24T01:00:00.000Z',
            checkInMethod: 'roster_single_use' as const,
          },
          checkInId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          checkedInAt: '2026-08-24T01:00:00.000Z',
          method: 'roster_single_use' as const,
        },
      };
    });

    const { result } = renderHook(() => useEventStore());
    let receipt: Awaited<ReturnType<typeof result.current.checkIn>> | null =
      null;
    await act(async () => {
      receipt = await result.current.checkIn({
        occurrenceId,
        clientEventId,
        token: 'one-time-check-in-token',
      });
    });

    expect(receipt).toMatchObject({
      outcome: 'unknown_result',
      code: 'EVENT_ACCOUNT_CHANGED',
    });
    expect(result.current.myOccurrence).toBeNull();
  });

  it('updates the current attendance only from a confirmed check-in receipt', async () => {
    const occurrenceId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const clientEventId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    useEventStore.setState({
      myOccurrence: {
        summary: {
          eventId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          occurrenceId,
          title: 'Harbour Run Club',
          description: null,
          venueName: 'Silo Park',
          startsAt: '2026-08-06T06:15:00.000Z',
          endsAt: '2026-08-06T07:30:00.000Z',
          timeZone: 'Pacific/Auckland',
          consentVersion: 'attendance-v1',
          visibility: 'public',
          occurrenceState: 'scheduled',
          capacity: 60,
          reservedCount: 48,
        },
        attendance: {
          attendanceId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
          occurrenceId,
          state: 'joined',
          consentVersion: 'attendance-v1',
          joinedAt: '2026-08-05T05:00:00.000Z',
          checkedInAt: null,
          checkInMethod: null,
        },
        ownPosts: [],
      },
    });
    mockedCheckIn.mockResolvedValue({
      action: 'check_in',
      outcome: 'completed',
      code: 'CHECKED_IN',
      message: 'Your event check-in is confirmed.',
      clientEventId,
      retryable: false,
      idempotent: false,
      data: {
        attendance: {
          attendanceId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
          occurrenceId,
          state: 'joined',
          consentVersion: 'attendance-v1',
          joinedAt: '2026-08-05T05:00:00.000Z',
          checkedInAt: '2026-08-05T06:12:00.000Z',
          checkInMethod: 'roster_single_use',
        },
        checkInId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        checkedInAt: '2026-08-05T06:12:00.000Z',
        method: 'roster_single_use',
      },
    });

    const { result } = renderHook(() => useEventStore());
    await act(async () => {
      await result.current.checkIn({
        occurrenceId,
        clientEventId,
        token: 'organiser-code-1234',
      });
    });

    expect(result.current.myOccurrence?.attendance).toMatchObject({
      checkedInAt: '2026-08-05T06:12:00.000Z',
      checkInMethod: 'roster_single_use',
    });
  });

  it('persists a server-confirmed join in the current occurrence only', async () => {
    const occurrenceId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const clientEventId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    useEventStore.setState({
      myOccurrence: {
        summary: {
          eventId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          occurrenceId,
          title: 'Harbour Run Club',
          description: null,
          venueName: 'Silo Park',
          startsAt: '2026-08-06T06:15:00.000Z',
          endsAt: '2026-08-06T07:30:00.000Z',
          timeZone: 'Pacific/Auckland',
          consentVersion: 'attendance-v1',
          visibility: 'public',
          occurrenceState: 'scheduled',
          capacity: 60,
          reservedCount: 48,
        },
        attendance: null,
        ownPosts: [],
      },
    });
    mockedJoin.mockResolvedValue({
      action: 'join',
      outcome: 'completed',
      code: 'JOINED',
      message: 'Your attendance is confirmed.',
      clientEventId,
      retryable: false,
      idempotent: false,
      data: {
        attendanceId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        occurrenceId,
        state: 'joined',
        consentVersion: 'attendance-v1',
        joinedAt: '2026-08-05T06:00:00.000Z',
        checkedInAt: null,
        checkInMethod: null,
      },
    });

    const { result } = renderHook(() => useEventStore());
    await act(async () => {
      await result.current.joinEvent({
        occurrenceId,
        clientEventId,
        consentVersion: 'attendance-v1',
      });
    });

    expect(result.current.myOccurrence?.attendance).toMatchObject({
      attendanceId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      state: 'joined',
      joinedAt: '2026-08-05T06:00:00.000Z',
    });
  });

  it('stores a confirmed empty attendee album without treating it as a read failure', async () => {
    const occurrenceId = '22222222-2222-4222-8222-222222222222';
    mockedGetAttendeeAlbum.mockResolvedValue({
      action: 'get_attendee_album',
      outcome: 'completed',
      code: 'ATTENDEE_ALBUM_READY',
      message: 'The attendee album is ready.',
      clientEventId: null,
      retryable: false,
      idempotent: false,
      data: {
        eventId: '11111111-1111-4111-8111-111111111111',
        occurrenceId,
        eventTitle: 'Harbour Run Club',
        viewerRole: 'attendee',
        viewerCanPost: false,
        downloadsAllowed: false,
        approvedPostCount: 0,
        items: [],
      },
    });

    const { result } = renderHook(() => useEventStore());
    await act(async () => {
      await result.current.loadAttendeeAlbum(occurrenceId);
    });

    expect(result.current.attendeeAlbum).toMatchObject({
      occurrenceId,
      approvedPostCount: 0,
      items: [],
    });
    expect(result.current.attendeeAlbumAccountId).toBe('user-1');
    expect(result.current.attendeeAlbumError).toBeNull();
  });

  it('retains a same-scope confirmed recap when a refresh is unconfirmed', async () => {
    const eventId = '11111111-1111-4111-8111-111111111111';
    const prior = {
      eventId,
      occurrenceId: '22222222-2222-4222-8222-222222222222',
      eventTitle: 'Harbour Run Club',
      endedAt: '2026-08-05T07:30:00.000Z',
      timeZone: 'Pacific/Auckland',
      counts: { joined: 12, checkedIn: 9, posted: 7, verified: 6 },
      approvedPostCount: 0,
      albumItems: [],
    };
    useEventStore.setState({
      organiserRecap: prior,
      organiserRecapAccountId: 'user-1',
      organiserRecapEventId: eventId,
    });
    mockedGetOrganiserRecap.mockResolvedValue({
      action: 'get_organiser_recap',
      outcome: 'unknown_result',
      code: 'FUNCTION_TRANSPORT_FAILED',
      message: 'The recap could not be confirmed.',
      clientEventId: null,
      retryable: true,
      idempotent: false,
      data: null,
    });

    const { result } = renderHook(() => useEventStore());
    await act(async () => {
      await result.current.loadOrganiserRecap(eventId);
    });

    expect(result.current.organiserRecap).toEqual(prior);
    expect(result.current.organiserRecapError).toBe(
      'The recap could not be confirmed.'
    );
  });

  it('drops a private album response if the active account changes in flight', async () => {
    const occurrenceId = '22222222-2222-4222-8222-222222222222';
    mockedGetSession
      .mockResolvedValueOnce({
        data: { session: { user: { id: 'user-1' } } },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { session: { user: { id: 'user-2' } } },
        error: null,
      });
    mockedGetAttendeeAlbum.mockResolvedValue({
      action: 'get_attendee_album',
      outcome: 'completed',
      code: 'ATTENDEE_ALBUM_READY',
      message: 'The attendee album is ready.',
      clientEventId: null,
      retryable: false,
      idempotent: false,
      data: {
        eventId: '11111111-1111-4111-8111-111111111111',
        occurrenceId,
        eventTitle: 'Harbour Run Club',
        viewerRole: 'attendee',
        viewerCanPost: false,
        downloadsAllowed: false,
        approvedPostCount: 0,
        items: [],
      },
    });

    const { result } = renderHook(() => useEventStore());
    let receipt: Awaited<
      ReturnType<typeof result.current.loadAttendeeAlbum>
    > | null = null;
    await act(async () => {
      receipt = await result.current.loadAttendeeAlbum(occurrenceId);
    });

    expect(receipt).toMatchObject({
      outcome: 'unknown_result',
      code: 'EVENT_ACCOUNT_CHANGED',
    });
    expect(result.current.attendeeAlbum).toBeNull();
    expect(result.current.attendeeAlbumAccountId).toBeNull();
    expect(result.current.attendeeAlbumOccurrenceId).toBeNull();
  });
});
