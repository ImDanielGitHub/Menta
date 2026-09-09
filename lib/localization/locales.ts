export type TextDirection = 'ltr' | 'rtl';

export type AppStoreLocale = {
  code: string;
  language: string;
  direction: TextDirection;
  appLocale: string;
};

/**
 * Apple App Store Connect metadata localisations available as of 28 August
 * 2026. Keep this registry separate from shipped app catalogues: metadata
 * support does not prove that the binary is translated or QA-approved.
 */
export const APP_STORE_LOCALES = [
  { code: 'ar-SA', language: 'Arabic', direction: 'rtl', appLocale: 'ar' },
  { code: 'bn', language: 'Bangla', direction: 'ltr', appLocale: 'bn' },
  { code: 'ca', language: 'Catalan', direction: 'ltr', appLocale: 'ca' },
  {
    code: 'zh-Hans',
    language: 'Chinese (Simplified)',
    direction: 'ltr',
    appLocale: 'zh-Hans',
  },
  {
    code: 'zh-Hant',
    language: 'Chinese (Traditional)',
    direction: 'ltr',
    appLocale: 'zh-Hant',
  },
  { code: 'hr', language: 'Croatian', direction: 'ltr', appLocale: 'hr' },
  { code: 'cs', language: 'Czech', direction: 'ltr', appLocale: 'cs' },
  { code: 'da', language: 'Danish', direction: 'ltr', appLocale: 'da' },
  { code: 'nl-NL', language: 'Dutch', direction: 'ltr', appLocale: 'nl' },
  {
    code: 'en-AU',
    language: 'English (Australia)',
    direction: 'ltr',
    appLocale: 'en-AU',
  },
  {
    code: 'en-CA',
    language: 'English (Canada)',
    direction: 'ltr',
    appLocale: 'en-CA',
  },
  {
    code: 'en-GB',
    language: 'English (U.K.)',
    direction: 'ltr',
    appLocale: 'en-GB',
  },
  {
    code: 'en-US',
    language: 'English (U.S.)',
    direction: 'ltr',
    appLocale: 'en-US',
  },
  { code: 'fi', language: 'Finnish', direction: 'ltr', appLocale: 'fi' },
  { code: 'fr-FR', language: 'French', direction: 'ltr', appLocale: 'fr' },
  {
    code: 'fr-CA',
    language: 'French (Canada)',
    direction: 'ltr',
    appLocale: 'fr-CA',
  },
  { code: 'de-DE', language: 'German', direction: 'ltr', appLocale: 'de' },
  { code: 'el', language: 'Greek', direction: 'ltr', appLocale: 'el' },
  { code: 'gu', language: 'Gujarati', direction: 'ltr', appLocale: 'gu' },
  { code: 'he', language: 'Hebrew', direction: 'rtl', appLocale: 'he' },
  { code: 'hi', language: 'Hindi', direction: 'ltr', appLocale: 'hi' },
  { code: 'hu', language: 'Hungarian', direction: 'ltr', appLocale: 'hu' },
  { code: 'id', language: 'Indonesian', direction: 'ltr', appLocale: 'id' },
  { code: 'it', language: 'Italian', direction: 'ltr', appLocale: 'it' },
  { code: 'ja', language: 'Japanese', direction: 'ltr', appLocale: 'ja' },
  { code: 'kn', language: 'Kannada', direction: 'ltr', appLocale: 'kn' },
  { code: 'ko', language: 'Korean', direction: 'ltr', appLocale: 'ko' },
  { code: 'ms', language: 'Malay', direction: 'ltr', appLocale: 'ms' },
  { code: 'ml', language: 'Malayalam', direction: 'ltr', appLocale: 'ml' },
  { code: 'mr', language: 'Marathi', direction: 'ltr', appLocale: 'mr' },
  { code: 'no', language: 'Norwegian', direction: 'ltr', appLocale: 'nb' },
  { code: 'or', language: 'Odia', direction: 'ltr', appLocale: 'or' },
  { code: 'pl', language: 'Polish', direction: 'ltr', appLocale: 'pl' },
  {
    code: 'pt-BR',
    language: 'Portuguese (Brazil)',
    direction: 'ltr',
    appLocale: 'pt-BR',
  },
  {
    code: 'pt-PT',
    language: 'Portuguese (Portugal)',
    direction: 'ltr',
    appLocale: 'pt-PT',
  },
  { code: 'pa', language: 'Punjabi', direction: 'ltr', appLocale: 'pa-Guru' },
  { code: 'ro', language: 'Romanian', direction: 'ltr', appLocale: 'ro' },
  { code: 'ru', language: 'Russian', direction: 'ltr', appLocale: 'ru' },
  { code: 'sk', language: 'Slovak', direction: 'ltr', appLocale: 'sk' },
  { code: 'sl', language: 'Slovenian', direction: 'ltr', appLocale: 'sl' },
  {
    code: 'es-MX',
    language: 'Spanish (Mexico)',
    direction: 'ltr',
    appLocale: 'es-MX',
  },
  {
    code: 'es-ES',
    language: 'Spanish (Spain)',
    direction: 'ltr',
    appLocale: 'es-ES',
  },
  { code: 'sv', language: 'Swedish', direction: 'ltr', appLocale: 'sv' },
  { code: 'ta', language: 'Tamil', direction: 'ltr', appLocale: 'ta' },
  { code: 'te', language: 'Telugu', direction: 'ltr', appLocale: 'te' },
  { code: 'th', language: 'Thai', direction: 'ltr', appLocale: 'th' },
  { code: 'tr', language: 'Turkish', direction: 'ltr', appLocale: 'tr' },
  { code: 'uk', language: 'Ukrainian', direction: 'ltr', appLocale: 'uk' },
  { code: 'ur', language: 'Urdu', direction: 'rtl', appLocale: 'ur' },
  { code: 'vi', language: 'Vietnamese', direction: 'ltr', appLocale: 'vi' },
] as const satisfies readonly AppStoreLocale[];

export type AppStoreLocaleCode = (typeof APP_STORE_LOCALES)[number]['code'];

export const APP_STORE_LOCALE_COUNT = APP_STORE_LOCALES.length;
