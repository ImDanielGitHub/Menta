import { supabase } from '@/lib/supabase';

export type ProfileFollowThroughDay = {
  localDay: string;
  shortLabel: string;
  longLabel: string;
  approvedProofs: number;
  outcome: 'missed' | 'protected' | null;
};

type ProofDayRow = { local_day: string | null };
type OutcomeDayRow = { local_day: string; outcome: string };

const dateOnly = (date: Date): string =>
  `${date.getFullYear().toString().padStart(4, '0')}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

export const buildProfileFollowThroughDays = ({
  approvedRows,
  outcomeRows,
  locale,
  now = new Date(),
  count = 7,
}: {
  approvedRows: readonly ProofDayRow[];
  outcomeRows: readonly OutcomeDayRow[];
  locale: string;
  now?: Date;
  count?: number;
}): ProfileFollowThroughDay[] => {
  const approvedByDay = new Map<string, number>();
  for (const row of approvedRows) {
    if (!row.local_day) continue;
    approvedByDay.set(
      row.local_day,
      (approvedByDay.get(row.local_day) ?? 0) + 1
    );
  }

  const outcomeByDay = new Map<string, 'missed' | 'protected'>();
  for (const row of outcomeRows) {
    if (row.outcome !== 'missed' && row.outcome !== 'protected') continue;
    outcomeByDay.set(row.local_day, row.outcome);
  }

  const days: ProfileFollowThroughDay[] = [];
  for (let offset = Math.max(1, count) - 1; offset >= 0; offset -= 1) {
    const day = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - offset,
      12
    );
    const localDay = dateOnly(day);
    days.push({
      localDay,
      shortLabel: new Intl.DateTimeFormat(locale, {
        weekday: 'narrow',
      }).format(day),
      longLabel: new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        weekday: 'long',
      }).format(day),
      approvedProofs: approvedByDay.get(localDay) ?? 0,
      outcome: outcomeByDay.get(localDay) ?? null,
    });
  }
  return days;
};

export const readProfileFollowThroughDays = async ({
  locale,
}: {
  locale: string;
}): Promise<ProfileFollowThroughDay[]> => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    name: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: unknown }>;
  const { data, error } = await rpc('get_profile_follow_through_v1', {
    p_timezone: timezone,
  });
  if (error) throw error;

  const rows = Array.isArray(data)
    ? data.filter(
        (row): row is Record<string, unknown> =>
          typeof row === 'object' && row !== null && !Array.isArray(row)
      )
    : [];
  const approvedRows: ProofDayRow[] = [];
  const outcomeRows: OutcomeDayRow[] = [];
  for (const row of rows) {
    if (typeof row.local_day !== 'string') continue;
    const approvedProofs =
      typeof row.approved_proofs === 'number' &&
      Number.isInteger(row.approved_proofs) &&
      row.approved_proofs >= 0
        ? row.approved_proofs
        : 0;
    for (let index = 0; index < approvedProofs; index += 1) {
      approvedRows.push({ local_day: row.local_day });
    }
    if (row.outcome === 'missed' || row.outcome === 'protected') {
      outcomeRows.push({ local_day: row.local_day, outcome: row.outcome });
    }
  }

  return buildProfileFollowThroughDays({
    approvedRows,
    outcomeRows,
    locale,
    now: new Date(),
  });
};
