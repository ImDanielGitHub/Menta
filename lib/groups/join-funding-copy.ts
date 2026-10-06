import {
  translate,
  type TranslationValues,
} from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

type TranslateCopy = (
  key: TranslationKey,
  values?: TranslationValues
) => string;

const copy = (
  translateCopy: TranslateCopy | undefined,
  key: TranslationKey,
  values?: TranslationValues
): string =>
  translateCopy ? translateCopy(key, values) : translate('en-NZ', key, values);

/** Prefer the store’s localized receipt; otherwise name the no-debit membership. */
export function getJoinFundingMembershipWithoutReceiptCopy(
  message?: string | null,
  translateCopy?: TranslateCopy
): string {
  const owned = message?.trim();
  if (owned) return owned;
  return copy(translateCopy, 'groups.funding.member_without_receipt');
}

/** Prefer the store’s localized receipt; otherwise say the join can be retried. */
export function getJoinFundingNoReceiptCopy(
  message?: string | null,
  translateCopy?: TranslateCopy
): string {
  const owned = message?.trim();
  if (owned) return owned;
  return copy(translateCopy, 'groups.funding.no_receipt');
}

export function getJoinFundingRetryLabel(
  translateCopy?: TranslateCopy
): string {
  return copy(translateCopy, 'groups.tab.try_again');
}
