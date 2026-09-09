import { REVIEW_QUEUE_CLEAR_REWARD_AMOUNT } from '@/lib/economy/contract';
import { supabase } from '@/lib/supabase';
import { useMomentaStore } from '@/store/momenta-store';
import { translate as resolveCopy } from '@/lib/localization';

export { REVIEW_QUEUE_CLEAR_REWARD_AMOUNT };

type ClaimRewardResponse = {
  success?: boolean;
  granted?: boolean;
  amount?: number;
  balance?: number;
  new_balance?: number;
  error?: string;
  message?: string;
  reason?: string;
};

export type ReviewRewardClaimResult = {
  granted: boolean;
  amount: number;
  alreadyGranted?: boolean;
  message?: string;
};

type ReviewRewardRpcClient = {
  rpc: (
    name: string,
    args: {
      p_user_id: string;
      p_reward_type: string;
      p_reference_id: string;
    }
  ) => PromiseLike<{ data: unknown; error: unknown }>;
};

export const claimReviewQueueReward = async (
  userId: string,
  submissionId: string,
  locale = 'en-NZ'
): Promise<ReviewRewardClaimResult> => {
  const { data, error } = await (
    supabase as unknown as ReviewRewardRpcClient
  ).rpc('claim_momenta_reward', {
    p_user_id: userId,
    p_reward_type: 'review_queue_reward',
    p_reference_id: submissionId,
  });

  if (error) {
    throw error;
  }

  const result = data as ClaimRewardResponse | null;

  if (!result?.success) {
    return {
      granted: false,
      amount: 0,
      message:
        result?.message ||
        result?.error ||
        resolveCopy(locale, 'todayProof.review.reward_failed'),
    };
  }

  if (result.granted === false) {
    return {
      granted: false,
      amount: 0,
      alreadyGranted: result.reason === 'already_granted',
      message:
        result.reason === 'already_granted'
          ? resolveCopy(locale, 'todayProof.review.reward_already_logged')
          : result.message,
    };
  }

  const amount = Number(result.amount ?? REVIEW_QUEUE_CLEAR_REWARD_AMOUNT);

  try {
    await useMomentaStore.getState().fetchBalance(userId);
  } catch {
    // Reward grants are server-authoritative; stale balance is refreshed later.
  }

  return {
    granted: true,
    amount: Number.isFinite(amount) ? amount : REVIEW_QUEUE_CLEAR_REWARD_AMOUNT,
  };
};
