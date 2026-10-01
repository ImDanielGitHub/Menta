import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const adReward = useAdRewardAmount();
  const { available: rewardedAdsAvailable, watch: handleWatchAd } =
    useRewardedMomentaAd('paywall');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = paywallManager.subscribe(setPending);
    return () => {
      pendingRef.current = null;
      unsubscribe();
    };
  }, []);

  const handleClose = useCallback(() => {
    if (pendingRef.current?.id !== pending?.id) return;
    pendingRef.current = null;
    setPending(null);
  }, [pending?.id]);
  const handleContinueFree = useCallback(() => {
    if (!pending || pendingRef.current?.id !== pending.id) return;
    pendingRef.current = null;
    setPending(null);
    pending.onContinueFree?.();
  }, [pending]);

  useEffect(() => {
    paywallManager.setVisible(pending !== null);
    return () => {
      paywallManager.setVisible(false);
    };
  }, [pending]);

  const handleBuyPro = useCallback(() => {
    if (!pending || pendingRef.current?.id !== pending.id) return;
    const onProConfirmed = pending?.onProConfirmed;
    setPending(null);
    pendingRef.current = null;
    onProConfirmed?.();
  }, [pending]);

  const handleBuyCredits = useCallback(() => {
    setPending(null);
    router.push('/shop');
  }, [router]);

  return (
    <PaywallModal
      key={pending?.id ?? 'closed'}
      visible={!!pending}
      onClose={handleClose}
      onBuyPro={handleBuyPro}
      onContinueFree={handleContinueFree}
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
