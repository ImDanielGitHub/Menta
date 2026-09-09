import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type NavigationKey = Extract<keyof EnglishCatalogue, `navigation.${string}`>;

export const navigationDeDE = {
  'navigation.tab.today': 'Heute',
  'navigation.tab.groups': 'Zusammen',
  'navigation.tab.create': 'Erstellen',
  'navigation.tab.profile': 'Profil',
  'navigation.create.solo.title': 'Persönliches Versprechen erstellen',
  'navigation.create.solo.description':
    'Ein Versprechen. Ein Zeitraum für den Nachweis. Noch kein Gruppendruck.',
  'navigation.create.solo.action': 'Persönliches Versprechen erstellen',
  'navigation.create.accountability.title':
    'Jemanden zu einem Versprechen einladen',
  'navigation.create.accountability.description':
    'Wähle, wer mitmacht, Nachweise prüft oder dich unterstützt.',
  'navigation.create.accountability.action': 'Versprechen auswählen',
  'navigation.create.group.title': 'Gruppe erstellen',
  'navigation.create.group.description':
    'Lade andere ein, sobald dein Ablauf für Nachweise klar genug zum Teilen ist.',
  'navigation.create.group.action': 'Gruppe erstellen',
  'navigation.create.recommended': 'Empfohlen',
  'navigation.create.private_promise': 'Privates Versprechen starten',
  'navigation.personal.title': 'Persönliche Versprechen',
  'navigation.personal.accessibility': 'Persönliche Versprechen. {detail}',
  'navigation.personal.view': 'Persönliche Versprechen ansehen',
  'navigation.personal.none': 'Keine aktiven persönlichen Versprechen',
  'navigation.personal.active': '{count} aktive Versprechen',
  'navigation.personal.active.one': '{count} aktives Versprechen',
  'navigation.personal.active.other': '{count} aktive Versprechen',
  'navigation.personal.longest': '{active} · Längste aktive Serie: {days}',
  'navigation.notifications.accessibility': 'Mitteilungseinstellungen',
  'navigation.notifications.hint':
    'Erinnerungen und Gruppenmitteilungen ändern.',
} as const satisfies Pick<EnglishCatalogue, NavigationKey>;
