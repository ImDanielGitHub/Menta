import React, { useCallback, useEffect } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { ReviewQueueSkeleton } from '@/components/review/StreamlinedReviewQueue';
import { AppScreen } from '@/components/ui';
import { mentaColors } from '@/constants/MentaDesignSystem';

import { backOrReplace } from '@/lib/navigation/safe-back';
const firstParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

/**
 * Compatibility handoff for older deep links. The canonical review experience
 * lives at /review-queue. Showing its exact skeleton keeps the transition
 * stable while the original group/challenge context is preserved.
 */
export default function GroupReviewRedirectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    groupId?: string | string[];
    challengeId?: string | string[];
  }>();
  const groupId = firstParam(params.groupId);
  const challengeId = firstParam(params.challengeId);

  const openReviewQueue = useCallback(() => {
    router.replace({
      pathname: '/review-queue',
      params: {
        ...(groupId ? { groupId } : {}),
        ...(challengeId ? { challengeId } : {}),
      },
    });
  }, [challengeId, groupId, router]);

  useEffect(() => {
    openReviewQueue();
  }, [openReviewQueue]);

  return (
    <AppScreen
      lane="immersive"
      safeArea
      hasTabBar={false}
      padding={false}
      style={{ backgroundColor: mentaColors.canvas }}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ReviewQueueSkeleton
        onBack={() => backOrReplace(router, '/review-queue')}
      />
    </AppScreen>
  );
}
