import {
  getPasswordRecoveryConfinementDestination,
  getStartupRouteState,
  shouldHydratePasswordRecoveryAtRoot,
  shouldHoldStartupLoading,
  shouldResumePendingEmailConfirmation,
} from '@/lib/navigation/startup-route-gate';

const shouldHold = ({
  segment,
  isAuthenticated = false,
  hasCompletedOnboarding = false,
  isInitialized = true,
  isLoading = false,
}: {
  segment?: string;
  isAuthenticated?: boolean;
  hasCompletedOnboarding?: boolean;
  isInitialized?: boolean;
  isLoading?: boolean;
}) =>
  shouldHoldStartupLoading({
    isAuthenticated,
    hasCompletedOnboarding,
    isInitialized,
    isLoading,
    route: getStartupRouteState(segment),
  });

describe('startup route loading gate', () => {
  it.each(['(tabs)', 'settings', 'events', 'auth-required'])(
    'confines a durable recovery session before %s can open',
    segment => {
      expect(
        getPasswordRecoveryConfinementDestination({
          recoveryUserId: 'recovery-user',
          route: getStartupRouteState(segment),
        })
      ).toBe('/password-recovery');
    }
  );

  it('allows only the recovery route while durable recovery is active', () => {
    expect(
      getPasswordRecoveryConfinementDestination({
        recoveryUserId: 'recovery-user',
        route: getStartupRouteState('password-recovery'),
      })
    ).toBeNull();
  });

  it('leaves callback hydration to the isolated recovery route', () => {
    expect(
      shouldHydratePasswordRecoveryAtRoot(
        getStartupRouteState('password-recovery')
      )
    ).toBe(false);
    expect(
      shouldHydratePasswordRecoveryAtRoot(getStartupRouteState('(tabs)'))
    ).toBe(true);
  });
  it('keeps the launch surface mounted until auth initialises', () => {
    expect(shouldHold({ segment: '(tabs)', isInitialized: false })).toBe(true);
  });

  it('keeps returning users behind loading until their profile is confirmed', () => {
    expect(
      shouldHold({
        segment: 'login',
        isAuthenticated: true,
        hasCompletedOnboarding: false,
        isLoading: true,
      })
    ).toBe(true);
  });

  it('does not paint tabs or protected content before signed-out routing', () => {
    expect(shouldHold({ segment: '(tabs)' })).toBe(true);
    expect(shouldHold({ segment: 'settings' })).toBe(true);
    expect(shouldHold({ segment: undefined })).toBe(true);
  });

  it('allows signed-out onboarding, auth, invite, and Support entry routes', () => {
    expect(shouldHold({ segment: 'onboarding' })).toBe(false);
    expect(shouldHold({ segment: 'login' })).toBe(false);
    expect(shouldHold({ segment: 'join-group' })).toBe(false);
    expect(shouldHold({ segment: 'join-promise' })).toBe(false);
    expect(shouldHold({ segment: 'join-event' })).toBe(false);
    expect(shouldHold({ segment: 'support' })).toBe(false);
    expect(shouldHold({ segment: 'password-recovery' })).toBe(false);
    expect(shouldHold({ segment: 'email-confirmation' })).toBe(false);
    expect(shouldHold({ segment: 'report-issue' })).toBe(true);
  });

  it('keeps email confirmation and its callback inside the auth flow', () => {
    const route = getStartupRouteState('email-confirmation');

    expect(route.inAuthFlow).toBe(true);
    expect(route.isPublicPreAuthRoute).toBe(true);
  });

  it.each(['join-group', 'join-promise', 'join-event'])(
    'classifies %s as a public invitation entry',
    currentSegment => {
      const route = getStartupRouteState(currentSegment);
      expect(route.inInviteEntry).toBe(true);
      expect(route.isPublicPreAuthRoute).toBe(true);
    }
  );

  it('classifies invite activation as bounded onboarding', () => {
    const route = getStartupRouteState('invite-activation');
    expect(route.inOnboardingFlow).toBe(true);
    expect(route.isPublicPreAuthRoute).toBe(true);
  });

  it.each([undefined, '(tabs)', 'onboarding', 'join-promise', 'join-event'])(
    'resumes a pending email confirmation before the signed-out %s route',
    currentSegment => {
      expect(
        shouldResumePendingEmailConfirmation({
          currentSegment,
          hasPendingConfirmation: true,
          isAuthenticated: false,
        })
      ).toBe(true);
    }
  );

  it.each([
    'email-confirmation',
    'email-auth',
    'login',
    'forgot-password',
    'password-recovery',
  ])(
    'does not interrupt the %s confirmation recovery surface',
    currentSegment => {
      expect(
        shouldResumePendingEmailConfirmation({
          currentSegment,
          hasPendingConfirmation: true,
          isAuthenticated: false,
        })
      ).toBe(false);
    }
  );

  it('does not route a confirmed session back to a stale email handoff', () => {
    expect(
      shouldResumePendingEmailConfirmation({
        currentSegment: '(tabs)',
        hasPendingConfirmation: true,
        isAuthenticated: true,
      })
    ).toBe(false);
  });

  it('holds authenticated unfinished accounts until onboarding is active', () => {
    expect(shouldHold({ segment: '(tabs)', isAuthenticated: true })).toBe(true);
    expect(shouldHold({ segment: 'login', isAuthenticated: true })).toBe(true);
    expect(shouldHold({ segment: 'onboarding', isAuthenticated: true })).toBe(
      false
    );
    expect(
      shouldHold({ segment: 'invite-activation', isAuthenticated: true })
    ).toBe(false);
    expect(shouldHold({ segment: 'join-promise', isAuthenticated: true })).toBe(
      false
    );
    expect(shouldHold({ segment: 'join-event', isAuthenticated: true })).toBe(
      false
    );
    expect(
      shouldHold({ segment: 'legal-acceptance', isAuthenticated: true })
    ).toBe(false);
  });

  it('keeps legal acceptance private before authentication', () => {
    const route = getStartupRouteState('legal-acceptance');

    expect(route.inLegalAcceptanceFlow).toBe(true);
    expect(route.isPublicPreAuthRoute).toBe(false);
    expect(shouldHold({ segment: 'legal-acceptance' })).toBe(true);
  });

  it('holds completed accounts until stale auth or onboarding routes redirect', () => {
    const completed = {
      isAuthenticated: true,
      hasCompletedOnboarding: true,
    };

    expect(shouldHold({ segment: 'login', ...completed })).toBe(true);
    expect(shouldHold({ segment: 'onboarding', ...completed })).toBe(true);
    expect(shouldHold({ segment: 'onboarding-again', ...completed })).toBe(
      false
    );
    expect(shouldHold({ segment: '(tabs)', ...completed })).toBe(false);
    expect(shouldHold({ segment: 'password-recovery', ...completed })).toBe(
      false
    );
  });
});
