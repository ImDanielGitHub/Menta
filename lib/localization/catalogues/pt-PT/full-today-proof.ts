import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type FullTodayProofKey = Extract<
  keyof EnglishCatalogue,
  `todayProof.${string}`
>;

export const fullTodayProofPtPT = {
  'todayProof.notifications.daily_bonus': 'Bônus de conquista diário',
  'todayProof.notifications.maintenance': 'Manutenção de rotina',
  'todayProof.today.accountability': 'Responsabilidade de Hoje',
  'todayProof.today.active': 'ativo',
  'todayProof.today.loading_more': 'A carregar mais de Hoje',
  'todayProof.today.create_new': 'Criar algo novo',
  'todayProof.today.new': 'Novo',
  'todayProof.today.ledger_accessibility': '{title}. {detail}',
  'todayProof.today.submission_accessibility': '{promise}, {status}',
  'todayProof.today.group_needs_checkin': '{count} registo necessário',
  'todayProof.today.group_needs_checkin.one': '{count} registo necessário',
  'todayProof.today.group_needs_checkin.other': '{count} registos necessários',
  'todayProof.today.open_group_due':
    'Abra o grupo para ver o que está pendente',
  'todayProof.today.open_review_queue': 'Abra a fila de análise',
  'todayProof.today.loading_home': 'ecrã inicial de Hoje',
  'todayProof.today.home_unverified': 'Hoje não pôde ser verificado.',
  'todayProof.today.last_update': 'Exibindo sua última atualização',
  'todayProof.today.loading_accessibility': 'A carregar mais de Hoje',
  'todayProof.today.local_proof_drafts': 'Rascunhos locais de comprovativo',
  'todayProof.today.all_clear_accessibility_with_review':
    '0 pendente agora. {status}',
  'todayProof.today.protected_accessibility': 'Sequência protegida. {detail}',
  'todayProof.group.reminders_unavailable': 'Lembretes indisponíveis',
  'todayProof.group.nudge_unavailable_detail':
    'Menta ainda não pode autorizar o destinatário e devolver um comprovativo de entrega verificado.',
  'todayProof.group.no_proof_submitted': 'Nenhum comprovativo enviado ainda',
  'todayProof.group.pending_detail': '{media} · ainda não conta',
  'todayProof.group.send_clearer':
    'Envie um comprovativo mais claro para concluir hoje',
  'todayProof.group.new_proof_needed': 'É necessária uma novo comprovativo',
  'todayProof.group.needs_clearer': 'Precisa de comprovativo mais claro',
  'todayProof.today.layout_classified': 'Layout da aplicação classificado',
  'todayProof.today.more': 'Mais de hoje',
  'todayProof.today.stale_snapshot':
    'Exibindo a última captura confirmada. Nenhum comprovativo ou resultado de análise mudou aqui.',
  'todayProof.today.risk_checked': '{count} de {total} fizeram registo',
  'todayProof.today.risk_due': '{count} registo ainda pendente',
  'todayProof.today.risk_due.one': '{count} registo ainda pendente',
  'todayProof.today.risk_due.other': '{count} registos ainda pendentes',
  'todayProof.today.risk_title': '{count} registo pendente no {group}',
  'todayProof.today.risk_title.one': '{count} registo pendente no {group}',
  'todayProof.today.risk_title.other': '{count} registos pendentes no {group}',
  'todayProof.today.group_due': '{group} tem um registo pendente',
  'todayProof.today.review_one': 'Analise o comprovativo de {name}',
  'todayProof.today.review_many': 'Analise {count} comprovativos',
  'todayProof.today.review_many.one': 'Analise {count} comprovativo',
  'todayProof.today.review_many.other': 'Analise {count} comprovativos',
  'todayProof.today.status_due': 'Comprovativo pendente',
  'todayProof.today.status_pending': 'Análise pendente',
  'todayProof.today.status_approved': 'Aprovado',
  'todayProof.today.status_correction': 'Correção necessária',
  'todayProof.create.photo_video': 'Fotografia ou vídeo',
  'todayProof.create.photo_video_note':
    'Ideal quando a ação ou resultado concluído precisa ser visto.',
  'todayProof.create.text': 'Comprovativo em texto',
  'todayProof.create.text_note': 'Ideal para um registo escrito curto.',
  'todayProof.create.promise_question': 'O que a pessoa está prometendo?',
  'todayProof.create.promise_question_detail':
    'Nomeie a ação diária e indique exatamente o que conta como concluído.',
  'todayProof.create.proof_question': 'Escolha o comprovativo',
  'todayProof.create.proof_solo_detail':
    'Escolha o que enviará quando esta promessa estiver pendente.',
  'todayProof.create.proof_group_detail':
    'Informe aos analistas do grupo o que precisam ver ou ler.',
  'todayProof.create.flexibility_question': 'Escolha a flexibilidade',
  'todayProof.create.flexibility_detail':
    'Decida quanto a agenda pode mudar após iniciar.',
  'todayProof.create.review_question': 'Verifique sua promessa',
  'todayProof.create.review_detail':
    'Analise a promessa, comprovativo e agenda antes de criá‑la.',
  'todayProof.create.choose_proof': 'Escolha o comprovativo',
  'todayProof.create.choose_schedule': 'Escolha a agenda',
  'todayProof.create.review_promise': 'Analise a promessa',
  'todayProof.create.create_promise': 'Criar promessa',
  'todayProof.create.check_today': 'Verifique Hoje primeiro',
  'todayProof.create.choose_return': 'Escolha um novo início',
  'todayProof.create.your_promise': 'A sua promessa',
  'todayProof.create.name_promise': 'Nomeie a promessa',
  'todayProof.create.name_promise_detail':
    'Use pelo menos três caracteres para que esta promessa seja fácil de encontrar depois.',
  'todayProof.create.say_what_counts': 'Diga o que conta',
  'todayProof.create.say_what_counts_detail':
    'Adicione a regra diária para deixar claro o que significa concluído.',
  'todayProof.create.describe_proof': 'Descreva o comprovativo',
  'todayProof.create.describe_proof_detail':
    'Escreva o que o comprovativo deve mostrar antes da promessa iniciar.',
  'todayProof.create.session_expired': 'Sessão expirou',
  'todayProof.create.short_name': 'Use pelo menos três caracteres.',
  'todayProof.create.short_rule':
    'Adicione a regra diária antes de criar esta promessa.',
  'todayProof.create.cost_unconfirmed':
    'Não foi possível confirmar o custo da promessa',
  'todayProof.create.cost_unconfirmed_detail':
    'Menta não criou a promessa nem consumiu Momenta. Verifique sua ligação e tente novamente.',
  'todayProof.create.more_momenta': 'Mais Momenta necessário',
  'todayProof.create.promise_created': 'Promessa criada',
  'todayProof.create.draft_not_saved': 'Rascunho não guardado',
  'todayProof.create.sign_in_again':
    'Inicie sessão novamente antes de sair desta promessa.',
  'todayProof.create.draft_not_saved_detail':
    'Menta não pôde guardar este rascunho neste telemóvel. Fique aqui e tente novamente.',
  'todayProof.create.start_rule_solo':
    'Nomeie a ação e defina a menor quantidade que contará como concluída a cada dia.',
  'todayProof.create.start_rule_group':
    'Nomeie a ação e defina a menor quantidade que a pessoa e o grupo contarão como concluída a cada dia.',
  'todayProof.create.use_template': 'Usar um modelo',
  'todayProof.create.start_common': 'Comece a partir de uma promessa comum.',
  'todayProof.create.proof_show_required':
    'O que o comprovativo deve mostrar? *',
  'todayProof.create.proof_show': 'O que o comprovativo deve mostrar?',
  'todayProof.create.proof_required_hint':
    'Obrigatório. Use ao menos {count} caracteres para descrever o comprovativo.',
  'todayProof.create.proof_minimum':
    'Use ao menos {count} caracteres para descrever o comprovativo.',
  'todayProof.create.photo_example':
    'Uma fotografia da caminhada, ginásio, mesa ou resultado.',
  'todayProof.create.proof_rule':
    'Escreva a regra que o comprovativo deve atender.',
  'todayProof.create.proof_rule_label': 'Regra de comprovativo',
  'todayProof.create.proof_rule_placeholder':
    'Descreva o que o comprovativo deve mostrar ou dizer',
  'todayProof.create.self_review_rule':
    'Deixe a regra clara antes de começar. O seu comprovativo conta ao enviá‑la.',
  'todayProof.create.group_proof_rule':
    'Informe aos analistas do grupo o que confirma que foi concluído.',
  'todayProof.create.prompt_optional':
    'Instrução exibida no registo (opcional)',
  'todayProof.create.prompt_placeholder':
    'Adicione uma instrução curta que as pessoas veem antes de enviar',
  'todayProof.create.prompt_helper':
    'Mantenha um único lembrete prático para quem envia o comprovativo.',
  'todayProof.create.prompt': 'Instrução exibida no registo',
  'todayProof.create.prompt_example':
    'Exemplo: O que a pessoa fez e por quanto tempo?',
  'todayProof.create.edit_wording': 'Editar texto da promessa',
  'todayProof.create.proof_type': 'Tipo de comprovativo',
  'todayProof.create.proof_counts': 'O que conta como comprovativo',
  'todayProof.create.confirming': 'Confirmando…',
  'todayProof.create.length': 'Duração',
  'todayProof.create.proof_type_daily': 'Comprovativo {type}, diária',
  'todayProof.create.private_send':
    'Esta promessa é privada. O seu comprovativo conta ao enviá‑la.',
  'todayProof.create.group_review_rule':
    'Membros do grupo verificam o comprovativo contra esta regra.',
  'todayProof.create.promise_label': 'Promessa',
  'todayProof.create.title_placeholder':
    'ex.: Caminhada matinal antes do trabalho',
  'todayProof.create.title_helper':
    'Nomeie a ação para reconhecê‑la quando aparecer em Hoje.',
  'todayProof.create.what_counts': 'O que conta?',
  'todayProof.create.description_placeholder':
    'O que a pessoa fará a cada dia e o que conta como concluído?',
  'todayProof.create.description_helper':
    'Regras específicas são mais fáceis de seguir e analisar.',
  'todayProof.create.loading_groups': 'A carregar seus grupos...',
  'todayProof.create.keep_solo': 'Mantenha individual',
  'todayProof.create.private_streak':
    'Privado. O seu comprovativo conta ao enviá‑la e sua sequência é monitorada.',
  'todayProof.create.start_solo': 'Comece individualmente por enquanto',
  'todayProof.create.start_solo_detail':
    'Não precisa de um grupo para começar. Crie uma promessa pessoal agora e, depois, crie uma promessa em grupo se a análise partilhada ajudar.',
  'todayProof.create.private_promise':
    'Uma promessa privada em que o comprovativo conta ao enviá‑la.',
  'todayProof.create.want_group': 'Quer um grupo depois?',
  'todayProof.create.finish_first':
    'Conclua esta configuração primeiro. Pode criar ou entrar num grupo depois.',
  'todayProof.create.selected_rules': 'Regras do grupo selecionado',
  'todayProof.create.target': 'Meta de {percent}%',
  'todayProof.create.days_with_proof': 'Dias com comprovativo',
  'todayProof.create.misses_allowed': 'Falhas permitidas',
  'todayProof.create.day_unit': '{count} dia',
  'todayProof.create.days_unit': '{count} dias',
  'todayProof.create.group_policy':
    'Este grupo busco comprovativo em {percent}% dos dias e permite {count} dias consecutivos sem comprovativo.',
  'todayProof.create.personal_policy':
    'Esta promessa é só sua. Escolha uma agenda que ainda consiga cumprir num dia corrido.',
  'todayProof.create.choose_group_policy':
    'Escolha um grupo para ver suas regras antes de criar a promessa.',
  'todayProof.create.group_commitment': 'Compromisso de grupo de {count} dias',
  'todayProof.create.back_from_creation': 'Voltar da criação de promessa',
  'todayProof.create.restoring_draft': 'Restaurando este rascunho…',
  'todayProof.create.nothing_created': 'Nada foi criado ainda.',
  'todayProof.create.sign_in': 'Entrar',
  'todayProof.create.save_exit': 'guardar rascunho e sair',
  'todayProof.create.creating': 'Criando sua promessa…',
  'todayProof.create.keep_open':
    'Mantenha este ecrã aberto até que seja guardado.',
  'todayProof.create.draft_restored': 'Rascunho restaurado',
  'todayProof.create.private_on_phone':
    'Ainda está privado neste telemóvel até que a pessoa crie.',
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
  'todayProof.create.group_saved': 'Promessa de grupo guardada',
  'todayProof.create.promise_saved': 'Promessa guardada',
  'todayProof.create.group_saved_detail':
    'As regras de comprovativo e análise estão guardadas. Convide pessoas quando o grupo estiver pronto.',
  'todayProof.create.promise_saved_detail':
    'Publique a primeiro comprovativo quando estiver pronto para começar.',
  'todayProof.create.view_created': 'Ver promessa criada',
  'todayProof.create.first_due': 'Primeira pendente',
  'todayProof.create.schedule_saved': 'Agenda guardada',
  'todayProof.create.group_members_review': 'Análise dos membros do grupo',
  'todayProof.create.proof_counts_when_sent':
    'Comprovativo conta ao ser enviada',
  'todayProof.create.group_members': 'Membros do grupo',
  'todayProof.create.only_you': 'Só a pessoa',
  'todayProof.create.open_promise': 'Abrir minha promessa',
  'todayProof.create.open_group': 'Abrir grupo',
  'todayProof.create.post_first_proof': 'Publicar primeiro comprovativo',
  'todayProof.create.back_today': 'Voltar a Hoje',
  'todayProof.create.invite_people': 'Convidar pessoas',
  'todayProof.create.set_reminder': 'Definir lembrete',
  'todayProof.solo.back': 'Voltar',
  'todayProof.solo.items': 'Os seus itens',
  'todayProof.solo.items_hint':
    'Abre os impulsos e estilos que a pessoa possui.',
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
  'todayProof.solo.loading_accessibility': 'A carregar suas promessas pessoais',
  'todayProof.solo.loading': 'A carregar suas promessas…',
  'todayProof.solo.no_personal': 'Não tem promessas pessoais',
  'todayProof.solo.no_personal_detail':
    'Uma promessa pessoal é uma ação que a pessoa se compromete a fazer, com fotografia como comprovativo a cada vez. A pessoa analisa o seu próprio comprovativo.',
  'todayProof.solo.create_group': 'Faça uma promessa com um grupo',
  'todayProof.solo.active_count': 'Ativo {count}',
  'todayProof.solo.past_count': 'Passado {count}',
  'todayProof.solo.no_streak': 'Ainda sem sequência',
  'todayProof.solo.recent_proof': 'Comprovativo recente',
  'todayProof.solo.view_promise': 'Ver promessa',
  'todayProof.solo.log_entry': 'Registar entrada de hoje',
  'todayProof.solo.check_in': 'Registar hoje',
  'todayProof.solo.view_correction': 'Ver correção',
  'todayProof.solo.view_today_proof': 'Ver comprovativo de hoje',
  'todayProof.solo.proof_history': 'Histórico de comprovativo',
  'todayProof.solo.text_proof': 'Comprovativo em texto',
  'todayProof.solo.video_proof': 'Comprovativo em vídeo',
  'todayProof.solo.photo_proof': 'Comprovativo em fotografia',
  'todayProof.solo.past_promise': 'Promessa passada',
  'todayProof.solo.no_current_streak': 'Sem sequência atual',
  'todayProof.solo.open_promise': 'Abrir promessa',
  'todayProof.solo.open_full_promise': 'Abrir promessa completa',
  'todayProof.solo.due_today': 'Pendentes hoje',
  'todayProof.solo.waiting_review': 'a aguardar análise',
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
  'todayProof.promise.share_failed': 'Falha ao partilhar',
  'todayProof.promise.share_failed_detail':
    'Menta não pôde abrir a ecrã de partilha. Copie o código ou tente novamente.',
  'todayProof.promise.close_invite': 'Fechar modal de convite da promessa',
  'todayProof.promise.copy_invite': 'Copiar código de convite',
  'todayProof.promise.copy_code': 'Copiar código',
  'todayProof.promise.share_invite': 'partilhar convite',
  'todayProof.promise.actions': 'Ações da promessa',
  'todayProof.promise.refresh_failed':
    'Não foi possível atualizar os detalhes da promessa.',
  'todayProof.promise.refresh_data_failed':
    'Não foi possível atualizar os dados.',
  'todayProof.promise.unsupported_proof':
    'Este método de comprovativo ainda não é suportado aqui.',
  'todayProof.promise.solo_no_invite':
    'Promessas individuais não utilizam ligações de convite.',
  'todayProof.promise.invite_unavailable':
    'Menta não pôde gerar um código de convite. Nada mudou.',
  'todayProof.promise.try_later': 'Por favor, tente novamente mais tarde.',
  'todayProof.promise.boost_failed': 'Falha ao ativar impulso:',
  'todayProof.promise.boost_failed_detail':
    'Menta não pôde confirmar se o tempo foi adicionado. Verifique novamente antes de usar outra extensão.',
  'todayProof.promise.waiting_review': 'a aguardar análise',
  'todayProof.promise.waiting_review_detail':
    'O seu comprovativo foi enviado. Não é necessário enviá‑la duas vezes.',
  'todayProof.promise.done_today': 'Concluído hoje',
  'todayProof.promise.done_today_detail':
    'Hoje está registado. Se alguém precisar de análise, essa é a próxima ação útil.',
  'todayProof.promise.send_clearer': 'Envie comprovativo mais claro',
  'todayProof.promise.checkin_needed': 'Registo necessário',
  'todayProof.promise.checkin_needed_detail':
    'Envie um comprovativo claro antes do fim do dia.',
  'todayProof.promise.proof_due': 'Comprovativo prevista para hoje',
  'todayProof.promise.proof_due_detail':
    'Faça a ação e envie um comprovativo claro.',
  'todayProof.promise.join_to_start': 'Entre para começar',
  'todayProof.promise.join_to_start_detail':
    'Entre primeiro e depois envie o comprovativo junto com todos.',
  'todayProof.promise.no_peer_review': 'Sem análise de pares',
  'todayProof.promise.join': 'Entrar na promessa',
  'todayProof.promise.complete': 'Promessa concluída',
  'todayProof.promise.ended': 'Promessa encerrada',
  'todayProof.promise.status_unavailable':
    'estado do comprovativo indisponível',
  'todayProof.promise.submit_clearer': 'Enviar comprovativo mais claro',
  'todayProof.promise.submit': 'Enviar comprovativo',
  'todayProof.promise.review': 'Analisar comprovativo',
  'todayProof.promise.done_for_today': 'Concluído hoje',
  'todayProof.promise.retry_detail':
    'Uma nova tentativa não reinicia a promessa. Envie comprovativo que mostre claramente a ação concluída.',
  'todayProof.promise.today_counts':
    'Hoje ainda conta. O resultado não muda até o comprovativo ser resolvida.',
  'todayProof.promise.reviewed_by': 'Analisado por',
  'todayProof.promise.only_you': 'Só a pessoa',
  'todayProof.promise.group_members': 'Membros do grupo',
  'todayProof.promise.invite_only': 'Apenas convite',
  'todayProof.promise.not_checked': 'Não registado',
  'todayProof.promise.just_you': 'Só a pessoa',
  'todayProof.promise.left': 'Saiu da promessa',
  'todayProof.promise.left_detail': 'A pessoa saiu desta promessa.',
  'todayProof.promise.deleted': 'A promessa foi eliminada.',
  'todayProof.promise.not_changed':
    'A promessa não foi alterada. Tente novamente.',
  'todayProof.promise.result_not_confirmed_title': 'Resultado não confirmado',
  'todayProof.promise.not_changed_title': 'Promessa não alterada',
  'todayProof.promise.check_status': 'Verificar estado',
  'todayProof.promise.check_action_unavailable':
    'A Menta ainda não consegue verificar esta ação. Atualize a promessa antes de tentar novamente.',
  'todayProof.promise.leave_result_unknown':
    'A Menta não conseguiu confirmar se saiu desta promessa. Verifique o estado antes de tentar novamente.',
  'todayProof.promise.leave_check_unavailable':
    'A Menta ainda não consegue verificar se saiu desta promessa. Atualize a promessa antes de tentar novamente.',
  'todayProof.promise.result_mismatch':
    'A Menta não conseguiu associar este resultado à promessa. Verifique o estado antes de tentar novamente.',
  'todayProof.promise.confirmation_mismatch':
    'A Menta não conseguiu associar esta confirmação à promessa. Verifique o estado antes de tentar novamente.',
  'todayProof.promise.leave_receipt_mismatch':
    'A Menta não conseguiu associar o resultado da saída a esta promessa. Verifique a promessa antes de tentar novamente.',
  'todayProof.promise.already_left':
    'A Menta confirmou que já tinha saído desta promessa.',
  'todayProof.promise.delete_result_unknown':
    'A Menta não conseguiu confirmar se esta promessa foi eliminada. Verifique o estado antes de tentar novamente.',
  'todayProof.promise.delete_check_unavailable':
    'A Menta ainda não consegue verificar se esta promessa foi eliminada. Atualize as suas promessas antes de tentar novamente.',
  'todayProof.promise.delete_status_unavailable':
    'A Menta não conseguiu verificar se esta promessa foi eliminada. Atualize as suas promessas antes de tentar novamente.',
  'todayProof.promise.delete_question': 'eliminar esta promessa?',
  'todayProof.promise.leave_question': 'Sair desta promessa?',
  'todayProof.promise.delete': 'eliminar promessa',
  'todayProof.promise.leave': 'Sair da promessa',
  'todayProof.promise.delete_detail':
    'Exclui esta promessa, histórico de comprovativos, ligações de convite e contexto de análise. Não há como desfazer.',
  'todayProof.promise.leave_detail':
    'A pessoa deixa de enviar comprovativos aqui. As comprovativos existentes permanecem no histórico da promessa.',
  'todayProof.promise.details': 'Detalhes da promessa',
  'todayProof.promise.proof_rule_detail':
    'Mostre a ação concluída de forma clara para o analista indicado.',
  'todayProof.promise.proof_unavailable':
    'Este comprovativo não está disponível nesta promessa.',
  'todayProof.promise.rules_schedule': 'Regras e cronograma',
  'todayProof.promise.rules_schedule_detail':
    'O que conta, quando vence e quem analisa.',
  'todayProof.promise.how_works': 'Como funciona esta promessa',
  'todayProof.promise.your_proof': 'O seu comprovativo',
  'todayProof.promise.no_proof_you': 'Ainda não há comprovativo sua',
  'todayProof.promise.other_proof': 'Comprovativos de outros membros',
  'todayProof.promise.no_other_proof':
    'Ainda não há comprovativos de outros membros',
  'todayProof.promise.other_proof_detail':
    'Seus registos aprovados e pendentes aparecerão aqui.',
  'todayProof.promise.preparing_invite': 'Preparando convite…',
  'todayProof.promise.open_review_queue': 'Abrir fila de análise',
  'todayProof.promise.report': 'Denunciar promessa',
  'todayProof.promise.reminder_question': 'Gostaria de um lembrete?',
  'todayProof.promise.reminder_detail':
    'Menta pode lembrar a pessoa antes que a promessa vença.',
  'todayProof.promise.remind_about': 'Lembrar-me desta promessa',
  'todayProof.promise.remind_detail':
    'Enviar um lembrete antes do comprovativo vencer.',
  'todayProof.promise.set_reminders': 'Configurar lembretes',
  'todayProof.promise.without_reminders': 'Continuar sem lembretes',
  'todayProof.promise.invite_question': 'Convidar alguém para esta promessa?',
  'todayProof.promise.invite_detail':
    'Eles podem ler a pré‑visualização antes de decidir entrar.',
  'todayProof.promise.link_copied': 'ligação de convite copiado',
  'todayProof.promise.link_copied_detail':
    'Cole o ligação onde quiser para convidá‑los.',
  'todayProof.promise.link_not_copied': 'ligação não foi copiado',
  'todayProof.promise.link_not_copied_detail':
    'O convite não mudou. Tente copiar novamente ou ignore por enquanto.',
  'todayProof.promise.skip': 'Ignorar por enquanto',
  'todayProof.promise.people': 'Pessoas',
  'todayProof.promise.joined': '{count} entrou',
  'todayProof.promise.joined_one': '{count} entrou',
  'todayProof.promise.private': 'Promessa privada',
  'todayProof.promise.private_only': 'Só a pessoa pode ver esta promessa.',
  'todayProof.promise.no_people': 'Ninguém entrou ainda.',
  'todayProof.promise.private_proof':
    'O seu comprovativo permanece privada e conta quando a pessoa a envia.',
  'todayProof.promise.share_ready': 'Partilhe o convite quando estiver pronto.',
  'todayProof.promise.joined_on': 'Entrou em {date}',
  'todayProof.promise.day_streak': 'Sequência de {count} dia',
  'todayProof.promise.loading_people': 'A carregar participantes da promessa',
  'todayProof.promise.opening_invite': 'Abrindo convite',
  'todayProof.promise.recent_proof': 'Comprovativo recente',
  'todayProof.promise.proof_log': 'Registo de comprovativos',
  'todayProof.promise.no_proof': 'Ainda sem comprovativo',
  'todayProof.promise.checkins_appear': 'Seus registos aparecerão aqui.',
  'todayProof.promise.proof_history': 'Histórico de comprovativos',
  'todayProof.promise.submit_appears':
    'Envie o comprovativo e ela aparecerá aqui.',
  'todayProof.promise.out_of_date': 'O histórico pode estar desatualizado',
  'todayProof.promise.checking_history':
    'A verificar atualizações no histórico',
  'todayProof.promise.loading_history': 'A carregar histórico',
  'todayProof.promise.all': 'Todos',
  'todayProof.promise.close_submissions': 'Encerrar envios',
  'todayProof.promise.no_accepted': 'Nenhum comprovativo aceita',
  'todayProof.promise.accepted_appears': 'Registos aceitos aparecerão aqui.',
  'todayProof.promise.nothing_waiting': 'Nada a aguardar análise',
  'todayProof.promise.waiting_appears':
    'Novos registos aparecerão aqui enquanto são analisados.',
  'todayProof.promise.no_retry':
    'Nenhum comprovativo precisa de nova tentativa',
  'todayProof.promise.retry_appears':
    'Comprovativo devolvida com nota de análise aparecerá aqui.',
  'todayProof.promise.checking_history_updates':
    'A verificar atualizações no histórico',
  'todayProof.promise.loading_history_short': 'A carregar histórico',
  'todayProof.proof.open_exact': 'Abre esto comprovativo exata',
  'todayProof.proof.video_unavailable_short':
    'Comprovativo em vídeo temporariamente indisponível.',
  'todayProof.proof.loading_video': 'A carregar vídeo',
  'todayProof.proof.close_exact': 'Fechar comprovativo exata',
  'todayProof.proof.exact_photo': 'Fotografia de comprovativo exata',
  'todayProof.proof.written_unavailable':
    'O comprovativo escrita está indisponível.',
  'todayProof.proof.preview_unavailable_detail':
    'A pré‑visualização do comprovativo está temporariamente indisponível.',
  'todayProof.proof.review_note': 'Nota de análise',
  'todayProof.proof.done': 'Concluído',
  'todayProof.proof.state_approved': 'Aprovado',
  'todayProof.proof.state_waiting': 'a aguardar análise',
  'todayProof.proof.state_retry': 'Precisa de nova tentativa',
  'todayProof.proof.approved_by': 'Aprovado por {name}',
  'todayProof.proof.waiting_for': 'a aguardar {name}',
  'todayProof.promise.video_proof': 'Vídeo de comprovativo',
  'todayProof.promise.watch_full_screen': 'Ver em ecrã inteiro',
  'todayProof.promise.text_proof': 'Texto de comprovativo',
  'todayProof.promise.photo_proof': 'Fotografia de comprovativo',
  'todayProof.promise.needs_retry': 'Precisa de nova tentativa',
  'todayProof.promise.updated': 'Promessa atualizada',
  'todayProof.promise.updated_accessibility': 'Promessa atualizada. {detail}',
  'todayProof.promise.notice': 'Aviso da promessa',
  'todayProof.promise.refresh_promise': 'Não foi possível atualizar a promessa',
  'todayProof.promise.complete_action_failed': 'Não foi possível concluir isso',
  'todayProof.promise.try_again': 'Tente novamente',
  'todayProof.promise.video_unavailable': 'Vídeo indisponível',
  'todayProof.promise.video_unavailable_detail':
    'Este vídeo de comprovativo não está disponível agora. Tente novamente na página da promessa.',
  'todayProof.promise.cannot_open_video': 'Não foi possível abrir o vídeo',
  'todayProof.promise.cannot_open_video_detail':
    'O seu dispositivo não pôde abrir este vídeo de comprovativo. Tente novamente na página da promessa.',
  'todayProof.promise.open_video_error':
    'Algo deu errado ao abrir o vídeo. Tente novamente daqui a pouco.',
  'todayProof.promise.open_video': 'Abrir vídeo',
  'todayProof.promise.close_video': 'Fechar vídeo',
  'todayProof.promise.open_device_player': 'Abrir no reprodutor do dispositivo',
  'todayProof.promise.open_video_detail': 'Abrir este vídeo de comprovativo',
  'todayProof.promise.device_player_detail':
    'Menta abrirá o vídeo no reprodutor do seu dispositivo para que a pessoa analise o comprovativo.',
  'todayProof.proof.hold_to_send': 'Segure para enviar',
  'todayProof.proof.keep_holding': 'continuar segurando…',
  'todayProof.proof.release_cancel': 'Solte ou deslize para cancelar',
  'todayProof.proof.send_one_tap': 'Enviar com um toque',
  'todayProof.proof.keep_holding_sentence': 'continuar segurando para enviar.',
  'todayProof.proof.send': 'Enviar comprovativo',
  'todayProof.proof.send_detail': 'Toque para enviar esto comprovativo agora.',
  'todayProof.proof.send_now': 'Envia esto comprovativo agora.',
  'todayProof.proof.hold_detail':
    'Segure 1,3 s para enviar. Solte antes ou deslize para cancelar.',
  'todayProof.proof.ready': 'Pronto para enviar',
  'todayProof.proof.single_tap':
    'Envia esto comprovativo com um toque único ao invés de segurar.',
  'todayProof.proof.percent_held': '{count}% segurado',
  'todayProof.proof.hold_accessibility_hint':
    'Segure 1,3 s para enviar. Solte antes ou deslize para cancelar.',
  'todayProof.proof.open_full': 'Abrir comprovativo em ecrã cheia',
  'todayProof.proof.photo_preview': 'Pré‑visualização da fotografia',
  'todayProof.proof.video_preview': 'Pré‑visualização do vídeo',
  'todayProof.proof.text_preview': 'Pré‑visualização do texto',
  'todayProof.proof.open_full_view': 'Abrir ecrã cheia',
  'todayProof.proof.report_issue': 'Reportar problema',
  'todayProof.proof.private_full':
    'Visualização completa de comprovativo privada',
  'todayProof.proof.private_full_detail':
    'Comprovativo privada em visualização completa',
  'todayProof.proof.sending': 'A enviar comprovativo',
  'todayProof.proof.meta': '{type} · {time}',
  'todayProof.proof.private': 'Comprovativo privada',
  'todayProof.proof.close': 'Fechar',
  'todayProof.proof.write': 'Escreva o seu comprovativo',
  'todayProof.proof.write_detail':
    'Descreva o que fez para que o analista possa checar.',
  'todayProof.proof.record': 'Grave o seu comprovativo',
  'todayProof.proof.record_detail':
    'Garanta que o analista veja claramente o que fez.',
  'todayProof.proof.take_photo': 'Tire uma fotografia do comprovativo',
  'todayProof.proof.take_photo_detail':
    'Tire uma fotografia que mostre claramente o que fez.',
  'todayProof.proof.saved_detail':
    'Este rascunho está guardado neste telemóvel. Abra quando estiver pronto para enviar.',
  'todayProof.proof.uploading_detail':
    'Pode sair deste ecrã. Menta continuará tentando enquanto o app estiver aberto e online.',
  'todayProof.proof.sent_detail':
    'Menta recebeu o seu comprovativo para esta promessa.',
  'todayProof.proof.pending_detail':
    'O seu comprovativo está a aguardar análise. Não precisa enviá‑la novamente.',
  'todayProof.proof.unknown_detail':
    'Não conseguimos confirmar se o comprovativo foi enviado. Verifique o estado antes de tentar novamente.',
  'todayProof.proof.failed_detail':
    'O comprovativo não foi enviada. Verifique a ligação e tente novamente. O seu rascunho permanece aqui se guardado localmente.',
  'todayProof.proof.receipt': 'Comprovativo',
  'todayProof.proof.share_title': 'Recibo de comprovativo da Menta',
  'todayProof.proof.ad_break': 'Próximo intervalo publicitário',
  'todayProof.proof.ad_break_detail':
    'Um anúncio curto pode aparecer ao sair deste recibo. Não altera o seu comprovativo nem o saldo da Momenta.',
  'todayProof.proof.share_opened': 'ecrã de partilha aberta',
  'todayProof.proof.share_opened_detail':
    'Escolha um app e envie o recibo por ele para concluir.',
  'todayProof.proof.share_failed': 'Falha ao partilhar',
  'todayProof.proof.share_failed_detail':
    'O recibo ainda está aqui. Tente partilhar novamente quando o aparelho estiver pronto.',
  'todayProof.proof.share_progress': 'Progresso da Menta',
  'todayProof.proof.milestone_message': 'Atingi {count} dias na Menta.',
  'todayProof.proof.share_progress_detail':
    'Só a mensagem de progresso é partilhada. O seu comprovativo permanece privada.',
  'todayProof.proof.share_result_failed':
    'O seu resultado de {count} dias ainda está aqui. Tente partilhar novamente mais tarde.',
  'todayProof.proof.view_promise': 'Ver promessa',
  'todayProof.proof.open_saved': 'Abrir comprovativo guardado',
  'todayProof.proof.resume': 'Retomar envio',
  'todayProof.proof.close_receipt': 'Fechar recibo',
  'todayProof.proof.review_someone': 'Analisar outra pessoa',
  'todayProof.proof.check_status': 'Verificar estado do comprovativo',
  'todayProof.proof.back': 'Voltar',
  'todayProof.proof.share_receipt': 'partilhar recibo do comprovativo',
  'todayProof.proof.recovery_title': 'Recomeçar hoje',
  'todayProof.proof.recovery_detail':
    'O dia perdido fica no seu histórico. Esto comprovativo só conta após aprovação.',
  'todayProof.proof.text_placeholder':
    'Caminhei 20 min após o trabalho às 18:10.',
  'todayProof.proof.text_helper':
    'Inclua o que fez, quando fez e um detalhe claro.',
  'todayProof.proof.hold_label': 'Segure para enviar o comprovativo',
  'todayProof.proof.hold_holding': 'continuar segurando para enviar…',
  'todayProof.review.loading': 'A carregar análise do comprovativo',
  'todayProof.review.reviews': 'Análises',
  'todayProof.review.opening_proof': 'Abrindo comprovativo',
  'todayProof.review.opening_video_proof': 'Abrindo comprovativo em vídeo',
  'todayProof.review.filter_all': 'Todos',
  'todayProof.review.filter_pending': 'Pendentes',
  'todayProof.review.filter_approved': 'Aprovados',
  'todayProof.review.filter_rejected': 'Precisa de nova tentativa',
  'todayProof.review.unknown_status': 'estado desconhecido',
  'todayProof.review.action_not_visible': 'Ação não visível',
  'todayProof.review.too_unclear': 'Muito confuso para analisar',
  'todayProof.review.why_retry': 'Por que eles deveriam tentar novamente?',
  'todayProof.review.reason_prompt':
    'Escolha um motivo. Depois de enviar, a análise não pode ser desfeita, mas {name} pode enviar novo comprovativo.',
  'todayProof.review.unknown_user': 'Utilizador desconhecido',
  'todayProof.review.fair_decision':
    'O seu comprovativo aguarda decisão justa. Ainda ninguém tem comprovativo pronto para si analisar.',
  'todayProof.review.none_waiting':
    'Nenhum envio a aguardar análise. Novas comprovativos aparecerão aqui com o contexto necessário.',
  'todayProof.review.none_approved':
    'Ainda não há comprovativos aprovadas nesta visualização. As aprovações aparecerão aqui.',
  'todayProof.review.none_retry':
    'Nenhum comprovativo precisa ser refeita. Geralmente significa que os envios foram claros.',
  'todayProof.review.nothing':
    'Nada para mostrar ainda. Puxe para atualizar se esperavo comprovativos desta promessa.',
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
    'A decisão do comprovativo foi guardada, mas a recompensa não foi confirmada.',
  'todayProof.review.reward_failed':
    'A decisão do comprovativo foi guardada, mas não foi possível confirmar a recompensa.',
  'todayProof.review.decision_unconfirmed':
    'Menta não conseguiu confirmar o resultado da análise.',
  'todayProof.review.incomplete_receipt':
    'Menta recebeu um recibo de análise incompleto.',
  'todayProof.review.reward_already_logged':
    'Esta recompensa de análise já foi registada.',
  'todayProof.review.reward_added_amount': '+{amount} Momenta adicionados',
  'todayProof.review.reward_added':
    'A sua recompensa de análise já foi adicionada.',
  'todayProof.review.checking_reward': 'A verificar sua recompensa…',
  'todayProof.review.show_all': 'Mostrar todas as comprovativos',
  'todayProof.review.review_next': 'Analisar próximo comprovativo ({count})',
  'todayProof.review.changed': 'Análise alterada',
  'todayProof.review.reload_title': 'Recarregar esto comprovativo',
  'todayProof.review.changed_detail':
    'Ela mudou enquanto a pessoa analisava. Nada foi enviado. Recarregue antes de decidir.',
  'todayProof.review.changed_detail_with_note':
    'Ela mudou enquanto a pessoa analisava. Nada foi enviado. Recarregue antes de decidir. A sua nota de correção não enviada: {note}',
  'todayProof.review.current_status': 'estado atual: {status}',
  'todayProof.review.filter_accessibility': 'Mostrar comprovativos {status}',
  'todayProof.review.back_queue': 'Voltar à fila',
  'todayProof.review.unsent_note':
    'A sua nota de correção não enviada ficará aqui até recarregar ou sair da fila.',
  'todayProof.review.reload': 'Recarregar comprovativo',
  'todayProof.review.saved': 'Análise guardada',
  'todayProof.review.approved_receipt':
    'O comprovativo de {name} foi aprovada.',
  'todayProof.review.retry_receipt': '{name} pode enviar novamente.',
  'todayProof.review.approved_detail':
    '{promise} pode contar esto comprovativo agora.',
  'todayProof.review.feedback_sent':
    'O seu comentários foi enviado. O comprovativo original permanece registada.',
  'todayProof.review.cleared': 'Ver fila limpa',
  'todayProof.review.see_group': 'Ver grupo',
  'todayProof.review.approve_or_clearer':
    'Aprove esto comprovativo ou peça uma mais clara',
  'todayProof.review.pending_count': '{count} a aguardar análise',
  'todayProof.review.pending_action_with_more': '{action} · {count} a aguardar',
  'todayProof.review.no_waiting': 'Nenhum comprovativo a aguardar análise',
  'todayProof.review.report': 'Reportar esto comprovativo',
  'todayProof.review.report_hint':
    'Abre um formulário de denúncia associado a este envio.',
  'todayProof.review.not_saved': 'Análise não guardada',
  'todayProof.review.not_saved_detail':
    '{error} Nada mudou. Verifique o comprovativo e tente novamente.',
  'todayProof.review.show_all_submissions': 'Mostrar todas as envios',
  'todayProof.review.ask_new': 'Solicitar novo comprovativo',
  'todayProof.review.reject': 'Rejeitar submissão',
  'todayProof.review.approve': 'Aprovar comprovativo',
  'todayProof.review.approve_submission': 'Aprovar submissão',
  'todayProof.review.match_promise':
    'Esto comprovativo corresponde à promessa?',
  'todayProof.review.choose_reason': 'Escolha um motivo',
  'todayProof.review.reason_detail':
    'Escolha o comentários que facilite a avaliação da próximo comprovativo.',
  'todayProof.review.keep_reviewing': 'Continuar analisando',
  'todayProof.review.sending_retry': 'A enviar nota de nova tentativa',
  'todayProof.review.send_retry': 'Enviar nota de nova tentativa',
  'todayProof.review.close_reasons': 'Fechar motivos de rejeição',
  'todayProof.review.review': 'Analisar comprovativo',
  'todayProof.review.text_checkin': 'Registo de texto',
  'todayProof.review.checked_in': '{name} registou',
  'todayProof.review.submitted': '{promise} · enviado {time}',
  'todayProof.review.select_hint': 'Selecionar esto comprovativo para análise',
  'todayProof.review.media_meta': '{promise} · {type} · {time}',
  'todayProof.review.review_action': 'Análise',
  'todayProof.review.no_written': 'Nenhum comprovativo escrita foi anexada.',
  'todayProof.review.preview_unavailable': 'Pré-visualização indisponível',
  'todayProof.review.play_full': 'Reproduzir ou abrir em ecrã cheia',
  'todayProof.review.tap_zoom': 'Toque para ampliar',
  'todayProof.review.participant_note': 'Nota do participante',
  'todayProof.review.feedback': 'Analisar comentários',
  'todayProof.review.queue_cleared': 'Fila limpa',
  'todayProof.review.no_waiting_short':
    'Nenhum comprovativo está a aguardar análise.',
  'todayProof.review.video_submitted':
    'Comprovativo em vídeo enviada para análise',
  'todayProof.review.open_again':
    'Tente abrir novamente. Nenhuma decisão de análise foi guardada.',
  'todayProof.review.could_not_open':
    'Não foi possível abrir esto comprovativo',
  'todayProof.review.return_to_promise': 'Voltar à promessa',
  'todayProof.review.back_reviews': 'Voltar às análises',
  'todayProof.review.refresh_needed': 'Fila de análises precisa ser atualizada',
  'todayProof.streak.missed_day': 'O dia perdido',
  'todayProof.streak.missed_day_title': '{day} foi perdido.',
  'todayProof.streak.no_proof_counted':
    'Nenhum comprovativo contada para {day}. A sua sequência anterior terminou em {streak}, e seu histórico continua aqui.',
  'todayProof.streak.previous_days': '{count} dia',
  'todayProof.streak.previous_days_other': '{count} dias',
  'todayProof.streak.history_action': 'Ver histórico de {count} dias',
  'todayProof.streak.missed': 'Dia perdido',
  'todayProof.streak.missed_day_label': 'Dia perdido · {day}',
  'todayProof.streak.day_was_missed': 'Um dia foi perdido.',
  'todayProof.streak.ready_again': 'Pronto para novo registo',
  'todayProof.streak.start_today': 'Começar novamente hoje',
  'todayProof.streak.proof_due': 'Comprovativo ainda está pendente hoje',
  'todayProof.streak.at_risk_detail':
    'Adicionar comprovativo antes que hoje termine.',
  'todayProof.streak.at_risk_copy':
    'Adicionar comprovativo antes que hoje termine. {streakSentence} {freezeSentence}',
  'todayProof.streak.at_risk_streak':
    'A sua sequência de {count} dias ainda está ativa.',
  'todayProof.streak.at_risk_freezes': 'Tem {count} congelamento disponível.',
  'todayProof.streak.at_risk_freezes.one':
    'Tem {count} congelamento disponível.',
  'todayProof.streak.at_risk_freezes.other':
    'Tem {count} congelamentos disponíveis.',
  'todayProof.streak.queued_detail':
    'O comprovativo está guardada neste telemóvel, mas não foi enviada. Ela não conta até que a Menta a receba e aprove.',
  'todayProof.streak.add_proof': 'Adicionar comprovativo',
  'todayProof.streak.view_freezes': 'Ver congelamentos',
  'todayProof.streak.open_inventory': 'Abrir inventário',
  'todayProof.streak.extension_ends': 'Extensão termina em',
  'todayProof.streak.reminder_in': 'Lembrete em',
  'todayProof.streak.proof_counts': 'Comprovativo conta para',
  'todayProof.streak.until_extension': 'até que a extensão termine',
  'todayProof.streak.to_reminder': 'para lembrete',
  'todayProof.streak.until_midnight': 'até a meia-noite',
  'todayProof.streak.previous_streak': 'Sequência anterior',
  'todayProof.streak.today': 'Hoje',
  'todayProof.streak.ready_new_checkin': 'Pronto para novo registo',
  'todayProof.streak.recovery_note':
    'Um novo registo inicia a próxima sequência. O comprovativo de hoje conta após aprovação.',
  'todayProof.streak.current': 'Sequência atual',
  'todayProof.streak.longest': 'Mais longa',
  'todayProof.streak.promise_goal': 'Meta da promessa',
  'todayProof.streak.next_target': 'Próximo alvo',
  'todayProof.streak.goal_reached': '{count} dias · atingido',
  'todayProof.streak.target_days': '{count} dias',
  'todayProof.streak.day': '{count} dia',
  'todayProof.streak.days': '{count} dias',
  'todayProof.streak.status_waiting': 'a aguardar análise',
  'todayProof.streak.status_requested': 'Novo comprovativo solicitado',
  'todayProof.streak.status_approved': 'Comprovativo aprovado hoje',
  'todayProof.streak.status_sent': 'Comprovativo enviado hoje',
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
  'todayProof.streak.reminders': 'Lembretes de comprovativo',
  'todayProof.streak.preferred_time': 'Horário preferido: {time}',
  'todayProof.streak.reminders_off': 'Lembretes de comprovativo desativados',
  'todayProof.streak.reminders_paused': 'Lembretes pausados por {hours} horas.',
  'todayProof.streak.remind_in': 'Lembrar-me em {hours} horas',
  'todayProof.streak.freeze_title': 'Congelamentos de sequência',
  'todayProof.streak.open_items': 'Abrir itens',
  'todayProof.streak.freeze_accessibility':
    'Congelamentos de sequência. {available}. A Menta usa um automaticamente após um dia perdido elegível.',
  'todayProof.streak.freeze_copy':
    'Um dia protegido aparece aqui apenas após a Menta confirmar o resultado. Enviar comprovativo hoje não usa um congelamento. {grant}',
  'todayProof.streak.challenge_not_found': 'Desafio não encontrado',
  'todayProof.streak.already_checked_in': 'Já registou hoje',
  'todayProof.streak.within_grace_period': 'Dentro do período de tolerância',
  'todayProof.streak.freeze_used':
    'Congelamento de sequência usado! Restam {count}.',
  'todayProof.streak.no_freezes':
    'Nenhum congelamento disponível. A sequência será reiniciada na próxima submissão.',
  'todayProof.streak.no_recent_checkin': 'Nenhum registo recente encontrado',
  'todayProof.streak.check_error': 'Erro ao verificar estado da sequência',
  'todayProof.streak.deadline_note':
    'Um prazo de comprovativo ou horário silencioso pode alterar o horário real de envio.',
  'todayProof.streak.default_time': '20:00',
  'todayProof.creation.create_hub': 'Criar hub',
  'todayProof.creation.header': 'Criar',
  'todayProof.creation.what_create': 'O que a pessoa quer criar?',
  'todayProof.creation.create_intro':
    'Inicie uma promessa para si ou crie uma com um grupo.',
  'todayProof.creation.create_promise_detail':
    'Defina uma ação, um prazo e o comprovativo que usará.',
  'todayProof.creation.join_public': 'Participar de uma promessa pública',
  'todayProof.creation.join_public_detail':
    'Escolha uma promessa partilhada com data final definida.',
  'todayProof.creation.with_group': 'Criar com um grupo',
  'todayProof.creation.with_group_detail':
    'Escolha um grupo antes de definir a promessa.',
  'todayProof.creation.how_work': 'Como funcionam as promessas',
  'todayProof.creation.choose_group_first': 'Escolha um grupo primeiro.',
  'todayProof.creation.choose_group_first_detail':
    'O seu rascunho ainda está privado. Escolha ou crie um grupo antes que os membros possam analisar o seu comprovativo.',
  'todayProof.creation.choose_group': 'Escolher um grupo',
  'todayProof.creation.keep_personal': 'Manter isso pessoal',
  'todayProof.creation.title': 'Crie uma promessa ou participe de outras.',
  'todayProof.creation.subtitle':
    'Promessas individuais permanecem privadas. Promessas de grupo partilham progresso com as pessoas que a pessoa escolher.',
  'todayProof.creation.close_hub': 'Fechar hub de criação',
  'todayProof.creation.create_options': 'Opções de criação',
  'todayProof.creation.group_promise': 'Adicionar uma promessa ao seu grupo',
  'todayProof.creation.group_promise_detail':
    'Partilhe a promessa e o estado do comprovativo com o grupo.',
  'todayProof.creation.create_group': 'Criar um grupo',
  'todayProof.creation.create_group_detail':
    'Convide pessoas para um espaço partilhado de promessas e comprovativos.',
  'todayProof.creation.solo_promise': 'Fazer uma promessa individual',
  'todayProof.creation.solo_promise_detail':
    'Mantenha-a privada e escolha o comprovativo a pessoa mesmo.',
  'todayProof.creation.saved_invite': 'Abrir convite guardado',
  'todayProof.creation.saved_invite_detail':
    'Código {code} está guardado neste telemóvel.',
  'todayProof.creation.join_invite': 'Participar com convite',
  'todayProof.creation.join_invite_detail':
    'Introduza ou leia um código de convite.',
  'todayProof.creation.browse_events': 'Explorar eventos',
  'todayProof.creation.browse_events_detail':
    'Encontre um evento público para participar.',
  'todayProof.promise.invite_not_confirmed': 'Convite não confirmado',
  'todayProof.promise.invite_still_available':
    'A Menta não pode confirmar que o convite foi enviado. O convite ainda está disponível aqui se quiser copiá-lo ou voltar depois.',
  'todayProof.residual.share_promise': 'partilhar promessa',
  'todayProof.residual.waiting': 'a aguardar',
  'todayProof.residual.redo': 'Refazer',
  'todayProof.residual.due': 'Prazo',
  'todayProof.residual.open': 'Abrir',
  'todayProof.residual.window': 'Janela',
  'todayProof.residual.schedule': 'Agenda',
  'todayProof.residual.visibility': 'Visibilidade',
  'todayProof.residual.reminder': 'Lembrete',
  'todayProof.residual.open_proof_recovery':
    'Abrir recuperação de comprovativo',
  'todayProof.residual.not_counted_yet': 'Ainda não contado',
  'todayProof.residual.the_saved_proof_remains_on_this_device_until_menta_confirms_the_':
    'O comprovativo guardado permanece neste dispositivo até que a Menta confirme o recebimento no servidor.',
  'todayProof.residual.view_proof_history': 'Ver histórico de comprovativo',
  'todayProof.residual.check_again': 'Verificar novamente',
  'todayProof.residual.no_new_proof_was_started':
    'Nenhuma novo comprovativo foi iniciada',
  'todayProof.residual.check_the_current_server_status_before_sending_or_retrying_proof':
    'Verifique o estado atual do servidor antes de enviar ou tentar novamente o comprovativo.',
  'todayProof.residual.a_previous_day_was_protected':
    'Um dia anterior foi protegido',
  'todayProof.residual.the_protected_day_remains_in_proof_history_today_still_needs_its':
    'O dia protegido permanece no histórico de comprovativos. Hoje ainda precisa da o seu próprio comprovativo.',
  'todayProof.residual.status': 'estado',
  'todayProof.residual.preparing_invite': 'Preparando convite...',
  'todayProof.residual.checking': 'A verificar…',
  'todayProof.residual.adding_time': 'Adicionando tempo…',
  'todayProof.residual.add_12_hours': 'Adicionar 12 horas',
  'todayProof.residual.keep_current_due_time':
    'Manter horário de vencimento atual',
  'todayProof.residual.support': 'Suporte',
  'todayProof.residual.checking_streak_state':
    'A verificar estado da sequência',
  'todayProof.residual.network_request_failed_before_a_response_arrived':
    'Falha no pedido de rede antes de receber resposta',
  'todayProof.residual.momenta': 'Momenta',
  'todayProof.residual.creating_promise': 'Criando promessa…',
  'todayProof.residual.change': 'Alterar',
  'todayProof.residual.starter_templates': 'Modelos iniciais',
  'todayProof.residual.choose_one_then_edit_the_promise_and_proof_rule':
    'Escolha um, depois edite a promessa e a regra de comprovativo.',
  'todayProof.residual.clear_template': 'Limpar modelo',
  'todayProof.residual.templates_are_unavailable': 'Modelos indisponíveis.',
  'todayProof.residual.no_template_was_applied_your_promise_details_and_proof_rule_stay':
    'Nenhum modelo foi aplicado. Os detalhes da sua promessa e a regra de comprovativo permanecem exatamente como estão.',
  'todayProof.residual.saved_to_your_account': 'guardado na sua conta',
  'todayProof.residual.checking_for_updates': 'A verificar atualizações…',
  'todayProof.residual.edit_promise_words': 'Editar texto da promessa',
  'todayProof.residual.edit_words': 'Editar texto',
  'todayProof.residual.who_takes_part': 'Quem participa',
  'todayProof.residual.edit_who_takes_part': 'Editar quem participa',
  'todayProof.residual.edit': 'Editar',
  'todayProof.residual.edit_proof_requirements':
    'Editar requisitos de comprovativo',
  'todayProof.residual.proof_schedule': 'Agenda de comprovativo',
  'todayProof.residual.edit_proof_schedule': 'Editar agenda de comprovativo',
  'todayProof.residual.how_many_days_should_this_last':
    'Quantos dias isso deve durar?',
  'todayProof.residual.choose_a_length_you_can_realistically_finish':
    'Escolha um prazo que a pessoa possa cumprir realisticamente.',
  'todayProof.residual.custom_window': 'Janela personalizada',
  'todayProof.residual.or_enter_your_own_number_of_days':
    'Ou introduza seu próprio número de dias',
  'todayProof.residual.duration_must_be_365_days_or_less':
    'A duração deve ser de 365 dias ou menos',
  'todayProof.residual.use_1_365_days': 'Use 1-365 dias.',
  'todayProof.residual.choose_how_strict_the_schedule_should_be':
    'Escolha o quão rigorosa a agenda deve ser',
  'todayProof.residual.the_options_change_the_target_and_the_number_of_missed_days_allo':
    'As opções alteram a meta e a quantidade de dias perdidos permitidos. Escolha uma que a pessoa possa manter em uma semana ocupada.',
  'todayProof.residual.proof_target': 'Meta do comprovativo',
  'todayProof.residual.you_can_change_this_later_if_the_schedule_no_longer_works_for_yo':
    'Pode mudar isso depois se a agenda não funcionar mais para a pessoa.',
  'todayProof.residual.let_other_people_find_this_promise':
    'Permitir que outras pessoas encontrem esta promessa',
  'todayProof.residual.people_outside_the_group_can_find_and_join_this_promise':
    'Pessoas fora do grupo podem encontrar e participar desta promessa.',
  'todayProof.residual.d': 'd',
  'todayProof.residual.this_week': 'Esta semana',
  'todayProof.residual.proof_this_week': 'Comprovativo esta semana',
  'todayProof.residual.progress': 'Progresso',
  'todayProof.residual.day_resets_in': 'Dia reinicia em',
  'todayProof.residual.until_reset': 'até reiniciar',
  'todayProof.residual.confirmed_streak_milestone_receipt':
    'Recibo de marco da sequência confirmado',
  'todayProof.residual.reward': 'Recompensa',
  'todayProof.residual.streak_freeze': 'Congelamento de sequência',
  'todayProof.residual.added_to_your_inventory_for_keeping_this_streak':
    'Adicionado ao seu inventário por manter esta sequência',
  'todayProof.residual.if_you_share': 'Se a pessoa partilhar',
  'todayProof.residual.your_proof_stays_private':
    'O seu comprovativo permanece privada',
  'todayProof.residual.share_milestone': 'partilhar marco',
  'todayProof.residual.loading_promise_details':
    'A carregar detalhes da promessa',
  'todayProof.residual.visible_to': 'Visível para',
  'todayProof.residual.your_proof_is_waiting_for_a_reviewer':
    'O seu comprovativo está a aguardar um analista.',
  'todayProof.residual.this_day_counts_only_after_approval':
    'Este dia conta apenas após aprovação.',
  'todayProof.residual.proof_details_are_unavailable':
    'Detalhes do comprovativo indisponíveis',
  'todayProof.residual.who_reviews': 'Quem analisa?',
  'todayProof.residual.no_history_yet': 'Ainda sem histórico',
  'todayProof.residual.proof_and_confirmed_day_outcomes_will_appear_here':
    'Comprovativo e resultados de dias confirmados aparecerão aqui.',
  'todayProof.residual.newest_first': 'Mais recentes primeiro',
  'todayProof.residual.load_earlier_proof': 'Carregar comprovativo anterior',
  'todayProof.residual.rules_and_people': 'Regras e pessoas',
  'todayProof.residual.what_counts': 'O que conta',
  'todayProof.residual.proof_receipt': 'Recebimento do comprovativo',
  'todayProof.residual.days_approved': 'Dias aprovados',
  'todayProof.residual.share_result': 'partilhar resultado',
  'todayProof.residual.make_another_promise': 'Fazer outra promessa',
  'todayProof.residual.try_again_before_submitting_or_reviewing_proof':
    'Tente novamente antes de enviar ou analisar o comprovativo.',
  'todayProof.residual.report_a_problem': 'Reportar um problema',
  'todayProof.residual.invite_preview': 'PREVISÃO DO CONVITE',
  'todayProof.residual.copy_invite_link': 'Copiar ligação do convite',
  'todayProof.residual.your_promise': 'SUA PROMESSA',
  'todayProof.residual.type_your_promise': 'Introduza sua promessa…',
  'todayProof.residual.daily_minimum': 'MÍNIMO DIÁRIO',
  'todayProof.residual.daily_minimum_2': 'Mínimo diário',
  'todayProof.residual.describe_what_counts_as_done':
    'Descreva o que conta como concluído…',
  'todayProof.residual.proof_should_show': 'comprovativo DEVE MOSTRAR',
  'todayProof.residual.on_time': 'No prazo',
  'todayProof.residual.missed_2': 'Perdido',
  'todayProof.residual.recent_check_ins': 'Registos recentes',
  'todayProof.residual.logged': 'registado',
  'todayProof.residual.today_stays_open_until_you_check_in':
    'Hoje permanecerá aberto até que a pessoa registre.',
  'todayProof.residual.sign_in_again': 'Entrar novamente',
  'todayProof.residual.your_session_ended_before_menta_could_start_this_promise_sign_in':
    'A sua sessão terminou antes que a Menta pudesse iniciar esta promessa. Entre, depois volte aqui antes de tentar novamente.',
  'todayProof.residual.creation_result_unknown':
    'Resultado da criação desconhecido',
  'todayProof.residual.menta_did_not_receive_a_final_answer_we_cannot_say_whether_this_':
    'A Menta não recebeu uma resposta final. Não podemos dizer se esta promessa começou, então verifique Hoje antes de enviá-la novamente.',
  'todayProof.residual.promise_not_created': 'Promessa não criada',
  'todayProof.residual.sign_in_to_return': 'Entrar para regressar',
  'todayProof.residual.this_promise_needs_your_account_before_menta_can_show_its_proof_':
    'Esta promessa precisa da sua conta antes que a Menta possa mostrar o seu comprovativo e estado de análise.',
  'todayProof.residual.promise_not_available_to_this_account':
    'Promessa não disponível para esta conta',
  'todayProof.residual.menta_could_not_confirm_that_this_account_can_open_the_promise_a':
    'Menta não pôde confirmar que esta conta pode abrir a promessa. Peça acesso ao proprietário ou volte para Hoje.',
  'todayProof.residual.promise_unavailable': 'Promessa indisponível',
  'todayProof.residual.this_promise_could_not_be_found_for_the_current_account_it_may_h':
    'Esta promessa não foi encontrada para a conta atual. Pode ter terminado, sido removida ou não estar disponível para a pessoa.',
  'todayProof.residual.promise_unavailable_offline':
    'Promessa indisponível offline',
  'todayProof.residual.menta_cannot_confirm_the_latest_promise_proof_or_review_state_wi':
    'Menta não pode confirmar o estado mais recente da promessa, comprovativo ou análise sem ligação. Nada foi marcado como concluído aqui.',
  'todayProof.residual.promise_could_not_load':
    'Não foi possível carregar a promessa',
  'todayProof.residual.menta_could_not_refresh_this_promise_retry_before_acting_on_a_mi':
    'Menta não pôde atualizar esta promessa. Tente novamente antes de agir sobre um comprovativo ou análise ausente.',
  'todayProof.residual.what_to_change': 'O que mudar',
  'todayProof.residual.your_last_check_in_needs_a_clearer_follow_up_before_the_day_clos':
    'O seu último registo precisa de um acompanhamento mais claro antes do final do dia.',
  'todayProof.residual.saved_on_this_phone': 'guardado neste telemóvel',
  'todayProof.residual.your_draft_stays_on_this_phone_open_menta_when_you_are_online_to':
    'O seu rascunho permanece neste telemóvel. Abra o Menta quando estiver online para continuar o envio.',
  'todayProof.residual.proof_sent': 'Comprovativo enviado',
  'todayProof.residual.your_proof_is_in_but_it_does_not_count_yet_it_counts_after_a_rev':
    'O seu comprovativo foi enviado, mas ainda não conta. Ela conta depois que um analista a aceita, e a pessoa não precisa enviá‑la novamente.',
  'todayProof.residual.proof_approved': 'Comprovativo aprovado',
  'todayProof.residual.menta_could_not_confirm_whether_your_proof_was_sent_your_origina':
    'Menta não pôde confirmar se o seu comprovativo foi enviado. O original ainda está guardado neste telemóvel. Verifique o estado antes de reenviar.',
  'todayProof.residual.not_sent': 'Não enviado',
  'todayProof.residual.check_your_connection_then_try_again':
    'Verifique sua ligação e tente novamente.',
  'todayProof.residual.reward_summary':
    'Manter essa sequência rende cerca de {reward} Momenta, além de um bloqueio nos 7 e 30 dias.',
  'todayProof.milestone.reached': 'Dia de marco {count} alcançado.',
  'todayProof.milestone.reached.one': 'A pessoa chegou ao dia {count}.',
  'todayProof.milestone.reached.other': 'A pessoa chegou a {count} dias.',
  'todayProof.milestone.reward': '+{reward} Momenta',
  'todayProof.streak.day_count': 'Sequência de {count} dia',
  'todayProof.streak.day_count.one': 'Sequência de {count} dia',
  'todayProof.streak.day_count.other': 'Sequência de {count} dia',
  'todayProof.streak.best_count': 'Melhor: {count} dias',
  'todayProof.streak.best_count.one': 'Melhor: {count} dia',
  'todayProof.streak.best_count.other': 'Melhor: {count} dias',
  'todayProof.streak.progress': '{completed} de {total} dias',
  'todayProof.promise.proof_type_approval':
    '{proofType} · um dia conta só depois que o comprovativo for aprovado',
  'todayProof.promise.extend_question': 'Adicionar 12 h à {promise}?',
  'todayProof.promise.extension_cost': 'Isso usa um {item}.',
  'todayProof.promise.active_for': 'Ativo por {duration}',
  'todayProof.promise.available_count': '{count} disponíveis',
  'todayProof.create.step_progress': 'Etapa {current} de {total}',
  'todayProof.residual.missed_day_summary':
    '{count} dias perdidos. O seu próximo registo aceito inicia uma nova sequência.',
  'todayProof.residual.missed_day_summary.one':
    '{count} dia perdido. O seu próximo registo aceito inicia uma nova sequência.',
  'todayProof.residual.missed_day_summary.other':
    '{count} dias perdidos. O seu próximo registo aceito inicia uma nova sequência.',
  'todayProof.correction.title_note': 'Uma anotação mais clara, e pronto',
  'todayProof.correction.detail_note':
    'Adicione uma anotação mais clara para terminar hoje.',
  'todayProof.correction.action_note': 'Adicionar anotação mais clara',
  'todayProof.correction.title_photo': 'Uma fotografia mais clara, e pronto',
  'todayProof.correction.detail_photo':
    'Adicione uma fotografia mais clara para terminar hoje.',
  'todayProof.correction.action_photo': 'Adicionar fotografia mais clara',
  'todayProof.correction.title_video': 'Um vídeo mais claro, e pronto',
  'todayProof.correction.detail_video':
    'Adicione um vídeo mais claro para terminar hoje.',
  'todayProof.correction.action_video': 'Adicionar vídeo mais claro',
  'todayProof.correction.title_proof': 'um comprovativo mais claro, e pronto',
  'todayProof.correction.detail_proof':
    'Adicione um comprovativo mais claro para terminar hoje.',
  'todayProof.correction.action_proof': 'Adicionar comprovativo mais claro',
  'todayProof.source.accountability.previous_proof': 'Provas anteriores',
  'todayProof.source.accountability.only_you': 'Apenas tu',
  'todayProof.source.accountability.visibility_mixed':
    'Apenas tu e as pessoas de cada promessa',
  'todayProof.profile.approved_proof_count': 'Comprovativos aprovados: {count}',
  'todayProof.streak.reminder_row_accessibility':
    'Lembretes de comprovativos. {detail}. Preferência: {status}.',
} as const satisfies Partial<Pick<EnglishCatalogue, FullTodayProofKey>>;
