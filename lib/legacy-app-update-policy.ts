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

const IOS_STORE_URL = process.env.EXPO_PUBLIC_IOS_STORE_URL?.trim() ?? '';
const ANDROID_STORE_URL =
  process.env.EXPO_PUBLIC_ANDROID_STORE_URL?.trim() ?? '';

const EXEMPT_PATHS = new Set([
  '/auth-required',
  '/login',
  '/email-auth',
  '/email-confirmation',
  '/invite-activation',
  '/join',
  '/join-group',
  '/join-promise',
  '/join-event',
  '/join-funding',
  '/group-invite',
  '/share-invite',
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
  return !Array.from(EXEMPT_PATHS).some(
    path => pathname === path || pathname.startsWith(`${path}/`)
  );
};

const parseVersion = (value: unknown): number[] | null => {
  if (typeof value !== 'string') return null;
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
  if (!row || row.schema_version !== 1 || !parseVersion(row.release)) {
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
  if (!(platform === 'ios' ? IOS_STORE_URL : ANDROID_STORE_URL)) {
    return { status: 'authority_unknown' };
  }

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
