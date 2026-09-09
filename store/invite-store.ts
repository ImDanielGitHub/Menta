import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isValidInviteCode, normalizeInviteCode } from '@/lib/invite-links';

export type PendingInvite = {
  type: 'group' | 'challenge';
  code: string;
  timestamp: number;
  /** Missing in v1 persistence and therefore treated as anonymous. */
  ownerUserId?: string | null;
  /** Root navigation is delivered once per app session. */
  navigationClaimedAt?: number | null;
};

export const PENDING_INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type InviteProcessResult =
  | { status: 'none' }
  | { status: 'preview_required'; invite: PendingInvite }
  | {
      status: 'cleared';
      reason: 'malformed';
      invite: PendingInvite;
    };

const normalizePendingInviteCode = (code: string): string | null => {
  const normalizedCode = normalizeInviteCode(code);
  return isValidInviteCode(normalizedCode) ? normalizedCode : null;
};

const normalizeOwnerUserId = (value: unknown): string | null => {
  const userId = typeof value === 'string' ? value.trim() : '';
  return userId && userId.length <= 160 ? userId : null;
};

const isPendingInviteAvailableToUser = (
  invite: PendingInvite,
  userId: string
): boolean => {
  const ownerUserId = normalizeOwnerUserId(invite.ownerUserId);
  return (
    isValidInviteCode(invite.code) &&
    Number.isFinite(invite.timestamp) &&
    Date.now() - invite.timestamp <= PENDING_INVITE_TTL_MS &&
    (ownerUserId === null || ownerUserId === userId)
  );
};

const hasNavigationClaim = (invite: PendingInvite): boolean =>
  typeof invite.navigationClaimedAt === 'number' &&
  Number.isFinite(invite.navigationClaimedAt);

interface InviteState {
  pending: PendingInvite | null;
  setPendingGroup: (code: string, ownerUserId?: string | null) => void;
  setPendingChallenge: (code: string, ownerUserId?: string | null) => void;
  peekPendingForUser: (userId: string) => PendingInvite | null;
  peekPendingNavigationForUser: (userId: string) => PendingInvite | null;
  claimPendingForUser: (userId: string) => PendingInvite | null;
  claimPendingNavigationForUser: (userId: string) => PendingInvite | null;
  clearPendingForUser: (userId: string, expectedCode?: string) => boolean;
  dismissPending: (
    expected: Pick<PendingInvite, 'type' | 'code' | 'timestamp'>
  ) => boolean;
  clearOwnedPendingInvite: (userId: string) => void;
  clearPending: () => void;
  processIfAny: (userId: string) => Promise<InviteProcessResult>;
}

