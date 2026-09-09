import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type FullTodayProofKey = Extract<
  keyof EnglishCatalogue,
  `todayProof.${string}`
>;

export const fullTodayProofPtBR = {
  'todayProof.notifications.daily_bonus': 'Bônus de conquista diário',
  'todayProof.notifications.maintenance': 'Manutenção de rotina',
  'todayProof.today.accountability': 'Responsabilidade de Hoje',
  'todayProof.today.active': 'ativo',
  'todayProof.today.loading_more': 'Carregando mais de Hoje',
  'todayProof.today.create_new': 'Criar algo novo',
  'todayProof.today.new': 'Novo',
  'todayProof.today.ledger_accessibility': '{title}. {detail}',
  'todayProof.today.submission_accessibility': '{promise}, {status}',
  'todayProof.today.group_needs_checkin': '{count} registro necessário',
  'todayProof.today.group_needs_checkin.one': '{count} registro necessário',
  'todayProof.today.group_needs_checkin.other': '{count} registros necessários',
  'todayProof.today.open_group_due':
    'Abra o grupo para ver o que está pendente',
  'todayProof.today.open_review_queue': 'Abra a fila de análise',
  'todayProof.today.loading_home': 'Tela inicial de Hoje',
  'todayProof.today.home_unverified': 'Hoje não pôde ser verificado.',
  'todayProof.today.last_update': 'Exibindo sua última atualização',
  'todayProof.today.loading_accessibility': 'Carregando mais de Hoje',
  'todayProof.today.local_proof_drafts': 'Rascunhos locais de comprovação',
  'todayProof.today.all_clear_accessibility_with_review':
    '0 pendente agora. {status}',
  'todayProof.today.protected_accessibility': 'Sequência protegida. {detail}',
  'todayProof.group.reminders_unavailable': 'Lembretes indisponíveis',
  'todayProof.group.nudge_unavailable_detail':
    'Menta ainda não pode autorizar o destinatário e devolver um comprovante de entrega verificado.',
  'todayProof.group.no_proof_submitted': 'Nenhuma comprovação enviada ainda',
  'todayProof.group.pending_detail': '{media} · ainda não conta',
  'todayProof.group.send_clearer':
    'Envie uma comprovação mais clara para concluir hoje',
  'todayProof.group.new_proof_needed': 'É necessária uma nova comprovação',
  'todayProof.group.needs_clearer': 'Precisa de comprovação mais clara',
  'todayProof.today.layout_classified': 'Layout do aplicativo classificado',
  'todayProof.today.more': 'Mais de hoje',
  'todayProof.today.stale_snapshot':
    'Exibindo a última captura confirmada. Nenhuma comprovação ou resultado de análise mudou aqui.',
  'todayProof.today.risk_checked': '{count} de {total} fizeram registro',
  'todayProof.today.risk_due': '{count} registro ainda pendente',
  'todayProof.today.risk_due.one': '{count} registro ainda pendente',
  'todayProof.today.risk_due.other': '{count} registros ainda pendentes',
  'todayProof.today.risk_title': '{count} registro pendente no {group}',
  'todayProof.today.risk_title.one': '{count} registro pendente no {group}',
  'todayProof.today.risk_title.other': '{count} registros pendentes no {group}',
  'todayProof.today.group_due': '{group} tem um registro pendente',
  'todayProof.today.review_one': 'Analise a comprovação de {name}',
  'todayProof.today.review_many': 'Analise {count} comprovações',
  'todayProof.today.review_many.one': 'Analise {count} comprovação',
  'todayProof.today.review_many.other': 'Analise {count} comprovações',
  'todayProof.today.status_due': 'Comprovação pendente',
  'todayProof.today.status_pending': 'Análise pendente',
  'todayProof.today.status_approved': 'Aprovado',
  'todayProof.today.status_correction': 'Correção necessária',
  'todayProof.create.photo_video': 'Foto ou vídeo',
  'todayProof.create.photo_video_note':
    'Ideal quando a ação ou resultado concluído precisa ser visto.',
  'todayProof.create.text': 'Comprovação em texto',
  'todayProof.create.text_note': 'Ideal para um registro escrito curto.',
  'todayProof.create.promise_question': 'O que você está prometendo?',
  'todayProof.create.promise_question_detail':
    'Nomeie a ação diária e indique exatamente o que conta como concluído.',
  'todayProof.create.proof_question': 'Escolha a comprovação',
  'todayProof.create.proof_solo_detail':
    'Escolha o que enviará quando esta promessa estiver pendente.',
  'todayProof.create.proof_group_detail':
    'Informe aos analistas do grupo o que precisam ver ou ler.',
  'todayProof.create.flexibility_question': 'Escolha a flexibilidade',
  'todayProof.create.flexibility_detail':
    'Decida quanto a agenda pode mudar após iniciar.',
  'todayProof.create.review_question': 'Verifique sua promessa',
  'todayProof.create.review_detail':
    'Analise a promessa, comprovação e agenda antes de criá‑la.',
  'todayProof.create.choose_proof': 'Escolha a comprovação',
  'todayProof.create.choose_schedule': 'Escolha a agenda',
  'todayProof.create.review_promise': 'Analise a promessa',
  'todayProof.create.create_promise': 'Criar promessa',
  'todayProof.create.check_today': 'Verifique Hoje primeiro',
  'todayProof.create.choose_return': 'Escolha um novo início',
  'todayProof.create.your_promise': 'Sua promessa',
  'todayProof.create.name_promise': 'Nomeie a promessa',
  'todayProof.create.name_promise_detail':
    'Use pelo menos três caracteres para que esta promessa seja fácil de encontrar depois.',
  'todayProof.create.say_what_counts': 'Diga o que conta',
  'todayProof.create.say_what_counts_detail':
    'Adicione a regra diária para deixar claro o que significa concluído.',
  'todayProof.create.describe_proof': 'Descreva a comprovação',
  'todayProof.create.describe_proof_detail':
    'Escreva o que a comprovação deve mostrar antes da promessa iniciar.',
  'todayProof.create.session_expired': 'Sessão expirou',
  'todayProof.create.short_name': 'Use pelo menos três caracteres.',
  'todayProof.create.short_rule':
    'Adicione a regra diária antes de criar esta promessa.',
  'todayProof.create.cost_unconfirmed':
    'Não foi possível confirmar o custo da promessa',
  'todayProof.create.cost_unconfirmed_detail':
    'Menta não criou a promessa nem consumiu Momenta. Verifique sua conexão e tente novamente.',
  'todayProof.create.more_momenta': 'Mais Momenta necessário',
  'todayProof.create.promise_created': 'Promessa criada',
  'todayProof.create.draft_not_saved': 'Rascunho não salvo',
  'todayProof.create.sign_in_again':
    'Faça login novamente antes de sair desta promessa.',
  'todayProof.create.draft_not_saved_detail':
    'Menta não pôde salvar este rascunho neste telefone. Fique aqui e tente novamente.',
  'todayProof.create.start_rule_solo':
    'Nomeie a ação e defina a menor quantidade que contará como concluída a cada dia.',
  'todayProof.create.start_rule_group':
    'Nomeie a ação e defina a menor quantidade que você e o grupo contarão como concluída a cada dia.',
  'todayProof.create.use_template': 'Usar um modelo',
  'todayProof.create.start_common': 'Comece a partir de uma promessa comum.',
  'todayProof.create.proof_show_required':
    'O que a comprovação deve mostrar? *',
  'todayProof.create.proof_show': 'O que a comprovação deve mostrar?',
  'todayProof.create.proof_required_hint':
    'Obrigatório. Use ao menos {count} caracteres para descrever a comprovação.',
  'todayProof.create.proof_minimum':
    'Use ao menos {count} caracteres para descrever a comprovação.',
  'todayProof.create.photo_example':
    'Uma foto da caminhada, academia, mesa ou resultado.',
  'todayProof.create.proof_rule':
    'Escreva a regra que a comprovação deve atender.',
  'todayProof.create.proof_rule_label': 'Regra de comprovação',
  'todayProof.create.proof_rule_placeholder':
    'Descreva o que a comprovação deve mostrar ou dizer',
  'todayProof.create.self_review_rule':
    'Deixe a regra clara antes de começar. Sua comprovação conta ao enviá‑la.',
  'todayProof.create.group_proof_rule':
    'Informe aos analistas do grupo o que confirma que foi concluído.',
  'todayProof.create.prompt_optional':
    'Instrução exibida no registro (opcional)',
  'todayProof.create.prompt_placeholder':
    'Adicione uma instrução curta que as pessoas veem antes de enviar',
  'todayProof.create.prompt_helper':
    'Mantenha um único lembrete prático para quem envia a comprovação.',
  'todayProof.create.prompt': 'Instrução exibida no registro',
  'todayProof.create.prompt_example':
    'Exemplo: O que você fez e por quanto tempo?',
  'todayProof.create.edit_wording': 'Editar texto da promessa',
  'todayProof.create.proof_type': 'Tipo de comprovação',
  'todayProof.create.proof_counts': 'O que conta como comprovação',
  'todayProof.create.confirming': 'Confirmando…',
  'todayProof.create.length': 'Duração',
  'todayProof.create.proof_type_daily': 'Comprovação {type}, diária',
  'todayProof.create.private_send':
    'Esta promessa é privada. Sua comprovação conta ao enviá‑la.',
  'todayProof.create.group_review_rule':
    'Membros do grupo verificam a comprovação contra esta regra.',
  'todayProof.create.promise_label': 'Promessa',
  'todayProof.create.title_placeholder':
    'ex.: Caminhada matinal antes do trabalho',
  'todayProof.create.title_helper':
    'Nomeie a ação para reconhecê‑la quando aparecer em Hoje.',
  'todayProof.create.what_counts': 'O que conta?',
  'todayProof.create.description_placeholder':
    'O que você fará a cada dia e o que conta como concluído?',
  'todayProof.create.description_helper':
    'Regras específicas são mais fáceis de seguir e analisar.',
  'todayProof.create.loading_groups': 'Carregando seus grupos...',
  'todayProof.create.keep_solo': 'Mantenha individual',
  'todayProof.create.private_streak':
    'Privado. Sua comprovação conta ao enviá‑la e sua sequência é monitorada.',
  'todayProof.create.start_solo': 'Comece individualmente por enquanto',
  'todayProof.create.start_solo_detail':
    'Você não precisa de um grupo para começar. Crie uma promessa pessoal agora e, depois, crie uma promessa em grupo se a revisão compartilhada ajudar.',
  'todayProof.create.private_promise':
    'Uma promessa privada em que a comprovação conta ao enviá‑la.',
  'todayProof.create.want_group': 'Quer um grupo depois?',
  'todayProof.create.finish_first':
    'Conclua esta configuração primeiro. Você pode criar ou entrar em um grupo depois.',
  'todayProof.create.selected_rules': 'Regras do grupo selecionado',
  'todayProof.create.target': 'Meta de {percent}%',
  'todayProof.create.days_with_proof': 'Dias com comprovação',
  'todayProof.create.misses_allowed': 'Falhas permitidas',
  'todayProof.create.day_unit': '{count} dia',
  'todayProof.create.days_unit': '{count} dias',
  'todayProof.create.group_policy':
    'Este grupo busca comprovação em {percent}% dos dias e permite {count} dias consecutivos sem comprovação.',
  'todayProof.create.personal_policy':
    'Esta promessa é só sua. Escolha uma agenda que ainda consiga cumprir em um dia corrido.',
  'todayProof.create.choose_group_policy':
    'Escolha um grupo para ver suas regras antes de criar a promessa.',
  'todayProof.create.group_commitment': 'Compromisso de grupo de {count} dias',
  'todayProof.create.back_from_creation': 'Voltar da criação de promessa',
  'todayProof.create.restoring_draft': 'Restaurando este rascunho…',
  'todayProof.create.nothing_created': 'Nada foi criado ainda.',
  'todayProof.create.sign_in': 'Entrar',
  'todayProof.create.save_exit': 'Salvar rascunho e sair',
  'todayProof.create.creating': 'Criando sua promessa…',
  'todayProof.create.keep_open':
    'Mantenha esta tela aberta até que seja salvo.',
  'todayProof.create.draft_restored': 'Rascunho restaurado',
  'todayProof.create.private_on_phone':
    'Ainda está privado neste telefone até que você crie.',
  'todayProof.create.check_today_before':
    'Verifique Hoje antes de começar novamente',
  'todayProof.create.missing_after_refresh':
    'Se a promessa ainda faltar após Hoje atualizar, inicie uma nova.',
  'todayProof.create.start_new': 'Iniciar uma nova promessa',
  'todayProof.create.restoring': 'Restaurando…',
  'todayProof.create.template_picker': 'Seletor de modelos',
  'todayProof.create.close_templates': 'Fechar modelos',
  'todayProof.create.use_selected_template': 'Usar modelo selecionado',
  'todayProof.create.write_own': 'Escrever minha própria promessa',
  'todayProof.create.write_promise': 'Escrever uma promessa',
  'todayProof.create.group_saved': 'Promessa de grupo salva',
  'todayProof.create.promise_saved': 'Promessa salva',
  'todayProof.create.group_saved_detail':
    'As regras de comprovação e análise estão salvas. Convide pessoas quando o grupo estiver pronto.',
  'todayProof.create.promise_saved_detail':
    'Publique a primeira comprovação quando estiver pronto para começar.',
  'todayProof.create.view_created': 'Ver promessa criada',
  'todayProof.create.first_due': 'Primeira pendente',
  'todayProof.create.schedule_saved': 'Agenda salva',
  'todayProof.create.group_members_review': 'Análise dos membros do grupo',
  'todayProof.create.proof_counts_when_sent':
    'Comprovação conta ao ser enviada',
  'todayProof.create.group_members': 'Membros do grupo',
  'todayProof.create.only_you': 'Só você',
  'todayProof.create.open_promise': 'Abrir minha promessa',
  'todayProof.create.open_group': 'Abrir grupo',
  'todayProof.create.post_first_proof': 'Publicar primeira comprovação',
  'todayProof.create.back_today': 'Voltar a Hoje',
  'todayProof.create.invite_people': 'Convidar pessoas',
  'todayProof.create.set_reminder': 'Definir lembrete',
  'todayProof.solo.back': 'Voltar',
  'todayProof.solo.items': 'Seus itens',
  'todayProof.solo.items_hint': 'Abre os impulsos e estilos que você possui.',
  'todayProof.solo.create_personal': 'Criar promessa pessoal',
  'todayProof.solo.heading': 'Promessas pessoais',
  'todayProof.solo.detail': 'Registre hoje ou reveja o que completou.',
  'todayProof.solo.no_active': 'Nenhuma promessa ativa',
  'todayProof.solo.no_past': 'Nenhuma promessa passada',
  'todayProof.solo.completed_under_past':
    'Suas promessas concluídas ainda estão disponíveis em Passadas.',
  'todayProof.solo.create_private':
    'Crie uma promessa privada quando estiver pronto para começar.',
  'todayProof.solo.ended': 'Promessas aparecem aqui após o término confirmado.',
  'todayProof.solo.view_past': 'Ver promessas passadas',
  'todayProof.solo.create': 'Criar uma promessa',
  'todayProof.solo.showing_last_update': 'Exibindo sua última atualização',
  'todayProof.solo.load_failed': 'Não foi possível carregar promessas pessoais',
  'todayProof.solo.loading_accessibility': 'Carregando suas promessas pessoais',
  'todayProof.solo.loading': 'Carregando suas promessas…',
  'todayProof.solo.no_personal': 'Você não tem promessas pessoais',
  'todayProof.solo.no_personal_detail':
    'Uma promessa pessoal é uma ação que você se compromete a fazer, com foto como comprovação a cada vez. Você analisa sua própria comprovação.',
  'todayProof.solo.create_group': 'Faça uma promessa com um grupo',
  'todayProof.solo.active_count': 'Ativo {count}',
  'todayProof.solo.past_count': 'Passado {count}',
  'todayProof.solo.no_streak': 'Ainda sem sequência',
  'todayProof.solo.recent_proof': 'Comprovação recente',
  'todayProof.solo.view_promise': 'Ver promessa',
  'todayProof.solo.log_entry': 'Registrar entrada de hoje',
  'todayProof.solo.check_in': 'Registrar hoje',
  'todayProof.solo.view_correction': 'Ver correção',
  'todayProof.solo.view_today_proof': 'Ver comprovação de hoje',
  'todayProof.solo.proof_history': 'Histórico de comprovação',
  'todayProof.solo.text_proof': 'Comprovação em texto',
  'todayProof.solo.video_proof': 'Comprovação em vídeo',
  'todayProof.solo.photo_proof': 'Comprovação em foto',
  'todayProof.solo.past_promise': 'Promessa passada',
  'todayProof.solo.no_current_streak': 'Sem sequência atual',
  'todayProof.solo.open_promise': 'Abrir promessa',
  'todayProof.solo.open_full_promise': 'Abrir promessa completa',
  'todayProof.solo.due_today': 'Pendentes hoje',
  'todayProof.solo.waiting_review': 'Aguardando análise',
  'todayProof.solo.needs_retry': 'Precisa tentar novamente',
  'todayProof.solo.open_accessibility': 'Abrir {promise}',
  'todayProof.solo.promise_meta': 'Promessa de {days} dias · {proof} · Privada',
  'todayProof.solo.completed': 'Concluída',
  'todayProof.solo.past': 'Passada',
  'todayProof.solo.streak': 'Sequência de {count} dias',
  'todayProof.solo.freezes_left': '{count} congelamento restante',
  'todayProof.solo.freezes_left.one': '{count} congelamento restante',
  'todayProof.solo.freezes_left.other': '{count} congelamentos restantes',
  'todayProof.streak.freezes_left': '{count} disponível',
  'todayProof.streak.freezes_left.one': '{count} disponível',
  'todayProof.streak.freezes_left.other': '{count} disponível',
  'todayProof.solo.selected_promise': 'Promessa selecionada',
  'todayProof.solo.promise_meta_short': 'Promessa de {days} dias · {proof}',
  'todayProof.solo.current_streak': 'Sequência atual de {count} dias',
  'todayProof.solo.accepted': 'Aceito',
  'todayProof.promise.time_unavailable': 'Horário indisponível',
  'todayProof.promise.date_unavailable': 'Data indisponível',
  'todayProof.promise.sent_recently': 'Enviado recentemente',
  'todayProof.promise.sent_just_now': 'Enviado agora',
  'todayProof.promise.day_outcome': 'Resultado do dia',
  'todayProof.promise.invite_copied': 'Convite copiado',
  'todayProof.promise.invite_copied_detail':
    'O código da promessa está pronto para colar.',
  'todayProof.promise.copy_failed': 'Falha ao copiar',
  'todayProof.promise.copy_failed_detail':
    'O código de convite ainda está visível aqui. Tente copiar novamente.',
  'todayProof.promise.share_failed': 'Falha ao compartilhar',
  'todayProof.promise.share_failed_detail':
    'Menta não pôde abrir a tela de compartilhamento. Copie o código ou tente novamente.',
  'todayProof.promise.close_invite': 'Fechar modal de convite da promessa',
  'todayProof.promise.copy_invite': 'Copiar código de convite',
  'todayProof.promise.copy_code': 'Copiar código',
  'todayProof.promise.share_invite': 'Compartilhar convite',
  'todayProof.promise.actions': 'Ações da promessa',
  'todayProof.promise.refresh_failed':
    'Não foi possível atualizar os detalhes da promessa.',
  'todayProof.promise.refresh_data_failed':
    'Não foi possível atualizar os dados.',
  'todayProof.promise.unsupported_proof':
    'Este método de comprovação ainda não é suportado aqui.',
  'todayProof.promise.solo_no_invite':
    'Promessas individuais não utilizam links de convite.',
  'todayProof.promise.invite_unavailable':
    'Menta não pôde gerar um código de convite. Nada mudou.',
  'todayProof.promise.try_later': 'Por favor, tente novamente mais tarde.',
  'todayProof.promise.boost_failed': 'Falha ao ativar impulso:',
  'todayProof.promise.boost_failed_detail':
    'Menta não pôde confirmar se o tempo foi adicionado. Verifique novamente antes de usar outra extensão.',
  'todayProof.promise.waiting_review': 'Aguardando análise',
  'todayProof.promise.waiting_review_detail':
    'Sua comprovação foi enviada. Não é necessário enviá‑la duas vezes.',
  'todayProof.promise.done_today': 'Concluído hoje',
  'todayProof.promise.done_today_detail':
    'Hoje está registrado. Se alguém precisar de análise, essa é a próxima ação útil.',
  'todayProof.promise.send_clearer': 'Envie comprovação mais clara',
  'todayProof.promise.checkin_needed': 'Registro necessário',
  'todayProof.promise.checkin_needed_detail':
    'Envie uma comprovação clara antes do fim do dia.',
  'todayProof.promise.proof_due': 'Comprovação prevista para hoje',
  'todayProof.promise.proof_due_detail':
    'Faça a ação e envie uma comprovação clara.',
  'todayProof.promise.join_to_start': 'Entre para começar',
  'todayProof.promise.join_to_start_detail':
    'Entre primeiro e depois envie a comprovação junto com todos.',
  'todayProof.promise.no_peer_review': 'Sem análise de pares',
  'todayProof.promise.join': 'Entrar na promessa',
  'todayProof.promise.complete': 'Promessa concluída',
  'todayProof.promise.ended': 'Promessa encerrada',
  'todayProof.promise.status_unavailable': 'Status da comprovação indisponível',
  'todayProof.promise.submit_clearer': 'Enviar comprovação mais clara',
  'todayProof.promise.submit': 'Enviar comprovação',
  'todayProof.promise.review': 'Analisar comprovação',
  'todayProof.promise.done_for_today': 'Concluído hoje',
  'todayProof.promise.retry_detail':
    'Uma nova tentativa não reinicia a promessa. Envie comprovação que mostre claramente a ação concluída.',
  'todayProof.promise.today_counts':
    'Hoje ainda conta. O resultado não muda até a comprovação ser resolvida.',
  'todayProof.promise.reviewed_by': 'Analisado por',
  'todayProof.promise.only_you': 'Só você',
  'todayProof.promise.group_members': 'Membros do grupo',
  'todayProof.promise.invite_only': 'Apenas convite',
  'todayProof.promise.not_checked': 'Não registrado',
  'todayProof.promise.just_you': 'Só você',
  'todayProof.promise.left': 'Saiu da promessa',
  'todayProof.promise.left_detail': 'Você saiu desta promessa.',
  'todayProof.promise.deleted': 'A promessa foi excluída.',
  'todayProof.promise.not_changed':
    'A promessa não foi alterada. Tente novamente.',
  'todayProof.promise.result_not_confirmed_title': 'Resultado não confirmado',
  'todayProof.promise.not_changed_title': 'Promessa não alterada',
  'todayProof.promise.check_status': 'Verificar status',
  'todayProof.promise.check_action_unavailable':
    'A Menta ainda não consegue verificar esta ação. Atualize a promessa antes de tentar novamente.',
  'todayProof.promise.leave_result_unknown':
    'A Menta não conseguiu confirmar se você saiu desta promessa. Verifique o status antes de tentar novamente.',
  'todayProof.promise.leave_check_unavailable':
    'A Menta ainda não consegue verificar se você saiu desta promessa. Atualize a promessa antes de tentar novamente.',
  'todayProof.promise.result_mismatch':
    'A Menta não conseguiu associar este resultado à promessa. Verifique o status antes de tentar novamente.',
  'todayProof.promise.confirmation_mismatch':
    'A Menta não conseguiu associar esta confirmação à promessa. Verifique o status antes de tentar novamente.',
  'todayProof.promise.leave_receipt_mismatch':
    'A Menta não conseguiu associar o resultado da saída a esta promessa. Verifique a promessa antes de tentar novamente.',
  'todayProof.promise.already_left':
    'A Menta confirmou que você já havia saído desta promessa.',
  'todayProof.promise.delete_result_unknown':
    'A Menta não conseguiu confirmar se esta promessa foi excluída. Verifique o status antes de tentar novamente.',
  'todayProof.promise.delete_check_unavailable':
    'A Menta ainda não consegue verificar se esta promessa foi excluída. Atualize suas promessas antes de tentar novamente.',
  'todayProof.promise.delete_status_unavailable':
    'A Menta não conseguiu verificar se esta promessa foi excluída. Atualize suas promessas antes de tentar novamente.',
  'todayProof.promise.delete_question': 'Excluir esta promessa?',
  'todayProof.promise.leave_question': 'Sair desta promessa?',
  'todayProof.promise.delete': 'Excluir promessa',
  'todayProof.promise.leave': 'Sair da promessa',
  'todayProof.promise.delete_detail':
    'Exclui esta promessa, histórico de comprovações, links de convite e contexto de análise. Não há como desfazer.',
  'todayProof.promise.leave_detail':
    'Você deixa de enviar comprovações aqui. As comprovações existentes permanecem no histórico da promessa.',
  'todayProof.promise.details': 'Detalhes da promessa',
  'todayProof.promise.proof_rule_detail':
    'Mostre a ação concluída de forma clara para o analista indicado.',
  'todayProof.promise.proof_unavailable':
    'Essa comprovação não está disponível nesta promessa.',
  'todayProof.promise.rules_schedule': 'Regras e cronograma',
  'todayProof.promise.rules_schedule_detail':
    'O que conta, quando vence e quem analisa.',
  'todayProof.promise.how_works': 'Como funciona esta promessa',
  'todayProof.promise.your_proof': 'Sua comprovação',
  'todayProof.promise.no_proof_you': 'Ainda não há comprovação sua',
  'todayProof.promise.other_proof': 'Comprovações de outros membros',
  'todayProof.promise.no_other_proof':
    'Ainda não há comprovações de outros membros',
  'todayProof.promise.other_proof_detail':
    'Seus registros aprovados e pendentes aparecerão aqui.',
  'todayProof.promise.preparing_invite': 'Preparando convite…',
  'todayProof.promise.open_review_queue': 'Abrir fila de análise',
  'todayProof.promise.report': 'Denunciar promessa',
  'todayProof.promise.reminder_question': 'Gostaria de um lembrete?',
  'todayProof.promise.reminder_detail':
    'Menta pode lembrar você antes que a promessa vença.',
  'todayProof.promise.remind_about': 'Lembrar-me desta promessa',
  'todayProof.promise.remind_detail':
    'Enviar um lembrete antes da comprovação vencer.',
  'todayProof.promise.set_reminders': 'Configurar lembretes',
  'todayProof.promise.without_reminders': 'Continuar sem lembretes',
  'todayProof.promise.invite_question': 'Convidar alguém para esta promessa?',
  'todayProof.promise.invite_detail':
    'Eles podem ler a pré‑visualização antes de decidir entrar.',
  'todayProof.promise.link_copied': 'Link de convite copiado',
  'todayProof.promise.link_copied_detail':
    'Cole o link onde quiser para convidá‑los.',
  'todayProof.promise.link_not_copied': 'Link não foi copiado',
  'todayProof.promise.link_not_copied_detail':
    'O convite não mudou. Tente copiar novamente ou ignore por enquanto.',
  'todayProof.promise.skip': 'Ignorar por enquanto',
  'todayProof.promise.people': 'Pessoas',
  'todayProof.promise.joined': '{count} entrou',
  'todayProof.promise.joined_one': '{count} entrou',
  'todayProof.promise.private': 'Promessa privada',
  'todayProof.promise.private_only': 'Só você pode ver esta promessa.',
  'todayProof.promise.no_people': 'Ninguém entrou ainda.',
  'todayProof.promise.private_proof':
    'Sua comprovação permanece privada e conta quando você a envia.',
  'todayProof.promise.share_ready':
    'Compartilhe o convite quando estiver pronto.',
  'todayProof.promise.joined_on': 'Entrou em {date}',
  'todayProof.promise.day_streak': 'Sequência de {count} dia',
  'todayProof.promise.loading_people': 'Carregando participantes da promessa',
  'todayProof.promise.opening_invite': 'Abrindo convite',
  'todayProof.promise.recent_proof': 'Comprovação recente',
  'todayProof.promise.proof_log': 'Registro de comprovações',
  'todayProof.promise.no_proof': 'Ainda sem comprovação',
  'todayProof.promise.checkins_appear': 'Seus registros aparecerão aqui.',
  'todayProof.promise.proof_history': 'Histórico de comprovações',
  'todayProof.promise.submit_appears':
    'Envie a comprovação e ela aparecerá aqui.',
  'todayProof.promise.out_of_date': 'O histórico pode estar desatualizado',
  'todayProof.promise.checking_history':
    'Verificando atualizações no histórico',
  'todayProof.promise.loading_history': 'Carregando histórico',
  'todayProof.promise.all': 'Todos',
  'todayProof.promise.close_submissions': 'Encerrar envios',
  'todayProof.promise.no_accepted': 'Nenhuma comprovação aceita',
  'todayProof.promise.accepted_appears': 'Registros aceitos aparecerão aqui.',
  'todayProof.promise.nothing_waiting': 'Nada aguardando análise',
  'todayProof.promise.waiting_appears':
    'Novos registros aparecerão aqui enquanto são analisados.',
  'todayProof.promise.no_retry':
    'Nenhuma comprovação precisa de nova tentativa',
  'todayProof.promise.retry_appears':
    'Comprovação devolvida com nota de análise aparecerá aqui.',
  'todayProof.promise.checking_history_updates':
    'Verificando atualizações no histórico',
  'todayProof.promise.loading_history_short': 'Carregando histórico',
  'todayProof.proof.open_exact': 'Abre esta comprovação exata',
  'todayProof.proof.video_unavailable_short':
    'Comprovação em vídeo temporariamente indisponível.',
  'todayProof.proof.loading_video': 'Carregando vídeo',
  'todayProof.proof.close_exact': 'Fechar comprovação exata',
  'todayProof.proof.exact_photo': 'Foto de comprovação exata',
  'todayProof.proof.written_unavailable':
    'A comprovação escrita está indisponível.',
  'todayProof.proof.preview_unavailable_detail':
    'A pré‑visualização da comprovação está temporariamente indisponível.',
  'todayProof.proof.review_note': 'Nota de análise',
  'todayProof.proof.done': 'Concluído',
  'todayProof.proof.state_approved': 'Aprovado',
  'todayProof.proof.state_waiting': 'Aguardando análise',
  'todayProof.proof.state_retry': 'Precisa de nova tentativa',
  'todayProof.proof.approved_by': 'Aprovado por {name}',
  'todayProof.proof.waiting_for': 'Aguardando {name}',
  'todayProof.promise.video_proof': 'Vídeo de comprovação',
  'todayProof.promise.watch_full_screen': 'Ver em tela cheia',
  'todayProof.promise.text_proof': 'Texto de comprovação',
  'todayProof.promise.photo_proof': 'Foto de comprovação',
  'todayProof.promise.needs_retry': 'Precisa de nova tentativa',
  'todayProof.promise.updated': 'Promessa atualizada',
  'todayProof.promise.updated_accessibility': 'Promessa atualizada. {detail}',
  'todayProof.promise.notice': 'Aviso da promessa',
  'todayProof.promise.refresh_promise': 'Não foi possível atualizar a promessa',
  'todayProof.promise.complete_action_failed': 'Não foi possível concluir isso',
  'todayProof.promise.try_again': 'Tente novamente',
  'todayProof.promise.video_unavailable': 'Vídeo indisponível',
  'todayProof.promise.video_unavailable_detail':
    'Este vídeo de comprovação não está disponível agora. Tente novamente na página da promessa.',
  'todayProof.promise.cannot_open_video': 'Não foi possível abrir o vídeo',
  'todayProof.promise.cannot_open_video_detail':
    'Seu dispositivo não pôde abrir este vídeo de comprovação. Tente novamente na página da promessa.',
  'todayProof.promise.open_video_error':
    'Algo deu errado ao abrir o vídeo. Tente novamente daqui a pouco.',
  'todayProof.promise.open_video': 'Abrir vídeo',
  'todayProof.promise.close_video': 'Fechar vídeo',
  'todayProof.promise.open_device_player': 'Abrir no reprodutor do dispositivo',
  'todayProof.promise.open_video_detail': 'Abrir este vídeo de comprovação',
  'todayProof.promise.device_player_detail':
    'Menta abrirá o vídeo no reprodutor do seu dispositivo para que você analise a comprovação.',
  'todayProof.proof.hold_to_send': 'Segure para enviar',
  'todayProof.proof.keep_holding': 'Continue segurando…',
  'todayProof.proof.release_cancel': 'Solte ou deslize para cancelar',
  'todayProof.proof.send_one_tap': 'Enviar com um toque',
  'todayProof.proof.keep_holding_sentence': 'Continue segurando para enviar.',
  'todayProof.proof.send': 'Enviar comprovação',
  'todayProof.proof.send_detail': 'Toque para enviar esta comprovação agora.',
  'todayProof.proof.send_now': 'Envia esta comprovação agora.',
  'todayProof.proof.hold_detail':
    'Segure 1,3 s para enviar. Solte antes ou deslize para cancelar.',
  'todayProof.proof.ready': 'Pronto para enviar',
  'todayProof.proof.single_tap':
    'Envia esta comprovação com um toque único ao invés de segurar.',
  'todayProof.proof.percent_held': '{count}% segurado',
  'todayProof.proof.hold_accessibility_hint':
    'Segure 1,3 s para enviar. Solte antes ou deslize para cancelar.',
  'todayProof.proof.open_full': 'Abrir comprovação em tela cheia',
  'todayProof.proof.photo_preview': 'Pré‑visualização da foto',
  'todayProof.proof.video_preview': 'Pré‑visualização do vídeo',
  'todayProof.proof.text_preview': 'Pré‑visualização do texto',
  'todayProof.proof.open_full_view': 'Abrir tela cheia',
  'todayProof.proof.report_issue': 'Reportar problema',
  'todayProof.proof.private_full':
    'Visualização completa de comprovação privada',
  'todayProof.proof.private_full_detail':
    'Comprovação privada em visualização completa',
  'todayProof.proof.sending': 'Enviando comprovação',
  'todayProof.proof.meta': '{type} · {time}',
  'todayProof.proof.private': 'Comprovação privada',
  'todayProof.proof.close': 'Fechar',
  'todayProof.proof.write': 'Escreva sua comprovação',
  'todayProof.proof.write_detail':
    'Descreva o que fez para que o analista possa checar.',
  'todayProof.proof.record': 'Grave sua comprovação',
  'todayProof.proof.record_detail':
    'Garanta que o analista veja claramente o que fez.',
  'todayProof.proof.take_photo': 'Tire uma foto da comprovação',
  'todayProof.proof.take_photo_detail':
    'Tire uma foto que mostre claramente o que fez.',
  'todayProof.proof.saved_detail':
    'Este rascunho está salvo neste celular. Abra quando estiver pronto para enviar.',
  'todayProof.proof.uploading_detail':
    'Você pode sair desta tela. Menta continuará tentando enquanto o app estiver aberto e online.',
  'todayProof.proof.sent_detail':
    'Menta recebeu sua comprovação para esta promessa.',
  'todayProof.proof.pending_detail':
    'Sua comprovação está aguardando análise. Não precisa enviá‑la novamente.',
  'todayProof.proof.unknown_detail':
    'Não conseguimos confirmar se a comprovação foi enviada. Verifique o status antes de tentar novamente.',
  'todayProof.proof.failed_detail':
    'A comprovação não foi enviada. Verifique a conexão e tente novamente. Seu rascunho permanece aqui se salvo localmente.',
  'todayProof.proof.receipt': 'Comprovação',
  'todayProof.proof.share_title': 'Recibo de comprovação da Menta',
  'todayProof.proof.ad_break': 'Próximo intervalo publicitário',
  'todayProof.proof.ad_break_detail':
    'Um anúncio curto pode aparecer ao sair deste recibo. Não altera sua comprovação nem o saldo da Momenta.',
  'todayProof.proof.share_opened': 'Tela de compartilhamento aberta',
  'todayProof.proof.share_opened_detail':
    'Escolha um app e envie o recibo por ele para concluir.',
  'todayProof.proof.share_failed': 'Falha ao compartilhar',
  'todayProof.proof.share_failed_detail':
    'O recibo ainda está aqui. Tente compartilhar novamente quando o aparelho estiver pronto.',
  'todayProof.proof.share_progress': 'Progresso da Menta',
  'todayProof.proof.milestone_message': 'Atingi {count} dias na Menta.',
  'todayProof.proof.share_progress_detail':
    'Só a mensagem de progresso é compartilhada. Sua comprovação permanece privada.',
  'todayProof.proof.share_result_failed':
    'Seu resultado de {count} dias ainda está aqui. Tente compartilhar novamente mais tarde.',
  'todayProof.proof.view_promise': 'Ver promessa',
  'todayProof.proof.open_saved': 'Abrir comprovação salva',
  'todayProof.proof.resume': 'Retomar envio',
  'todayProof.proof.close_receipt': 'Fechar recibo',
  'todayProof.proof.review_someone': 'Analisar outra pessoa',
  'todayProof.proof.check_status': 'Verificar status da comprovação',
  'todayProof.proof.back': 'Voltar',
  'todayProof.proof.share_receipt': 'Compartilhar recibo da comprovação',
  'todayProof.proof.recovery_title': 'Recomeçar hoje',
  'todayProof.proof.recovery_detail':
    'O dia perdido fica no seu histórico. Esta comprovação só conta após aprovação.',
  'todayProof.proof.text_placeholder':
    'Caminhei 20 min após o trabalho às 18:10.',
  'todayProof.proof.text_helper':
    'Inclua o que fez, quando fez e um detalhe claro.',
  'todayProof.proof.hold_label': 'Segure para enviar a comprovação',
  'todayProof.proof.hold_holding': 'Continue segurando para enviar…',
  'todayProof.review.loading': 'Carregando análise da comprovação',
  'todayProof.review.reviews': 'Análises',
  'todayProof.review.opening_proof': 'Abrindo comprovação',
  'todayProof.review.opening_video_proof': 'Abrindo comprovação em vídeo',
  'todayProof.review.filter_all': 'Todos',
  'todayProof.review.filter_pending': 'Pendentes',
  'todayProof.review.filter_approved': 'Aprovados',
  'todayProof.review.filter_rejected': 'Precisa de nova tentativa',
  'todayProof.review.unknown_status': 'Status desconhecido',
  'todayProof.review.action_not_visible': 'Ação não visível',
  'todayProof.review.too_unclear': 'Muito confuso para analisar',
  'todayProof.review.why_retry': 'Por que eles deveriam tentar novamente?',
  'todayProof.review.reason_prompt':
    'Escolha um motivo. Depois de enviar, a análise não pode ser desfeita, mas {name} pode enviar nova comprovação.',
  'todayProof.review.unknown_user': 'Usuário desconhecido',
  'todayProof.review.fair_decision':
    'Sua comprovação aguarda decisão justa. Ainda ninguém tem comprovação pronta para você analisar.',
  'todayProof.review.none_waiting':
    'Nenhum envio aguardando análise. Novas comprovações aparecerão aqui com o contexto necessário.',
  'todayProof.review.none_approved':
    'Ainda não há comprovações aprovadas nesta visualização. As aprovações aparecerão aqui.',
  'todayProof.review.none_retry':
    'Nenhuma comprovação precisa ser refeita. Geralmente significa que os envios foram claros.',
  'todayProof.review.nothing':
    'Nada para mostrar ainda. Puxe para atualizar se esperava comprovações desta promessa.',
  'todayProof.review.back_board': 'Voltar ao painel',
  'todayProof.review.back_today': 'Voltar ao Hoje',
  'todayProof.review.error_detail':
    'As análises não carregaram. Puxe para atualizar e tente novamente.',
  'todayProof.review.group_reviews': 'Análises do grupo',
  'todayProof.review.promise_reviews': 'Análises da promessa',
  'todayProof.review.queue': 'Fila de análise',
  'todayProof.review.nothing_else': 'Nada mais para analisar ainda',
  'todayProof.review.no_submissions': 'Nenhum envio para analisar',
  'todayProof.review.reward_unconfirmed':
    'A decisão da comprovação foi salva, mas a recompensa não foi confirmada.',
  'todayProof.review.reward_failed':
    'A decisão da comprovação foi salva, mas não foi possível confirmar a recompensa.',
  'todayProof.review.decision_unconfirmed':
    'Menta não conseguiu confirmar o resultado da análise.',
  'todayProof.review.incomplete_receipt':
    'Menta recebeu um recibo de análise incompleto.',
  'todayProof.review.reward_already_logged':
    'Esta recompensa de análise já foi registrada.',
  'todayProof.review.reward_added_amount': '+{amount} Momenta adicionados',
  'todayProof.review.reward_added':
    'Sua recompensa de análise já foi adicionada.',
  'todayProof.review.checking_reward': 'Verificando sua recompensa…',
  'todayProof.review.show_all': 'Mostrar todas as comprovações',
  'todayProof.review.review_next': 'Analisar próxima comprovação ({count})',
  'todayProof.review.changed': 'Análise alterada',
  'todayProof.review.reload_title': 'Recarregar esta comprovação',
  'todayProof.review.changed_detail':
    'Ela mudou enquanto você analisava. Nada foi enviado. Recarregue antes de decidir.',
  'todayProof.review.changed_detail_with_note':
    'Ela mudou enquanto você analisava. Nada foi enviado. Recarregue antes de decidir. Sua nota de correção não enviada: {note}',
  'todayProof.review.current_status': 'Status atual: {status}',
  'todayProof.review.filter_accessibility': 'Mostrar comprovações {status}',
  'todayProof.review.back_queue': 'Voltar à fila',
  'todayProof.review.unsent_note':
    'Sua nota de correção não enviada ficará aqui até recarregar ou sair da fila.',
  'todayProof.review.reload': 'Recarregar comprovação',
  'todayProof.review.saved': 'Análise salva',
  'todayProof.review.approved_receipt': 'A comprovação de {name} foi aprovada.',
  'todayProof.review.retry_receipt': '{name} pode enviar novamente.',
  'todayProof.review.approved_detail':
    '{promise} pode contar esta comprovação agora.',
  'todayProof.review.feedback_sent':
    'Seu feedback foi enviado. A comprovação original permanece registrada.',
  'todayProof.review.cleared': 'Ver fila limpa',
  'todayProof.review.see_group': 'Ver grupo',
  'todayProof.review.approve_or_clearer':
    'Aprove esta comprovação ou peça uma mais clara',
  'todayProof.review.pending_count': '{count} aguardando análise',
  'todayProof.review.pending_action_with_more': '{action} · {count} aguardando',
  'todayProof.review.no_waiting': 'Nenhuma comprovação aguardando análise',
  'todayProof.review.report': 'Reportar esta comprovação',
  'todayProof.review.report_hint':
    'Abre um formulário de denúncia vinculado a este envio.',
  'todayProof.review.not_saved': 'Análise não salva',
  'todayProof.review.not_saved_detail':
    '{error} Nada mudou. Verifique a comprovação e tente novamente.',
  'todayProof.review.show_all_submissions': 'Mostrar todas as submissões',
  'todayProof.review.ask_new': 'Solicitar nova comprovação',
  'todayProof.review.reject': 'Rejeitar submissão',
  'todayProof.review.approve': 'Aprovar comprovação',
  'todayProof.review.approve_submission': 'Aprovar submissão',
  'todayProof.review.match_promise': 'Esta comprovação corresponde à promessa?',
  'todayProof.review.choose_reason': 'Escolha um motivo',
  'todayProof.review.reason_detail':
    'Escolha o feedback que facilite a avaliação da próxima comprovação.',
  'todayProof.review.keep_reviewing': 'Continuar analisando',
  'todayProof.review.sending_retry': 'Enviando nota de nova tentativa',
  'todayProof.review.send_retry': 'Enviar nota de nova tentativa',
  'todayProof.review.close_reasons': 'Fechar motivos de rejeição',
  'todayProof.review.review': 'Analisar comprovação',
  'todayProof.review.text_checkin': 'Registro de texto',
  'todayProof.review.checked_in': '{name} registrou',
  'todayProof.review.submitted': '{promise} · enviado {time}',
  'todayProof.review.select_hint': 'Selecionar esta comprovação para análise',
  'todayProof.review.media_meta': '{promise} · {type} · {time}',
  'todayProof.review.review_action': 'Análise',
  'todayProof.review.no_written': 'Nenhuma comprovação escrita foi anexada.',
  'todayProof.review.preview_unavailable': 'Pré-visualização indisponível',
  'todayProof.review.play_full': 'Reproduzir ou abrir em tela cheia',
  'todayProof.review.tap_zoom': 'Toque para ampliar',
  'todayProof.review.participant_note': 'Nota do participante',
  'todayProof.review.feedback': 'Analisar feedback',
  'todayProof.review.queue_cleared': 'Fila limpa',
  'todayProof.review.no_waiting_short':
    'Nenhuma comprovação está aguardando análise.',
  'todayProof.review.video_submitted':
    'Comprovação em vídeo enviada para análise',
  'todayProof.review.open_again':
    'Tente abrir novamente. Nenhuma decisão de análise foi salva.',
  'todayProof.review.could_not_open': 'Não foi possível abrir esta comprovação',
  'todayProof.review.return_to_promise': 'Voltar à promessa',
  'todayProof.review.back_reviews': 'Voltar às análises',
  'todayProof.review.refresh_needed': 'Fila de análises precisa ser atualizada',
  'todayProof.streak.missed_day': 'O dia perdido',
  'todayProof.streak.missed_day_title': '{day} foi perdido.',
  'todayProof.streak.no_proof_counted':
    'Nenhuma comprovação contada para {day}. Sua sequência anterior terminou em {streak}, e seu histórico continua aqui.',
  'todayProof.streak.previous_days': '{count} dia',
  'todayProof.streak.previous_days_other': '{count} dias',
  'todayProof.streak.history_action': 'Ver histórico de {count} dias',
  'todayProof.streak.missed': 'Dia perdido',
  'todayProof.streak.missed_day_label': 'Dia perdido · {day}',
  'todayProof.streak.day_was_missed': 'Um dia foi perdido.',
  'todayProof.streak.ready_again': 'Pronto para novo registro',
  'todayProof.streak.start_today': 'Começar novamente hoje',
  'todayProof.streak.proof_due': 'Comprovação ainda está pendente hoje',
  'todayProof.streak.at_risk_detail':
    'Adicionar comprovação antes que hoje termine.',
  'todayProof.streak.at_risk_copy':
    'Adicionar comprovação antes que hoje termine. {streakSentence} {freezeSentence}',
  'todayProof.streak.at_risk_streak':
    'Sua sequência de {count} dias ainda está ativa.',
  'todayProof.streak.at_risk_freezes':
    'Você tem {count} congelamento disponível.',
  'todayProof.streak.at_risk_freezes.one':
    'Você tem {count} congelamento disponível.',
  'todayProof.streak.at_risk_freezes.other':
    'Você tem {count} congelamentos disponíveis.',
  'todayProof.streak.queued_detail':
    'A comprovação está salva neste telefone, mas não foi enviada. Ela não conta até que a Menta a receba e aprove.',
  'todayProof.streak.add_proof': 'Adicionar comprovação',
  'todayProof.streak.view_freezes': 'Ver congelamentos',
  'todayProof.streak.open_inventory': 'Abrir inventário',
  'todayProof.streak.extension_ends': 'Extensão termina em',
  'todayProof.streak.reminder_in': 'Lembrete em',
  'todayProof.streak.proof_counts': 'Comprovação conta para',
  'todayProof.streak.until_extension': 'até que a extensão termine',
  'todayProof.streak.to_reminder': 'para lembrete',
  'todayProof.streak.until_midnight': 'até a meia-noite',
  'todayProof.streak.previous_streak': 'Sequência anterior',
  'todayProof.streak.today': 'Hoje',
  'todayProof.streak.ready_new_checkin': 'Pronto para novo registro',
  'todayProof.streak.recovery_note':
    'Um novo registro inicia a próxima sequência. A comprovação de hoje conta após aprovação.',
  'todayProof.streak.current': 'Sequência atual',
  'todayProof.streak.longest': 'Mais longa',
  'todayProof.streak.promise_goal': 'Meta da promessa',
  'todayProof.streak.next_target': 'Próximo alvo',
  'todayProof.streak.goal_reached': '{count} dias · atingido',
  'todayProof.streak.target_days': '{count} dias',
  'todayProof.streak.day': '{count} dia',
  'todayProof.streak.days': '{count} dias',
  'todayProof.streak.status_waiting': 'Aguardando análise',
  'todayProof.streak.status_requested': 'Nova comprovação solicitada',
  'todayProof.streak.status_approved': 'Comprovação aprovada hoje',
  'todayProof.streak.status_sent': 'Comprovação enviada hoje',
  'todayProof.streak.status_after_approval':
    'Nova sequência inicia após aprovação',
  'todayProof.streak.target_reached': '{label} {count} dias atingidos.',
  'todayProof.streak.target_accessibility': '{label} {count} dias.',
  'todayProof.streak.card_summary_accessibility':
    'Sequência atual {current} dias. Mais longa {longest} dias. {target} {status}.',
  'todayProof.streak.minutes': '{count} minutos',
  'todayProof.streak.minute': '{count} minuto',
  'todayProof.streak.hero_accessibility': '{eyebrow} {remaining}. {helper}',
  'todayProof.streak.card_accessibility': '{eyebrow} {remaining}. {helper}',
  'todayProof.streak.promise_countdown_helper': '{promise} · {helper}.',
  'todayProof.streak.remaining_with_suffix': '{duration} {suffix}',
  'todayProof.streak.on': 'Ligado',
  'todayProof.streak.off': 'Desligado',
  'todayProof.streak.reminders': 'Lembretes de comprovação',
  'todayProof.streak.preferred_time': 'Horário preferido: {time}',
  'todayProof.streak.reminders_off': 'Lembretes de comprovação desativados',
  'todayProof.streak.reminders_paused': 'Lembretes pausados por {hours} horas.',
  'todayProof.streak.remind_in': 'Lembrar-me em {hours} horas',
  'todayProof.streak.freeze_title': 'Congelamentos de sequência',
  'todayProof.streak.open_items': 'Abrir itens',
  'todayProof.streak.freeze_accessibility':
    'Congelamentos de sequência. {available}. A Menta usa um automaticamente após um dia perdido elegível.',
  'todayProof.streak.freeze_copy':
    'Um dia protegido aparece aqui apenas após a Menta confirmar o resultado. Enviar comprovação hoje não usa um congelamento. {grant}',
  'todayProof.streak.challenge_not_found': 'Desafio não encontrado',
  'todayProof.streak.already_checked_in': 'Já registrou hoje',
  'todayProof.streak.within_grace_period': 'Dentro do período de tolerância',
  'todayProof.streak.freeze_used':
    'Congelamento de sequência usado! Restam {count}.',
  'todayProof.streak.no_freezes':
    'Nenhum congelamento disponível. A sequência será reiniciada na próxima submissão.',
  'todayProof.streak.no_recent_checkin': 'Nenhum registro recente encontrado',
  'todayProof.streak.check_error': 'Erro ao verificar estado da sequência',
  'todayProof.streak.deadline_note':
    'Um prazo de comprovação ou horário silencioso pode alterar o horário real de envio.',
  'todayProof.streak.default_time': '20:00',
  'todayProof.creation.create_hub': 'Criar hub',
  'todayProof.creation.header': 'Criar',
  'todayProof.creation.what_create': 'O que você quer criar?',
  'todayProof.creation.create_intro':
    'Inicie uma promessa para você ou crie uma com um grupo.',
  'todayProof.creation.create_promise_detail':
    'Defina uma ação, um prazo e a comprovação que usará.',
  'todayProof.creation.join_public': 'Participar de uma promessa pública',
  'todayProof.creation.join_public_detail':
    'Escolha uma promessa compartilhada com data final definida.',
  'todayProof.creation.with_group': 'Criar com um grupo',
  'todayProof.creation.with_group_detail':
    'Escolha um grupo antes de definir a promessa.',
  'todayProof.creation.how_work': 'Como funcionam as promessas',
  'todayProof.creation.choose_group_first': 'Escolha um grupo primeiro.',
  'todayProof.creation.choose_group_first_detail':
    'Seu rascunho ainda está privado. Escolha ou crie um grupo antes que os membros possam analisar sua comprovação.',
  'todayProof.creation.choose_group': 'Escolher um grupo',
  'todayProof.creation.keep_personal': 'Manter isso pessoal',
  'todayProof.creation.title': 'Crie uma promessa ou participe de outras.',
  'todayProof.creation.subtitle':
    'Promessas individuais permanecem privadas. Promessas de grupo compartilham progresso com as pessoas que você escolher.',
  'todayProof.creation.close_hub': 'Fechar hub de criação',
  'todayProof.creation.create_options': 'Opções de criação',
  'todayProof.creation.group_promise': 'Adicionar uma promessa ao seu grupo',
  'todayProof.creation.group_promise_detail':
    'Compartilhe a promessa e o status da comprovação com o grupo.',
  'todayProof.creation.create_group': 'Criar um grupo',
  'todayProof.creation.create_group_detail':
    'Convide pessoas para um espaço compartilhado de promessas e comprovações.',
  'todayProof.creation.solo_promise': 'Fazer uma promessa individual',
  'todayProof.creation.solo_promise_detail':
    'Mantenha-a privada e escolha a comprovação você mesmo.',
  'todayProof.creation.saved_invite': 'Abrir convite salvo',
  'todayProof.creation.saved_invite_detail':
    'Código {code} está salvo neste telefone.',
  'todayProof.creation.join_invite': 'Participar com convite',
  'todayProof.creation.join_invite_detail':
    'Digite ou escaneie um código de convite.',
  'todayProof.creation.browse_events': 'Explorar eventos',
  'todayProof.creation.browse_events_detail':
    'Encontre um evento público para participar.',
  'todayProof.promise.invite_not_confirmed': 'Convite não confirmado',
  'todayProof.promise.invite_still_available':
    'A Menta não pode confirmar que o convite foi enviado. O convite ainda está disponível aqui se quiser copiá-lo ou voltar depois.',
  'todayProof.residual.share_promise': 'Compartilhar promessa',
  'todayProof.residual.waiting': 'Aguardando',
  'todayProof.residual.redo': 'Refazer',
  'todayProof.residual.due': 'Prazo',
  'todayProof.residual.open': 'Abrir',
  'todayProof.residual.window': 'Janela',
  'todayProof.residual.schedule': 'Agenda',
  'todayProof.residual.visibility': 'Visibilidade',
  'todayProof.residual.reminder': 'Lembrete',
  'todayProof.residual.open_proof_recovery': 'Abrir recuperação de comprovação',
  'todayProof.residual.not_counted_yet': 'Ainda não contado',
  'todayProof.residual.the_saved_proof_remains_on_this_device_until_menta_confirms_the_':
    'A comprovação salva permanece neste dispositivo até que a Menta confirme o recebimento no servidor.',
  'todayProof.residual.view_proof_history': 'Ver histórico de comprovação',
  'todayProof.residual.check_again': 'Verificar novamente',
  'todayProof.residual.no_new_proof_was_started':
    'Nenhuma nova comprovação foi iniciada',
  'todayProof.residual.check_the_current_server_status_before_sending_or_retrying_proof':
    'Verifique o status atual do servidor antes de enviar ou tentar novamente a comprovação.',
  'todayProof.residual.a_previous_day_was_protected':
    'Um dia anterior foi protegido',
  'todayProof.residual.the_protected_day_remains_in_proof_history_today_still_needs_its':
    'O dia protegido permanece no histórico de comprovações. Hoje ainda precisa de sua própria comprovação.',
  'todayProof.residual.status': 'Status',
  'todayProof.residual.preparing_invite': 'Preparando convite...',
  'todayProof.residual.checking': 'Verificando…',
  'todayProof.residual.adding_time': 'Adicionando tempo…',
  'todayProof.residual.add_12_hours': 'Adicionar 12 horas',
  'todayProof.residual.keep_current_due_time':
    'Manter horário de vencimento atual',
  'todayProof.residual.support': 'Suporte',
  'todayProof.residual.checking_streak_state':
    'Verificando estado da sequência',
  'todayProof.residual.network_request_failed_before_a_response_arrived':
    'Falha na solicitação de rede antes de receber resposta',
  'todayProof.residual.momenta': 'Momenta',
  'todayProof.residual.creating_promise': 'Criando promessa…',
  'todayProof.residual.change': 'Alterar',
  'todayProof.residual.starter_templates': 'Modelos iniciais',
  'todayProof.residual.choose_one_then_edit_the_promise_and_proof_rule':
    'Escolha um, depois edite a promessa e a regra de comprovação.',
  'todayProof.residual.clear_template': 'Limpar modelo',
  'todayProof.residual.templates_are_unavailable': 'Modelos indisponíveis.',
  'todayProof.residual.no_template_was_applied_your_promise_details_and_proof_rule_stay':
    'Nenhum modelo foi aplicado. Os detalhes da sua promessa e a regra de comprovação permanecem exatamente como estão.',
  'todayProof.residual.saved_to_your_account': 'Salvo na sua conta',
  'todayProof.residual.checking_for_updates': 'Verificando atualizações…',
  'todayProof.residual.edit_promise_words': 'Editar texto da promessa',
  'todayProof.residual.edit_words': 'Editar texto',
  'todayProof.residual.who_takes_part': 'Quem participa',
  'todayProof.residual.edit_who_takes_part': 'Editar quem participa',
  'todayProof.residual.edit': 'Editar',
  'todayProof.residual.edit_proof_requirements':
    'Editar requisitos de comprovação',
  'todayProof.residual.proof_schedule': 'Agenda de comprovação',
  'todayProof.residual.edit_proof_schedule': 'Editar agenda de comprovação',
  'todayProof.residual.how_many_days_should_this_last':
    'Quantos dias isso deve durar?',
  'todayProof.residual.choose_a_length_you_can_realistically_finish':
    'Escolha um prazo que você possa cumprir realisticamente.',
  'todayProof.residual.custom_window': 'Janela personalizada',
  'todayProof.residual.or_enter_your_own_number_of_days':
    'Ou insira seu próprio número de dias',
  'todayProof.residual.duration_must_be_365_days_or_less':
    'A duração deve ser de 365 dias ou menos',
  'todayProof.residual.use_1_365_days': 'Use 1-365 dias.',
  'todayProof.residual.choose_how_strict_the_schedule_should_be':
    'Escolha o quão rigorosa a agenda deve ser',
  'todayProof.residual.the_options_change_the_target_and_the_number_of_missed_days_allo':
    'As opções alteram a meta e a quantidade de dias perdidos permitidos. Escolha uma que você possa manter em uma semana ocupada.',
  'todayProof.residual.proof_target': 'Meta da comprovação',
  'todayProof.residual.you_can_change_this_later_if_the_schedule_no_longer_works_for_yo':
    'Você pode mudar isso depois se a agenda não funcionar mais para você.',
  'todayProof.residual.let_other_people_find_this_promise':
    'Permitir que outras pessoas encontrem esta promessa',
  'todayProof.residual.people_outside_the_group_can_find_and_join_this_promise':
    'Pessoas fora do grupo podem encontrar e participar desta promessa.',
  'todayProof.residual.d': 'd',
  'todayProof.residual.this_week': 'Esta semana',
  'todayProof.residual.proof_this_week': 'Comprovação esta semana',
  'todayProof.residual.progress': 'Progresso',
  'todayProof.residual.day_resets_in': 'Dia reinicia em',
  'todayProof.residual.until_reset': 'até reiniciar',
  'todayProof.residual.confirmed_streak_milestone_receipt':
    'Recibo de marco da sequência confirmado',
  'todayProof.residual.reward': 'Recompensa',
  'todayProof.residual.streak_freeze': 'Congelamento de sequência',
  'todayProof.residual.added_to_your_inventory_for_keeping_this_streak':
    'Adicionado ao seu inventário por manter esta sequência',
  'todayProof.residual.if_you_share': 'Se você compartilhar',
  'todayProof.residual.your_proof_stays_private':
    'Sua comprovação permanece privada',
  'todayProof.residual.share_milestone': 'Compartilhar marco',
  'todayProof.residual.loading_promise_details':
    'Carregando detalhes da promessa',
  'todayProof.residual.visible_to': 'Visível para',
  'todayProof.residual.your_proof_is_waiting_for_a_reviewer':
    'Sua comprovação está aguardando um analista.',
  'todayProof.residual.this_day_counts_only_after_approval':
    'Este dia conta apenas após aprovação.',
  'todayProof.residual.proof_details_are_unavailable':
    'Detalhes da comprovação indisponíveis',
  'todayProof.residual.who_reviews': 'Quem analisa?',
  'todayProof.residual.no_history_yet': 'Ainda sem histórico',
  'todayProof.residual.proof_and_confirmed_day_outcomes_will_appear_here':
    'Comprovação e resultados de dias confirmados aparecerão aqui.',
  'todayProof.residual.newest_first': 'Mais recentes primeiro',
  'todayProof.residual.load_earlier_proof': 'Carregar comprovação anterior',
  'todayProof.residual.rules_and_people': 'Regras e pessoas',
  'todayProof.residual.what_counts': 'O que conta',
  'todayProof.residual.proof_receipt': 'Recebimento da comprovação',
  'todayProof.residual.days_approved': 'Dias aprovados',
  'todayProof.residual.share_result': 'Compartilhar resultado',
  'todayProof.residual.make_another_promise': 'Fazer outra promessa',
  'todayProof.residual.try_again_before_submitting_or_reviewing_proof':
    'Tente novamente antes de enviar ou analisar a comprovação.',
  'todayProof.residual.report_a_problem': 'Reportar um problema',
  'todayProof.residual.invite_preview': 'PREVISÃO DO CONVITE',
  'todayProof.residual.copy_invite_link': 'Copiar link do convite',
  'todayProof.residual.your_promise': 'SUA PROMESSA',
  'todayProof.residual.type_your_promise': 'Digite sua promessa…',
  'todayProof.residual.daily_minimum': 'MÍNIMO DIÁRIO',
  'todayProof.residual.daily_minimum_2': 'Mínimo diário',
  'todayProof.residual.describe_what_counts_as_done':
    'Descreva o que conta como concluído…',
  'todayProof.residual.proof_should_show': 'COMPROVAÇÃO DEVE MOSTRAR',
  'todayProof.residual.on_time': 'No prazo',
  'todayProof.residual.missed_2': 'Perdido',
  'todayProof.residual.recent_check_ins': 'Registros recentes',
  'todayProof.residual.logged': 'registrado',
  'todayProof.residual.today_stays_open_until_you_check_in':
    'Hoje permanecerá aberto até que você registre.',
  'todayProof.residual.sign_in_again': 'Entrar novamente',
  'todayProof.residual.your_session_ended_before_menta_could_start_this_promise_sign_in':
    'Sua sessão terminou antes que a Menta pudesse iniciar esta promessa. Entre, depois volte aqui antes de tentar novamente.',
  'todayProof.residual.creation_result_unknown':
    'Resultado da criação desconhecido',
  'todayProof.residual.menta_did_not_receive_a_final_answer_we_cannot_say_whether_this_':
    'A Menta não recebeu uma resposta final. Não podemos dizer se esta promessa começou, então verifique Hoje antes de enviá-la novamente.',
  'todayProof.residual.promise_not_created': 'Promessa não criada',
  'todayProof.residual.sign_in_to_return': 'Entrar para retornar',
  'todayProof.residual.this_promise_needs_your_account_before_menta_can_show_its_proof_':
    'Esta promessa precisa da sua conta antes que a Menta possa mostrar sua comprovação e estado de análise.',
  'todayProof.residual.promise_not_available_to_this_account':
    'Promessa não disponível para esta conta',
  'todayProof.residual.menta_could_not_confirm_that_this_account_can_open_the_promise_a':
    'Menta não pôde confirmar que esta conta pode abrir a promessa. Peça acesso ao proprietário ou volte para Hoje.',
  'todayProof.residual.promise_unavailable': 'Promessa indisponível',
  'todayProof.residual.this_promise_could_not_be_found_for_the_current_account_it_may_h':
    'Esta promessa não foi encontrada para a conta atual. Pode ter terminado, sido removida ou não estar disponível para você.',
  'todayProof.residual.promise_unavailable_offline':
    'Promessa indisponível offline',
  'todayProof.residual.menta_cannot_confirm_the_latest_promise_proof_or_review_state_wi':
    'Menta não pode confirmar o estado mais recente da promessa, comprovação ou análise sem conexão. Nada foi marcado como concluído aqui.',
  'todayProof.residual.promise_could_not_load':
    'Não foi possível carregar a promessa',
  'todayProof.residual.menta_could_not_refresh_this_promise_retry_before_acting_on_a_mi':
    'Menta não pôde atualizar esta promessa. Tente novamente antes de agir sobre uma comprovação ou análise ausente.',
  'todayProof.residual.what_to_change': 'O que mudar',
  'todayProof.residual.your_last_check_in_needs_a_clearer_follow_up_before_the_day_clos':
    'Seu último registro precisa de um acompanhamento mais claro antes do final do dia.',
  'todayProof.residual.saved_on_this_phone': 'Salvo neste telefone',
  'todayProof.residual.your_draft_stays_on_this_phone_open_menta_when_you_are_online_to':
    'Seu rascunho permanece neste telefone. Abra o Menta quando estiver online para continuar o envio.',
  'todayProof.residual.proof_sent': 'Comprovação enviada',
  'todayProof.residual.your_proof_is_in_but_it_does_not_count_yet_it_counts_after_a_rev':
    'Sua comprovação foi enviada, mas ainda não conta. Ela conta depois que um analista a aceita, e você não precisa enviá‑la novamente.',
  'todayProof.residual.proof_approved': 'Comprovação aprovada',
  'todayProof.residual.menta_could_not_confirm_whether_your_proof_was_sent_your_origina':
    'Menta não pôde confirmar se sua comprovação foi enviada. O original ainda está salvo neste telefone. Verifique o status antes de reenviar.',
  'todayProof.residual.not_sent': 'Não enviado',
  'todayProof.residual.check_your_connection_then_try_again':
    'Verifique sua conexão e tente novamente.',
  'todayProof.residual.reward_summary':
    'Manter essa sequência rende cerca de {reward} Momenta, além de um bloqueio nos 7 e 30 dias.',
  'todayProof.milestone.reached': 'Dia de marco {count} alcançado.',
  'todayProof.milestone.reached.one': 'Você chegou ao dia {count}.',
  'todayProof.milestone.reached.other': 'Você chegou a {count} dias.',
  'todayProof.milestone.reward': '+{reward} Momenta',
  'todayProof.streak.day_count': 'Sequência de {count} dia',
  'todayProof.streak.day_count.one': 'Sequência de {count} dia',
  'todayProof.streak.day_count.other': 'Sequência de {count} dia',
  'todayProof.streak.best_count': 'Melhor: {count} dias',
  'todayProof.streak.best_count.one': 'Melhor: {count} dia',
  'todayProof.streak.best_count.other': 'Melhor: {count} dias',
  'todayProof.streak.progress': '{completed} de {total} dias',
  'todayProof.promise.proof_type_approval':
    '{proofType} · um dia conta só depois que a comprovação for aprovada',
  'todayProof.promise.extend_question': 'Adicionar 12 h à {promise}?',
  'todayProof.promise.extension_cost': 'Isso usa um {item}.',
  'todayProof.promise.active_for': 'Ativo por {duration}',
  'todayProof.promise.available_count': '{count} disponíveis',
  'todayProof.create.step_progress': 'Etapa {current} de {total}',
  'todayProof.residual.missed_day_summary':
    '{count} dias perdidos. Seu próximo registro aceito inicia uma nova sequência.',
  'todayProof.residual.missed_day_summary.one':
    '{count} dia perdido. Seu próximo registro aceito inicia uma nova sequência.',
  'todayProof.residual.missed_day_summary.other':
    '{count} dias perdidos. Seu próximo registro aceito inicia uma nova sequência.',
  'todayProof.correction.title_note': 'Uma anotação mais clara, e pronto',
  'todayProof.correction.detail_note':
    'Adicione uma anotação mais clara para terminar hoje.',
  'todayProof.correction.action_note': 'Adicionar anotação mais clara',
  'todayProof.correction.title_photo': 'Uma foto mais clara, e pronto',
  'todayProof.correction.detail_photo':
    'Adicione uma foto mais clara para terminar hoje.',
  'todayProof.correction.action_photo': 'Adicionar foto mais clara',
  'todayProof.correction.title_video': 'Um vídeo mais claro, e pronto',
  'todayProof.correction.detail_video':
    'Adicione um vídeo mais claro para terminar hoje.',
  'todayProof.correction.action_video': 'Adicionar vídeo mais claro',
  'todayProof.correction.title_proof': 'Uma comprovação mais clara, e pronto',
  'todayProof.correction.detail_proof':
    'Adicione uma comprovação mais clara para terminar hoje.',
  'todayProof.correction.action_proof': 'Adicionar comprovação mais clara',
  'todayProof.source.accountability.previous_proof': 'Provas anteriores',
  'todayProof.source.accountability.only_you': 'Só você',
  'todayProof.source.accountability.visibility_mixed':
    'Só você e as pessoas de cada promessa',
  'todayProof.profile.approved_proof_count': 'Comprovações aprovadas: {count}',
  'todayProof.streak.reminder_row_accessibility':
    'Lembretes de comprovação. {detail}. Preferência: {status}.',
} as const satisfies Partial<Pick<EnglishCatalogue, FullTodayProofKey>>;
