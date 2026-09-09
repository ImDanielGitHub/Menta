import { ECONOMY_CONTRACT_V1 } from '@/lib/economy/contract';
import type { TranslationKey } from '@/lib/localization/en-NZ';

type PaywallTranslate = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;
const defaultTranslate: PaywallTranslate = (key, values = {}) => {
  const copy: Record<string, string> = {
    'commerce.paywall.whatProDoes': 'More active promises and groups',
    'commerce.paywall.morePromises':
      'Keep more than {promises} live promises and {groups} groups without hitting the free cap.',
    'commerce.paywall.momentaPeriod': 'Momenta each billing period',
    'commerce.paywall.momentaPeriodDetail':
      '{monthly} each month, or {annual} on the annual plan. Pro lifts the free caps; creates and joins still spend Momenta at the normal price.',
    'commerce.paywall.noRequiredAds': 'No required ad breaks',
    'commerce.paywall.noRequiredAdsDetail':
      'Create and manage promises without required sponsor breaks.',
    'commerce.paywall.quotaGroup.one':
      'The free plan includes up to {limit} active group at a time.',
    'commerce.paywall.quotaGroup.other':
      'The free plan includes up to {limit} active groups at a time.',
    'commerce.paywall.quotaChallenge':
      'The free plan includes {active} live promises at a time, and up to {monthly} new promises each month.',
    'commerce.paywall.quotaKnown':
      'The free plan includes {limit} of these actions.',
    'commerce.paywall.quotaReached':
      'You’ve reached the free limit for this action.',
  };
  return (copy[key] ?? key).replace(/\{(\w+)\}/g, (_, name) =>
    String(values[name] ?? `{${name}}`)
  );
};

export type PaywallQuotaContext = 'challenge' | 'group' | 'general';

export type ProBenefitCopy = {
  title: string;
  text: string;
};

export function getProBenefitCopy(
  t: PaywallTranslate = defaultTranslate
): ProBenefitCopy[] {
  const { monthlyCredits, annualCredits } = ECONOMY_CONTRACT_V1.pro;
  const activePromises = ECONOMY_CONTRACT_V1.quotas.max_active_promises;
  const activeGroups = ECONOMY_CONTRACT_V1.quotas.max_active_groups;

  return [
    {
      title: t('commerce.paywall.whatProDoes'),
      text: t('commerce.paywall.morePromises', {
        promises: activePromises,
        groups: activeGroups,
      }),
    },
    {
      title: t('commerce.paywall.momentaPeriod'),
      text: t('commerce.paywall.momentaPeriodDetail', {
        monthly: monthlyCredits.toLocaleString(),
        annual: annualCredits.toLocaleString(),
      }),
    },
    {
      title: t('commerce.paywall.noRequiredAds'),
      text: t('commerce.paywall.noRequiredAdsDetail'),
    },
  ];
}

export function getQuotaLimitCopy(
  quotaContext: PaywallQuotaContext,
  quotaLimit?: number,
  t: PaywallTranslate = defaultTranslate
): string {
  const activePromises = ECONOMY_CONTRACT_V1.quotas.max_active_promises;
  const monthlyPromises = ECONOMY_CONTRACT_V1.quotas.max_challenges_per_month;
  const activeGroups = ECONOMY_CONTRACT_V1.quotas.max_active_groups;
  const knownLimit =
    typeof quotaLimit === 'number' && Number.isFinite(quotaLimit)
      ? quotaLimit
      : null;

  if (quotaContext === 'group') {
    const limit = knownLimit ?? activeGroups;
    return limit === 1
      ? t('commerce.paywall.quotaGroup.one', { limit, count: limit })
      : t('commerce.paywall.quotaGroup.other', { limit, count: limit });
  }

  if (quotaContext === 'challenge') {
    return t('commerce.paywall.quotaChallenge', {
      active: activePromises,
      monthly: monthlyPromises,
    });
  }

  if (knownLimit !== null) {
    return t('commerce.paywall.quotaKnown', { limit: knownLimit });
  }

  return t('commerce.paywall.quotaReached');
}
