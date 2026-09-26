import React, { useEffect, useState, useCallback } from 'react';
import { PaywallModal } from '@/components/paywall/PaywallModal';
import { paywallManager, type PaywallOpenOptions } from '@/lib/paywall/manager';
import { useAdRewardAmount } from '@/lib/hooks/useAdReward';
import { useRewardedMomentaAd } from '@/lib/hooks/use-rewarded-momenta-ad';
import { useRouter } from 'expo-router';

type PendingPaywall = PaywallOpenOptions & {
  id: string;
};

export const PaywallHost: React.FC = () => {
  const [pending, setPending] = useState<PendingPaywall | null>(null);
  const adReward = useAdRewardAmount();
  const { available: rewardedAdsAvailable, watch: handleWatchAd } =
    useRewardedMomentaAd('paywall');
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
      onWatchAd={handleWatchAd}
      context={pending?.context || 'general'}
      initialView={pending?.initialView}
      shortfall={pending?.shortfall}
      adRewardAmount={rewardedAdsAvailable ? adReward : 0}
    />
  );
};

export default PaywallHost;
