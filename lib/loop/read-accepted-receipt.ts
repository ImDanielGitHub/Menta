import { supabase } from '@/lib/supabase';
import type { ConfirmedReceipt } from '@/lib/loop/types';

/** Completed promises can leave the obligation list while their proof is still today's result. */
export const readAcceptedReceipt = async (
  userId: string,
  localDay: string
): Promise<ConfirmedReceipt | null> => {
  const { data, error } = await supabase
    .from('challenge_submissions')
    .select('id, challenge_id, local_day, reviewed_at, submission_date')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .eq('local_day', localDay)
    .order('submission_date', { ascending: false })
    .limit(12);
  if (error) throw error;
  const latest = data
    ?.filter(row =>
      Number.isFinite(Date.parse(row.reviewed_at ?? row.submission_date))
    )
    .sort(
      (a, b) =>
        Date.parse(b.reviewed_at ?? b.submission_date) -
        Date.parse(a.reviewed_at ?? a.submission_date)
    )[0];
  if (!latest) return null;

  const confirmedAtIso = latest.reviewed_at ?? latest.submission_date;
  if (!confirmedAtIso || !Number.isFinite(Date.parse(confirmedAtIso))) {
    return null;
  }
  return {
    kind: 'accepted',
    challengeId: latest.challenge_id,
    verificationId: latest.id,
    localDay: latest.local_day ?? localDay,
    confirmedAtIso,
  };
};
