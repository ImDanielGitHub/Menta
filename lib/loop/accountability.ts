import { supabase } from '@/lib/supabase';

export type StreakOutcome = 'missed' | 'protected';

export type StreakOutcomeFact = {
  outcome: StreakOutcome;
  localDay: string;
  previousStreak: number;
  resultingStreak: number;
  freezeUsed: boolean;
  freezesRemaining: number;
};

export type StreakOutcomeHistoryFact = StreakOutcomeFact & {
  id: string;
  challengeId: string;
  createdAtIso: string;
};

export type TodayAccountabilitySource = 'v2' | 'legacy';

export type TodayAccountabilityRead = {
  rows: readonly Record<string, unknown>[];
  source: TodayAccountabilitySource;
};

type RpcResult = {
  data: unknown;
  error: unknown;
};

type UntypedRpc = (
  name: string,
  args: Record<string, unknown>
) => Promise<RpcResult>;

type OutcomeHistoryQueryResult = {
  data: unknown;
  error: unknown;
};

type OutcomeHistoryQuery = PromiseLike<OutcomeHistoryQueryResult> & {
  select: (columns: string) => OutcomeHistoryQuery;
  eq: (column: string, value: string) => OutcomeHistoryQuery;
  order: (
    column: string,
    options: { ascending: boolean }
  ) => OutcomeHistoryQuery;
  limit: (count: number) => OutcomeHistoryQuery;
};

type UntypedFrom = (table: string) => OutcomeHistoryQuery;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const records = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

const stringValue = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value : null;

const numberValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (
    typeof value === 'string' &&
    value.trim() &&
    Number.isFinite(Number(value))
  ) {
    return Number(value);
  }
  return null;
};

const booleanValue = (value: unknown): boolean => value === true;

export const normalizeStreakOutcome = (value: unknown): StreakOutcome | null =>
  value === 'missed' || value === 'protected' ? value : null;

const errorCode = (error: unknown): string | null =>
  isRecord(error) ? stringValue(error.code) : null;

const errorMessage = (error: unknown): string =>
  isRecord(error) ? stringValue(error.message) || '' : '';

/**
 * Only a missing versioned RPC permits the legacy fallback. Permission,
 * transport, and query failures stay failures so Today cannot invent a safe
 * or empty accountability state.
 */
export const isMissingAccountabilityRpcError = (error: unknown): boolean => {
  const code = errorCode(error);
  if (code === 'PGRST202' || code === '42883') return true;

  const message = errorMessage(error).toLowerCase();
  return (
    message.includes('get_today_accountability_v2') &&
    (message.includes('could not find') || message.includes('does not exist'))
  );
};

export const isMissingTodayHomeRpcError = (error: unknown): boolean => {
  const code = errorCode(error);
  if (code === 'PGRST202' || code === '42883') return true;

  const message = errorMessage(error).toLowerCase();
  return (
    message.includes('get_today_home_v1') &&
    (message.includes('could not find') || message.includes('does not exist'))
  );
};

export const readTodayAccountability = async (
  timezone: string
): Promise<TodayAccountabilityRead> => {
  // SupabaseClient.rpc reads the REST client from `this`. Keep the method
  // bound to its client; extracting it as a bare function throws before a
  // request reaches Supabase and leaves Today in its load-failed state.
  const rpc = supabase.rpc.bind(supabase) as unknown as UntypedRpc;
  const current = await rpc('get_today_accountability_v2', {
    p_timezone: timezone,
  });

  if (!current.error) {
    return { rows: records(current.data), source: 'v2' };
  }

  // Any v2 failure removes accountability claims but must not remove the
  // established Today snapshot. The legacy read can still fail normally.
  const legacy = await rpc('get_today_obligations', {
    p_timezone: timezone,
  });
  if (legacy.error) throw legacy.error;

  return { rows: records(legacy.data), source: 'legacy' };
};

export const parseStreakOutcomeFact = (
  row: Record<string, unknown>
): StreakOutcomeFact | null => {
  const outcome = normalizeStreakOutcome(row.streak_outcome ?? row.outcome);
  const localDay = stringValue(row.outcome_local_day ?? row.local_day);
  const previousStreak = numberValue(row.previous_streak);
  const resultingStreak = numberValue(row.resulting_streak);
  const freezesRemaining = numberValue(row.freezes_remaining);

  if (
    !outcome ||
    !localDay ||
    previousStreak === null ||
    resultingStreak === null ||
    freezesRemaining === null
  ) {
    return null;
  }

  return {
    outcome,
    localDay,
    previousStreak,
    resultingStreak,
    freezeUsed: booleanValue(row.freeze_used),
    freezesRemaining,
  };
};

export const readStreakOutcomeHistory = async (args: {
  userId: string;
  challengeId: string;
  limit?: number;
}): Promise<StreakOutcomeHistoryFact[]> => {
  const from = supabase.from.bind(supabase) as unknown as UntypedFrom;
  const { data, error } = await from('streak_day_outcomes')
    .select(
      'id, challenge_id, local_day, outcome, previous_streak, resulting_streak, freeze_used, freezes_remaining, created_at'
    )
    .eq('user_id', args.userId)
    .eq('challenge_id', args.challengeId)
    .order('local_day', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(args.limit ?? 21);

  if (error) throw error;

  return records(data).flatMap(row => {
    const fact = parseStreakOutcomeFact(row);
    const id = stringValue(row.id);
    const challengeId = stringValue(row.challenge_id);
    const createdAtIso = stringValue(row.created_at);
    if (!fact || !id || !challengeId || !createdAtIso) return [];

    return [{ ...fact, id, challengeId, createdAtIso }];
  });
};
