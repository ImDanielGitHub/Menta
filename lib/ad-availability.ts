import { ECONOMY_CONTRACT_V1 } from '@/lib/economy/contract';
import { supabase } from '@/lib/supabase';

/** Why a rewarded ad cannot pay out right now. */
export type AdRestReason = 'cooldown' | 'daily_limit';

export type AdAvailability = {
  rest: AdRestReason | null;
  /** Epoch ms when the next ad can pay out; null when one can pay out now. */
  readyAt: number | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Mirrors the server's ad reward authority (`apply_revenuecat_ad_reward_v1`):
 * at most `dailyLimit` rewards in any rolling day, and none within
 * `cooldownSeconds` of the last one. Knowing this before an ad plays stops
 * someone watching a whole ad that the server will then refuse to pay for.
 */
export const resolveAdAvailability = (
  rewardTimes: readonly number[],
  now: number,
  limits: {
    dailyLimit: number;
    cooldownSeconds: number;
  } = ECONOMY_CONTRACT_V1.ads
): AdAvailability => {
  const recent = rewardTimes
    .filter(time => Number.isFinite(time) && time > now - DAY_MS && time <= now)
    .sort((a, b) => a - b);

  if (recent.length >= limits.dailyLimit) {
    // The oldest reward that still counts must age out of the day first.
    const oldestCounted = recent[recent.length - limits.dailyLimit];
    return { rest: 'daily_limit', readyAt: oldestCounted + DAY_MS };
  }

  const latest = recent[recent.length - 1];
  if (latest !== undefined) {
    const readyAt = latest + limits.cooldownSeconds * 1000;
    if (readyAt > now) return { rest: 'cooldown', readyAt };
  }

  return { rest: null, readyAt: null };
};

/** Reads the person's own ad rewards from the last day. */
export const readAdAvailability = async (
  userId: string,
  now: number = Date.now()
): Promise<AdAvailability> => {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('created_at')
    .eq('user_id', userId)
    .eq('transaction_type', 'bonus')
    .eq('reason', 'Ad reward')
    .gte('created_at', new Date(now - DAY_MS).toISOString())
    .order('created_at', { ascending: false })
    .limit(ECONOMY_CONTRACT_V1.ads.dailyLimit);
  if (error) throw error;

  const times = (Array.isArray(data) ? data : [])
    .map(row =>
      typeof row?.created_at === 'string' ? Date.parse(row.created_at) : NaN
    )
    .filter(Number.isFinite);
  return resolveAdAvailability(times, now);
};

/** "1:42" for a countdown to `readyAt`. */
export const formatAdCountdown = (readyAt: number, now: number): string => {
  const seconds = Math.max(0, Math.ceil((readyAt - now) / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
};
