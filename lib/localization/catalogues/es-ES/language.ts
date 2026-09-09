import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type LanguageKey = Extract<
  keyof EnglishCatalogue,
  `settings.language.${string}`
>;

export const languageEsES = {
  'settings.language.section': 'Preferencias de la aplicación',
  'settings.language.row.title': 'Idioma de la aplicación',
  'settings.language.row.subtitle': 'Elige el idioma que usa Menta.',
  'settings.language.screen.title': 'Idioma',
  'settings.language.screen.body':
    'Elige el idioma que usa Menta. Las traducciones aún se están revisando, por lo que algunas pantallas siguen en inglés.',
  'settings.language.screen.options': 'Idiomas',
  'settings.language.system.title': 'Usar el idioma del teléfono',
  'settings.language.system.subtitle': '{language}',
  'settings.language.system.unavailable':
    '{device} aún no está disponible. Menta usa {language}.',
  'settings.language.back': 'Volver a Ajustes',
} as const satisfies Pick<EnglishCatalogue, LanguageKey>;
