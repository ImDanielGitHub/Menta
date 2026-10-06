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

const trimmedName = (name: string | null | undefined): string =>
  (name ?? '').trim();

/**
 * Identity fallback for headings, subtitles, and QR labels.
 * Recipients of an invite are not in "your group" yet.
 */
export function resolveGroupInviteIdentityName(
  name: string | null | undefined,
  translateCopy: TranslateCopy = defaultTranslate
): string {
  return trimmedName(name) || translateCopy('groups.source.group.fallback');
}

/**
 * Sentence fallback for "Invite people to {group}".
 * "Invite people to the group" reads as ordinary English.
 */
export function resolveGroupInviteSentenceName(
  name: string | null | undefined,
  translateCopy: TranslateCopy = defaultTranslate
): string {
  return (
    trimmedName(name) || translateCopy('groups.join.receipt.group_fallback')
  );
}
