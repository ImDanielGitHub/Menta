import { useCallback } from 'react';

import { useOperationalFlag } from '@/hooks/useOperationalFlag';
import {
  areVerifiedAdRewardsEnabled,
  showRewardedAdDetailed,
  type RewardAdResult,
} from '@/lib/ads';
import { useAuthStore } from '@/store/auth-store';
import { useMomentaStore } from '@/store/momenta-store';

const MODULE_MISSING_REASON: RewardAdResult['reason'] = 'module_missing';
const ERROR_REASON: RewardAdResult['reason'] = 'error';

/**
 * One rewarded ad, credited only after RevenueCat verifies it and the
 * Supabase receipt exists. `watch` is undefined whenever the release gate,
 * the operational flags or the native module cannot pay a reward, so callers
 * never show an ad option that would quietly do nothing.
 */
export function useRewardedMomentaAd(placement: string): {
  available: boolean;
  watch: (() => Promise<RewardAdResult>) | undefined;
} {
  const { enabled: adsEnabled } = useOperationalFlag('ads_enabled');
  const { enabled: safeMode } = useOperationalFlag('safe_mode');
  const available = adsEnabled && !safeMode && areVerifiedAdRewardsEnabled();
  const claimAdReward = useMomentaStore(state => state.claimAdReward);

  const watch = useCallback(async (): Promise<RewardAdResult> => {
    if (!available) {
      return { earned: false, amount: 0, reason: MODULE_MISSING_REASON };
    }

    try {
      const detailed = await showRewardedAdDetailed({
        appUserId: useAuthStore.getState().user?.id ?? '',
        placement,
      });
      if (!detailed?.earned) {
        return detailed ?? { earned: false, amount: 0, reason: ERROR_REASON };
      }

      const claim = await claimAdReward(detailed.clientTransactionId);
      if (!claim.earned) {
        const reason: RewardAdResult['reason'] =
          claim.reason === 'daily-limit'
            ? 'daily_limit'
            : claim.reason === 'cooldown'
              ? 'cooldown'
              : 'reward_unconfirmed';
        return { earned: false, amount: 0, reason };
      }

      return { earned: true, amount: claim.amount, type: detailed.type };
    } catch {
      return { earned: false, amount: 0, reason: ERROR_REASON };
    }
  }, [available, claimAdReward, placement]);

  return { available, watch: available ? watch : undefined };
}
