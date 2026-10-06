import { translate } from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

type TranslateCopy = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

const defaultTranslate: TranslateCopy = (key, values) =>
  translate('en-NZ', key, values);

export function isDuplicateAccountError(
  message: string | null | undefined
): boolean {
  return /already|exists|registered/i.test(message ?? '');
}

/**
 * Signup already has this email. The person should sign in instead
 * of creating another account.
 */
export function getEmailAuthDuplicateCopy(
  translateCopy: TranslateCopy = defaultTranslate
): string {
  return translateCopy('fullAuth.residual.paper_auth.duplicate_email');
}
