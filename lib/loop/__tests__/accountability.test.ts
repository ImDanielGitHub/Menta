import {
  isMissingAccountabilityRpcError,
  isMissingTodayHomeRpcError,
  parseStreakOutcomeFact,
  readStreakOutcomeHistory,
  readTodayAccountability,
} from '@/lib/loop/accountability';
import { supabase } from '@/lib/supabase';

describe('accountability client contract', () => {
  it('decodes only complete server-confirmed outcomes', () => {
    expect(
      parseStreakOutcomeFact({
        streak_outcome: 'missed',
        outcome_local_day: '2026-08-11',
        previous_streak: 4,
        resulting_streak: 0,
        freeze_used: false,
        freezes_remaining: 0,
      })
    ).toEqual({
      outcome: 'missed',
      localDay: '2026-08-11',
      previousStreak: 4,
      resultingStreak: 0,
      freezeUsed: false,
      freezesRemaining: 0,
    });
  });

  it('never converts malformed or absent outcome data into a miss', () => {
    expect(
      parseStreakOutcomeFact({
        streak_outcome: null,
        current_streak: 0,
        last_check_in_local_date: '2026-07-01',
      })
    ).toBeNull();
    expect(
      parseStreakOutcomeFact({
        streak_outcome: 'missed',
        outcome_local_day: '2026-08-11',
      })
    ).toBeNull();
  });

  it('identifies a missing versioned RPC without treating other failures as missing', () => {
    expect(isMissingAccountabilityRpcError({ code: 'PGRST202' })).toBe(true);
    expect(
      isMissingAccountabilityRpcError({
        message:
          'Could not find the function public.get_today_accountability_v2',
      })
    ).toBe(true);
    expect(isMissingAccountabilityRpcError({ code: '42501' })).toBe(false);
  });

  it('identifies a missing bundled Today home RPC', () => {
    expect(isMissingTodayHomeRpcError({ code: 'PGRST202' })).toBe(true);
    expect(
      isMissingTodayHomeRpcError({
        message: 'Could not find the function public.get_today_home_v1',
      })
    ).toBe(true);
    expect(isMissingTodayHomeRpcError({ code: '42501' })).toBe(false);
  });

  it('keeps the Supabase client context when reading Today', async () => {
    const rpc = jest.spyOn(supabase, 'rpc');
    rpc.mockImplementation(function (
      this: typeof supabase,
      functionName: string
    ) {
      if (this !== supabase) {
        throw new TypeError('Supabase client context was lost');
      }
      expect(functionName).toBe('get_today_accountability_v2');
      return Promise.resolve({ data: [], error: null });
    } as never);

    await expect(readTodayAccountability('Pacific/Auckland')).resolves.toEqual({
      rows: [],
      source: 'v2',
    });

    rpc.mockRestore();
  });

  it('keeps the Supabase client context when reading streak outcomes', async () => {
    const query = {
      select: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockReturnValue(query);

    const from = jest.spyOn(supabase, 'from');
    from.mockImplementation(function (
      this: typeof supabase,
      tableName: string
    ) {
      if (this !== supabase) {
        throw new TypeError('Supabase client context was lost');
      }
      expect(tableName).toBe('streak_day_outcomes');
      return query;
    } as never);

    await expect(
      readStreakOutcomeHistory({
        userId: 'account-1',
        challengeId: 'challenge-1',
      })
    ).resolves.toEqual([]);

    from.mockRestore();
  });
});
