import {
  buildEventRoutePath,
  isEventCapabilityToken,
  isValidEventId,
  resolveEventLink,
} from '@/lib/events/links';

const APP_SCHEMES = new Set(['menta', 'lockedin', 'lockedinprod']);

const UNIVERSAL_LINK_HOSTS = new Set([
  'menta.quest',
  'www.menta.quest',
  'lockedinpro.com',
  'www.lockedinpro.com',
]);

const STATIC_APP_ROUTES = new Set([
  'archived-groups',
  'create-challenge',
  'create-group',
  'error-boundary',
  'events',
  'group-members',
  'group-review',
  'group-settings',
  'inventory',
  'invite',
  'join-funding',
  'join-group',
  'momenta',
  'notification-settings',
  'report-issue',
  'review-queue',
  'settings',
  'shop',
  'solo-challenges',
  'verification',
]);

const TAB_ROUTE = '(tabs)';

const DYNAMIC_ROUTE_PREFIXES = [
  'challenges/',
  'events/',
  'groups/',
  'join/',
  'shop/',
];

const EVENT_CAPABILITY_QUERY_PARAMS = [
  'share',
  'invite',
  'shareToken',
  'inviteToken',
] as const;

const normalizeSlashes = (value: string) =>
  value.split('/').filter(Boolean).join('/');

const isAllowedRoutePath = (routePath: string) => {
  if (routePath === TAB_ROUTE) return true;
  if (STATIC_APP_ROUTES.has(routePath)) return true;

  return DYNAMIC_ROUTE_PREFIXES.some(prefix => routePath.startsWith(prefix));
};

const hasGenericEventCapability = (routePath: string, search: string) => {
  if (!routePath.startsWith('events/')) return false;

  const params = new URLSearchParams(search.replace(/^\?/, ''));
  return EVENT_CAPABILITY_QUERY_PARAMS.some(name => params.has(name));
};

const getGenericRouteParts = (
  rawPath: string
): { routePath: string; search: string } | null => {
  try {
    if (rawPath.startsWith('/') || !rawPath.includes('://')) {
      const [pathname = '', search = ''] = rawPath.split(/(?=\?)/, 2);
      return { routePath: normalizeSlashes(pathname), search };
    }

    const parsed = new URL(rawPath);
    const scheme = parsed.protocol.replace(':', '').toLowerCase();
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.replace(/^\/+/, '');

    if (APP_SCHEMES.has(scheme)) {
      return {
        routePath: normalizeSlashes(
          [hostname, pathname].filter(Boolean).join('/')
        ),
        search: parsed.search,
      };
    }

    if (scheme === 'https' && UNIVERSAL_LINK_HOSTS.has(hostname)) {
      return { routePath: normalizeSlashes(pathname), search: parsed.search };
    }
  } catch {
    return null;
  }

  return null;
};

const buildInternalPath = (routePath: string, search: string) => {
  const normalizedRoutePath = normalizeSlashes(routePath);
  // Quick-action/App Intent check-in resolution needs live signed-in state.
  // Cold starts land safely on Today while RootLayout resolves the exact due
  // promise from the original URL.
  if (normalizedRoutePath === 'checkin') return `/${TAB_ROUTE}`;
  if (normalizedRoutePath.startsWith('join/')) {
    const segments = normalizedRoutePath.split('/');
    const explicitKind =
      segments[1] === 'challenge' || segments[1] === 'group'
        ? segments[1]
        : null;
    const code = explicitKind ? segments[2] : segments[1];
    if (!code || !/^[A-Za-z0-9-]{4,40}$/.test(code)) return null;
    const params = new URLSearchParams(search.replace(/^\?/, ''));
    params.set('code', code);
    if (explicitKind) params.set('type', explicitKind);
    return `/join?${params.toString()}`;
  }
  if (!normalizedRoutePath || !isAllowedRoutePath(normalizedRoutePath)) {
    return null;
  }
  if (hasGenericEventCapability(normalizedRoutePath, search)) return null;

  if (normalizedRoutePath === TAB_ROUTE) {
    return `/${TAB_ROUTE}${search}`;
  }

  return `/${normalizedRoutePath}${search}`;
};

export type NativeEventIntentResolution =
  | { status: 'not_event' }
  | { status: 'invalid_event' }
  | { status: 'event'; path: string };

export type NativeEventNavigation =
  | { action: 'not_event' }
  | { action: 'ignore_invalid_event' }
  | { action: 'require_auth'; path: string }
  | { action: 'finish_onboarding'; path: string }
  | { action: 'open_event'; path: string };

type RouterSearchParams = Record<string, string | string[] | undefined>;

const oneSearchParam = (
  params: RouterSearchParams,
  name: string
): string | null => {
  const value = params[name];
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length === 1) return value[0] ?? null;
  return null;
};

export const resolveNativeEventIntentPath = (
  path: unknown
): NativeEventIntentResolution => {
  const resolution = resolveEventLink(path);
  if (resolution.status !== 'event') return resolution;

  return {
    status: 'event',
    path: buildEventRoutePath(resolution.event),
  };
};

/**
 * Produces the exact warm-link navigation decision used by RootLayout. Invalid
 * event links are terminal so an opaque event capability can never fall
 * through and be mistaken for a group invite code.
 */
