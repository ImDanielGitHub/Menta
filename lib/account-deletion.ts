import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { supabase } from '@/lib/supabase';
import { clearReportDraftsForUser } from '@/lib/report-drafts';
import { notificationService } from '@/lib/services/notification-service';
import type { AccountDeletionReceipt } from '@/lib/account-deletion-receipt';

type ServerAccountDeletionReceipt = {
  success: true;
  appleAuthorization: 'not_applicable' | 'revoked';
};

type ServerAccountDeletionFailure = {
  success: false;
  accountDeleted: false;
  recoverable: true;
  code: string;
  error: string;
};

const DEFINITIVE_PRE_DELETION_HTTP_STATUSES = new Set([
  400, 401, 405, 428, 429, 409,
]);

export const ACCOUNT_DELETION_OWNERSHIP_BLOCKER_CODE =
  'OWNED_GROUP_HAS_OTHER_MEMBERS' as const;

export class AccountDeletionConfirmationError extends Error {
  constructor() {
    super(
      'Menta did not receive a confirmed account-deletion receipt from the server.'
    );
    this.name = 'AccountDeletionConfirmationError';
  }
}

export class AccountDeletionNotCompletedError extends Error {
  readonly code?: string;

  constructor(
    message = 'The server confirmed that account deletion did not complete.',
    code?: string
  ) {
    super(message);
    this.name = 'AccountDeletionNotCompletedError';
    this.code = code;
  }
}

export const isAccountDeletionOwnershipBlocker = (
  error: unknown
): error is AccountDeletionNotCompletedError =>
  error instanceof AccountDeletionNotCompletedError &&
  error.code === ACCOUNT_DELETION_OWNERSHIP_BLOCKER_CODE;

const isAccountDeletionReceipt = (
  value: unknown
): value is ServerAccountDeletionReceipt =>
  typeof value === 'object' &&
  value !== null &&
  'success' in value &&
  value.success === true &&
  'appleAuthorization' in value &&
  (value.appleAuthorization === 'not_applicable' ||
    value.appleAuthorization === 'revoked');

const isAccountDeletionFailure = (
  value: unknown
): value is ServerAccountDeletionFailure =>
  typeof value === 'object' &&
  value !== null &&
  'success' in value &&
  value.success === false &&
  'accountDeleted' in value &&
  value.accountDeleted === false &&
  'recoverable' in value &&
  value.recoverable === true &&
  'code' in value &&
  typeof value.code === 'string' &&
  'error' in value &&
  typeof value.error === 'string';

const isExplicitDeletionFailure = (value: unknown): boolean =>
  typeof value === 'object' &&
  value !== null &&
  'success' in value &&
  value.success === false;

const isDefinitivePreDeletionHttpFailure = (
  response: Response | undefined
): boolean =>
  response !== undefined &&
  DEFINITIVE_PRE_DELETION_HTTP_STATUSES.has(response.status);

const readAccountDeletionFailure = async (
  data: unknown,
  response: Response | undefined
): Promise<ServerAccountDeletionFailure | null> => {
  if (isAccountDeletionFailure(data)) return data;
  if (!response) return null;

  try {
    const readableResponse =
      typeof response.clone === 'function' ? response.clone() : response;
    const body: unknown = await readableResponse.json();
    return isAccountDeletionFailure(body) ? body : null;
  } catch {
    return null;
  }
};

const isAppleAuthenticationCancellation = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as { code?: unknown; name?: unknown };
  const code = String(candidate.code ?? candidate.name ?? '');
  return (
    code === 'ERR_REQUEST_CANCELED' ||
    code === 'ERR_CANCELED' ||
    code === 'ERR_CANCELLED'
  );
};

const requestAppleRevocationCode = async (): Promise<string> => {
  try {
    if (!(await AppleAuthentication.isAvailableAsync())) {
      throw new AccountDeletionNotCompletedError(
        'Sign in with Apple is required on an Apple device before this account can be deleted.',
        'APPLE_REAUTH_UNAVAILABLE'
      );
    }

    const state = Crypto.randomUUID();
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [],
      state,
    });
    const authorizationCode = credential.authorizationCode?.trim();
    if (credential.state !== state || !authorizationCode) {
      throw new AccountDeletionNotCompletedError(
        'Apple reauthentication could not be confirmed. The account was not deleted.',
        'APPLE_REAUTH_INVALID'
      );
    }

    return authorizationCode;
  } catch (error) {
    if (error instanceof AccountDeletionNotCompletedError) throw error;
    if (isAppleAuthenticationCancellation(error)) {
      throw new AccountDeletionNotCompletedError(
        'Account deletion was cancelled. The account is still active.',
        'APPLE_REAUTH_CANCELLED'
      );
    }
    throw new AccountDeletionNotCompletedError(
      'Apple reauthentication could not be completed. The account was not deleted.',
      'APPLE_REAUTH_FAILED'
    );
  }
};

async function clearLocalAccountCache(userId: string) {
  await AsyncStorage.multiRemove([
    `welcome_bonus_granted_${userId}`,
    `welcome_bonus_last_seen_${userId}`,
  ]);
}

export async function deleteMentaAccount(
  userId: string
): Promise<AccountDeletionReceipt> {
  if (!userId) {
    throw new Error('A signed-in user is required to delete an account.');
  }

  // Pause account-owned listeners before server deletion. If the response is
  // lost after deletion, restarting them could write against a removed profile.
  notificationService.stopUserScopedWork(userId);

  const clientEventId = Crypto.randomUUID();
  let result = await supabase.functions.invoke('delete-my-account', {
    body: { clientEventId },
  });
  let failure = await readAccountDeletionFailure(result.data, result.response);

  if (
    failure?.code === 'APPLE_REAUTH_REQUIRED' ||
    (!failure && result.response?.status === 428)
  ) {
    const appleAuthorizationCode = await requestAppleRevocationCode();
    result = await supabase.functions.invoke('delete-my-account', {
      body: { appleAuthorizationCode, clientEventId },
    });
    failure = await readAccountDeletionFailure(result.data, result.response);
  }

  const { data, error, response } = result;

  if (error) {
    if (failure) {
      throw new AccountDeletionNotCompletedError(failure.error, failure.code);
    }
    if (isDefinitivePreDeletionHttpFailure(response)) {
      throw new AccountDeletionNotCompletedError();
    }
    throw error;
  }

  if (failure) {
    throw new AccountDeletionNotCompletedError(failure.error, failure.code);
  }

  if (isExplicitDeletionFailure(data)) {
    throw new AccountDeletionNotCompletedError();
  }

  if (!isAccountDeletionReceipt(data)) {
    throw new AccountDeletionConfirmationError();
  }

  // These keys belong to the deleted account. Shared in-memory stores are
  // cleared by the guarded auth teardown in Settings so a delayed response for
  // account A cannot erase a newer account B session.
  await Promise.allSettled([
    clearLocalAccountCache(userId),
    clearReportDraftsForUser(userId),
  ]);

  return {
    success: true,
    appleAuthorization: data.appleAuthorization,
  };
}
