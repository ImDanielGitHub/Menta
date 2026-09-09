import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type WelcomeBonusKey = Extract<
  keyof EnglishCatalogue,
  `economy.welcome.${string}`
>;

export const welcomeBonusPtPT = {
  'economy.welcome.accessibility':
    'Tem {amount} Momenta. A Menta adicionou essa quantia quando a pessoa guardou sua primeira promessa.',
  'economy.welcome.heading': 'Tem {amount} Momenta',
  'economy.welcome.body':
    'A Menta adicionou essa quantia quando a pessoa guardou sua primeira promessa. Use os Momenta na loja. Eles não têm valor em dinheiro.',
  'economy.welcome.close': 'Fechar',
} as const satisfies Pick<EnglishCatalogue, WelcomeBonusKey>;
