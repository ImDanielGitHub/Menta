import {
  translate,
  type TranslationValues,
} from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

export type JoinGroupQuote = {
  cost: number;
  activeGroups: number | null;
  isPro: boolean;
};
type TranslateCopy = (
  key: TranslationKey,
  values?: TranslationValues
) => string;

export type JoinGroupPreview =
  | { kind: 'quota'; limit: number }
  | { kind: 'paid'; cost: number }
  | { kind: 'free' };

const FREE_ACTIVE_GROUP_LIMIT = 2;

export function describeJoinGroupCostNotice(
  cost: number | null,
  translateCopy?: TranslateCopy
): string {
  if (cost === 0) {
    return translateCopy
      ? translateCopy('groups.join.preview_free')
      : translate('en-NZ', 'groups.join.preview_free');
  }

  if (typeof cost === 'number' && cost > 0) {
    return translateCopy
      ? translateCopy('groups.join.preview_paid', { cost })
      : translate('en-NZ', 'groups.join.preview_paid', { cost });
  }

  return translateCopy
    ? translateCopy('groups.join.preview_unknown')
    : translate('en-NZ', 'groups.join.preview_unknown');
}

export function describeJoinGroupPreviewSpend(
  cost: number | null,
  translateCopy?: TranslateCopy
): string {
  if (cost === 0) {
    return translateCopy
      ? translateCopy('groups.join.preview_free_membership')
      : translate('en-NZ', 'groups.join.preview_free_membership');
  }

  if (typeof cost === 'number' && cost > 0) {
    return translateCopy
      ? translateCopy('groups.join.preview_paid_detail', { cost })
      : translate('en-NZ', 'groups.join.preview_paid_detail', { cost });
  }

  return translateCopy
    ? translateCopy('groups.join.preview_unchanged')
    : translate('en-NZ', 'groups.join.preview_unchanged');
}

export function formatJoinGroupSpend(
  cost: number,
  translateCopy?: TranslateCopy
): string {
  return cost === 0
    ? translateCopy
      ? translateCopy('groups.join.receipt.zero')
      : translate('en-NZ', 'groups.join.receipt.zero')
    : translateCopy
      ? translateCopy('groups.join.receipt.spent_value', { cost })
      : translate('en-NZ', 'groups.join.receipt.spent_value', { cost });
}

export function resolveJoinGroupPreview(
  quote: JoinGroupQuote | null
): JoinGroupPreview | null {
  if (!quote) return null;

  if (
    !quote.isPro &&
    typeof quote.activeGroups === 'number' &&
    quote.activeGroups >= FREE_ACTIVE_GROUP_LIMIT
  ) {
    return { kind: 'quota', limit: FREE_ACTIVE_GROUP_LIMIT };
  }

  return quote.cost > 0 ? { kind: 'paid', cost: quote.cost } : { kind: 'free' };
}
