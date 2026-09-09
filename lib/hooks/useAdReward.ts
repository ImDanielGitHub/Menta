import { DEFAULT_AD_REWARD as CONTRACT_AD_REWARD } from '@/lib/economy/contract';

export const DEFAULT_AD_REWARD = CONTRACT_AD_REWARD;

/** Expected copy amount; the server response remains authoritative for credit. */
export function useAdRewardAmount(): number {
  return DEFAULT_AD_REWARD;
}
