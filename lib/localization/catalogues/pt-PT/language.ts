import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type LanguageKey = Extract<
  keyof EnglishCatalogue,
  `settings.language.${string}`
>;

export const languagePtPT = {
  'settings.language.section': 'Preferências do app',
  'settings.language.row.title': 'Idioma do app',
  'settings.language.row.subtitle': 'Escolha o idioma usado no Menta.',
  'settings.language.screen.title': 'Idioma',
  'settings.language.screen.body':
    'Escolha o idioma usado no Menta. As traduções ainda estão sendo revisadas, então algumas telas continuam em inglês.',
  'settings.language.screen.options': 'Idiomas',
  'settings.language.system.title': 'Usar o idioma do telemóvel',
  'settings.language.system.subtitle': '{language}',
  'settings.language.system.unavailable':
    '{device} ainda não está disponível. O Menta usa {language}.',
  'settings.language.back': 'Voltar para Definições',
} as const satisfies Pick<EnglishCatalogue, LanguageKey>;
