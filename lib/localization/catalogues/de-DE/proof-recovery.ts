import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type ProofRecoveryKey = Extract<
  keyof EnglishCatalogue,
  `proofRecovery.${string}`
>;

export const proofRecoveryDeDE = {
  'proofRecovery.pending.accessibility': 'Nachweis wartet auf Prüfung',
  'proofRecovery.pending.title': 'Nachweis zur Prüfung gesendet',
  'proofRecovery.pending.description':
    'Eine prüfende Person kann ihn jetzt mit dem Versprechen abgleichen. Der Nachweis für {promise} zählt nach der Bestätigung.',
  'proofRecovery.pending.status': 'Wartet auf Prüfung',
  'proofRecovery.pending.not_counted': 'Zählt noch nicht',
  'proofRecovery.pending.action': 'Weiteren Nachweis prüfen',
  'proofRecovery.pending.more_waiting': '{count} weitere warten',
  'proofRecovery.pending.more_waiting.one': '{count} weiterer wartet',
  'proofRecovery.pending.more_waiting.other': '{count} weitere warten',
  'proofRecovery.queued.time.waiting': 'Wartet auf Senden',
  'proofRecovery.queued.time.requested': 'Senden angefordert: {time}',
  'proofRecovery.queued.type.photo': 'Fotonachweis',
  'proofRecovery.queued.type.video': 'Videonachweis',
  'proofRecovery.queued.type.text': 'Textnachweis',
  'proofRecovery.queued.type.saved': 'Gespeicherter Nachweis',
  'proofRecovery.queued.accessibility': 'Nachweis wartet auf Senden',
  'proofRecovery.queued.title': 'Nachweis wartet auf Senden',
  'proofRecovery.queued.description':
    'Er ist auf diesem Telefon gespeichert, aber noch nicht bei Menta angekommen. Versuch es erneut, wenn du online bist.',
  'proofRecovery.queued.meta': '{type} · {time}',
  'proofRecovery.queued.last_try_failed':
    'Der letzte Versuch wurde nicht abgeschlossen.',
  'proofRecovery.queued.not_sent': 'Nicht gesendet',
  'proofRecovery.queued.more_waiting': '+{count} weitere warten auf das Senden',
  'proofRecovery.queued.more_waiting.one':
    '+{count} weiterer wartet auf das Senden',
  'proofRecovery.queued.more_waiting.other':
    '+{count} weitere warten auf das Senden',
  'proofRecovery.queued.retry_accessibility':
    'Gespeicherten Nachweis erneut senden',
  'proofRecovery.queued.sending': 'Wird erneut gesendet…',
  'proofRecovery.queued.retry': 'Erneut senden',
  'proofRecovery.queued.checking': 'Gespeicherter Nachweis wird geprüft…',
} as const satisfies Pick<EnglishCatalogue, ProofRecoveryKey>;
