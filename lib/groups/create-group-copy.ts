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

const DEFAULT_CREATED_GROUP_DAYS = 14;

export function describeCreatedGroup(
  durationDays: number,
  t: TranslateCopy = defaultTranslate
): string {
  const count =
    Number.isInteger(durationDays) && durationDays > 0
      ? durationDays
      : DEFAULT_CREATED_GROUP_DAYS;

  return t('groups.create.shared_description', { count });
}
