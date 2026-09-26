import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as Application from 'expo-application';
import { usePathname, useRouter } from 'expo-router';
import { Linking, Platform } from 'react-native';

import { AppUpdateGateSurface } from '@/components/update/AppUpdateGateSurface';
import {
  shouldPresentLegacyUpdate,
  type LegacyUpdateDecision,
  type LegacyUpdatePlatform,
} from '@/lib/legacy-app-update-policy';
import { loadLegacyUpdatePolicy } from '@/lib/legacy-app-update-policy-client';
import {
  dismissOptionalUpdate,
  getStoreAttemptUpgradeOutcome,
  hasDismissedOptionalUpdate,
  recordStoreOpenAttempt,
} from '@/lib/app-update-state';
import { appStateManager } from '@/lib/app-state-manager';
import { trackProductEvent } from '@/lib/posthog';
import type { AnalyticsEventProperties } from '@/lib/product-analytics';
import { captureError } from '@/lib/sentry';

type UpdateJourney = AnalyticsEventProperties['App Update Journey'];

// Keep the legacy policy key for installed-client compatibility. This is the
// single native-update surface; Supabase authority does not depend on analytics.
export const LegacyAppUpdateGate = ({
  enabled = true,
}: {
  enabled?: boolean;
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const currentVersion =
    Application.nativeApplicationVersion?.trim() || 'unknown';
  const platform: LegacyUpdatePlatform | null =
    Platform.OS === 'ios'
      ? 'ios'
      : Platform.OS === 'android'
        ? 'android'
        : null;
  const [decision, setDecision] = useState<LegacyUpdateDecision>({
    status: 'authority_unknown',
  });
  const [optionalDismissed, setOptionalDismissed] = useState(true);
  const [busy, setBusy] = useState(false);
  const [storeOpenFailed, setStoreOpenFailed] = useState(false);
  const [policyChecked, setPolicyChecked] = useState(false);
  const mountedRef = useRef(true);
  const trackedRef = useRef(new Set<string>());

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const track = useCallback(
    (
      outcome: UpdateJourney['outcome'],
      mode: UpdateJourney['mode'],
      targetVersion = currentVersion
    ) => {
      const key = `${outcome}:${mode}:${targetVersion}`;
      if (trackedRef.current.has(key)) return;
      trackedRef.current.add(key);
      trackProductEvent('App Update Journey', {
        mode,
        outcome,
        release: 'native',
      });
    },
    [currentVersion]
  );

  const refreshPolicy = useCallback(
    async (forceRefresh = false) => {
      if (!enabled || !platform) return;
      const nextDecision = await loadLegacyUpdatePolicy({
        currentVersion,
        platform,
        forceRefresh,
      });
      if (mountedRef.current) {
        if (
          nextDecision.status === 'offer' &&
          nextDecision.mode === 'optional'
        ) {
          setOptionalDismissed(true);
        }
        setDecision(nextDecision);
        setPolicyChecked(true);
      }
    },
    [currentVersion, enabled, platform]
  );

  const checkUpgrade = useCallback(async () => {
    try {
      const outcome = await getStoreAttemptUpgradeOutcome(currentVersion);
      if (mountedRef.current && outcome !== 'none') track(outcome, 'none');
    } catch (error) {
      captureError(error, {
        context: 'app_update_upgrade_receipt_read_failed',
      });
    }
  }, [currentVersion, track]);

  useEffect(() => {
    if (!enabled) return;
    void refreshPolicy(true);
    void checkUpgrade();
    return appStateManager.addListener(nextState => {
      if (nextState !== 'active') return;
      void refreshPolicy(true);
      void checkUpgrade();
    });
  }, [checkUpgrade, enabled, refreshPolicy]);

  useEffect(() => {
    if (decision.status !== 'offer' || decision.mode !== 'optional') {
      setOptionalDismissed(false);
      return;
    }
    let active = true;
    setOptionalDismissed(true);
    void hasDismissedOptionalUpdate(decision.minimumVersion)
      .then(dismissed => {
        if (active) setOptionalDismissed(dismissed);
      })
      .catch(error => {
        captureError(error, { context: 'app_update_dismissal_read_failed' });
        if (active) setOptionalDismissed(false);
      });
    return () => {
      active = false;
    };
  }, [decision]);

  const visible = useMemo(() => {
    if (!enabled || decision.status !== 'offer') return false;
    if (decision.mode === 'optional' && optionalDismissed) return false;
    return shouldPresentLegacyUpdate(pathname, decision.mode);
  }, [decision, enabled, optionalDismissed, pathname]);

  useEffect(() => {
    if (!enabled || !policyChecked) return;
    if (
      decision.status === 'authority_unknown' ||
      decision.status === 'kill_switch'
    ) {
      track(decision.status, 'none');
    } else if (decision.status === 'offer') {
      track('exposure', decision.mode, decision.minimumVersion);
      if (visible) track('shown', decision.mode, decision.minimumVersion);
    }
  }, [decision, enabled, policyChecked, track, visible]);

  const dismiss = useCallback(() => {
    if (decision.status !== 'offer' || decision.mode !== 'optional') return;
    setOptionalDismissed(true);
    track('dismissed', decision.mode, decision.minimumVersion);
    void dismissOptionalUpdate(decision.minimumVersion).catch(error => {
      captureError(error, { context: 'app_update_dismissal_write_failed' });
    });
  }, [decision, track]);

  const openStore = useCallback(() => {
    if (busy || decision.status !== 'offer') return;
    setBusy(true);
    setStoreOpenFailed(false);
    track('update_tapped', decision.mode, decision.minimumVersion);
    void Linking.openURL(decision.storeUrl)
      .then(async () => {
        track('store_opened', decision.mode, decision.minimumVersion);
        try {
          await recordStoreOpenAttempt(decision.minimumVersion);
        } catch (error) {
          captureError(error, {
            context: 'app_update_upgrade_receipt_write_failed',
          });
        }
      })
      .catch(error => {
        captureError(error, { context: 'app_update_store_open_failed' });
        track('store_open_failed', decision.mode, decision.minimumVersion);
        if (mountedRef.current) setStoreOpenFailed(true);
      })
      .finally(() => {
        if (mountedRef.current) setBusy(false);
      });
  }, [busy, decision, track]);

  if (decision.status !== 'offer') return null;

  return (
    <AppUpdateGateSurface
      busy={busy}
      currentVersion={currentVersion}
      minimumVersion={decision.minimumVersion}
      mode={decision.mode}
      onDismiss={dismiss}
      onGetHelp={() => router.push('/support')}
      onUpdate={openStore}
      storeOpenFailed={storeOpenFailed}
      visible={visible}
    />
  );
};
