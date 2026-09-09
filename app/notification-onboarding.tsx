import React from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { NotificationPrivacyOnboarding } from '@/components/onboarding/NotificationPrivacyOnboarding';
import { useAuthStore } from '@/store/auth-store';

import { backOrReplace } from '@/lib/navigation/safe-back';
/**
 * Authenticated notification education before the operating-system prompt.
 * Notification Settings remains the place to change an existing preference or
 * return from system settings.
 */
export default function NotificationOnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    challengeId?: string | string[];
    source?: string | string[];
  }>();
  const challengeId = Array.isArray(params.challengeId)
    ? params.challengeId[0]
    : params.challengeId;
  const isPromiseContext =
    (Array.isArray(params.source) ? params.source[0] : params.source) ===
      'promise' && Boolean(challengeId);
  const returnToSettings = () => {
    if (isPromiseContext && challengeId) {
      router.replace({
        pathname: '/notification-settings',
        params: { challengeId, source: 'promise' },
      });
      return;
    }
    backOrReplace(router, '/notification-settings');
  };
  const userId = useAuthStore(state =>
    state.isAuthenticated ? (state.user?.id ?? null) : null
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <NotificationPrivacyOnboarding
        userId={userId}
        onBack={returnToSettings}
        onComplete={returnToSettings}
        promptContext="settings"
      />
    </>
  );
}
