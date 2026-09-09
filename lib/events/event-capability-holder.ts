import { isEventCapabilityToken, isValidEventId } from '@/lib/events/links';

export type EventCapabilitySurface = 'detail' | 'check-in' | 'proof';
export type RuntimeEventCapability = {
  ownerUserId: string;
  eventId: string;
  surface: EventCapabilitySurface;
  kind: 'share' | 'invite';
  token: string;
};

export const EVENT_CAPABILITY_HOLDER_TTL_MS = 60 * 60 * 1000;

type HeldEventCapability = RuntimeEventCapability & { expiresAt: number };
const capabilities = new Map<string, HeldEventCapability>();

const key = (
  ownerUserId: string,
  eventId: string,
  surface: EventCapabilitySurface
) => `${ownerUserId}:${eventId}:${surface}`;

const validOwner = (value: unknown): value is string =>
  typeof value === 'string' && Boolean(value.trim()) && value.length <= 160;

export const holdEventCapability = (
  capability: RuntimeEventCapability
): boolean => {
  if (
    !validOwner(capability.ownerUserId) ||
    !isValidEventId(capability.eventId) ||
    !isEventCapabilityToken(capability.token)
  ) {
    return false;
  }
  capabilities.set(
    key(capability.ownerUserId, capability.eventId, capability.surface),
    { ...capability, expiresAt: Date.now() + EVENT_CAPABILITY_HOLDER_TTL_MS }
  );
  return true;
};

export const peekEventCapability = (input: {
  ownerUserId: string | null | undefined;
  eventId: string | null | undefined;
  surface: EventCapabilitySurface;
}): RuntimeEventCapability | null => {
  if (!validOwner(input.ownerUserId) || !isValidEventId(input.eventId)) {
    return null;
  }
  const entryKey = key(input.ownerUserId, input.eventId, input.surface);
  const capability = capabilities.get(entryKey);
  if (!capability) return null;
  if (capability.expiresAt < Date.now()) {
    capabilities.delete(entryKey);
    return null;
  }
  return capability;
};

export const moveEventCapability = (input: {
  ownerUserId: string | null | undefined;
  eventId: string | null | undefined;
  from: EventCapabilitySurface;
  to: EventCapabilitySurface;
}): boolean => {
  const held = peekEventCapability({
    ownerUserId: input.ownerUserId,
    eventId: input.eventId,
    surface: input.from,
  });
  if (!held) return false;
  capabilities.delete(key(held.ownerUserId, held.eventId, held.surface));
  return holdEventCapability({ ...held, surface: input.to });
};

export const clearEventCapabilitiesForUser = (ownerUserId: string): void => {
  if (!validOwner(ownerUserId)) return;
  for (const [entryKey, capability] of capabilities) {
    if (capability.ownerUserId === ownerUserId) capabilities.delete(entryKey);
  }
};

export const clearAllEventCapabilitiesForTests = (): void => {
  capabilities.clear();
};
