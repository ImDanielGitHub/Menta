import { getEventSummary } from '@/lib/events/api';
import { isEventCapabilityToken, isValidEventId } from '@/lib/events/links';
import type { TranslationKey } from '@/lib/localization/en-NZ';
import {
  translate,
  type TranslationValues,
} from '@/lib/localization/translate';
import {
  loadPromiseAccountabilityInvitePreview,
  type PromiseAccountabilityInvitePreview,
} from '@/lib/promises/accountability';
import type { PendingInvite } from '@/store/invite-store';
import type { GroupInvitePreview } from '@/lib/groups/group-invite-contract';
import { useGroupStore } from '@/store/group-store';
import {
  PROTECTED_ROUTE_TTL_MS,
  useProtectedRouteStore,
  type PendingProtectedRoute,
  type PendingProtectedRouteSource,
} from '@/store/protected-route-store';
import type { EventSummary } from '@/types/event';

export type InboundInviteEntryLoadResult<T> =
  | { kind: 'ready'; value: T }
  | { kind: 'sign_in_required'; message: string }
  | { kind: 'retry'; message: string }
  | { kind: 'terminal'; message: string };

export type PendingEventInviteEntry = {
  eventId: string;
  ownerUserId: string | null;
  timestamp: number;
};

export type InboundInviteReceipt =
  | {
      kind: 'promise';
      promise: PromiseAccountabilityInvitePreview;
    }
  | {
      kind: 'group';
      group: GroupInvitePreview;
    }
  | {
      kind: 'event';
      event: EventSummary;
    };

type ResolvedPendingEvent = {
  projection: PendingEventInviteEntry;
  shareToken: string | null;
  inviteToken: string | null;
};

type InboundInviteTranslator = (
  key: TranslationKey,
  values?: TranslationValues
) => string;

const defaultTranslate: InboundInviteTranslator = (key, values) =>
  translate('en-NZ', key, values);

const resolvePendingEvent = ({
  pendingRoute,
  eventId,
  currentUserId,
}: {
  pendingRoute: PendingProtectedRoute | null;
  eventId?: string | null;
  currentUserId?: string | null;
}): ResolvedPendingEvent | null => {
  if (
    !pendingRoute ||
    !Number.isFinite(pendingRoute.timestamp) ||
    Date.now() - pendingRoute.timestamp > PROTECTED_ROUTE_TTL_MS ||
    (pendingRoute.ownerUserId !== null &&
      pendingRoute.ownerUserId !== currentUserId)
  ) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(pendingRoute.path, 'https://menta.invalid');
  } catch {
    return null;
  }

  const segments = url.pathname.split('/').filter(Boolean);
  const resolvedEventId = segments[0] === 'events' ? segments[1] : null;
  if (
    segments.length !== 2 ||
    !isValidEventId(resolvedEventId) ||
    (eventId !== undefined && eventId !== null && resolvedEventId !== eventId)
  ) {
    return null;
  }

  const shareTokens = url.searchParams.getAll('shareToken');
  const inviteTokens = url.searchParams.getAll('inviteToken');
  if (
    [...url.searchParams.keys()].some(
      key => key !== 'shareToken' && key !== 'inviteToken'
    ) ||
    shareTokens.length > 1 ||
    inviteTokens.length > 1 ||
    (shareTokens.length === 1 && inviteTokens.length === 1)
  ) {
    return null;
  }

  const shareToken = shareTokens[0] ?? null;
  const inviteToken = inviteTokens[0] ?? null;
  if (
    (shareToken !== null && !isEventCapabilityToken(shareToken)) ||
    (inviteToken !== null && !isEventCapabilityToken(inviteToken))
  ) {
    return null;
  }

  return {
    projection: {
      eventId: resolvedEventId,
      ownerUserId: pendingRoute.ownerUserId,
      timestamp: pendingRoute.timestamp,
    },
    shareToken,
    inviteToken,
  };
};

export const projectPendingEventInviteEntry = (input: {
  pendingRoute: PendingProtectedRoute | null;
  eventId?: string | null;
  currentUserId?: string | null;
}): PendingEventInviteEntry | null =>
  resolvePendingEvent(input)?.projection ?? null;

export const holdPendingEventInviteEntry = (input: {
  path: string;
  source: PendingProtectedRouteSource;
  currentUserId?: string | null;
}): PendingEventInviteEntry | null => {
  const candidate: PendingProtectedRoute = {
    path: input.path,
    source: input.source,
    timestamp: Date.now(),
    ownerUserId: input.currentUserId ?? null,
  };
  const safeCandidate = resolvePendingEvent({
    pendingRoute: candidate,
    currentUserId: input.currentUserId ?? null,
  });
  if (!safeCandidate) return null;

  useProtectedRouteStore
    .getState()
    .setPendingRoute(input.path, input.source, input.currentUserId ?? null);
  return projectPendingEventInviteEntry({
    pendingRoute: useProtectedRouteStore.getState().pending,
    eventId: safeCandidate.projection.eventId,
    currentUserId: input.currentUserId ?? null,
  });
};

export const buildEventInviteEntryHref = (entry: PendingEventInviteEntry) => ({
  pathname: '/join-event' as const,
  params: { eventId: entry.eventId },
});

