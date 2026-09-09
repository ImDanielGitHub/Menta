import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type LanguageKey = Extract<
  keyof EnglishCatalogue,
  `settings.language.${string}`
>;

export const languageEsMX = {
  'settings.language.section': 'Preferencias de la app',
  'settings.language.row.title': 'Idioma de la app',
  'settings.language.row.subtitle': 'Elige el idioma que usa Menta.',
  'settings.language.screen.title': 'Idioma',
  'settings.language.screen.body':
    'Elige el idioma que usa Menta. Las traducciones todavía están en revisión, así que algunas pantallas siguen en inglés.',
  'settings.language.screen.options': 'Idiomas',
  'settings.language.system.title': 'Usar el idioma del celular',
  'settings.language.system.subtitle': '{language}',
  'settings.language.system.unavailable':
    '{device} todavía no está disponible. Menta usa {language}.',
  'settings.language.back': 'Volver a Configuración',
} as const satisfies Pick<EnglishCatalogue, LanguageKey>;
