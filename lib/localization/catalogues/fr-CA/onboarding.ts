import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type OnboardingKey = Extract<
  keyof EnglishCatalogue,
  `onboarding.welcome.${string}`
>;

export const onboardingFrCA = {
  'onboarding.welcome.title': 'Tenez les promesses que vous vous faites.',
  'onboarding.welcome.body':
    'Commencez par une promesse. Avancez un jour à la fois.',
  'onboarding.welcome.action.start': 'Choisir ma première promesse',
  'onboarding.welcome.action.sign_in': 'J’utilise déjà Menta',
} as const satisfies Pick<EnglishCatalogue, OnboardingKey>;
