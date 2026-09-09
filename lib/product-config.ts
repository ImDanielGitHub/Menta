import Constants from 'expo-constants';
import { FREE_TIER_QUOTAS as CONTRACT_QUOTAS } from '@/lib/economy/contract';

export const FREE_TIER_QUOTAS = {
  max_active_groups: CONTRACT_QUOTAS.max_active_groups,
  max_groups_per_month: CONTRACT_QUOTAS.max_groups_per_month,
  max_challenges_per_month: CONTRACT_QUOTAS.max_challenges_per_month,
  max_active_promises: CONTRACT_QUOTAS.max_active_promises,
} as const;

const normalizeSkuList = (value: unknown): string[] => {
  const entries = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];
  return entries
    .map(entry => String(entry).trim())
    .filter(
      (entry, index, all) => Boolean(entry) && all.indexOf(entry) === index
    );
};

/**
 * Consumable credit products remain disabled until an App Store-approved SKU
 * list is supplied by the release configuration.
 */
export const getApprovedCreditSkus = (): string[] => {
  const envValue = process.env.EXPO_PUBLIC_APPROVED_CREDIT_SKUS;
  if (envValue !== undefined) return normalizeSkuList(envValue);

  const extra = Constants.expoConfig?.extra as
    | { commerce?: { approvedCreditSkus?: unknown } }
    | undefined;
  return normalizeSkuList(extra?.commerce?.approvedCreditSkus);
};
