import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type OnboardingKey = Extract<keyof EnglishCatalogue, `onboarding.${string}`>;

export const onboardingFrCA = {
  'onboarding.paywall.disclosure':
    'Un abonnement Pro peut être nécessaire pour commencer votre engagement. Le prix sera affiché avant de vous abonner.',
  'onboarding.paywall.required':
    'Commencez votre engagement avec Menta Pro. Choisissez une formule pour continuer.',
  'onboarding.paywall.capacity':
    'Gardez plus d’engagements et de groupes actifs en même temps.',
  'onboarding.welcome.title': 'Tenez les promesses que vous vous faites.',
  'onboarding.welcome.body':
    'Commencez par une promesse. Avancez un jour à la fois.',
  'onboarding.welcome.action.start': 'Choisir ma première promesse',
  'onboarding.welcome.action.sign_in': 'J’utilise déjà Menta',
} as const satisfies Pick<EnglishCatalogue, OnboardingKey>;
