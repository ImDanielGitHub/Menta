import Constants from 'expo-constants';

/**
 * App-owned operational switches.
 *
 * These switches are release configuration, not analytics experiments. Their
 * reviewed defaults keep core behaviour deterministic, while an EAS/Expo
 * public environment value or `expo.extra.operationalFlags` entry can make an
 * explicit release-level override without sending usage data to a third party.
 */
export const OPERATIONAL_FLAG_DEFAULTS = {
  group_notifications_enabled: true,
  ads_enabled: true,
  safe_mode: false,
  disable_google_login: false,
  disable_apple_login: false,
} as const;

export type OperationalFlagKey = keyof typeof OPERATIONAL_FLAG_DEFAULTS;

const ENV_KEYS: Record<OperationalFlagKey, string> = {
  group_notifications_enabled: 'EXPO_PUBLIC_GROUP_NOTIFICATIONS_ENABLED',
  ads_enabled: 'EXPO_PUBLIC_ADS_ENABLED',
  safe_mode: 'EXPO_PUBLIC_SAFE_MODE',
  disable_google_login: 'EXPO_PUBLIC_DISABLE_GOOGLE_LOGIN',
  disable_apple_login: 'EXPO_PUBLIC_DISABLE_APPLE_LOGIN',
};

const parseBoolean = (value: unknown): boolean | undefined => {
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return undefined;
};

const readExpoOverride = (key: OperationalFlagKey): unknown => {
  const extra = Constants.expoConfig?.extra as
    | { operationalFlags?: Partial<Record<OperationalFlagKey, unknown>> }
    | undefined;
  return extra?.operationalFlags?.[key];
};

const readEnvironmentOverride = (key: OperationalFlagKey): unknown => {
  switch (ENV_KEYS[key]) {
    case 'EXPO_PUBLIC_GROUP_NOTIFICATIONS_ENABLED':
      return process.env.EXPO_PUBLIC_GROUP_NOTIFICATIONS_ENABLED;
    case 'EXPO_PUBLIC_ADS_ENABLED':
      return process.env.EXPO_PUBLIC_ADS_ENABLED;
    case 'EXPO_PUBLIC_SAFE_MODE':
      return process.env.EXPO_PUBLIC_SAFE_MODE;
    case 'EXPO_PUBLIC_DISABLE_GOOGLE_LOGIN':
      return process.env.EXPO_PUBLIC_DISABLE_GOOGLE_LOGIN;
    case 'EXPO_PUBLIC_DISABLE_APPLE_LOGIN':
      return process.env.EXPO_PUBLIC_DISABLE_APPLE_LOGIN;
  }
};

export const getOperationalFlag = (key: OperationalFlagKey): boolean =>
  parseBoolean(readEnvironmentOverride(key)) ??
  parseBoolean(readExpoOverride(key)) ??
  OPERATIONAL_FLAG_DEFAULTS[key];

/** Async compatibility for stores that check a switch immediately before work. */
export const isOperationalFeatureEnabled = async (
  key: OperationalFlagKey
): Promise<boolean> => getOperationalFlag(key);
