import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type OnboardingKey = Extract<keyof EnglishCatalogue, `onboarding.${string}`>;

export const onboardingEsES = {
  'onboarding.paywall.disclosure':
    'Puede que necesites una suscripción Pro para empezar tu compromiso. Verás el precio antes de suscribirte.',
  'onboarding.paywall.required':
    'Empieza tu compromiso con Menta Pro. Elige un plan para continuar.',
  'onboarding.paywall.capacity':
    'Mantén más compromisos y grupos activos a la vez.',
  'onboarding.welcome.title': 'Cumple las promesas que te haces.',
  'onboarding.welcome.body':
    'Empieza con una promesa. Ve paso a paso, un día cada vez.',
  'onboarding.welcome.action.start': 'Elegir mi primera promesa',
  'onboarding.welcome.action.sign_in': 'Ya uso Menta',
} as const satisfies Pick<EnglishCatalogue, OnboardingKey>;
