import { isEventCapabilityToken, isValidEventId } from '@/lib/events/links';
import {
  holdEventCapability,
  moveEventCapability,
  peekEventCapability,
  type EventCapabilitySurface,
} from '@/lib/events/event-capability-holder';
import {
  useProtectedRouteStore,
  type PendingProtectedRoute,
} from '@/store/protected-route-store';

export type ProtectedEventSurface = 'detail' | 'proof' | 'check-in';

type PrepareEventAuthHandoffInput = {
  eventId: string | null | undefined;
  surface: ProtectedEventSurface;
  shareToken?: string | null;
  inviteToken?: string | null;
};

export const EVENT_AUTH_GATE_DESTINATION = {
  pathname: '/auth-required',
  params: { context: 'events' },
} as const;

const eventSurfaceSuffix = (surface: ProtectedEventSurface): string =>
  surface === 'detail' ? '' : `/${surface}`;

/**
 * Keeps event capabilities in the private protected-route store. The returned
 * navigation object is intentionally secret-free so auth route parameters,
 * login parameters and analytics cannot receive a bearer capability.
 */
export const prepareEventAuthHandoff = (
  input: PrepareEventAuthHandoffInput
): typeof EVENT_AUTH_GATE_DESTINATION | null => {
  if (!isValidEventId(input.eventId)) return null;

  const shareToken = input.shareToken ?? null;
  const inviteToken = input.inviteToken ?? null;
  if (shareToken && inviteToken) return null;
  if (shareToken && !isEventCapabilityToken(shareToken)) return null;
  if (inviteToken && !isEventCapabilityToken(inviteToken)) return null;

  const query = shareToken
    ? `?shareToken=${encodeURIComponent(shareToken)}`
    : inviteToken
      ? `?inviteToken=${encodeURIComponent(inviteToken)}`
      : '';
  const path = `/events/${input.eventId}${eventSurfaceSuffix(input.surface)}${query}`;

  useProtectedRouteStore.getState().setPendingRoute(path, 'auth_gate');
  return EVENT_AUTH_GATE_DESTINATION;
};

export const getHeldEventCapability = ({
  pendingRoute,
  userId,
  eventId,
  surface,
}: {
  pendingRoute: PendingProtectedRoute | null;
  userId: string | null | undefined;
  eventId: string | null | undefined;
  surface: ProtectedEventSurface;
}): { shareToken: string | null; inviteToken: string | null } | null => {
  if (
    !pendingRoute ||
    !userId ||
    pendingRoute.ownerUserId !== userId ||
    !isValidEventId(eventId)
  ) {
    return null;
  }

  const [path, query = ''] = pendingRoute.path.split('?', 2);
  const expectedPath = `/events/${eventId}${eventSurfaceSuffix(surface)}`;
  if (path !== expectedPath) return null;

  const search = new URLSearchParams(query);
  const shareToken = search.get('shareToken');
  const inviteToken = search.get('inviteToken');
  if (shareToken && inviteToken) return null;
  if (shareToken && isEventCapabilityToken(shareToken)) {
    return { shareToken, inviteToken: null };
  }
  if (inviteToken && isEventCapabilityToken(inviteToken)) {
    return { shareToken: null, inviteToken };
  }
  return null;
};

export const hydrateEventCapabilityForSurface = ({
  userId,
  eventId,
  surface,
  shareToken,
  inviteToken,
}: {
  userId: string | null | undefined;
  eventId: string | null | undefined;
  surface: EventCapabilitySurface;
  shareToken?: string | null;
  inviteToken?: string | null;
}): { shareToken: string | null; inviteToken: string | null } | null => {
  if (!userId || !isValidEventId(eventId)) return null;
  const hasExplicitCapability = Boolean(shareToken || inviteToken);
  if (shareToken && inviteToken) return null;

  const routeCapability = shareToken
    ? isEventCapabilityToken(shareToken)
      ? { kind: 'share' as const, token: shareToken }
      : null
    : inviteToken
      ? isEventCapabilityToken(inviteToken)
        ? { kind: 'invite' as const, token: inviteToken }
        : null
      : null;
  if (hasExplicitCapability && !routeCapability) return null;
  const protectedRouteStore = useProtectedRouteStore.getState();
  const pendingRoute = protectedRouteStore.peekPendingRouteForUser(userId);
  const persistedCapability = getHeldEventCapability({
    pendingRoute,
    userId,
    eventId,
    surface,
  });
  const active = peekEventCapability({
    ownerUserId: userId,
    eventId,
    surface,
  });
  const usesPersistedCapability =
    !routeCapability && Boolean(persistedCapability);
  const capability = routeCapability
    ? routeCapability
    : persistedCapability?.shareToken
      ? { kind: 'share' as const, token: persistedCapability.shareToken }
      : persistedCapability?.inviteToken
        ? { kind: 'invite' as const, token: persistedCapability.inviteToken }
        : active
          ? { kind: active.kind, token: active.token }
          : null;
  if (!capability) return null;

  if (
    !holdEventCapability({
      ownerUserId: userId,
      eventId,
      surface,
      ...capability,
    })
  ) {
    return null;
  }
  if (usesPersistedCapability && pendingRoute) {
    protectedRouteStore.consumePendingRouteForUser(userId);
  }
  return capability.kind === 'share'
    ? { shareToken: capability.token, inviteToken: null }
    : { shareToken: null, inviteToken: capability.token };
};

export const transferEventCapability = (input: {
  userId: string | null | undefined;
  eventId: string | null | undefined;
  from: EventCapabilitySurface;
  to: EventCapabilitySurface;
}): boolean =>
  moveEventCapability({
    ownerUserId: input.userId,
    eventId: input.eventId,
    from: input.from,
    to: input.to,
  });

export const holdReturnedEventCapability = (input: {
  userId: string | null | undefined;
  eventId: string | null | undefined;
  shareToken?: string | null;
  inviteToken?: string | null;
}): boolean => {
  if (!input.userId || !isValidEventId(input.eventId)) return false;
  if (input.shareToken && input.inviteToken) return false;
  const capability = input.shareToken
    ? isEventCapabilityToken(input.shareToken)
      ? { kind: 'share' as const, token: input.shareToken }
      : null
    : input.inviteToken && isEventCapabilityToken(input.inviteToken)
      ? { kind: 'invite' as const, token: input.inviteToken }
      : null;
  if (!capability) return false;
  return holdEventCapability({
    ownerUserId: input.userId,
    eventId: input.eventId,
    surface: 'detail',
    ...capability,
  });
};
