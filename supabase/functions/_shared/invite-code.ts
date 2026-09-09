const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const INVITE_CODE_LENGTH = 26;
export const INVITE_LIFETIME_DAYS = 7;

export function generateSecureInviteCode(): string {
  const bytes = new Uint8Array(INVITE_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(
    bytes,
    byte => INVITE_ALPHABET[byte % INVITE_ALPHABET.length]
  ).join('');
}

export function inviteExpiryIso(now = new Date()): string {
  return new Date(
    now.getTime() + INVITE_LIFETIME_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
}
