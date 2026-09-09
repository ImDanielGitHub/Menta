export const EMAIL_CONFIRMATION_REDIRECT_PATH =
  'email-confirmation/callback' as const;

export const EMAIL_CONFIRMATION_STORAGE_KEY =
  'menta.auth.pending-email-confirmation.v1' as const;

export const EMAIL_CONFIRMATION_RESEND_COOLDOWN_MS = 60 * 1000;

// This is a local recovery horizon, not a claim about the server email-link
// expiry. It prevents an abandoned address from becoming permanent app state.
export const EMAIL_CONFIRMATION_LOCAL_TTL_MS = 30 * 24 * 60 * 60 * 1000;
