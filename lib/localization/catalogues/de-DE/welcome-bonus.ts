import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type WelcomeBonusKey = Extract<
  keyof EnglishCatalogue,
  `economy.welcome.${string}`
>;

export const welcomeBonusDeDE = {
  'economy.welcome.accessibility':
    'Du hast {amount} Momenta. Menta hat sie hinzugefügt, als du dein erstes Versprechen gespeichert hast.',
  'economy.welcome.heading': 'Du hast {amount} Momenta',
  'economy.welcome.body':
    'Menta hat sie hinzugefügt, als du dein erstes Versprechen gespeichert hast. Verwende Momenta im Shop. Momenta hat keinen Geldwert.',
  'economy.welcome.close': 'Schließen',
} as const satisfies Pick<EnglishCatalogue, WelcomeBonusKey>;
