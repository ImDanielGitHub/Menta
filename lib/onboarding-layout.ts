export const signInLayout = {
  regular: {
    illustrationHeight: 300,
    ringSize: 204,
    ringBorder: 16,
    ringOffsetY: -24,
    stripMinHeight: 44,
    stripBottom: 0,
  },
  compact: {
    illustrationHeight: 232,
    ringSize: 176,
    ringBorder: 14,
    ringOffsetY: -20,
    stripMinHeight: 40,
    stripBottom: 0,
  },
  cramped: {
    illustrationHeight: 142,
    ringSize: 140,
    ringBorder: 12,
    ringOffsetY: 0,
    stripMinHeight: 0,
    stripBottom: 0,
  },
} as const;

export const minimumSignInRingStripGap = 8;

export type SignInLayoutProfile = keyof typeof signInLayout;

export const onboardingViewportBreakpoints = {
  compactBelow: 760,
  tinyBelow: 700,
  authScrollBelow: 820,
  authCrampedBelow: 720,
} as const;

export type OnboardingViewportProfile = {
  compact: boolean;
  tiny: boolean;
  shortAuthScreen: boolean;
  crampedAuthScreen: boolean;
  showDetail: boolean;
  useAuthScroll: boolean;
  hideAccountStrip: boolean;
};

export const getSignInRingStripGap = (
  profile: Exclude<SignInLayoutProfile, 'cramped'>
) => {
  const layout = signInLayout[profile];
  const ringTop =
    (layout.illustrationHeight - layout.ringSize) / 2 + layout.ringOffsetY;
  const ringBottom = ringTop + layout.ringSize;
  const stripTop =
    layout.illustrationHeight - layout.stripBottom - layout.stripMinHeight;

  return stripTop - ringBottom;
};

export const getOnboardingViewportProfile = ({
  availableHeight,
  shouldShowAuth,
}: {
  availableHeight: number;
  shouldShowAuth: boolean;
}): OnboardingViewportProfile => {
  const compact = availableHeight < onboardingViewportBreakpoints.compactBelow;
  const tiny = availableHeight < onboardingViewportBreakpoints.tinyBelow;
  const shortAuthScreen =
    shouldShowAuth &&
    availableHeight < onboardingViewportBreakpoints.authScrollBelow;
  const crampedAuthScreen =
    shouldShowAuth &&
    availableHeight < onboardingViewportBreakpoints.authCrampedBelow;

  return {
    compact,
    tiny,
    shortAuthScreen,
    crampedAuthScreen,
    showDetail: !shortAuthScreen,
    useAuthScroll: shortAuthScreen,
    hideAccountStrip: crampedAuthScreen,
  };
};
