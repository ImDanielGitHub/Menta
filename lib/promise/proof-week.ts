import type { PromiseProofDay } from '@/components/challenge/promise-runtime-states';
import type { StreakOutcomeFact } from '@/lib/loop/accountability';

/** A proof row attributed to a calendar day by the server. */
export type ProofWeekRecord = {
  localDay: string | null | undefined;
  status: 'pending' | 'approved' | 'rejected' | string;
};

export type BuildProofWeekOptions = {
  records: readonly ProofWeekRecord[];
  outcomes?: readonly StreakOutcomeFact[];
  /** Server-attributed current local day in YYYY-MM-DD form. */
  todayLocalDay: string;
  /** Earliest day on which this promise was active for this participant. */
  activeFromLocalDay?: string | null;
};

const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;
const LOCAL_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

const parseLocalDay = (value: string | null | undefined): Date | null => {
  const match = LOCAL_DAY.exec(value ?? '');
  if (!match) return null;
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12)
  );
  return Number.isNaN(date.getTime()) ? null : date;
};

const localDayKey = (value: Date): string =>
  `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`;

/** Monday-first index for a UTC day number. */
const mondayFirstIndex = (day: number) => (day === 0 ? 6 : day - 1);

const outcomeRank: Record<string, number> = {
  approved: 3,
  pending: 2,
  rejected: 1,
};

/**
 * Seven server-local markers. A blank past day stays unresolved; only a
 * durable outcome row can call it missed or protected.
 */
export const buildProofWeek = ({
  records,
  outcomes = [],
  todayLocalDay,
  activeFromLocalDay,
}: BuildProofWeekOptions): PromiseProofDay[] => {
  const today = parseLocalDay(todayLocalDay);
  if (!today) return [];

  const todayIndex = mondayFirstIndex(today.getUTCDay());
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() - todayIndex);
  const activeFrom = parseLocalDay(activeFromLocalDay);

  const bestByDay = new Map<string, string>();
  for (const record of records) {
    if (!LOCAL_DAY.test(record.localDay ?? '')) continue;
    const key = record.localDay!;
    const existing = bestByDay.get(key);
    const incomingRank = outcomeRank[record.status] ?? 0;
    const existingRank = existing ? (outcomeRank[existing] ?? 0) : -1;
    if (incomingRank > existingRank) bestByDay.set(key, record.status);
  }

  const resolvedByDay = new Map(
    outcomes.map(outcome => [outcome.localDay, outcome.outcome] as const)
  );

  return dayLabels.map((label, index) => {
    const dayDate = new Date(monday);
    dayDate.setUTCDate(monday.getUTCDate() + index);
    const dayKey = localDayKey(dayDate);
    const resolved = resolvedByDay.get(dayKey);
    const proof = bestByDay.get(dayKey);

    if (resolved === 'missed') return { label, state: 'missed' };
    if (resolved === 'protected') return { label, state: 'protected' };
    if (proof === 'approved') return { label, state: 'approved' };
    if (proof === 'rejected') return { label, state: 'needs-retry' };
    if (proof === 'pending') return { label, state: 'waiting' };

    if (activeFrom && dayDate < activeFrom) return { label, state: 'inactive' };
    if (index === todayIndex) return { label, state: 'today' };
    if (index > todayIndex) return { label, state: 'future' };
    return { label, state: 'past' };
  });
};
