import React from 'react';
import { AppButton } from '@/components/ui/AppButton';
import { openPaywall } from '@/lib/paywall/manager';
import { usePaywallAllowed } from '@/lib/paywall/use-paywall-allowed';
import { useTranslation } from '@/lib/localization/use-translation';
import { trackProductEvent } from '@/lib/posthog';

/** Explicit Shop/Wallet entry, never an automatic interruption. */
export function ProEntry({ isPro = false }: { isPro?: boolean }) {
  const allowed = usePaywallAllowed();
  const { t } = useTranslation();
  if (!allowed || isPro) return null;
  return (
    <AppButton
      title={t('commerce.proJourney.seePlans')}
      variant="secondary"
      fullWidth
      onPress={() => {
        trackProductEvent('Paywall Journey', {
          stage: 'entry_tapped',
          context: 'general',
          plan: 'none',
          source: 'shop',
        });
        openPaywall({ context: 'general' });
      }}
      testID="explore-pro"
    />
  );
}
