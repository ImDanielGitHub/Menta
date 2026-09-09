import {
  buildEventInviteEntryHref,
  claimPendingEventInviteEntryForUser,
  dismissPendingEventInviteEntry,
  holdPendingEventInviteEntry,
  loadInboundInviteReceipt,
  loadPendingEventInviteEntry,
  projectPendingEventInviteEntry,
} from '@/lib/invites/inbound-invite-entry';
import { translate } from '@/lib/localization';
import { useProtectedRouteStore } from '@/store/protected-route-store';
import type { PendingProtectedRoute } from '@/store/protected-route-store';
import type { EventSummary } from '@/types/event';

const mockGetEventSummary = jest.fn();
const mockLoadPromisePreview = jest.fn();
const mockPreviewGroupInvite = jest.fn();

jest.mock('@/lib/events/api', () => ({
  getEventSummary: (...args: unknown[]) => mockGetEventSummary(...args),
}));

jest.mock('@/lib/promises/accountability', () => ({
  loadPromiseAccountabilityInvitePreview: (...args: unknown[]) =>
    mockLoadPromisePreview(...args),
}));

jest.mock('@/store/group-store', () => ({
  useGroupStore: {
    getState: () => ({ previewGroupInvite: mockPreviewGroupInvite }),
  },
}));

const EVENT_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_EVENT_ID = '22222222-2222-4222-8222-222222222222';
const CAPABILITY = 'opaque_event_capability_1234567890';

const summary: EventSummary = {
  eventId: EVENT_ID,
  occurrenceId: '33333333-3333-4333-8333-333333333333',
  title: 'Sunday park walk',
  description: 'A relaxed loop through the park.',
  venueName: 'Albert Park',
  startsAt: '2026-09-06T21:00:00.000Z',
  endsAt: '2026-09-06T22:30:00.000Z',
  timeZone: 'Pacific/Auckland',
  consentVersion: 'attendance-v1',
  visibility: 'invite_only',
  occurrenceState: 'scheduled',
  capacity: 12,
  reservedCount: 3,
};

const pendingEvent = (
  overrides: Partial<PendingProtectedRoute> = {}
): PendingProtectedRoute => ({
  path: `/events/${EVENT_ID}?inviteToken=${CAPABILITY}`,
  source: 'deep_link' as const,
  timestamp: Date.now(),
  ownerUserId: null,
  ...overrides,
});

