import React from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { RevenueCatAPI } from '@/lib/paywall/revenuecat';
import { useMentaCheckOverview } from '@/hooks/use-menta-check';
import { AppButton } from '@/components/ui/AppButton';
import { MentaNarrator } from '@/components/onboarding/MentaNarrator';
import { useTranslation } from '@/lib/localization';

export function MentaTrialNotice() {
  const owner = useAuthStore(state => state.user?.id);
  const overview = useMentaCheckOverview();
  const { t, locale } = useTranslation();
  const router = useRouter();
  const trial = useQuery({
    queryKey: ['menta-check', owner, 'trial'],
    queryFn: RevenueCatAPI.getTrialEnd,
    enabled: Boolean(owner && overview.data?.isPro && overview.data.consented),
    staleTime: 60_000,
  });
  const days = trial.data
    ? Math.ceil((Date.parse(trial.data) - Date.now()) / 86_400_000)
    : null;
  if (
    !trial.data ||
    days === null ||
    days < 0 ||
    days > 3 ||
    !overview.data?.isPro
  )
    return null;
  return (
    <View style={{ paddingVertical: 16, gap: 12 }} testID="menta-trial-ending">
      <MentaNarrator
        state="calm-warning"
        message={t(
          days === 1
            ? 'mentaCheck.ending.titleOne'
            : 'mentaCheck.ending.titleDays',
          { days }
        )}
        detail={t('mentaCheck.ending.detailNoPrice', {
          count: overview.data.stats.checks,
          date: new Date(trial.data).toLocaleDateString(locale, {
            month: 'short',
            day: 'numeric',
          }),
        })}
      />
      <AppButton
        variant="secondary"
        title={t('mentaCheck.ending.options')}
        onPress={() => router.push('/menta-check')}
      />
    </View>
  );
}
