import AsyncStorage from '@react-native-async-storage/async-storage';

export const ADVANCED_DIAGNOSTICS_STORAGE_KEY = 'menta.advanced-diagnostics.v2';

type StoredAdvancedDiagnosticsPreference = {
  enabled: boolean;
  updatedAt: string;
  version: 2;
};

const parseStoredPreference = (value: string | null): boolean => {
  if (!value) return false;

  try {
    const parsed = JSON.parse(
      value
    ) as Partial<StoredAdvancedDiagnosticsPreference>;
    return parsed.version === 2 && parsed.enabled === true;
  } catch {
    return false;
  }
};

/**
 * Advanced diagnostics are device-local and off until the person explicitly
 * opts in. This preference gates optional performance traces, profiles, and
 * masked Sentry Mobile Session Replay. Ordinary crash reporting uses a
 * separate Sentry policy.
 */
export const getAdvancedDiagnosticsEnabled = async (): Promise<boolean> =>
  parseStoredPreference(
    await AsyncStorage.getItem(ADVANCED_DIAGNOSTICS_STORAGE_KEY)
  );

export const setAdvancedDiagnosticsEnabled = async (
  enabled: boolean
): Promise<void> => {
  const preference: StoredAdvancedDiagnosticsPreference = {
    enabled,
    updatedAt: new Date().toISOString(),
    version: 2,
  };

  await AsyncStorage.setItem(
    ADVANCED_DIAGNOSTICS_STORAGE_KEY,
    JSON.stringify(preference)
  );
};
