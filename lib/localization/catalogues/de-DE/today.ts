import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type TodayKey = Extract<keyof EnglishCatalogue, `today.${string}`>;

export const todayDeDE = {
  'today.progress.streak_days': '{count} Tage',
  'today.progress.streak_days.one': '{count} Tag',
  'today.progress.streak_days.other': '{count} Tage',
  'today.progress.day_of': 'Tag {day} von {total}',
  'today.progress.day': 'Tag {day}',
  'today.progress.current_streak': 'Aktuelle Serie',
  'today.progress.promise': 'Versprechensfortschritt',
  'today.progress.accessibility.current_streak': 'Aktuelle Serie: {value}.',
  'today.progress.accessibility.promise':
    'Fortschritt des Versprechens: {value}.',
  'today.all_clear.due_now': 'jetzt fällig',
  'today.all_clear.accessibility.zero_due': 'Jetzt ist nichts fällig.',
  'today.loading.accessibility': 'Heute wird geladen',
  'today.proof.heading': 'Als Nächstes',
  'today.proof.solo': 'Nur für mich',
  'today.proof.meta': '{group} · Tag {day}/{total} · {status}',
  'today.proof.status.waiting_review': 'Wartet auf Prüfung',
  'today.proof.status.approved': 'Nachweis bestätigt',
  'today.proof.status.correction_requested': 'Neuer Nachweis angefordert',
  'today.proof.status.sent': 'Nachweis gesendet',
  'today.proof.status.due_now': 'Nachweis jetzt fällig',
  'today.proof.status.due': 'Nachweis fällig',
  'today.proof.action.view': 'Ansehen',
  'today.proof.action.update': 'Ändern',
  'today.proof.action.write': 'Schreiben',
  'today.proof.action.record': 'Aufnehmen',
  'today.proof.action.add_photo': 'Foto hinzufügen',
  'today.proof.action.add_proof': 'Nachweis hinzufügen',
  'today.proof.empty.title': 'Noch keine Versprechen',
  'today.proof.empty.body':
    'Wenn du ein Versprechen machst, erscheint hier dein erster Check-in.',
  'today.proof.empty.action': 'Versprechen machen',
  'today.home.streak.caption': 'Tage in Folge',
  'today.home.streak.accessibility':
    'Beste aktuelle Serie: {days}. {status} Zeigt die Serie jedes Versprechens.',
  'today.home.streak.accessibility_none':
    'Noch keine Serie. Zeigt, wie Serien gezählt werden.',
  'today.home.streak.status_kept': 'Heute ist bestätigt.',
  'today.home.streak.status_waiting': 'Dein Nachweis für heute wird geprüft.',
  'today.home.streak.status_due': 'Dein Nachweis für heute ist noch fällig.',
  'today.home.streak.status_risk': 'Dein Nachweis für heute ist bald fällig.',
  'today.home.momenta.caption': 'Momenta',
  'today.home.momenta.accessibility': '{balance} Momenta. Öffnet deine Wallet.',
  'today.home.momenta.accessibility_unknown':
    'Momenta-Guthaben noch nicht bestätigt. Öffnet deine Wallet.',
  'today.home.week.accessibility':
    'Letzte 7 Tage: {count} Tage mit bestätigtem Nachweis.',
  'today.home.week.accessibility.one':
    'Letzte 7 Tage: {count} Tag mit bestätigtem Nachweis.',
  'today.home.week.accessibility.other':
    'Letzte 7 Tage: {count} Tage mit bestätigtem Nachweis.',
  'today.home.streaks.title': 'Deine Serien',
  'today.home.streaks.note':
    'Eine Serie zählt Tage mit bestätigtem Nachweis, nicht Tage mit offenem Versprechen.',
  'today.home.streaks.empty':
    'Deine erste Serie beginnt, wenn jemand deinen Nachweis bestätigt.',
  'today.home.streaks.longest': 'Längste: {days}',
  'today.home.streaks.row_accessibility':
    '{promise}. Serie {days}. {status}. Öffnet den Verlauf.',
  'today.home.receipt.accessibility': 'Heutiges Versprechen. {facts}',
  'today.home.receipt.proof': 'Nachweis',
  'today.home.receipt.progress': 'Fortschritt',
  'today.home.receipt.streak': 'Serie',
  'today.home.receipt.group': 'Gruppe',
  'today.home.receipt.today': 'Heute',
  'today.home.receipt.photo': 'Foto',
  'today.home.receipt.video': 'Video',
  'today.home.receipt.note': 'Notiz',
  'today.home.receipt.status_saved': 'Auf diesem Telefon gespeichert',
  'today.home.receipt.status_sending': 'Wird gesendet',
  'today.home.also.detail': '{where} · {day}',
  'today.home.personal': 'Persönlich',
  'today.home.review_queue': 'Prüfliste öffnen',
  'today.home.bubble.returning': 'Fang da an, wo du gerade stehst.',
  'today.countdown.hours_minutes': '{hours} Std. {minutes} Min.',
  'today.countdown.hours': '{hours} Std.',
  'today.countdown.minutes': '{minutes} Min.',
  'today.countdown.left_proof': 'bleiben für den heutigen Nachweis',
  'today.countdown.left_streak': 'bleiben für deine Serie von {count} Tagen',
  'today.countdown.left_extension': 'bleiben in deiner Verlängerung',
  'today.countdown.note_midnight': 'Nachweise zählen bis Mitternacht.',
  'today.countdown.note_last_hour':
    'Nach Mitternacht gilt dieser Tag als verpasst.',
  'today.countdown.note_extension':
    'Nachweise zählen bis zum Ende deiner Verlängerung.',
  'today.countdown.accessibility': '{duration} {caption}. {note}',
  'today.home.bubble.no_promises': 'Was wolltest du schon lange mal machen?',
} as const satisfies Partial<Pick<EnglishCatalogue, TodayKey>>;
