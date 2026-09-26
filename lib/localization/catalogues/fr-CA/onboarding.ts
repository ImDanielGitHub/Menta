import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type OnboardingKey = Extract<keyof EnglishCatalogue, `onboarding.${string}`>;

export const onboardingFrCA = {
  'onboarding.paywall.required':
    'Commencez votre engagement avec Menta Pro. Choisissez une formule pour continuer.',
  'onboarding.paywall.capacity':
    'Gardez plus d’engagements et de groupes actifs en même temps.',
  'onboarding.welcome.title': 'Tenez les promesses que vous vous faites.',
  'onboarding.welcome.body':
    'Commencez par une promesse. Avancez un jour à la fois.',
  'onboarding.welcome.action.start': 'Choisir ma première promesse',
  'onboarding.welcome.action.sign_in': 'J’utilise déjà Menta',
  'onboarding.meet.message':
    'Salut, c’est moi, Menta! J’aide les gens à faire ce qu’ils ont dit qu’ils feraient.',
  'onboarding.obstacle.question':
    'Soyons honnêtes : qu’est-ce qui vous freine le plus souvent?',
  'onboarding.obstacle.fades': 'Je démarre fort, puis ça s’essouffle',
  'onboarding.obstacle.unnoticed':
    'Personne ne remarque quand je saute un jour',
  'onboarding.obstacle.forget': 'J’oublie jusqu’à la fin de la journée',
  'onboarding.obstacle.too_big': 'Mes objectifs deviennent trop grands',
  'onboarding.evidence.stat': '76 %',
  'onboarding.evidence.title':
    'Ceux qui donnaient des nouvelles à un ami chaque semaine ont bien plus souvent atteint leur objectif, ou au moins la moitié.',
  'onboarding.evidence.with_friend': 'Avec un ami',
  'onboarding.evidence.alone': 'Seuls',
  'onboarding.evidence.alone_stat': '43 %',
  'onboarding.evidence.source':
    'Étude sur les objectifs de la Dre Gail Matthews, Dominican University of California. Le groupe à 76 % avait aussi écrit ses objectifs et pris des engagements concrets.',
  'onboarding.evidence.menta': 'Voilà pourquoi je demande une preuve.',
  'onboarding.evidence.action': 'Créer ma première promesse',
  'onboarding.proof.question':
    'Une fois fait, comment allez-vous me le montrer?',
  'onboarding.duration.question': 'Combien de temps voulez-vous tenir?',
  'onboarding.continue': 'Continuer',
  'onboarding.legal.terms_summary':
    'Le fonctionnement de votre compte et de vos promesses.',
  'onboarding.legal.community_summary':
    'Des preuves adaptées à tous. Respectez la vie privée des autres.',
  'onboarding.legal.privacy_summary':
    'Ce que Menta collecte et comment c’est utilisé.',
  'onboarding.preview.question': 'Voici votre promesse. Tout est correct?',
  'onboarding.accountability.question': 'Qui devrait vérifier votre preuve?',
  'onboarding.accountability.trusted': 'Une personne de confiance',
  'onboarding.accountability.trusted_detail':
    'Elle voit votre preuve et la confirme d’un geste. Vous l’inviterez après l’enregistrement.',
  'onboarding.accountability.private': 'Moi seul pour l’instant',
  'onboarding.accountability.private_detail':
    'Gardez-la privée. Vous pourrez inviter quelqu’un plus tard.',
  'onboarding.accountability.recommended': 'Recommandé',
  'onboarding.accountability.note':
    'Personne n’est ajouté tant que vous n’envoyez pas d’invitation.',
} as const satisfies Pick<EnglishCatalogue, OnboardingKey>;
