import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type TodayStateKey = Extract<keyof EnglishCatalogue, `today.state.${string}`>;

export const todayStatesPtBR = {
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
  'today.state.loading.title': 'Carregando Hoje.',
  'today.state.loading.detail':
    'Verificando o estado mais recente das comprovações e análises.',
  'today.state.loading.action': 'Carregando',
  'today.state.loading.last_confirmed': 'Usar o último estado confirmado',
  'today.state.offline.promise_title': 'Sua promessa continua pendente.',
  'today.state.offline.title': 'Conexão perdida.',
  'today.state.offline.promise_detail':
    'Você pode preparar a comprovação agora. O envio vai esperar a conexão voltar.',
  'today.state.offline.detail':
    'A Menta não consegue atualizar suas promessas agora. Nada mudou neste celular.',
  'today.state.offline.prepare_proof': 'Preparar comprovação',
  'today.state.load_failed.refresh_title': 'Não foi possível atualizar Hoje.',
  'today.state.load_failed.title': 'Não foi possível carregar Hoje.',
  'today.state.load_failed.refresh_detail':
    'O último estado confirmado continua na tela. Nenhum resultado de comprovação ou análise mudou aqui.',
  'today.state.load_failed.detail': 'Verifique sua conexão e tente novamente.',
  'today.state.streak.unavailable': 'Indisponível',
  'today.state.streak.history': 'Ver histórico',
  'today.state.returning.away_days': 'Você não faz um registro há {count}.',
  'today.state.returning.away': 'Você está longe há algum tempo.',
  'today.state.returning.title': 'Comece de onde você está.',
  'today.state.returning.detail':
    '{awayCopy} Nada fica escondido e não há nenhuma tela de culpa esperando. Escolha uma pequena ação para voltar.',
  'today.state.returning.action': 'Recomeçar',
  'today.state.returning.history': 'Ver meu histórico',
  'today.state.returning.fresh_start': 'Recomeço',
  'today.state.returning.fresh_start_value':
    'Seu histórico continua. A próxima ação é sua.',
  'today.state.returning.supporting_note':
    'Faça uma promessa menor ou abra seu histórico e retome a última.',
  'today.state.proof_due.text_detail':
    'Adicione a anotação combinada. Só você e a pessoa que analisa podem vê-la.',
  'today.state.proof_due.text_action': 'Adicionar anotação como comprovação',
  'today.state.proof_due.video_detail':
    'Adicione o vídeo combinado. Ele fica privado para esta promessa e a pessoa que analisa.',
  'today.state.proof_due.video_action': 'Adicionar vídeo como comprovação',
  'today.state.proof_due.photo_detail':
    'Adicione a foto combinada. Ela fica privada para esta promessa e a pessoa que analisa.',
  'today.state.proof_due.photo_action': 'Adicionar foto como comprovação',
  'today.state.proof_due.risk_title': 'Hoje ainda conta.',
  'today.state.proof_due.streak_risk_detail':
    'Sua sequência de {streak} continua ativa. Tente adicionar {proofNoun} até {dueLabel}. A comprovação ainda conta até meia-noite.',
  'today.state.proof_due.risk_detail':
    'Tente adicionar {proofNoun} até {dueLabel}. A comprovação ainda conta até meia-noite.',
  'today.state.proof_due.log_action': 'Registrar a comprovação de hoje',
  'today.state.proof_due.risk_note':
    'Nenhuma análise ou resultado mudou. O próximo passo é registrar a comprovação.',
  'today.state.proof_due.title': 'A comprovação vence hoje.',
  'today.state.saved.unknown_title': 'A Menta não conseguiu confirmar o envio.',
  'today.state.saved.failed_title': 'A comprovação ficou neste celular.',
  'today.state.saved.title': 'Sua comprovação está segura aqui.',
  'today.state.saved.unknown_detail':
    'O original continua salvo. Verifique o estado antes de tentar novamente.',
  'today.state.saved.failed_detail':
    'Verifique sua conexão e tente novamente. O original fica neste celular.',
  'today.state.saved.detail': 'Envie quando você tiver conexão.',
  'today.state.saved.check_action': 'Verificar estado da comprovação',
  'today.state.saved.retry_action': 'Tentar enviar novamente',
  'today.state.saved.send_action': 'Enviar comprovação salva',
  'today.state.uploading.title': 'Enviando sua comprovação.',
  'today.state.uploading.detail':
    'Mantenha a Menta aberta até a confirmação do envio.',
  'today.state.uploading.action': 'Enviando comprovação',
  'today.state.pending.named_title': '{promise} aguarda análise.',
  'today.state.pending.title': 'Sua comprovação aguarda análise.',
  'today.state.pending.detail':
    'Ela chegou à Menta. O resultado vai aparecer aqui.',
  'today.state.pending.action': 'Ver comprovação',
  'today.state.correction.title': 'Sua comprovação precisa de uma mudança.',
  'today.state.correction.detail':
    'Adicione uma comprovação mais clara para concluir o dia. O original continua salvo.',
  'today.state.correction.action': 'Atualizar comprovação',
  'today.state.correction.feedback': 'Ver pedido',
  'today.state.review.named_title': '{name} enviou uma comprovação.',
  'today.state.review.title': 'Uma comprovação precisa da sua análise.',
  'today.state.review.detail':
    'Confira a foto. Aprove ou peça uma única correção clara. Cada análise confirmada adiciona {reward} Momenta, até {dailyLimit} por dia.',
  'today.state.review.action': 'Analisar comprovação',
  'today.state.review.see_group': 'Ver grupo',
  'today.state.review.open_queue': 'Abrir fila',
  'today.state.group_risk.named_title': '{group} precisa de um registro.',
  'today.state.group_risk.title': 'Um grupo precisa de um registro.',
  'today.state.group_risk.named_detail':
    'Abra o grupo para ver o que está pendente.',
  'today.state.group_risk.detail':
    'Abra o grupo para ver quem ainda precisa fazer o registro.',
  'today.state.group_risk.action': 'Abrir grupo',
  'today.state.accepted.named_title': '{promise} está concluída.',
  'today.state.accepted.title': 'O dia está concluído.',
  'today.state.accepted.detail':
    'Sua comprovação foi aprovada e salva no seu histórico.',
  'today.state.accepted.named_receipt': '{promise} aprovada',
  'today.state.accepted.receipt': 'Comprovação aprovada',
  'today.state.accepted.receipt_detail':
    'O resultado de hoje está confirmado no histórico da sua promessa.',
  'today.state.all_clear.review_unknown_title':
    'Nenhuma comprovação está pendente agora.',
  'today.state.all_clear.title': 'Nada precisa da sua atenção agora.',
  'today.state.all_clear.review_unknown_detail':
    'A Menta não conseguiu verificar os pedidos de análise. Atualize Hoje novamente.',
  'today.state.all_clear.detail':
    'Volte quando uma promessa estiver pendente ou alguém enviar uma comprovação.',
  'today.state.all_clear.review_status':
    'Nenhuma comprovação aguarda sua análise.',
  'today.state.streak.day_one_title': 'Hoje é o dia 1.',
  'today.state.streak.day_one_detail':
    'Adicione a prova de hoje para começar uma nova sequência.',
  'today.state.streak.bubble_run_ended':
    '{weekday} ficou sem prova, então a sequência de {count} dias terminou. Ela fica salva no seu histórico.',
  'today.state.streak.bubble_missed':
    '{weekday} ficou sem prova. Seu histórico está salvo.',
  'today.state.streak.see_run': 'Ver a sequência de {count} dias',
  'today.state.no_promises.title': 'Comece com uma promessa.',
  'today.state.no_promises.detail':
    'Escolha uma coisa pequena, mostre uma foto rápida por dia e, se quiser, chame alguém para conferir.',
  'today.state.no_promises.join_group': 'Tenho um código de convite',
} as const satisfies Pick<EnglishCatalogue, TodayStateKey>;
