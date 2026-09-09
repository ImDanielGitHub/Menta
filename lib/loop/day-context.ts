import type { LoopDayContext } from '@/lib/loop/types';

const LOCAL_DAY_FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();

const pad2 = (value: number): string =>
  value < 10 ? `0${value}` : String(value);

/**
 * Returns a cached formatter that yields YYYY-MM-DD parts in a timezone.
 */
const getLocalDayFormatter = (timezone: string): Intl.DateTimeFormat => {
  const cached = LOCAL_DAY_FORMATTER_CACHE.get(timezone);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  LOCAL_DAY_FORMATTER_CACHE.set(timezone, formatter);
  return formatter;
};

/**
 * Format an instant as a YYYY-MM-DD local calendar day in `timezone`.
 * Falls back to UTC calendar day when the timezone is invalid.
 */
export const formatLocalDay = (
  instant: Date | string,
  timezone: string
): string => {
  const date = typeof instant === 'string' ? new Date(instant) : instant;
  if (Number.isNaN(date.getTime())) {
    throw new Error('formatLocalDay requires a valid date');
  }

  try {
    const parts = getLocalDayFormatter(timezone).formatToParts(date);
    const year = parts.find(part => part.type === 'year')?.value;
    const month = parts.find(part => part.type === 'month')?.value;
    const day = parts.find(part => part.type === 'day')?.value;
    if (!year || !month || !day) {
      throw new Error('Incomplete date parts');
    }
    return `${year}-${month}-${day}`;
  } catch {
    return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(
      date.getUTCDate()
    )}`;
  }
};

/** Add whole calendar days to a YYYY-MM-DD civil date without applying an offset. */
export const addCivilDays = (localDay: string, days: number): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDay);
  if (!match || !Number.isInteger(days)) {
    throw new Error('addCivilDays requires a civil date and whole days');
  }
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    throw new Error('addCivilDays requires a valid civil date');
  }
  date.setUTCDate(date.getUTCDate() + days);
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(
    date.getUTCDate()
  )}`;
};

/** Build the shared day context used by Today selectors and receipts. */
export const buildLoopDayContext = (
  nowIso: string,
  timezone: string
): LoopDayContext => {
  const now = new Date(nowIso);
  if (Number.isNaN(now.getTime())) {
    throw new Error('buildLoopDayContext requires a valid nowIso');
  }

  return {
    timezone,
    localDay: formatLocalDay(now, timezone),
    nowIso,
  };
};

/** True when `iso` falls on the same local calendar day as `localDay`. */
export const isSameLocalDay = (
  iso: string,
  localDay: string,
  timezone: string
): boolean => formatLocalDay(iso, timezone) === localDay;

/** Count civil days in the promise timezone, including its first day as day one. */
export const getPromiseDayNumber = (
  startDate: string | null,
  localDay: string,
  timezone: string
): number | null => {
  if (!startDate) return null;

  try {
    const startDay = /^\d{4}-\d{2}-\d{2}$/.test(startDate)
      ? startDate
      : formatLocalDay(startDate, timezone);
    const start = Date.parse(`${addCivilDays(startDay, 0)}T12:00:00Z`);
    const today = Date.parse(`${addCivilDays(localDay, 0)}T12:00:00Z`);
    return Math.round((today - start) / (24 * 60 * 60 * 1000)) + 1;
  } catch {
    return null;
  }
};
