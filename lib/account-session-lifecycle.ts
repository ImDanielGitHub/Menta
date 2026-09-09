import { notificationService } from '@/lib/services/notification-service';
import { retentionNotificationClient } from '@/lib/notifications/retention-notification-client';
import { useOnboardingCompletionStore } from '@/lib/navigation/onboarding-completion';
import { clearEventCapabilitiesForUser } from '@/lib/events/event-capability-holder';
import { clearOwnedOnboardingDraft } from '@/lib/onboarding-draft';
import { useChallengeStore } from '@/store/challenge-store';
import { useEventStore } from '@/store/event-store';
import { useGroupStore } from '@/store/group-store';
import { useInviteStore } from '@/store/invite-store';
import { useMomentaStore } from '@/store/momenta-store';
import { useProtectedRouteStore } from '@/store/protected-route-store';
import { useReferralStore } from '@/store/referral-store';

let teardownPromise: Promise<void> | null = null;

/**
 * Stop work and remove in-memory/persisted data that belongs to one account.
 * Durable proof/media drafts stay namespaced by user so a later sign-in can
 * safely resume them; they are never exposed through another account's state.
 */
export const clearAccountScopedState = async (
  userId: string | null | undefined
): Promise<void> => {
  if (teardownPromise) {
    await teardownPromise;
  }

  teardownPromise = (async () => {
    if (userId) {
      notificationService.stopUserScopedWork(userId);
      await retentionNotificationClient.unbindAccount(userId);
      useOnboardingCompletionStore.getState().clearOwnedCompletion(userId);
      clearEventCapabilitiesForUser(userId);
      useProtectedRouteStore.getState().clearOwnedPendingRoute(userId);
      useInviteStore.getState().clearOwnedPendingInvite(userId);
    }

    useMomentaStore.getState().clearMomentaData();
    useReferralStore.getState().clearState(userId ?? undefined);
    useEventStore.getState().clearEventData();
    const { clearAllCache } = await import('@/lib/queryClient');

    await Promise.allSettled([
      useChallengeStore.getState().clearPersistedState(),
      useGroupStore.getState().clearGroupData(),
      clearAllCache(),
      userId ? clearOwnedOnboardingDraft(userId) : Promise.resolve(),
    ]);
  })();

  try {
    await teardownPromise;
  } finally {
    teardownPromise = null;
  }
};
