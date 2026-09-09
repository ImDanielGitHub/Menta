import type { TranslationKey } from '@/lib/localization/en-NZ';
import type { TranslationValues } from '@/lib/localization/translate';

export type Localise = (
  key: TranslationKey,
  values?: TranslationValues
) => string;

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

const dateOnlyToUtc = (value: string): Date | null => {
  const match = DATE_ONLY.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? date
    : null;
};

export const formatGroupDate = (
  value: string | null | undefined,
  locale: string
): string | null => {
  if (!value) return null;
  const date = dateOnlyToUtc(value) ?? new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    ...(dateOnlyToUtc(value) ? { timeZone: 'UTC' } : {}),
  }).format(date);
};

export const formatGroupDateRange = (
  start: string | null | undefined,
  end: string | null | undefined,
  locale: string,
  localise: Localise
): string => {
  const startLabel = formatGroupDate(start, locale);
  const endLabel = formatGroupDate(end, locale);
  if (!startLabel && !endLabel) return localise('groups.source.date.no_fixed');
  if (startLabel && endLabel) {
    return localise('groups.source.date.range', {
      start: startLabel,
      end: endLabel,
    });
  }
  return startLabel
    ? localise('groups.source.date.starts', { date: startLabel })
    : localise('groups.source.date.ends', { date: endLabel ?? '' });
};

export type ProofHistoryStatus = 'approved' | 'rejected' | 'pending';

export const formatProofHistoryDetail = (
  status: ProofHistoryStatus,
  mediaLabel: string,
  reviewNotes: string | null | undefined,
  localise: Localise
): string => {
  if (status === 'approved') {
    return localise('todayProof.source.history.approved', {
      media: mediaLabel,
    });
  }
  if (status === 'rejected') {
    return (
      reviewNotes?.trim() ||
      localise('todayProof.source.history.needs_another_try', {
        media: mediaLabel,
      })
    );
  }
  return mediaLabel;
};

export const formatProofRelativeTime = (
  value: string,
  now: Date,
  locale: string,
  localise: Localise
): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return localise('todayProof.promise.sent_recently');
  }

  const elapsedMinutes = Math.max(
    0,
    Math.floor((now.getTime() - parsed.getTime()) / 60_000)
  );
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedMinutes < 1) return localise('todayProof.promise.sent_just_now');
  if (elapsedMinutes < 60) {
    return localise('todayProof.source.relative.sent_minutes', {
      count: elapsedMinutes,
    });
  }
  if (elapsedHours < 24) {
    return localise('todayProof.source.relative.sent_hours', {
      count: elapsedHours,
    });
  }
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(
    parsed
  );
  const sentWeekday = locale.toLowerCase().startsWith('en-')
    ? weekday.toLocaleLowerCase(locale)
    : weekday;
  return localise('todayProof.source.relative.sent_weekday', {
    weekday: sentWeekday,
  });
};
