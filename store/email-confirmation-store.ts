import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import {
  EMAIL_CONFIRMATION_LOCAL_TTL_MS,
  EMAIL_CONFIRMATION_RESEND_COOLDOWN_MS,
  EMAIL_CONFIRMATION_STORAGE_KEY,
} from '@/lib/auth/email-confirmation-config';

export type PendingEmailConfirmation = {
  version: 1;
  email: string;
  username: string;
  expectedUserId: string | null;
  fromOnboarding: boolean;
  requestedAt: number;
  resendAvailableAt: number;
};

type StagePendingEmailConfirmationInput = {
  email: string;
  username: string;
  expectedUserId?: string | null;
  fromOnboarding: boolean;
  now?: number;
};

type EmailConfirmationState = {
  pending: PendingEmailConfirmation | null;
  hasHydrated: boolean;
  hydrate: () => Promise<PendingEmailConfirmation | null>;
  stage: (
    input: StagePendingEmailConfirmationInput
  ) => Promise<PendingEmailConfirmation>;
  markResent: (
    expectedEmail: string,
    now?: number
  ) => Promise<PendingEmailConfirmation | null>;
  clear: () => Promise<void>;
  clearForEmail: (expectedEmail: string) => Promise<boolean>;
};

const normalizeEmail = (value: string): string => value.trim().toLowerCase();

const normalizeUsername = (value: string): string => value.trim().slice(0, 64);

const normalizeUserId = (value: unknown): string | null => {
  const userId = typeof value === 'string' ? value.trim() : '';
  return userId && userId.length <= 160 ? userId : null;
};

const isValidEmail = (value: string): boolean =>
  value.length <= 320 && /\S+@\S+\.\S+/.test(value);

const parsePendingEmailConfirmation = (
  value: unknown,
  now = Date.now()
): PendingEmailConfirmation | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const candidate = value as Partial<PendingEmailConfirmation>;
  const email =
    typeof candidate.email === 'string' ? normalizeEmail(candidate.email) : '';
  const username =
    typeof candidate.username === 'string'
      ? normalizeUsername(candidate.username)
      : '';
  const requestedAt = Number(candidate.requestedAt);
  const resendAvailableAt = Number(candidate.resendAvailableAt);

  if (
    candidate.version !== 1 ||
    !isValidEmail(email) ||
    !username ||
    typeof candidate.fromOnboarding !== 'boolean' ||
    !Number.isFinite(requestedAt) ||
    !Number.isFinite(resendAvailableAt) ||
    requestedAt > now + EMAIL_CONFIRMATION_RESEND_COOLDOWN_MS ||
    now - requestedAt > EMAIL_CONFIRMATION_LOCAL_TTL_MS
  ) {
    return null;
  }

  return {
    version: 1,
    email,
    username,
    expectedUserId: normalizeUserId(candidate.expectedUserId),
    fromOnboarding: candidate.fromOnboarding,
    requestedAt,
    resendAvailableAt: Math.max(requestedAt, resendAvailableAt),
  };
};

let storageQueue: Promise<void> = Promise.resolve();

const runInStorageOrder = <Result>(
  operation: () => Promise<Result>
): Promise<Result> => {
  const result = storageQueue.then(operation, operation);
  storageQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
};

const readPending = async (): Promise<PendingEmailConfirmation | null> => {
  const raw = await AsyncStorage.getItem(EMAIL_CONFIRMATION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const pending = parsePendingEmailConfirmation(JSON.parse(raw) as unknown);
    if (!pending) {
      await AsyncStorage.removeItem(EMAIL_CONFIRMATION_STORAGE_KEY);
    }
    return pending;
  } catch {
    await AsyncStorage.removeItem(EMAIL_CONFIRMATION_STORAGE_KEY);
    return null;
  }
};

const writePending = async (
  pending: PendingEmailConfirmation
): Promise<void> => {
  await AsyncStorage.setItem(
    EMAIL_CONFIRMATION_STORAGE_KEY,
    JSON.stringify(pending)
  );
};

export const useEmailConfirmationStore = create<EmailConfirmationState>()(
  (set, get) => ({
    pending: null,
    hasHydrated: false,
    hydrate: () =>
      runInStorageOrder(async () => {
        try {
          const pending = await readPending();
          set({ pending, hasHydrated: true });
          return pending;
        } catch (error) {
          // Root routing must not remain behind a permanent loading screen when
          // this auxiliary storage key is unavailable.
          set({ pending: null, hasHydrated: true });
          throw error;
        }
      }),
    stage: input =>
      runInStorageOrder(async () => {
        const now = input.now ?? Date.now();
        const pending: PendingEmailConfirmation = {
          version: 1,
          email: normalizeEmail(input.email),
          username: normalizeUsername(input.username),
          expectedUserId: normalizeUserId(input.expectedUserId),
          fromOnboarding: input.fromOnboarding,
          requestedAt: now,
          resendAvailableAt: now + EMAIL_CONFIRMATION_RESEND_COOLDOWN_MS,
        };

        if (!isValidEmail(pending.email) || !pending.username) {
          throw new Error('Cannot save an invalid email confirmation request.');
        }

        // Publish the in-memory state first so a storage failure cannot expose
        // the signup form and invite a duplicate account request in this run.
        set({ pending, hasHydrated: true });
        await writePending(pending);
        return pending;
      }),
    markResent: (expectedEmail, now = Date.now()) =>
      runInStorageOrder(async () => {
        const current = get().pending ?? (await readPending());
        if (!current || current.email !== normalizeEmail(expectedEmail)) {
          return null;
        }

        const pending: PendingEmailConfirmation = {
          ...current,
          requestedAt: now,
          resendAvailableAt: now + EMAIL_CONFIRMATION_RESEND_COOLDOWN_MS,
        };
        await writePending(pending);
        set({ pending, hasHydrated: true });
        return pending;
      }),
    clear: () =>
      runInStorageOrder(async () => {
        await AsyncStorage.removeItem(EMAIL_CONFIRMATION_STORAGE_KEY);
        set({ pending: null, hasHydrated: true });
      }),
    clearForEmail: expectedEmail =>
      runInStorageOrder(async () => {
        const current = get().pending ?? (await readPending());
        if (!current || current.email !== normalizeEmail(expectedEmail)) {
          return false;
        }
        await AsyncStorage.removeItem(EMAIL_CONFIRMATION_STORAGE_KEY);
        set({ pending: null, hasHydrated: true });
        return true;
      }),
  })
);

export const isEmailConfirmationForSession = (
  pending: PendingEmailConfirmation,
  user: { id?: string | null; email?: string | null }
): boolean => {
  const email = normalizeEmail(user.email ?? '');
  if (!email || email !== pending.email) return false;

  return (
    !pending.expectedUserId ||
    normalizeUserId(user.id) === pending.expectedUserId
  );
};
