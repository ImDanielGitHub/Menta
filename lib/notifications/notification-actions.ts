import Constants from 'expo-constants';

import { buildReviewQueueDeepLink } from '@/lib/navigation/review-queue-params';

export const NOTIFICATION_ACTION_NAMES = [
  'open_challenge',
  'open_event',
  'open_group',
  'open_notification_settings',
  'open_profile_badges',
  'open_review_queue',
  'open_today',
] as const;

export type NotificationActionName = (typeof NOTIFICATION_ACTION_NAMES)[number];

export type NotificationActionData = Readonly<{
  action?: unknown;
  challengeId?: unknown;
  deepLink?: unknown;
  eventId?: unknown;
  groupId?: unknown;
  submissionId?: unknown;
}>;

const SAFE_IDENTIFIER = /^[A-Za-z0-9_-]{1,128}$/;
const SAFE_SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*$/;
const REVIEW_QUEUE_KEYS = new Set(['challengeId', 'groupId', 'submissionId']);

const getSafeIdentifier = (value: unknown): string | undefined => {
  const candidate = typeof value === 'string' ? value.trim() : '';
  return SAFE_IDENTIFIER.test(candidate) ? candidate : undefined;
};

const resolveTypedActionPath = (
  action: string,
  data: NotificationActionData
): string | null => {
  switch (action) {
    case 'open_challenge': {
      const challengeId = getSafeIdentifier(data.challengeId);
      return challengeId
        ? `challenges/${encodeURIComponent(challengeId)}`
        : null;
    }
    case 'open_group': {
      const groupId = getSafeIdentifier(data.groupId);
      return groupId ? `groups/${encodeURIComponent(groupId)}` : null;
    }
    case 'open_event': {
      const eventId = getSafeIdentifier(data.eventId);
      return eventId ? `events/${encodeURIComponent(eventId)}` : null;
    }
    case 'open_profile_badges':
      return 'profile';
    case 'open_notification_settings':
      return 'notification-settings';
    case 'open_review_queue':
      return buildReviewQueueDeepLink({
        challengeId: getSafeIdentifier(data.challengeId),
        groupId: getSafeIdentifier(data.groupId),
        submissionId: getSafeIdentifier(data.submissionId),
        entryPoint: 'notification',
      });
    case 'open_today':
      return '';
    default:
      return null;
  }
};

const parseLegacyReviewQueue = (
  query: string,
  data: NotificationActionData
): string | null => {
  const params = new URLSearchParams(query);
  for (const key of params.keys()) {
    if (!REVIEW_QUEUE_KEYS.has(key)) return null;
  }

  const challengeId =
    getSafeIdentifier(params.get('challengeId')) ??
    getSafeIdentifier(data.challengeId);
  const groupId =
    getSafeIdentifier(params.get('groupId')) ?? getSafeIdentifier(data.groupId);
  const submissionId =
    getSafeIdentifier(params.get('submissionId')) ??
    getSafeIdentifier(data.submissionId);

  return buildReviewQueueDeepLink({
    challengeId,
    groupId,
    submissionId,
    entryPoint: 'notification',
  });
};

/**
 * Support notification rows queued by older app versions without accepting an
 * arbitrary URL. Remove this parser after all retained notifications use the
 * typed `action` payload.
 */
const resolveLegacyDeepLinkPath = (
  data: NotificationActionData
): string | null => {
  const deepLink =
    typeof data.deepLink === 'string' ? data.deepLink.trim() : '';
  if (!deepLink) return null;

  const [path, query = ''] = deepLink.split('?', 2);

  if (path === 'review-queue') {
    return parseLegacyReviewQueue(query, data);
  }

  if (path === 'profile/badges') return 'profile';

  const routeMatch = /^(challenges|groups|verification)\/([^/]+)$/.exec(path);
  if (!routeMatch) return null;

  const identifier = getSafeIdentifier(routeMatch[2]);
  if (!identifier) return null;

  if (routeMatch[1] === 'groups') {
    return `groups/${encodeURIComponent(identifier)}`;
  }

  // The proof screen needs more state than the retired verification/<id>
  // payload provided. Promise detail is the safe recovery route.
  return `challenges/${encodeURIComponent(identifier)}`;
};

export const resolveNotificationActionPath = (
  value: unknown
): string | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const data = value as NotificationActionData;
  const action = typeof data.action === 'string' ? data.action.trim() : '';

  // An explicit but unknown action is rejected. It must not fall through to a
  // legacy deep link supplied in the same payload.
  if (action) return resolveTypedActionPath(action, data);

  return resolveLegacyDeepLinkPath(data);
};

const getAppScheme = (): string => {
  const configured = Constants.expoConfig?.scheme;
  const first = Array.isArray(configured) ? configured[0] : configured;
  return typeof first === 'string' && SAFE_SCHEME.test(first) ? first : 'menta';
};

export const resolveNotificationActionUrl = (value: unknown): string | null => {
  const path = resolveNotificationActionPath(value);
  if (path === null) return null;
  return `${getAppScheme()}://${path}`;
};

export const notificationAction = {
  challenge: (challengeId: string) =>
    ({ action: 'open_challenge', challengeId }) as const,
  event: (eventId: string) => ({ action: 'open_event', eventId }) as const,
  group: (groupId: string) => ({ action: 'open_group', groupId }) as const,
  notificationSettings: () =>
    ({ action: 'open_notification_settings' }) as const,
  profileBadges: () => ({ action: 'open_profile_badges' }) as const,
  reviewQueue: (params: {
    challengeId?: string;
    groupId?: string;
    submissionId?: string;
  }) => ({ action: 'open_review_queue', ...params }) as const,
  today: () => ({ action: 'open_today' }) as const,
};
