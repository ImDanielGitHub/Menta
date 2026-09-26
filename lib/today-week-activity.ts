import { addCivilDays } from '@/lib/loop/day-context';
import type { ObligationProofStatus } from '@/lib/loop';
import { supabase } from '@/lib/supabase';

/**
 * One day in the Today week row. Every mark is read from a server record for
 * that local day; an empty day never implies a miss because the person may not
 * have had a promise running.
 */
export type TodayWeekDayStatus =
  'approved' | 'pending' | 'correction' | 'protected' | 'open';

export type TodayWeekDay = {
  localDay: string;
  weekdayLabel: string;
  isToday: boolean;
  status: TodayWeekDayStatus;
};

export type TodayWeekSubmissionRow = {
  localDay: string;
  status: string;
};

export type TodayWeekOutcomeRow = {
  localDay: string;
  outcome: string;
};

export const TODAY_WEEK_LENGTH = 7;

const STATUS_RANK: Record<TodayWeekDayStatus, number> = {
  open: 0,
  correction: 1,
  protected: 2,
  pending: 3,
  approved: 4,
};

const fromSubmissionStatus = (status: string): TodayWeekDayStatus | null => {
  if (status === 'approved') return 'approved';
  if (status === 'pending') return 'pending';
  if (status === 'rejected') return 'correction';
  return null;
};

/**
 * Today is settled by the live obligations rather than by any single record:
 * one approved promise does not mark the day done while another is still due.
 */
const resolveTodayStatus = (
  statuses: readonly ObligationProofStatus[]
): TodayWeekDayStatus => {
  if (statuses.some(status => status === 'rejected')) return 'correction';
  if (statuses.some(status => status === 'none')) return 'open';
  if (statuses.some(status => status === 'pending')) return 'pending';
  return 'approved';
};

const formatWeekdayLabel = (localDay: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, {
    weekday: 'narrow',
    timeZone: 'UTC',
  }).format(new Date(`${localDay}T12:00:00Z`));

/** The first local day in the rolling window that ends on `localDay`. */
export const getTodayWeekStart = (localDay: string): string =>
  addCivilDays(localDay, -(TODAY_WEEK_LENGTH - 1));

/**
 * Builds the rolling seven-day row that ends today. For earlier days the
 * strongest server record wins: approved proof, then proof waiting for review,
 * then a streak protected by a freeze, then a requested correction. When the
 * live Today obligations are known, they alone settle today's mark.
 */
export const buildTodayWeek = (args: {
  localDay: string;
  locale: string;
  submissions: readonly TodayWeekSubmissionRow[];
  outcomes?: readonly TodayWeekOutcomeRow[];
  todayStatuses?: readonly ObligationProofStatus[];
}): TodayWeekDay[] => {
  const start = getTodayWeekStart(args.localDay);
  const days = Array.from({ length: TODAY_WEEK_LENGTH }, (_, index) =>
    addCivilDays(start, index)
  );
  const statusByDay = new Map<string, TodayWeekDayStatus>();
  const record = (localDay: string, status: TodayWeekDayStatus | null) => {
    if (!status || localDay < start || localDay > args.localDay) return;
    const current = statusByDay.get(localDay) ?? 'open';
    if (STATUS_RANK[status] > STATUS_RANK[current]) {
      statusByDay.set(localDay, status);
    }
  };

  for (const row of args.submissions) {
    record(row.localDay, fromSubmissionStatus(row.status));
  }
  for (const row of args.outcomes ?? []) {
    if (row.outcome === 'protected') record(row.localDay, 'protected');
  }
  if (args.todayStatuses && args.todayStatuses.length > 0) {
    statusByDay.set(args.localDay, resolveTodayStatus(args.todayStatuses));
  }

  return days.map(localDay => ({
    localDay,
    weekdayLabel: formatWeekdayLabel(localDay, args.locale),
    isToday: localDay === args.localDay,
    status: statusByDay.get(localDay) ?? 'open',
  }));
};

export const countApprovedWeekDays = (days: readonly TodayWeekDay[]): number =>
  days.filter(day => day.status === 'approved').length;

type UntypedQuery = PromiseLike<{ data: unknown; error: unknown }> & {
  select: (columns: string) => UntypedQuery;
  eq: (column: string, value: string) => UntypedQuery;
  gte: (column: string, value: string) => UntypedQuery;
  lte: (column: string, value: string) => UntypedQuery;
  limit: (count: number) => UntypedQuery;
};

const rows = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          typeof item === 'object' && item !== null && !Array.isArray(item)
      )
    : [];

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value : null;

/**
 * Reads the signed-in person's own proof and streak-outcome records for the
 * rolling week. Both tables are already readable by their owner; this adds no
 * new authority. Outcome history is optional and never blocks the row.
 */
export const readTodayWeekActivity = async (args: {
  userId: string;
  localDay: string;
}): Promise<{
  submissions: TodayWeekSubmissionRow[];
  outcomes: TodayWeekOutcomeRow[];
}> => {
  const start = getTodayWeekStart(args.localDay);
  const from = supabase.from.bind(supabase) as unknown as (
    table: string
  ) => UntypedQuery;

  const [submissionRead, outcomeRead] = await Promise.all([
    from('challenge_submissions')
      .select('local_day,status')
      .eq('user_id', args.userId)
      .gte('local_day', start)
      .lte('local_day', args.localDay)
      .limit(200),
    Promise.resolve(
      from('streak_day_outcomes')
        .select('local_day,outcome')
        .eq('user_id', args.userId)
        .gte('local_day', start)
        .lte('local_day', args.localDay)
        .limit(100)
    ).catch(() => ({ data: [], error: null })),
  ]);

  if (submissionRead.error) throw submissionRead.error;

  return {
    submissions: rows(submissionRead.data).flatMap(row => {
      const localDay = text(row.local_day);
      const status = text(row.status);
      return localDay && status ? [{ localDay, status }] : [];
    }),
    outcomes: outcomeRead.error
      ? []
      : rows(outcomeRead.data).flatMap(row => {
          const localDay = text(row.local_day);
          const outcome = text(row.outcome);
          return localDay && outcome ? [{ localDay, outcome }] : [];
        }),
  };
};
