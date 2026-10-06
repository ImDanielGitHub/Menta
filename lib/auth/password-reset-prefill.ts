import { randomUUID } from 'expo-crypto';

// Only an opaque, single-use handle enters navigation state. The email stays
// in memory and is discarded on consumption, replacement or a short timeout.
let pending: { id: string; email: string; expiresAt: number } | null = null;
let expiryTimer: ReturnType<typeof setTimeout> | null = null;

const clearPrefill = () => {
  pending = null;
  if (expiryTimer) clearTimeout(expiryTimer);
  expiryTimer = null;
};

export const stagePasswordResetPrefill = (email: string): string => {
  clearPrefill();
  const id = randomUUID();
  pending = { id, email, expiresAt: Date.now() + 60_000 };
  expiryTimer = setTimeout(clearPrefill, 60_000);
  return id;
};

export const takePasswordResetPrefill = (id?: string | string[]): string => {
  if (typeof id !== 'string' || !pending || pending.id !== id) return '';
  const email = Date.now() < pending.expiresAt ? pending.email : '';
  clearPrefill();
  return email;
};
