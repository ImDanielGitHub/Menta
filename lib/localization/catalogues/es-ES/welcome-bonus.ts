import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type WelcomeBonusKey = Extract<
  keyof EnglishCatalogue,
  `economy.welcome.${string}`
>;

export const welcomeBonusEsES = {
  'economy.welcome.accessibility':
    'Tienes {amount} Momenta. Menta los añadió cuando guardaste tu primera promesa.',
  'economy.welcome.heading': 'Tienes {amount} Momenta',
  'economy.welcome.body':
    'Menta los añadió cuando guardaste tu primera promesa. Usa los Momenta en la tienda. No tienen valor monetario.',
  'economy.welcome.close': 'Cerrar',
} as const satisfies Pick<EnglishCatalogue, WelcomeBonusKey>;
