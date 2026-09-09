import AsyncStorage from '@react-native-async-storage/async-storage';

import { compareAppVersions } from '@/lib/app-update-policy';

const DISMISSED_OPTIONAL_VERSION_KEY =
  '@menta/app-update:dismissed-optional-version:v1';
const STORE_OPEN_ATTEMPT_KEY = '@menta/app-update:store-open-attempt:v1';

type StoreOpenAttempt = {
  targetVersion: string;
  openedAt: string;
};

export const hasDismissedOptionalUpdate = async (
  targetVersion: string
): Promise<boolean> =>
  (await AsyncStorage.getItem(DISMISSED_OPTIONAL_VERSION_KEY)) ===
  targetVersion;

export const dismissOptionalUpdate = async (
  targetVersion: string
): Promise<void> => {
  await AsyncStorage.setItem(DISMISSED_OPTIONAL_VERSION_KEY, targetVersion);
};

export const recordStoreOpenAttempt = async (
  targetVersion: string
): Promise<void> => {
  const value: StoreOpenAttempt = {
    targetVersion,
    openedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(STORE_OPEN_ATTEMPT_KEY, JSON.stringify(value));
};

const readStoreOpenAttempt = async (): Promise<StoreOpenAttempt | null> => {
  const value = await AsyncStorage.getItem(STORE_OPEN_ATTEMPT_KEY);
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<StoreOpenAttempt>;
    if (
      typeof parsed.targetVersion !== 'string' ||
      typeof parsed.openedAt !== 'string'
    ) {
      return null;
    }
    return {
      targetVersion: parsed.targetVersion,
      openedAt: parsed.openedAt,
    };
  } catch {
    return null;
  }
};

export const getStoreAttemptUpgradeOutcome = async (
  currentVersion: string
): Promise<'none' | 'still_old_version' | 'successful_upgrade'> => {
  const attempt = await readStoreOpenAttempt();
  if (!attempt) return 'none';
  const comparison = compareAppVersions(currentVersion, attempt.targetVersion);
  if (comparison === null || comparison < 0) return 'still_old_version';
  await AsyncStorage.removeItem(STORE_OPEN_ATTEMPT_KEY);
  return 'successful_upgrade';
};
