import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type ProofRecoveryKey = Extract<
  keyof EnglishCatalogue,
  `proofRecovery.${string}`
>;

export const proofRecoveryPtPT = {
  'proofRecovery.pending.accessibility': 'Comprovativo a aguardar análise',
  'proofRecovery.pending.title': 'Comprovativo enviado para análise',
  'proofRecovery.pending.description':
    'Uma pessoa já pode comparar o comprovativo com a promessa. O comprovativo de {promise} contará depois da aprovação.',
  'proofRecovery.pending.status': 'a aguardar análise',
  'proofRecovery.pending.not_counted': 'Ainda não conta',
  'proofRecovery.pending.action': 'Analisar outro comprovativo',
  'proofRecovery.pending.more_waiting': '{count} a aguardar análise',
  'proofRecovery.pending.more_waiting.one': '{count} a aguardar análise',
  'proofRecovery.pending.more_waiting.other': '{count} a aguardar análise',
  'proofRecovery.queued.time.waiting': 'a aguardar envio',
  'proofRecovery.queued.time.requested': 'Envio solicitado às {time}',
  'proofRecovery.queued.type.photo': 'Comprovativo com fotografia',
  'proofRecovery.queued.type.video': 'Comprovativo com vídeo',
  'proofRecovery.queued.type.text': 'Comprovativo escrita',
  'proofRecovery.queued.type.saved': 'comprovativo guardado',
  'proofRecovery.queued.accessibility': 'Comprovativo a aguardar envio',
  'proofRecovery.queued.title': 'Comprovativo a aguardar envio',
  'proofRecovery.queued.description':
    'Ela está guardada neste telemóvel, mas ainda não chegou à Menta. Tente novamente quando estiver online.',
  'proofRecovery.queued.meta': '{type} · {time}',
  'proofRecovery.queued.last_try_failed':
    'A última tentativa não foi concluída.',
  'proofRecovery.queued.not_sent': 'Não enviada',
  'proofRecovery.queued.more_waiting':
    '+{count} comprovativos a aguardar envio',
  'proofRecovery.queued.more_waiting.one':
    '+{count} comprovativo a aguardar envio',
  'proofRecovery.queued.more_waiting.other':
    '+{count} comprovativos a aguardar envio',
  'proofRecovery.queued.retry_accessibility':
    'Tentar enviar o comprovativo guardado novamente',
  'proofRecovery.queued.sending': 'A enviar novamente…',
  'proofRecovery.queued.retry': 'Tentar enviar novamente',
  'proofRecovery.queued.checking': 'A verificar o comprovativo guardado…',
} as const satisfies Pick<EnglishCatalogue, ProofRecoveryKey>;
