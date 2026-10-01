import type {
  PromiseProofDay,
  PromiseProofDayState,
} from '@/components/challenge/promise-runtime-states';
import type { SoloTodayStatus } from '@/lib/solo-submission-status';

const LOCAL_DAY = /^(\d{4})-(\d{2})-(\d{2})/;
const DAY_MS = 24 * 60 * 60 * 1000;

const localDayNumber = (value: string | null | undefined): number | null => {
  const match = LOCAL_DAY.exec(value ?? '');
  if (!match) return null;
  const day = Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );
  return Number.isNaN(day) ? null : day;
};

/** Monday-first position of a `YYYY-MM-DD` day in its calendar week. */
export const mondayFirstDayIndex = (localDay: string): number => {
  const day = localDayNumber(localDay);
  if (day === null) return 6;
  const weekday = new Date(day).getUTCDay();
  return weekday === 0 ? 6 : weekday - 1;
};

/**
 * Which day of the promise today is, counted from its first local day. Before
 * the start it reads day 1; after the term it holds at the final day.
 */
export const resolvePromiseDay = ({
  startLocalDay,
  todayLocalDay,
  duration,
}: {
  startLocalDay: string | null | undefined;
  todayLocalDay: string;
  duration: number;
}): number => {
  const start = localDayNumber(startLocalDay);
  const today = localDayNumber(todayLocalDay);
  if (start === null || today === null) return 1;
  const elapsed = Math.round((today - start) / DAY_MS) + 1;
  return Math.min(Math.max(elapsed, 1), Math.max(duration, 1));
};

const todayStatusState: Record<SoloTodayStatus, PromiseProofDayState | null> = {
  none: null,
  pending: 'waiting',
  approved: 'approved',
  rejected: 'needs-retry',
};

/**
 * The server's answer for today wins over the fetched rows, which are capped
 * and can miss a proof sent a moment ago.
 */
export const applyTodayStatus = (
  week: readonly PromiseProofDay[],
  todayIndex: number,
  status: SoloTodayStatus
): PromiseProofDay[] => {
  const state = todayStatusState[status];
  return week.map((day, index) =>
    index === todayIndex && state ? { ...day, state } : day
  );
};

const judgedStates: ReadonlySet<PromiseProofDayState> = new Set([
  'approved',
  'waiting',
  'needs-retry',
  'missed',
  'past',
]);

/**
 * Days kept against days that could have been kept. Today only joins the
 * total once it counts, so an open day never reads as a miss. Frozen days
 * sit outside both numbers.
 */
export const countKeptDays = (
  week: readonly PromiseProofDay[],
  todayIndex: number
): { kept: number; total: number } =>
  week.reduce(
    (tally, day, index) => {
      if (!judgedStates.has(day.state)) return tally;
      if (index === todayIndex && day.state !== 'approved') return tally;
      return {
        kept: tally.kept + (day.state === 'approved' ? 1 : 0),
        total: tally.total + 1,
      };
    },
    { kept: 0, total: 0 }
  );
