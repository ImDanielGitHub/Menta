import type { TranslationKey } from '@/lib/localization/en-NZ';
import {
  resolveCatalogueLocale,
  translate,
} from '@/lib/localization/translate';

type Translate = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

const defaultTranslate: Translate = (key, values) =>
  translate('en-NZ', key, values);

const formatApprovedDate = (value: Date, locale: string): string =>
  new Intl.DateTimeFormat(resolveCatalogueLocale(locale), {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(value);

/** Names the kept-promise approval as a receipt, not a system timestamp. */
export const formatMilestoneApprovedAt = (
  value: string | null | undefined,
  locale = 'en-NZ',
  t: Translate = defaultTranslate
): string => {
  if (!value) {
    return t('todayProof.milestone.approved_now');
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return t('todayProof.milestone.approved_now');
  }

  return t('todayProof.milestone.approved_at', {
    date: formatApprovedDate(date, locale),
  });
};
