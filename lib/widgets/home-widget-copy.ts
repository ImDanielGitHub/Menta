import { translate } from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

type TranslateCopy = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

const defaultTranslate: TranslateCopy = (key, values) =>
  translate('en-NZ', key, values);

/**
 * Skipping widget setup returns to You. It does not add a widget
 * or persist a later reminder.
 */
export function getHomeWidgetSkipCopy(
  translateCopy: TranslateCopy = defaultTranslate
): string {
  return translateCopy('fullAuth.shared.back_to_you');
}

/**
 * An empty widget list opens solo create. It does not pick an
 * existing promise.
 */
export function getHomeWidgetEmptyCreateCopy(
  translateCopy: TranslateCopy = defaultTranslate
): string {
  return translateCopy('fullAuth.tabs_profile.create_a_promise');
}
