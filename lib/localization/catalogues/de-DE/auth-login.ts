import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type AuthLoginKey = Extract<keyof EnglishCatalogue, `auth.login.${string}`>;

export const authLoginDeDE = {
  'auth.login.error.keep_promise':
    'Menta konnte dein Versprechen nicht auf diesem Telefon speichern. Versuche es erneut, bevor du fortfährst.',
  'auth.login.error.cancel_recovery':
    'Die Anmeldung wurde abgebrochen, aber Menta konnte den Wiederherstellungsstand nicht speichern. Dein Versprechen ist noch auf diesem Bildschirm. Versuche es erneut.',
  'auth.login.error.provider':
    'Menta konnte die Anmeldung mit {provider} nicht abschließen. Versuche es erneut oder wähle eine andere Anmeldemethode.',
  'auth.login.cancelled.title': 'Anmeldung abgebrochen',
  'auth.login.cancelled.draft_detail':
    'Dein Versprechen ist weiterhin privat auf diesem Telefon. Versuche es erneut oder wähle eine andere Anmeldemethode.',
  'auth.login.cancelled.detail':
    'Es wurde kein Konto verbunden. Versuche es erneut oder wähle eine andere Anmeldemethode.',
  'auth.login.action.retry_apple': 'Apple erneut versuchen',
  'auth.login.action.retry_google': 'Google erneut versuchen',
  'auth.login.action.email': 'E-Mail verwenden',
  'auth.login.action.keep_editing': 'Versprechen weiter bearbeiten',
  'auth.login.draft_title': 'Versprechen speichern',
  'auth.login.title': 'Bei Menta anmelden',
  'auth.login.draft_detail':
    'Dein Versprechen bleibt privat auf diesem Telefon, bis du dich anmeldest.',
  'auth.login.error.title': 'Anmeldung nicht möglich',
  'auth.login.action.apple': 'Mit Apple anmelden',
  'auth.login.action.google': 'Mit Google anmelden',
  'auth.login.action.replay_intro': 'So funktioniert Menta',
  'auth.login.required.join_promise_title':
    'Melde dich an, um diesem Versprechen beizutreten',
  'auth.login.required.join_promise_detail':
    'Deine Einladung bleibt bei deinem Konto. Es wurde noch nichts beigetreten.',
  'auth.login.required.create_promise_title':
    'Melde dich an, um ein Versprechen zu erstellen',
  'auth.login.required.create_promise_detail':
    'Dein Entwurf bleibt auf diesem Telefon, bis du dich anmeldest.',
  'auth.login.required.open_promise_title':
    'Melde dich an, um dieses Versprechen zu öffnen',
  'auth.login.required.open_promise_detail':
    'Menta öffnet dieses Versprechen unter deinem Konto.',
} as const satisfies Pick<EnglishCatalogue, AuthLoginKey>;
