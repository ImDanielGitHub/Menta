import { translate } from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

type TranslateCopy = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

const defaultTranslate: TranslateCopy = (key, values) =>
  translate('en-NZ', key, values);

/**
 * The accepted legal screen already has current document versions.
 * Reuse the existing agreements-current title instead of a hardcoded
 * English heading.
 */
export function getLegalAcceptedTitleCopy(
  translateCopy: TranslateCopy = defaultTranslate
): string {
  return translateCopy(
    'fullAuth.source.accountability.agreements_current_title'
  );
}
