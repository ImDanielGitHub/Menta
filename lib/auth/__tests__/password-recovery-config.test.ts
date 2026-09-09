import {
  getDefaultSupabaseAuthStorageKey,
  PASSWORD_RECOVERY_AUTH_STORAGE_KEY,
  PASSWORD_RECOVERY_REDIRECT_PATH,
} from '@/lib/auth/password-recovery-config';

describe('password recovery auth isolation config', () => {
  it('cannot collide with the ordinary Supabase session or OAuth verifier key', () => {
    expect(PASSWORD_RECOVERY_AUTH_STORAGE_KEY).not.toBe(
      getDefaultSupabaseAuthStorageKey(
        ''
      )
    );
  });

  it('uses a callback route distinct from ordinary OAuth', () => {
    expect(PASSWORD_RECOVERY_REDIRECT_PATH).toBe('password-recovery/callback');
    expect(PASSWORD_RECOVERY_REDIRECT_PATH).not.toBe('auth/callback');
  });
});
