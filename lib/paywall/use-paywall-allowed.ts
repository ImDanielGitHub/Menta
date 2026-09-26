import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import {
  canResumeOwnedOnboardingCompletion,
  useOnboardingCompletionStore,
} from '@/lib/navigation/onboarding-completion';
import {
  hydrateOnboardingInvitationLifecycle,
  useOnboardingInvitationLifecycleStore,
} from '@/lib/navigation/onboarding-invitation-lifecycle';

/** Every paywall surface shares the same onboarding exclusion. */
export function usePaywallAllowed(onboardingOwnerId?: string): boolean {
  const pathname = usePathname();
  const ownerId = useAuthStore(state => state.user?.id);
  const completed = useAuthStore(state => state.hasCompletedOnboarding);
  const pending = useOnboardingCompletionStore(state => state.pending);
  const hydrated = useOnboardingInvitationLifecycleStore(
    state => state.hydrated
  );
  const blocked = useOnboardingInvitationLifecycleStore(state =>
    ownerId
      ? Boolean(state.blockedOwners[ownerId]) ||
        state.entries[ownerId]?.status === 'pending'
      : true
  );
  useEffect(() => {
    void hydrateOnboardingInvitationLifecycle();
  }, []);
  const explicitProfileEntry =
    pathname === '/profile' || pathname === '/(tabs)/profile';
  const completionInFlight = canResumeOwnedOnboardingCompletion({
    completion: pending,
    currentUserId: ownerId ?? null,
    hasCompletedOnboarding: completed,
    isAuthenticated: Boolean(ownerId),
    isInitialized: true,
  });
  // Only the explicitly assigned pre-activation gate may open in onboarding.
  // Ordinary upsells retain the shared exclusion below.
  if (onboardingOwnerId) {
    return Boolean(
      ownerId === onboardingOwnerId &&
      !completed &&
      pathname === '/onboarding' &&
      !completionInFlight
    );
  }
  return Boolean(
    ownerId &&
    completed &&
    // Explicit membership management in You stays usable after setup even if
    // an abandoned invitation is still deferring automatic review prompts.
    (explicitProfileEntry || (hydrated && !blocked)) &&
    !completionInFlight &&
    !/onboarding|\/auth(?:\/|$)/.test(pathname)
  );
}
