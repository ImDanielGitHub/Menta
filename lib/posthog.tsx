import React from 'react';
import { Platform } from 'react-native';
import PostHog, { PostHogProvider } from 'posthog-react-native';

import { trackAmplitudeEvent } from '@/lib/amplitude';
import {
  resolveExperimentAssignment,
  type ExperimentAssignment,
  type ExperimentDefinition,
} from '@/lib/experiments';
import {
  MENTA_ANALYTICS_SCHEMA_VERSION,
  PAYWALL_PLACEMENT_FLAG_KEY,
  getPaywallAnalyticsVariant,
  type AnalyticsEventProperties,
  type MentaAnalyticsEvent,
  type PaywallAnalyticsVariant,
} from '@/lib/product-analytics';
import { recordProductAnalyticsEvent } from '@/lib/sentry';
import {
  MENTA_1_9_2_UPDATE_FLAG_KEY,
  resolveAppUpdateDecision,
  type AppUpdateDecision,
  type AppUpdatePlatform,
} from '@/lib/app-update-policy';

const host = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

let client: PostHog | null | undefined;
let initializationStarted = false;
let identifiedUserId: string | null | undefined;

export const POSTHOG_REPLAY_RELEASE_APPROVED = false;
export const isPostHogReplayEnabled = (): boolean => false;

export const canStartPostHog = (
  key: string | undefined | null
): key is string => Boolean(key?.trim());

const getConfiguredPostHogKey = (): string | undefined => {
  const key = process.env.EXPO_PUBLIC_POSTHOG_KEY?.trim();
  return key || undefined;
};

const appPlatform =
  Platform.OS === 'ios'
    ? 'ios'
    : Platform.OS === 'android'
      ? 'android'
      : 'other';

const createPostHogClient = (): PostHog | null => {
  const apiKey = getConfiguredPostHogKey();
  if (!canStartPostHog(apiKey)) return null;

  try {
    return new PostHog(apiKey, {
      host,
      disableGeoip: true,
      sendFeatureFlagEvent: true,
      captureAppLifecycleEvents: false,
      capturePushNotificationOpened: false,
      capturePushNotificationSubscriptions: false,
      personProfiles: 'identified_only',
      // Start manually only after route classification. This prevents a
      // remote setting from turning PostHog into a second replay recorder.
      enableSessionReplay: false,
      errorTracking: {
        autocapture: false,
      },
      customAppProperties: properties => ({
        ...properties,
        $device_manufacturer: null,
        $device_name: null,
        $device_model: null,
        $device_type: null,
        $os_name: null,
        $os_version: null,
        $locale: null,
        $timezone: null,
      }),
    });
  } catch {
    return null;
  }
};

export const getPostHogClient = (): PostHog | null => {
  if (client !== undefined) return client;
  client = createPostHogClient();
  return client;
};

type ExperimentFlagClient = Pick<PostHog, 'getFeatureFlag'>;

export const getExperimentAssignment = <
  TKey extends string,
  TVariant extends string,
>(
  definition: ExperimentDefinition<TKey, TVariant>,
  stableUserId: string | null,
  posthog: ExperimentFlagClient | null = getPostHogClient()
): ExperimentAssignment<TKey, TVariant> => {
  if (definition.status !== 'ready') {
    return resolveExperimentAssignment(
      definition,
      undefined,
      Boolean(stableUserId)
    );
  }
  if (!stableUserId || !posthog) {
    return resolveExperimentAssignment(
      definition,
      undefined,
      Boolean(stableUserId)
    );
  }

  try {
    return resolveExperimentAssignment(
      definition,
      posthog.getFeatureFlag(definition.key),
      true
    );
  } catch {
    return resolveExperimentAssignment(definition, undefined, true);
  }
};

type ExperimentCaptureClient = Pick<PostHog, 'capture'>;

export const createExperimentExposureRecorder = (
  posthog: ExperimentCaptureClient | null = getPostHogClient()
) => {
  const seen = new Set<string>();

  return <TKey extends string, TVariant extends string>(
    assignment: ExperimentAssignment<TKey, TVariant>,
    exposureScope: string
  ): boolean => {
    if (!posthog || !assignment.isRemoteAssignment) {
      return false;
    }

    const deduplicationKey = `${assignment.key}:${assignment.variant}:${exposureScope}`;
    if (seen.has(deduplicationKey)) {
      return false;
    }

    try {
      posthog.capture('Experiment Exposed', {
        event_version: MENTA_ANALYTICS_SCHEMA_VERSION,
        app_platform: appPlatform,
        experiment_key: assignment.key,
        experiment_variant: assignment.variant,
        experiment_surface: assignment.surface,
      });
      seen.add(deduplicationKey);
      return true;
    } catch {
      return false;
    }
  };
};

