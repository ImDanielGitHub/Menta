import { supabase } from '@/lib/supabase';

export interface FirstMissOffer {
  outcomeId: string;
  challengeId: string;
  challengeTitle: string;
  localDay: string;
  previousStreak: number;
  expiresAt: string;
}

export async function readFirstMissRecovery(
  signal: AbortSignal
): Promise<FirstMissOffer | null> {
  const { data, error } = await supabase
    .rpc('get_first_miss_recovery_v1')
    .abortSignal(signal);
  if (error) throw error;
  if (
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data) ||
    data.eligible !== true
  )
    return null;
  if (
    typeof data.outcome_id !== 'string' ||
    typeof data.challenge_id !== 'string' ||
    typeof data.challenge_title !== 'string' ||
    typeof data.local_day !== 'string' ||
    typeof data.previous_streak !== 'number' ||
    typeof data.expires_at !== 'string'
  )
    return null;
  return {
    outcomeId: data.outcome_id,
    challengeId: data.challenge_id,
    challengeTitle: data.challenge_title,
    localDay: data.local_day,
    previousStreak: data.previous_streak,
    expiresAt: data.expires_at,
  };
}

export async function claimFirstMissRecovery(
  offer: FirstMissOffer
): Promise<number> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  const { data, error } = await Promise.resolve(
    supabase
      .rpc('claim_first_miss_recovery_v1', { p_outcome_id: offer.outcomeId })
      .abortSignal(controller.signal)
  ).finally(() => clearTimeout(timeout));
  if (error) throw new Error('The freeze could not be confirmed. Try again.');
  if (
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data) ||
    data.success !== true ||
    data.outcome_id !== offer.outcomeId ||
    data.challenge_id !== offer.challengeId ||
    typeof data.streak !== 'number'
  ) {
    throw new Error(
      'This first-day offer is no longer available. You can still add proof today.'
    );
  }
  return data.streak;
}
