import { useCallback, useEffect, useRef, useState } from 'react';
import * as Updates from 'expo-updates';
import { showToast } from '@/components/ui/Toast';
import { isE2EMode } from '@/lib/e2e';
import { useTranslation } from '@/lib/localization/use-translation';

interface UseOtaUpdatesOptions {
  checkIntervalMs?: number;
}

export function useOtaUpdates(options: UseOtaUpdatesOptions = {}): void {
  const { checkIntervalMs = 60_000 } = options;
  const checkingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [hasShownBannerThisSession, setHasShownBannerThisSession] =
    useState<boolean>(false);
  const e2eMode = isE2EMode();
  const { t } = useTranslation();

  const checkForUpdates = useCallback(async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    try {
      const updateResult = await Updates.checkForUpdateAsync();
      if (!updateResult.isAvailable) return;
      await Updates.fetchUpdateAsync();
      if (!hasShownBannerThisSession) {
        setHasShownBannerThisSession(true);
        showToast.info(
          t('shared.update.ready.title'),
          t('shared.update.ready.description'),
          {
            action: {
              label: t('shared.update.ready.restart'),
              onPress: () => {
                Updates.reloadAsync().catch(() => undefined);
              },
            },
            duration: 12000,
          }
        );
      }
    } catch {
      // Silent fail; OTA check errors are non-fatal
    } finally {
      checkingRef.current = false;
    }
  }, [hasShownBannerThisSession, t]);

  useEffect(() => {
    if (e2eMode) {
      return;
    }

    // Initial check shortly after mount to avoid interfering with splash
    const initial = setTimeout(() => {
      checkForUpdates();
    }, 5000);

    // Background interval checks
    timerRef.current = setInterval(checkForUpdates, checkIntervalMs);

    return () => {
      clearTimeout(initial);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [checkForUpdates, checkIntervalMs, e2eMode]);
}
