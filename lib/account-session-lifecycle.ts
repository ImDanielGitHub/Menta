import { Platform } from 'react-native';
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
let privateImageCachesCleared = false;
let legacyPrivateVideoCacheCleared = false;

export const ensurePrivateImageCachesCleared = async (): Promise<void> => {
  if (
    (privateImageCachesCleared && legacyPrivateVideoCacheCleared) ||
    Platform.OS === 'web'
  )
    return;
  const { Image } = await import('expo-image');
  if (!privateImageCachesCleared) {
    const [memoryCleared, diskCleared] = await Promise.all([
      Image.clearMemoryCache(),
      Image.clearDiskCache(),
    ]);
    if (!memoryCleared || !diskCleared) {
      throw new Error(
        'Private media caches could not be cleared. Please try again.'
      );
    }
    privateImageCachesCleared = true;
  }
  if (!legacyPrivateVideoCacheCleared) {
    // Private playback now always uses useCaching:false. Purge video data left
    // by older releases once, before the first account is allowed to bind.
    const { clearPrivateVideoCache } =
      await import('@/lib/auth/clear-private-video-cache');
    await clearPrivateVideoCache();
    legacyPrivateVideoCacheCleared = true;
  }
};

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
    privateImageCachesCleared = false;
    const retentionUnbinding = userId
      ? Promise.resolve().then(() =>
          retentionNotificationClient.unbindAccount(userId)
        )
      : Promise.resolve();
    if (userId) {
      notificationService.stopUserScopedWork(userId);
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
      retentionUnbinding,
      useChallengeStore.getState().clearPersistedState(),
      useGroupStore.getState().clearGroupData(),
      clearAllCache(),
      userId ? clearOwnedOnboardingDraft(userId) : Promise.resolve(),
    ]);
    // Other account data is removed even when native media cleanup fails.
    // The next session must retry successfully before it can bind.
    await ensurePrivateImageCachesCleared();
  })();

  try {
    await teardownPromise;
  } finally {
    teardownPromise = null;
  }
};
