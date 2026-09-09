export const MENTA_1_9_2_UPDATE_FLAG_KEY = 'menta_1_9_2_update_policy' as const;
export const MENTA_1_9_2_RELEASE = '1.9.2' as const;
export const MENTA_1_9_2_ANALYTICS_RELEASE = '1_9_2' as const;

export type AppUpdateMode = 'optional' | 'required';
export type AppUpdatePlatform = 'ios' | 'android';

const APP_UPDATE_GATE_EXEMPT_PATHS = new Set([
  '/auth-required',
  '/login',
  '/email-auth',
  '/email-confirmation',
  '/email-confirmation/callback',
  '/invite-activation',
  '/join-event',
  '/join-promise',
  '/register',
  '/password-recovery',
  '/password-recovery/callback',
  '/legal-acceptance',
  '/onboarding',
  '/onboarding-again',
  '/support',
  '/report-issue',
]);

export const shouldPresentOptionalUpdateOnPath = (pathname: string): boolean =>
  pathname === '/' || pathname === '/(tabs)';

export const shouldPresentRequiredUpdateOnPath = (pathname: string): boolean =>
  !APP_UPDATE_GATE_EXEMPT_PATHS.has(pathname);

type PlatformPolicy = {
  minimum_version: string;
  store_available: boolean;
};

type AppUpdatePayload = {
  schema_version: 1;
  release: typeof MENTA_1_9_2_RELEASE;
  platforms: Record<AppUpdatePlatform, PlatformPolicy>;
};

export type AppUpdateDecision =
  | { status: 'authority_unknown' }
  | { status: 'kill_switch' }
  | { status: 'current' }
  | {
      status: 'offer';
      mode: AppUpdateMode;
      minimumVersion: string;
      storeUrl: string;
    };

const IOS_STORE_URL = 'https://apps.apple.com/app/id6747362646';
const ANDROID_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.anekedigitalapps.lockedinpro';

export const getMentaStoreUrl = (platform: AppUpdatePlatform): string =>
  platform === 'ios' ? IOS_STORE_URL : ANDROID_STORE_URL;

const parsePayload = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const parseVersion = (value: string): number[] | null => {
  const normalized = value.trim().split('-')[0];
  if (!/^\d+(?:\.\d+){0,3}$/.test(normalized)) return null;
  return normalized.split('.').map(part => Number.parseInt(part, 10));
};

export const compareAppVersions = (
  currentVersion: string,
  minimumVersion: string
): number | null => {
  const current = parseVersion(currentVersion);
  const minimum = parseVersion(minimumVersion);
  if (!current || !minimum) return null;

  const length = Math.max(current.length, minimum.length);
  for (let index = 0; index < length; index += 1) {
    const currentPart = current[index] ?? 0;
    const minimumPart = minimum[index] ?? 0;
    if (currentPart < minimumPart) return -1;
    if (currentPart > minimumPart) return 1;
  }
  return 0;
};

const parsePolicyPayload = (value: unknown): AppUpdatePayload | null => {
  const payload = parsePayload(value);
  if (!isRecord(payload) || payload.schema_version !== 1) return null;
  if (payload.release !== MENTA_1_9_2_RELEASE) return null;
  if (!isRecord(payload.platforms)) return null;

  const ios = payload.platforms.ios;
  const android = payload.platforms.android;
  if (!isRecord(ios) || !isRecord(android)) return null;
  if (
    typeof ios.minimum_version !== 'string' ||
    typeof ios.store_available !== 'boolean' ||
    typeof android.minimum_version !== 'string' ||
    typeof android.store_available !== 'boolean'
  ) {
    return null;
  }
  if (
    !parseVersion(ios.minimum_version) ||
    !parseVersion(android.minimum_version)
  ) {
    return null;
  }

  return {
    schema_version: 1,
    release: MENTA_1_9_2_RELEASE,
    platforms: {
      ios: {
        minimum_version: ios.minimum_version,
        store_available: ios.store_available,
      },
      android: {
        minimum_version: android.minimum_version,
        store_available: android.store_available,
      },
    },
  };
};

/**
 * Resolve only fresh, explicit remote authority. A cached flag is not enough:
 * the caller must wait for PostHog's current-session feature-flag callback.
 * Unknown, malformed, or store-unconfirmed authority always leaves Menta open.
 */
export const resolveAppUpdateDecision = ({
  currentVersion,
  flagsLoaded,
  flagPayload,
  flagValue,
  platform,
}: {
  currentVersion: string;
  flagsLoaded: boolean;
  flagPayload: unknown;
  flagValue: unknown;
  platform: AppUpdatePlatform;
}): AppUpdateDecision => {
  if (!flagsLoaded || flagValue === undefined || flagValue === null) {
    return { status: 'authority_unknown' };
  }
  if (flagValue === false) {
    return { status: 'kill_switch' };
  }
  if (flagValue !== 'optional' && flagValue !== 'required') {
    return { status: 'authority_unknown' };
  }

  const payload = parsePolicyPayload(flagPayload);
  if (!payload) return { status: 'authority_unknown' };
  const policy = payload.platforms[platform];
  if (!policy.store_available) return { status: 'authority_unknown' };

  const comparison = compareAppVersions(currentVersion, policy.minimum_version);
  if (comparison === null) return { status: 'authority_unknown' };
  if (comparison >= 0) return { status: 'current' };

  return {
    status: 'offer',
    mode: flagValue,
    minimumVersion: policy.minimum_version,
    storeUrl: getMentaStoreUrl(platform),
  };
};
