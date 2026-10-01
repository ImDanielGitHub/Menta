export type DeliveryPreference = Readonly<{
  challenge_reminders?: boolean | null;
  device_permission_status?: string | null;
  group_updates?: boolean | null;
  ignore_coach_until?: string | null;
  push_platform?: 'ios' | 'android' | null;
  push_enabled?: boolean | null;
  quiet_hours_end?: string | null;
  quiet_hours_start?: string | null;
  streak_alerts?: boolean | null;
  timezone?: string | null;
}>;

export type DeliveryGuardDecision =
  | Readonly<{ kind: 'allow' }>
  | Readonly<{ kind: 'defer'; until: string }>
  | Readonly<{ kind: 'skip'; reason: string }>;

const CHALLENGE_TYPES = new Set([
  'challenge_expired',
  'challenge_expiring',
  'streak_reminder',
  'low_activity',
  'daily_inspiration',
]);
const GROUP_TYPES = new Set([
  'group_activity',
  'group_milestone',
  'group_streak_warning',
  'review_reminder',
  'verification_approved',
  'verification_pending',
  'verification_rejected',
  'menta_check_counted',
  'menta_check_not_yet',
  'menta_check_stepped_in',
]);
const STREAK_TYPES = new Set([
  'badge_unlocked',
  'missed_streak',
  'momenta_reward',
  'streak_achievement',
  'streak_recovery',
]);

const parseLocalMinutes = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
};

const resolveTimezone = (value: string | null | undefined): string => {
  const candidate = value?.trim() || 'UTC';
  try {
    new Intl.DateTimeFormat('en-NZ', { timeZone: candidate }).format();
    return candidate;
  } catch {
    return 'UTC';
  }
};

export const localMinutesAt = (
  now: Date,
  timezone: string | null | undefined
): number => {
  const parts = new Intl.DateTimeFormat('en-NZ', {
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    timeZone: resolveTimezone(timezone),
  }).formatToParts(now);
  const hour = Number(parts.find(part => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find(part => part.type === 'minute')?.value ?? 0);
  return hour * 60 + minute;
};

const localDateAt = (now: Date, timezone: string | null | undefined): string =>
  new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: resolveTimezone(timezone),
    year: 'numeric',
  }).format(now);

export const isInsideQuietHours = (args: {
  now: Date;
  quietHoursEnd?: string | null;
  quietHoursStart?: string | null;
  timezone?: string | null;
}): boolean => {
  const start = parseLocalMinutes(args.quietHoursStart);
  const end = parseLocalMinutes(args.quietHoursEnd);
  if (start === null || end === null || start === end) return false;

  const current = localMinutesAt(args.now, args.timezone);
  return start < end
    ? current >= start && current < end
    : current >= start || current < end;
};

const nextQuietHoursEnd = (args: {
  now: Date;
  quietHoursEnd?: string | null;
  quietHoursStart?: string | null;
  timezone?: string | null;
}): string => {
  // Advancing real minutes lets Intl handle daylight-saving boundaries. Quiet
  // windows cannot need more than one day to reach their end.
  for (let offset = 1; offset <= 24 * 60 + 1; offset += 1) {
    const candidate = new Date(args.now.getTime() + offset * 60_000);
    if (!isInsideQuietHours({ ...args, now: candidate })) {
      return candidate.toISOString();
    }
  }
  return new Date(args.now.getTime() + 24 * 60 * 60_000).toISOString();
};

export const notificationCategoryEnabled = (
  notificationType: string | null | undefined,
  preference: DeliveryPreference
): boolean => {
  const type = notificationType ?? '';
  if (CHALLENGE_TYPES.has(type)) {
    return preference.challenge_reminders !== false;
  }
  if (GROUP_TYPES.has(type)) return preference.group_updates !== false;
  if (STREAK_TYPES.has(type)) return preference.streak_alerts !== false;
  return true;
};

