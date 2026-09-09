export type StartupRouteState = {
  currentSegment: string | undefined;
  inAuthFlow: boolean;
  inIntroReplay: boolean;
  inInviteEntry: boolean;
  inLegalAcceptanceFlow: boolean;
  inOnboardingFlow: boolean;
  inPasswordRecoveryFlow: boolean;
  inPublicSupport: boolean;
  inTabGroup: boolean;
  isPublicPreAuthRoute: boolean;
};

export const getStartupRouteState = (
  currentSegment: string | undefined
): StartupRouteState => {
  const inAuthFlow =
    currentSegment === 'login' ||
    currentSegment === 'register' ||
    currentSegment === 'auth-required' ||
    currentSegment === 'email-auth' ||
    currentSegment === 'email-confirmation' ||
    currentSegment === 'forgot-password';
  const inIntroReplay = currentSegment === 'onboarding-again';
  const inLegalAcceptanceFlow = currentSegment === 'legal-acceptance';
  const inPasswordRecoveryFlow = currentSegment === 'password-recovery';
  const inInviteEntry =
    currentSegment === 'invite' ||
    currentSegment === 'join' ||
    currentSegment === 'join-group' ||
    currentSegment === 'join-promise' ||
    currentSegment === 'join-event';
  const inAccountDeletionReceipt = currentSegment === 'account-deleted';
  const inOnboardingFlow =
    currentSegment === 'onboarding' ||
    currentSegment === 'invite-activation' ||
    inIntroReplay;
  const inPublicSupport = currentSegment === 'support';
  const inTabGroup = currentSegment === '(tabs)';

  return {
    currentSegment,
    inAuthFlow,
    inIntroReplay,
    inInviteEntry,
    inLegalAcceptanceFlow,
    inOnboardingFlow,
    inPasswordRecoveryFlow,
    inPublicSupport,
    inTabGroup,
    isPublicPreAuthRoute:
      inAuthFlow ||
      inPasswordRecoveryFlow ||
      inOnboardingFlow ||
      inInviteEntry ||
      inAccountDeletionReceipt ||
      inPublicSupport,
  };
};

export const getPasswordRecoveryConfinementDestination = ({
  recoveryUserId,
  route,
}: {
  recoveryUserId: string | null;
  route: StartupRouteState;
}): '/password-recovery' | null =>
  recoveryUserId && !route.inPasswordRecoveryFlow ? '/password-recovery' : null;

export const shouldHydratePasswordRecoveryAtRoot = (route: StartupRouteState) =>
  !route.inPasswordRecoveryFlow;

const EMAIL_CONFIRMATION_HANDOFF_SEGMENTS = new Set([
  'email-confirmation',
  'email-auth',
  'login',
  'forgot-password',
  'password-recovery',
]);

export const shouldResumePendingEmailConfirmation = ({
  currentSegment,
  hasPendingConfirmation,
  isAuthenticated,
}: {
  currentSegment: string | undefined;
  hasPendingConfirmation: boolean;
  isAuthenticated: boolean;
}): boolean =>
  hasPendingConfirmation &&
  !isAuthenticated &&
  !EMAIL_CONFIRMATION_HANDOFF_SEGMENTS.has(currentSegment ?? '');

export const shouldHoldStartupLoading = ({
  canResumeOwnedCompletion = false,
  isAuthenticated,
  hasCompletedOnboarding,
  isInitialized,
  isLoading,
  route,
}: {
  canResumeOwnedCompletion?: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  route: StartupRouteState;
}): boolean => {
  if (
    canResumeOwnedCompletion &&
    route.inOnboardingFlow &&
    !route.inIntroReplay
  ) {
    return false;
  }

  // Once onboarding has confirmed this account, the invite destination owns
  // its loading and recovery UI. A same-account session refresh can overlap
  // this handoff; it must not replace the mounted destination with the global
  // startup loader and make the successful navigation look stuck.
  if (
    isInitialized &&
    isAuthenticated &&
    hasCompletedOnboarding &&
    route.currentSegment === 'promise-accountability'
  ) {
    return false;
  }

  if (!isInitialized || isLoading) return true;

  if (!isAuthenticated) {
    return (
      route.inTabGroup || !route.currentSegment || !route.isPublicPreAuthRoute
    );
  }

  if (route.inPasswordRecoveryFlow) return false;

  if (!hasCompletedOnboarding) {
    return !(
      route.inOnboardingFlow ||
      route.inInviteEntry ||
      route.inLegalAcceptanceFlow
    );
  }

  return route.inAuthFlow || (route.inOnboardingFlow && !route.inIntroReplay);
};
