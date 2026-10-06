import {
  translate,
  type TranslationValues,
} from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

type TranslateCopy = (
  key: TranslationKey,
  values?: TranslationValues
) => string;

export type ProfilePhotoErrorKind = 'library' | 'type' | 'size';

export type ProfilePhotoErrorCopy = {
  title: string;
  description: string;
};

const copy = (
  key: TranslationKey,
  translateCopy?: TranslateCopy,
  values?: TranslationValues
): string =>
  translateCopy ? translateCopy(key, values) : translate('en-NZ', key, values);

export function describeProfilePhotoError(
  kind: ProfilePhotoErrorKind,
  translateCopy?: TranslateCopy
): ProfilePhotoErrorCopy {
  switch (kind) {
    case 'library':
      return {
        title: copy(
          'fullAuth.edit_profile.choose_a_profile_photo',
          translateCopy
        ),
        description: copy(
          'fullAuth.report_issue.menta_could_not_open_your_photo_library_try_agai',
          translateCopy
        ),
      };
    case 'type':
      return {
        title: copy(
          'fullAuth.edit_profile.choose_a_different_photo',
          translateCopy
        ),
        description: copy(
          'fullAuth.edit_profile.photo_type_rejected',
          translateCopy
        ),
      };
    case 'size':
      return {
        title: copy(
          'fullAuth.edit_profile.choose_a_different_photo',
          translateCopy
        ),
        description: copy(
          'fullAuth.edit_profile.photo_too_large',
          translateCopy
        ),
      };
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}
