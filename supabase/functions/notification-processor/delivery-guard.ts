export type DeliveryPreference = Readonly<{
  challenge_reminders?: boolean | null;
  device_permission_status?: string | null;
  group_updates?: boolean | null;
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
]);
const GROUP_TYPES = new Set([
  'group_activity',
  'group_milestone',
  'group_streak_warning',
  'review_reminder',
  'verification_approved',
  'verification_pending',
  'verification_rejected',
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
      args.notificationType === 'streak_reminder' &&
      localDateAt(args.now, preference.timezone) !==
        localDateAt(new Date(until), preference.timezone)
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
