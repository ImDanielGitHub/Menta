import * as amplitude from '@amplitude/analytics-react-native';
import { SessionReplayPlugin } from '@amplitude/plugin-session-replay-react-native';
import { Platform } from 'react-native';

import {
  MENTA_ANALYTICS_SCHEMA_VERSION,
  type AnalyticsEventProperties,
  type MentaAnalyticsEvent,
} from '@/lib/product-analytics';

const apiKey = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY;
export const AMPLITUDE_REPLAY_RELEASE_APPROVED = true;

export const isAmplitudeReplayEnabled = (): boolean =>
  AMPLITUDE_REPLAY_RELEASE_APPROVED &&
  process.env.EXPO_PUBLIC_AMPLITUDE_REPLAY_ENABLED === 'true';

let initializationStarted = false;
let identifiedUserId: string | null = null;
let replayPlugin: SessionReplayPlugin | null = null;
let replayPluginReady = false;
let replayRecording = false;
let replayApplyInFlight = false;
let replayApplyQueued = false;

type AmplitudeReplayHoldReason = 'route' | 'iap';

const replayHolds: Record<AmplitudeReplayHoldReason, boolean> = {
  // Classify the first route before the recorder starts.
  route: true,
  iap: false,
};

const SENSITIVE_AMPLITUDE_REPLAY_PATHS = new Set([
  '/login',
  '/register',
  '/email-auth',
  '/email-confirmation',
  '/email-confirmation/callback',
  '/invite-activation',
  '/join-event',
  '/join-promise',
  '/join-group',
  '/account-deletion-review',
  '/account-deleted',
  '/edit-profile',
  '/legal-acceptance',
  '/privacy-policy',
  '/terms-of-service',
  '/report-issue',
  '/camera',
  '/verification',
  '/momenta',
  '/review-queue',
  '/group-review',
]);

export const shouldHoldAmplitudeReplayForPathname = (
  pathname: string
): boolean => {
  const withoutQuery = pathname.split('?')[0] ?? pathname;
  const withoutGroups = withoutQuery.replace(/\/\([^/]+\)/g, '');
  const trimmed = withoutGroups.replace(/\/+$/, '');
  const path = trimmed === '' ? '/' : trimmed;

  if (SENSITIVE_AMPLITUDE_REPLAY_PATHS.has(path)) return true;
  if (path.startsWith('/shop/')) return true;
  if (/^\/events\/[^/]+\/(proof|check-in|album)$/.test(path)) return true;
  if (path.startsWith('/events/organiser-review/')) return true;
  return false;
};

const applyAmplitudeReplayState = async (): Promise<void> => {
  if (replayApplyInFlight) {
    replayApplyQueued = true;
    return;
  }

  replayApplyInFlight = true;
  try {
    do {
      replayApplyQueued = false;
      if (!isAmplitudeReplayEnabled() || !replayPluginReady || !replayPlugin) {
        continue;
      }

      const shouldHold = Object.values(replayHolds).some(Boolean);
      try {
        if (shouldHold && replayRecording) {
          await replayPlugin.stop();
          replayRecording = false;
        } else if (!shouldHold && !replayRecording) {
          await replayPlugin.start();
          replayRecording = true;
        }
      } catch {
        // Replay diagnostics must never affect product behaviour.
      }
    } while (replayApplyQueued);
  } finally {
    replayApplyInFlight = false;
  }
};

export const setAmplitudeSessionReplayHold = (
  reason: AmplitudeReplayHoldReason,
  held: boolean
): void => {
  if (replayHolds[reason] === held) return;
  replayHolds[reason] = held;
  void applyAmplitudeReplayState();
};

const appPlatform =
  Platform.OS === 'ios'
    ? 'ios'
    : Platform.OS === 'android'
      ? 'android'
      : 'other';

export const trackAmplitudeEvent = <TEvent extends MentaAnalyticsEvent>(
  event: TEvent,
  ...properties: AnalyticsEventProperties[TEvent] extends undefined
    ? []
    : [AnalyticsEventProperties[TEvent]]
): void => {
  if (!apiKey) return;

  try {
    amplitude.track(event, {
      event_version: MENTA_ANALYTICS_SCHEMA_VERSION,
      app_platform: appPlatform,
      ...(properties[0] ?? {}),
    });
  } catch {}
};

export const initializeAmplitude = (): void => {
  if (initializationStarted) return;
  initializationStarted = true;

  if (!apiKey) {
    console.warn('Amplitude API key missing — analytics disabled');
    return;
  }

  let initialization: ReturnType<typeof amplitude.init>;
  try {
    initialization = amplitude.init(apiKey, undefined, {
      autocapture: {
        sessions: false,
      },
      trackingSessionEvents: false,
      trackingOptions: {
        adid: false,
        appSetId: false,
        carrier: false,
        country: false,
        deviceManufacturer: false,
        deviceModel: false,
        idfv: false,
        ipAddress: false,
        language: false,
        osName: false,
        osVersion: false,
        platform: false,
      },
    });
  } catch {
    return;
  }

  trackAmplitudeEvent('App Opened');

  if (isAmplitudeReplayEnabled()) {
    replayPlugin = new SessionReplayPlugin({
      autoStart: false,
      enableRemoteConfig: false,
      privacyConfig: { maskLevel: 'conservative' },
      // Daniel verified masking in Amplitude and selected replay for every
      // eligible production session. Sensitive routes and purchase handoffs
      // remain held independently of sampling.
      sampleRate: 1,
    });

    void initialization.promise
      .then(() => amplitude.add(replayPlugin!).promise)
      .then(() => {
        replayPluginReady = true;
        void applyAmplitudeReplayState();
      })
      .catch(() => undefined);
  }
};

export const setAmplitudeUserId = (userId: string | null): void => {
  if (!apiKey || identifiedUserId === userId) return;

  if (userId) {
    try {
      amplitude.setUserId(userId);
      identifiedUserId = userId;
    } catch {}
    return;
  }

  if (identifiedUserId) {
    try {
      amplitude.reset();
      identifiedUserId = null;
    } catch {}
  }
};
