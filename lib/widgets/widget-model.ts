import type { TranslationKey } from '@/lib/localization/en-NZ';
import { translate } from '@/lib/localization/translate';
import { zonedLocalToUtc } from '@/lib/time/proof-due';

export type WidgetState =
  | 'due'
  | 'risk'
  | 'waiting'
  | 'accepted'
  | 'protected'
  | 'correction'
  | 'missed'
  | 'empty'
  | 'signed-out'
  | 'stale'
  | 'choose';

export type WidgetStatusTone = 'action' | 'warning' | 'success' | 'muted';

export type WidgetPromise = {
  id: string;
  title: string;
  streak: number;
  localDay: string;
  timezone: string;
  deadline: number;
  proofStatus: 'none' | 'pending' | 'approved' | 'rejected';
  atRisk: boolean;
  outcome: 'missed' | 'protected' | null;
  groupId: string | null;
  proofType: 'photo' | 'video' | 'text';
  isSolo: boolean;
};

export type WidgetHistoryDay = {
  label: string;
  mark: string;
  description: string;
};

/** Presentation and the account receipt stay inside the extension's private container. */
export type StreakWidgetSnapshot = {
  /** Used only to validate cached ownership, never rendered by the widget. */
  ownerId?: string;
  state: WidgetState;
  title: string;
  streak: string;
  streakLabel: string;
  heading: string;
  detail: string;
  action: string;
  context: string;
  accessibilityText: string;
  inlineText: string;
  url: string;
  expiresAt: number;
  history: WidgetHistoryDay[];
  mascotUri?: string;
  /** Paper 19 / W02: one short coloured line, e.g. "6h left" or "Done today". */
  status?: string;
  statusTone?: WidgetStatusTone;
};

export const isWidgetPromiseId = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export const readWidgetPromise = (
  row: Record<string, unknown>
): WidgetPromise | null => {
  if (
    !isWidgetPromiseId(row.challenge_id) ||
    typeof row.challenge_title !== 'string' ||
    !row.challenge_title.trim() ||
    typeof row.current_streak !== 'number' ||
    !Number.isSafeInteger(row.current_streak) ||
    row.current_streak < 0 ||
    typeof row.local_day !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(row.local_day) ||
    typeof row.effective_timezone !== 'string'
  )
    return null;
  try {
    new Intl.DateTimeFormat('en-NZ', {
      timeZone: row.effective_timezone,
    }).format();
  } catch {
    return null;
  }
  const day = new Date(`${row.local_day}T12:00:00Z`);
  if (
    !Number.isFinite(day.getTime()) ||
    day.toISOString().slice(0, 10) !== row.local_day
  )
    return null;
  day.setUTCDate(day.getUTCDate() + 1);
  const midnight = zonedLocalToUtc(
    day.toISOString().slice(0, 10),
    '00:00:00',
    row.effective_timezone
  ).getTime();
  const extension =
    typeof row.extension_proof_due_at === 'string'
      ? Date.parse(row.extension_proof_due_at)
      : NaN;
  const status = row.proof_status;
  if (
    status != null &&
    !['none', 'pending', 'approved', 'rejected'].includes(String(status))
  )
    return null;
  return {
    id: row.challenge_id,
    title: row.challenge_title.trim(),
    streak: row.current_streak,
    localDay: row.local_day,
    timezone: row.effective_timezone,
    deadline: Number.isFinite(extension)
      ? Math.max(midnight, extension)
      : midnight,
    proofStatus:
      status === 'pending' || status === 'approved' || status === 'rejected'
        ? status
        : 'none',
    atRisk: row.at_risk === true,
    groupId: isWidgetPromiseId(row.group_id) ? row.group_id : null,
    proofType:
      row.verification_type === 'video' || row.verification_type === 'text'
        ? row.verification_type
        : 'photo',
    isSolo: row.is_solo === true,
    outcome:
      row.streak_outcome === 'protected' && row.freeze_used === true
        ? 'protected'
        : row.streak_outcome === 'missed' && row.current_streak === 0
          ? 'missed'
          : null,
  };
};

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

export const makeWidgetFallback = (
  state: 'empty' | 'signed-out' | 'stale' | 'choose',
  locale: string
): StreakWidgetSnapshot => {
  const t = (key: TranslationKey) => translate(locale, key);
  const heading = t(`widgets.state.${state}.heading`);
  const detail = t(`widgets.state.${state}.detail`);
  const action = t(`widgets.state.${state}.action`);
  return {
    state,
    title: 'Menta',
    streak: '',
    streakLabel: t('widgets.dayStreak'),
    heading,
    detail,
    action,
    context: '',
    accessibilityText: `${heading} ${detail} ${action}`,
    inlineText: heading,
    url: state === 'stale' ? 'menta://widget-open' : 'menta://home-widget',
    expiresAt: 0,
    history: [],
  };
};

