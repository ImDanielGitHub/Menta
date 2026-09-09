import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isEventCapabilityToken, isValidEventId } from '@/lib/events/links';

export type PendingProtectedRouteSource =
  | 'auth_gate'
  | 'deep_link'
  | 'onboarding_gate';

export type PendingProtectedRoute = {
  path: string;
  source: PendingProtectedRouteSource;
  timestamp: number;
  ownerUserId: string | null;
};

export const PROTECTED_ROUTE_TTL_MS = 60 * 60 * 1000;

const AUTH_ROUTE_PATTERN =
  /^\/(?:auth-required|email-auth|email-confirmation|forgot-password|invite-activation|join-event|join-promise|legal-acceptance|login|onboarding|onboarding-again|register)(?:[/?#]|$)/;

const isValidProtectedEventPath = (path: string): boolean => {
  let url: URL;
  try {
    url = new URL(path, 'https://menta.invalid');
  } catch {
    return false;
  }
  const segments = url.pathname.split('/').filter(Boolean);
  if (
    segments[0] !== 'events' ||
    !isValidEventId(segments[1]) ||
    (segments.length === 3 && !['check-in', 'proof'].includes(segments[2])) ||
    segments.length > 3
  ) {
    return false;
  }
  const shareTokens = url.searchParams.getAll('shareToken');
  const inviteTokens = url.searchParams.getAll('inviteToken');
  if (
    [...url.searchParams.keys()].some(
      name => name !== 'shareToken' && name !== 'inviteToken'
    ) ||
    shareTokens.length > 1 ||
    inviteTokens.length > 1 ||
    (shareTokens.length && inviteTokens.length)
  ) {
    return false;
  }
  return [...shareTokens, ...inviteTokens].every(isEventCapabilityToken);
};

export const normalizeProtectedRoutePath = (value: unknown) => {
  const path = typeof value === 'string' ? value.trim() : '';

  if (!path) return null;
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  if (path.includes('://') || path.includes('\n') || path.includes('\r')) {
    return null;
  }
  if (AUTH_ROUTE_PATTERN.test(path)) return null;
  if (path.startsWith('/events/') && !isValidProtectedEventPath(path)) {
    return null;
  }

  return path;
};

const isFreshProtectedRoute = (route: PendingProtectedRoute) =>
  Date.now() - route.timestamp <= PROTECTED_ROUTE_TTL_MS;

const normalizeOwnerUserId = (value: unknown): string | null => {
  const userId = typeof value === 'string' ? value.trim() : '';
  return userId && userId.length <= 160 ? userId : null;
};

type ProtectedRouteState = {
  pending: PendingProtectedRoute | null;
  setPendingRoute: (
    path: unknown,
    source?: PendingProtectedRouteSource,
    ownerUserId?: string | null
  ) => void;
  getFreshPendingRoute: () => PendingProtectedRoute | null;
  peekPendingRouteForUser: (userId: string) => PendingProtectedRoute | null;
  claimPendingRouteForUser: (userId: string) => PendingProtectedRoute | null;
  consumePendingRouteForUser: (userId: string) => PendingProtectedRoute | null;
  consumePendingRoute: () => PendingProtectedRoute | null;
  clearOwnedPendingRoute: (userId: string) => void;
  clearPendingRoute: () => void;
};

export const useProtectedRouteStore = create<ProtectedRouteState>()(
  persist(
    (set, get) => ({
      pending: null,
      setPendingRoute: (path, source = 'auth_gate', ownerUserId = null) => {
        const normalizedPath = normalizeProtectedRoutePath(path);
        if (!normalizedPath) return;

        const normalizedOwnerUserId = normalizeOwnerUserId(ownerUserId);

        const current = get().pending;
        if (
          current?.path === normalizedPath &&
          current.source === source &&
          current.ownerUserId === normalizedOwnerUserId &&
          isFreshProtectedRoute(current)
        ) {
          return;
        }

        set({
          pending: {
            path: normalizedPath,
            source,
            timestamp: Date.now(),
            ownerUserId: normalizedOwnerUserId,
          },
        });
      },
      getFreshPendingRoute: () => {
        const route = get().pending;
        if (!route) return null;
        if (normalizeProtectedRoutePath(route.path) !== route.path) {
          set({ pending: null });
          return null;
        }
        if (isFreshProtectedRoute(route)) return route;

        set({ pending: null });
        return null;
      },
      peekPendingRouteForUser: userId => {
        const normalizedUserId = normalizeOwnerUserId(userId);
        if (!normalizedUserId) return null;

        const route = get().getFreshPendingRoute();
        if (!route) return null;
        if (route.ownerUserId && route.ownerUserId !== normalizedUserId) {
          return null;
        }
        return route;
      },
      claimPendingRouteForUser: userId => {
        const normalizedUserId = normalizeOwnerUserId(userId);
        if (!normalizedUserId) return null;

        const route = get().peekPendingRouteForUser(normalizedUserId);
        if (!route) return null;
        if (route.ownerUserId === normalizedUserId) return route;

        const claimed = { ...route, ownerUserId: normalizedUserId };
        if (get().pending === route) {
          set({ pending: claimed });
          return claimed;
        }
        return null;
      },
      consumePendingRouteForUser: userId => {
        const route = get().claimPendingRouteForUser(userId);
        if (!route) return null;

        if (get().pending === route) {
          set({ pending: null });
          return route;
        }
        return null;
      },
      consumePendingRoute: () => {
        const route = get().getFreshPendingRoute();
        if (!route) return null;

        set({ pending: null });
        return route;
      },
      clearOwnedPendingRoute: userId => {
        const normalizedUserId = normalizeOwnerUserId(userId);
        if (
          normalizedUserId &&
          get().pending?.ownerUserId === normalizedUserId
        ) {
          set({ pending: null });
        }
      },
      clearPendingRoute: () => set({ pending: null }),
    }),
    {
      name: 'protected-route-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ pending: state.pending }),
      version: 2,
      migrate: persistedState => {
        const persisted = persistedState as {
          pending?: Omit<PendingProtectedRoute, 'ownerUserId'> & {
            ownerUserId?: unknown;
          };
        };
        const pending = persisted?.pending;
        return {
          pending: pending
            ? {
                ...pending,
                ownerUserId: normalizeOwnerUserId(pending.ownerUserId),
              }
            : null,
        };
      },
    }
  )
);