describe('inbound invite entry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useProtectedRouteStore.setState({ pending: null });
    mockPreviewGroupInvite.mockReset();
  });

  it('projects only safe event identity while using the capability for the authoritative preview', async () => {
    const pending = pendingEvent();
    mockGetEventSummary.mockResolvedValue({
      outcome: 'completed',
      data: summary,
      retryable: false,
    });

    const projection = projectPendingEventInviteEntry({
      pendingRoute: pending,
      eventId: EVENT_ID,
    });
    expect(projection).toEqual({
      eventId: EVENT_ID,
      ownerUserId: null,
      timestamp: pending.timestamp,
    });
    expect(JSON.stringify(projection)).not.toContain(CAPABILITY);

    await expect(
      loadPendingEventInviteEntry({
        pendingRoute: pending,
        eventId: EVENT_ID,
      })
    ).resolves.toEqual({ kind: 'ready', value: summary });
    expect(mockGetEventSummary).toHaveBeenCalledWith({
      eventId: EVENT_ID,
      shareToken: null,
      inviteToken: CAPABILITY,
    });
  });

  it('holds the capability privately and returns a token-free preview destination', () => {
    const entry = holdPendingEventInviteEntry({
      path: `/events/${EVENT_ID}?inviteToken=${CAPABILITY}`,
      source: 'deep_link',
    });

    expect(entry?.eventId).toBe(EVENT_ID);
    expect(useProtectedRouteStore.getState().pending?.path).toContain(
      CAPABILITY
    );
    const href = entry && buildEventInviteEntryHref(entry);
    expect(href).toEqual({
      pathname: '/join-event',
      params: { eventId: EVENT_ID },
    });
    expect(JSON.stringify(href)).not.toContain(CAPABILITY);
  });

  it('does not expose or load an event capability owned by another account', async () => {
    const pending = pendingEvent({ ownerUserId: 'user-a' });

    expect(
      projectPendingEventInviteEntry({
        pendingRoute: pending,
        eventId: EVENT_ID,
        currentUserId: 'user-b',
      })
    ).toBeNull();
    await expect(
      loadPendingEventInviteEntry({
        pendingRoute: pending,
        eventId: EVENT_ID,
        currentUserId: 'user-b',
      })
    ).resolves.toEqual({
      kind: 'terminal',
      message: 'This event invitation is no longer available.',
    });
    expect(mockGetEventSummary).not.toHaveBeenCalled();
  });

  it('keeps an unknown preview result retryable and leaves the capability held', async () => {
    const pending = pendingEvent();
    useProtectedRouteStore.setState({ pending });
    mockGetEventSummary.mockResolvedValue({
      outcome: 'unknown_result',
      data: null,
      retryable: true,
    });

    await expect(
      loadPendingEventInviteEntry({
        pendingRoute: pending,
        eventId: EVENT_ID,
      })
    ).resolves.toEqual({
      kind: 'retry',
      message:
        'Menta could not check this event invitation. Try again when you have a connection.',
    });
    expect(useProtectedRouteStore.getState().pending).toEqual(pending);
  });

  it.each(['INVITE_REQUIRED', 'EVENT_UNAVAILABLE'])(
    'keeps signed-out %s readback generic and held for authentication',
    async code => {
      const pending = pendingEvent();
      mockGetEventSummary.mockResolvedValue({
        outcome: 'failed',
        code,
        data: null,
        retryable: false,
      });

      await expect(
        loadPendingEventInviteEntry({
          pendingRoute: pending,
          eventId: EVENT_ID,
        })
      ).resolves.toEqual({
        kind: 'sign_in_required',
        message: 'Sign in to complete this action and return here afterwards.',
      });
    }
  );

  it('clears invalid, expired, exhausted or blocked state only after authenticated readback', async () => {
    const pending = pendingEvent({ ownerUserId: 'user-a' });
    mockGetEventSummary.mockResolvedValue({
      outcome: 'failed',
      code: 'INVITE_UNAVAILABLE',
      data: null,
      retryable: false,
    });

    await expect(
      loadPendingEventInviteEntry({
        pendingRoute: pending,
        eventId: EVENT_ID,
        currentUserId: 'user-a',
      })
    ).resolves.toEqual({
      kind: 'terminal',
      message:
        'This event invitation is no longer available. Ask the sender for a current link.',
    });
  });

  it('returns an account-bound event after the matching existing user signs in', async () => {
    const pending = pendingEvent({ ownerUserId: 'user-a' });
    mockGetEventSummary.mockResolvedValue({
      outcome: 'completed',
      data: summary,
      retryable: false,
    });

    await expect(
      loadPendingEventInviteEntry({
        pendingRoute: pending,
        eventId: EVENT_ID,
        currentUserId: 'user-a',
      })
    ).resolves.toEqual({ kind: 'ready', value: summary });
  });

  it('keeps the generic terminal boundary when event copy is localised', async () => {
    const pending = pendingEvent();
    const localise = (
      key: Parameters<typeof translate>[1],
      values?: Parameters<typeof translate>[2]
    ) => translate('de-DE', key, values);
    mockGetEventSummary.mockResolvedValue({
      outcome: 'failed',
      code: 'INVITE_UNAVAILABLE',
      data: null,
      retryable: false,
    });

    await expect(
      loadPendingEventInviteEntry({
        pendingRoute: pending,
        eventId: EVENT_ID,
        currentUserId: 'user-a',
        localise,
      })
    ).resolves.toEqual({
      kind: 'terminal',
      message:
        'Diese Veranstaltungseinladung ist nicht mehr verfügbar. Bitte die absendende Person um einen aktuellen Link.',
    });
  });

  it('claims and dismisses only the exact pending event entry', () => {
    const pending = pendingEvent();
    useProtectedRouteStore.setState({ pending });

    expect(
      claimPendingEventInviteEntryForUser({
        pendingRoute: pending,
        eventId: EVENT_ID,
        userId: 'user-a',
      })
    ).toBe(true);
    const claimed = useProtectedRouteStore.getState().pending;
    expect(claimed?.ownerUserId).toBe('user-a');

    useProtectedRouteStore.setState({
      pending: pendingEvent({
        path: `/events/${OTHER_EVENT_ID}?inviteToken=${CAPABILITY}`,
        ownerUserId: 'user-a',
      }),
    });
    expect(
      dismissPendingEventInviteEntry({
        pendingRoute: claimed,
        eventId: EVENT_ID,
        currentUserId: 'user-a',
      })
    ).toBe(false);
    expect(useProtectedRouteStore.getState().pending?.path).toContain(
      OTHER_EVENT_ID
    );
  });

  it('builds a promise receipt from authoritative invite data without claiming membership', async () => {
    mockLoadPromisePreview.mockResolvedValue({
      kind: 'ready',
      preview: {
        promiseTitle: 'Read before bed',
        promiseDescription: 'Twenty minutes',
        proofRule: 'Show the book',
        durationDays: 14,
        role: 'reviewer',
        inviterName: 'Alex',
      },
    });

    await expect(
      loadInboundInviteReceipt({
        pendingInvite: {
          type: 'challenge',
          code: 'BOOK2026',
          timestamp: Date.now(),
          ownerUserId: null,
        },
        pendingProtectedRoute: null,
      })
    ).resolves.toMatchObject({
      kind: 'ready',
      value: {
        kind: 'promise',
        promise: {
          promiseTitle: 'Read before bed',
          inviterName: 'Alex',
        },
      },
    });
    expect(mockLoadPromisePreview).toHaveBeenCalledWith('BOOK2026');
    expect(mockGetEventSummary).not.toHaveBeenCalled();
  });

  it('restores a named group invite for the authenticated account without consuming it', async () => {
    mockPreviewGroupInvite.mockResolvedValue({
      status: 'ACTIVE',
      inviteCode: 'GROUP2026',
      groupId: '44444444-4444-4444-8444-444444444444',
      groupName: 'Morning walkers',
      groupDescription: 'A supportive walking group.',
      privacy: 'private',
      memberCount: 4,
      inviterName: 'Mia',
      sharedPromise: 'Walk after work.',
      expiresAt: '2026-09-08T00:00:00.000Z',
      isMember: false,
    });

    await expect(
      loadInboundInviteReceipt({
        pendingInvite: {
          type: 'group',
          code: 'GROUP2026',
          timestamp: Date.now(),
          ownerUserId: 'user-a',
        },
        pendingProtectedRoute: null,
        currentUserId: 'user-a',
      })
    ).resolves.toMatchObject({
      kind: 'ready',
      value: {
        kind: 'group',
        group: {
          groupName: 'Morning walkers',
          inviterName: 'Mia',
          privacy: 'private',
        },
      },
    });
    expect(mockPreviewGroupInvite).toHaveBeenCalledWith('GROUP2026');
  });

  it('does not expose an account-owned group invitation to another account', async () => {
    await expect(
      loadInboundInviteReceipt({
        pendingInvite: {
          type: 'group',
          code: 'GROUP2026',
          timestamp: Date.now(),
          ownerUserId: 'user-a',
        },
        pendingProtectedRoute: null,
        currentUserId: 'user-b',
      })
    ).resolves.toBeNull();
    expect(mockPreviewGroupInvite).not.toHaveBeenCalled();
  });
});
