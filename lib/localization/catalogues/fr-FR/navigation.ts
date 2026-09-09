import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type NavigationKey = Extract<keyof EnglishCatalogue, `navigation.${string}`>;

export const navigationFrFR = {
  'navigation.tab.today': 'Aujourd’hui',
  'navigation.tab.groups': 'Ensemble',
  'navigation.tab.create': 'Créer',
  'navigation.tab.profile': 'Profil',
  'navigation.create.solo.title': 'Créer une promesse personnelle',
  'navigation.create.solo.description':
    'Une promesse. Un délai pour envoyer la preuve. Pas encore de pression de groupe.',
  'navigation.create.solo.action': 'Créer une promesse personnelle',
  'navigation.create.accountability.title': 'Inviter quelqu’un à une promesse',
  'navigation.create.accountability.description':
    'Choisissez qui participe, vérifie les preuves ou vous encourage.',
  'navigation.create.accountability.action': 'Choisir une promesse',
  'navigation.create.group.title': 'Créer un groupe',
  'navigation.create.group.description':
    'Invitez d’autres personnes lorsque le fonctionnement des preuves est assez clair pour être partagé.',
  'navigation.create.group.action': 'Créer le groupe',
  'navigation.create.recommended': 'Recommandé',
  'navigation.create.private_promise': 'Commencer une promesse privée',
  'navigation.personal.title': 'Promesses personnelles',
  'navigation.personal.accessibility': 'Promesses personnelles. {detail}',
  'navigation.personal.view': 'Voir vos promesses personnelles',
  'navigation.personal.none': 'Aucune promesse personnelle active',
  'navigation.personal.active': '{count} promesses actives',
  'navigation.personal.active.one': '{count} promesse active',
  'navigation.personal.active.other': '{count} promesses actives',
  'navigation.personal.longest': '{active} · Plus longue série active : {days}',
  'navigation.notifications.accessibility': 'Réglages des notifications',
  'navigation.notifications.hint':
    'Modifiez les rappels et les préférences de notifications des groupes.',
} as const satisfies Pick<EnglishCatalogue, NavigationKey>;
