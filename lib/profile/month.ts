import { supabase } from '@/lib/supabase';

export type ProfileMonthDayState =
  'kept' | 'frozen' | 'missed' | 'today' | 'open' | 'future';

export type ProfileMonthDay = {
  localDay: string;
  dayOfMonth: number;
  /** Monday = 0 … Sunday = 6. */
  weekdayIndex: number;
  state: ProfileMonthDayState;
};

export type ProfileMonth = {
  monthLabel: string;
  daysKept: number;
  days: ProfileMonthDay[];
  counts: { kept: number; frozen: number; missed: number };
};

type MonthRow = {
  local_day: string;
  approved_proofs: number;
  outcome: string | null;
};

const parseDay = (localDay: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDay);
  if (!match) return null;
  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12)
  );
};

/** Server rows → the You tab calendar. Every state comes from the server. */
export const buildProfileMonth = ({
  today,
  daysKept,
  rows,
  locale,
}: {
  today: string;
  daysKept: number;
  rows: readonly MonthRow[];
  locale: string;
}): ProfileMonth | null => {
  const todayDate = parseDay(today);
  if (!todayDate) return null;
  const counts = { kept: 0, frozen: 0, missed: 0 };
  const days: ProfileMonthDay[] = [];
  for (const row of rows) {
    const date = parseDay(row.local_day);
    if (!date) continue;
    const isToday = row.local_day === today;
    const isFuture = date.getTime() > todayDate.getTime();
    const state: ProfileMonthDayState =
      row.approved_proofs > 0
        ? 'kept'
        : row.outcome === 'protected'
          ? 'frozen'
          : row.outcome === 'missed'
            ? 'missed'
            : isToday
              ? 'today'
              : isFuture
                ? 'future'
                : 'open';
    if (state === 'kept' || state === 'frozen' || state === 'missed') {
      counts[state] += 1;
    }
    days.push({
      localDay: row.local_day,
      dayOfMonth: date.getUTCDate(),
      weekdayIndex: (date.getUTCDay() + 6) % 7,
      state,
    });
  }
  return {
    monthLabel: todayDate.toLocaleDateString(locale, {
      month: 'long',
      timeZone: 'UTC',
    }),
    daysKept: Math.max(0, Math.trunc(daysKept)),
    days,
    counts,
  };
};

export const readProfileMonth = async ({
  locale,
}: {
  locale: string;
}): Promise<ProfileMonth | null> => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    name: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: unknown }>;
  const { data, error } = await rpc('get_profile_month_v1', {
    p_timezone: timezone,
  });
  if (error) throw error;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const record = data as Record<string, unknown>;
  if (typeof record.today !== 'string') return null;
  const rows = Array.isArray(record.days)
    ? record.days.flatMap((row): MonthRow[] => {
        if (!row || typeof row !== 'object') return [];
        const value = row as Record<string, unknown>;
        if (typeof value.local_day !== 'string') return [];
        return [
          {
            local_day: value.local_day,
            approved_proofs:
              typeof value.approved_proofs === 'number'
                ? value.approved_proofs
                : 0,
            outcome: typeof value.outcome === 'string' ? value.outcome : null,
          },
        ];
      })
    : [];
  return buildProfileMonth({
    today: record.today,
    daysKept: typeof record.days_kept === 'number' ? record.days_kept : 0,
    rows,
    locale,
  });
};
