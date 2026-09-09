import { useEffect, useState } from 'react';
import { isEventCapabilityToken } from '@/lib/events/links';
import {
  hydrateEventCapabilityForSurface,
  type ProtectedEventSurface,
} from '@/lib/events/protected-auth-handoff';
import { peekEventCapability } from '@/lib/events/event-capability-holder';

type CapabilityValue = {
  shareToken: string | null;
  inviteToken: string | null;
} | null;

type HydrationState = {
  scopeKey: string;
  capability: CapabilityValue;
  status: 'ready' | 'invalid';
};

const tokenIdentity = (
  shareToken: string | null | undefined,
  inviteToken: string | null | undefined
): string | null => {
  if (shareToken && !inviteToken && isEventCapabilityToken(shareToken)) {
    return `share:${shareToken}`;
  }
  if (inviteToken && !shareToken && isEventCapabilityToken(inviteToken)) {
    return `invite:${inviteToken}`;
  }
  return null;
};

const scopeKey = (input: {
  userId: string | null | undefined;
  eventId: string | null | undefined;
  surface: ProtectedEventSurface;
  identity: string;
}) =>
  `${input.userId ?? 'signed-out'}:${input.eventId ?? 'missing'}:${input.surface}:${input.identity}`;

const safeEventHref = (eventId: string, surface: ProtectedEventSurface) => ({
  pathname:
    surface === 'detail'
      ? '/events/[eventId]'
      : surface === 'check-in'
        ? '/events/[eventId]/check-in'
        : '/events/[eventId]/proof',
  params: { eventId },
});

export const useEventCapabilityHydration = ({
  userId,
  eventId,
  surface,
  explicitShareToken,
  explicitInviteToken,
  replace,
}: {
  userId: string | null | undefined;
  eventId: string | null | undefined;
  surface: ProtectedEventSurface;
  explicitShareToken?: string | null;
  explicitInviteToken?: string | null;
  replace: (href: { pathname: string; params: { eventId: string } }) => void;
}) => {
  const active = peekEventCapability({
    ownerUserId: userId,
    eventId,
    surface,
  });
  const explicitIdentity = tokenIdentity(
    explicitShareToken,
    explicitInviteToken
  );
  const hasExplicitInput = Boolean(explicitShareToken || explicitInviteToken);
  const currentIdentity = explicitIdentity
    ? explicitIdentity
    : hasExplicitInput
      ? `invalid:${explicitShareToken ?? ''}:${explicitInviteToken ?? ''}`
      : active
        ? `${active.kind}:${active.token}`
        : 'public';
  const currentScopeKey = scopeKey({
    userId,
    eventId,
    surface,
    identity: currentIdentity,
  });
  const [hydration, setHydration] = useState<HydrationState | null>(null);

  useEffect(() => {
    const committedExplicitIdentity = tokenIdentity(
      explicitShareToken,
      explicitInviteToken
    );
    const committedHasExplicitInput = Boolean(
      explicitShareToken || explicitInviteToken
    );
    const capability = hydrateEventCapabilityForSurface({
      userId,
      eventId,
      surface,
      shareToken: explicitShareToken,
      inviteToken: explicitInviteToken,
    });
    const resolvedIdentity = capability
      ? (tokenIdentity(capability.shareToken, capability.inviteToken) ??
        'public')
      : committedHasExplicitInput
        ? `invalid:${explicitShareToken ?? ''}:${explicitInviteToken ?? ''}`
        : 'public';
    const nextHydration = {
      scopeKey: scopeKey({
        userId,
        eventId,
        surface,
        identity: resolvedIdentity,
      }),
      capability,
      status:
        committedHasExplicitInput && !committedExplicitIdentity
          ? ('invalid' as const)
          : ('ready' as const),
    };
    setHydration(previous =>
      previous?.scopeKey === nextHydration.scopeKey &&
      previous.status === nextHydration.status &&
      previous.capability?.shareToken === capability?.shareToken &&
      previous.capability?.inviteToken === capability?.inviteToken
        ? previous
        : nextHydration
    );

    if (capability && committedExplicitIdentity && eventId) {
      replace(safeEventHref(eventId, surface));
    }
  }, [
    eventId,
    explicitInviteToken,
    explicitShareToken,
    replace,
    surface,
    userId,
  ]);

  const ownsCurrentScope = hydration?.scopeKey === currentScopeKey;
  const ready = ownsCurrentScope && hydration.status === 'ready';
  const invalid = ownsCurrentScope && hydration.status === 'invalid';
  return {
    ready,
    invalid,
    shareToken: ready ? hydration.capability?.shareToken : undefined,
    inviteToken: ready ? hydration.capability?.inviteToken : undefined,
  };
};
