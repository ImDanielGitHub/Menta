import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type OnboardingKey = Extract<keyof EnglishCatalogue, `onboarding.${string}`>;

export const onboardingPtBR = {
  'onboarding.paywall.disclosure':
    'Uma assinatura Pro pode ser necessária para começar seu compromisso. Você verá o preço antes de assinar.',
  'onboarding.paywall.required':
    'Comece seu compromisso com o Menta Pro. Escolha um plano para continuar.',
  'onboarding.paywall.capacity':
    'Mantenha mais compromissos e grupos ativos ao mesmo tempo.',
  'onboarding.welcome.title': 'Cumpra as promessas que você faz a si mesmo.',
  'onboarding.welcome.body':
    'Comece com uma promessa. Siga um dia de cada vez.',
  'onboarding.welcome.action.start': 'Escolher minha primeira promessa',
  'onboarding.welcome.action.sign_in': 'Já uso a Menta',
} as const satisfies Pick<EnglishCatalogue, OnboardingKey>;
