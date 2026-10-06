jest.mock('@/lib/queryClient', () => ({ clearAllCache: jest.fn() }));
jest.mock('@/lib/services/notification-service', () => ({
  notificationService: { stopUserScopedWork: jest.fn() },
}));
jest.mock('@/lib/notifications/retention-notification-client', () => ({
  retentionNotificationClient: { unbindAccount: jest.fn() },
}));
jest.mock('@/lib/onboarding-draft', () => ({
  clearOwnedOnboardingDraft: jest.fn(),
}));
jest.mock('@/lib/navigation/onboarding-completion', () => {
  const clearOwnedCompletion = jest.fn();
  return {
    useOnboardingCompletionStore: {
      getState: () => ({ clearOwnedCompletion }),
    },
  };
});
jest.mock('@/store/challenge-store', () => {
  const clearPersistedState = jest.fn();
  return {
    useChallengeStore: { getState: () => ({ clearPersistedState }) },
  };
});
jest.mock('@/store/event-store', () => {
  const clearEventData = jest.fn();
  return { useEventStore: { getState: () => ({ clearEventData }) } };
});
jest.mock('@/store/group-store', () => {
  const clearGroupData = jest.fn();
  return { useGroupStore: { getState: () => ({ clearGroupData }) } };
});
jest.mock('@/store/momenta-store', () => {
  const clearMomentaData = jest.fn();
  return { useMomentaStore: { getState: () => ({ clearMomentaData }) } };
});
jest.mock('@/store/invite-store', () => {
  const clearOwnedPendingInvite = jest.fn();
  return {
    useInviteStore: { getState: () => ({ clearOwnedPendingInvite }) },
  };
});
jest.mock('@/store/protected-route-store', () => {
  const clearOwnedPendingRoute = jest.fn();
  return {
    useProtectedRouteStore: { getState: () => ({ clearOwnedPendingRoute }) },
  };
});
jest.mock('@/store/referral-store', () => {
  const clearState = jest.fn();
  return { useReferralStore: { getState: () => ({ clearState }) } };
});

import {
  clearAccountScopedState,
  ensurePrivateImageCachesCleared,
} from '@/lib/account-session-lifecycle';
import {
  clearAllEventCapabilitiesForTests,
  holdEventCapability,
  peekEventCapability,
} from '@/lib/events/event-capability-holder';
import { useOnboardingCompletionStore } from '@/lib/navigation/onboarding-completion';
import { clearAllCache } from '@/lib/queryClient';
import { clearOwnedOnboardingDraft } from '@/lib/onboarding-draft';
import { notificationService } from '@/lib/services/notification-service';
import { retentionNotificationClient } from '@/lib/notifications/retention-notification-client';
import { useChallengeStore } from '@/store/challenge-store';
import { useEventStore } from '@/store/event-store';
import { useGroupStore } from '@/store/group-store';
import { useInviteStore } from '@/store/invite-store';
import { useMomentaStore } from '@/store/momenta-store';
import { useProtectedRouteStore } from '@/store/protected-route-store';
import { useReferralStore } from '@/store/referral-store';
import { Image } from 'expo-image';
import { clearVideoCacheAsync, getCurrentVideoCacheSize } from 'expo-video';
import { Platform } from 'react-native';

