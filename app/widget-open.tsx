import React, { useEffect } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { AppScreen } from '@/components/ui/AppShell';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useTranslation } from '@/lib/localization';
import { isWidgetPromiseId } from '@/lib/widgets/widget-model';
import { useAuthStore } from '@/store/auth-store';
import { readWidgetPromiseForLink } from '@/store/home-widget-store';

/** Revalidate identity, membership and proof status instead of trusting a saved widget URL. */
export default function WidgetOpenScreen() {
  const { promise } = useLocalSearchParams<{ promise?: string | string[] }>();
  const ownerId = useAuthStore(state =>
    state.isInitialized && state.isAuthenticated ? state.user?.id : undefined
  );
  const router = useRouter();
  const { t } = useTranslation();
  useEffect(() => {
    if (!ownerId) return;
    if (typeof promise !== 'string' || !isWidgetPromiseId(promise)) {
      router.replace('/(tabs)');
      return;
    }
    let active = true;
    const current = () => {
      const auth = useAuthStore.getState();
      return (
        active &&
        auth.isInitialized &&
        auth.isAuthenticated &&
        auth.user?.id === ownerId
      );
    };
    void (async () => {
      const selected = await readWidgetPromiseForLink(promise);
      if (!current()) return;
      if (!selected || selected.deadline <= Date.now()) {
        router.replace('/(tabs)');
        return;
      }
      if (
        selected.proofStatus === 'approved' ||
        selected.proofStatus === 'pending'
      ) {
        router.replace({
          pathname: '/challenges/[id]',
          params: { id: selected.id, view: 'history' },
        });
      } else {
        router.replace({
          pathname: '/verification',
          params: {
            challengeId: selected.id,
            verificationType: selected.proofType,
            ...(selected.groupId ? { groupId: selected.groupId } : {}),
            ...(selected.isSolo ? { source: 'solo' } : {}),
          },
        });
      }
    })().catch(() => {
      if (current()) router.replace('/(tabs)');
    });
    return () => {
      active = false;
    };
  }, [ownerId, promise, router]);
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AppScreen lane="working" hasTabBar={false} scrollable>
        <SkeletonLoader
          height={32}
          width="60%"
          borderRadius={12}
          accessibilityLabel={t('widgets.loading')}
        />
        <SkeletonLoader
          height={104}
          borderRadius={24}
          style={{ marginTop: 24 }}
        />
        <SkeletonLoader
          height={104}
          borderRadius={24}
          style={{ marginTop: 16 }}
        />
      </AppScreen>
    </>
  );
}
