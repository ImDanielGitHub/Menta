const ONESIGNAL_APP_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isValidOneSignalAppId = (value: unknown): value is string =>
  typeof value === 'string' && ONESIGNAL_APP_ID.test(value.trim());

export type OneSignalSendInput = {
  appId: string;
  restApiKey: string;
  externalUserId: string;
  idempotencyKey: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
};

export type OneSignalRequest = {
  url: string;
  authorization: string;
  body: Record<string, unknown>;
};

const SAFE_NOTIFICATION_TYPES = new Set([
  'app_update',
  'badge_unlocked',
  'challenge_complete',
  'challenge_expired',
  'challenge_expiring',
  'challenge_start',
  'daily_inspiration',
  'group_activity',
  'group_milestone',
  'group_streak_warning',
  'low_activity',
  'maintenance',
  'missed_streak',
  'momenta_reward',
  'review_reminder',
  'streak_achievement',
  'streak_recovery',
  'streak_reminder',
  'test_notification',
  'verification_approved',
  'verification_pending',
  'verification_rejected',
]);

const SAFE_ID_FREE_ACTIONS = new Set([
  'open_profile_badges',
  'open_notification_settings',
  'open_review_queue',
  'open_today',
]);

/** Keep private promise/group content and route identifiers out of OneSignal. */
export const buildOneSignalDataPayload = (input: {
  action: unknown;
  notificationId: number;
  notificationType: unknown;
}): Record<string, unknown> => {
  if (
    !Number.isSafeInteger(input.notificationId) ||
    input.notificationId <= 0
  ) {
    throw new Error('Notification id must be a positive safe integer.');
  }
  if (
    typeof input.notificationType !== 'string' ||
    !SAFE_NOTIFICATION_TYPES.has(input.notificationType)
  ) {
    throw new Error('OneSignal notification type is not allowlisted.');
  }
  const notificationType = input.notificationType;
  const requestedAction =
    typeof input.action === 'string' ? input.action.trim() : '';
  const action = SAFE_ID_FREE_ACTIONS.has(requestedAction)
    ? requestedAction
    : 'open_today';
  return {
    action,
    notificationId: input.notificationId,
    type: notificationType,
  };
};

export const buildOneSignalAuthorization = (restApiKey: string): string => {
  const key = restApiKey.trim();
  if (!key) {
    throw new Error('ONESIGNAL_REST_API_KEY is empty.');
  }
  if (key.startsWith('Key ')) return key;
  if (key.startsWith('os_v2_')) return `Key ${key}`;
  return `Basic ${key}`;
};

const IDEMPOTENCY_NAMESPACE = '8f142c82-2e08-4d63-a766-4f6c92a5b152';

const uuidBytes = (value: string): Uint8Array => {
  const compact = value.replace(/-/g, '');
  if (!/^[0-9a-f]{32}$/i.test(compact)) {
    throw new Error('UUID namespace is invalid.');
  }
  return Uint8Array.from(
    compact.match(/.{2}/g)!.map(pair => Number.parseInt(pair, 16))
  );
};

const formatUuid = (bytes: Uint8Array): string => {
  const hex = Array.from(bytes, byte =>
    byte.toString(16).padStart(2, '0')
  ).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
};

/**
 * Stable RFC 9562 UUID v5 for one logical notification. Retries reuse this
 * value so a timeout after OneSignal acceptance cannot create a second push.
 */
export const createOneSignalIdempotencyKey = async (
  notificationId: number
): Promise<string> => {
  if (!Number.isSafeInteger(notificationId) || notificationId <= 0) {
    throw new Error('Notification id must be a positive safe integer.');
  }

  const namespace = uuidBytes(IDEMPOTENCY_NAMESPACE);
  const name = new TextEncoder().encode(`menta-notification:${notificationId}`);
  const input = new Uint8Array(namespace.length + name.length);
  input.set(namespace);
  input.set(name, namespace.length);
  const digest = new Uint8Array(
    await globalThis.crypto.subtle.digest('SHA-1', input)
  );
  const uuid = digest.slice(0, 16);
  uuid[6] = (uuid[6] & 0x0f) | 0x50;
  uuid[8] = (uuid[8] & 0x3f) | 0x80;
  return formatUuid(uuid);
};

export const buildOneSignalRequest = (
  input: OneSignalSendInput
): OneSignalRequest => {
  const appId = input.appId.trim();
  const externalUserId = input.externalUserId.trim();
  if (!isValidOneSignalAppId(appId)) {
    throw new Error('ONESIGNAL_APP_ID is not a valid App ID.');
  }
  if (!externalUserId) {
    throw new Error('OneSignal external user id is required.');
  }
  if (!ONESIGNAL_APP_ID.test(input.idempotencyKey.trim())) {
    throw new Error('OneSignal idempotency key must be an RFC UUID.');
  }

  return {
    url: 'https://api.onesignal.com/notifications',
    authorization: buildOneSignalAuthorization(input.restApiKey),
    body: {
      app_id: appId,
      target_channel: 'push',
      isIos: true,
      isAndroid: false,
      isAnyWeb: false,
      include_aliases: {
        external_id: [externalUserId],
      },
      headings: { en: input.title },
      contents: { en: input.body },
      data: input.data,
      idempotency_key: input.idempotencyKey.trim(),
    },
  };
};

export const parseOneSignalSendResponse = (
  payload: unknown
):
  | { kind: 'accepted'; providerMessageId: string }
  | { kind: 'no-valid-subscription' } => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('OneSignal response was not an object.');
  }

  const record = payload as {
    id?: unknown;
  };

  if (typeof record.id === 'string' && record.id.trim()) {
    return { kind: 'accepted', providerMessageId: record.id.trim() };
  }

  // OneSignal returns HTTP 200 for a valid request even when no subscribed
  // recipient matched. In that case the response has no message id and may
  // include errors such as "All included players are not subscribed". That is
  // a definitive no-recipient result, so the delivery router can safely use
  // the registered Expo-token compatibility path exactly once.
  return { kind: 'no-valid-subscription' };
};
