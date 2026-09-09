import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type ProofRecoveryKey = Extract<
  keyof EnglishCatalogue,
  `proofRecovery.${string}`
>;

export const proofRecoveryFrCA = {
  'proofRecovery.pending.accessibility': 'Preuve en attente de vérification',
  'proofRecovery.pending.title': 'Preuve envoyée pour vérification',
  'proofRecovery.pending.description':
    'La personne qui vérifie peut maintenant la comparer à la promesse. La preuve de {promise} comptera après son approbation.',
  'proofRecovery.pending.status': 'En attente de vérification',
  'proofRecovery.pending.not_counted': 'Ne compte pas encore',
  'proofRecovery.pending.action': 'Vérifier une autre preuve',
  'proofRecovery.pending.more_waiting': '{count} autre en attente',
  'proofRecovery.pending.more_waiting.one': '{count} autre en attente',
  'proofRecovery.pending.more_waiting.other': '{count} autres en attente',
  'proofRecovery.queued.time.waiting': 'En attente d’envoi',
  'proofRecovery.queued.time.requested': 'Envoi demandé à {time}',
  'proofRecovery.queued.type.photo': 'Preuve photo',
  'proofRecovery.queued.type.video': 'Preuve vidéo',
  'proofRecovery.queued.type.text': 'Preuve écrite',
  'proofRecovery.queued.type.saved': 'Preuve enregistrée',
  'proofRecovery.queued.accessibility': 'Preuve en attente d’envoi',
  'proofRecovery.queued.title': 'Preuve en attente d’envoi',
  'proofRecovery.queued.description':
    'Elle est enregistrée sur ce téléphone, mais n’est pas encore arrivée dans Menta. Réessayez lorsque vous serez en ligne.',
  'proofRecovery.queued.meta': '{type} · {time}',
  'proofRecovery.queued.last_try_failed':
    'La dernière tentative n’a pas abouti.',
  'proofRecovery.queued.not_sent': 'Non envoyée',
  'proofRecovery.queued.more_waiting':
    '+{count} autre preuve en attente d’envoi',
  'proofRecovery.queued.more_waiting.one':
    '+{count} autre preuve en attente d’envoi',
  'proofRecovery.queued.more_waiting.other':
    '+{count} autres preuves en attente d’envoi',
  'proofRecovery.queued.retry_accessibility':
    'Réessayer d’envoyer la preuve enregistrée',
  'proofRecovery.queued.sending': 'Nouvel envoi…',
  'proofRecovery.queued.retry': 'Réessayer d’envoyer',
  'proofRecovery.queued.checking': 'Vérification de la preuve enregistrée…',
} as const satisfies Pick<EnglishCatalogue, ProofRecoveryKey>;
