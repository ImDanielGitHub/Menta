import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type TodayStateKey = Extract<keyof EnglishCatalogue, `today.state.${string}`>;

export const todayStatesPtPT = {
  'today.state.outcome.missed_day': 'o dia perdido',
  'today.state.action.try_again': 'Tentar novamente',
  'today.state.action.see_promise': 'Ver promessa',
  'today.state.action.browse_groups': 'Explorar grupos',
  'today.state.action.make_promise': 'Fazer uma promessa',
  'today.state.protected.title': 'Sequência protegida',
  'today.state.protected.count_continues': ' A sequência continua em {count}.',
  'today.state.protected.freeze_detail':
    'Uma proteção de sequência cobriu o dia perdido de {weekday}. O dia continua no seu histórico.{countCopy}',
  'today.state.protected.detail':
    '{weekday} foi protegido. O dia continua no seu histórico.{countCopy}',
  'today.state.loading.title': 'A carregar Hoje.',
  'today.state.loading.detail':
    'A verificar o estado mais recente dos comprovativos e das análises.',
  'today.state.loading.action': 'A carregar',
  'today.state.loading.last_confirmed': 'Usar o último estado confirmado',
  'today.state.offline.promise_title': 'A sua promessa continua pendente.',
  'today.state.offline.title': 'Ligação perdida.',
  'today.state.offline.promise_detail':
    'Pode preparar o comprovativo agora. O envio vai esperar a ligação voltar.',
  'today.state.offline.detail':
    'A Menta não consegue atualizar as suas promessas agora. Nada mudou neste telemóvel.',
  'today.state.offline.prepare_proof': 'Preparar comprovativo',
  'today.state.load_failed.refresh_title': 'Não foi possível atualizar Hoje.',
  'today.state.load_failed.title': 'Não foi possível carregar Hoje.',
  'today.state.load_failed.refresh_detail':
    'O último estado confirmado continua no ecrã. Nenhum resultado de comprovativo ou análise mudou aqui.',
  'today.state.load_failed.detail':
    'Verifique a sua ligação e tente novamente.',
  'today.state.streak.unavailable': 'Indisponível',
  'today.state.streak.history': 'Ver histórico',
  'today.state.returning.away_days': 'Não faz um registo há {count}.',
  'today.state.returning.away': 'Está longe há algum tempo.',
  'today.state.returning.title': 'Pronto para recomeçar?',
  'today.state.returning.detail':
    '{awayCopy} Nada fica escondido e não há nenhum ecrã de culpa à sua espera. Escolha uma pequena ação para voltar.',
  'today.state.returning.action': 'Recomeçar',
  'today.state.returning.history': 'Ver o meu histórico',
  'today.state.returning.fresh_start': 'Recomeço',
  'today.state.returning.fresh_start_value':
    'O seu histórico continua. A próxima ação é sua.',
  'today.state.returning.supporting_note':
    'Faça uma promessa mais pequena ou abra o seu histórico e retome a última.',
  'today.state.proof_due.text_detail':
    'Adicione a nota combinada. Só o utilizador e quem analisa a podem ver.',
  'today.state.proof_due.text_action': 'Adicionar anotação como comprovativo',
  'today.state.proof_due.video_detail':
    'Adicione o vídeo combinado. Ele fica privado para esta promessa e quem analisa.',
  'today.state.proof_due.video_action': 'Adicionar vídeo como comprovativo',
  'today.state.proof_due.photo_detail':
    'Adicione a fotografia combinada. Ela fica privada para esta promessa e quem analisa.',
  'today.state.proof_due.photo_action':
    'Adicionar fotografia como comprovativo',
  'today.state.proof_due.risk_title': 'Hoje ainda conta.',
  'today.state.proof_due.streak_risk_detail':
    'A sua sequência de {streak} continua ativa. Tente adicionar {proofNoun} até {dueLabel}. O comprovativo ainda conta até meia-noite.',
  'today.state.proof_due.risk_detail':
    'Tente adicionar {proofNoun} até {dueLabel}. O comprovativo ainda conta até meia-noite.',
  'today.state.proof_due.log_action': 'Registar o comprovativo de hoje',
  'today.state.proof_due.risk_note':
    'Nenhuma análise ou resultado mudou. O próximo passo é registar o comprovativo.',
  'today.state.proof_due.title': 'O comprovativo vence hoje.',
  'today.state.saved.unknown_title': 'A Menta não conseguiu confirmar o envio.',
  'today.state.saved.failed_title': 'O comprovativo ficou neste telemóvel.',
  'today.state.saved.title': 'O seu comprovativo está seguro aqui.',
  'today.state.saved.unknown_detail':
    'O original continua guardado. Verifique o estado antes de tentar novamente.',
  'today.state.saved.failed_detail':
    'Verifique a sua ligação e tente novamente. O original fica neste telemóvel.',
  'today.state.saved.detail': 'Envie quando tiver ligação.',
  'today.state.saved.check_action': 'Verificar estado do comprovativo',
  'today.state.saved.retry_action': 'Tentar enviar novamente',
  'today.state.saved.send_action': 'Enviar comprovativo guardado',
  'today.state.uploading.title': 'A enviar o seu comprovativo.',
  'today.state.uploading.detail':
    'Mantenha a Menta aberta até a confirmação do envio.',
  'today.state.uploading.action': 'A enviar comprovativo',
  'today.state.pending.named_title': '{promise} aguarda análise.',
  'today.state.pending.title': 'O seu comprovativo aguarda análise.',
  'today.state.pending.detail':
    'Ela chegou à Menta. O resultado vai aparecer aqui.',
  'today.state.pending.action': 'Ver comprovativo',
  'today.state.correction.title':
    'O seu comprovativo precisa de uma alteração.',
  'today.state.correction.detail':
    'Adicione um comprovativo mais claro para concluir o dia. O original continua guardado.',
  'today.state.correction.action': 'Atualizar comprovativo',
  'today.state.correction.feedback': 'Ver pedido',
  'today.state.review.named_title': '{name} enviou um comprovativo.',
  'today.state.review.title': 'Um comprovativo precisa da sua análise.',
  'today.state.review.detail':
    'Verifique a fotografia. Aprove ou peça uma única correção clara. Cada análise confirmada adiciona {reward} Momenta, até {dailyLimit} por dia.',
  'today.state.review.action': 'Analisar comprovativo',
  'today.state.review.see_group': 'Ver grupo',
  'today.state.review.open_queue': 'Abrir fila',
  'today.state.group_risk.named_title': '{group} precisa de um registo.',
  'today.state.group_risk.title': 'Um grupo precisa de um registo.',
  'today.state.group_risk.named_detail':
    'Abra o grupo para ver o que está pendente.',
  'today.state.group_risk.detail':
    'Abra o grupo para ver quem ainda precisa fazer o registo.',
  'today.state.group_risk.action': 'Abrir grupo',
  'today.state.accepted.named_title': '{promise} está concluída.',
  'today.state.accepted.title': 'O dia está concluído.',
  'today.state.accepted.detail':
    'O seu comprovativo foi aprovado e guardado no seu histórico.',
  'today.state.accepted.named_receipt': '{promise} aprovada',
  'today.state.accepted.receipt': 'Comprovativo aprovado',
  'today.state.accepted.receipt_detail':
    'O resultado de hoje está confirmado no histórico da sua promessa.',
  'today.state.all_clear.review_unknown_title':
    'Nenhum comprovativo está pendente agora.',
  'today.state.all_clear.title': 'Nada precisa da sua atenção agora.',
  'today.state.all_clear.review_unknown_detail':
    'A Menta não conseguiu verificar os pedidos de análise. Atualize Hoje novamente.',
  'today.state.all_clear.detail':
    'Volte quando uma promessa estiver pendente ou alguém enviar um comprovativo.',
  'today.state.all_clear.review_status':
    'Nenhum comprovativo aguarda a sua análise.',
  'today.state.streak.day_one_title': 'Hoje é o dia 1.',
  'today.state.streak.day_one_detail':
    'Adicione a prova de hoje para começar uma nova sequência.',
  'today.state.streak.bubble_run_ended':
    '{weekday} ficou sem prova, por isso a sequência de {count} dias terminou. Fica guardada no seu histórico.',
  'today.state.streak.bubble_missed':
    '{weekday} ficou sem prova. O seu histórico está guardado.',
  'today.state.streak.see_run': 'Ver a sequência de {count} dias',
  'today.state.no_promises.title': 'Comece com uma promessa.',
  'today.state.no_promises.detail':
    'Escolha uma coisa pequena, mostre uma foto rápida por dia e, se quiser, peça a alguém para confirmar.',
  'today.state.no_promises.join_group': 'Tenho um código de convite',
} as const satisfies Pick<EnglishCatalogue, TodayStateKey>;
