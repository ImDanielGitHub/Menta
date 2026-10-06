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

export type PromiseStateErrorCopy = {
  title: string;
  body: string;
};

/**
 * Promise-state toasts used to say Challenge Error. A person reading their
 * own promise should hear the product noun, not the internal table name.
 */
export const getPromiseStateErrorCopy = (
  localise: TranslateCopy = defaultTranslate
): PromiseStateErrorCopy => ({
  title: localise('domain.error.title.challenge'),
  body: localise('domain.error.challenge'),
});
