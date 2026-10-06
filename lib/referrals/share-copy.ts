import {
  translate,
  type TranslationValues,
} from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

type TranslateCopy = (
  key: TranslationKey,
  values?: TranslationValues
) => string;

export type ReferralShareCopy = {
  title: string;
  message: string;
};

const copy = (
  key: TranslationKey,
  translateCopy?: TranslateCopy,
  values?: TranslationValues
): string =>
  translateCopy ? translateCopy(key, values) : translate('en-NZ', key, values);

export function resolveReferralShareName(name?: string | null): string | null {
  const trimmed = name?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

export function buildReferralShareCopy(
  link: string,
  name?: string | null,
  translateCopy?: TranslateCopy
): ReferralShareCopy {
  const resolvedName = resolveReferralShareName(name);
  return {
    title: resolvedName
      ? copy('groups.share.referral_title_named', translateCopy, {
          name: resolvedName,
        })
      : copy('groups.share.invite_someone_title', translateCopy),
    message: copy('groups.share.message', translateCopy, { link }),
  };
}
