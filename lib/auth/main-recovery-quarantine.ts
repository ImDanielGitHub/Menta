import AsyncStorage from '@react-native-async-storage/async-storage';
import { withAuthStorageLock } from './auth-storage-lock';

const MAIN_RECOVERY_QUARANTINE_KEY = 'menta.main-auth.recovery-quarantine.v1';

export const getMainRecoveryQuarantineUserId = async () => {
  const value = await AsyncStorage.getItem(MAIN_RECOVERY_QUARANTINE_KEY);
  return typeof value === 'string' && value.trim() ? value : null;
};

export const quarantineMainRecoveryUser = async (userId: string) => {
  if (!userId.trim()) throw new Error('Recovery user is missing.');
  await AsyncStorage.setItem(MAIN_RECOVERY_QUARANTINE_KEY, userId);
};

export const clearAndVerifyMainLocalSession = async (storageKey: string) =>
  withAuthStorageLock(storageKey, async () => {
    const ordinaryKeys = new Set([
      storageKey,
      `${storageKey}-user`,
      `${storageKey}-code-verifier`,
      `${storageKey}-flows-code-verifier`,
    ]);
    const flowPrefix = `${storageKey}-flow-`;
    const verifierSuffix = '-code-verifier';
    // Earlier SDK flow-index races can leave verifiers outside the index.
    // Enumerate only this exact ordinary namespace, never recovery storage.
    for (const key of await AsyncStorage.getAllKeys()) {
      if (key.startsWith(flowPrefix) && key.endsWith(verifierSuffix)) {
        const flowId = key.slice(flowPrefix.length, -verifierSuffix.length);
        if (/^[a-zA-Z0-9_-]{8,64}$/.test(flowId)) ordinaryKeys.add(key);
      }
    }
    const keys = [...ordinaryKeys];
    await AsyncStorage.multiRemove(keys);
    const remaining = await AsyncStorage.multiGet(keys);
    if (remaining.some(([, value]) => value !== null)) {
      throw new Error('Main local session cleanup was not verified.');
    }
  });

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