export const useInviteStore = create<InviteState>()(
  persist(
    (set, get) => ({
      pending: null,
      setPendingGroup: (code: string, ownerUserId = null) => {
        const normalizedCode = normalizePendingInviteCode(code);
        if (!normalizedCode) return;

        set({
          pending: {
            type: 'group',
            code: normalizedCode,
            timestamp: Date.now(),
            ownerUserId: normalizeOwnerUserId(ownerUserId),
            navigationClaimedAt: null,
          },
        });
      },
      setPendingChallenge: (code: string, ownerUserId = null) => {
        const normalizedCode = normalizePendingInviteCode(code);
        if (!normalizedCode) return;

        set({
          pending: {
            type: 'challenge',
            code: normalizedCode,
            timestamp: Date.now(),
            ownerUserId: normalizeOwnerUserId(ownerUserId),
            navigationClaimedAt: null,
          },
        });
      },
      peekPendingForUser: userId => {
        const normalizedUserId = normalizeOwnerUserId(userId);
        const invite = get().pending;
        if (
          invite &&
          (!isValidInviteCode(invite.code) ||
            !Number.isFinite(invite.timestamp) ||
            Date.now() - invite.timestamp > PENDING_INVITE_TTL_MS)
        ) {
          set({ pending: null });
          return null;
        }
        if (
          !normalizedUserId ||
          !invite ||
          !isPendingInviteAvailableToUser(invite, normalizedUserId)
        ) {
          return null;
        }
        return invite;
      },
      peekPendingNavigationForUser: userId => {
        const invite = get().peekPendingForUser(userId);
        return invite && !hasNavigationClaim(invite) ? invite : null;
      },
      claimPendingForUser: userId => {
        const normalizedUserId = normalizeOwnerUserId(userId);
        if (!normalizedUserId) return null;

        const invite = get().peekPendingForUser(normalizedUserId);
        if (!invite) return null;
        if (normalizeOwnerUserId(invite.ownerUserId) === normalizedUserId) {
          return invite;
        }

        const claimed = { ...invite, ownerUserId: normalizedUserId };
        if (get().pending === invite) {
          set({ pending: claimed });
          return claimed;
        }
        return null;
      },
      claimPendingNavigationForUser: userId => {
        const invite = get().claimPendingForUser(userId);
        if (!invite || hasNavigationClaim(invite)) return null;

        const claimed = { ...invite, navigationClaimedAt: Date.now() };
        if (get().pending === invite) {
          set({ pending: claimed });
          return claimed;
        }
        return null;
      },
      clearPendingForUser: (userId, expectedCode) => {
        const normalizedUserId = normalizeOwnerUserId(userId);
        const invite = get().pending;
        if (
          !normalizedUserId ||
          !invite ||
          normalizeOwnerUserId(invite.ownerUserId) !== normalizedUserId
        ) {
          return false;
        }

        const normalizedExpectedCode = expectedCode
          ? normalizePendingInviteCode(expectedCode)
          : null;
        if (
          expectedCode !== undefined &&
          normalizedExpectedCode !== invite.code
        ) {
          return false;
        }

        set({ pending: null });
        return true;
      },
      dismissPending: expected => {
        const normalizedExpectedCode = normalizePendingInviteCode(
          expected.code
        );
        const invite = get().pending;
        if (
          !invite ||
          !normalizedExpectedCode ||
          invite.type !== expected.type ||
          invite.code !== normalizedExpectedCode ||
          invite.timestamp !== expected.timestamp
        ) {
          return false;
        }

        set({ pending: null });
        return true;
      },
      clearOwnedPendingInvite: userId => {
        const normalizedUserId = normalizeOwnerUserId(userId);
        if (
          normalizedUserId &&
          normalizeOwnerUserId(get().pending?.ownerUserId) === normalizedUserId
        ) {
          set({ pending: null });
        }
      },
      clearPending: () => set({ pending: null }),
      processIfAny: async (userId: string) => {
        const inv = get().pending;
        const normalizedUserId = normalizeOwnerUserId(userId);
        if (
          !inv ||
          !normalizedUserId ||
          (normalizeOwnerUserId(inv.ownerUserId) !== null &&
            normalizeOwnerUserId(inv.ownerUserId) !== normalizedUserId)
        ) {
          return { ['status']: 'none' };
        }
        if (!isValidInviteCode(inv.code)) {
          set({ pending: null });
          return {
            ['status']: 'cleared',
            ['reason']: 'malformed',
            invite: inv,
          };
        }
        // Group and challenge invites are both previews. Claim the one root
        // navigation, but keep the capability until the destination confirms
        // a server-backed preview (or a funded join receipt for a challenge).
        const claimed = get().claimPendingNavigationForUser(normalizedUserId);
        return claimed
          ? { ['status']: 'preview_required', invite: claimed }
          : { ['status']: 'none' };
      },
    }),
    {
      name: 'invite-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: s => ({
        pending: s.pending ? { ...s.pending, navigationClaimedAt: null } : null,
      }),
      version: 2,
      migrate: persistedState => {
        const persisted = persistedState as { pending?: PendingInvite };
        const pending = persisted?.pending;
        return {
          pending: pending
            ? {
                ...pending,
                ownerUserId: normalizeOwnerUserId(pending.ownerUserId),
                navigationClaimedAt: null,
              }
            : null,
        };
      },
    }
  )
);
