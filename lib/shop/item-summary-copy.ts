import type { TranslationKey } from '@/lib/localization/en-NZ';
import {
  translate,
  type TranslationValues,
} from '@/lib/localization/translate';

import { formatStreakUnlockCopy } from './catalogSupport';
import { normalizeShopCategory } from './powerUpSupport';

type TranslateCopy = (
  key: TranslationKey,
  values?: TranslationValues
) => string;

const defaultTranslate: TranslateCopy = (key, values) =>
  translate('en-NZ', key, values);

export function getShopItemCategoryLabel(
  category: string | null | undefined,
  translateCopy: TranslateCopy = defaultTranslate
): string {
  const normalized = normalizeShopCategory(category);
  if (normalized === 'cosmetic') {
    return translateCopy('commerce.shop.categoryStyle');
  }
  if (normalized === 'ai_upgrade') {
    return translateCopy('commerce.shop.categoryAi');
  }
  return translateCopy('commerce.shop.categoryBoost');
}

export function getShopItemAccountTrail(
  {
    unlockDays,
    cost,
  }: {
    unlockDays?: number | null;
    cost: number;
  },
  translateCopy: TranslateCopy = defaultTranslate
): string {
  if (typeof unlockDays === 'number' && unlockDays > 0) {
    return formatStreakUnlockCopy(unlockDays, translateCopy);
  }
  if (cost > 0) {
    return translateCopy('commerce.shop.spendBalance', {
      amount: cost.toLocaleString(),
    });
  }
  return translateCopy('commerce.shop.free');
}

export function getShopItemAccountSummary(
  {
    category,
    displayName,
    primaryState,
    hideTrail,
    unlockDays,
    cost,
  }: {
    category?: string | null;
    displayName: string;
    primaryState: string;
    hideTrail: boolean;
    unlockDays?: number | null;
    cost: number;
  },
  translateCopy: TranslateCopy = defaultTranslate
): {
  categoryLabel: string;
  trail: string | null;
  accessibilityLabel: string;
} {
  const categoryLabel = getShopItemCategoryLabel(category, translateCopy);
  const trail = hideTrail
    ? null
    : getShopItemAccountTrail({ unlockDays, cost }, translateCopy);
  const closingFact = trail ?? primaryState;

  return {
    categoryLabel,
    trail,
    accessibilityLabel: `${categoryLabel}. ${displayName}. ${primaryState}. ${closingFact}.`,
  };
}
