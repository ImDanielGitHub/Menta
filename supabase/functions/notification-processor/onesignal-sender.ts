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
  ttlSeconds?: number;
  deadline?: { expiresAt: string; timezone: string };
  pendingReviews?: number;
  now?: Date;
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
  'menta_check_counted',
  'menta_check_not_yet',
  'menta_check_stepped_in',
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

/** Never use private inbox titles, promise text or proof text as push copy. */
export const buildSafePushCopy = (input: {
  notificationType: unknown;
  deadline?: { expiresAt: string; timezone: string };
  pendingReviews?: number;
  now?: Date;
}): { title: string; body: string } => {
  if (input.notificationType === 'review_reminder') {
    const count =
      Number.isSafeInteger(input.pendingReviews) &&
      (input.pendingReviews ?? 0) > 0 &&
      (input.pendingReviews ?? 0) <= 10_000
        ? input.pendingReviews!
        : 1;
    return {
      title:
        count === 1
          ? 'A proof needs your review'
          : `${count} proofs need your review`,
      body: 'Open your review queue to make a decision.',
    };
  }
  if (
    input.notificationType === 'streak_reminder' ||
    input.notificationType === 'challenge_expiring'
  ) {
    const expiresAt = Date.parse(input.deadline?.expiresAt ?? '');
    if (input.deadline && Number.isFinite(expiresAt)) {
      const label = new Intl.DateTimeFormat('en-NZ', {
        timeZone: input.deadline.timezone,
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      }).format(new Date(expiresAt));
      const isSoon =
        expiresAt - (input.now ?? new Date()).getTime() <= 3_600_000;
      return {
        title:
          input.notificationType === 'challenge_expiring'
            ? 'Your promise is ending soon'
            : isSoon
              ? 'Proof closes soon'
              : 'Time for your proof',
        body:
          input.notificationType === 'challenge_expiring'
            ? `Your promise ends at ${label}. Open Menta to see its status.`
            : `Add your proof before ${label}.`,
      };
    }
    return {
      title: 'Time for your proof',
      body: 'Open Menta to check your current proof window.',
    };
  }
  switch (input.notificationType) {
    case 'verification_approved':
      return {
        title: 'Proof approved',
        body: 'Your review result is ready in Menta.',
      };
    case 'verification_rejected':
      return {
        title: 'Your proof needs a correction',
        body: 'Open Menta to see the review and your next step.',
      };
    case 'verification_pending':
      return {
        title: 'Your proof is awaiting review',
        body: 'Your submission is recorded. Check its status in Menta.',
      };
    case 'streak_recovery':
      return {
        title: 'Your streak was protected',
        body: 'Open Menta to see your check-in result.',
      };
    case 'missed_streak':
      return {
        title: 'Your check-in window closed',
        body: 'Your result and next step are ready in Menta.',
      };
    case 'challenge_expired':
    case 'challenge_complete':
      return {
        title: 'Your promise has finished',
        body: 'Open Menta to see the result and choose your next step.',
      };
    case 'streak_achievement':
    case 'badge_unlocked':
    case 'momenta_reward':
      return {
        title: 'You reached a milestone',
        body: 'Your progress update is ready in Menta.',
      };
    case 'group_activity':
    case 'group_milestone':
    case 'group_streak_warning':
      return {
        title: 'Your group has an update',
        body: 'Open Menta to see what changed.',
      };
    case 'test_notification':
      return {
        title: 'Menta notification test',
        body: 'Open notification settings to finish checking delivery.',
      };
    case 'menta_check_counted':
      return {
        title: 'That counts!',
        body: 'Menta checked your proof. Open Menta to see it.',
      };
    case 'menta_check_not_yet':
      return {
        title: 'Not quite yet',
        body: 'Menta needs another photo. Open Menta to send one.',
      };
    case 'menta_check_stepped_in':
      return {
        title: 'Menta checked your proof',
        body: 'Your group was busy, so Menta had a look. It counts.',
      };
    default:
      return { title: 'Menta update', body: 'Open Menta to see the update.' };
  }
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

  const ttlSeconds = input.ttlSeconds ?? 3600;
  if (
    !Number.isInteger(ttlSeconds) ||
    ttlSeconds < 0 ||
    ttlSeconds > 2_419_200
  ) {
    throw new Error('OneSignal TTL must be a bounded number of seconds.');
  }
  const data = buildOneSignalDataPayload({
    action: input.data.action,
    notificationId: input.data.notificationId as number,
    notificationType: input.data.type,
  });
  const copy = buildSafePushCopy({
    notificationType: data.type,
    deadline: input.deadline,
    pendingReviews: input.pendingReviews,
    now: input.now,
  });
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
      headings: { en: copy.title },
      contents: { en: copy.body },
      data,
      ttl: ttlSeconds,
      idempotency_key: input.idempotencyKey.trim(),
    },
  };
};

export const parseOneSignalSendResponse = (
  payload: unknown
):
  | { kind: 'accepted'; providerMessageId: string }
  | { kind: 'no-valid-subscription' } => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('OneSignal response was not an object.');
  }
  const record = payload as { id?: unknown; errors?: unknown };
  if (typeof record.id === 'string' && record.id.trim()) {
    return { kind: 'accepted', providerMessageId: record.id.trim() };
  }

  // An explicit empty id is the documented no-recipient response. Preserve
  // the older, exact unsubscribed error too, but never infer this from {} or
  // an unrelated error. Ambiguous acceptance stays on the idempotent retry path.
  const errors = record.errors;
  const noErrors =
    errors === undefined ||
    errors === null ||
    (Array.isArray(errors) && errors.length === 0) ||
    (typeof errors === 'object' &&
      !Array.isArray(errors) &&
      errors !== null &&
      Object.keys(errors).length === 0);
  const onlyUnsubscribed =
    Array.isArray(errors) &&
    errors.length > 0 &&
    errors.every(
      error =>
        typeof error === 'string' &&
        /^All included (players|subscriptions|users) are not subscribed[.!]?$/i.test(
          error.trim()
        )
    );
  if (
    (record.id === '' && (noErrors || onlyUnsubscribed)) ||
    ((record.id === undefined || record.id === null) && onlyUnsubscribed)
  ) {
    return { kind: 'no-valid-subscription' };
  }
  throw new Error(
    'OneSignal response did not confirm acceptance or an empty audience.'
  );
};
