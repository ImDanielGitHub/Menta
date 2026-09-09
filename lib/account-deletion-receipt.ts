import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppleDeletionAuthorizationStatus =
  | 'not_applicable'
  | 'revoked'
  | 'manual_revocation_required';

export type AccountDeletionReceipt = {
  success: true;
  appleAuthorization: AppleDeletionAuthorizationStatus;
};

const ACCOUNT_DELETION_RECEIPT_KEY = 'menta:public-account-deletion-receipt:v1';

const isAppleDeletionAuthorizationStatus = (
  value: unknown
): value is AppleDeletionAuthorizationStatus =>
  value === 'not_applicable' ||
  value === 'revoked' ||
  value === 'manual_revocation_required';

export const isAccountDeletionReceipt = (
  value: unknown
): value is AccountDeletionReceipt => {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    candidate.success === true &&
    isAppleDeletionAuthorizationStatus(candidate.appleAuthorization)
  );
};

/**
 * This receipt contains no account identifier or user-authored content. It is
 * intentionally public to the signed-out app so the confirmed result survives
 * the auth redirect that follows deletion.
 */
export const saveAccountDeletionReceipt = async (
  receipt: AccountDeletionReceipt
): Promise<void> => {
  await AsyncStorage.setItem(
    ACCOUNT_DELETION_RECEIPT_KEY,
    JSON.stringify(receipt)
  );
};

export const readAccountDeletionReceipt =
  async (): Promise<AccountDeletionReceipt | null> => {
    const stored = await AsyncStorage.getItem(ACCOUNT_DELETION_RECEIPT_KEY);
    if (!stored) return null;

    try {
      const parsed: unknown = JSON.parse(stored);
      if (isAccountDeletionReceipt(parsed)) return parsed;
    } catch {}

    await AsyncStorage.removeItem(ACCOUNT_DELETION_RECEIPT_KEY);
    return null;
  };

export const clearAccountDeletionReceipt = async (): Promise<void> => {
  await AsyncStorage.removeItem(ACCOUNT_DELETION_RECEIPT_KEY);
};
