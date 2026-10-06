import { formatGroupDate } from '@/lib/localization/source-formatters';
import type { TranslationKey } from '@/lib/localization/en-NZ';
import {
  translate,
  type TranslationValues,
} from '@/lib/localization/translate';

type TranslateCopy = (
  key: TranslationKey,
  values?: TranslationValues
) => string;

const defaultTranslate: TranslateCopy = (key, values) =>
  translate('en-NZ', key, values);

export function formatArchivedGroupDate(
  value: string | null | undefined,
  locale: string,
  t: TranslateCopy = defaultTranslate
): string {
  const dateLabel = formatGroupDate(value, locale);
  if (!dateLabel) {
    return t('groups.source.date.archived_unknown');
  }

  return t('groups.source.date.archived', { date: dateLabel });
}
