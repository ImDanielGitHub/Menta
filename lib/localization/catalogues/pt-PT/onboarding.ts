import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type OnboardingKey = Extract<keyof EnglishCatalogue, `onboarding.${string}`>;

export const onboardingPtPT = {
  'onboarding.paywall.required':
    'Comece o seu compromisso com o Menta Pro. Escolha um plano para continuar.',
  'onboarding.paywall.capacity':
    'Mantém mais compromissos e grupos ativos ao mesmo tempo.',
  'onboarding.welcome.title': 'Cumpra as promessas que faz a si mesmo.',
  'onboarding.welcome.body':
    'Comece com uma promessa. Siga um dia de cada vez.',
  'onboarding.welcome.action.start': 'Escolher a minha primeira promessa',
  'onboarding.welcome.action.sign_in': 'Já uso a Menta',
  'onboarding.meet.message':
    'Olá, sou a Menta! Ajudo as pessoas a fazer o que disseram que iam fazer.',
  'onboarding.obstacle.question': 'Sê sincero: o que costuma atrapalhar?',
  'onboarding.obstacle.fades': 'Começo com força e depois vou perdendo o ritmo',
  'onboarding.obstacle.unnoticed': 'Ninguém repara quando falho',
  'onboarding.obstacle.forget': 'Esqueço-me até o dia acabar',
  'onboarding.obstacle.too_big': 'Os meus objetivos ficam grandes demais',
  'onboarding.evidence.stat': '76%',
  'onboarding.evidence.title':
    'Quem dava notícias a um amigo todas as semanas atingiu o objetivo, ou chegou a meio, muito mais vezes.',
  'onboarding.evidence.with_friend': 'Com um amigo',
  'onboarding.evidence.alone': 'Sozinhas',
  'onboarding.evidence.alone_stat': '43%',
  'onboarding.evidence.source':
    'Estudo sobre objetivos da Dra. Gail Matthews, Dominican University of California. O grupo dos 76% também escreveu os objetivos e comprometeu-se com ações.',
  'onboarding.evidence.menta': 'É por isso que te peço uma prova.',
  'onboarding.evidence.action': 'Criar a minha primeira promessa',
  'onboarding.proof.question': 'Quando terminar, como me vai mostrar?',
  'onboarding.duration.question': 'Durante quanto tempo quer manter isto?',
  'onboarding.continue': 'Continuar',
  'onboarding.legal.terms_summary':
    'Como funcionam a sua conta e as suas promessas.',
  'onboarding.legal.community_summary':
    'Provas adequadas para todos. Respeita a privacidade dos outros.',
  'onboarding.legal.privacy_summary': 'O que a Menta recolhe e como é usado.',
  'onboarding.preview.question': 'Esta é a sua promessa. Está tudo bem?',
  'onboarding.accountability.question': 'Quem deve verificar a sua prova?',
  'onboarding.accountability.trusted': 'Alguém de confiança',
  'onboarding.accountability.trusted_detail':
    'A pessoa vê o seu comprovativo e confirma com um toque. Convida-a depois de guardar.',
  'onboarding.accountability.private': 'Só eu, por agora',
  'onboarding.accountability.private_detail':
    'Mantém em privado. Podes convidar alguém mais tarde.',
  'onboarding.accountability.recommended': 'Recomendado',
  'onboarding.accountability.note':
    'Ninguém é adicionado até enviares um convite.',
} as const satisfies Pick<EnglishCatalogue, OnboardingKey>;
