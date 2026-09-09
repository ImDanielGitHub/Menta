import { PRIMARY_INVITE_HOST } from '@/lib/invite-links';

export type EventLinkCapability =
  | { kind: 'share'; token: string }
  | { kind: 'invite'; token: string };

export type ParsedEventLink = {
  eventId: string;
  capability: EventLinkCapability | null;
  source: 'https' | 'custom_scheme';
};

export type EventLinkResolution =
  | { status: 'not_event' }
  | { status: 'invalid_event' }
  | { status: 'event'; event: ParsedEventLink };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CAPABILITY_PATTERN = /^[A-Za-z0-9_-]{24,256}$/;

const CUSTOM_SCHEMES = new Set(['menta', 'lockedin', 'lockedinprod']);
const HTTPS_HOSTS = new Set([
  PRIMARY_INVITE_HOST,
  `www.${PRIMARY_INVITE_HOST}`,
  'lockedinpro.com',
  'www.lockedinpro.com',
]);

export const isValidEventId = (value: unknown): value is string =>
  typeof value === 'string' && UUID_PATTERN.test(value);

export const isEventCapabilityToken = (value: unknown): value is string =>
  typeof value === 'string' && CAPABILITY_PATTERN.test(value);

const pathSegments = (url: URL, isCustomScheme: boolean): string[] => {
  const segments = url.pathname
    .split('/')
    .map(segment => segment.trim())
    .filter(Boolean);
  return isCustomScheme && url.hostname
    ? [url.hostname, ...segments]
    : segments;
};

/**
 * A bare event ID is only a public-event lookup. Unlisted and invite-only
 * access needs an opaque capability, never a client-supplied visibility flag.
 */
export const resolveEventLink = (value: unknown): EventLinkResolution => {
  const rawValue = typeof value === 'string' ? value.trim() : '';
  if (!rawValue) return { status: 'not_event' };

  let url: URL;
  try {
    url = new URL(rawValue);
  } catch {
    return { status: 'not_event' };
  }

  const scheme = url.protocol.replace(':', '').toLowerCase();
  const customScheme = CUSTOM_SCHEMES.has(scheme);
  if (
    !customScheme &&
    (url.protocol !== 'https:' || !HTTPS_HOSTS.has(url.hostname))
  ) {
    return { status: 'not_event' };
  }

  const segments = pathSegments(url, customScheme);
  if (segments[0]?.toLowerCase() !== 'event') {
    return { status: 'not_event' };
  }

  const eventId = segments[1];
  if (segments.length !== 2 || !isValidEventId(eventId)) {
    return { status: 'invalid_event' };
  }

  const shareTokens = url.searchParams.getAll('share');
  const inviteTokens = url.searchParams.getAll('invite');
  if (
    shareTokens.length > 1 ||
    inviteTokens.length > 1 ||
    (shareTokens.length === 1 && inviteTokens.length === 1)
  ) {
    return { status: 'invalid_event' };
  }

  const shareToken = shareTokens[0] ?? null;
  const inviteToken = inviteTokens[0] ?? null;

  const capability = shareToken
    ? isEventCapabilityToken(shareToken)
      ? { kind: 'share' as const, token: shareToken }
      : null
    : inviteToken
      ? isEventCapabilityToken(inviteToken)
        ? { kind: 'invite' as const, token: inviteToken }
        : null
      : null;

  if ((shareToken !== null || inviteToken !== null) && !capability) {
    return { status: 'invalid_event' };
  }

  return {
    status: 'event',
    event: {
      eventId,
      capability,
      source: customScheme ? 'custom_scheme' : 'https',
    },
  };
};

export const parseEventLink = (value: string): ParsedEventLink | null => {
  const resolution = resolveEventLink(value);
  return resolution.status === 'event' ? resolution.event : null;
};

/**
 * Maps the public singular link contract onto Expo Router's existing plural
 * event route. Capability names change at this boundary so route components
 * never need to understand the public URL format.
 */
export const buildEventRoutePath = (event: ParsedEventLink): string => {
  const basePath = `/events/${event.eventId}`;
  if (!event.capability) return basePath;

  const paramName =
    event.capability.kind === 'share' ? 'shareToken' : 'inviteToken';
  return `${basePath}?${paramName}=${encodeURIComponent(event.capability.token)}`;
};

export const buildEventLink = (input: {
  eventId: string;
  capability?: EventLinkCapability | null;
}): string => {
  if (!isValidEventId(input.eventId)) throw new Error('Invalid event id');

  const url = new URL(`https://${PRIMARY_INVITE_HOST}/event/${input.eventId}`);
  if (input.capability) {
    if (!isEventCapabilityToken(input.capability.token)) {
      throw new Error('Invalid event capability');
    }
    url.searchParams.set(input.capability.kind, input.capability.token);
  }

  return url.toString();
};
