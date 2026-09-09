import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type CompletionKey =
  | Extract<keyof EnglishCatalogue, `fullAuth.source.${string}`>
  | Extract<keyof EnglishCatalogue, `fullAuth.residual.${string}`>
  | Extract<keyof EnglishCatalogue, `commerce.${string}`>
  | Extract<keyof EnglishCatalogue, `events.${string}`>
  | Extract<keyof EnglishCatalogue, `groups.${string}`>
  | Extract<keyof EnglishCatalogue, `todayProof.${string}`>;

/** Remaining source, residual and parity copy for the complete pt-PT catalogue. */
export const completionPtPT = {
  'fullAuth.source.proof.photo': 'Comprovativo por fotografia',
  'fullAuth.source.proof.video': 'Comprovativo por vídeo',
  'fullAuth.source.proof.note': 'Comprovativo por nota',
  'fullAuth.source.proof.choose': 'Escolher comprovativo',
  'fullAuth.source.example.walk': 'Caminhar por 20 minutos depois do trabalho',
  'fullAuth.source.example.application': 'Enviar a inscrição antes das 17h',
  'fullAuth.source.example.read': 'Ler dez páginas antes de dormir',
  'fullAuth.source.validation.action_required':
    'Escreva a ação que a pessoa quer comprovar.',
  'fullAuth.source.error.account_changed':
    'A sua conta mudou. Abra o onboarding novamente para continuar.',
  'fullAuth.source.error.first_promise_lookup':
    'A Menta não conseguiu confirmar se sua primeira promessa já existe. O seu rascunho está seguro. Tente novamente antes de criá-la.',
  'fullAuth.source.error.incomplete_activation_receipt':
    'A Menta devolveu um recibo de ativação incompleto. O seu rascunho está seguro. Tente novamente antes de criá-lo.',
  'fullAuth.source.error.incomplete_recovered_promise':
    'A Menta devolveu um recibo de ativação incompleto. O seu rascunho está seguro. Tente novamente antes de criá-lo.',
  'fullAuth.source.error.referral_skip_unconfirmed':
    'A Menta não conseguiu confirmar que a pessoa ignorou a indicação. Tente novamente antes de criar sua promessa.',
  'fullAuth.source.error.referral_code_mismatch':
    'Já existe outro código de indicação guardado para esta conta. A Menta restaurou esse código para si continuar ou ignorá-lo.',
  'fullAuth.source.error.referral_code_invalid':
    'Introduza o código de 32 caracteres ou pule esta etapa.',
  'fullAuth.source.error.referral_unavailable':
    'A Menta não conseguiu confirmar o código. Ele continua guardado neste telemóvel. Tente novamente antes de criar sua promessa.',
  'fullAuth.source.error.referral_code_not_added':
    'Não foi possível adicionar este código à sua conta. Verifique o código ou pule esta etapa.',
  'fullAuth.source.error.referral_not_confirmed':
    'A Menta não conseguiu confirmar o código de indicação guardado. Tente novamente antes de criar sua promessa.',
  'fullAuth.source.verification_description':
    'Adicione um comprovativo claro de que a pessoa cumpriu a promessa.',
  'fullAuth.source.submission_text':
    'Diga o que a pessoa concluiu e adicione o comprovativo de hoje.',
  'fullAuth.source.error.incomplete_promise_response':
    'A resposta da sua promessa ficou incompleta. Não a crie novamente. Abra a Menta para recuperá-la.',
  'fullAuth.source.error.draft_safe':
    'O seu rascunho continua seguro neste telemóvel. Tente novamente.',
  'fullAuth.source.error.next_step':
    'A Menta não conseguiu preparar sua próxima etapa. A sua promessa está segura. Tente continuar novamente.',
  'fullAuth.source.error.promise_safe':
    'A sua promessa está segura. Tente continuar novamente.',
  'fullAuth.source.error.sign_in_session':
    'A sessão não devolveu uma sessão autenticada.',
  'fullAuth.source.error.claim_draft':
    'A Menta fez seu sessão, mas não conseguiu assumir este rascunho. Abra o onboarding novamente para recuperá-lo.',
  'fullAuth.source.error.confirm_documents':
    'Confirme os documentos obrigatórios antes de continuar.',
  'fullAuth.source.error.provider_sign_in':
    'A sessão com {providerName} falhou.',
  'fullAuth.source.referral.both_rewarded':
    'Recebeu {referredRewardAmount} Momenta. A pessoa que convidou a pessoa recebeu {inviterRewardAmount}.',
  'fullAuth.source.referral.inviter_capped':
    'Recebeu {referredRewardAmount} Momenta. A pessoa que convidou a pessoa atingiu o limite anual de recompensas.',
  'fullAuth.source.referral.program_disabled':
    'O seu convite foi registado. As recompensas por indicação não estão ativas agora.',
  'fullAuth.source.referral.already_accepted':
    'Este convite já foi registado para a sua conta.',
  'fullAuth.source.referral.unavailable':
    'O seu convite continua guardado neste telemóvel para outra tentativa.',
  'fullAuth.source.referral.accepted': 'O seu convite foi registado.',
  'fullAuth.source.referral.not_added':
    'Nenhuma recompensa por indicação foi adicionada.',
  'fullAuth.source.momenta.added': '{amount} adicionados',
  'fullAuth.source.momenta.already_confirmed': '{amount} já confirmados',
  'fullAuth.source.momenta.no_new_credit': 'Nenhum crédito novo',
  'fullAuth.source.accountability.group_next': 'Criar um grupo em seguida',
  'fullAuth.source.accountability.group_setup_next':
    'Criar um grupo novo em seguida',
  'fullAuth.source.accountability.just_me': 'Só eu',
  'fullAuth.source.receipt.see_today': 'Ver em Hoje',

  'fullAuth.residual.paper_auth.create_account_action': 'Criar conta',
  'fullAuth.residual.paper_auth.creating_account_action': 'Criando conta…',
  'fullAuth.residual.paper_auth.sign_in_action': 'iniciar sessão',
  'fullAuth.residual.paper_auth.signing_in_action': 'Fazenda sessão…',
  'fullAuth.residual.paper_auth.already_have_account': 'Já tem uma conta?',
  'fullAuth.residual.paper_auth.new_to_menta': 'É novo na Menta?',
  'fullAuth.residual.paper_auth.choose_username':
    'Escolha o nome de utilizador que as pessoas verão na Menta.',
  'fullAuth.residual.paper_auth.minimum_three_characters':
    'Use pelo menos 3 caracteres.',
  'fullAuth.residual.paper_auth.username_characters':
    'Use apenas letras, números ou sublinhados no seu nome de utilizador.',
  'fullAuth.residual.paper_auth.account_email':
    'Introduza o e-mail desta conta Menta.',
  'fullAuth.residual.paper_auth.valid_email':
    'Introduza um endereço de e-mail válido.',
  'fullAuth.residual.paper_auth.enter_password': 'Introduza sua palavra-passe.',
  'fullAuth.residual.paper_auth.create_password': 'Crie uma palavra-passe.',
  'fullAuth.residual.paper_auth.password_minimum':
    'Use pelo menos {length} caracteres.',
  'fullAuth.residual.paper_auth.confirm_password':
    'Confirme sua palavra-passe.',
  'fullAuth.residual.paper_auth.passwords_match':
    'Os dois campos de palavra-passe precisam ser iguais.',
  'fullAuth.residual.paper_auth.duplicate_email':
    'Este e-mail já está associado a uma conta Menta.',
  'fullAuth.residual.paper_auth.fallback_sign_in':
    'Não foi possível iniciar sessão com esses dados.',
  'fullAuth.residual.paper_auth.fallback_create':
    'Não foi possível criar essa conta.',
  'fullAuth.residual.paper_auth.error_state':
    'A sua promessa continua aqui. Corrija o campo destacado ou faça sessão.',
  'fullAuth.residual.paper_auth.return_to_promise':
    'Voltar à sua primeira promessa',
  'fullAuth.residual.paper_auth.switch_sign_in': 'iniciar sessão',
  'fullAuth.residual.paper_auth.switch_create': 'Criar conta',
  'fullAuth.residual.paper_reset.sending_link': 'A enviar ligação…',
  'fullAuth.residual.paper_reset.back_to_sign_in': 'Voltar à sessão',
  'fullAuth.residual.paper_reset.remembered_it': 'Lembrou da palavra-passe?',
  'fullAuth.residual.paper_reset.password_changes_after_link':
    'A sua palavra-passe só muda depois que a pessoa usa o ligação.',
  'fullAuth.residual.paper_reset.another_link_available':
    'Há outro ligação disponível em {label}.',
  'fullAuth.residual.paper_reset.sending_another_link':
    'A enviar outro ligação…',
  'fullAuth.residual.paper_reset.send_another_link_in':
    'Enviar outro ligação em {countdown}',
  'fullAuth.residual.paper_reset.send_another_link': 'Enviar outro ligação',
  'fullAuth.residual.oauth.apple_sign_in_fallback':
    'Não foi possível iniciar sessão com a Apple. Tente novamente ou use o e-mail.',
  'fullAuth.residual.legal.sign_in_again':
    'Inicie sessão novamente para analisar estes documentos.',
  'fullAuth.residual.legal.load_online':
    'A Menta não conseguiu carregar os documentos atuais. Tente novamente antes de criar uma nova promessa.',
  'fullAuth.residual.legal.load_offline':
    'Conecte-se à internet para verificar e aceitar os documentos atuais.',
  'fullAuth.residual.legal.save_offline':
    'Conecte-se à internet para guardar seu acordo. Ele não foi guardado offline.',
  'fullAuth.residual.legal.changed':
    'Os documentos mudaram enquanto este ecrã estava aberta. Analise as versões atuais e aceite novamente.',
  'fullAuth.residual.legal.save_online':
    'A Menta não conseguiu guardar seu acordo. Nada mais mudou. Tente novamente.',
  'fullAuth.residual.legal.save_connection':
    'A ligação terminou antes de a Menta guardar seu acordo. Conecte-se novamente e tente outra vez.',
  'fullAuth.residual.legal.title_continue': 'Antes de continuar',
  'fullAuth.residual.legal.title_update': 'Analise o que mudou',
  'fullAuth.residual.legal.title_settings': 'Analise seus documentos Menta',
  'fullAuth.residual.legal.title_create': 'Antes de criar',
  'fullAuth.residual.legal.return_settings': 'Voltar às definições',
  'fullAuth.residual.legal.continue_create': 'Continuar para criar',
  'fullAuth.residual.legal.continue_menta': 'Continuar para a Menta',
  'fullAuth.residual.legal.body_update':
    'Leia os documentos atualizados e aceite as novas versões.',
  'fullAuth.residual.legal.body_post_auth':
    'Leia os três documentos curtos abaixo e aceite uma vez para esta conta.',
  'fullAuth.residual.legal.body_settings':
    'Analise os documentos atuais da sua conta.',
  'fullAuth.residual.legal.body_create':
    'Leia os três documentos curtos abaixo e aceite-os antes de criar uma promessa.',
  'fullAuth.residual.legal.accepted':
    'A pessoa aceitou as versões atuais dos documentos para esta conta.',
  'fullAuth.residual.legal.leave_blocked':
    'Pode sair sem aceitar. A sua conta e o conteúdo existente continuam disponíveis, mas a pessoa não poderá criar uma nova promessa até aceitar as versões atuais.',
  'fullAuth.residual.legal.leave_available':
    'Pode sair sem aceitar. A sua conta e as promessas existentes continuam disponíveis.',
  'fullAuth.residual.legal.document_open_failed':
    '{label} não abriu. Tente novamente.',
  'fullAuth.residual.notifications.sign_in_again':
    'Inicie sessão novamente para gerir as definições de notificações.',
  'fullAuth.residual.notifications.load_failed':
    'Não foi possível carregar as definições de notificações. Suas escolhas guardadas não mudaram.',
  'fullAuth.residual.notifications.still_apply':
    'Suas escolhas de notificações guardadas ainda podem estar valendo. Tente novamente ou volte para Definições.',
  'fullAuth.residual.notifications.auto_save':
    'As alterações são guardadas automaticamente.',
  'fullAuth.residual.notifications.off_save':
    'As escolhas são guardadas aqui. As notificações continuam desativadas neste telemóvel.',
  'fullAuth.residual.report.sign_in_description':
    'Inicie sessão novamente antes de abrir este relatório. Os rascunhos permanecem privados para a conta que os criou.',
  'fullAuth.residual.report.return_description':
    'Volte para Suporte e inicie um novo relatório para esta conta.',
  'fullAuth.residual.report.sign_in_required': 'sessão necessário',
  'fullAuth.residual.report.other_account':
    'Este relatório pertence a outra conta',
  'fullAuth.residual.report.received_content':
    'A Menta recebeu este relatório. A equipa de segurança autorizada pode analisar o conteúdo denunciado, inclusive o conteúdo de grupos somente por convite. Outros membros não podem ver quem fez a denúncia.',
  'fullAuth.residual.report.received_feedback':
    'O Suporte recebeu seu comentários. O seu comprovativo, sequência e histórico de grupos não mudaram.',
  'fullAuth.residual.report.received_report':
    'O Suporte recebeu seu relatório. O seu comprovativo, sequência e histórico de grupos não mudaram enquanto ele aguarda análise.',
  'fullAuth.residual.report.status_received': 'Recebido',
  'fullAuth.residual.report.status_queued': 'Na fila',
  'fullAuth.residual.report.feedback_heading': 'O que devemos saber?',
  'fullAuth.residual.report.issue_heading': 'O que deu errado?',
  'fullAuth.residual.report.check_heading': 'Verifique e envie',
  'fullAuth.residual.report.feedback_description':
    'Conte o que está funcionando, o que não está ou o que tornaria a Menta melhor.',
  'fullAuth.residual.report.issue_description':
    'Conte o que a pessoa estava a fazer e o que a Menta fez. Esses detalhes ajudam a equipa de Suporte a investigar.',
  'fullAuth.residual.report.check_description':
    'Leia novamente. Tudo abaixo é opcional.',
  'fullAuth.residual.report.screenshot_feedback':
    'Adicione uma captura de ecrã se isso ajudar a explicar seu comentários.',
  'fullAuth.residual.report.screenshot_issue':
    'Adicione uma captura de ecrã que ajude o Suporte a entender o problema.',
  'fullAuth.residual.report.feedback_label': 'comentários',
  'fullAuth.residual.report.what_happened_label': 'O que aconteceu?',
  'fullAuth.residual.report.included_feedback': 'Incluído com o comentários',
  'fullAuth.residual.report.included_report': 'Incluído com o relatório',
  'fullAuth.residual.report.message_label': 'Mensagem',
  'fullAuth.residual.report.report_label': 'Relatório',
  'fullAuth.residual.report.form_label': 'este formulário',
  'fullAuth.residual.report.report_context_label': 'o relatório',
  'fullAuth.residual.report.feedback_title': 'comentários para a Menta',
  'fullAuth.residual.report.category_promise': 'Promessa',
  'fullAuth.residual.report.category_group': 'Grupo',
  'fullAuth.residual.report.category_proof': 'Comprovativo',
  'fullAuth.residual.report.category_member': 'Membro',
  'fullAuth.residual.report.category_app_issue': 'Problema na aplicação',
  'fullAuth.residual.settings.offline_value': 'offline',
  'fullAuth.residual.settings.retry_value': 'Tentar novamente',
  'fullAuth.residual.settings.restart_loading': 'Reiniciando…',
  'fullAuth.residual.settings.checking_loading': 'A verificar…',
  'fullAuth.residual.settings.restart_value': 'Reiniciar',
  'fullAuth.residual.settings.check_value': 'Verificar',
  'fullAuth.residual.settings.loading_value': 'A carregar…',
  'fullAuth.residual.settings.on_value': 'Ativadas',
  'fullAuth.residual.settings.off_value': 'desativadas',
  'fullAuth.residual.settings.opening_value': 'Abrindo…',
  'fullAuth.residual.settings.advanced_title': 'Diagnóstico avançado ativado',
  'fullAuth.residual.settings.advanced_prompt':
    'partilhar diagnóstico avançado?',
  'fullAuth.residual.settings.advanced_full_body':
    'Se ativar esta opção, a Menta partilha medições de desempenho por amostragem com o Sentry. A reprodução de sessões da Amplitude funciona separadamente; o texto, os campos de introdução e as imagens são ocultados. Isto não ativa anúncios nem rastreamento entre aplicações.',
  'fullAuth.residual.settings.advanced_basic_body':
    'Se a pessoa ativar esta opção, a Menta partilhará medições extras de desempenho com o Sentry. Isso não ativa anúncios nem rastreamento entre aplicações.',

  'commerce.paywall.quotaGroup.one':
    'O plano grátis inclui até {limit} grupo ativo por vez.',
  'commerce.paywall.quotaGroup.other':
    'O plano grátis inclui até {limit} grupos ativos por vez.',
  'commerce.paywall.savedSubject.group':
    'O seu grupo está guardado enquanto a pessoa escolhe o que fazer em seguida.',
  'commerce.paywall.savedSubject.promise':
    'A sua promessa está guardada enquanto a pessoa escolhe o que fazer em seguida.',
  'commerce.paywall.savedSubject.draft':
    'O seu rascunho está guardado enquanto a pessoa escolhe o que fazer em seguida.',
  'commerce.paywall.oneAdEnough.group':
    'Um anúncio adiciona {amount} Momenta, o suficiente para este grupo.',
  'commerce.paywall.oneAdEnough.promise':
    'Um anúncio adiciona {amount} Momenta, o suficiente para esta promessa.',
  'commerce.paywall.oneAdEnough.draft':
    'Um anúncio adiciona {amount} Momenta, o suficiente para este rascunho.',
  'commerce.commerce.loadingTitle': 'A verificar os detalhes mais recentes',
  'commerce.commerce.loadingDetail': 'A carregar seu saldo e seus itens.',

  'events.detail.join_unknown_with_message':
    '{message} Não inicie uma segunda participação. Verifique este pedido novamente primeiro.',
  'events.check_in.unknown_with_message':
    '{message} Verifique este check-in novamente antes de inserir outro código.',

  'groups.tab.offline_title': 'Está offline',
  'groups.list.load_failed': 'Não foi possível carregar os grupos',
  'groups.archive.load_failed':
    'Não foi possível carregar os grupos arquivados',
  'groups.source.image_move_description':
    'Caminhada, exercícios e rotinas ativas',
  'groups.source.image_focus_description':
    'Estudos, planejamento e trabalho concentrado',
  'groups.source.image_reset_description':
    'Descanso, reflexão e rotinas tranquilas',
  'groups.source.image_create_description': 'Escrita, arte, música e criação',
  'groups.source.metric.member_unit': 'membro',
  'groups.source.metric.members_unit': 'membros',
  'groups.admin.members_load_failed': 'Não foi possível carregar os membros',
  'groups.board.review_member': 'Analisar o comprovativo de {member}',
  'groups.join.receipt.already_title': 'Já está neste grupo.',
  'groups.join.receipt.joined_title': 'Entrou em {group}.',
  'groups.join.invalid_title': 'Esse código de convite não foi reconhecido',
  'groups.join.invalid_code_title':
    'Esse código não corresponde a nenhum convite',
  'groups.detail.not_archived_title': 'Grupo não arquivado',
  'groups.source.metric.day_streak_unit': 'sequência de dias do grupo',
  'groups.source.metric.day_streak_value': 'Sequência de {count} dias',
  'groups.detail.privacy_group.discoverable': 'Grupo encontrável',
  'groups.detail.privacy_group.invite_link_only':
    'Grupo acessível somente por ligação de convite',
  'groups.detail.privacy_group.invite_only':
    'Grupo acessível somente por convite',
  'groups.source.date.no_fixed': 'Sem datas fixas',
  'groups.source.date.range': '{start} a {end}',
  'groups.source.date.starts': 'Começa em {date}',
  'groups.source.date.ends': 'Termina em {date}',
  'groups.source.member.fallback': 'Membro',
  'groups.source.group.fallback': 'Grupo',
  'groups.source.member.count': '{count} membros',
  'groups.source.member.count.one': '{count} membro',
  'groups.source.member.count.other': '{count} membros',
  'groups.source.role.owner': 'Proprietário',
  'groups.source.role.admin': 'Administrador',
  'groups.source.role.moderator': 'Moderador',
  'groups.source.role.member': 'Membro',
  'groups.source.privacy.discoverable': 'Encontrável',
  'groups.source.privacy.invite_link_only': 'Somente por ligação de convite',
  'groups.source.privacy.invite_only': 'Somente por convite',
  'groups.source.header.member': '{role} · {members}',
  'groups.source.header.public': '{privacy} · {members}',
  'groups.source.review.rule':
    'Os membros publicam comprovativos. Outro membro elegível analisa cada uma.',
  'groups.source.board.headline.ready': 'Quadro pronto',
  'groups.source.board.headline.review': '{count} análises',
  'groups.source.board.headline.review.one': '{count} análise',
  'groups.source.board.headline.review.other': '{count} análises',
  'groups.source.board.headline.promise_live': '{count} promessas ativas',
  'groups.source.board.headline.promise_live.one': '{count} promessa ativa',
  'groups.source.board.headline.promise_live.other': '{count} promessas ativas',
  'groups.source.board.hint.first_rule':
    'Adicione a primeira regra de comprovativo',
  'groups.source.board.hint.members': '{count} membros',
  'groups.source.board.hint.members.one': '{count} membro',
  'groups.source.board.hint.members.other': '{count} membros',
  'groups.source.streak.progress': '{completed} de {total} dias confirmados',
  'groups.source.board.body.empty':
    'Adicione a primeira promessa partilhada antes do prazo do comprovativo diário.',
  'groups.source.board.body.review':
    'Analise o comprovativo pendente para atualizar o registo do grupo.',
  'groups.source.board.body.due':
    'Envie o comprovativo da promessa partilhada quando chegar a hora do seu check-in.',
  'groups.source.proof.count': '{count} comprovativos',
  'groups.source.proof.count.one': '{count} comprovativo',
  'groups.source.proof.count.other': '{count} comprovativos',
  'groups.source.metric.proof_unit': 'comprovativo para analisar',
  'groups.source.metric.proofs_unit': 'comprovativos para analisar',
  'groups.source.proof.pending': '{count} comprovativos para analisar',
  'groups.source.proof.pending.one': '{count} comprovativo para analisar',
  'groups.source.proof.pending.other': '{count} comprovativos para analisar',
  'groups.source.summary.accessibility':
    'Sequência de {streak} dias do grupo. {members}. {pending}.',
  'groups.source.promise.default_title': 'Promessa partilhada',
  'groups.source.promise.default_subtitle':
    'Abra a regra de comprovativo e envie a de hoje.',
  'groups.source.promise.detail_default':
    'Abra a promessa para ver sua regra de comprovativo e seu histórico.',
  'groups.source.promise.detail': 'Abrir os detalhes da promessa.',
  'groups.source.review.waiting': '{count} comprovativos a aguardar análise.',
  'groups.source.review.waiting.one':
    '{count} comprovativo a aguardar análise.',
  'groups.source.review.waiting.other':
    '{count} comprovativos a aguardar análise.',
  'groups.source.review.button': 'Analisar {count} comprovativos',
  'groups.source.review.button.one': 'Analisar {count} comprovativo',
  'groups.source.review.button.other': 'Analisar {count} comprovativos',
  'groups.source.review.open': 'Analisar {count}',
  'groups.source.member.view_all': 'Ver todos os {count}',
  'groups.source.read_only.ended_on':
    'Este grupo terminou em {date}. Pode ver suas promessas, membros e histórico de comprovativos.',
  'groups.source.read_only.failed':
    'Este grupo terminou sem atingir sua meta. Pode ver suas promessas, membros e histórico de comprovativos.',
  'groups.source.read_only.ended':
    'Este grupo terminou. Pode ver suas promessas, membros e histórico de comprovativos.',

  'todayProof.today.last_update_detail':
    'A Menta não conseguiu atualizar esta lista. Suas últimas promessas carregadas continuam visíveis.',
  'todayProof.solo.open_hint':
    'Mostra a ação de comprovativo de hoje, o histórico e a programação.',
  'todayProof.source.promise.submission_time_unavailable':
    'Horário de envio indisponível',
  'todayProof.source.relative.sent_minutes': 'Enviada há {count} minutos',
  'todayProof.source.relative.sent_minutes.one': 'Enviada há {count} minuto',
  'todayProof.source.relative.sent_minutes.other': 'Enviada há {count} minutos',
  'todayProof.source.relative.sent_hours': 'Enviada há {count} horas',
  'todayProof.source.relative.sent_hours.one': 'Enviada há {count} hora',
  'todayProof.source.relative.sent_hours.other': 'Enviada há {count} horas',
  'todayProof.source.relative.sent_weekday': 'Enviada {weekday}',
  'todayProof.source.history.approved': '{media} aprovada',
  'todayProof.source.history.needs_another_try':
    '{media} precisa de outra tentativa',
  'todayProof.source.outcome.missed':
    'O comprovativo não foi recebida até o prazo. A sequência anterior terminou em {streak}.',
  'todayProof.source.outcome.protected_freeze':
    'Um Congelamento de sequência protegeu este dia. A sequência permaneceu em {streak}.',
  'todayProof.source.outcome.protected':
    'Este dia foi protegido. A sequência permaneceu em {streak}.',
  'todayProof.proof.accepted_detail':
    'O seu comprovativo foi aprovado e agora conta para a promessa de hoje.',
  'todayProof.proof.share_accepted':
    'O meu comprovativo da promessa de hoje foi aprovada na Menta.',
  'todayProof.proof.share_pending':
    'Enviei o comprovativo de hoje na Menta. Ela aguarda análise.',
  'todayProof.proof.text_label': 'Comprovativo de hoje',
  'todayProof.review.does_not_match_rule':
    'Não corresponde à regra de comprovativo',
  'todayProof.source.review.changed_detail_with_note_preserved':
    'Ela mudou enquanto a pessoa a analisava. Nada foi enviado. Recarregue antes de decidir. A sua nota de correção não enviada ficará aqui até a pessoa recarregar ou sair da fila. Nota: {note}',
  'todayProof.source.review.item_accessibility':
    'Comprovativo de {name} para {promise}',
  'todayProof.source.streak.day_unit': 'dia',
  'todayProof.source.streak.days_unit': 'dias',
  'todayProof.source.streak.day_streak_unit': 'sequência de dias',
  'todayProof.source.streak.minute_unit': 'minuto',
  'todayProof.source.streak.minutes_unit': 'minutos',
  'todayProof.residual.start_today_s_proof': 'Começar o comprovativo de hoje',
  'todayProof.residual.people_can_find_and_join_it_each_person_s_proof_counts_when_they':
    'As pessoas podem encontrá-la e participar. O comprovativo de cada pessoa conta quando é enviada.',
  'todayProof.residual.this_promise_isn_t_available':
    'Esta promessa não está disponível.',
  'todayProof.residual.delivery_not_confirmed': 'Envio não confirmado',
  'todayProof.residual.promise_status_unavailable':
    'estado da promessa indisponível',
  'todayProof.residual.proof_still_saved_on_this_phone':
    'O seu comprovativo continua guardada neste telemóvel.',
  'todayProof.residual.nothing_saved_on_this_phone_was_changed':
    'Nada do que está guardado neste telemóvel foi alterado.',
  'todayProof.residual.proof_receive_not_confirmed':
    'Ainda não confirmamos que ela foi recebida.',
  'todayProof.residual.latest_promise_details_not_confirmed':
    'Não conseguimos confirmar os detalhes mais recentes da promessa.',
  'todayProof.residual.it_now_counts_for_today_s_promise':
    'Agora ela conta para a promessa de hoje.',
  'todayProof.residual.we_couldn_t_confirm_the_send':
    'Não conseguimos confirmar o envio',
  'todayProof.source.media.text': 'Comprovativo por texto',
  'todayProof.source.media.video': 'Vídeo',
  'todayProof.source.media.photo': 'Fotografia',
  'todayProof.source.media.proof': 'Comprovativo',
  'todayProof.source.verification.missing_promise':
    'Faltam informações da promessa. Abra este ecrã novamente pela ecrã da promessa.',
  'todayProof.source.verification.unsupported_type':
    'Este tipo de comprovativo ainda não é compatível aqui. Abra a promessa novamente para continuar.',
  'todayProof.source.lifecycle.due': 'Comprovativo pendente',
  'todayProof.source.lifecycle.saved': 'guardada neste dispositivo',
  'todayProof.source.lifecycle.uploading': 'A enviar comprovativo',
  'todayProof.source.lifecycle.sent': 'Comprovativo enviado',
  'todayProof.source.lifecycle.pending': 'Análise pendente',
  'todayProof.source.lifecycle.accepted': 'Comprovativo aceita',
  'todayProof.source.lifecycle.correction':
    'O comprovativo precisa de uma resposta mais clara',
  'todayProof.source.lifecycle.unknown':
    'Não conseguimos confirmar o resultado',
  'todayProof.source.lifecycle.failed': 'O comprovativo não foi enviada',
  'todayProof.source.creation.failed':
    'A Menta não conseguiu iniciar esta promessa.',
} as const satisfies Partial<Pick<EnglishCatalogue, CompletionKey>>;
