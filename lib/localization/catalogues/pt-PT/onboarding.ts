import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type OnboardingKey = Extract<keyof EnglishCatalogue, `onboarding.${string}`>;

export const onboardingPtPT = {
  'onboarding.paywall.disclosure':
    'Pode ser necessária uma subscrição Pro para começar o teu compromisso. Verás o preço antes de subscreveres.',
  'onboarding.paywall.required':
    'Começa o teu compromisso com o Menta Pro. Escolhe um plano para continuar.',
  'onboarding.paywall.capacity':
    'Mantém mais compromissos e grupos ativos ao mesmo tempo.',
  'onboarding.welcome.title':
    'Cumpra as promessas que a pessoa faz a si mesmo.',
  'onboarding.welcome.body':
    'Comece com uma promessa. Siga um dia de cada vez.',
  'onboarding.welcome.action.start': 'Escolher minha primeira promessa',
  'onboarding.welcome.action.sign_in': 'Já uso a Menta',
} as const satisfies Pick<EnglishCatalogue, OnboardingKey>;
