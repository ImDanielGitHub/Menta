export const LANGUAGE_OPTIONS = [
  {
    locale: 'en-NZ',
    flag: '🇳🇿',
    nativeName: 'English',
    regionalName: 'New Zealand',
    shortName: 'English',
  },
  {
    locale: 'de-DE',
    flag: '🇩🇪',
    nativeName: 'Deutsch',
    regionalName: 'Deutschland',
    shortName: 'Deutsch',
  },
  {
    locale: 'es-ES',
    flag: '🇪🇸',
    nativeName: 'Español',
    regionalName: 'España',
    shortName: 'Español',
  },
  {
    locale: 'es-MX',
    flag: '🇲🇽',
    nativeName: 'Español',
    regionalName: 'México',
    shortName: 'Español',
  },
  {
    locale: 'fr-FR',
    flag: '🇫🇷',
    nativeName: 'Français',
    regionalName: 'France',
    shortName: 'Français',
  },
  {
    locale: 'fr-CA',
    flag: '🇨🇦',
    nativeName: 'Français',
    regionalName: 'Canada',
    shortName: 'Français',
  },
  {
    locale: 'pt-BR',
    flag: '🇧🇷',
    nativeName: 'Português',
    regionalName: 'Brasil',
    shortName: 'Português',
  },
  {
    locale: 'pt-PT',
    flag: '🇵🇹',
    nativeName: 'Português',
    regionalName: 'Portugal',
    shortName: 'Português',
  },
] as const;

export type SelectableAppLocale = (typeof LANGUAGE_OPTIONS)[number]['locale'];
export type AppLocalePreference = 'system' | SelectableAppLocale;
export type LanguageOption = (typeof LANGUAGE_OPTIONS)[number];

const exactLocales = new Set<string>(
  LANGUAGE_OPTIONS.map(option => option.locale)
);

export const isSelectableAppLocale = (
  value: unknown
): value is SelectableAppLocale =>
  typeof value === 'string' && exactLocales.has(value);

export const isAppLocalePreference = (
  value: unknown
): value is AppLocalePreference =>
  value === 'system' || isSelectableAppLocale(value);

export const getLanguageOption = (locale: string): LanguageOption => {
  const normalised = locale.replace('_', '-');
  const exact = LANGUAGE_OPTIONS.find(option => option.locale === normalised);
  if (exact) return exact;

  const language = normalised.split('-')[0];
  return (
    LANGUAGE_OPTIONS.find(option => option.locale.split('-')[0] === language) ??
    LANGUAGE_OPTIONS[0]
  );
};

export const hasLanguageOptionFor = (locale: string): boolean => {
  const normalised = locale.replace('_', '-');
  const language = normalised.split('-')[0];
  return LANGUAGE_OPTIONS.some(
    option =>
      option.locale === normalised || option.locale.split('-')[0] === language
  );
};

export const formatLanguageOption = (option: LanguageOption): string =>
  `${option.nativeName} (${option.regionalName})`;
