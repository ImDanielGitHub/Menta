import React, { useEffect } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { AppScreen } from '@/components/ui/AppShell';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useTranslation } from '@/lib/localization';
import { isWidgetPromiseId } from '@/lib/widgets/widget-model';
import { useAuthStore } from '@/store/auth-store';
import {
  refreshHomeWidget,
  useHomeWidgetStore,
} from '@/store/home-widget-store';

/** Revalidate identity, membership and proof status instead of trusting a saved widget URL. */
export default function WidgetOpenScreen() {
  const { promise } = useLocalSearchParams<{ promise?: string | string[] }>();
  const ownerId = useAuthStore(state => state.user?.id);
  const ready = useHomeWidgetStore(state => state.ready);
  const available = useHomeWidgetStore(state => state.available);
  const hydrationFailed = useHomeWidgetStore(
    state => !state.ready && state.error !== null
  );
  const router = useRouter();
  const { t } = useTranslation();
  useEffect(() => {
    if (!ownerId) return;
    if (!ready) {
      if (hydrationFailed) router.replace('/(tabs)');
      return;
    }
    let active = true;
    void (async () => {
      if (available) await refreshHomeWidget(true);
      if (!active || useAuthStore.getState().user?.id !== ownerId) return;
      const state = useHomeWidgetStore.getState();
      const id =
        typeof promise === 'string' && isWidgetPromiseId(promise)
          ? promise
          : state.preferences.promiseId;
      const selected =
        !state.error && state.ownerId === ownerId
          ? state.promises.find(item => item.id === id)
          : undefined;
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
    })();
    return () => {
      active = false;
    };
  }, [available, hydrationFailed, ownerId, promise, ready, router]);
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
