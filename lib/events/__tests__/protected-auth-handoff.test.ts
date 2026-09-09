import {
  EVENT_AUTH_GATE_DESTINATION,
  getHeldEventCapability,
  hydrateEventCapabilityForSurface,
  prepareEventAuthHandoff,
  transferEventCapability,
} from '@/lib/events/protected-auth-handoff';
import {
  clearAllEventCapabilitiesForTests,
  EVENT_CAPABILITY_HOLDER_TTL_MS,
  holdEventCapability,
  peekEventCapability,
} from '@/lib/events/event-capability-holder';
import { useProtectedRouteStore } from '@/store/protected-route-store';
import { chooseOnboardingCompletionDestination } from '@/lib/navigation/onboarding-completion';

const EVENT_ID = '11111111-1111-4111-8111-111111111111';
const CAPABILITY = 'opaque_event_capability_1234567890';

describe('event protected auth handoff', () => {
  beforeEach(() => {
    useProtectedRouteStore.setState({ pending: null });
    clearAllEventCapabilitiesForTests();
  });

  it('stores the capability privately and returns a secret-free auth route', () => {
    const destination = prepareEventAuthHandoff({
      eventId: EVENT_ID,
      surface: 'proof',
      shareToken: CAPABILITY,
    });

    expect(destination).toEqual(EVENT_AUTH_GATE_DESTINATION);
    expect(JSON.stringify(destination)).not.toContain(CAPABILITY);
    expect(useProtectedRouteStore.getState().pending).toMatchObject({
      path: `/events/${EVENT_ID}/proof?shareToken=${CAPABILITY}`,
      source: 'auth_gate',
    });
  });

  it('rejects malformed or conflicting event capabilities', () => {
    expect(
      prepareEventAuthHandoff({
        eventId: EVENT_ID,
        surface: 'check-in',
        shareToken: CAPABILITY,
        inviteToken: CAPABILITY,
      })
    ).toBeNull();
    expect(
      prepareEventAuthHandoff({
        eventId: EVENT_ID,
        surface: 'detail',
        inviteToken: 'short',
      })
    ).toBeNull();
    expect(useProtectedRouteStore.getState().pending).toBeNull();
  });

  it('recovers only the account-owned capability for the exact event surface', () => {
    useProtectedRouteStore.setState({
      pending: {
        path: `/events/${EVENT_ID}/check-in?inviteToken=${CAPABILITY}`,
        source: 'onboarding_gate',
        timestamp: Date.now(),
        ownerUserId: 'user-a',
      },
    });

    expect(
      getHeldEventCapability({
        pendingRoute: useProtectedRouteStore.getState().pending,
        userId: 'user-a',
        eventId: EVENT_ID,
        surface: 'check-in',
      })
    ).toEqual({ shareToken: null, inviteToken: CAPABILITY });
    expect(
      getHeldEventCapability({
        pendingRoute: useProtectedRouteStore.getState().pending,
        userId: 'user-b',
        eventId: EVENT_ID,
        surface: 'check-in',
      })
    ).toBeNull();
    expect(
      getHeldEventCapability({
        pendingRoute: useProtectedRouteStore.getState().pending,
        userId: 'user-a',
        eventId: EVENT_ID,
        surface: 'detail',
      })
    ).toBeNull();
  });

  it('hydrates once, acknowledges persisted state and traverses surfaces privately', () => {
    useProtectedRouteStore.setState({
      pending: {
        path: `/events/${EVENT_ID}?inviteToken=${CAPABILITY}`,
        source: 'onboarding_gate',
        timestamp: Date.now(),
        ownerUserId: 'user-a',
      },
    });

    expect(
      hydrateEventCapabilityForSurface({
        userId: 'user-a',
        eventId: EVENT_ID,
        surface: 'detail',
      })
    ).toEqual({ shareToken: null, inviteToken: CAPABILITY });
    expect(useProtectedRouteStore.getState().pending).toBeNull();
    expect(
      peekEventCapability({
        ownerUserId: 'user-a',
        eventId: EVENT_ID,
        surface: 'detail',
      })?.token
    ).toBe(CAPABILITY);
    expect(
      chooseOnboardingCompletionDestination({
        pendingInvite: null,
        pendingProtectedRoute: useProtectedRouteStore
          .getState()
          .peekPendingRouteForUser('user-a'),
        completion: null,
      })
    ).toEqual({ kind: 'tabs', href: '/(tabs)' });

    expect(
      transferEventCapability({
        userId: 'user-a',
        eventId: EVENT_ID,
        from: 'detail',
        to: 'check-in',
      })
    ).toBe(true);
    expect(
      transferEventCapability({
        userId: 'user-a',
        eventId: EVENT_ID,
        from: 'check-in',
        to: 'detail',
      })
    ).toBe(true);
    expect(
      transferEventCapability({
        userId: 'user-a',
        eventId: EVENT_ID,
        from: 'detail',
        to: 'proof',
      })
    ).toBe(true);
    expect(
      transferEventCapability({
        userId: 'user-a',
        eventId: EVENT_ID,
        from: 'proof',
        to: 'detail',
      })
    ).toBe(true);
    expect(
      useProtectedRouteStore.getState().peekPendingRouteForUser('user-a')
    ).toBeNull();
  });

  it('replaces an older held token with the valid capability from the current link', () => {
    const oldToken = 'old_event_capability_1234567890';
    const newToken = 'new_event_capability_1234567890';
    holdEventCapability({
      ownerUserId: 'user-a',
      eventId: EVENT_ID,
      surface: 'detail',
      kind: 'invite',
      token: oldToken,
    });

    expect(
      hydrateEventCapabilityForSurface({
        userId: 'user-a',
        eventId: EVENT_ID,
        surface: 'detail',
        shareToken: newToken,
      })
    ).toEqual({ shareToken: newToken, inviteToken: null });
    expect(
      peekEventCapability({
        ownerUserId: 'user-a',
        eventId: EVENT_ID,
        surface: 'detail',
      })
    ).toMatchObject({ kind: 'share', token: newToken });
  });

  it('isolates capabilities by account and expires volatile entries', () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000);
    const userAToken = 'user_a_event_capability_1234567890';
    const userBToken = 'user_b_event_capability_1234567890';
    holdEventCapability({
      ownerUserId: 'user-a',
      eventId: EVENT_ID,
      surface: 'detail',
      kind: 'invite',
      token: userAToken,
    });
    hydrateEventCapabilityForSurface({
      userId: 'user-b',
      eventId: EVENT_ID,
      surface: 'detail',
      inviteToken: userBToken,
    });

    expect(
      peekEventCapability({
        ownerUserId: 'user-a',
        eventId: EVENT_ID,
        surface: 'detail',
      })?.token
    ).toBe(userAToken);
    expect(
      peekEventCapability({
        ownerUserId: 'user-b',
        eventId: EVENT_ID,
        surface: 'detail',
      })?.token
    ).toBe(userBToken);

    now.mockReturnValue(1_000 + EVENT_CAPABILITY_HOLDER_TTL_MS + 1);
    expect(
      peekEventCapability({
        ownerUserId: 'user-a',
        eventId: EVENT_ID,
        surface: 'detail',
      })
    ).toBeNull();
  });
});
