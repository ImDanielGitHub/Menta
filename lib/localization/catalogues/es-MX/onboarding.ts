import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type OnboardingKey = Extract<
  keyof EnglishCatalogue,
  `onboarding.welcome.${string}`
>;

export const onboardingEsMX = {
  'onboarding.welcome.title': 'Cumple las promesas que te haces.',
  'onboarding.welcome.body':
    'Empieza con una promesa. Ve paso a paso, un día a la vez.',
  'onboarding.welcome.action.start': 'Elegir mi primera promesa',
  'onboarding.welcome.action.sign_in': 'Ya uso Menta',
} as const satisfies Pick<EnglishCatalogue, OnboardingKey>;