export const trackProductEvent = <TEvent extends MentaAnalyticsEvent>(
  event: TEvent,
  ...properties: AnalyticsEventProperties[TEvent] extends undefined
    ? []
    : [AnalyticsEventProperties[TEvent]]
): void => {
  recordProductAnalyticsEvent(event, properties[0]);
  trackAmplitudeEvent(event, ...properties);

  // OneSignal receives only the small, reviewed lifecycle subset mapped by
  // the bridge. Keep this lazy to avoid making the native messaging module a
  // root-render dependency or creating an analytics/provider import cycle.
  void import('@/lib/notifications/retention-event-bridge')
    .then(({ forwardProductEventToRetentionProvider }) =>
      forwardProductEventToRetentionProvider(event, properties[0])
    )
    .catch(() => undefined);

  const posthog = getPostHogClient();
  if (!posthog) return;

  try {
    posthog.capture(event, {
      event_version: MENTA_ANALYTICS_SCHEMA_VERSION,
      app_platform: appPlatform,
      ...(properties[0] ?? {}),
    });
  } catch {}
};

export const trackProductOperation = (
  properties: AnalyticsEventProperties['Product Operation']
): void => trackProductEvent('Product Operation', properties);

export const initializeProductAnalytics = (): void => {
  if (initializationStarted) return;
  initializationStarted = true;

  const posthog = getPostHogClient();
  if (!posthog) return;

  try {
    posthog.capture('App Opened', {
      event_version: MENTA_ANALYTICS_SCHEMA_VERSION,
      app_platform: appPlatform,
    });
  } catch {}
};

export const setProductAnalyticsUserId = (userId: string | null): void => {
  const posthog = getPostHogClient();
  if (!posthog || identifiedUserId === userId) return;

  if (userId) {
    try {
      if (identifiedUserId) {
        posthog.reset();
      }
      posthog.identify(userId);
      identifiedUserId = userId;
    } catch {}
    return;
  }

  try {
    // Reset on the first signed-out hydration too. The SDK persists identity,
    // so process-local state alone cannot prove that no prior account remains.
    posthog.reset();
    identifiedUserId = null;
  } catch {}
};

export const getPaywallPlacementFlag = (): PaywallAnalyticsVariant => {
  const posthog = getPostHogClient();
  if (!posthog) return 'unset';

  try {
    return getPaywallAnalyticsVariant(
      posthog.getFeatureFlag(PAYWALL_PLACEMENT_FLAG_KEY)
    );
  } catch {
    return 'unset';
  }
};

type PaywallFlagClient = Pick<PostHog, 'getFeatureFlag' | 'onFeatureFlags'>;

export const subscribePaywallPlacementFlag = (
  posthog: PaywallFlagClient | null,
  onChange: (value: PaywallAnalyticsVariant) => void
): (() => void) => {
  const updateValue = () => {
    if (!posthog) {
      onChange('unset');
      return;
    }
    try {
      onChange(
        getPaywallAnalyticsVariant(
          posthog.getFeatureFlag(PAYWALL_PLACEMENT_FLAG_KEY)
        )
      );
    } catch {
      onChange('unset');
    }
  };

  updateValue();
  if (!posthog) return () => undefined;

  try {
    return posthog.onFeatureFlags(updateValue);
  } catch {
    return () => undefined;
  }
};

export const usePaywallPlacementFlag = (): PaywallAnalyticsVariant => {
  const posthog = getPostHogClient();
  const [value, setValue] = React.useState<PaywallAnalyticsVariant>(() =>
    getPaywallPlacementFlag()
  );

  React.useEffect(
    () => subscribePaywallPlacementFlag(posthog, setValue),
    [posthog]
  );

  return value;
};

type AppUpdateFlagClient = Pick<
  PostHog,
  | 'getFeatureFlag'
  | 'getFeatureFlagPayload'
  | 'onFeatureFlags'
  | 'reloadFeatureFlags'
>;

export const subscribeAppUpdatePolicy = (
  posthog: AppUpdateFlagClient | null,
  options: { currentVersion: string; platform: AppUpdatePlatform },
  onChange: (decision: AppUpdateDecision) => void
): (() => void) => {
  const update = (flagsLoaded: boolean) => {
    if (!posthog) {
      onChange({ status: 'authority_unknown' });
      return;
    }
    try {
      onChange(
        resolveAppUpdateDecision({
          currentVersion: options.currentVersion,
          flagsLoaded,
          flagPayload: posthog.getFeatureFlagPayload(
            MENTA_1_9_2_UPDATE_FLAG_KEY
          ),
          flagValue: posthog.getFeatureFlag(MENTA_1_9_2_UPDATE_FLAG_KEY),
          platform: options.platform,
        })
      );
    } catch {
      onChange({ status: 'authority_unknown' });
    }
  };

  update(false);
  if (!posthog) return () => undefined;
  try {
    return posthog.onFeatureFlags(() => update(true));
  } catch {
    return () => undefined;
  }
};

export const reloadAppUpdatePolicy = (): void => {
  try {
    getPostHogClient()?.reloadFeatureFlags();
  } catch {}
};

export const MentaPostHogProvider = ({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  const posthog = getPostHogClient();
  if (!posthog) {
    return <>{children}</>;
  }

  return (
    <PostHogProvider
      client={posthog}
      autocapture={{
        captureTouches: false,
        captureScreens: false,
      }}
    >
      {children}
    </PostHogProvider>
  );
};
