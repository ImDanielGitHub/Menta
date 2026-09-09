import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { useOnboardingCompletionStore } from '@/lib/navigation/onboarding-completion';
import {
  hydrateOnboardingInvitationLifecycle,
  useOnboardingInvitationLifecycleStore,
} from '@/lib/navigation/onboarding-invitation-lifecycle';

/** Every paywall surface shares the same onboarding exclusion. */
export function usePaywallAllowed(): boolean {
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
  return Boolean(
    ownerId &&
    completed &&
    hydrated &&
    !blocked &&
    pending?.ownerUserId !== ownerId &&
    !/onboarding|\/auth(?:\/|$)/.test(pathname)
  );
}
