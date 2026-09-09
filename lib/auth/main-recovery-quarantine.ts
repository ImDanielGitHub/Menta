import AsyncStorage from '@react-native-async-storage/async-storage';

const MAIN_RECOVERY_QUARANTINE_KEY = 'menta.main-auth.recovery-quarantine.v1';

export const getMainRecoveryQuarantineUserId = async () => {
  const value = await AsyncStorage.getItem(MAIN_RECOVERY_QUARANTINE_KEY);
  return typeof value === 'string' && value.trim() ? value : null;
};

export const quarantineMainRecoveryUser = async (userId: string) => {
  if (!userId.trim()) throw new Error('Recovery user is missing.');
  await AsyncStorage.setItem(MAIN_RECOVERY_QUARANTINE_KEY, userId);
};

export const clearAndVerifyMainLocalSession = async (storageKey: string) => {
  const keys = [storageKey, `${storageKey}-user`];
  await AsyncStorage.multiRemove(keys);
  const remaining = await AsyncStorage.multiGet(keys);
  if (remaining.some(([, value]) => value !== null)) {
    throw new Error('Main recovery session cleanup was not verified.');
  }
};

export const confineUnexpectedMainRecovery = async ({
  storageKey,
  userId,
  signOut,
}: {
  storageKey: string;
  userId: string;
  signOut: () => Promise<{ error?: unknown }>;
}) => {
  await quarantineMainRecoveryUser(userId);

  let signOutError: unknown = null;
  try {
    const result = await signOut();
    signOutError = result.error ?? null;
  } catch (error) {
    signOutError = error;
  }

  let localSessionCleared = false;
  try {
    await clearAndVerifyMainLocalSession(storageKey);
    localSessionCleared = true;
  } finally {
    if (localSessionCleared) {
      await AsyncStorage.removeItem(MAIN_RECOVERY_QUARANTINE_KEY);
    }
  }

  return { localSessionCleared, signOutError };
};

export const MAIN_RECOVERY_QUARANTINE_STORAGE_KEY =
  MAIN_RECOVERY_QUARANTINE_KEY;
