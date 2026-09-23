import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type OnboardingKey = Extract<keyof EnglishCatalogue, `onboarding.${string}`>;

export const onboardingDeDE = {
  'onboarding.paywall.disclosure':
    'Zum Starten deines Vorhabens kann ein Pro-Abo erforderlich sein. Du siehst den Preis, bevor du ein Abo abschließt.',
  'onboarding.paywall.required':
    'Starte dein Vorhaben mit Menta Pro. Wähle einen Tarif, um fortzufahren.',
  'onboarding.paywall.capacity':
    'Halte mehr Vorhaben und Gruppen gleichzeitig aktiv.',
  'onboarding.welcome.title': 'Halte die Versprechen, die du dir selbst gibst.',
  'onboarding.welcome.body':
    'Beginne mit einem Versprechen. Geh einen Tag nach dem anderen an.',
  'onboarding.welcome.action.start': 'Mein erstes Versprechen wählen',
  'onboarding.welcome.action.sign_in': 'Ich nutze Menta bereits',
} as const satisfies Pick<EnglishCatalogue, OnboardingKey>;
