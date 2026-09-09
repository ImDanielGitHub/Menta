import { useMemo } from 'react';
import { getLocales } from 'expo-localization';
import {
  resolveCatalogueLocale,
  translate,
  type TranslationValues,
} from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';
import { useLocaleStore } from '@/store/locale-store';

export const useTranslation = () => {
  const deviceLocale = getLocales()[0]?.languageTag ?? 'en-NZ';
  const preference = useLocaleStore(state => state.preference);
  const locale = resolveCatalogueLocale(
    preference === 'system' ? deviceLocale : preference
  );

  return useMemo(
    () => ({
      locale,
      t: (key: TranslationKey, values: TranslationValues = {}) =>
        translate(locale, key, values),
    }),
    [locale]
  );
};
