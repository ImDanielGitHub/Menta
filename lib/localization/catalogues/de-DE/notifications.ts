import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type NotificationsKey = Extract<
  keyof EnglishCatalogue,
  `notifications.${string}`
>;

export const notificationsDeDE = {
  'notifications.topbar.back': 'Zurück',
  'notifications.topbar.context': 'Optional',
  'notifications.topbar.title': 'Mitteilungen',
  'notifications.education.title':
    'Möchtest du Erinnerungen für deine Versprechen?',
  'notifications.education.body':
    'Menta kann dich erinnern, bevor ein Nachweis fällig ist und wenn jemand einen Nachweis zur Prüfung sendet. Als Nächstes fragt dein Telefon nach deiner Erlaubnis.',
  'notifications.education.proof_due.title': '„Nachweis ist fällig“',
  'notifications.education.proof_due.body':
    'Wenn die Frist für ein Versprechen näher rückt',
  'notifications.education.review.title':
    '„Ein Nachweis wartet auf deine Prüfung“',
  'notifications.education.review.body':
    'Wenn jemand einen Nachweis für ein gemeinsames Versprechen sendet',
  'notifications.action.turn_on': 'Erinnerungen aktivieren',
  'notifications.action.continue_without': 'Ohne Erinnerungen fortfahren',
  'notifications.action.open_settings': 'Telefoneinstellungen öffnen',
  'notifications.action.retry': 'Erinnerungen erneut einrichten',
  'notifications.action.back_to_settings':
    'Zurück zu den Mitteilungseinstellungen',
  'notifications.permission_prompt.hint':
    'Öffnet die Anfrage deines Telefons für die Mitteilungserlaubnis',
  'notifications.permission_off.title': 'Vorerst keine Erinnerungen',
  'notifications.permission_off.body':
    'Deine Versprechen funktionieren weiterhin. Unter Heute siehst du, was fällig ist. Du kannst Erinnerungen später unter Profil aktivieren.',
  'notifications.permission_off.later.title': 'Später aktivieren',
  'notifications.permission_off.later.body':
    'Öffne Profil und dann Mitteilungen.',
  'notifications.registration_pending.title':
    'Erinnerungen sind noch nicht bereit',
  'notifications.registration_pending.body':
    'Versuche es erneut, bevor du dich auf Erinnerungen verlässt. Du kannst auch ohne Erinnerungen fortfahren und sie später aktivieren.',
  'notifications.phone.title': 'Mitteilungen des Telefons',
  'notifications.phone.allowed': 'Mitteilungen sind erlaubt',
  'notifications.phone.allowed_by_phone': 'Von diesem Telefon erlaubt',
  'notifications.status.on': 'Ein',
  'notifications.menta.title': 'Menta-Erinnerungen',
  'notifications.menta.not_connected': 'Dieses Gerät ist noch nicht verbunden',
  'notifications.menta.connected': 'Dieses Gerät ist verbunden',
  'notifications.status.checking': 'Wird geprüft…',
  'notifications.status.not_ready': 'Nicht bereit',
  'notifications.status.ready': 'Bereit',
  'notifications.granted.title':
    'Dieses Telefon ist für Menta-Mitteilungen bereit',
  'notifications.granted.body':
    'Wähle in den Mitteilungseinstellungen aus, welche Erinnerungen du erhalten möchtest.',
  'notifications.notice.setup_failed.title':
    'Die Einrichtung der Erinnerungen wurde nicht abgeschlossen',
  'notifications.notice.setup_failed.body':
    'Versuche es erneut oder fahre ohne Erinnerungen fort.',
  'notifications.notice.still_off.title':
    'Mitteilungen sind weiterhin ausgeschaltet',
  'notifications.notice.still_off.body':
    'Deine Versprechen funktionieren weiterhin. Menta fragt dich hier nicht noch einmal.',
  'notifications.notice.allowed.title':
    'Dein Telefon erlaubt jetzt Mitteilungen',
  'notifications.notice.allowed.body':
    'Menta schließt die Einrichtung der Erinnerungen auf diesem Telefon ab.',
  'notifications.notice.check_failed.title':
    'Die Mitteilungseinstellung konnte nicht geprüft werden',
  'notifications.notice.continue_later.body':
    'Du kannst ohne Erinnerungen fortfahren und es später erneut versuchen.',
  'notifications.notice.sign_in.title':
    'Melde dich an, um Erinnerungen einzurichten',
  'notifications.notice.sign_in.body':
    'Menta benötigt ein Konto, um die Erinnerungsauswahl für dieses Telefon zu speichern.',
  'notifications.notice.prompt_failed.title':
    'Die Mitteilungsanfrage konnte nicht geöffnet werden',
  'notifications.notice.settings_opening.title':
    'Die Einstellungen deines Telefons werden geöffnet',
  'notifications.notice.settings_opening.body':
    'Wähle aus, ob Menta Mitteilungen senden darf. Kehre danach hierher zurück.',
  'notifications.notice.settings_failed.title':
    'Die Einstellungen konnten nicht geöffnet werden',
  'notifications.notice.settings_failed.body':
    'Öffne die Einstellungen deines Telefons, wähle Menta und dann Mitteilungen, um diese Erlaubnis zu ändern.',
  'notifications.onboarding.title': 'Verpasse den Moment nicht.',
  'notifications.onboarding.body':
    'Menta benötigt die Erlaubnis, dir Erinnerungen zu senden, wenn ein Nachweis fällig ist oder jemand deine Prüfung braucht.',
  'notifications.onboarding.trust':
    'Nur die Erinnerungen, die du auswählst. Jederzeit änderbar.',
  'notifications.onboarding.card.title': 'Nachweis in 30 Min. fällig',
  'notifications.onboarding.card.body':
    'Du hast es versprochen. Zieh es durch.',
  'notifications.onboarding.action.turn_on': 'Mitteilungen aktivieren',
  'notifications.onboarding.action.not_now': 'Jetzt nicht',
  'notifications.onboarding.permission_off.title': 'Kein Problem.',
  'notifications.onboarding.permission_off.body':
    'Menta funktioniert auch ohne Mitteilungen. Du kannst Erinnerungen später in den Einstellungen aktivieren.',
  'notifications.onboarding.permission_off.action': 'Weiter',
  'notifications.onboarding.permission_off.settings': 'Einstellungen öffnen',
  'notifications.onboarding.granted.title': 'Alles bereit.',
  'notifications.onboarding.granted.body':
    'Menta verbindet die Erinnerungen nach deiner Anmeldung.',
  'notifications.onboarding.granted.action': 'Zur Anmeldung',
  'notifications.onboarding.card.accessibility':
    'Menta-Mitteilungsvorschau. Nachweis in 30 Minuten fällig. Du hast es versprochen. Zieh es durch.',
} as const satisfies Pick<EnglishCatalogue, NotificationsKey>;
