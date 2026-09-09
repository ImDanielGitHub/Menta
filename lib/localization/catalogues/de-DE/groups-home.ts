import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type GroupsHomeKey = Extract<keyof EnglishCatalogue, `groupsHome.${string}`>;

export const groupsHomeDeDE = {
  'groupsHome.summary.title': 'Gruppen',
  'groupsHome.summary.view_all_accessibility': 'Alle Gruppen ansehen',
  'groupsHome.summary.view_all': 'Alle ansehen',
  'groupsHome.summary.risk.safe': 'Im Plan',
  'groupsHome.summary.risk.at_risk': 'Braucht Aufmerksamkeit',
  'groupsHome.summary.risk.critical': 'Dringend',
  'groupsHome.summary.risk.failed': 'Beendet',
  'groupsHome.summary.risk.expired': 'Archiviert',
  'groupsHome.count.members': '{count} Mitglieder',
  'groupsHome.count.members.one': '{count} Mitglied',
  'groupsHome.count.members.other': '{count} Mitglieder',
  'groupsHome.count.streak': '{count}-Tage-Serie',
  'groupsHome.count.streak.one': '{count}-Tage-Serie',
  'groupsHome.count.streak.other': '{count}-Tage-Serie',
  'groupsHome.summary.meta': '{members} · {streak} · {risk}',
  'groupsHome.invites.title': 'Offene Einladungen',
  'groupsHome.invites.hide_accessibility': 'Offene Einladungen ausblenden',
  'groupsHome.invites.browse_accessibility': 'Offene Einladungen ansehen',
  'groupsHome.invites.hide': 'Ausblenden',
  'groupsHome.invites.browse': 'Ansehen',
  'groupsHome.invites.type.group': 'Gruppe',
  'groupsHome.invites.type.promise': 'Versprechen',
  'groupsHome.invites.saved_title': 'Einladung für {type} gespeichert',
  'groupsHome.invites.saved_detail':
    'Der Code {code} ist auf diesem Telefon gespeichert. Öffne ihn erneut oder lösche ihn, wenn die Einladung nicht mehr funktioniert.',
  'groupsHome.invites.open_saved': 'Gespeicherte Einladung öffnen',
  'groupsHome.invites.clear': 'Löschen',
  'groupsHome.invites.row_meta': '{members} · {streak}',
  'groupsHome.invites.empty_title': 'Keine öffentlichen Gruppen',
  'groupsHome.invites.empty_detail':
    'Prüfe erneut, tritt mit einem Code bei oder mach ein persönliches Versprechen.',
  'groupsHome.invites.check_again': 'Erneut prüfen',
  'groupsHome.invites.join_code': 'Mit Code beitreten',
  'groupsHome.invites.personal_promise': 'Persönliches Versprechen machen',
  'groupsHome.groupAction.title': 'Für deine Gruppen',
  'groupsHome.groupAction.waiting': '{count} warten',
  'groupsHome.groupAction.waiting.one': '{count} wartet',
  'groupsHome.groupAction.waiting.other': '{count} warten',
  'groupsHome.groupAction.review_named': 'Nachweis von {possessiveName} prüfen',
  'groupsHome.groupAction.review': 'Nachweis prüfen',
  'groupsHome.groupAction.review_group_meta':
    '{group} · Mit dem Versprechen abgleichen',
  'groupsHome.groupAction.review_meta': 'Mit dem Versprechen abgleichen',
  'groupsHome.groupAction.review_action': 'Prüfen',
  'groupsHome.groupAction.pressure_named': '{group} braucht einen Check-in',
  'groupsHome.groupAction.pressure_detail':
    'Öffne die Gruppe, um zu sehen, was noch fällig ist.',
  'groupsHome.groupAction.open_action': 'Öffnen',
  'groupsHome.groupAction.empty_title': 'Keine offenen Prüfungen',
  'groupsHome.groupAction.empty_detail':
    'Gerade wartet niemand auf deine Prüfung.',
} as const satisfies Pick<EnglishCatalogue, GroupsHomeKey>;
