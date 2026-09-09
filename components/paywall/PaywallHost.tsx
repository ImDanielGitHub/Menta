import React, { useEffect, useState, useCallback } from 'react';
import { PaywallModal } from '@/components/paywall/PaywallModal';
import { paywallManager, type PaywallOpenOptions } from '@/lib/paywall/manager';
import { useAdRewardAmount } from '@/lib/hooks/useAdReward';
import {
  areVerifiedAdRewardsEnabled,
  showRewardedAdDetailed,
  type RewardAdResult,
} from '@/lib/ads';
import { useMomentaStore } from '@/store/momenta-store';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'expo-router';
import { useOperationalFlag } from '@/hooks/useOperationalFlag';

type PendingPaywall = PaywallOpenOptions & {
  id: string;
};

const MODULE_MISSING_REASON: RewardAdResult['reason'] = 'module_missing';
const ERROR_REASON: RewardAdResult['reason'] = 'error';

export const PaywallHost: React.FC = () => {
  const [pending, setPending] = useState<PendingPaywall | null>(null);
  const adReward = useAdRewardAmount();
  const { enabled: adsEnabled } = useOperationalFlag('ads_enabled');
  const { enabled: safeMode } = useOperationalFlag('safe_mode');
  const rewardedAdsAvailable =
    adsEnabled && !safeMode && areVerifiedAdRewardsEnabled();
  const claimAdReward = useMomentaStore(state => state.claimAdReward);
  const router = useRouter();

  useEffect(() => {
    return paywallManager.subscribe(setPending);
  }, []);

  const handleClose = useCallback(() => setPending(null), []);

  useEffect(() => {
    paywallManager.setVisible(pending !== null);
    return () => {
      paywallManager.setVisible(false);
    };
  }, [pending]);

  const handleWatchAd = useCallback(async (): Promise<RewardAdResult> => {
    if (!rewardedAdsAvailable) {
      return { earned: false, amount: 0, reason: MODULE_MISSING_REASON };
    }

    try {
      const detailed = await showRewardedAdDetailed({
        appUserId: useAuthStore.getState().user?.id ?? '',
        placement: 'paywall',
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

      return {
        earned: true,
        amount: claim.amount,
        type: detailed.type,
      };
    } catch {
      return { earned: false, amount: 0, reason: ERROR_REASON };
    }
  }, [claimAdReward, rewardedAdsAvailable]);

  const handleBuyPro = useCallback(() => {
    const onProConfirmed = pending?.onProConfirmed;
    setPending(null);
    onProConfirmed?.();
  }, [pending?.onProConfirmed]);

  const handleBuyCredits = useCallback(() => {
    setPending(null);
    router.push('/shop');
  }, [router]);

  return (
    <PaywallModal
      visible={!!pending}
      onClose={handleClose}
      onBuyPro={handleBuyPro}
      onBuyCredits={handleBuyCredits}
      onWatchAd={rewardedAdsAvailable ? handleWatchAd : undefined}
      context={pending?.context || 'general'}
      initialView={pending?.initialView}
      shortfall={pending?.shortfall}
      adRewardAmount={rewardedAdsAvailable ? adReward : 0}
    />
  );
};

export default PaywallHost;