export const loadPendingEventInviteEntry = async (input: {
  pendingRoute: PendingProtectedRoute | null;
  eventId: string;
  currentUserId?: string | null;
  localise?: InboundInviteTranslator;
}): Promise<InboundInviteEntryLoadResult<EventSummary>> => {
  const localise = input.localise ?? defaultTranslate;
  const resolved = resolvePendingEvent(input);
  if (!resolved) {
    return {
      kind: 'terminal',
      message: localise(
        'groups.source.accountability.event.error.no_longer_available'
      ),
    };
  }

  const receipt = await getEventSummary({
    eventId: resolved.projection.eventId,
    shareToken: resolved.shareToken,
    inviteToken: resolved.inviteToken,
  });
  if (receipt.outcome === 'completed' && receipt.data) {
    return { kind: 'ready', value: receipt.data };
  }
  if (receipt.outcome === 'unknown_result' || receipt.retryable) {
    return {
      kind: 'retry',
      message: localise('groups.source.accountability.event.error.check_retry'),
    };
  }

  if (!input.currentUserId) {
    return {
      kind: 'sign_in_required',
      message: localise(
        'fullAuth.auth_required.sign_in_to_complete_this_action_and_return_here_'
      ),
    };
  }

  return {
    kind: 'terminal',
    message: localise(
      'groups.source.accountability.event.error.ask_current_link'
    ),
  };
};

export const claimPendingEventInviteEntryForUser = (input: {
  pendingRoute: PendingProtectedRoute | null;
  eventId: string;
  userId: string;
}): boolean => {
  const pendingRoute = input.pendingRoute;
  if (!pendingRoute) return false;
  const resolved = resolvePendingEvent({
    pendingRoute,
    eventId: input.eventId,
    currentUserId: input.userId,
  });
  if (!resolved) return false;

  const current = useProtectedRouteStore.getState().pending;
  if (
    !current ||
    current.path !== pendingRoute.path ||
    current.timestamp !== pendingRoute.timestamp
  ) {
    return false;
  }

  return Boolean(
    useProtectedRouteStore.getState().claimPendingRouteForUser(input.userId)
  );
};

export const dismissPendingEventInviteEntry = (input: {
  pendingRoute: PendingProtectedRoute | null;
  eventId: string;
  currentUserId?: string | null;
}): boolean => {
  const resolved = resolvePendingEvent(input);
  if (!resolved || !input.pendingRoute) return false;

  const current = useProtectedRouteStore.getState().pending;
  if (
    !current ||
    current.path !== input.pendingRoute.path ||
    current.timestamp !== input.pendingRoute.timestamp ||
    current.ownerUserId !== input.pendingRoute.ownerUserId
  ) {
    return false;
  }

  useProtectedRouteStore.setState({ pending: null });
  return true;
};

export const loadInboundInviteReceipt = async (input: {
  pendingInvite: PendingInvite | null;
  pendingProtectedRoute: PendingProtectedRoute | null;
  currentUserId?: string | null;
  localise?: InboundInviteTranslator;
}): Promise<InboundInviteEntryLoadResult<InboundInviteReceipt> | null> => {
  const inviteOwnerMatches =
    input.pendingInvite?.ownerUserId === null ||
    input.pendingInvite?.ownerUserId === undefined ||
    input.pendingInvite?.ownerUserId === input.currentUserId;

  if (input.pendingInvite?.type === 'challenge' && inviteOwnerMatches) {
    const promise = input.localise
      ? await loadPromiseAccountabilityInvitePreview(
          input.pendingInvite.code,
          input.localise
        )
      : await loadPromiseAccountabilityInvitePreview(input.pendingInvite.code);
    return promise.kind === 'ready'
      ? {
          kind: 'ready',
          value: { kind: 'promise', promise: promise.preview },
        }
      : promise;
  }

  if (input.pendingInvite?.type === 'group' && inviteOwnerMatches) {
    const localise = input.localise ?? defaultTranslate;
    if (!input.currentUserId) {
      return {
        kind: 'sign_in_required',
        message: localise(
          'fullAuth.auth_required.sign_in_to_complete_this_action_and_return_here_'
        ),
      };
    }

    try {
      const group = await useGroupStore
        .getState()
        .previewGroupInvite(input.pendingInvite.code);
      if (group.status === 'ACTIVE' || group.status === 'ALREADY_MEMBER') {
        return { kind: 'ready', value: { kind: 'group', group } };
      }

      const terminalMessage =
        group.status === 'EXPIRED'
          ? localise('groups.join.expired_detail')
          : group.status === 'REPLACED'
            ? localise('groups.join.replaced_detail')
            : group.status === 'GROUP_INACTIVE'
              ? localise('groups.join.inactive_detail')
              : localise('groups.join.invalid_invite_detail');
      return { kind: 'terminal', message: terminalMessage };
    } catch (reason) {
      const code = String(
        (reason as { code?: unknown } | null)?.code ?? ''
      ).toUpperCase();
      if (code === 'AUTH_REQUIRED' || code === 'AUTH_SESSION_REVOKED') {
        return {
          kind: 'sign_in_required',
          message: localise(
            'fullAuth.auth_required.sign_in_to_complete_this_action_and_return_here_'
          ),
        };
      }
      if (code === 'INVALID_CODE') {
        return {
          kind: 'terminal',
          message: localise('groups.join.invalid_invite_detail'),
        };
      }
      return {
        kind: 'retry',
        message: localise('groups.join.preview_unavailable_detail'),
      };
    }
  }

  const eventProjection = projectPendingEventInviteEntry({
    pendingRoute: input.pendingProtectedRoute,
    currentUserId: input.currentUserId,
  });
  if (!eventProjection) return null;

  const event = await loadPendingEventInviteEntry({
    pendingRoute: input.pendingProtectedRoute,
    eventId: eventProjection.eventId,
    currentUserId: input.currentUserId,
    localise: input.localise,
  });
  return event.kind === 'ready'
    ? { kind: 'ready', value: { kind: 'event', event: event.value } }
    : event;
};
