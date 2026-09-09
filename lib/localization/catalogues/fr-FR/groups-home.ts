import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type GroupsHomeKey = Extract<keyof EnglishCatalogue, `groupsHome.${string}`>;

export const groupsHomeFrFR = {
  'groupsHome.summary.title': 'Groupes',
  'groupsHome.summary.view_all_accessibility': 'Voir tous les groupes',
  'groupsHome.summary.view_all': 'Tout voir',
  'groupsHome.summary.risk.safe': 'Dans les temps',
  'groupsHome.summary.risk.at_risk': 'Demande votre attention',
  'groupsHome.summary.risk.critical': 'Urgent',
  'groupsHome.summary.risk.failed': 'Terminé',
  'groupsHome.summary.risk.expired': 'Archivé',
  'groupsHome.count.members': '{count} membres',
  'groupsHome.count.members.one': '{count} membre',
  'groupsHome.count.members.other': '{count} membres',
  'groupsHome.count.streak': 'série de {count} jours',
  'groupsHome.count.streak.one': 'série de {count} jour',
  'groupsHome.count.streak.other': 'série de {count} jours',
  'groupsHome.summary.meta': '{members} · {streak} · {risk}',
  'groupsHome.invites.title': 'Invitations ouvertes',
  'groupsHome.invites.hide_accessibility': 'Masquer les invitations ouvertes',
  'groupsHome.invites.browse_accessibility':
    'Parcourir les invitations ouvertes',
  'groupsHome.invites.hide': 'Masquer',
  'groupsHome.invites.browse': 'Parcourir',
  'groupsHome.invites.type.group': 'groupe',
  'groupsHome.invites.type.promise': 'promesse',
  'groupsHome.invites.saved_title': 'Invitation de {type} enregistrée',
  'groupsHome.invites.saved_detail':
    'Le code {code} est enregistré sur ce téléphone. Ouvrez-le de nouveau ou effacez-le si l’invitation ne fonctionne plus.',
  'groupsHome.invites.open_saved': 'Ouvrir l’invitation enregistrée',
  'groupsHome.invites.clear': 'Effacer',
  'groupsHome.invites.row_meta': '{members} · {streak}',
  'groupsHome.invites.empty_title': 'Aucun groupe public',
  'groupsHome.invites.empty_detail':
    'Vérifiez de nouveau, rejoignez un groupe avec un code ou faites une promesse personnelle.',
  'groupsHome.invites.check_again': 'Vérifier de nouveau',
  'groupsHome.invites.join_code': 'Rejoindre avec un code',
  'groupsHome.invites.personal_promise': 'Faire une promesse personnelle',
  'groupsHome.groupAction.title': 'Pour vos groupes',
  'groupsHome.groupAction.waiting': '{count} en attente',
  'groupsHome.groupAction.waiting.one': '{count} en attente',
  'groupsHome.groupAction.waiting.other': '{count} en attente',
  'groupsHome.groupAction.review_named':
    'Vérifier la preuve de {possessiveName}',
  'groupsHome.groupAction.review': 'Vérifier une preuve',
  'groupsHome.groupAction.review_group_meta':
    '{group} · Comparez-la à la promesse',
  'groupsHome.groupAction.review_meta': 'Comparez-la à la promesse',
  'groupsHome.groupAction.review_action': 'Vérifier',
  'groupsHome.groupAction.pressure_named': '{group} a besoin d’un suivi',
  'groupsHome.groupAction.pressure_detail':
    'Ouvrez le groupe pour voir ce qui reste à faire.',
  'groupsHome.groupAction.open_action': 'Ouvrir',
  'groupsHome.groupAction.empty_title': 'Aucune validation en attente',
  'groupsHome.groupAction.empty_detail':
    'Personne n’attend votre validation pour le moment.',
} as const satisfies Pick<EnglishCatalogue, GroupsHomeKey>;
