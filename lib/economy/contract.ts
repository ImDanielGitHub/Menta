import { enNZ, type TranslationKey } from '@/lib/localization/en-NZ';
import { translate } from '@/lib/localization/translate';

export const ECONOMY_CURRENCY_NAME = 'Momenta';

export type EconomyAction =
  | 'create_challenge'
  | 'create_group'
  | 'join_group'
  | 'join_challenge';

export type StreakUnlockKind = 'frame' | 'theme' | 'freeze';

export type StreakUnlock = {
  days: number;
  sku: string;
  kind: StreakUnlockKind;
  label: string;
  benefit: string;
  quantity: number;
};

/**
 * Client copy of the v1 economy contract. Postgres `economy_contract_v1`
 * remains authoritative for prices, quotas, and streak grants.
 *
 * Streaks are the behaviour to protect. Momenta, cosmetics, and freezes are
 * the benefits of keeping one. Breaking a streak never confiscates grants
 * already received.
 */
export const ECONOMY_CONTRACT_V1 = {
  version: 1,
  currency: ECONOMY_CURRENCY_NAME,
  welcomeBonus: 100,
  ads: {
    reward: 10,
    dailyLimit: 5,
    cooldownSeconds: 120,
  },
  review: {
    reward: 8,
    dailyLimit: 20,
  },
  referral: {
    reward: 50,
    annualCap: 10,
  },
  costs: {
    create_challenge: 30,
    create_group: 50,
    join_group: 10,
    join_challenge: 10,
  },
  firsts: {
    firstPromiseCost: 0,
    firstGroupCreateCost: 0,
    firstGroupJoinCost: 0,
  },
  quotas: {
    max_active_groups: 2,
    max_groups_per_month: 2,
    max_challenges_per_month: 4,
    max_active_promises: 3,
  },
  pro: {
    waivesActionCosts: false,
    bypassesQuotas: true,
    hidesRequiredAds: true,
    weeklyCredits: 75,
    monthlyCredits: 300,
    annualCredits: 4000,
    monthlyFreezeGrant: 1,
    weeklyFreezeGrant: 0,
    annualFreezeGrant: 12,
  },
  shop: {
    profile_theme_ember: 100,
    time_extension_1: 30,
    streak_freeze_basic: 50,
  },
  challengeMilestones: [
    { days: 3, momenta: 25 },
    { days: 7, momenta: 50 },
    { days: 14, momenta: 100 },
    { days: 30, momenta: 250 },
    { days: 50, momenta: 500 },
    { days: 100, momenta: 1000 },
  ],
  streakUnlocks: [
    {
      days: 7,
      sku: 'streak_freeze_basic',
      kind: 'freeze',
      label: translate('en-NZ', 'commerce.economy.weekFreezeLabel'),
      benefit: translate('en-NZ', 'commerce.economy.weekFreezeBenefit'),
      quantity: 1,
    },
    {
      days: 30,
      sku: 'streak_freeze_basic',
      kind: 'freeze',
      label: translate('en-NZ', 'commerce.economy.monthFreezeLabel'),
      benefit: translate('en-NZ', 'commerce.economy.monthFreezeBenefit'),
      quantity: 1,
    },
  ] satisfies StreakUnlock[],
} as const;

export type EconomyContractV1 = typeof ECONOMY_CONTRACT_V1;

export const DEFAULT_ACTION_COSTS = ECONOMY_CONTRACT_V1.costs;
export const FREE_TIER_QUOTAS = ECONOMY_CONTRACT_V1.quotas;
export const DEFAULT_AD_REWARD = ECONOMY_CONTRACT_V1.ads.reward;
export const REVIEW_QUEUE_CLEAR_REWARD_AMOUNT =
  ECONOMY_CONTRACT_V1.review.reward;
export const WELCOME_BONUS_AMOUNT = ECONOMY_CONTRACT_V1.welcomeBonus;

export function getActionCost(action: EconomyAction): number {
  return ECONOMY_CONTRACT_V1.costs[action];
}

export function getStreakUnlocksUpTo(days: number): StreakUnlock[] {
  return ECONOMY_CONTRACT_V1.streakUnlocks.filter(
    unlock => unlock.days <= days
  );
}

export function getNextStreakUnlock(days: number): StreakUnlock | null {
  return (
    ECONOMY_CONTRACT_V1.streakUnlocks.find(unlock => unlock.days > days) ?? null
  );
}

export function grantsAccountFreeze(milestoneDays: number): boolean {
  return ECONOMY_CONTRACT_V1.streakUnlocks.some(
    unlock => unlock.kind === 'freeze' && unlock.days === milestoneDays
  );
}

type EconomyTranslate = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

const defaultTranslate: EconomyTranslate = (key, values = {}) =>
  String(enNZ[key]).replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (match, name) =>
    values[name] === undefined ? match : String(values[name])
  );

export function getEarnedFreezeGrantCopy(
  t: EconomyTranslate = defaultTranslate
): string {
  const freezeDays = ECONOMY_CONTRACT_V1.streakUnlocks
    .filter(unlock => unlock.kind === 'freeze')
    .map(unlock => unlock.days);

  if (freezeDays.length === 0) {
    return t('commerce.economy.freezeGrantNone');
  }

  const labels = freezeDays.map(days => `${days}-day`);
  if (labels.length === 1) {
    return t('commerce.economy.freezeGrantOne', { days: labels[0] });
  }
  if (labels.length === 2) {
    return t('commerce.economy.freezeGrantTwo', {
      first: labels[0],
      second: labels[1],
    });
  }

  const leading = labels.slice(0, -1).join(', ');
  const last = labels[labels.length - 1];
  return t('commerce.economy.freezeGrantMany', { leading, last });
}

export function getInventoryEmptyCopy(
  t: EconomyTranslate = defaultTranslate
): string {
  return t('commerce.economy.inventoryEmpty', {
    freeze: getEarnedFreezeGrantCopy(t),
  });
}

export function getReviewRewardHint(): string {
  const { reward, dailyLimit } = ECONOMY_CONTRACT_V1.review;
  return `Each confirmed review adds ${reward} Momenta, up to ${dailyLimit} a day.`;
}
