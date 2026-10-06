import {
  translate,
  type TranslationValues,
} from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

type TranslateCopy = (
  key: TranslationKey,
  values?: TranslationValues
) => string;

const copy = (
  translateCopy: TranslateCopy | undefined,
  key: TranslationKey,
  values?: TranslationValues
): string =>
  translateCopy ? translateCopy(key, values) : translate('en-NZ', key, values);

/** Free accounts stay Member. Confirmed Pro uses the product name. */
export function getProfilePlanLabel(
  isPro: boolean,
  translateCopy?: TranslateCopy
): string {
  return isPro
    ? copy(translateCopy, 'fullAuth.settings.menta_pro')
    : copy(translateCopy, 'groups.source.member.fallback');
}

export function getProfileIdentityMeta(
  username: string,
  isPro: boolean,
  translateCopy?: TranslateCopy
): string {
  return `@${username} · ${getProfilePlanLabel(isPro, translateCopy)}`;
}
