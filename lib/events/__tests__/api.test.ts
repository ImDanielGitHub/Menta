import {
  checkInToEventOccurrence,
  createEvent,
  finaliseEventPost,
  getAttendeeEventAlbum,
  getOrganiserEventRecap,
  getOrganiserReviewQueue,
  listPublicEvents,
  prepareEventPostUpload,
} from '@/lib/events/api';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    functions: { invoke: jest.fn() },
    storage: { from: jest.fn() },
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

const completedReceipt = (
  action: string,
  clientEventId: string | null,
  data: unknown
) => ({
  receipt: {
    action,
    outcome: 'completed',
    code: 'OK',
    message: 'Confirmed',
    clientEventId,
    data,
    retryable: false,
    idempotent: false,
  },
});

describe('event edge client', () => {
  beforeEach(() => jest.clearAllMocks());

  it('publishes only bounded event facts and accepts the exact organiser receipt', async () => {
    const clientEventId = '44444444-4444-4444-8444-444444444444';
    const input = {
      clientEventId,
      title: 'Harbour Run Club',
      description: null,
      venueName: 'Silo Park',
      timeZone: 'Pacific/Auckland',
      visibility: 'unlisted' as const,
      startsAt: '2026-08-23T21:00:00.000Z',
      endsAt: '2026-08-23T22:30:00.000Z',
      capacity: 60,
    };
    mockSupabase.functions.invoke.mockResolvedValue({
      data: completedReceipt('create_event', clientEventId, {
        summary: {
          eventId: '11111111-1111-4111-8111-111111111111',
          occurrenceId: '22222222-2222-4222-8222-222222222222',
          title: input.title,
          description: null,
          venueName: input.venueName,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          timeZone: input.timeZone,
          consentVersion: 'event-attendance-v1',
          visibility: input.visibility,
          occurrenceState: 'scheduled',
          capacity: input.capacity,
          reservedCount: 0,
        },
        publishedAt: '2026-08-09T01:00:00.000Z',
        shareToken: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        inviteToken: null,
        organiserCheckInCode: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        checkInExpiresAt: input.endsAt,
      }),
      error: null,
    });

    await expect(createEvent(input)).resolves.toMatchObject({
      outcome: 'completed',
      data: {
        summary: { title: 'Harbour Run Club' },
        organiserCheckInCode: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      },
    });
    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
      'event-participation',
      { body: { action: 'create_event', ...input } }
    );
  });

  it('does not send a client-controlled storage path when finalising', async () => {
    const clientEventId = '11111111-1111-4111-8111-111111111111';
    mockSupabase.functions.invoke.mockResolvedValue({
      data: completedReceipt('finalise_post', clientEventId, {
        post: {
          postId: '22222222-2222-4222-8222-222222222222',
          occurrenceId: '33333333-3333-4333-8333-333333333333',
          status: 'pending_review',
          revision: 2,
          caption: null,
          mediaPath:
            'v1/11111111-1111-4111-8111-111111111111/33333333-3333-4333-8333-333333333333/22222222-2222-4222-8222-222222222222.jpg',
          contentType: 'image/jpeg',
          byteSize: 20,
          createdAt: '2026-08-03T01:00:00.000Z',
          reviewedAt: null,
          reviewNote: null,
        },
      }),
      error: null,
    });

    await finaliseEventPost({
      postId: '22222222-2222-4222-8222-222222222222',
      clientEventId,
    });

    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
      'event-participation',
      {
        body: {
          action: 'finalise_post',
          postId: '22222222-2222-4222-8222-222222222222',
          clientEventId,
        },
      }
    );
  });

  it('sends the organiser code only through the check-in receipt boundary', async () => {
    const clientEventId = '99999999-9999-4999-8999-999999999999';
    const occurrenceId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    mockSupabase.functions.invoke.mockResolvedValue({
      data: completedReceipt('check_in', clientEventId, {
        attendance: {
          attendanceId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          occurrenceId,
          state: 'joined',
          consentVersion: 'attendance-v1',
          joinedAt: '2026-08-05T05:00:00.000Z',
          checkedInAt: '2026-08-05T06:12:00.000Z',
          checkInMethod: 'roster_single_use',
        },
        checkInId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        checkedInAt: '2026-08-05T06:12:00.000Z',
        method: 'roster_single_use',
      }),
      error: null,
    });

    await checkInToEventOccurrence({
      occurrenceId,
      clientEventId,
      token: 'organiser-code-1234',
    });

    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
      'event-participation',
      {
        body: {
          action: 'check_in',
          occurrenceId,
          clientEventId,
          token: 'organiser-code-1234',
        },
      }
    );
  });

  it('turns an unconfirmed Edge transport into an unknown receipt', async () => {
    mockSupabase.functions.invoke.mockResolvedValue({
      data: null,
      error: new Error('network'),
    });

    const receipt = await prepareEventPostUpload({
      occurrenceId: '33333333-3333-4333-8333-333333333333',
      clientEventId: '44444444-4444-4444-8444-444444444444',
      caption: null,
      contentType: 'image/jpeg',
      byteSize: 42,
    });

    expect(receipt).toMatchObject({
      outcome: 'unknown_result',
      code: 'FUNCTION_TRANSPORT_FAILED',
      data: null,
    });
  });

  it('reads public discovery only through the event receipt boundary', async () => {
    mockSupabase.functions.invoke.mockResolvedValue({
      data: completedReceipt('list_public_events', null, [
        {
          eventId: '11111111-1111-4111-8111-111111111111',
          occurrenceId: '22222222-2222-4222-8222-222222222222',
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
      ]),
      error: null,
    });

    const receipt = await listPublicEvents();

    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
      'event-participation',
      { body: { action: 'list_public_events' } }
    );
    expect(receipt).toMatchObject({
      action: 'list_public_events',
      outcome: 'completed',
      data: [expect.objectContaining({ title: 'Harbour Run Club' })],
    });
  });

  it('accepts only the bounded organiser review DTO from the receipt boundary', async () => {
    const occurrenceId = '22222222-2222-4222-8222-222222222222';
    mockSupabase.functions.invoke.mockResolvedValue({
      data: completedReceipt('get_organiser_review_queue', null, {
        eventId: '11111111-1111-4111-8111-111111111111',
        occurrenceId,
        eventTitle: 'Harbour Run Club',
        pendingCount: 1,
        items: [
          {
            postId: '33333333-3333-4333-8333-333333333333',
            occurrenceId,
            revision: 2,
            caption: 'Finished the route',
            createdAt: '2026-08-05T06:12:00.000Z',
            attendeeUsername: 'runclubber',
            attendanceState: 'joined',
            checkedInAt: '2026-08-05T05:59:00.000Z',
            checkInMethod: 'rotating_qr',
            hasUploadedMedia: true,
            mediaPreviewUrl: 'https://preview.example.test/event-post.jpg',
            mediaPreviewExpiresInSeconds: 60,
          },
        ],
      }),
      error: null,
    });

    const receipt = await getOrganiserReviewQueue(occurrenceId);

    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
      'event-participation',
      { body: { action: 'get_organiser_review_queue', occurrenceId } }
    );
    expect(receipt).toMatchObject({
      outcome: 'completed',
      data: {
        pendingCount: 1,
        items: [expect.not.objectContaining({ mediaPath: expect.anything() })],
      },
    });
  });

  it('does not accept an organiser queue receipt that includes a media path', async () => {
    const occurrenceId = '22222222-2222-4222-8222-222222222222';
    mockSupabase.functions.invoke.mockResolvedValue({
      data: completedReceipt('get_organiser_review_queue', null, {
        eventId: '11111111-1111-4111-8111-111111111111',
        occurrenceId,
        eventTitle: 'Harbour Run Club',
        pendingCount: 1,
        items: [
          {
            postId: '33333333-3333-4333-8333-333333333333',
            occurrenceId,
            revision: 2,
            caption: null,
            createdAt: '2026-08-05T06:12:00.000Z',
            attendeeUsername: 'runclubber',
            attendanceState: 'joined',
            checkedInAt: null,
            checkInMethod: null,
            hasUploadedMedia: true,
            mediaPreviewUrl: 'https://preview.example.test/event-post.jpg',
            mediaPreviewExpiresInSeconds: 60,
            mediaPath: 'v1/private/path.jpg',
          },
        ],
      }),
      error: null,
    });

    await expect(getOrganiserReviewQueue(occurrenceId)).resolves.toMatchObject({
      outcome: 'unknown_result',
      code: 'MALFORMED_SERVER_RECEIPT',
    });
  });

  it('keeps a confirmed empty attendee album distinct from an unknown read', async () => {
    const eventId = '11111111-1111-4111-8111-111111111111';
    const occurrenceId = '22222222-2222-4222-8222-222222222222';
    mockSupabase.functions.invoke.mockResolvedValue({
      data: completedReceipt('get_attendee_album', null, {
        eventId,
        occurrenceId,
        eventTitle: 'Harbour Run Club',
        viewerRole: 'attendee',
        viewerCanPost: false,
        downloadsAllowed: false,
        approvedPostCount: 0,
        items: [],
      }),
      error: null,
    });

    await expect(getAttendeeEventAlbum(occurrenceId)).resolves.toMatchObject({
      action: 'get_attendee_album',
      outcome: 'completed',
      data: { approvedPostCount: 0, items: [] },
    });
    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
      'event-participation',
      { body: { action: 'get_attendee_album', occurrenceId } }
    );
  });

  it('rejects an attendee album item that leaks a durable media path', async () => {
    const eventId = '11111111-1111-4111-8111-111111111111';
    const occurrenceId = '22222222-2222-4222-8222-222222222222';
    mockSupabase.functions.invoke.mockResolvedValue({
      data: completedReceipt('get_attendee_album', null, {
        eventId,
        occurrenceId,
        eventTitle: 'Harbour Run Club',
        viewerRole: 'attendee',
        viewerCanPost: false,
        downloadsAllowed: false,
        approvedPostCount: 1,
        items: [
          {
            postId: '33333333-3333-4333-8333-333333333333',
            occurrenceId,
            caption: null,
            createdAt: '2026-08-05T06:12:00.000Z',
            attendeeUsername: 'runclubber',
            checkedInAt: '2026-08-05T05:59:00.000Z',
            approvedAt: '2026-08-05T06:20:00.000Z',
            mediaPreviewUrl: 'https://preview.example.test/event-post.jpg',
            mediaPreviewExpiresInSeconds: 60,
            mediaPath: 'v1/private/path.jpg',
          },
        ],
      }),
      error: null,
    });

    await expect(getAttendeeEventAlbum(occurrenceId)).resolves.toMatchObject({
      outcome: 'unknown_result',
      code: 'MALFORMED_SERVER_RECEIPT',
    });
  });

  it('accepts organiser recap counts only when their invariants hold', async () => {
    const eventId = '11111111-1111-4111-8111-111111111111';
    const occurrenceId = '22222222-2222-4222-8222-222222222222';
    const recap = {
      eventId,
      occurrenceId,
      eventTitle: 'Harbour Run Club',
      endedAt: '2026-08-05T07:30:00.000Z',
      timeZone: 'Pacific/Auckland',
      counts: { joined: 12, checkedIn: 9, posted: 7, verified: 6 },
      approvedPostCount: 0,
      albumItems: [],
    };
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: completedReceipt('get_organiser_recap', null, recap),
      error: null,
    });

    await expect(getOrganiserEventRecap(eventId)).resolves.toMatchObject({
      action: 'get_organiser_recap',
      outcome: 'completed',
      data: { counts: recap.counts },
    });

    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: completedReceipt('get_organiser_recap', null, {
        ...recap,
        counts: { ...recap.counts, verified: 8 },
      }),
      error: null,
    });

    await expect(getOrganiserEventRecap(eventId)).resolves.toMatchObject({
      outcome: 'unknown_result',
      code: 'MALFORMED_SERVER_RECEIPT',
    });
  });
});
