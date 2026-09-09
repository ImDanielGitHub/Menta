import type { CompleteCatalogue } from '@/lib/localization/en-NZ';

/**
 * Portuguese copy introduced by the promise-accountability and invite-first
 * onboarding release. The shared catalogue uses neutral phrasing where both
 * regions use the same product language. Regional objects below override only
 * established Brazil/Portugal differences.
 */
export const accountabilityDeltaPt = {
  'fullAuth.source.accountability.no_invitation_waiting':
    'Não há nenhum convite à espera desta conta.',
  'fullAuth.source.accountability.invitation_and_documents_check_failed':
    'A Menta não conseguiu verificar este convite e os documentos atuais.',
  'fullAuth.source.accountability.documents_need_agreement':
    'Ainda é preciso aceitar os documentos atuais.',
  'fullAuth.source.accountability.account_changed_reopen_invite':
    'A conta mudou. Abra o convite novamente.',
  'fullAuth.source.accountability.save_agreement_failed':
    'A Menta não conseguiu salvar a sua aceitação.',
  'fullAuth.source.accountability.invitation_changed':
    'Este convite mudou. Abra novamente o convite mais recente.',
  'fullAuth.source.accountability.finish_setup_failed':
    'A Menta não conseguiu concluir a configuração desta conta.',
  'fullAuth.source.accountability.continue_to_invitation':
    'Continuar para o convite',
  'fullAuth.source.accountability.promise_invited_by':
    '{inviterName} convidou você.',
  'fullAuth.source.accountability.event_invited':
    'Você recebeu um convite para {eventTitle}.',
  'fullAuth.source.accountability.continue_with_invitation':
    'Continuar com o seu convite',
  'fullAuth.source.accountability.documents_check_failed':
    'A Menta não conseguiu verificar os documentos atuais da conta.',
  'fullAuth.source.accountability.account_setup': 'Configuração da conta',
  'fullAuth.source.accountability.setup_load_failed':
    'Não foi possível carregar a configuração',
  'fullAuth.source.accountability.invitation_unavailable':
    'Convite indisponível',
  'fullAuth.source.accountability.start_own_promise':
    'Começar com a minha própria promessa',
  'fullAuth.source.accountability.setup_then_review':
    'Conclua esta breve configuração da conta e depois analise o convite. Você ainda não entrou em nada.',
  'fullAuth.source.accountability.agreements_current_title':
    'As suas aceitações estão em dia',
  'fullAuth.source.accountability.agreements_current_description':
    'A Menta confirmou as versões atuais dos documentos para esta conta.',
  'fullAuth.source.accountability.setup_incomplete_title':
    'A configuração da conta não está concluída',
  'fullAuth.source.accountability.choose_reminders': 'Escolher lembretes',
  'fullAuth.source.accountability.documents_load_failed_title':
    'Não foi possível carregar os documentos',
  'fullAuth.source.accountability.documents_load_failed_description':
    'A sua promessa está segura. Verifique a conexão antes de entrar.',
  'fullAuth.source.accountability.documents_changed_title':
    'Os documentos mudaram',
  'fullAuth.source.accountability.documents_changed_description':
    'Analise as versões atuais e aceite novamente.',
  'fullAuth.source.accountability.documents_loading_title':
    'Os documentos ainda estão carregando',
  'fullAuth.source.accountability.documents_loading_description':
    'Aguarde um momento e tente novamente.',
  'fullAuth.source.accountability.referral_code_format_error':
    'Verifique o código de 32 caracteres ou continue sem um código de indicação.',
  'fullAuth.source.email_confirmation.resend_offline':
    'Você está sem conexão. Reconecte-se e reenvie a confirmação.',
  'fullAuth.source.email_confirmation.resend_rate_limited':
    'A Menta ainda não pode enviar outro e-mail. Aguarde um momento e tente novamente.',
  'fullAuth.source.email_confirmation.resend_failed':
    'A Menta não conseguiu reenviar a confirmação. O seu cadastro continua aguardando.',
  'fullAuth.source.email_confirmation.restore_failed_title':
    'Não foi possível restaurar este cadastro',
  'fullAuth.source.email_confirmation.restore_failed_description':
    'A Menta não conseguiu ler o e-mail salvo neste dispositivo. Você ainda pode entrar com segurança.',
  'fullAuth.source.email_confirmation.expired_title':
    'Esse link de confirmação expirou',
  'fullAuth.source.email_confirmation.expired_description':
    'A sua promessa e o seu convite continuam salvos. Envie um novo e-mail de confirmação abaixo.',
  'fullAuth.source.email_confirmation.invalid_title':
    'Esse link de confirmação não é válido',
  'fullAuth.source.email_confirmation.invalid_description':
    'Talvez ele já tenha sido usado. Verifique novamente neste dispositivo, reenvie o e-mail ou entre na conta.',
  'fullAuth.source.email_confirmation.account_mismatch_title':
    'Esse link pertence a outra conta',
  'fullAuth.source.email_confirmation.account_mismatch_description':
    'A Menta não vinculou a sua promessa ou o seu convite salvos a uma conta diferente.',
  'fullAuth.source.email_confirmation.storage_title':
    'Mantenha a Menta aberta por enquanto',
  'fullAuth.source.email_confirmation.storage_description':
    'O e-mail de confirmação foi solicitado, mas este dispositivo não conseguiu salvar a continuação para uma abertura futura do app.',
  'fullAuth.source.email_confirmation.callback_failed_title':
    'Não foi possível concluir a confirmação',
  'fullAuth.source.email_confirmation.callback_failed_description':
    'O seu cadastro continua aguardando. Abra o link do e-mail novamente ou reenvie-o abaixo.',
  'fullAuth.source.email_confirmation.reopen_failed_title':
    'Não foi possível reabrir o cadastro',
  'fullAuth.source.email_confirmation.reopen_failed_description':
    'A Menta manteve o e-mail pendente para que você não envie o mesmo cadastro duas vezes por engano. Tente novamente.',
  'fullAuth.source.email_confirmation.signed_in_account_mismatch_title':
    'Há outra conta conectada',
  'fullAuth.source.email_confirmation.signed_in_account_mismatch_description':
    'A Menta não vinculou este cadastro a essa conta. Saia da outra conta antes de continuar.',
  'fullAuth.source.email_confirmation.no_session_title':
    'Ainda não há uma sessão confirmada neste dispositivo',
  'fullAuth.source.email_confirmation.no_session_description':
    'Abra o link de confirmação mais recente neste dispositivo. Se você confirmou em outro lugar, entre com a sua senha.',
  'fullAuth.source.email_confirmation.check_failed_title':
    'Não foi possível verificar a confirmação',
  'fullAuth.source.email_confirmation.check_failed_description':
    'O seu cadastro continua salvo. Verifique a conexão e tente novamente.',
  'fullAuth.source.email_confirmation.resent_title': 'Nova confirmação enviada',
  'fullAuth.source.email_confirmation.resent_description':
    'Verifique {email} e abra o link mais recente.',
  'fullAuth.source.email_confirmation.resend_failed_title':
    'Não foi possível reenviar a confirmação',
  'fullAuth.source.email_confirmation.restoring':
    'Restaurando a sua confirmação por e-mail…',
  'fullAuth.source.email_confirmation.no_pending_title':
    'Não há nenhum cadastro aguardando',
  'fullAuth.source.email_confirmation.no_pending_description':
    'Este dispositivo não tem uma confirmação por e-mail para retomar. Entre se você já tiver uma conta Menta.',
  'fullAuth.source.email_confirmation.change_email': 'Alterar e-mail',
  'fullAuth.source.email_confirmation.heading': 'Verifique o seu e-mail',
  'fullAuth.source.email_confirmation.instruction':
    'Abra o link de confirmação mais recente da Menta neste dispositivo para continuar.',
  'fullAuth.source.email_confirmation.email_accessibility':
    'E-mail de confirmação {email}',
  'fullAuth.source.email_confirmation.email_label': 'E-mail de confirmação',
  'fullAuth.source.email_confirmation.saved_state_description':
    'A sua promessa inacabada e qualquer indicação ou convite salvo permanecem neste dispositivo. A Menta guarda as versões legais e o horário em que você as aceitou, verifica tudo novamente depois que você entra e só conclui a integração quando uma sessão para este e-mail é confirmada.',
  'fullAuth.source.email_confirmation.confirmed_action':
    'Já confirmei o meu e-mail',
  'fullAuth.source.email_confirmation.resend_countdown':
    'Reenviar em {seconds}s',
  'fullAuth.source.email_confirmation.resend_action': 'Reenviar confirmação',
  'commerce.wallet.rewardCheckingTitle': 'Verificando a sua recompensa',
  'commerce.wallet.rewardCheckingDetail':
    'Mantenha esta tela aberta até a verificação terminar.',
  'commerce.wallet.rewardMissingTitle': 'A recompensa ainda não chegou',
  'commerce.wallet.rewardMissingDetail':
    'Atualize o seu saldo antes de assistir a outro patrocinador.',
  'commerce.wallet.refreshBalanceAction': 'Atualizar saldo',
  'commerce.wallet.rewardDailyLimitTitle': 'Isso é tudo por hoje',
  'commerce.wallet.rewardDailyLimitDetail':
    'Você já recebeu as recompensas de patrocinadores de hoje.',
  'commerce.wallet.rewardCheckingAccessibility':
    'Verificando o estado da recompensa',
  'commerce.wallet.refreshingBalance': 'Atualizando o saldo…',
  'commerce.wallet.rewardClaimInProgress':
    'A Menta ainda está verificando a recompensa anterior.',
  'groups.source.accountability.invite_button_label':
    'Convidar alguém para uma promessa',
  'groups.source.accountability.invite_button_hint':
    'Escolha uma promessa e um papel de responsabilidade.',
  'groups.source.accountability.invite_short': 'Convidar',
  'groups.source.accountability.shared_tab': 'Compartilhado',
  'groups.source.accountability.shared_tab_hint':
    'Mostra promessas compartilhadas e grupos salvos.',
  'groups.source.accountability.loading_together': 'Carregando Juntos',
  'groups.source.accountability.shared_promises': 'Promessas compartilhadas',
  'groups.source.accountability.together_load_failed':
    'Não foi possível carregar Juntos',
  'groups.source.accountability.empty_title':
    'Convide alguém para uma promessa.',
  'groups.source.accountability.empty_detail':
    'Escolha uma promessa e depois decida como outra pessoa pode ajudar.',
  'groups.source.accountability.choose_promise': 'Escolher uma promessa',
  'groups.source.accountability.create_saved_group': 'Criar um grupo salvo',
  'groups.source.accountability.open_shared_promise_hint':
    'Abre esta promessa compartilhada e as pessoas dela.',
  'groups.source.accountability.shared_promise_accessibility':
    '{promise}. {count} pessoas.',
  'groups.source.accountability.shared_promise_accessibility.one':
    '{promise}. {count} pessoa.',
  'groups.source.accountability.shared_promise_accessibility.other':
    '{promise}. {count} pessoas.',
  'groups.source.accountability.saved_groups': 'Grupos salvos',
  'groups.source.accountability.offline_detail':
    'Estas são as últimas promessas compartilhadas e os últimos grupos salvos neste celular. Conecte-se antes de mudar as pessoas ou entrar em algo.',
  'groups.source.accountability.people_shortcut_hint':
    'Abre as pessoas e os papéis de responsabilidade desta promessa.',
  'groups.source.accountability.people_check_failed':
    'Não foi possível verificar as pessoas',
  'groups.source.accountability.people_in_promise': 'Pessoas nesta promessa',
  'groups.source.accountability.bring_person':
    'Convidar alguém para esta promessa',
  'groups.source.accountability.checking_people':
    'Verificando quem está participando…',
  'groups.source.accountability.open_retry':
    'Abra a promessa e tente novamente antes de convidar outra pessoa',
  'groups.source.accountability.open_roles_progress':
    '{people} · Abrir papéis e progresso',
  'groups.source.accountability.invite_methods':
    'Fazer juntos, pedir uma análise ou receber apoio',
  'groups.source.accountability.check_group_first_title':
    'Verifique este grupo primeiro',
  'groups.source.accountability.check_group_first_detail':
    'A Menta ainda tem uma solicitação salva para este grupo. Verifique o estado dela antes de criar ou mudar qualquer coisa.',
  'groups.source.accountability.status_needs_checking':
    'É preciso verificar o estado do grupo',
  'groups.source.accountability.check_before_creating_again':
    'Verificar antes de criar novamente',
  'groups.source.accountability.checking_group': 'Verificando este grupo',
  'groups.source.accountability.checking_group_detail':
    'A Menta está verificando a solicitação salva. Isso não cria outro grupo nem gasta Momenta.',
  'groups.source.accountability.nothing_created_or_spent':
    'Nada foi criado ou gasto',
  'groups.source.accountability.still_checking_group':
    'Ainda estamos verificando este grupo',
  'groups.source.accountability.no_saved_request_title':
    'Nenhuma solicitação salva encontrada',
  'groups.source.accountability.no_saved_request_detail':
    'A Menta não encontrou nenhuma solicitação de grupo pendente. Analise o grupo antes de criá-lo.',
  'groups.source.accountability.check_unavailable_title':
    'Ainda não foi possível verificar este grupo',
  'groups.source.accountability.check_unavailable_detail':
    'Mantenha este rascunho e verifique novamente antes de criar outro grupo.',
  'groups.source.accountability.reopen_draft_title':
    'Não foi possível reabrir o rascunho',
  'groups.source.accountability.reopen_draft_detail':
    'A verificação de estado é segura, mas a Menta não conseguiu atualizar o rascunho salvo neste celular. Tente novamente.',
  'groups.source.accountability.checking_creation_accessibility':
    'Verificando se o grupo foi criado',
  'groups.source.accountability.status_check_safe_detail':
    'Esta verificação de estado não pode criar um segundo grupo nem gastar mais Momenta.',
  'groups.source.accountability.recovery_details_saved':
    'Os detalhes do seu grupo continuam salvos neste celular.',
  'groups.source.accountability.receipt_mismatch_create':
    'A Menta retornou um comprovante de grupo que não corresponde a este rascunho salvo.',
  'groups.source.accountability.create_unknown':
    'A Menta não conseguiu confirmar se o grupo foi criado ou se Momenta foi gasto.',
  'groups.source.accountability.receipt_mismatch_status':
    'A Menta encontrou um comprovante de grupo, mas ele não corresponde a este rascunho salvo.',
  'groups.source.accountability.status_different_request':
    'A Menta verificou uma solicitação de grupo diferente.',
  'groups.source.accountability.status_unavailable':
    'A Menta ainda não conseguiu verificar este grupo. Tente verificar o estado novamente.',
  'groups.source.accountability.safe_to_retry':
    'A Menta confirmou que não existe nenhum comprovante de grupo para esta solicitação. Você pode concluir a mesma solicitação com segurança.',
  'groups.source.accountability.receipt_load_pending':
    'O comprovante do grupo foi confirmado, mas a Menta ainda não conseguiu carregar o grupo. Verifique novamente.',
  'groups.source.accountability.receipt_account_mismatch':
    'A Menta encontrou um comprovante, mas o grupo salvo não corresponde a esta conta.',
  'groups.source.accountability.common.back': 'Voltar',
  'groups.source.accountability.common.close': 'Fechar',
  'groups.source.accountability.common.try_again': 'Tentar novamente',
  'groups.source.accountability.common.keep_browsing': 'Continuar explorando',
  'groups.source.accountability.common.finish_account':
    'Concluir configuração da conta',
  'groups.source.accountability.common.sign_in_or_create':
    'Entrar ou criar uma conta',
  'groups.source.accountability.common.not_now': 'Agora não',
  'groups.source.accountability.role.owner': 'Responsável pela promessa',
  'groups.source.accountability.role.partner.title': 'Fazer juntos',
  'groups.source.accountability.role.partner.description':
    'Vocês dois cumprem a promessa e compartilham o progresso diário.',
  'groups.source.accountability.role.partner.invitation': 'fazer juntos',
  'groups.source.accountability.role.partner.invitee_title':
    'Fazer em conjunto',
  'groups.source.accountability.role.partner.invitee_description':
    'Ambos cumprem a promessa, adicionam a sua própria prova e partilham o progresso.',
  'groups.source.accountability.role.partner.invitee_action':
    'Aderir e fazer em conjunto',
  'groups.source.accountability.role.reviewer.title':
    'Analisar a minha comprovação',
  'groups.source.accountability.role.reviewer.description':
    'A pessoa analisa a sua comprovação sem receber uma tarefa diária.',
  'groups.source.accountability.role.reviewer.invitation':
    'analisar comprovações',
  'groups.source.accountability.role.reviewer.invitee_title': 'Rever a prova',
  'groups.source.accountability.role.reviewer.invitee_description':
    'Revê a prova quando esta chegar. Não recebe uma tarefa diária.',
  'groups.source.accountability.role.reviewer.invitee_action':
    'Aderir para rever',
  'groups.source.accountability.role.supporter.title': 'Apoiar-me',
  'groups.source.accountability.role.supporter.description':
    'A pessoa pode acompanhar o progresso e incentivar você, sem fazer análises.',
  'groups.source.accountability.role.supporter.invitation':
    'apoiar o progresso',
  'groups.source.accountability.role.supporter.invitee_title':
    'Apoiar esta promessa',
  'groups.source.accountability.role.supporter.invitee_description':
    'Pode acompanhar o progresso e encorajar. Não revê provas.',
  'groups.source.accountability.role.supporter.invitee_action':
    'Aderir para apoiar',
  'groups.source.accountability.role.question': 'Como essa pessoa deve ajudar?',
  'groups.source.accountability.proof.approved': 'Comprovação aprovada',
  'groups.source.accountability.proof.pending':
    'Comprovação aguardando análise',
  'groups.source.accountability.proof.rejected':
    'A comprovação precisa de uma correção',
  'groups.source.accountability.proof.due': 'Comprovação ainda pendente',
  'groups.source.accountability.member.change_hint':
    'Muda o papel desta pessoa.',
  'groups.source.accountability.member.accessibility': '{name}. {role}.',
  'groups.source.accountability.member.update_failed_title':
    'As pessoas não foram alteradas',
  'groups.source.accountability.member.update_failed_detail':
    'A Menta não conseguiu atualizar este papel.',
  'groups.source.accountability.member.choose_role':
    'Escolha um papel nesta promessa.',
  'groups.source.accountability.member.remove_action': 'Remover desta promessa',
  'groups.source.accountability.member.remove_question': 'Remover {name}?',
  'groups.source.accountability.member.remove_confirm': 'Remover pessoa',
  'groups.source.accountability.member.remove_detail':
    'A pessoa perderá o acesso às pessoas e às comprovações compartilhadas desta promessa. A atividade existente continuará no histórico.',
  'groups.source.accountability.picker.title': 'Escolher uma promessa',
  'groups.source.accountability.picker.heading':
    'Convide alguém para uma promessa.',
  'groups.source.accountability.picker.detail':
    'Primeiro escolha a promessa. Depois, decida se a pessoa fará junto com você, analisará comprovações ou dará apoio.',
  'groups.source.accountability.picker.load_error_title':
    'Não foi possível carregar as promessas',
  'groups.source.accountability.picker.load_error_detail':
    'A Menta não conseguiu carregar as suas promessas. Tente novamente.',
  'groups.source.accountability.picker.choose_accessibility':
    '{promise}. Escolher esta promessa.',
  'groups.source.accountability.picker.choose_hint':
    'Abre a configuração de pessoas e papéis.',
  'groups.source.accountability.picker.already_shared':
    'Já compartilhada · gerenciar pessoas e papéis',
  'groups.source.accountability.picker.private_now':
    'Privada agora · nada é compartilhado até alguém aceitar',
  'groups.source.accountability.picker.empty_title': 'Nenhuma promessa ativa',
  'groups.source.accountability.picker.empty_detail':
    'Primeiro crie uma promessa e depois convide alguém por Hoje ou Juntos.',
  'groups.source.accountability.people.screen_title': 'Pessoas e papéis',
  'groups.source.accountability.people.load_error_title':
    'Não foi possível carregar as pessoas',
  'groups.source.accountability.people.load_error_detail':
    'Nada mudou. Tente novamente.',
  'groups.source.accountability.people.loading':
    'Verificando esta promessa antes de convidar alguém…',
  'groups.source.accountability.people.shared_heading':
    'Pessoas nesta promessa.',
  'groups.source.accountability.people.private_heading':
    'Quem deve participar com você?',
  'groups.source.accountability.people.shared_detail':
    'Cada pessoa tem um papel claro. Você pode convidar outra pessoa sem criar mais um grupo.',
  'groups.source.accountability.people.private_detail':
    'Escolha como a pessoa ajudará. Nada é compartilhado até alguém aceitar.',
  'groups.source.accountability.people.label': 'PESSOAS',
  'groups.source.accountability.people.review_proof': 'Analisar comprovação',
  'groups.source.accountability.people.see_shared_proof':
    'Ver comprovação compartilhada',
  'groups.source.accountability.people.leave_promise': 'Sair desta promessa',
  'groups.source.accountability.people.leave_question': 'Sair desta promessa?',
  'groups.source.accountability.people.leave_confirm': 'Sair da promessa',
  'groups.source.accountability.people.leave_detail':
    'Você perderá o acesso às comprovações compartilhadas e às pessoas. A atividade existente continuará no histórico da promessa.',
  'groups.source.accountability.people.leave_failed_title':
    'A saída não foi confirmada',
  'groups.source.accountability.invite.screen_title': 'Convite da promessa',
  'groups.source.accountability.invite.not_ready_title':
    'O convite não está pronto',
  'groups.source.accountability.invite.not_ready_detail':
    'Nada foi compartilhado. Tente novamente quando a conexão estiver estável.',
  'groups.source.accountability.invite.ready_heading':
    'Pronto para compartilhar.',
  'groups.source.accountability.invite.private_detail':
    'A promessa continuará privada até alguém aceitar este convite.',
  'groups.source.accountability.invite.label': 'CONVITE DA PROMESSA',
  'groups.source.accountability.invite.ready': 'Pronto',
  'groups.source.accountability.invite.share_action': 'Compartilhar convite',
  'groups.source.accountability.invite.copy_action': 'Copiar link',
  'groups.source.accountability.invite.today_action': 'Ir para Hoje',
  'groups.source.accountability.invite.prepare_action': 'Preparar convite',
  'groups.source.accountability.invite.private_note':
    'A sua promessa continuará privada até um convite ser aceito.',
  'groups.source.accountability.share.title': 'Participar de {promise}',
  'groups.source.accountability.share.message':
    'Participe comigo de “{promise}” na Menta. Quero convidar você para {invitation}.\n\n{shareUrl}\nCódigo do convite: {code}',
  'groups.source.accountability.share.still_ready_title':
    'O convite continua pronto',
  'groups.source.accountability.share.still_ready_detail':
    'A Menta não consegue ver quem recebeu o convite. Uma pessoa só aparece aqui depois que aceita.',
  'groups.source.accountability.share.failed_title':
    'O compartilhamento não abriu',
  'groups.source.accountability.share.failed_detail':
    'Copie o link. O seu convite continua pronto.',
  'groups.source.accountability.copy.success_title': 'Convite copiado',
  'groups.source.accountability.copy.success_detail':
    'Cole na conversa em que você quer convidar a pessoa.',
  'groups.source.accountability.copy.failed_title': 'A cópia não foi concluída',
  'groups.source.accountability.copy.failed_detail':
    'O convite continua pronto. Tente copiar novamente.',
  'groups.source.accountability.join_promise.title': 'Convite da promessa',
  'groups.source.accountability.join_promise.missing_code':
    'O código deste convite da promessa está ausente.',
  'groups.source.accountability.join_promise.retry_title':
    'Não foi possível carregar o convite',
  'groups.source.accountability.join_promise.unavailable_title':
    'Convite indisponível',
  'groups.source.accountability.join_promise.ask_new_invite':
    'Peça um novo convite a quem enviou.',
  'groups.source.accountability.join_promise.back_today': 'Voltar para Hoje',
  'groups.source.accountability.join_promise.invited_by':
    '{inviter} convidou você.',
  'groups.source.accountability.join_promise.intro':
    'Analise a promessa, o seu papel e quem poderá ver as comprovações antes de aceitar.',
  'groups.source.accountability.join_promise.your_role': 'O seu papel',
  'groups.source.accountability.join_promise.proof_visibility':
    'Visibilidade das comprovações',
  'groups.source.accountability.join_promise.people_visibility':
    'Pessoas nesta promessa',
  'groups.source.accountability.join_promise.review_join':
    'Analisar detalhes da participação',
  'groups.source.accountability.event.title': 'Convite para evento',
  'groups.source.accountability.event.checking':
    'Verificando convite para evento',
  'groups.source.accountability.event.time_to_be_confirmed':
    'Horário a confirmar',
  'groups.source.accountability.event.visibility.invite_only':
    'Evento somente para convidados',
  'groups.source.accountability.event.visibility.unlisted':
    'Compartilhado por link privado',
  'groups.source.accountability.event.visibility.public': 'Evento público',
  'groups.source.accountability.event.availability.open': 'Participação aberta',
  'groups.source.accountability.event.availability.at_capacity': 'Lotado',
  'groups.source.accountability.event.availability.places':
    '{count} lugares restantes',
  'groups.source.accountability.event.availability.places.one':
    '{count} lugar restante',
  'groups.source.accountability.event.availability.places.other':
    '{count} lugares restantes',
  'groups.source.accountability.event.context': '{visibility} · {availability}',
  'groups.source.accountability.event.retry_title':
    'Não foi possível carregar o convite para o evento',
  'groups.source.accountability.event.unavailable_title':
    'Convite para evento indisponível',
  'groups.source.accountability.event.browse_events': 'Explorar eventos',
  'groups.source.accountability.event.heading.invited':
    'Você recebeu um convite para um evento.',
  'groups.source.accountability.event.heading.shared':
    'Alguém compartilhou um evento com você.',
  'groups.source.accountability.event.intro':
    'Veja o evento antes de decidir. Participar, fazer check-in e adicionar fotos continuam sendo escolhas separadas.',
  'groups.source.accountability.event.review_agreement':
    'Analisar o acordo do evento',
  'groups.source.accountability.event.error.incomplete':
    'Este convite para o evento está incompleto.',
  'groups.source.accountability.event.error.changed':
    'Este convite para o evento mudou. Abra novamente o link mais recente.',
  'groups.source.accountability.event.error.no_longer_available':
    'Este convite para o evento não está mais disponível.',
  'groups.source.accountability.event.error.check_retry':
    'A Menta não conseguiu verificar este convite para o evento. Tente novamente quando tiver conexão.',
  'groups.source.accountability.event.error.ask_current_link':
    'Este convite para o evento não está mais disponível. Peça um link atual a quem enviou.',
  'groups.source.accountability.error.people_load':
    'A Menta não conseguiu carregar as pessoas desta promessa.',
  'groups.source.accountability.error.people_incomplete':
    'A Menta recebeu detalhes incompletos sobre a responsabilidade desta promessa.',
  'groups.source.accountability.error.invite_check':
    'A Menta não conseguiu verificar este convite da promessa.',
  'groups.source.accountability.error.invite_unavailable':
    'Este convite da promessa não está mais disponível. Ele pode ter expirado ou já ter sido usado.',
  'groups.source.accountability.error.invite_verify':
    'A Menta não conseguiu confirmar este convite da promessa.',
  'groups.source.accountability.error.invite_incomplete':
    'A Menta recebeu detalhes incompletos do convite.',
  'groups.source.accountability.error.prepare':
    'A Menta não conseguiu preparar esta promessa para um convite.',
  'groups.source.accountability.error.promise_inactive':
    'Esta promessa terminou, por isso as pessoas dela não podem ser alteradas.',
  'groups.source.accountability.error.public_uses_group_invite':
    'Esta promessa é pública. Convide pessoas pelo grupo para manter claras as regras de compartilhamento público e privado.',
  'groups.source.accountability.error.saved_group_fallback': 'Este grupo salvo',
  'groups.source.accountability.error.saved_group_owns':
    '{group} já contém esta promessa. Convide pessoas pelo grupo salvo para que elas possam ver todo o espaço compartilhado.',
  'groups.source.accountability.error.setup_unconfirmed':
    'A Menta não conseguiu confirmar a configuração do convite da promessa.',
  'groups.source.accountability.error.role_unconfirmed':
    'A Menta não conseguiu confirmar o papel atual do convite.',
  'groups.source.accountability.error.link_unavailable':
    'A Menta não conseguiu preparar um link de convite. A sua promessa continua segura.',
  'groups.source.accountability.error.invalid_code':
    'A Menta recebeu um código de convite da promessa inválido.',
  'groups.source.accountability.error.role_attach':
    'A Menta não conseguiu vincular o papel selecionado a este convite.',
  'groups.source.accountability.error.member_update':
    'A Menta não conseguiu atualizar o papel desta pessoa.',
  'groups.source.accountability.error.leave_unconfirmed':
    'A Menta não conseguiu confirmar que você saiu.',
  'todayProof.source.accountability.proof_together': 'Comprovações em conjunto',
  'todayProof.source.accountability.no_shared_proof':
    'Ainda não há comprovações compartilhadas',
  'todayProof.source.accountability.loading_shared_proof':
    'Carregando comprovações compartilhadas',
  'todayProof.source.accountability.encourage_person': 'Incentivar {name}',
  'todayProof.source.accountability.remove_encouragement_for':
    'Remover incentivo para {name}',
  'todayProof.source.accountability.proof_count_one': '{count} comprovação',
  'todayProof.source.accountability.proof_count_many': '{count} comprovações',
  'todayProof.source.accountability.more_proof': 'Mais {count} comprovação',
  'todayProof.source.accountability.more_proofs': 'Mais {count} comprovações',
  'todayProof.source.accountability.open_one_more_proof':
    'Mais {count} comprovação. Abre todas as comprovações compartilhadas',
  'todayProof.source.accountability.open_more_proofs':
    'Mais {count} comprovações. Abre todas as comprovações compartilhadas',
  'todayProof.source.accountability.media_accessibility_with_state':
    '{type}, de {name}, {submitted}, {state}',
  'todayProof.source.accountability.media_accessibility_without_state':
    '{type}, de {name}, {submitted}',
  'todayProof.source.accountability.encouragement_update_failed':
    'A Menta não conseguiu atualizar esse incentivo. Tente novamente.',
  'todayProof.source.accountability.reviewer_ready': 'Pronta para análise',
  'todayProof.source.accountability.reviewer_note':
    'Você analisa comprovações aqui sem receber uma tarefa diária de comprovação.',
  'todayProof.source.accountability.role_reviewer': 'Pessoa revisora',
  'todayProof.source.accountability.supporter_following':
    'Acompanhando esta promessa',
  'todayProof.source.accountability.supporter_note':
    'Veja o progresso compartilhado e incentive as pessoas que estão cumprindo a promessa.',
  'todayProof.source.accountability.role_supporter': 'Pessoa apoiadora',
  'todayProof.source.accountability.open_proof': 'Abrir comprovação',
  'todayProof.source.accountability.see_shared_proof':
    'Ver comprovação compartilhada',
  'todayProof.source.accountability.member_fallback': 'Pessoa da Menta',
  'todayProof.source.accountability.add_my_video': 'Adicionar meu vídeo',
  'todayProof.source.accountability.add_my_photo': 'Adicionar minha foto',
  'todayProof.source.accountability.shared_with_promise_people':
    'Compartilhado com as pessoas desta promessa',
  'todayProof.source.accountability.invite_or_manage_people':
    'Convidar ou gerenciar pessoas',
  'todayProof.source.accountability.review_result_unknown':
    'Resultado da análise desconhecido',
  'todayProof.source.accountability.check_proof_before_retry':
    'Verifique esta comprovação antes de enviar novamente',
  'todayProof.source.accountability.review_unknown_detail':
    'A Menta não conseguiu confirmar se a sua análise foi salva. Atualize o estado da análise antes de tomar outra decisão.',
  'todayProof.source.accountability.check_review_status':
    'Verificar estado da análise',
  'todayProof.source.accountability.correction_note_accessibility':
    'Observação útil, opcional',
  'todayProof.source.accountability.correction_note_label':
    'Adicionar uma observação útil (opcional)',
  'todayProof.source.accountability.character_count':
    '{current}/{max} caracteres',
  'todayProof.source.accountability.correction_note_placeholder':
    'Diga a {name} o que deixaria a próxima comprovação clara.',
  'todayProof.source.accountability.feedback_not_sent': 'Feedback não enviado',
  'todayProof.source.accountability.feedback_preserved':
    '{error} O seu motivo e a sua observação continuam aqui.',
  'todayProof.source.accountability.report_safety': 'Segurança ou abuso',
  'todayProof.source.accountability.report_privacy':
    'Privacidade ou informações pessoais',
  'todayProof.source.accountability.close_report_options':
    'Fechar opções de denúncia',
  'todayProof.source.accountability.report_help':
    'Escolha o tipo de ajuda de que você precisa. É possível verificar os detalhes antes que qualquer coisa seja enviada.',
  'todayProof.source.accountability.back_to_proof': 'Voltar à comprovação',
  'todayProof.source.accountability.report_context':
    'Comprovação de {name} para {promise}',
} as const satisfies Partial<CompleteCatalogue>;