export const makeStreakWidgetSnapshot = ({
  promise,
  showText,
  locale,
  now = Date.now(),
  history = [],
}: {
  promise: WidgetPromise;
  showText: boolean;
  locale: string;
  now?: number;
  history?: WidgetHistoryDay[];
}): StreakWidgetSnapshot => {
  if (promise.deadline <= now) return makeWidgetFallback('stale', locale);
  const state: WidgetState =
    promise.proofStatus === 'approved'
      ? 'accepted'
      : promise.proofStatus === 'pending'
        ? 'waiting'
        : promise.proofStatus === 'rejected'
          ? 'correction'
          : promise.outcome === 'protected'
            ? 'protected'
            : promise.outcome === 'missed'
              ? 'missed'
              : promise.streak > 0 &&
                  (promise.atRisk ||
                    promise.deadline - now <= 3 * 60 * 60 * 1000)
                ? 'risk'
                : 'due';
  const deadline = new Intl.DateTimeFormat(locale, {
    timeZone: promise.timezone,
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(promise.deadline);
  const title = showText
    ? promise.title
    : translate(locale, 'widgets.privatePromise');
  const heading = translate(locale, `widgets.state.${state}.heading`);
  const detail = translate(locale, `widgets.state.${state}.detail`, {
    deadline,
  });
  const action = translate(locale, `widgets.state.${state}.action`);
  const streakLabel = translate(locale, 'widgets.dayStreak');
  const streak = new Intl.NumberFormat(locale, { useGrouping: false }).format(
    promise.streak
  );
  const context =
    state === 'risk'
      ? translate(locale, 'widgets.beforeDeadline', { deadline })
      : translate(locale, 'widgets.today');
  const remainingMs = promise.deadline - now;
  const timeLeft =
    remainingMs >= HOUR_MS
      ? translate(locale, 'widgets.timeLeft.hours', {
          hours: Math.floor(remainingMs / HOUR_MS),
        })
      : translate(locale, 'widgets.timeLeft.minutes', {
          minutes: Math.max(1, Math.floor(remainingMs / MINUTE_MS)),
        });
  const [status, statusTone]: [string, WidgetStatusTone] =
    state === 'due'
      ? [timeLeft, remainingMs < HOUR_MS ? 'warning' : 'action']
      : state === 'risk'
        ? [timeLeft, 'warning']
        : state === 'accepted'
          ? [translate(locale, 'widgets.status.accepted'), 'success']
          : state === 'waiting'
            ? [translate(locale, 'widgets.status.waiting'), 'muted']
            : state === 'missed'
              ? [translate(locale, 'widgets.status.missed'), 'action']
              : state === 'protected'
                ? [translate(locale, 'widgets.status.protected'), 'action']
                : [translate(locale, 'widgets.status.correction'), 'warning'];
  return {
    state,
    title,
    streak,
    streakLabel,
    heading,
    detail,
    action,
    context,
    status,
    statusTone,
    accessibilityText: `${title}. ${streak} ${streakLabel}. ${heading} ${detail} ${action}`,
    inlineText: `${streak} ${streakLabel} · ${action}`,
    url: `menta://widget-open?promise=${encodeURIComponent(promise.id)}`,
    expiresAt: Math.min(promise.deadline, now + 4 * 60 * 60 * 1000),
    history,
  };
};

/**
 * Future timeline entries so the widget's "time left" line keeps counting
 * without the app open: every hour, then every ten minutes in the last hour.
 * Entries stop at the snapshot's expiry, where the stale fallback takes over.
 */
export const makeStreakWidgetCountdownEntries = (args: {
  promise: WidgetPromise;
  showText: boolean;
  locale: string;
  history?: WidgetHistoryDay[];
  now?: number;
}): { date: Date; props: StreakWidgetSnapshot }[] => {
  const now = args.now ?? Date.now();
  const first = makeStreakWidgetSnapshot({ ...args, now });
  if (first.state !== 'due' && first.state !== 'risk') return [];
  const deadline = args.promise.deadline;
  const points = new Set<number>();
  for (let hours = 1; deadline - hours * HOUR_MS > now; hours += 1) {
    points.add(deadline - hours * HOUR_MS);
  }
  for (let tens = 1; tens < 6; tens += 1) {
    points.add(deadline - tens * 10 * MINUTE_MS);
  }
  const entries = [...points]
    .filter(at => at > now && at < first.expiresAt)
    .sort((a, b) => a - b)
    .map(at => ({
      date: new Date(at),
      props: makeStreakWidgetSnapshot({ ...args, now: at }),
    }));
  return entries;
};
