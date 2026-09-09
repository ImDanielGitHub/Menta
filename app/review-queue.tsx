/**
 * Review Queue Screen
 * New streamlined review interface for approving/rejecting challenge submissions
 */

import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { StreamlinedReviewQueue } from '@/components/review/StreamlinedReviewQueue';
import { AppScreen } from '@/components/ui/AppShell';
import { mentaColors } from '@/constants/MentaDesignSystem';
import { normalizeReviewQueueParams } from '@/lib/navigation/review-queue-params';
import { useTranslation } from '@/lib/localization';
import { useAuthStore } from '@/store/auth-store';
import { useQueryClient } from '@tanstack/react-query';

export default function ReviewQueueScreen() {
  const { t } = useTranslation();
  const userId = useAuthStore(state => state.user?.id);
  const queryClient = useQueryClient();
  const { challengeId, groupId, submissionId, entryPoint } =
    normalizeReviewQueueParams(
      useLocalSearchParams<{
        challengeId?: string | string[];
        groupId?: string | string[];
        submissionId?: string | string[];
        entryPoint?: string | string[];
      }>()
    );
  const handleStatusChange = () => {
    void Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: ['groupPendingReviews'] }),
      queryClient.invalidateQueries({ queryKey: ['groupAccountabilityBoard'] }),
      queryClient.invalidateQueries({ queryKey: ['promise-accountability'] }),
    ]);
  };

  return (
    <AppScreen
      lane="immersive"
      safeArea={true}
      padding={false}
      hasTabBar={false}
      style={{ backgroundColor: mentaColors.canvas }}
    >
      <Stack.Screen
        options={{
          headerShown: false,
          title: t('todayProof.review.reviews'),
        }}
      />
      <StreamlinedReviewQueue
        key={`${userId ?? ''}:${challengeId ?? ''}:${groupId ?? ''}`}
        challengeId={challengeId}
        groupId={groupId}
        initialSubmissionId={submissionId}
        entryPoint={entryPoint}
        onStatusChange={handleStatusChange}
      />
    </AppScreen>
  );
}
