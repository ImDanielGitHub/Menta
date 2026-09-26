import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type OnboardingKey = Extract<keyof EnglishCatalogue, `onboarding.${string}`>;

export const onboardingPtBR = {
  'onboarding.paywall.required':
    'Comece seu compromisso com o Menta Pro. Escolha um plano para continuar.',
  'onboarding.paywall.capacity':
    'Mantenha mais compromissos e grupos ativos ao mesmo tempo.',
  'onboarding.welcome.title': 'Cumpra as promessas que você faz a si mesmo.',
  'onboarding.welcome.body':
    'Comece com uma promessa. Siga um dia de cada vez.',
  'onboarding.welcome.action.start': 'Escolher minha primeira promessa',
  'onboarding.welcome.action.sign_in': 'Já uso a Menta',
  'onboarding.meet.message':
    'Oi, eu sou a Menta! Ajudo as pessoas a fazer o que disseram que fariam.',
  'onboarding.obstacle.question': 'Seja sincero: o que costuma atrapalhar?',
  'onboarding.obstacle.fades': 'Começo com tudo, depois vai perdendo força',
  'onboarding.obstacle.unnoticed': 'Ninguém percebe quando eu pulo',
  'onboarding.obstacle.forget': 'Esqueço até o dia acabar',
  'onboarding.obstacle.too_big': 'Minhas metas ficam grandes demais',
  'onboarding.evidence.stat': '76%',
  'onboarding.evidence.title':
    'Quem dava notícias a um amigo toda semana alcançou a meta, ou chegou à metade, com muito mais frequência.',
  'onboarding.evidence.with_friend': 'Com um amigo',
  'onboarding.evidence.alone': 'Sozinhas',
  'onboarding.evidence.alone_stat': '43%',
  'onboarding.evidence.source':
    'Estudo sobre metas da Dra. Gail Matthews, Dominican University of California. O grupo de 76% também escreveu as metas e assumiu compromissos de ação.',
  'onboarding.evidence.menta': 'É por isso que eu peço uma prova.',
  'onboarding.evidence.action': 'Criar minha primeira promessa',
  'onboarding.proof.question': 'Quando terminar, como você vai me mostrar?',
  'onboarding.duration.question': 'Por quanto tempo você quer manter isso?',
  'onboarding.continue': 'Continuar',
  'onboarding.legal.terms_summary':
    'Como sua conta e suas promessas funcionam.',
  'onboarding.legal.community_summary':
    'Provas adequadas para todos. Respeite a privacidade dos outros.',
  'onboarding.legal.privacy_summary': 'O que a Menta coleta e como usa.',
  'onboarding.preview.question': 'Esta é a sua promessa. Está tudo certo?',
  'onboarding.accountability.question': 'Quem deve conferir sua prova?',
  'onboarding.accountability.trusted': 'Alguém de confiança',
  'onboarding.accountability.trusted_detail':
    'A pessoa vê sua prova e confirma com um toque. Você convida depois de salvar.',
  'onboarding.accountability.private': 'Só eu, por enquanto',
  'onboarding.accountability.private_detail':
    'Mantenha em privado. Você pode convidar alguém depois.',
  'onboarding.accountability.recommended': 'Recomendado',
  'onboarding.accountability.note':
    'Ninguém é adicionado até você enviar um convite.',
} as const satisfies Pick<EnglishCatalogue, OnboardingKey>;
