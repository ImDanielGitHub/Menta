import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const META_ADS_ATT_USAGE_DESCRIPTION =
  'Menta uses this to measure whether ads from Meta helped someone sign up, create a group, create a promise, or invite a friend. You can decline and still use Menta.';

export const META_ADS_SIGN_UP_EVENT = 'fb_mobile_complete_registration';
export const META_ADS_CREATE_GROUP_EVENT = 'CreateGroup';
export const META_ADS_CREATE_PROMISE_EVENT = 'CreatePromise';
export const META_ADS_INVITE_FRIEND_EVENT = 'InviteFriend';

export type MetaAdsRegistrationMethod = 'email' | 'oauth';
export type MetaAdsTrackingStatus =
  | 'granted'
  | 'denied'
  | 'undetermined'
  | 'unavailable';

type FacebookSettingsApi = {
  initializeSDK?: () => void;
  setAdvertiserTrackingEnabled?: (enabled: boolean) => Promise<boolean>;
  setAutoLogAppEventsEnabled?: (enabled: boolean) => void;
  setAdvertiserIDCollectionEnabled?: (enabled: boolean) => void;
  setAppID?: (appID: string) => void;
  setClientToken?: (clientToken: string) => void;
};

type FacebookAppEventsLoggerApi = {
  logEvent?: (
    eventName: string,
    ...args: (number | Record<string, string | number>)[]
  ) => void;
};

type TrackingTransparencyApi = {
  getTrackingPermissionsAsync?: () => Promise<{ status?: string }>;
  requestTrackingPermissionsAsync?: () => Promise<{ status?: string }>;
};

const NEW_AUTH_USER_CREATED_WINDOW_MS = 10 * 60 * 1000;
const NEW_AUTH_USER_SIGN_IN_DELTA_MS = 60 * 1000;

let Settings: FacebookSettingsApi | undefined;
let AppEventsLogger: FacebookAppEventsLoggerApi | undefined;
let trackingTransparency: TrackingTransparencyApi | undefined;
let initializationStarted = false;
let sdkInitialized = false;
let attributionEnabled = false;
const recordedSignUpUserIds = new Set<string>();

/* eslint-disable @typescript-eslint/no-require-imports --
   Native Facebook and ATT modules stay optional so Expo Go and unconfigured
   builds do not crash. Source-quality forbids these requires outside this file. */
try {
  const facebookSdk = require('react-native-fbsdk-next') as {
    Settings?: FacebookSettingsApi;
    AppEventsLogger?: FacebookAppEventsLoggerApi;
  };
  Settings = facebookSdk.Settings;
  AppEventsLogger = facebookSdk.AppEventsLogger;
} catch {
  Settings = undefined;
  AppEventsLogger = undefined;
}

try {
  trackingTransparency =
    require('expo-tracking-transparency') as TrackingTransparencyApi;
} catch {
  trackingTransparency = undefined;
}
/* eslint-enable @typescript-eslint/no-require-imports */

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

const readConfiguredValue = (
  envValue: string | undefined,
  extraValue: unknown
): string => {
  const fromEnv = envValue?.trim() ?? '';
  if (fromEnv) return fromEnv;
  return typeof extraValue === 'string' ? extraValue.trim() : '';
};

export const getMetaAdsAppId = (): string =>
  readConfiguredValue(
    process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
    extra.facebookAppId
  );

export const getMetaAdsClientToken = (): string =>
  readConfiguredValue(
    process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN,
    extra.facebookClientToken
  );

export const hasMetaAdsConfig = (): boolean =>
  Boolean(getMetaAdsAppId() && getMetaAdsClientToken());

export const isMetaAdsPlatformSupported = (
  platform: string = Platform.OS
): boolean => platform === 'ios';

export const isNewAuthUser = (
  user: {
    created_at?: string | null;
    last_sign_in_at?: string | null;
  },
  now = Date.now()
): boolean => {
  const createdAt = Date.parse(user.created_at ?? '');
  const lastSignInAt = Date.parse(user.last_sign_in_at ?? '');
  if (!Number.isFinite(createdAt) || !Number.isFinite(lastSignInAt)) {
    return false;
  }

  return (
    now - createdAt <= NEW_AUTH_USER_CREATED_WINDOW_MS &&
    Math.abs(lastSignInAt - createdAt) <= NEW_AUTH_USER_SIGN_IN_DELTA_MS
  );
};

