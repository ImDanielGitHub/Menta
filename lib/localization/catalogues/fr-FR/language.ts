import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type LanguageKey = Extract<
  keyof EnglishCatalogue,
  `settings.language.${string}`
>;

export const languageFrFR = {
  'settings.language.section': 'Préférences de l’app',
  'settings.language.row.title': 'Langue de l’app',
  'settings.language.row.subtitle': 'Choisissez la langue utilisée par Menta.',
  'settings.language.screen.title': 'Langue',
  'settings.language.screen.body':
    'Choisissez la langue utilisée par Menta. Les traductions sont encore en cours de vérification ; certains écrans restent donc en anglais.',
  'settings.language.screen.options': 'Langues',
  'settings.language.system.title': 'Utiliser la langue du téléphone',
  'settings.language.system.subtitle': '{language}',
  'settings.language.system.unavailable':
    '{device} n’est pas encore disponible. Menta utilise {language}.',
  'settings.language.back': 'Retour aux réglages',
} as const satisfies Pick<EnglishCatalogue, LanguageKey>;
