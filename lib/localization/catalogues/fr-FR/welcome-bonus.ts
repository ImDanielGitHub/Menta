import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type WelcomeBonusKey = Extract<
  keyof EnglishCatalogue,
  `economy.welcome.${string}`
>;

export const welcomeBonusFrFR = {
  'economy.welcome.accessibility':
    'Vous avez {amount} Momenta. Menta les a ajoutés lorsque vous avez enregistré votre première promesse.',
  'economy.welcome.heading': 'Vous avez {amount} Momenta',
  'economy.welcome.body':
    'Menta les a ajoutés lorsque vous avez enregistré votre première promesse. Utilisez les Momenta dans la boutique. Ils n’ont aucune valeur monétaire.',
  'economy.welcome.close': 'Fermer',
} as const satisfies Pick<EnglishCatalogue, WelcomeBonusKey>;
