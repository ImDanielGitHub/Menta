import { supabase } from '@/lib/supabase';
import { pickTodayRejectedReviewNote } from '@/lib/proof-correction-copy';

const deviceTimezone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

/**
 * Reads today's rejected reviewer note for one promise. A failed or empty
 * read must not block compose — the person can still send the next proof.
 */
export async function readTodayCorrectionReason(args: {
  challengeId: string;
  userId: string;
  timezone?: string;
  now?: Date;
}): Promise<string | null> {
  const challengeId = args.challengeId.trim();
  const userId = args.userId.trim();
  if (!challengeId || !userId) return null;

  const { data, error } = await supabase
    .from('challenge_submissions')
    .select('status, review_notes, local_day, submission_date')
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .eq('status', 'rejected')
    .order('submission_date', { ascending: false })
    .limit(8);

  if (error || !data) return null;

  return pickTodayRejectedReviewNote(data, {
    timezone: args.timezone ?? deviceTimezone(),
    now: args.now,
  });
}
