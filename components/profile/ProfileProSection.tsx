import React from 'react';
import { CrownIcon } from '@/components/ui/icons';
import { SettingsDirectRow } from '@/components/settings/SettingsDirectRow';
import { useTheme } from '@/constants/ThemeContext';
import { useTranslation } from '@/lib/localization';
import { openPaywall } from '@/lib/paywall/manager';
import { usePaywallAllowed } from '@/lib/paywall/use-paywall-allowed';
import { trackProductEvent } from '@/lib/posthog';

interface ProfileProSectionProps {
  status: 'checking' | 'free' | 'active' | 'unavailable';
  onCheckAccess: () => void;
  onProConfirmed: () => void;
}

export function ProfileProSection({
  status,
  onCheckAccess,
  onProConfirmed,
}: ProfileProSectionProps) {
  const allowed = usePaywallAllowed();
  const { colors } = useTheme();
  const { t } = useTranslation();
  if (!allowed) return null;

  const active = status === 'active';
  const checking = status === 'checking';
  const unavailable = status === 'unavailable';
  const openPro = () => {
    trackProductEvent('Paywall Journey', {
      stage: 'entry_tapped',
      source: 'profile',
      context: 'general',
      plan: 'none',
    });
    openPaywall({
      context: 'general',
      initialView: active ? 'active' : 'plans',
      onProConfirmed,
    });
  };

  return (
    <SettingsDirectRow
      icon={<CrownIcon size={20} color={colors.accent.primary} />}
      title={t(
        active ? 'commerce.paywall.proActive' : 'commerce.proJourney.title'
      )}
      subtitle={t(
        checking
          ? 'commerce.paywall.checkingAccess'
          : unavailable
            ? 'commerce.paywall.couldNotCheck'
            : active
              ? 'fullAuth.settings.active_view_or_manage_your_subscription'
              : 'commerce.proJourney.capacity'
      )}
      accessibilityLabel={t(
        checking
          ? 'commerce.paywall.checkingAccess'
          : unavailable
            ? 'commerce.paywall.checkAccess'
            : active
              ? 'commerce.paywall.manageSubscription'
              : 'commerce.proJourney.seePlans'
      )}
      disabled={checking}
      busy={checking}
      onPress={unavailable ? onCheckAccess : openPro}
      testID="profile-open-pro"
    />
  );
}
