export const PASSWORD_RECOVERY_AUTH_STORAGE_KEY =
  'menta-password-recovery-auth-v1';
export const PASSWORD_RECOVERY_REDIRECT_PATH = 'password-recovery/callback';
export const PASSWORD_RECOVERY_PKCE_VERIFIER_STORAGE_KEY = `${PASSWORD_RECOVERY_AUTH_STORAGE_KEY}-code-verifier`;
export const PASSWORD_RECOVERY_USER_STORAGE_KEY = `${PASSWORD_RECOVERY_AUTH_STORAGE_KEY}-user`;

export const getDefaultSupabaseAuthStorageKey = (supabaseUrl: string) => {
  try {
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
    return projectRef ? `sb-${projectRef}-auth-token` : null;
  } catch {
    return null;
  }
};
