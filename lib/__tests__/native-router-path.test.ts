import {
  dispatchNativeEventNavigation,
  getProtectedEventPathFromRouterState,
  getSafeNativeIntentContext,
  isRejectedNativeEventIntent,
  normalizeNativeIntentPath,
  resolveNativeEventNavigation,
} from '@/lib/app-intents/native-router-path';

const EVENT_ID = '11111111-1111-4111-8111-111111111111';
const CAPABILITY = 'opaque_event_capability_1234567890';

describe('normalizeNativeIntentPath', () => {
  it('lands a cold Add Proof intent on Today while live state resolves the promise', () => {
    expect(normalizeNativeIntentPath('menta://checkin')).toBe('/(tabs)');
    expect(normalizeNativeIntentPath('lockedinprod:///checkin')).toBe(
      '/(tabs)'
    );
  });

  it('normalizes review-queue custom-scheme links into internal paths', () => {
    expect(
      normalizeNativeIntentPath(
        'menta:///review-queue?challengeId=challenge-1&entryPoint=proof_receipt'
      )
    ).toBe('/review-queue?challengeId=challenge-1&entryPoint=proof_receipt');

    expect(
      normalizeNativeIntentPath(
        'menta://review-queue?submissionId=submission-1'
      )
    ).toBe('/review-queue?submissionId=submission-1');
  });

  it('normalizes app routes where custom schemes put route segments in the host', () => {
    expect(
      normalizeNativeIntentPath(
        'lockedinprod://groups/group-1?entryPoint=invite'
      )
    ).toBe('/groups/group-1?entryPoint=invite');

    expect(
      normalizeNativeIntentPath(
        'lockedin://challenges/challenge-1?source=notification'
      )
    ).toBe('/challenges/challenge-1?source=notification');
  });

  it('normalizes universal links from Menta-owned hosts', () => {
    expect(
      normalizeNativeIntentPath(
        'https://menta.quest/join/GROUP123?source=share'
      )
    ).toBe('/join?source=share&code=GROUP123');
    expect(
      normalizeNativeIntentPath(
        'https://menta.quest/join/challenge/PROMISE123?source=share'
      )
    ).toBe('/join?source=share&code=PROMISE123&type=challenge');
  });

  it('maps public event links onto the existing Expo Router event route', () => {
    expect(
      normalizeNativeIntentPath(
        `https://menta.quest/event/${EVENT_ID}?share=${CAPABILITY}`
      )
    ).toBe(`/events/${EVENT_ID}?shareToken=${CAPABILITY}`);

    expect(
      normalizeNativeIntentPath(
        `menta://event/${EVENT_ID}?invite=${CAPABILITY}`
      )
    ).toBe(`/events/${EVENT_ID}?inviteToken=${CAPABILITY}`);
  });

  it('rejects capability-bearing plural event routes outside the protected handoff', () => {
    expect(
      normalizeNativeIntentPath(`/events/${EVENT_ID}?shareToken=${CAPABILITY}`)
    ).toBeNull();
    expect(
      normalizeNativeIntentPath(
        `menta://events/${EVENT_ID}?inviteToken=${CAPABILITY}`
      )
    ).toBeNull();
    expect(
      normalizeNativeIntentPath(
        `https://menta.quest/events/${EVENT_ID}?invite=${CAPABILITY}`
      )
    ).toBeNull();
    expect(
      normalizeNativeIntentPath(
        `menta://events/${EVENT_ID}?source=notification`
      )
    ).toBe(`/events/${EVENT_ID}?source=notification`);
    expect(
      isRejectedNativeEventIntent(
        `menta://events/${EVENT_ID}?inviteToken=${CAPABILITY}`
      )
    ).toBe(true);
  });

  it('rejects invalid event capabilities without treating them as invite codes', () => {
    const inviteLikeCapability = 'A'.repeat(32);

    expect(
      normalizeNativeIntentPath(
        `https://menta.quest/event/${EVENT_ID}?invite=short`
      )
    ).toBeNull();
    expect(
      resolveNativeEventNavigation({
        path: `https://menta.quest/event/${EVENT_ID}?share=${CAPABILITY}&invite=${inviteLikeCapability}`,
        isAuthenticated: true,
        hasCompletedOnboarding: true,
      })
    ).toEqual({ action: 'ignore_invalid_event' });
    expect(
      normalizeNativeIntentPath(
        `http://menta.quest/event/${EVENT_ID}?share=${CAPABILITY}`
      )
    ).toBeNull();
    expect(
      isRejectedNativeEventIntent(
        `https://menta.quest/event/${EVENT_ID}?invite=short`
      )
    ).toBe(true);
  });

  it('returns executable warm-link decisions for auth and onboarding state', () => {
    const link = `https://menta.quest/event/${EVENT_ID}?invite=${CAPABILITY}`;
    const eventPath = `/events/${EVENT_ID}?inviteToken=${CAPABILITY}`;

    expect(
      resolveNativeEventNavigation({
        path: link,
        isAuthenticated: false,
        hasCompletedOnboarding: false,
      })
    ).toEqual({ action: 'require_auth', path: eventPath });
    expect(
      resolveNativeEventNavigation({
        path: link,
        isAuthenticated: true,
        hasCompletedOnboarding: false,
      })
    ).toEqual({ action: 'finish_onboarding', path: eventPath });
    expect(
      resolveNativeEventNavigation({
        path: link,
        isAuthenticated: true,
        hasCompletedOnboarding: true,
      })
    ).toEqual({ action: 'open_event', path: eventPath });
  });

  it('dispatches warm event links through the same callbacks RootLayout uses', () => {
    const requireAuth = jest.fn();
    const finishOnboarding = jest.fn();
    const openEvent = jest.fn();
    const eventPath = `/events/${EVENT_ID}?shareToken=${CAPABILITY}`;

    expect(
      dispatchNativeEventNavigation(
        {
          path: `https://menta.quest/event/${EVENT_ID}?share=${CAPABILITY}`,
          isAuthenticated: true,
          hasCompletedOnboarding: true,
        },
        { requireAuth, finishOnboarding, openEvent }
      )
    ).toBe(true);
    expect(openEvent).toHaveBeenCalledWith(eventPath);
    expect(requireAuth).not.toHaveBeenCalled();
    expect(finishOnboarding).not.toHaveBeenCalled();

    openEvent.mockClear();
    expect(
      dispatchNativeEventNavigation(
        {
          path: `https://menta.quest/event/${EVENT_ID}?share=${CAPABILITY}`,
          isAuthenticated: false,
          hasCompletedOnboarding: false,
        },
        { requireAuth, finishOnboarding, openEvent }
      )
    ).toBe(true);
    expect(requireAuth).toHaveBeenCalledWith(eventPath);
    expect(openEvent).not.toHaveBeenCalled();

    expect(
      dispatchNativeEventNavigation(
        {
          path: 'menta:///review-queue',
          isAuthenticated: true,
          hasCompletedOnboarding: true,
        },
        { requireAuth, finishOnboarding, openEvent }
      )
    ).toBe(false);
  });

  it('keeps a cold-start event capability through the protected-route handoff', () => {
    expect(
      getProtectedEventPathFromRouterState(`/events/${EVENT_ID}`, {
        eventId: EVENT_ID,
        shareToken: CAPABILITY,
      })
    ).toBe(`/events/${EVENT_ID}?shareToken=${CAPABILITY}`);

    expect(
      getProtectedEventPathFromRouterState(`/events/${EVENT_ID}`, {
        shareToken: CAPABILITY,
        inviteToken: CAPABILITY,
      })
    ).toBeNull();
  });

  it('removes capability query values from diagnostic context', () => {
    const context = getSafeNativeIntentContext(
      `https://menta.quest/event/${EVENT_ID}?share=${CAPABILITY}`
    );

    expect(context).toEqual({
      hasUrl: true,
      scheme: 'https',
      hostname: 'menta.quest',
      path: `/event/${EVENT_ID}`,
    });
    expect(JSON.stringify(context)).not.toContain(CAPABILITY);
  });

  it('allows already-internal app paths and rejects unsafe paths', () => {
    expect(
      normalizeNativeIntentPath(
        '/verification?challengeId=challenge-1&verificationType=text'
      )
    ).toBe('/verification?challengeId=challenge-1&verificationType=text');

    expect(
      normalizeNativeIntentPath(
        'menta:///group-members?id=group-1&entryPoint=notification'
      )
    ).toBe('/group-members?id=group-1&entryPoint=notification');

    expect(
      normalizeNativeIntentPath(
        'menta:///(tabs)?openCreateModal=1&createSource=home_plus'
      )
    ).toBe('/(tabs)?openCreateModal=1&createSource=home_plus');

    expect(
      normalizeNativeIntentPath('menta:///join-funding?code=FIT2026')
    ).toBe('/join-funding?code=FIT2026');

    expect(normalizeNativeIntentPath('https://example.com/review-queue')).toBe(
      null
    );
    expect(normalizeNativeIntentPath('menta:///admin/issues')).toBe(null);
    expect(normalizeNativeIntentPath('menta:///auth-required')).toBe(null);
  });
});
