import { useEffect } from 'react';
import { AppState } from 'react-native';
import { usePathname } from 'expo-router';

import { useTranslation } from '@/lib/localization';
import { subscribeWidgetProofChanges } from '@/lib/widgets/widget-events';
import { useAuthStore } from '@/store/auth-store';
import {
  beginHomeWidgetSession,
  endHomeWidgetSession,
  refreshHomeWidget,
} from '@/store/home-widget-store';

export function HomeWidgetSync() {
  const initialized = useAuthStore(state => state.isInitialized);
  const ownerId = useAuthStore(state =>
    state.isInitialized && state.isAuthenticated
      ? (state.user?.id ?? null)
      : null
  );
  const { locale } = useTranslation();
  const pathname = usePathname();
  useEffect(() => {
    if (!initialized) return;
    beginHomeWidgetSession(ownerId, locale);
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') void refreshHomeWidget();
    });
    const unsubscribe = subscribeWidgetProofChanges(() => {
      void refreshHomeWidget();
    });
    return () => {
      appState.remove();
      unsubscribe();
      endHomeWidgetSession();
    };
  }, [initialized, ownerId, locale]);
  useEffect(() => {
    void refreshHomeWidget();
  }, [pathname]);
  return null;
}
