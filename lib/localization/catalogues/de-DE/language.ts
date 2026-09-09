import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type LanguageKey = Extract<
  keyof EnglishCatalogue,
  `settings.language.${string}`
>;

export const languageDeDE = {
  'settings.language.section': 'App-Einstellungen',
  'settings.language.row.title': 'App-Sprache',
  'settings.language.row.subtitle':
    'Wähle aus, welche Sprache Menta verwendet.',
  'settings.language.screen.title': 'Sprache',
  'settings.language.screen.body':
    'Wähle aus, welche Sprache Menta verwendet. Die Übersetzungen werden noch geprüft, daher bleiben einige Bildschirme auf Englisch.',
  'settings.language.screen.options': 'Sprachen',
  'settings.language.system.title': 'Sprache des Telefons verwenden',
  'settings.language.system.subtitle': '{language}',
  'settings.language.system.unavailable':
    '{device} ist noch nicht verfügbar. Menta verwendet {language}.',
  'settings.language.back': 'Zurück zu den Einstellungen',
} as const satisfies Pick<EnglishCatalogue, LanguageKey>;