export const evaluateDeliveryGuard = (args: {
  notificationType?: string | null;
  now: Date;
  preference: DeliveryPreference | null;
  expiresAt?: string | null;
  notBefore?: string | null;
}): DeliveryGuardDecision => {
  const preference = args.preference;
  if (!preference) {
    return {
      kind: 'skip',
      reason: 'SKIPPED_NO_NOTIFICATION_PREFERENCES',
    };
  }
  if (preference.push_enabled === false) {
    return { kind: 'skip', reason: 'SKIPPED_PUSH_DISABLED' };
  }
  if (
    preference.device_permission_status &&
    preference.device_permission_status !== 'granted'
  ) {
    return { kind: 'skip', reason: 'SKIPPED_DEVICE_PERMISSION_OFF' };
  }
  if (!notificationCategoryEnabled(args.notificationType, preference)) {
    return { kind: 'skip', reason: 'SKIPPED_NOTIFICATION_CATEGORY_OFF' };
  }
  const expiresAt = args.expiresAt ? Date.parse(args.expiresAt) : null;
  if (expiresAt !== null && !Number.isFinite(expiresAt)) {
    return { kind: 'skip', reason: 'SKIPPED_INVALID_MESSAGE_EXPIRY' };
  }
  if (expiresAt !== null && expiresAt <= args.now.getTime()) {
    return { kind: 'skip', reason: 'SKIPPED_MESSAGE_EXPIRED' };
  }
  // Re-read snooze at dispatch, including jobs queued before the user paused.
  // Review requests are independent of the person's own coaching preference.
  if (args.notificationType === 'streak_reminder') {
    const snoozedUntil = Date.parse(preference.ignore_coach_until ?? '');
    if (Number.isFinite(snoozedUntil) && snoozedUntil > args.now.getTime()) {
      if (expiresAt !== null && snoozedUntil >= expiresAt) {
        return { kind: 'skip', reason: 'SKIPPED_SNOOZE_WINDOW_EXPIRED' };
      }
      return { kind: 'defer', until: new Date(snoozedUntil).toISOString() };
    }
  }
  const notBefore = args.notBefore ? Date.parse(args.notBefore) : null;
  if (notBefore !== null && !Number.isFinite(notBefore)) {
    return { kind: 'skip', reason: 'SKIPPED_INVALID_MESSAGE_WINDOW' };
  }
  if (notBefore !== null && notBefore > args.now.getTime()) {
    if (expiresAt !== null && notBefore >= expiresAt) {
      return { kind: 'skip', reason: 'SKIPPED_MESSAGE_EXPIRED' };
    }
    return { kind: 'defer', until: new Date(notBefore).toISOString() };
  }
  // A test is an explicit foreground user action, so it must not wait for the
  // account's automatic quiet-hours window.
  if (args.notificationType === 'test_notification') {
    return { kind: 'allow' };
  }
  if (
    isInsideQuietHours({
      now: args.now,
      quietHoursEnd: preference.quiet_hours_end,
      quietHoursStart: preference.quiet_hours_start,
      timezone: preference.timezone,
    })
  ) {
    const until = nextQuietHoursEnd({
      now: args.now,
      quietHoursEnd: preference.quiet_hours_end,
      quietHoursStart: preference.quiet_hours_start,
      timezone: preference.timezone,
    });
    if (
      (expiresAt !== null && Date.parse(until) >= expiresAt) ||
      (expiresAt === null &&
        args.notificationType === 'streak_reminder' &&
        localDateAt(args.now, preference.timezone) !==
          localDateAt(new Date(until), preference.timezone))
    ) {
      return {
        kind: 'skip',
        reason: 'SKIPPED_QUIET_HOURS_WINDOW_EXPIRED',
      };
    }
    return {
      kind: 'defer',
      until,
    };
  }
  return { kind: 'allow' };
};

/**
 * End of the original obligation day, not the preferred reminder hour. Search
 * real instants so DST and fractional offsets do not assume a 24-hour day.
 * A purchased extension can lengthen this window but never shorten it.
 */
export const getProofDeadline = (
  localDay: string,
  timezone: string,
  extension?: string | null
): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDay)) {
    throw new Error('Invalid proof obligation day.');
  }
  const day = new Date(`${localDay}T00:00:00.000Z`);
  if (
    !Number.isFinite(day.getTime()) ||
    day.toISOString().slice(0, 10) !== localDay
  ) {
    throw new Error('Invalid proof obligation day.');
  }
  // Unknown zones must not manufacture a UTC deadline for a local promise.
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const nextDay = new Date(day.getTime() + 86_400_000);
  const target = nextDay.toISOString().slice(0, 10);
  const dateAt = (timestamp: number): string => {
    const parts = formatter.formatToParts(new Date(timestamp));
    const part = (type: string) =>
      parts.find(value => value.type === type)?.value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  };
  let low = nextDay.getTime() - 36 * 3_600_000;
  let high = nextDay.getTime() + 36 * 3_600_000;
  while (high - low > 1000) {
    const middle = Math.floor((low + high) / 2000) * 1000;
    if (dateAt(middle) < target) low = middle;
    else high = middle;
  }
  if (extension) {
    const extended = Date.parse(extension);
    if (!Number.isFinite(extended))
      throw new Error('Invalid proof extension deadline.');
    high = Math.max(high, extended);
  }
  return new Date(high).toISOString();
};

/** Null means the message has expired. Zero requests immediate delivery only. */
export const remainingPushTtl = (
  expiresAt: string | null | undefined,
  now: Date
): number | null => {
  if (!expiresAt) return 3600;
  const expiry = Date.parse(expiresAt);
  if (!Number.isFinite(expiry)) throw new Error('Invalid notification expiry.');
  const remaining = expiry - now.getTime();
  if (remaining <= 0) return null;
  return Math.min(3600, Math.floor(remaining / 1000));
};
