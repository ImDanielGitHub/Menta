import { translate } from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

type TranslateCopy = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

const defaultTranslate: TranslateCopy = (key, values) =>
  translate('en-NZ', key, values);

/**
 * Skipping the optional Meta measurement prompt returns to Settings.
 * It does not open the phone tracking prompt.
 */
export function getAdTrackingSkipCopy(
  translateCopy: TranslateCopy = defaultTranslate
): string {
  return translateCopy('fullAuth.shared.back_to_settings');
}