export const resolveNativeEventNavigation = (input: {
  path: unknown;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
}): NativeEventNavigation => {
  const resolution = resolveNativeEventIntentPath(input.path);
  if (resolution.status === 'not_event') return { action: 'not_event' };
  if (resolution.status === 'invalid_event') {
    return { action: 'ignore_invalid_event' };
  }

  if (!input.isAuthenticated) {
    return { action: 'require_auth', path: resolution.path };
  }

  if (!input.hasCompletedOnboarding) {
    return { action: 'finish_onboarding', path: resolution.path };
  }

  return { action: 'open_event', path: resolution.path };
};

export const dispatchNativeEventNavigation = (
  input: {
    path: unknown;
    isAuthenticated: boolean;
    hasCompletedOnboarding: boolean;
  },
  handlers: {
    requireAuth: (path: string) => void;
    finishOnboarding: (path: string) => void;
    openEvent: (path: string) => void;
  }
): boolean => {
  const navigation = resolveNativeEventNavigation(input);

  if (navigation.action === 'not_event') return false;
  if (navigation.action === 'ignore_invalid_event') return true;

  if (navigation.action === 'require_auth') {
    handlers.requireAuth(navigation.path);
    return true;
  }

  if (navigation.action === 'finish_onboarding') {
    handlers.finishOnboarding(navigation.path);
    return true;
  }

  handlers.openEvent(navigation.path);
  return true;
};

/**
 * Expo Router has already converted a cold universal link by the time the auth
 * gate inspects the active route. Rebuild only the allow-listed capability
 * parameters so the protected-route handoff does not drop them.
 */
export const getProtectedEventPathFromRouterState = (
  pathname: unknown,
  params: RouterSearchParams
): string | null => {
  const normalizedPathname =
    typeof pathname === 'string' ? `/${normalizeSlashes(pathname)}` : '';
  const match = normalizedPathname.match(/^\/events\/([^/]+)$/);
  const eventId = match?.[1];
  if (!isValidEventId(eventId)) return null;

  const hasShareToken = params.shareToken !== undefined;
  const hasInviteToken = params.inviteToken !== undefined;
  const shareToken = oneSearchParam(params, 'shareToken');
  const inviteToken = oneSearchParam(params, 'inviteToken');
  if (hasShareToken && hasInviteToken) return null;
  if (hasShareToken && !isEventCapabilityToken(shareToken)) return null;
  if (hasInviteToken && !isEventCapabilityToken(inviteToken)) return null;

  const capability = shareToken
    ? { kind: 'share' as const, token: shareToken }
    : inviteToken
      ? { kind: 'invite' as const, token: inviteToken }
      : null;

  return buildEventRoutePath({
    eventId,
    capability,
    source: 'https',
  });
};

export const getSafeNativeIntentContext = (path: unknown) => {
  const rawPath = typeof path === 'string' ? path.trim() : '';
  if (!rawPath) return { hasUrl: false };

  if (rawPath.startsWith('/') || !rawPath.includes('://')) {
    return {
      hasUrl: true,
      path: rawPath.split(/[?#]/, 1)[0] || '/',
    };
  }

  try {
    const parsed = new URL(rawPath);
    return {
      hasUrl: true,
      scheme: parsed.protocol.replace(':', '').toLowerCase(),
      hostname: parsed.hostname.toLowerCase(),
      path: parsed.pathname || '/',
    };
  } catch {
    return { hasUrl: true };
  }
};

export const normalizeNativeIntentPath = (path: unknown) => {
  const rawPath = typeof path === 'string' ? path.trim() : '';
  if (!rawPath) return null;

  const eventIntent = resolveNativeEventIntentPath(rawPath);
  if (eventIntent.status === 'event') return eventIntent.path;
  if (eventIntent.status === 'invalid_event') return null;

  try {
    if (rawPath.startsWith('/')) {
      const [pathname = '', search = ''] = rawPath.split(/(?=\?)/, 2);
      return buildInternalPath(pathname, search);
    }

    if (!rawPath.includes('://')) {
      const [pathname = '', search = ''] = rawPath.split(/(?=\?)/, 2);
      return buildInternalPath(pathname, search);
    }

    const parsed = new URL(rawPath);
    const scheme = parsed.protocol.replace(':', '').toLowerCase();
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.replace(/^\/+/, '');

    if (APP_SCHEMES.has(scheme)) {
      const routePath = normalizeSlashes(
        [hostname, pathname].filter(Boolean).join('/')
      );
      return buildInternalPath(routePath, parsed.search);
    }

    if (scheme === 'https' && UNIVERSAL_LINK_HOSTS.has(hostname)) {
      return buildInternalPath(pathname, parsed.search);
    }
  } catch {
    return null;
  }

  return null;
};

/**
 * Distinguishes a rejected event intent from an unrelated URL that Expo Router
 * may still need to handle. Cold-start routing must fail closed for malformed
 * event links and plural event routes that try to bypass the private
 * capability handoff.
 */
export const isRejectedNativeEventIntent = (path: unknown): boolean => {
  const rawPath = typeof path === 'string' ? path.trim() : '';
  if (!rawPath) return false;

  const eventIntent = resolveNativeEventIntentPath(rawPath);
  if (eventIntent.status === 'invalid_event') return true;
  if (eventIntent.status === 'event') return false;

  const genericRoute = getGenericRouteParts(rawPath);
  return genericRoute
    ? hasGenericEventCapability(genericRoute.routePath, genericRoute.search)
    : false;
};
