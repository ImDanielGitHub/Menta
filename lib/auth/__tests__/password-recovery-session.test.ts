import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearPasswordRecoverySession,
  getPasswordRecoveryUserId,
  markPasswordRecoverySession,
  PASSWORD_RECOVERY_AUTHORITY_STORAGE_KEY,
  subscribePasswordRecoverySession,
} from '@/lib/auth/password-recovery-session';
import {
  PASSWORD_RECOVERY_AUTH_STORAGE_KEY,
  PASSWORD_RECOVERY_PKCE_VERIFIER_STORAGE_KEY,
} from '@/lib/auth/password-recovery-config';
import {
  loadOnboardingDraft,
  saveOnboardingDraft,
} from '@/lib/onboarding-draft';

const mockGetUser = jest.fn();
const mockGetSession = jest.fn();
const mockSignOut = jest.fn();

jest.mock('@/lib/supabase', () => ({
  passwordRecoverySupabase: {
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
      getSession: (...args: unknown[]) => mockGetSession(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
  },
}));

describe('durable password recovery confinement', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    jest.mocked(AsyncStorage.multiRemove).mockImplementation(async keys => {
      await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));
    });
    await AsyncStorage.clear();
    mockSignOut.mockResolvedValue({ error: null });
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('restores a server-confirmed recovery session after process restart', async () => {
    await AsyncStorage.setItem(
      PASSWORD_RECOVERY_AUTHORITY_STORAGE_KEY,
      JSON.stringify({ userId: 'recovery-user' })
    );
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'recovery-user' } },
      error: null,
    });

    await expect(getPasswordRecoveryUserId()).resolves.toBe('recovery-user');
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('fails closed when the persisted recovery session does not match its marker', async () => {
    await AsyncStorage.setItem(
      PASSWORD_RECOVERY_AUTHORITY_STORAGE_KEY,
      JSON.stringify({ userId: 'recovery-user' })
    );
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'different-user' } },
      error: null,
    });

    await expect(getPasswordRecoveryUserId()).resolves.toBeNull();
    expect(
      await AsyncStorage.getItem(PASSWORD_RECOVERY_AUTHORITY_STORAGE_KEY)
    ).toBeNull();
    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('persists authority before publishing PASSWORD_RECOVERY state', async () => {
    const observed: Array<string | null> = [];
    const unsubscribe = subscribePasswordRecoverySession(userId => {
      observed.push(userId);
    });

    await markPasswordRecoverySession('recovery-user');

    expect(
      JSON.parse(
        (await AsyncStorage.getItem(PASSWORD_RECOVERY_AUTHORITY_STORAGE_KEY)) ??
          '{}'
      )
    ).toEqual({ userId: 'recovery-user' });
    expect(observed).toEqual(['recovery-user']);
    unsubscribe();
  });

  it('preserves the pending recovery verifier across ordinary app launches', async () => {
    await AsyncStorage.setItem(
      PASSWORD_RECOVERY_PKCE_VERIFIER_STORAGE_KEY,
      'pending-verifier/recovery'
    );

    await expect(getPasswordRecoveryUserId()).resolves.toBeNull();
    expect(
      await AsyncStorage.getItem(PASSWORD_RECOVERY_PKCE_VERIFIER_STORAGE_KEY)
    ).toBe('pending-verifier/recovery');
    expect(mockGetSession).not.toHaveBeenCalled();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('cleans an orphaned exchange with no marker and no pending verifier', async () => {
    await AsyncStorage.setItem(
      PASSWORD_RECOVERY_AUTH_STORAGE_KEY,
      'persisted-orphaned-session'
    );
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'orphaned-user' } } },
      error: null,
    });

    await expect(getPasswordRecoveryUserId()).resolves.toBeNull();
    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(
      await AsyncStorage.getItem(PASSWORD_RECOVERY_AUTH_STORAGE_KEY)
    ).toBeNull();
    expect(
      await AsyncStorage.getItem(PASSWORD_RECOVERY_PKCE_VERIFIER_STORAGE_KEY)
    ).toBeNull();
  });

  it('removes and verifies local tokens when signOut resolves with an error', async () => {
    await AsyncStorage.multiSet([
      [PASSWORD_RECOVERY_AUTH_STORAGE_KEY, 'persisted-session'],
      [PASSWORD_RECOVERY_PKCE_VERIFIER_STORAGE_KEY, 'verifier/recovery'],
      [
        PASSWORD_RECOVERY_AUTHORITY_STORAGE_KEY,
        JSON.stringify({ userId: 'recovery-user' }),
      ],
    ]);
    mockSignOut.mockResolvedValueOnce({ error: new Error('network failure') });

    await expect(clearPasswordRecoverySession()).resolves.toBeUndefined();
    await expect(
      AsyncStorage.multiGet([
        PASSWORD_RECOVERY_AUTH_STORAGE_KEY,
        PASSWORD_RECOVERY_PKCE_VERIFIER_STORAGE_KEY,
        PASSWORD_RECOVERY_AUTHORITY_STORAGE_KEY,
      ])
    ).resolves.toEqual([
      [PASSWORD_RECOVERY_AUTH_STORAGE_KEY, null],
      [PASSWORD_RECOVERY_PKCE_VERIFIER_STORAGE_KEY, null],
      [PASSWORD_RECOVERY_AUTHORITY_STORAGE_KEY, null],
    ]);
  });

  it('signs out the isolated session even when local storage cleanup throws', async () => {
    const remove = jest
      .spyOn(AsyncStorage, 'multiRemove')
      .mockRejectedValueOnce(new Error('storage unavailable'));

    await expect(clearPasswordRecoverySession()).rejects.toThrow(
      'storage unavailable'
    );
    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' });
    remove.mockRestore();
  });

  it('never claims or overwrites the existing anonymous onboarding draft', async () => {
    await saveOnboardingDraft({
      promise: 'Keep the original anonymous draft',
      proofType: 'photo',
    });

    await markPasswordRecoverySession('recovery-user');
    await clearPasswordRecoverySession();

    await expect(loadOnboardingDraft()).resolves.toMatchObject({
      ownerUserId: null,
      promise: 'Keep the original anonymous draft',
      proofType: 'photo',
    });
  });
});
