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
    'A verificar o estado mais recente das comprovativos e análises.',
  'today.state.loading.action': 'A carregar',
  'today.state.loading.last_confirmed': 'Usar o último estado confirmado',
  'today.state.offline.promise_title': 'A sua promessa continua pendente.',
  'today.state.offline.title': 'Ligação perdida.',
  'today.state.offline.promise_detail':
    'Pode preparar o comprovativo agora. O envio vai esperar a ligação voltar.',
  'today.state.offline.detail':
    'A Menta não consegue atualizar suas promessas agora. Nada mudou neste telemóvel.',
  'today.state.offline.prepare_proof': 'Preparar comprovativo',
  'today.state.load_failed.refresh_title': 'Não foi possível atualizar Hoje.',
  'today.state.load_failed.title': 'Não foi possível carregar Hoje.',
  'today.state.load_failed.refresh_detail':
    'O último estado confirmado continua no ecrã. Nenhum resultado de comprovativo ou análise mudou aqui.',
  'today.state.load_failed.detail': 'Verifique sua ligação e tente novamente.',
  'today.state.streak.unavailable': 'Indisponível',
  'today.state.streak.missed_title': 'Um dia foi perdido. Recomece hoje.',
  'today.state.streak.weekday_missed_title':
    'A pessoa perdeu {weekday}. Recomece hoje.',
  'today.state.streak.previous_detail':
    'A última sequência terminou em {count} porque o comprovativo de {weekday} não chegou a tempo. O seu histórico continua aqui.',
  'today.state.streak.missed_detail':
    '{weekday} foi registado como perdido. O seu histórico continua aqui.',
  'today.state.streak.return_action': 'Voltar por um dia',
  'today.state.streak.history_action': 'Ver histórico de {count} dias',
  'today.state.streak.history': 'Ver histórico',
  'today.state.streak.previous_label': 'Sequência anterior',
  'today.state.streak.new_label': 'Nova sequência',
  'today.state.streak.starts_today': 'Começa hoje',
  'today.state.streak.supporting_note':
    'Um dia já basta para recomeçar. A Menta não vai apagar a sequência anterior.',
  'today.state.returning.away_days': 'Não faz um registo há {count}.',
  'today.state.returning.away': 'Está longe há algum tempo.',
  'today.state.returning.title': 'Comece de onde a pessoa está.',
  'today.state.returning.detail':
    '{awayCopy} Nada fica escondido e não há nenhuma ecrã de culpa esperando. Escolha uma pequena ação para voltar.',
  'today.state.returning.action': 'Recomeçar',
  'today.state.returning.history': 'Ver meu histórico',
  'today.state.returning.fresh_start': 'Recomeço',
  'today.state.returning.fresh_start_value':
    'O seu histórico continua. A próxima ação é sua.',
  'today.state.returning.supporting_note':
    'Faça uma promessa menor ou abra seu histórico e retome a última.',
  'today.state.no_promises.title': 'Ainda não há nada pendente.',
  'today.state.no_promises.detail':
    'Faça uma promessa e a Menta vai mostrar o que precisa da sua atenção a cada dia.',
  'today.state.no_promises.join_group': 'Entrar num grupo existente',
  'today.state.proof_due.text_detail':
    'Adicione a anotação combinada. Só a pessoa e quem analisa podem vê-la.',
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
    'Verifique sua ligação e tente novamente. O original fica neste telemóvel.',
  'today.state.saved.detail': 'Envie quando a pessoa tiver ligação.',
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
    'Nenhum comprovativo aguarda sua análise.',
} as const satisfies Pick<EnglishCatalogue, TodayStateKey>;
