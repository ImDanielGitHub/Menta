import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type ProofRecoveryKey = Extract<
  keyof EnglishCatalogue,
  `proofRecovery.${string}`
>;

export const proofRecoveryPtBR = {
  'proofRecovery.pending.accessibility': 'Comprovação aguardando análise',
  'proofRecovery.pending.title': 'Comprovação enviada para análise',
  'proofRecovery.pending.description':
    'Uma pessoa já pode comparar a comprovação com a promessa. A comprovação de {promise} contará depois da aprovação.',
  'proofRecovery.pending.status': 'Aguardando análise',
  'proofRecovery.pending.not_counted': 'Ainda não conta',
  'proofRecovery.pending.action': 'Analisar outra comprovação',
  'proofRecovery.pending.more_waiting': '{count} aguardando análise',
  'proofRecovery.pending.more_waiting.one': '{count} aguardando análise',
  'proofRecovery.pending.more_waiting.other': '{count} aguardando análise',
  'proofRecovery.queued.time.waiting': 'Aguardando envio',
  'proofRecovery.queued.time.requested': 'Envio solicitado às {time}',
  'proofRecovery.queued.type.photo': 'Comprovação com foto',
  'proofRecovery.queued.type.video': 'Comprovação com vídeo',
  'proofRecovery.queued.type.text': 'Comprovação escrita',
  'proofRecovery.queued.type.saved': 'Comprovação salva',
  'proofRecovery.queued.accessibility': 'Comprovação aguardando envio',
  'proofRecovery.queued.title': 'Comprovação aguardando envio',
  'proofRecovery.queued.description':
    'Ela está salva neste celular, mas ainda não chegou à Menta. Tente novamente quando estiver online.',
  'proofRecovery.queued.meta': '{type} · {time}',
  'proofRecovery.queued.last_try_failed':
    'A última tentativa não foi concluída.',
  'proofRecovery.queued.not_sent': 'Não enviada',
  'proofRecovery.queued.more_waiting': '+{count} comprovações aguardando envio',
  'proofRecovery.queued.more_waiting.one':
    '+{count} comprovação aguardando envio',
  'proofRecovery.queued.more_waiting.other':
    '+{count} comprovações aguardando envio',
  'proofRecovery.queued.retry_accessibility':
    'Tentar enviar a comprovação salva novamente',
  'proofRecovery.queued.sending': 'Enviando novamente…',
  'proofRecovery.queued.retry': 'Tentar enviar novamente',
  'proofRecovery.queued.checking': 'Verificando a comprovação salva…',
} as const satisfies Pick<EnglishCatalogue, ProofRecoveryKey>;
