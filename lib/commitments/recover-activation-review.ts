import { decodeAccountActivationLookup } from '@/lib/commitments/promise-creation-receipt';
import {
  getActivationReviewAt,
  queueActivationReview,
} from '@/lib/store-review';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';

// Successful recovery is durable in the account's activation marker. Failed or
// absent lookups wait until another app launch rather than reading on each focus.
const attemptedAccounts = new Set<string>();

const isCompletedAccount = (ownerId: string): boolean => {
  const state = useAuthStore.getState();
  return (
    state.isAuthenticated &&
    state.hasCompletedOnboarding &&
    state.user?.id === ownerId &&
    state.session?.user.id === ownerId
  );
};

/** Read the same authenticated activation receipt used by onboarding recovery. */
export async function recoverActivationReview(
  ownerId: string
): Promise<string | null> {
  const stored = await getActivationReviewAt(ownerId);
  if (stored) return stored;
  if (!isCompletedAccount(ownerId) || attemptedAccounts.has(ownerId))
    return null;
  attemptedAccounts.add(ownerId);

  try {
    // The RPC derives the owner from auth.uid(), checks the active session, and
    // reads that owner's private first-promise activation receipt.
    const { data, error } = await supabase.rpc('get_my_account_activation_v1');
    if (error || !isCompletedAccount(ownerId)) return null;
    const lookup = decodeAccountActivationLookup(data);
    if (lookup?.kind !== 'confirmed' || !lookup.receipt.firstPromiseId.trim())
      return null;
    await queueActivationReview(ownerId);
    return isCompletedAccount(ownerId)
      ? await getActivationReviewAt(ownerId)
      : null;
  } catch {
    // A failed optional receipt read cannot interrupt Today or block a later
    // successful onboarding completion from queueing its own opportunity.
    return null;
  }
}
