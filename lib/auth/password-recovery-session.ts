import AsyncStorage from '@react-native-async-storage/async-storage';
import { passwordRecoverySupabase } from '@/lib/supabase';
import {
  PASSWORD_RECOVERY_AUTH_STORAGE_KEY,
  PASSWORD_RECOVERY_PKCE_VERIFIER_STORAGE_KEY,
  PASSWORD_RECOVERY_USER_STORAGE_KEY,
} from '@/lib/auth/password-recovery-config';

const RECOVERY_AUTHORITY_KEY = 'menta.password-recovery.authority.v1';

type RecoveryAuthority = { userId: string };
type RecoveryListener = (userId: string | null) => void;

const listeners = new Set<RecoveryListener>();
let currentRecoveryUserId: string | null = null;

const emitRecoveryState = (userId: string | null) => {
  currentRecoveryUserId = userId;
  listeners.forEach(listener => listener(userId));
};

const parseAuthority = (raw: string | null): RecoveryAuthority | null => {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<RecoveryAuthority>;
    return typeof value.userId === 'string' && value.userId.trim()
      ? { userId: value.userId }
      : null;
  } catch {
    return null;
  }
};

export const subscribePasswordRecoverySession = (
  listener: RecoveryListener
) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const markPasswordRecoverySession = async (userId: string) => {
  if (!userId.trim()) throw new Error('Recovery user is missing.');
  await AsyncStorage.setItem(
    RECOVERY_AUTHORITY_KEY,
    JSON.stringify({ userId } satisfies RecoveryAuthority)
  );
  emitRecoveryState(userId);
};

const failClosedRecovery = async (): Promise<null> => {
  try {
    await clearPasswordRecoverySession();
  } catch {
    // The isolated session cleanup still runs in clear's finally block.
  }
  return null;
};

export const getPasswordRecoveryUserId = async (): Promise<string | null> => {
  try {
    const authority = parseAuthority(
      await AsyncStorage.getItem(RECOVERY_AUTHORITY_KEY)
    );
    if (!authority) {
      const pendingVerifier = await AsyncStorage.getItem(
        PASSWORD_RECOVERY_PKCE_VERIFIER_STORAGE_KEY
      );
      if (pendingVerifier?.endsWith('/recovery')) {
        emitRecoveryState(null);
        return null;
      }

      const { data, error } = await passwordRecoverySupabase.auth.getSession();
      if (error) {
        return failClosedRecovery();
      }
      if (!data.session && !pendingVerifier) {
        emitRecoveryState(null);
        return null;
      }

      return failClosedRecovery();
    }

    const { data, error } = await passwordRecoverySupabase.auth.getUser();
    if (error || data.user?.id !== authority.userId) {
      return failClosedRecovery();
    }

    emitRecoveryState(authority.userId);
    return authority.userId;
  } catch {
    return failClosedRecovery();
  }
};

export const getCachedPasswordRecoveryUserId = () => currentRecoveryUserId;

export const clearPasswordRecoverySession = async () => {
  emitRecoveryState(null);
  let signOutError: unknown = null;
  try {
    const result = await passwordRecoverySupabase.auth.signOut({
      scope: 'local',
    });
    signOutError = result.error;
  } catch (error) {
    signOutError = error;
  } finally {
    const keys = [
      RECOVERY_AUTHORITY_KEY,
      PASSWORD_RECOVERY_AUTH_STORAGE_KEY,
      PASSWORD_RECOVERY_USER_STORAGE_KEY,
      PASSWORD_RECOVERY_PKCE_VERIFIER_STORAGE_KEY,
    ];
    await AsyncStorage.multiRemove(keys);
    const remaining = await AsyncStorage.multiGet(keys);
    const remainingKeys = remaining
      .filter(([, value]) => value !== null)
      .map(([key]) => key);
    if (remainingKeys.length > 0) {
      throw new Error(
        `Password recovery session cleanup was not verified for: ${remainingKeys.join(', ')}`
      );
    }
  }

  // A resolved provider error is safe only after local token removal is
  // verified above. Do not rethrow it and strand the person in recovery.
  void signOutError;
};

export const PASSWORD_RECOVERY_AUTHORITY_STORAGE_KEY = RECOVERY_AUTHORITY_KEY;
