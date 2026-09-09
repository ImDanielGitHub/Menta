import type { Tables } from '@/lib/database.types';

export const LEGACY_APP_UPDATE_POLICY_KEY =
  'menta_1_9_2_update_policy' as const;

export type LegacyUpdateMode = 'optional' | 'required';
export type LegacyUpdatePlatform = 'ios' | 'android';

type LegacyPolicyRow = Tables<'app_update_policies'>;

export type LegacyUpdateDecision =
  | { status: 'authority_unknown' }
  | { status: 'kill_switch' }
  | { status: 'current' }
  | {
      status: 'offer';
      mode: LegacyUpdateMode;
      minimumVersion: string;
      storeUrl: string;
    };

const IOS_STORE_URL = 'https://apps.apple.com/app/id6747362646';
const ANDROID_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.anekedigitalapps.lockedinpro';

const EXEMPT_PATHS = new Set([
  '/auth-required',
  '/login',
  '/email-auth',
  '/register',
  '/password-recovery',
  '/password-recovery/callback',
  '/legal-acceptance',
  '/onboarding',
  '/onboarding-again',
  '/support',
  '/report-issue',
]);

export const shouldPresentLegacyUpdate = (
  pathname: string,
  mode: LegacyUpdateMode
): boolean => {
  if (mode === 'optional') {
    return pathname === '/' || pathname === '/(tabs)';
  }
  return !EXEMPT_PATHS.has(pathname);
};

const parseVersion = (value: string): number[] | null => {
  const normalized = value.trim().split('-')[0];
  if (!/^\d+(?:\.\d+){0,3}$/.test(normalized)) return null;
  return normalized.split('.').map(part => Number.parseInt(part, 10));
};

export const compareLegacyAppVersions = (
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

export const resolveLegacyUpdateDecision = ({
  currentVersion,
  platform,
  row,
}: {
  currentVersion: string;
  platform: LegacyUpdatePlatform;
  row: LegacyPolicyRow | null;
}): LegacyUpdateDecision => {
  if (!row || row.schema_version !== 1 || row.release !== '1.9.2') {
    return { status: 'authority_unknown' };
  }
  if (!row.enabled) return { status: 'kill_switch' };
  if (row.mode !== 'optional' && row.mode !== 'required') {
    return { status: 'authority_unknown' };
  }

  const minimumVersion =
    platform === 'ios' ? row.ios_minimum_version : row.android_minimum_version;
  const storeAvailable =
    platform === 'ios' ? row.ios_store_available : row.android_store_available;
  if (!storeAvailable) return { status: 'authority_unknown' };

  const comparison = compareLegacyAppVersions(currentVersion, minimumVersion);
  if (comparison === null) return { status: 'authority_unknown' };
  if (comparison >= 0) return { status: 'current' };

  return {
    status: 'offer',
    mode: row.mode,
    minimumVersion,
    storeUrl: platform === 'ios' ? IOS_STORE_URL : ANDROID_STORE_URL,
  };
};
