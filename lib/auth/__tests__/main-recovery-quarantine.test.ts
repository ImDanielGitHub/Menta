import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  confineUnexpectedMainRecovery,
  getMainRecoveryQuarantineUserId,
  MAIN_RECOVERY_QUARANTINE_STORAGE_KEY,
} from '@/lib/auth/main-recovery-quarantine';

const MAIN_STORAGE_KEY = 'sb-project-auth-token';

describe('unexpected main-client recovery quarantine', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    await AsyncStorage.clear();
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('removes and verifies local tokens when signOut resolves with an error', async () => {
    await AsyncStorage.setItem(MAIN_STORAGE_KEY, 'persisted-recovery-session');
    const providerError = new Error('network failure');

    await expect(
      confineUnexpectedMainRecovery({
        storageKey: MAIN_STORAGE_KEY,
        userId: 'recovery-user',
        signOut: jest.fn().mockResolvedValue({ error: providerError }),
      })
    ).resolves.toEqual({
      localSessionCleared: true,
      signOutError: providerError,
    });

    expect(await AsyncStorage.getItem(MAIN_STORAGE_KEY)).toBeNull();
    expect(await getMainRecoveryQuarantineUserId()).toBeNull();
  });

  it('keeps durable quarantine when local token removal cannot be verified', async () => {
    await AsyncStorage.setItem(MAIN_STORAGE_KEY, 'persisted-recovery-session');
    jest
      .spyOn(AsyncStorage, 'multiRemove')
      .mockRejectedValueOnce(new Error('storage unavailable'));

    await expect(
      confineUnexpectedMainRecovery({
        storageKey: MAIN_STORAGE_KEY,
        userId: 'recovery-user',
        signOut: jest.fn().mockResolvedValue({ error: new Error('offline') }),
      })
    ).rejects.toThrow('storage unavailable');

    expect(await AsyncStorage.getItem(MAIN_STORAGE_KEY)).toBe(
      'persisted-recovery-session'
    );
    expect(await getMainRecoveryQuarantineUserId()).toBe('recovery-user');
    expect(
      await AsyncStorage.getItem(MAIN_RECOVERY_QUARANTINE_STORAGE_KEY)
    ).toBe('recovery-user');
  });
});
