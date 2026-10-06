import { translate } from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

type TranslateCopy = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

const defaultTranslate: TranslateCopy = (key, values) =>
  translate('en-NZ', key, values);

/**
 * Dismissing a held promise invite from login returns to onboarding.
 * It does not skip sign-in while keeping the invite.
 */
export function getLoginInviteSkipCopy(
  translateCopy: TranslateCopy = defaultTranslate
): string {
  return translateCopy('groups.source.accountability.common.keep_browsing');
}
