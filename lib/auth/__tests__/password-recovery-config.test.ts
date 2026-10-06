import {
  getDefaultSupabaseAuthStorageKey,
  PASSWORD_RECOVERY_AUTH_STORAGE_KEY,
  PASSWORD_RECOVERY_REDIRECT_PATH,
  PASSWORD_RECOVERY_REDIRECT_URL,
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

  it('uses the public recovery callback by default', () => {
    expect(PASSWORD_RECOVERY_REDIRECT_URL).toBe(
      'menta://password-recovery/callback'
    );
  });
});
