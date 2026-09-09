import {
  getStartupRouteState,
  shouldHoldStartupLoading,
} from '@/lib/navigation/startup-route-gate';

describe('startup route gate', () => {
  it('keeps a confirmed deletion receipt public after logout', () => {
    const route = getStartupRouteState('account-deleted');

    expect(route.isPublicPreAuthRoute).toBe(true);
    expect(
      shouldHoldStartupLoading({
        isAuthenticated: false,
        hasCompletedOnboarding: false,
        isInitialized: true,
        route,
      })
    ).toBe(false);
  });

  it('does not classify the receipt as a sign-in route during logout', () => {
    const route = getStartupRouteState('account-deleted');

    expect(route.inAuthFlow).toBe(false);
    expect(
      shouldHoldStartupLoading({
        isAuthenticated: true,
        hasCompletedOnboarding: true,
        isInitialized: true,
        route,
      })
    ).toBe(false);
  });
});
