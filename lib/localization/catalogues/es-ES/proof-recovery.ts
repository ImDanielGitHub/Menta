import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type ProofRecoveryKey = Extract<
  keyof EnglishCatalogue,
  `proofRecovery.${string}`
>;

export const proofRecoveryEsES = {
  'proofRecovery.pending.accessibility': 'Prueba pendiente de revisión',
  'proofRecovery.pending.title': 'Prueba enviada para revisión',
  'proofRecovery.pending.description':
    'Ya se puede comparar con la promesa. La prueba de {promise} contará cuando se apruebe.',
  'proofRecovery.pending.status': 'Pendiente de revisión',
  'proofRecovery.pending.not_counted': 'Todavía no cuenta',
  'proofRecovery.pending.action': 'Revisar otra prueba',
  'proofRecovery.pending.more_waiting': '{count} más pendientes',
  'proofRecovery.pending.more_waiting.one': '{count} más pendiente',
  'proofRecovery.pending.more_waiting.other': '{count} más pendientes',
  'proofRecovery.queued.time.waiting': 'Pendiente de envío',
  'proofRecovery.queued.time.requested': 'Envío solicitado a las {time}',
  'proofRecovery.queued.type.photo': 'Prueba con foto',
  'proofRecovery.queued.type.video': 'Prueba con vídeo',
  'proofRecovery.queued.type.text': 'Prueba escrita',
  'proofRecovery.queued.type.saved': 'Prueba guardada',
  'proofRecovery.queued.accessibility': 'Prueba pendiente de envío',
  'proofRecovery.queued.title': 'Prueba pendiente de envío',
  'proofRecovery.queued.description':
    'Está guardada en este teléfono, pero todavía no ha llegado a Menta. Vuelve a intentarlo cuando tengas conexión.',
  'proofRecovery.queued.meta': '{type} · {time}',
  'proofRecovery.queued.last_try_failed': 'El último intento no se completó.',
  'proofRecovery.queued.not_sent': 'Sin enviar',
  'proofRecovery.queued.more_waiting': '+{count} más pendientes de envío',
  'proofRecovery.queued.more_waiting.one': '+{count} más pendiente de envío',
  'proofRecovery.queued.more_waiting.other': '+{count} más pendientes de envío',
  'proofRecovery.queued.retry_accessibility':
    'Volver a enviar la prueba guardada',
  'proofRecovery.queued.sending': 'Enviando de nuevo…',
  'proofRecovery.queued.retry': 'Volver a enviar',
  'proofRecovery.queued.checking': 'Comprobando la prueba guardada…',
} as const satisfies Pick<EnglishCatalogue, ProofRecoveryKey>;
