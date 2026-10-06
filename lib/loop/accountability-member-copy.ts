import {
  translate,
  type TranslationValues,
} from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

type TranslateCopy = (
  key: TranslationKey,
  values?: TranslationValues
) => string;

const defaultTranslate: TranslateCopy = (key, values) =>
  translate('en-NZ', key, values);

const namedValue = (value?: string | null): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

/**
 * Visible name on the group accountability board. Blank or whitespace names
 * use the same Member fallback as other unnamed people. Never append a
 * user-id fragment.
 */
export function resolveAccountabilityMemberName(
  displayName?: string | null,
  username?: string | null,
  translateCopy: TranslateCopy = defaultTranslate
): string {
  return (
    namedValue(displayName) ??
    namedValue(username) ??
    translateCopy('groups.source.member.fallback')
  );
}