export const resolveMetaAdsRegistrationMethod = (user: {
  app_metadata?: { provider?: string | null } | null;
  identities?: { provider?: string | null }[] | null;
}): MetaAdsRegistrationMethod => {
  const provider =
    user.app_metadata?.provider ?? user.identities?.[0]?.provider ?? '';
  return !provider || provider === 'email' ? 'email' : 'oauth';
};

const toTrackingStatus = (
  status: string | undefined
): MetaAdsTrackingStatus => {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  if (status === 'undetermined') return 'undetermined';
  return 'unavailable';
};

const applyAdvertiserTrackingEnabled = async (
  granted: boolean
): Promise<void> => {
  if (!isMetaAdsPlatformSupported()) return;

  attributionEnabled = granted;
  try {
    Settings?.setAdvertiserIDCollectionEnabled?.(attributionEnabled);
    if (attributionEnabled && !sdkInitialized) {
      Settings?.initializeSDK?.();
      sdkInitialized = true;
    }
    await Settings?.setAdvertiserTrackingEnabled?.(granted);
  } catch {
    // Attribution must never change product behaviour.
  }
};

export const getMetaAdsTrackingStatus =
  async (): Promise<MetaAdsTrackingStatus> => {
    if (!isMetaAdsPlatformSupported()) return 'unavailable';

    try {
      const response =
        await trackingTransparency?.getTrackingPermissionsAsync?.();
      return toTrackingStatus(response?.status);
    } catch {
      return 'unavailable';
    }
  };

export const applyCurrentMetaAdsTrackingStatus = async (): Promise<void> => {
  const status = await getMetaAdsTrackingStatus();
  if (status === 'unavailable') return;
  await applyAdvertiserTrackingEnabled(status === 'granted');
};

export const requestMetaAdsTrackingPermission =
  async (): Promise<MetaAdsTrackingStatus> => {
    if (!isMetaAdsPlatformSupported()) return 'unavailable';

    try {
      const response =
        await trackingTransparency?.requestTrackingPermissionsAsync?.();
      const status = toTrackingStatus(response?.status);
      if (status !== 'unavailable') {
        await applyAdvertiserTrackingEnabled(status === 'granted');
      }
      return status;
    } catch {
      return 'unavailable';
    }
  };

const logMetaAdsEvent = (
  eventName: string,
  parameters?: Record<string, string | number>
): void => {
  if (
    !isMetaAdsPlatformSupported() ||
    !hasMetaAdsConfig() ||
    !attributionEnabled
  ) {
    return;
  }

  try {
    if (parameters) {
      AppEventsLogger?.logEvent?.(eventName, parameters);
      return;
    }
    AppEventsLogger?.logEvent?.(eventName);
  } catch {
    // Attribution must never change product behaviour.
  }
};

export const initializeMetaAds = (): void => {
  if (initializationStarted) return;
  initializationStarted = true;

  if (!isMetaAdsPlatformSupported() || !hasMetaAdsConfig()) return;

  try {
    const appId = getMetaAdsAppId();
    const clientToken = getMetaAdsClientToken();
    Settings?.setAppID?.(appId);
    Settings?.setClientToken?.(clientToken);
    Settings?.setAutoLogAppEventsEnabled?.(false);
    Settings?.setAdvertiserIDCollectionEnabled?.(false);
    void applyCurrentMetaAdsTrackingStatus();
  } catch {
    // Missing native module or SDK init failure stays outside product flows.
  }
};

export const trackMetaAdsSignUp = (options: {
  userId?: string | null;
  method: MetaAdsRegistrationMethod;
}): void => {
  const userId = options.userId?.trim();
  if (userId) {
    if (recordedSignUpUserIds.has(userId)) return;
    recordedSignUpUserIds.add(userId);
  }

  logMetaAdsEvent(META_ADS_SIGN_UP_EVENT, {
    fb_registration_method: options.method,
  });
};

export const trackMetaAdsCreateGroup = (): void => {
  logMetaAdsEvent(META_ADS_CREATE_GROUP_EVENT);
};

export const trackMetaAdsCreatePromise = (): void => {
  logMetaAdsEvent(META_ADS_CREATE_PROMISE_EVENT);
};

export const trackMetaAdsInviteFriend = (): void => {
  logMetaAdsEvent(META_ADS_INVITE_FRIEND_EVENT);
};
