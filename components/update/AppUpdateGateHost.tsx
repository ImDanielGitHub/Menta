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
  MENTA_1_9_2_ANALYTICS_RELEASE,
  shouldPresentOptionalUpdateOnPath,
  shouldPresentRequiredUpdateOnPath,
  type AppUpdateDecision,
  type AppUpdateMode,
  type AppUpdatePlatform,
} from '@/lib/app-update-policy';
import {
  dismissOptionalUpdate,
  getStoreAttemptUpgradeOutcome,
  hasDismissedOptionalUpdate,
  recordStoreOpenAttempt,
} from '@/lib/app-update-state';
import {
  getPostHogClient,
  reloadAppUpdatePolicy,
  subscribeAppUpdatePolicy,
  trackProductEvent,
} from '@/lib/posthog';
import { appStateManager } from '@/lib/app-state-manager';

const AUTHORITY_UNKNOWN_DELAY_MS = 5_000;
const AUTHORITY_UNKNOWN_STATUS = 'authority_unknown' as const;

export const AppUpdateGateHost = ({ enabled }: { enabled: boolean }) => {
  const pathname = usePathname();
  const router = useRouter();
  const currentVersion =
    Application.nativeApplicationVersion?.trim() || 'unknown';
  const platform: AppUpdatePlatform | null =
    Platform.OS === 'ios'
      ? 'ios'
      : Platform.OS === 'android'
        ? 'android'
        : null;
  const [decision, setDecision] = useState<AppUpdateDecision>({
    status: AUTHORITY_UNKNOWN_STATUS,
  });
  const [optionalDismissed, setOptionalDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const trackedRef = useRef(new Set<string>());

  const track = useCallback(
    (
      outcome:
        | 'authority_unknown'
        | 'kill_switch'
        | 'exposure'
        | 'shown'
        | 'dismissed'
        | 'update_tapped'
        | 'store_opened'
        | 'store_open_failed'
        | 'still_old_version'
        | 'successful_upgrade',
      mode: AppUpdateMode | 'none'
    ) => {
      const key = `${outcome}:${mode}`;
      if (trackedRef.current.has(key)) return;
      trackedRef.current.add(key);
      trackProductEvent('App Update Journey', {
        mode,
        outcome,
        release: MENTA_1_9_2_ANALYTICS_RELEASE,
      });
    },
    []
  );

  useEffect(() => {
    if (!enabled || !platform) return undefined;
    const unsubscribe = subscribeAppUpdatePolicy(
      getPostHogClient(),
      { currentVersion, platform },
      nextDecision => {
        if (
          nextDecision.status === 'offer' &&
          nextDecision.mode === 'optional'
        ) {
          // Do not flash a previously dismissed sheet while storage resolves.
          setOptionalDismissed(true);
          void hasDismissedOptionalUpdate(nextDecision.minimumVersion).then(
            setOptionalDismissed
          );
        }
        setDecision(nextDecision);
      }
    );
    reloadAppUpdatePolicy();
    return unsubscribe;
  }, [currentVersion, enabled, platform]);

  useEffect(() => {
    if (!enabled || !platform) return undefined;
    const unsubscribe = appStateManager.addListener(nextState => {
      if (nextState !== 'active') return;
      reloadAppUpdatePolicy();
      void getStoreAttemptUpgradeOutcome(currentVersion).then(outcome => {
        if (outcome !== 'none') track(outcome, 'none');
      });
    });
    return unsubscribe;
  }, [currentVersion, enabled, platform, track]);

  useEffect(() => {
    if (!enabled || !platform) return;
    void getStoreAttemptUpgradeOutcome(currentVersion).then(outcome => {
      if (outcome !== 'none') track(outcome, 'none');
    });
  }, [currentVersion, enabled, platform, track]);

  useEffect(() => {
    if (!enabled || decision.status !== 'authority_unknown') return undefined;
    const timer = setTimeout(
      () => track('authority_unknown', 'none'),
      AUTHORITY_UNKNOWN_DELAY_MS
    );
    return () => clearTimeout(timer);
  }, [decision.status, enabled, track]);

  useEffect(() => {
    if (!enabled) return;
    if (decision.status === 'kill_switch') {
      track('kill_switch', 'none');
      return;
    }
    if (decision.status !== 'offer') return;
    track('exposure', decision.mode);
    if (decision.mode === 'required') {
      setOptionalDismissed(false);
    }
  }, [decision, enabled, track]);

  const visible = useMemo(() => {
    if (!enabled || decision.status !== 'offer') return false;
    if (decision.mode === 'optional') {
      return !optionalDismissed && shouldPresentOptionalUpdateOnPath(pathname);
    }
    return shouldPresentRequiredUpdateOnPath(pathname);
  }, [decision, enabled, optionalDismissed, pathname]);

  useEffect(() => {
    if (visible && decision.status === 'offer') {
      track('shown', decision.mode);
    }
  }, [decision, track, visible]);

  const dismiss = useCallback(() => {
    if (decision.status !== 'offer' || decision.mode !== 'optional') return;
    setOptionalDismissed(true);
    track('dismissed', 'optional');
    void dismissOptionalUpdate(decision.minimumVersion);
  }, [decision, track]);

  const openStore = useCallback(() => {
    if (busy || decision.status !== 'offer') return;
    setBusy(true);
    track('update_tapped', decision.mode);
    void Linking.openURL(decision.storeUrl)
      .then(async () => {
        await recordStoreOpenAttempt(decision.minimumVersion);
        track('store_opened', decision.mode);
      })
      .catch(() => {
        track('store_open_failed', decision.mode);
      })
      .finally(() => setBusy(false));
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
      visible={visible}
    />
  );
};
