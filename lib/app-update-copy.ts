import { translate } from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

type TranslateCopy = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

const defaultTranslate: TranslateCopy = (key, values) =>
  translate('en-NZ', key, values);

/**
 * Optional updates can be dismissed. That keeps the installed version.
 * It does not schedule a later reminder.
 */
export function getOptionalUpdateDismissCopy(
  translateCopy: TranslateCopy = defaultTranslate
): string {
  return translateCopy('sourceGate.legacyUpdate.notNowAction');
}
