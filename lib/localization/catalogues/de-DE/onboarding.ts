import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type OnboardingKey = Extract<
  keyof EnglishCatalogue,
  `onboarding.welcome.${string}`
>;

export const onboardingDeDE = {
  'onboarding.welcome.title': 'Halte die Versprechen, die du dir selbst gibst.',
  'onboarding.welcome.body':
    'Beginne mit einem Versprechen. Geh einen Tag nach dem anderen an.',
  'onboarding.welcome.action.start': 'Mein erstes Versprechen wählen',
  'onboarding.welcome.action.sign_in': 'Ich nutze Menta bereits',
} as const satisfies Pick<EnglishCatalogue, OnboardingKey>;
