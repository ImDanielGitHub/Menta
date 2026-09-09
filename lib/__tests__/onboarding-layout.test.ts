import {
  getOnboardingViewportProfile,
  getSignInRingStripGap,
  minimumSignInRingStripGap,
  onboardingViewportBreakpoints,
} from '@/lib/onboarding-layout';

describe('onboarding sign-in visual layout', () => {
  it('keeps the progress ring clear of the account strip', () => {
    expect(getSignInRingStripGap('regular')).toBeGreaterThanOrEqual(
      minimumSignInRingStripGap
    );
    expect(getSignInRingStripGap('compact')).toBeGreaterThanOrEqual(
      minimumSignInRingStripGap
    );
  });

  it('keeps normal onboarding screens uncompressed when auth is not showing', () => {
    expect(
      getOnboardingViewportProfile({
        availableHeight: onboardingViewportBreakpoints.authCrampedBelow - 1,
        shouldShowAuth: false,
      })
    ).toMatchObject({
      compact: true,
      tiny: false,
      shortAuthScreen: false,
      crampedAuthScreen: false,
      showDetail: true,
      useAuthScroll: false,
      hideAccountStrip: false,
    });
  });

  it('switches auth handoff into scrollable compact layout before clipping', () => {
    expect(
      getOnboardingViewportProfile({
        availableHeight: onboardingViewportBreakpoints.authScrollBelow - 1,
        shouldShowAuth: true,
      })
    ).toMatchObject({
      shortAuthScreen: true,
      crampedAuthScreen: false,
      showDetail: false,
      useAuthScroll: true,
      hideAccountStrip: false,
    });
  });

  it('uses the cramped auth profile for very short screens', () => {
    expect(
      getOnboardingViewportProfile({
        availableHeight: onboardingViewportBreakpoints.authCrampedBelow - 1,
        shouldShowAuth: true,
      })
    ).toMatchObject({
      shortAuthScreen: true,
      crampedAuthScreen: true,
      showDetail: false,
      useAuthScroll: true,
      hideAccountStrip: true,
    });
  });
});