describe('account session lifecycle', () => {
  it('allows web account binding without native caches', async () => {
    const platformDescriptor = Object.getOwnPropertyDescriptor(Platform, 'OS');
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    try {
      const diskPurge = jest
        .spyOn(Image, 'clearDiskCache')
        .mockResolvedValue(false);
      await expect(
        clearAccountScopedState('web-user')
      ).resolves.toBeUndefined();
      expect(diskPurge).not.toHaveBeenCalled();
    } finally {
      if (platformDescriptor)
        Object.defineProperty(Platform, 'OS', platformDescriptor);
      jest.clearAllMocks();
    }
  });
  it('removes other account data but prevents binding until private media caches clear', async () => {
    jest.spyOn(Image, 'clearMemoryCache').mockResolvedValue(true);
    const diskPurge = jest
      .spyOn(Image, 'clearDiskCache')
      .mockResolvedValue(false);
    await expect(clearAccountScopedState('user-1')).rejects.toThrow(
      'Private media caches'
    );
    expect(useMomentaStore.getState().clearMomentaData).toHaveBeenCalled();
    expect(useGroupStore.getState().clearGroupData).toHaveBeenCalled();
    await expect(ensurePrivateImageCachesCleared()).rejects.toThrow(
      'Private media caches'
    );
    diskPurge.mockResolvedValue(true);
    jest.mocked(getCurrentVideoCacheSize).mockReturnValue(1024);
    const videoPurge = jest.mocked(clearVideoCacheAsync);
    videoPurge.mockRejectedValueOnce(new Error('video cache busy'));
    await expect(ensurePrivateImageCachesCleared()).rejects.toThrow(
      'video cache busy'
    );
    videoPurge.mockResolvedValueOnce(undefined);
    await expect(ensurePrivateImageCachesCleared()).resolves.toBeUndefined();
    expect(videoPurge).toHaveBeenCalledTimes(2);
    jest.mocked(getCurrentVideoCacheSize).mockReturnValue(0);
    jest.clearAllMocks();
  });
  it('stops account work before clearing all account-scoped caches', async () => {
    clearAllEventCapabilitiesForTests();
    const eventId = '11111111-1111-4111-8111-111111111111';
    holdEventCapability({
      ownerUserId: 'user-1',
      eventId,
      surface: 'detail',
      kind: 'invite',
      token: 'user_one_event_capability_1234567890',
    });
    holdEventCapability({
      ownerUserId: 'user-2',
      eventId,
      surface: 'detail',
      kind: 'invite',
      token: 'user_two_event_capability_1234567890',
    });
    const stopUserScopedWork = jest.mocked(
      notificationService.stopUserScopedWork
    );
    const memoryPurge = jest
      .spyOn(Image, 'clearMemoryCache')
      .mockResolvedValue(true);
    const diskPurge = jest
      .spyOn(Image, 'clearDiskCache')
      .mockResolvedValue(true);
    const clearQueryCache = jest.mocked(clearAllCache);
    const unbindRetentionNotifications = jest.mocked(
      retentionNotificationClient.unbindAccount
    );
    const clearChallenges = jest.mocked(
      useChallengeStore.getState().clearPersistedState
    );
    const clearGroups = jest.mocked(useGroupStore.getState().clearGroupData);
    const clearEvents = jest.mocked(useEventStore.getState().clearEventData);
    const clearMomenta = jest.mocked(
      useMomentaStore.getState().clearMomentaData
    );
    const clearReferrals = jest.mocked(useReferralStore.getState().clearState);
    const clearCompletion = jest.mocked(
      useOnboardingCompletionStore.getState().clearOwnedCompletion
    );
    const clearProtectedRoute = jest.mocked(
      useProtectedRouteStore.getState().clearOwnedPendingRoute
    );
    const clearInvite = jest.mocked(
      useInviteStore.getState().clearOwnedPendingInvite
    );

    await clearAccountScopedState('user-1');
    expect(memoryPurge).toHaveBeenCalledTimes(1);
    expect(diskPurge).toHaveBeenCalledTimes(1);

    expect(stopUserScopedWork).toHaveBeenCalledWith('user-1');
    expect(unbindRetentionNotifications).toHaveBeenCalledWith('user-1');
    expect(clearQueryCache).toHaveBeenCalledTimes(1);
    expect(clearChallenges).toHaveBeenCalledTimes(1);
    expect(clearGroups).toHaveBeenCalledTimes(1);
    expect(clearEvents).toHaveBeenCalledTimes(1);
    expect(clearMomenta).toHaveBeenCalledTimes(1);
    expect(clearReferrals).toHaveBeenCalledWith('user-1');
    expect(clearCompletion).toHaveBeenCalledWith('user-1');
    expect(clearProtectedRoute).toHaveBeenCalledWith('user-1');
    expect(clearInvite).toHaveBeenCalledWith('user-1');
    expect(clearOwnedOnboardingDraft).toHaveBeenCalledWith('user-1');
    expect(
      peekEventCapability({
        ownerUserId: 'user-1',
        eventId,
        surface: 'detail',
      })
    ).toBeNull();
    expect(
      peekEventCapability({
        ownerUserId: 'user-2',
        eventId,
        surface: 'detail',
      })
    ).not.toBeNull();
    expect(stopUserScopedWork.mock.invocationCallOrder[0]).toBeLessThan(
      unbindRetentionNotifications.mock.invocationCallOrder[0]
    );
    expect(
      unbindRetentionNotifications.mock.invocationCallOrder[0]
    ).toBeLessThan(clearQueryCache.mock.invocationCallOrder[0]);
  });
});
