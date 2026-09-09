import { ECONOMY_CONTRACT_V1 } from '@/lib/economy/contract';
import { enNZ, type TranslationKey } from '@/lib/localization/en-NZ';

export type CreatePromiseQuote = {
  cost: number;
  activePromises: number;
  challengesCreatedThisMonth: number | null;
  isPro: boolean;
};

export type CreatePromiseGate =
  | { allowed: true }
  | { allowed: false; reason: 'active'; limit: number }
  | { allowed: false; reason: 'monthly'; limit: number };

const ACTIVE_LIMIT = ECONOMY_CONTRACT_V1.quotas.max_active_promises;
const MONTHLY_LIMIT = ECONOMY_CONTRACT_V1.quotas.max_challenges_per_month;
const ACTIVE_REASON: 'active' | 'monthly' = 'active';
const MONTHLY_REASON: 'active' | 'monthly' = 'monthly';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readInteger = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0
    ? value
    : null;

export function decodeCreatePromiseQuote(
  contract: unknown,
  quotaStatus?: unknown
): CreatePromiseQuote | null {
  if (!isRecord(contract) || !isRecord(contract.viewer)) {
    return null;
  }

  const viewer = contract.viewer;
  const cost = readInteger(viewer.createChallengeCost);
  const activePromises = readInteger(viewer.activePromises);
  if (cost === null || activePromises === null) {
    return null;
  }

  const monthly = isRecord(quotaStatus)
    ? readInteger(quotaStatus.challenges_created_this_month)
    : null;

  return {
    cost,
    activePromises,
    challengesCreatedThisMonth: monthly,
    isPro: viewer.isPro === true,
  };
}

export function resolveCreatePromiseGate(
  quote: CreatePromiseQuote
): CreatePromiseGate {
  if (quote.isPro) {
    return { allowed: true };
  }

  if (quote.activePromises >= ACTIVE_LIMIT) {
    return { allowed: false, reason: ACTIVE_REASON, limit: ACTIVE_LIMIT };
  }

  if (
    quote.challengesCreatedThisMonth !== null &&
    quote.challengesCreatedThisMonth >= MONTHLY_LIMIT
  ) {
    return { allowed: false, reason: MONTHLY_REASON, limit: MONTHLY_LIMIT };
  }

  return { allowed: true };
}

type EconomyTranslate = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

const defaultTranslate: EconomyTranslate = (key, values = {}) =>
  String(enNZ[key]).replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (match, name) =>
    values[name] === undefined ? match : String(values[name])
  );

export function describeCreatePromiseCost(
  cost: number,
  t: EconomyTranslate = defaultTranslate,
  formatNumber: (value: number) => string = value =>
    new Intl.NumberFormat('en-NZ').format(value)
): string {
  return cost === 0
    ? t('commerce.economy.createFirstFree')
    : t('commerce.economy.createCost', { amount: formatNumber(cost) });
}

export function describeCreatePromiseQuota(
  reason: 'active' | 'monthly',
  t: EconomyTranslate = defaultTranslate
): {
  title: string;
  message: string;
} {
  if (reason === 'active') {
    return {
      title: t('commerce.economy.quotaActiveTitle'),
      message: t('commerce.economy.quotaActiveMessage'),
    };
  }

  return {
    title: t('commerce.economy.quotaMonthlyTitle'),
    message: t('commerce.economy.quotaMonthlyMessage'),
  };
}

export function describeCreatePromiseQuotaError(
  code: string | null,
  message: string,
  t: EconomyTranslate = defaultTranslate
): { reason: 'active' | 'monthly'; title: string; message: string } | null {
  const summary = `${code ?? ''} ${message}`.toUpperCase();
  if (summary.includes('QUOTA_ACTIVE_PROMISES')) {
    return {
      reason: ACTIVE_REASON,
      ...describeCreatePromiseQuota('active', t),
    };
  }
  if (summary.includes('QUOTA_CHALLENGES_MONTH')) {
    return {
      reason: MONTHLY_REASON,
      ...describeCreatePromiseQuota('monthly', t),
    };
  }
  return null;
}
