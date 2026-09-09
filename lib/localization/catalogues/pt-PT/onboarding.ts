import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type OnboardingKey = Extract<
  keyof EnglishCatalogue,
  `onboarding.welcome.${string}`
>;

export const onboardingPtPT = {
  'onboarding.welcome.title':
    'Cumpra as promessas que a pessoa faz a si mesmo.',
  'onboarding.welcome.body':
    'Comece com uma promessa. Siga um dia de cada vez.',
  'onboarding.welcome.action.start': 'Escolher minha primeira promessa',
  'onboarding.welcome.action.sign_in': 'Já uso a Menta',
} as const satisfies Pick<EnglishCatalogue, OnboardingKey>;
