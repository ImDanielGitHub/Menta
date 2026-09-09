import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type WelcomeBonusKey = Extract<
  keyof EnglishCatalogue,
  `economy.welcome.${string}`
>;

export const welcomeBonusEsMX = {
  'economy.welcome.accessibility':
    'Tienes {amount} Momenta. Menta los agregó cuando guardaste tu primera promesa.',
  'economy.welcome.heading': 'Tienes {amount} Momenta',
  'economy.welcome.body':
    'Menta los agregó cuando guardaste tu primera promesa. Usa Momenta en la tienda. No tienen valor en efectivo.',
  'economy.welcome.close': 'Cerrar',
} as const satisfies Pick<EnglishCatalogue, WelcomeBonusKey>;
