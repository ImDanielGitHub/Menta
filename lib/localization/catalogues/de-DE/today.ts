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
} as const satisfies Partial<Pick<EnglishCatalogue, TodayKey>>;
