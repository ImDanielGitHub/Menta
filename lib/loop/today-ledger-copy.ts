import type { TranslationKey } from '@/lib/localization/en-NZ';
import { translate } from '@/lib/localization/translate';

type Translate = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

const defaultTranslate: Translate = (key, values) =>
  translate('en-NZ', key, values);

/**
 * Ledger rows share the same non-group label as Today proof cards.
 * Headings stay Personal promises; this receipt uses today.proof.solo.
 */
export const getTodayLedgerScopeLabel = (
  groupName: string | null | undefined,
  t: Translate = defaultTranslate
): string => {
  const name = typeof groupName === 'string' ? groupName.trim() : '';
  return name || t('today.proof.solo');
};
