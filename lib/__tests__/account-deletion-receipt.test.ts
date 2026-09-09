import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  clearAccountDeletionReceipt,
  readAccountDeletionReceipt,
  saveAccountDeletionReceipt,
} from '@/lib/account-deletion-receipt';

describe('public account deletion receipt', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('persists only the signed-out receipt state without an account identifier', async () => {
    await saveAccountDeletionReceipt({
      success: true,
      appleAuthorization: 'manual_revocation_required',
    });

    await expect(readAccountDeletionReceipt()).resolves.toEqual({
      success: true,
      appleAuthorization: 'manual_revocation_required',
    });

    const storedValues = await Promise.all(
      (await AsyncStorage.getAllKeys()).map(key => AsyncStorage.getItem(key))
    );
    expect(storedValues.join('')).not.toContain('user-');
    expect(storedValues.join('')).not.toContain('email');
  });

  it('removes an invalid value instead of showing an unconfirmed receipt', async () => {
    await AsyncStorage.setItem(
      'menta:public-account-deletion-receipt:v1',
      JSON.stringify({ success: true, appleAuthorization: 'maybe' })
    );

    await expect(readAccountDeletionReceipt()).resolves.toBeNull();
    await expect(AsyncStorage.getAllKeys()).resolves.not.toContain(
      'menta:public-account-deletion-receipt:v1'
    );
  });

  it('clears the receipt when the user continues', async () => {
    await saveAccountDeletionReceipt({
      success: true,
      appleAuthorization: 'not_applicable',
    });

    await clearAccountDeletionReceipt();

    await expect(readAccountDeletionReceipt()).resolves.toBeNull();
  });
});
