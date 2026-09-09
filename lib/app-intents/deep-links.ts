import { normalizeReviewQueueParams } from '@/lib/navigation/review-queue-params';

export type AppIntentDeepLinkAction =
  | {
      type: 'checkin';
      challengeId?: string;
    }
  | {
      type: 'reviewQueue';
      challengeId?: string;
      groupId?: string;
      submissionId?: string;
      entryPoint?: string;
    }
  | {
      type: 'join';
      code: string;
      target: 'group' | 'challenge';
    };

type ParsedDeepLink = {
  path?: string | null;
  hostname?: string | null;
  queryParams?: Record<string, unknown> | null;
};

const clean = (value: unknown) => {
  if (Array.isArray(value)) return clean(value[0]);
  const text = typeof value === 'string' ? value.trim() : '';
  return text || undefined;
};

const UNIVERSAL_LINK_HOSTS = new Set([
  'menta.quest',
  'www.menta.quest',
  'lockedinpro.com',
  'www.lockedinpro.com',
]);

const getRoutePath = (parsed: ParsedDeepLink) => {
  const path = clean(parsed.path);
  if (path) return path.replace(/^\/+/, '');

  const hostname = clean(parsed.hostname);
  if (!hostname || UNIVERSAL_LINK_HOSTS.has(hostname.toLowerCase())) return '';

  return hostname.replace(/^\/+/, '');
};

const getPathInviteCode = (path: string) => {
  const parts = path.split('/').filter(Boolean);
  if (parts[0] !== 'join' || !parts[1]) return undefined;
  return parts[1];
};

export const getAppIntentDeepLinkAction = (
  parsed: ParsedDeepLink
): AppIntentDeepLinkAction | null => {
  const routePath = getRoutePath(parsed);
  const queryParams = parsed.queryParams ?? {};

  if (routePath === 'checkin') {
    return {
      type: 'checkin',
      challengeId: clean(queryParams.challengeId),
    };
  }

  if (routePath === 'review-queue') {
    return {
      type: 'reviewQueue',
      ...normalizeReviewQueueParams(queryParams),
    };
  }

  if (routePath === 'join' || routePath.startsWith('join/')) {
    const target =
      clean(queryParams.type)?.toLowerCase() === 'challenge' ||
      Boolean(clean(queryParams.challenge))
        ? 'challenge'
        : 'group';
    const code =
      clean(queryParams.challenge) ||
      clean(queryParams.invite) ||
      clean(queryParams.code) ||
      getPathInviteCode(routePath);

    if (!code) return null;

    return {
      type: 'join',
      code,
      target,
    };
  }

  return null;
};
