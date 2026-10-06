import { translate } from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

type TranslateCopy = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

const defaultTranslate: TranslateCopy = (key, values) =>
  translate('en-NZ', key, values);

export type GroupMemberIdentity = {
  displayName?: string | null;
  username?: string | null;
};

/**
 * Unnamed members are still people in the group. Never fall back to a
 * UUID fragment or an internal identifier.
 */
export function resolveGroupMemberIdentityName(
  member: GroupMemberIdentity,
  translateCopy: TranslateCopy = defaultTranslate
): string {
  const named = member.displayName?.trim() || member.username?.trim();
  if (named) {
    return named;
  }
  return translateCopy('groups.source.member.fallback');
}
