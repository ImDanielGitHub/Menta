import { deDE } from '@/lib/localization/catalogues/de-DE';
import { esES } from '@/lib/localization/catalogues/es-ES';
import { esMX } from '@/lib/localization/catalogues/es-MX';
import { frCA } from '@/lib/localization/catalogues/fr-CA';
import { frFR } from '@/lib/localization/catalogues/fr-FR';
import { ptBR } from '@/lib/localization/catalogues/pt-BR';
import { ptPT } from '@/lib/localization/catalogues/pt-PT';
import {
  enNZ,
  type RegionalCatalogue,
  type TranslationKey,
} from '@/lib/localization/en-NZ';

export type TranslationValues = Record<string, string | number>;
export type TranslationCatalogue = RegionalCatalogue;

const catalogues: Record<string, TranslationCatalogue> = {
  'de-DE': deDE,
  'en-NZ': enNZ,
  'es-ES': esES,
  'es-MX': esMX,
  'fr-CA': frCA,
  'fr-FR': frFR,
  'pt-BR': ptBR,
  'pt-PT': ptPT,
};

const normaliseLocale = (locale: string): string => locale.replace('_', '-');

export const registerCatalogue = (
  locale: string,
  catalogue: TranslationCatalogue
): void => {
  catalogues[normaliseLocale(locale)] = catalogue;
};

export const resolveCatalogueLocale = (
  locale: string | null | undefined
): string => {
  if (!locale) return 'en-NZ';
  const normalised = normaliseLocale(locale);
  if (catalogues[normalised]) return normalised;

  const language = normalised.split('-')[0];
  const languageMatch = Object.keys(catalogues).find(
    candidate => candidate.split('-')[0] === language
  );
  return languageMatch ?? 'en-NZ';
};

const interpolate = (template: string, values: TranslationValues): string =>
  template.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (match, name: string) => {
    const value = values[name];
    return value === undefined ? match : String(value);
  });

const pluralKey = (
  key: TranslationKey,
  locale: string,
  count: number | undefined
): TranslationKey => {
  if (count === undefined) return key;
  const language = locale.split('-')[0];
  const category =
    language === 'fr'
      ? count === 0 || count === 1
        ? 'one'
        : 'other'
      : count === 1
        ? 'one'
        : 'other';
  const candidate = `${key}.${category}` as TranslationKey;
  return candidate in enNZ ? candidate : key;
};

export const translate = (
  locale: string | null | undefined,
  key: TranslationKey,
  values: TranslationValues = {}
): string => {
  const resolvedLocale = resolveCatalogueLocale(locale);
  const count = Number.isFinite(values.count)
    ? Number(values.count)
    : undefined;
  const resolvedKey = pluralKey(key, resolvedLocale, count);
  const localeTemplate = catalogues[resolvedLocale]?.[resolvedKey];
  const template = localeTemplate ?? enNZ[resolvedKey];
  return interpolate(template, values);
};

export const getRegisteredCatalogueLocales = (): string[] =>
  Object.keys(catalogues).sort();
