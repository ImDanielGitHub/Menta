import { useCallback, useEffect, useRef, useState } from 'react';
import { showToast } from '@/components/ui/Toast';
import {
  downloadAvailableOtaUpdate,
  restartIntoDownloadedOta,
} from '@/lib/ota-updates';
import { useTranslation } from '@/lib/localization/use-translation';
import { appStateManager } from '@/lib/app-state-manager';

const MIN_CHECK_INTERVAL_MS = 30_000;

export const OtaUpdateReadyHost = ({ enabled }: { enabled: boolean }) => {
  const [ready, setReady] = useState(false);
  const { t } = useTranslation();
  const restartingRef = useRef(false);
  const notifiedRef = useRef(false);
  const checkingRef = useRef(false);
  const lastCheckAtRef = useRef(0);

  const restart = useCallback(() => {
    if (restartingRef.current) return;
    restartingRef.current = true;
    void restartIntoDownloadedOta().catch(() => {
      restartingRef.current = false;
      showToast.error(
        t('fullAuth.settings.menta_could_not_restart'),
        t('fullAuth.settings.close_and_reopen_menta_to_apply_the_downloaded_u')
      );
    });
  }, [t]);

  const checkForUpdate = useCallback(async () => {
    if (!enabled || checkingRef.current || ready) {
      return;
    }

    const now = Date.now();
    if (now - lastCheckAtRef.current < MIN_CHECK_INTERVAL_MS) return;
    lastCheckAtRef.current = now;
    checkingRef.current = true;

    try {
      const result = await downloadAvailableOtaUpdate();
      if (result === 'ready') {
        setReady(true);
      }
    } catch {
      // Update checks are best effort. The embedded and last known-good updates
      // remain available through expo-updates rollback protection.
    } finally {
      checkingRef.current = false;
    }
  }, [enabled, ready]);

  useEffect(() => {
    if (!enabled || !ready || notifiedRef.current) return;
    notifiedRef.current = true;
    showToast.info(
      t('shared.update.ready.title'),
      t('shared.update.ready.description'),
      {
        action: { label: t('shared.update.ready.restart'), onPress: restart },
        duration: 12000,
      }
    );
  }, [enabled, ready, restart, t]);

  useEffect(() => {
    void checkForUpdate();
    if (!enabled || ready) return undefined;
    const timer = setInterval(() => void checkForUpdate(), 60_000);
    return () => clearInterval(timer);
  }, [checkForUpdate, enabled, ready]);

  useEffect(() => {
    if (!enabled) return undefined;
    const unsubscribe = appStateManager.addListener(nextState => {
      if (nextState === 'active') void checkForUpdate();
    });
    return unsubscribe;
  }, [checkForUpdate, enabled]);

  return null;
};