export const accountabilityDeltaPtBR =
  {} as const satisfies Partial<CompleteCatalogue>;

export const accountabilityDeltaPtPT = {
  'fullAuth.source.accountability.save_agreement_failed':
    'A Menta não conseguiu guardar a sua aceitação.',
  'fullAuth.source.accountability.promise_invited_by':
    '{inviterName} convidou-o.',
  'fullAuth.source.accountability.event_invited':
    'Recebeu um convite para {eventTitle}.',
  'fullAuth.source.accountability.setup_then_review':
    'Conclua esta breve configuração da conta e depois analise o convite. Ainda não aderiu a nada.',
  'fullAuth.source.accountability.documents_load_failed_description':
    'A sua promessa está segura. Verifique a ligação antes de iniciar sessão.',
  'fullAuth.source.accountability.documents_loading_title':
    'Os documentos ainda estão a carregar',
  'fullAuth.source.email_confirmation.resend_offline':
    'Está sem ligação. Volte a ligar-se e reenvie a confirmação.',
  'fullAuth.source.email_confirmation.resend_failed':
    'A Menta não conseguiu reenviar a confirmação. O seu registo continua pendente.',
  'fullAuth.source.email_confirmation.restore_failed_title':
    'Não foi possível restaurar este registo',
  'fullAuth.source.email_confirmation.restore_failed_description':
    'A Menta não conseguiu ler o e-mail guardado neste dispositivo. Ainda pode iniciar sessão em segurança.',
  'fullAuth.source.email_confirmation.expired_description':
    'A sua promessa e o seu convite continuam guardados. Envie abaixo um novo e-mail de confirmação.',
  'fullAuth.source.email_confirmation.invalid_description':
    'O link pode já ter sido usado. Verifique novamente neste dispositivo, reenvie o e-mail ou inicie sessão.',
  'fullAuth.source.email_confirmation.account_mismatch_description':
    'A Menta não associou a sua promessa ou o seu convite guardados a uma conta diferente.',
  'fullAuth.source.email_confirmation.storage_description':
    'O e-mail de confirmação foi pedido, mas este dispositivo não conseguiu guardar a continuação para uma abertura futura da aplicação.',
  'fullAuth.source.email_confirmation.callback_failed_description':
    'O seu registo continua pendente. Abra novamente o link do e-mail ou reenvie-o abaixo.',
  'fullAuth.source.email_confirmation.reopen_failed_title':
    'Não foi possível reabrir o registo',
  'fullAuth.source.email_confirmation.reopen_failed_description':
    'A Menta manteve o e-mail pendente para não enviar acidentalmente o mesmo registo duas vezes. Tente novamente.',
  'fullAuth.source.email_confirmation.signed_in_account_mismatch_title':
    'Há outra conta com sessão iniciada',
  'fullAuth.source.email_confirmation.signed_in_account_mismatch_description':
    'A Menta não associou este registo a essa conta. Termine a sessão da outra conta antes de continuar.',
  'fullAuth.source.email_confirmation.no_session_description':
    'Abra o link de confirmação mais recente neste dispositivo. Se confirmou noutro lugar, inicie sessão com a sua palavra-passe.',
  'fullAuth.source.email_confirmation.check_failed_description':
    'O seu registo continua guardado. Verifique a ligação e tente novamente.',
  'fullAuth.source.email_confirmation.restoring':
    'A restaurar a sua confirmação por e-mail…',
  'fullAuth.source.email_confirmation.no_pending_title':
    'Não há nenhum registo pendente',
  'fullAuth.source.email_confirmation.no_pending_description':
    'Este dispositivo não tem uma confirmação por e-mail para retomar. Inicie sessão se já tiver uma conta Menta.',
  'fullAuth.source.email_confirmation.saved_state_description':
    'A sua promessa inacabada e qualquer indicação ou convite guardado permanecem neste dispositivo. A Menta guarda as versões legais e a hora em que as aceitou, verifica tudo novamente depois de iniciar sessão e só conclui a integração quando uma sessão para este e-mail é confirmada.',
  'commerce.wallet.rewardCheckingTitle': 'A verificar a sua recompensa',
  'commerce.wallet.rewardCheckingAccessibility':
    'A verificar o estado da recompensa',
  'commerce.wallet.refreshingBalance': 'A atualizar o saldo…',
  'commerce.wallet.rewardClaimInProgress':
    'A Menta ainda está a verificar a recompensa anterior.',
  'groups.source.accountability.shared_tab': 'Partilhado',
  'groups.source.accountability.shared_tab_hint':
    'Mostra promessas partilhadas e grupos guardados.',
  'groups.source.accountability.loading_together': 'A carregar Juntos',
  'groups.source.accountability.shared_promises': 'Promessas partilhadas',
  'groups.source.accountability.create_saved_group': 'Criar um grupo guardado',
  'groups.source.accountability.open_shared_promise_hint':
    'Abre esta promessa partilhada e as pessoas envolvidas.',
  'groups.source.accountability.saved_groups': 'Grupos guardados',
  'groups.source.accountability.offline_detail':
    'Estas são as últimas promessas partilhadas e os últimos grupos guardados neste telemóvel. Ligue-se à internet antes de alterar as pessoas ou aderir a algo.',
  'groups.source.accountability.checking_people':
    'A verificar quem está envolvido…',
  'groups.source.accountability.check_group_first_detail':
    'A Menta ainda tem um pedido guardado para este grupo. Verifique o estado antes de criar ou alterar alguma coisa.',
  'groups.source.accountability.checking_group': 'A verificar este grupo',
  'groups.source.accountability.checking_group_detail':
    'A Menta está a verificar o pedido guardado. Isto não cria outro grupo nem gasta Momenta.',
  'groups.source.accountability.still_checking_group':
    'Ainda estamos a verificar este grupo',
  'groups.source.accountability.no_saved_request_title':
    'Nenhum pedido guardado encontrado',
  'groups.source.accountability.no_saved_request_detail':
    'A Menta não encontrou nenhum pedido de grupo pendente. Analise o grupo antes de o criar.',
  'groups.source.accountability.check_unavailable_detail':
    'Mantenha este rascunho e verifique novamente antes de criar outro grupo.',
  'groups.source.accountability.reopen_draft_detail':
    'A verificação de estado é segura, mas a Menta não conseguiu atualizar o rascunho guardado neste telemóvel. Tente novamente.',
  'groups.source.accountability.checking_creation_accessibility':
    'A verificar se o grupo foi criado',
  'groups.source.accountability.recovery_details_saved':
    'Os detalhes do seu grupo continuam guardados neste telemóvel.',
  'groups.source.accountability.receipt_mismatch_create':
    'A Menta devolveu um comprovativo de grupo que não corresponde a este rascunho guardado.',
  'groups.source.accountability.receipt_mismatch_status':
    'A Menta encontrou um comprovativo de grupo, mas não corresponde a este rascunho guardado.',
  'groups.source.accountability.safe_to_retry':
    'A Menta confirmou que não existe nenhum comprovativo de grupo para este pedido. Pode concluir o mesmo pedido em segurança.',
  'groups.source.accountability.receipt_load_pending':
    'O comprovativo do grupo foi confirmado, mas a Menta ainda não conseguiu carregar o grupo. Verifique novamente.',
  'groups.source.accountability.receipt_account_mismatch':
    'A Menta encontrou um comprovativo, mas o grupo guardado não corresponde a esta conta.',
  'groups.source.accountability.common.keep_browsing': 'Continuar a explorar',
  'groups.source.accountability.common.sign_in_or_create':
    'Iniciar sessão ou criar uma conta',
  'groups.source.accountability.role.partner.description':
    'Ambos cumprem a promessa e partilham o progresso diário.',
  'groups.source.accountability.role.reviewer.title':
    'Analisar o meu comprovativo',
  'groups.source.accountability.role.reviewer.description':
    'A pessoa analisa o seu comprovativo sem receber uma tarefa diária.',
  'groups.source.accountability.role.reviewer.invitation':
    'analisar comprovativos',
  'groups.source.accountability.role.supporter.description':
    'A pessoa pode acompanhar o progresso e dar-lhe incentivo, sem fazer análises.',
  'groups.source.accountability.proof.approved': 'Comprovativo aprovado',
  'groups.source.accountability.proof.pending':
    'Comprovativo à espera de análise',
  'groups.source.accountability.proof.rejected':
    'O comprovativo precisa de uma correção',
  'groups.source.accountability.proof.due': 'Comprovativo ainda pendente',
  'groups.source.accountability.member.remove_detail':
    'A pessoa perderá o acesso às pessoas e aos comprovativos partilhados desta promessa. A atividade existente continuará no histórico.',
  'groups.source.accountability.picker.detail':
    'Primeiro escolha a promessa. Depois, decida se a pessoa a fará consigo, analisará comprovativos ou dará apoio.',
  'groups.source.accountability.picker.load_error_detail':
    'A Menta não conseguiu carregar as suas promessas. Tente novamente.',
  'groups.source.accountability.picker.already_shared':
    'Já partilhada · gerir pessoas e papéis',
  'groups.source.accountability.picker.private_now':
    'Privada agora · nada é partilhado até alguém aceitar',
  'groups.source.accountability.people.shared_detail':
    'Cada pessoa tem um papel claro. Pode convidar outra pessoa sem criar mais um grupo.',
  'groups.source.accountability.people.private_detail':
    'Escolha como a pessoa vai ajudar. Nada é partilhado até alguém aceitar.',
  'groups.source.accountability.people.review_proof': 'Analisar comprovativo',
  'groups.source.accountability.people.see_shared_proof':
    'Ver comprovativo partilhado',
  'groups.source.accountability.people.leave_detail':
    'Perderá o acesso aos comprovativos partilhados e às pessoas. A atividade existente continuará no histórico da promessa.',
  'groups.source.accountability.invite.not_ready_detail':
    'Nada foi partilhado. Tente novamente quando a ligação estiver estável.',
  'groups.source.accountability.invite.ready_heading': 'Pronto para partilhar.',
  'groups.source.accountability.invite.private_detail':
    'A promessa continuará privada até alguém aceitar este convite.',
  'groups.source.accountability.invite.share_action': 'Partilhar convite',
  'groups.source.accountability.invite.private_note':
    'A sua promessa continuará privada até um convite ser aceite.',
  'groups.source.accountability.share.message':
    'Participe comigo em “{promise}” na Menta. Quero convidá-lo para {invitation}.\n\n{shareUrl}\nCódigo do convite: {code}',
  'groups.source.accountability.share.still_ready_detail':
    'A Menta não consegue ver quem recebeu o convite. Uma pessoa só aparece aqui depois de aceitar.',
  'groups.source.accountability.share.failed_title':
    'A partilha não foi aberta',
  'groups.source.accountability.copy.success_detail':
    'Cole na conversa em que pretende convidar a pessoa.',
  'groups.source.accountability.join_promise.invited_by':
    '{inviter} convidou-o.',
  'groups.source.accountability.join_promise.intro':
    'Analise a promessa, o seu papel e quem poderá ver os comprovativos antes de aceitar.',
  'groups.source.accountability.join_promise.proof_visibility':
    'Visibilidade dos comprovativos',
  'groups.source.accountability.event.visibility.unlisted':
    'Partilhado por ligação privada',
  'groups.source.accountability.event.availability.places':
    '{count} lugares disponíveis',
  'groups.source.accountability.event.availability.places.one':
    '{count} lugar disponível',
  'groups.source.accountability.event.availability.places.other':
    '{count} lugares disponíveis',
  'groups.source.accountability.event.heading.invited':
    'Recebeu um convite para um evento.',
  'groups.source.accountability.event.heading.shared':
    'Alguém partilhou um evento consigo.',
  'groups.source.accountability.event.intro':
    'Veja o evento antes de decidir. Participar, fazer check-in e adicionar fotografias continuam a ser escolhas separadas.',
  'groups.source.accountability.event.error.check_retry':
    'A Menta não conseguiu verificar este convite para o evento. Tente novamente quando tiver ligação.',
  'groups.source.accountability.error.people_incomplete':
    'A Menta recebeu detalhes incompletos sobre a responsabilização desta promessa.',
  'groups.source.accountability.error.public_uses_group_invite':
    'Esta promessa é pública. Convide pessoas pelo grupo para manter claras as regras de partilha pública e privada.',
  'groups.source.accountability.error.saved_group_fallback':
    'Este grupo guardado',
  'groups.source.accountability.error.saved_group_owns':
    '{group} já contém esta promessa. Convide pessoas pelo grupo guardado para poderem ver todo o espaço partilhado.',
  'groups.source.accountability.error.link_unavailable':
    'A Menta não conseguiu preparar uma ligação de convite. A sua promessa continua segura.',
  'groups.source.accountability.error.leave_unconfirmed':
    'A Menta não conseguiu confirmar que saiu.',
  'todayProof.source.accountability.proof_together':
    'Comprovativos em conjunto',
  'todayProof.source.accountability.no_shared_proof':
    'Ainda não há comprovativos partilhados',
  'todayProof.source.accountability.loading_shared_proof':
    'A carregar comprovativos partilhados',
  'todayProof.source.accountability.proof_count_one': '{count} comprovativo',
  'todayProof.source.accountability.proof_count_many': '{count} comprovativos',
  'todayProof.source.accountability.more_proof': 'Mais {count} comprovativo',
  'todayProof.source.accountability.more_proofs': 'Mais {count} comprovativos',
  'todayProof.source.accountability.open_one_more_proof':
    'Mais {count} comprovativo. Abre todos os comprovativos partilhados',
  'todayProof.source.accountability.open_more_proofs':
    'Mais {count} comprovativos. Abre todos os comprovativos partilhados',
  'todayProof.source.accountability.reviewer_note':
    'Analise comprovativos aqui sem receber uma tarefa diária de comprovativo.',
  'todayProof.source.accountability.open_proof': 'Abrir comprovativo',
  'todayProof.source.accountability.see_shared_proof':
    'Ver comprovativo partilhado',
  'todayProof.source.accountability.add_my_photo':
    'Adicionar a minha fotografia',
  'todayProof.source.accountability.shared_with_promise_people':
    'Partilhado com as pessoas desta promessa',
  'todayProof.source.accountability.invite_or_manage_people':
    'Convidar ou gerir pessoas',
  'todayProof.source.accountability.check_proof_before_retry':
    'Verifique este comprovativo antes de enviar novamente',
  'todayProof.source.accountability.review_unknown_detail':
    'A Menta não conseguiu confirmar se a sua análise foi guardada. Atualize o estado da análise antes de tomar outra decisão.',
  'todayProof.source.accountability.correction_note_placeholder':
    'Diga a {name} o que tornaria claro o próximo comprovativo.',
  'todayProof.source.accountability.report_help':
    'Escolha o tipo de ajuda de que precisa. Pode verificar os detalhes antes de alguma coisa ser enviada.',
  'todayProof.source.accountability.back_to_proof': 'Voltar ao comprovativo',
  'todayProof.source.accountability.report_context':
    'Comprovativo de {name} para {promise}',
} as const satisfies Partial<CompleteCatalogue>;
