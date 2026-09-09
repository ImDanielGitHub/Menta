import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type FullAuthAccountKey = Extract<keyof EnglishCatalogue, `fullAuth.${string}`>;

export const fullAuthAccountPtBR = {
  'fullAuth.shared.try_again': 'Tente novamente',
  'fullAuth.support.untitled_report': 'Relatório sem título',
  'fullAuth.onboarding.promise_setup_step_one':
    'Configuração de promessa · 1 de 2',
  'fullAuth.onboarding.promise_setup_step_two':
    'Configuração de promessa · 2 de 2',
  'fullAuth.component_onboarding_paperauthreset.your_account_email':
    'e-mail da sua conta',
  'fullAuth.shared.back_to_you': 'De volta para você',
  'fullAuth.shared.promise': 'Promessa',
  'fullAuth.shared.terms': 'Termos',
  'fullAuth.shared.back_to_settings': 'Voltar às configurações',
  'fullAuth.shared.other_sign_in_options': 'Outras opções de login',
  'fullAuth.shared.retry_profile': 'Tentar perfil novamente',
  'fullAuth.shared.refresh_progress': 'Atualizar progresso',
  'fullAuth.shared.check_connection_again': 'Verifique a conexão novamente',
  'fullAuth.shared.sign_in': 'Entrar',
  'fullAuth.support.feedback': 'Comentários',
  'fullAuth.support.promise_report': 'Relatório de promessa',
  'fullAuth.support.group_report': 'Relatório de grupo',
  'fullAuth.support.proof_report': 'Relatório de comprovação',
  'fullAuth.support.app_issue': 'Problema no aplicativo',
  'fullAuth.support.checking_saved_proof':
    'Verificando comprovações salvas neste telefone.',
  'fullAuth.support.saved_proof_count_unavailable':
    'Contagem de comprovações salvas indisponível.',
  'fullAuth.support.no_proof_waiting':
    'Nenhuma comprovação está esperando neste telefone.',
  'fullAuth.support.proof_count_saved':
    '{count} {proofLabel} salvo neste telefone.',
  'fullAuth.support.proof_is': 'a comprovação é',
  'fullAuth.support.proofs_are': 'as comprovações são',
  'fullAuth.support.saved_proof_waiting_to_be_sent':
    '{count} {proofLabel} salvo neste telefone e ainda aguardando envio.',
  'fullAuth.email_auth.create_account': 'Criar uma conta',
  'fullAuth.email_auth.sign_in': 'Entrar',
  'fullAuth.email_auth.already_have_account': 'Já tem uma conta?',
  'fullAuth.email_auth.new_to_menta': 'Ainda não usa a Menta?',
  'fullAuth.email_auth.offline_reconnect':
    'Você está off-line. Reconecte e tente novamente.',
  'fullAuth.email_auth.too_many_attempts':
    'Muitas tentativas. Espere um momento e tente novamente.',
  'fullAuth.email_auth.could_not_sign_in':
    'Não foi possível fazer login. Verifique seu e-mail e senha e tente novamente.',
  'fullAuth.email_auth.could_not_create_account':
    'Não foi possível criar sua conta. Verifique sua conexão e tente novamente.',
  'fullAuth.email_auth.enter_password': 'Digite sua senha.',
  'fullAuth.email_auth.create_password': 'Criar uma senha.',
  'fullAuth.email_auth.confirm_your_password': 'Confirme sua senha.',
  'fullAuth.email_auth.password_minimum': 'Use pelo menos {length} caracteres.',
  'fullAuth.email_auth.password_mismatch': 'As senhas não coincidem.',
  'fullAuth.email_auth.choose_username': 'Escolha um nome de usuário.',
  'fullAuth.email_auth.minimum_three_characters':
    'Use pelo menos 3 caracteres.',
  'fullAuth.email_auth.username_characters_only':
    'Use apenas letras, números ou sublinhados.',
  'fullAuth.email_auth.account_email': 'Digite o e-mail da sua conta Menta.',
  'fullAuth.email_auth.valid_email': 'Insira um endereço de e-mail válido.',
  'fullAuth.email_auth.passwords_need_to_match':
    'As senhas precisam ser iguais.',
  'fullAuth.password_recovery.confirm_new_password': 'Confirme sua nova senha.',
  'fullAuth.password_recovery.passwords_mismatch': 'As senhas não coincidem.',
  'fullAuth.password_recovery.minimum_password_length':
    'Use pelo menos {length} caracteres.',
  'fullAuth.password_recovery.could_not_change_now':
    'Não foi possível alterar sua senha no momento.',
  'fullAuth.password_recovery.sign_in_with_new_password_draft':
    'Faça login com sua nova senha e retorne ao rascunho.',
  'fullAuth.password_recovery.sign_in_with_new_password':
    'Agora você pode fazer login com sua nova senha.',
  'fullAuth.language_settings.system_accessibility':
    'Usar o idioma do celular. {systemSubtitle}',
  'fullAuth.forgot_password.enter_email_tied_to_account':
    'Digite o e-mail vinculado à sua conta Menta.',
  'fullAuth.forgot_password.enter_valid_email':
    'Insira um endereço de e-mail válido.',
  'fullAuth.forgot_password.could_not_send_reset_email':
    'Não foi possível enviar o e-mail de redefinição. Verifique sua conexão e tente novamente.',
  'fullAuth.password_recovery_callback.checking_secure_reset_link':
    'Verificando seu link de redefinição seguro…',
  'fullAuth.password_recovery_callback.reset_link_verified':
    'Link de redefinição verificado.',
  'fullAuth.report_issue.send_feedback': 'Enviar comentários',
  'fullAuth.report_issue.send_report': 'Enviar relatório',
  'fullAuth.support.start_a_new_report': 'Iniciar um novo relatório',
  'fullAuth.support.report_an_issue': 'Informar um problema',
  'fullAuth.notification_settings.daily_proof_reminders_and_promise_ending_updates':
    'Lembretes diários de comprovação e atualizações sobre o fim das promessas.',
  'fullAuth.notification_settings.saved_but_notifications_are_off_on_this_phone':
    'Salvo, mas as notificações estão desativadas neste smartphone.',
  'fullAuth.notification_settings.occasional_updates_to_email_unsubscribe_here':
    'Atualizações ocasionais para {email}. Cancele a inscrição aqui a qualquer momento.',
  'fullAuth.notification_settings.a_confirmed_account_email_is_required':
    'É necessário um e-mail de conta confirmado.',
  'fullAuth.onboarding.menta_mascot_holding_your_first_promise':
    'Mascote Menta segurando sua primeira promessa',
  'fullAuth.onboarding.menta_mascot_waving_hello': 'Mascote Menta acenando olá',
  'fullAuth.onboarding.your_saved_draft_is_back_on_this_phone':
    'Seu rascunho salvo está de volta neste telefone.',
  'fullAuth.onboarding.saved_privately_on_this_phone_as_you_type':
    'Salvo de forma privada neste telefone enquanto você digita.',
  'fullAuth.account_deleted.apple_instructions_did_not_open':
    'As instruções da Apple não abriram',
  'fullAuth.account_deleted.checking_account_deletion':
    'Verificando a exclusão da conta',
  'fullAuth.account_deleted.go_to_sign_in': 'Vá para fazer login',
  'fullAuth.account_deleted.if_you_used_sign_in_with_apple_remove_menta_from':
    'Se você usou o recurso Iniciar sessão com a Apple, remova a Menta dos apps conectados à sua Conta Apple. Abra os Ajustes do iPhone, toque no seu nome e depois em Iniciar sessão com a Apple.',
  'fullAuth.account_deleted.open_apple_support_and_search_for_manage_your_ap':
    'Abra o Suporte da Apple e pesquise por “Gerencie seus apps com o recurso Iniciar sessão com a Apple”.',
  'fullAuth.account_deleted.remove_apple_access': 'Remover o acesso da Apple',
  'fullAuth.account_deleted.see_apple_instructions':
    'Consulte as instruções da Apple',
  'fullAuth.account_deleted.sign_in_with_apple_access_was_also_removed':
    'O login com acesso Apple também foi removido.',
  'fullAuth.account_deleted.your_account_was_deleted': 'Sua conta foi excluída',
  'fullAuth.account_deleted.your_menta_account_and_its_data_were_deleted_men':
    'Sua conta Menta e seus dados foram excluídos. Menta também apagou os dados salvos desta conta neste telefone.',
  'fullAuth.auth_required.events': 'Eventos',
  'fullAuth.auth_required.groups': 'Grupos',
  'fullAuth.auth_required.keep_browsing': 'Continue navegando',
  'fullAuth.auth_required.menta': 'Menta',
  'fullAuth.auth_required.menta_records_the_review_under_your_account':
    'Menta registra a avaliação em sua conta.',
  'fullAuth.auth_required.menta_saves_this_proof_with_the_right_promise_an':
    'A Menta guarda esta comprovação com a promessa e a conta corretas.',
  'fullAuth.auth_required.momenta': 'Momenta',
  'fullAuth.auth_required.proof': 'Comprovação',
  'fullAuth.auth_required.reviews': 'Avaliações',
  'fullAuth.auth_required.sign_in': 'Entrar',
  'fullAuth.auth_required.sign_in_to_add_proof':
    'Entre para adicionar uma comprovação',
  'fullAuth.auth_required.sign_in_to_complete_this_action_and_return_here_':
    'Faça login para concluir esta ação e retorne aqui depois.',
  'fullAuth.auth_required.sign_in_to_continue': 'Faça login para continuar',
  'fullAuth.auth_required.sign_in_to_continue_with_this_event':
    'Faça login para continuar com este evento',
  'fullAuth.auth_required.sign_in_to_join_this_group':
    'Faça login para participar deste grupo',
  'fullAuth.auth_required.sign_in_to_review_proof':
    'Entre para analisar a comprovação',
  'fullAuth.auth_required.sign_in_to_use_momenta':
    'Faça login para usar o Momenta',
  'fullAuth.auth_required.your_balance_purchases_and_items_stay_with_your_':
    'Seu saldo, compras e itens permanecem em sua conta.',
  'fullAuth.auth_required.your_invitation_and_group_activity_stay_with_you':
    'Seu convite e atividade em grupo permanecem em sua conta.',
  'fullAuth.auth_required.your_place_check_in_and_event_photos_are_saved_t':
    'Seu local, check-in e fotos do evento são salvos em sua conta.',
  'fullAuth.auth_required.your_promises_proof_groups_and_reviews_stay_with':
    'Suas promessas, comprovações, grupos e avaliações ficam com sua conta Menta.',
  'fullAuth.component_onboarding_mentasurface.hide_password': 'Ocultar senha',
  'fullAuth.component_onboarding_mentasurface.menta': 'Menta',
  'fullAuth.component_onboarding_mentasurface.setup': 'Configurar',
  'fullAuth.component_onboarding_mentasurface.show_password': 'Mostrar senha',
  'fullAuth.component_onboarding_paperauthform.after_this': 'Depois disso',
  'fullAuth.component_onboarding_paperauthform.characters': '+ caracteres',
  'fullAuth.component_onboarding_paperauthform.check_the_details':
    'Verifique os detalhes',
  'fullAuth.component_onboarding_paperauthform.confirm_password':
    'Confirme sua senha',
  'fullAuth.component_onboarding_paperauthform.create_your_account':
    'Crie sua conta',
  'fullAuth.component_onboarding_paperauthform.creating_your_account':
    'Criando sua conta',
  'fullAuth.component_onboarding_paperauthform.daniel': 'Daniel',
  'fullAuth.component_onboarding_paperauthform.email': 'E-mail',
  'fullAuth.component_onboarding_paperauthform.forgot_your_password':
    'Esqueceu sua senha?',
  'fullAuth.component_onboarding_paperauthform.password': 'Senha',
  'fullAuth.component_onboarding_paperauthform.sign_in_with_email':
    'Faça login com e-mail',
  'fullAuth.component_onboarding_paperauthform.signing_you_in': 'Fazendo login',
  'fullAuth.component_onboarding_paperauthform.username': 'Nome de usuário',
  'fullAuth.component_onboarding_paperauthform.you_example_com':
    'you@example.com',
  'fullAuth.component_onboarding_paperauthform.you_will_return_to_your_first_promise':
    'Você retornará à sua primeira promessa.',
  'fullAuth.component_onboarding_paperauthform.your_promise_stays_on_this_phone_until_the_accou':
    'Sua promessa permanece neste telefone até que a conta esteja pronta.',
  'fullAuth.component_onboarding_paperauthform.your_promise_stays_on_this_phone_while_we_create':
    'Sua promessa permanece neste telefone enquanto criamos a conta.',
  'fullAuth.component_onboarding_paperauthform.your_promise_stays_on_this_phone_while_you_sign_':
    'Sua promessa permanece neste telefone enquanto você faz login.',
  'fullAuth.component_onboarding_paperauthmethods.choose_how_to_sign_in_your_promise_stays_on_this':
    'Escolha como fazer login. Sua promessa permanece neste telefone até o login ser concluído.',
  'fullAuth.component_onboarding_paperauthmethods.choose_how_you_want_to_sign_in':
    'Escolha como deseja fazer login.',
  'fullAuth.component_onboarding_paperauthmethods.continue_with_apple':
    'Continuar com a Apple',
  'fullAuth.component_onboarding_paperauthmethods.continue_with_email':
    'Continuar com e-mail',
  'fullAuth.component_onboarding_paperauthmethods.continue_with_google':
    'Continuar com o Google',
  'fullAuth.component_onboarding_paperauthmethods.save_your_promise':
    'Salve sua promessa',
  'fullAuth.component_onboarding_paperauthmethods.see_how_menta_works':
    'Veja como funciona a Menta',
  'fullAuth.component_onboarding_paperauthmethods.sign_in_to_menta':
    'Faça login na Menta',
  'fullAuth.component_onboarding_paperauthmethods.we_could_not_sign_you_in':
    'Não foi possível fazer seu login',
  'fullAuth.component_onboarding_paperauthreset.back_to_sign_in':
    'Voltar para fazer login',
  'fullAuth.component_onboarding_paperauthreset.check_your_email':
    'Verifique seu e-mail.',
  'fullAuth.component_onboarding_paperauthreset.daniel_example_com':
    'daniel@example.com',
  'fullAuth.component_onboarding_paperauthreset.email': 'E-mail',
  'fullAuth.component_onboarding_paperauthreset.email_sent_to':
    'E-mail enviado para',
  'fullAuth.component_onboarding_paperauthreset.link_valid_for_60_minutes':
    'Link válido por 60 minutos',
  'fullAuth.component_onboarding_paperauthreset.reset_for': 'Redefinir para',
  'fullAuth.component_onboarding_paperauthreset.reset_your_password':
    'Redefinir sua senha',
  'fullAuth.component_onboarding_paperauthreset.send_another_link':
    'Envie outro link',
  'fullAuth.component_onboarding_paperauthreset.send_another_link_in_countdown':
    'Envie outro link em {countdown}',
  'fullAuth.component_onboarding_paperauthreset.send_reset_link':
    'Enviar link de redefinição',
  'fullAuth.component_onboarding_paperauthreset.sending_your_reset_link':
    'Enviando seu link de redefinição',
  'fullAuth.component_onboarding_paperauthreset.use_the_latest_link':
    'Use o link mais recente.',
  'fullAuth.component_onboarding_paperauthreset.use_the_link_we_just_sent_you_can_request_anothe':
    'Use o link que acabamos de enviar. Você pode solicitar outro quando o cronômetro terminar.',
  'fullAuth.component_onboarding_paperauthreset.we_could_not_send_another_link':
    'Não foi possível enviar outro link',
  'fullAuth.component_onboarding_paperauthreset.we_could_not_send_the_reset_link':
    'Não foi possível enviar o link de redefinição',
  'fullAuth.component_onboarding_paperauthreset.we_ll_email_you_a_secure_link_your_saved_promise':
    'Enviaremos um e-mail com um link seguro. Sua promessa salva permanecerá neste telefone.',
  'fullAuth.component_onboarding_paperauthreset.we_re_sending_a_secure_link_to_the_address_below':
    'Estamos enviando um link seguro para o endereço abaixo.',
  'fullAuth.component_onboarding_paperauthreset.we_sent_a_secure_reset_link_your_saved_promise_i':
    'Enviamos um link de redefinição seguro. Sua promessa salva ainda está esperando aqui.',
  'fullAuth.component_onboarding_paperauthsurface.before_you_use_the_account_you_ll_review_and_acc':
    'Antes de usar a conta, você revisará e aceitará os documentos atuais da conta e da comunidade da Menta.',
  'fullAuth.component_onboarding_paperauthsurface.choose_sign_in_method':
    'Escolha o método de login',
  'fullAuth.component_onboarding_paperauthsurface.community_standards':
    'Normas da Comunidade',
  'fullAuth.component_onboarding_paperauthsurface.community_standards_did_not_open':
    'Os padrões da comunidade não foram abertos',
  'fullAuth.component_onboarding_paperauthsurface.hide_password':
    'Ocultar senha',
  'fullAuth.component_onboarding_paperauthsurface.keep_local_draft':
    'Manter rascunho local',
  'fullAuth.component_onboarding_paperauthsurface.menta': 'Menta',
  'fullAuth.component_onboarding_paperauthsurface.menta_authentication':
    'Autenticação da Menta',
  'fullAuth.component_onboarding_paperauthsurface.menta_mascot':
    'Mascote Menta',
  'fullAuth.component_onboarding_paperauthsurface.privacy_policy':
    'política de Privacidade',
  'fullAuth.component_onboarding_paperauthsurface.privacy_policy_did_not_open':
    'A política de privacidade não abriu',
  'fullAuth.component_onboarding_paperauthsurface.returning_to':
    'Voltando para',
  'fullAuth.component_onboarding_paperauthsurface.show_password':
    'Mostrar senha',
  'fullAuth.component_onboarding_paperauthsurface.terms_did_not_open':
    'Os termos não foram abertos',
  'fullAuth.component_onboarding_paperauthsurface.terms_of_use':
    'Termos de Uso',
  'fullAuth.component_onboarding_paperauthsurface.the_provider_sheet_was_closed_before_an_account_':
    'A tela do provedor foi fechada antes que uma conta fosse devolvida. Nada foi criado ou alterado.',
  'fullAuth.component_onboarding_paperauthsurface.title_message':
    '{title} {message}',
  'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_community_standar':
    'Tente novamente ou visite menta.quest/community-standards em seu navegador.',
  'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_privacy_in_your_b':
    'Tente novamente ou visite menta.quest/privacy em seu navegador.',
  'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_terms_in_your_bro':
    'Tente novamente ou visite menta.quest/terms em seu navegador.',
  'fullAuth.component_onboarding_paperauthsurface.you_can_try_again_or_keep_working_without_signin':
    'Você pode tentar novamente ou continuar trabalhando sem fazer login até que a Menta precise salvá-lo.',
  'fullAuth.component_onboarding_paperauthsurface.you_re_still_signed_out':
    'Você ainda não entrou.',
  'fullAuth.component_onboarding_paperauthsurface.your_local_promise_is_still_here':
    'Sua promessa local ainda está aqui',
  'fullAuth.component_settings_settingssignoutsheet.cancel': 'Cancelar',
  'fullAuth.component_settings_settingssignoutsheet.check_the_connection_then_try_again':
    'Verifique a conexão e tente novamente.',
  'fullAuth.component_settings_settingssignoutsheet.sign_out': 'sair',
  'fullAuth.component_settings_settingssignoutsheet.sign_out_did_not_finish':
    'A saída não foi concluída',
  'fullAuth.component_settings_settingssignoutsheet.try_sign_out_again':
    'Tente sair novamente',
  'fullAuth.component_support_offlinesupportnotice.you_can_still_read_the_last_saved_screen_proof_a':
    'Você ainda pode ler a última tela salva. Os rascunhos de comprovações e relatórios permanecem neste telefone até que Menta se reconecte.',
  'fullAuth.component_support_offlinesupportnotice.you_re_offline':
    'Você está off-line',
  'fullAuth.component_support_supportsurface.title_subtitle':
    '{title}. {subtitle}',
  'fullAuth.component_support_supportsurface.title_subtitle_detail':
    '{title}. {subtitle} {detail}',
  'fullAuth.edit_profile.account_required': 'Conta necessária',
  'fullAuth.edit_profile.back_to_you': 'De volta para você',
  'fullAuth.edit_profile.cannot_edit_here': 'Não é possível editar aqui',
  'fullAuth.edit_profile.change_photo': 'Alterar foto',
  'fullAuth.edit_profile.choose_a_different_photo':
    'Escolha uma foto diferente.',
  'fullAuth.edit_profile.choose_a_profile_photo': 'Escolha uma foto de perfil',
  'fullAuth.edit_profile.details': 'Detalhes',
  'fullAuth.edit_profile.display_name': 'Nome de exibição',
  'fullAuth.edit_profile.edit_again': 'Edite novamente',
  'fullAuth.edit_profile.edit_profile': 'Editar perfil',
  'fullAuth.edit_profile.email': 'E-mail',
  'fullAuth.edit_profile.how_it_will_look_on_you': 'Como ficará em você',
  'fullAuth.edit_profile.loading_your_profile': 'Carregando seu perfil',
  'fullAuth.edit_profile.name': 'Nome',
  'fullAuth.edit_profile.no_changes_have_been_made_try_loading_your_accou':
    'Nenhuma alteração foi feita. Tente carregar sua conta novamente.',
  'fullAuth.edit_profile.no_photo_selected': 'Nenhuma foto selecionada',
  'fullAuth.edit_profile.nothing_changes_until_you_choose_one':
    'Nada muda até que você escolha um.',
  'fullAuth.edit_profile.photo_not_changed_photoerror':
    'Foto não alterada. {photoError}',
  'fullAuth.edit_profile.photo_visibility': 'Visibilidade da foto',
  'fullAuth.edit_profile.photo_will_be_removed': 'A foto será removida',
  'fullAuth.edit_profile.profile_unavailable': 'Perfil indisponível',
  'fullAuth.edit_profile.profile_updated': 'Perfil atualizado',
  'fullAuth.edit_profile.remove_photo': 'Remover foto',
  'fullAuth.edit_profile.save_changes': 'Salvar alterações',
  'fullAuth.edit_profile.saving_changes': 'Salvando alterações',
  'fullAuth.edit_profile.saving_your_changes': 'Salvando suas alterações',
  'fullAuth.edit_profile.selected_not_saved': 'Selecionado, não salvo',
  'fullAuth.edit_profile.selected_profile_photo_in_its_final_circular_cro':
    'Foto de perfil selecionada em seu corte circular final',
  'fullAuth.edit_profile.sign_in_again': 'Faça login novamente',
  'fullAuth.edit_profile.sign_in_again_before_editing_this_profile':
    'Faça login novamente antes de editar este perfil.',
  'fullAuth.edit_profile.this_is_how_the_photo_will_look_on_you_it_will_n':
    'É assim que a foto ficará em você. Isso não mudará até que você salve.',
  'fullAuth.edit_profile.try_again': 'Tente novamente',
  'fullAuth.edit_profile.try_saving_again': 'Tente salvar novamente',
  'fullAuth.edit_profile.username': 'Nome de usuário',
  'fullAuth.edit_profile.usernames_can_t_be_changed_yet':
    'Os nomes de usuário ainda não podem ser alterados.',
  'fullAuth.edit_profile.value': '@{value}',
  'fullAuth.edit_profile.you_can_keep_reviewing_the_preview_while_menta_s':
    'Você pode continuar revisando a visualização enquanto a Menta salva.',
  'fullAuth.edit_profile.you_cannot_change_your_sign_in_email_here':
    'Você não pode alterar seu e-mail de login aqui.',
  'fullAuth.edit_profile.your_current_photo_stays_until_you_save_changes':
    'Sua foto atual permanece até você salvar as alterações.',
  'fullAuth.edit_profile.your_details_will_appear_when_this_check_finishe':
    'Seus detalhes aparecerão quando esta verificação terminar.',
  'fullAuth.edit_profile.your_edits_are_still_here':
    'Suas edições ainda estão aqui',
  'fullAuth.edit_profile.your_profile_has_not_changed': 'Seu perfil não mudou.',
  'fullAuth.edit_profile.your_profile_has_not_changed_try_saving_again':
    'Seu perfil não mudou. Tente salvar novamente.',
  'fullAuth.edit_profile.your_saved_name_and_photo_now_appear_across_ment':
    'Seu nome e foto salvos agora aparecem na Menta.',
  'fullAuth.email_auth.confirm_password': 'Confirme sua senha',
  'fullAuth.email_auth.couldn_t_create_account':
    'Não foi possível criar a conta',
  'fullAuth.email_auth.couldn_t_sign_you_in': 'Não foi possível fazer login',
  'fullAuth.email_auth.create_an_account_to_save_this_promise_to_menta':
    'Crie uma conta para salvar esta promessa na Menta.',
  'fullAuth.email_auth.create_your_account': 'Crie sua conta',
  'fullAuth.email_auth.daniel': 'Daniel',
  'fullAuth.email_auth.email': 'E-mail',
  'fullAuth.email_auth.forgot_your_password': 'Esqueceu sua senha?',
  'fullAuth.email_auth.menta': 'Menta',
  'fullAuth.email_auth.other_people_may_see_this_with_your_group_activi':
    'Outras pessoas podem ver isso nas atividades do seu grupo e nas fotos do evento.',
  'fullAuth.email_auth.password': 'Senha',
  'fullAuth.email_auth.sign_in_to_save_this_promise_to_your_menta_accou':
    'Faça login para salvar esta promessa em sua conta Menta.',
  'fullAuth.email_auth.sign_in_with_email': 'Faça login com e-mail',
  'fullAuth.email_auth.use_6_or_more_characters': 'Use 6 ou mais caracteres.',
  'fullAuth.email_auth.use_an_email_you_can_access_if_you_ever_need_to_':
    'Use um e-mail que você possa acessar se precisar recuperar sua conta.',
  'fullAuth.email_auth.username': 'Nome de usuário',
  'fullAuth.email_auth.you_example_com': 'você@exemplo.com',
  'fullAuth.legal_acceptance.agree_and_continue': 'Aceite e continue',
  'fullAuth.legal_acceptance.back': 'Voltar',
  'fullAuth.legal_acceptance.before_you': 'Antes de você',
  'fullAuth.legal_acceptance.checking_the_current_legal_documents':
    'Verificando os documentos legais atuais',
  'fullAuth.legal_acceptance.continue': 'continuar.',
  'fullAuth.legal_acceptance.couldn_t_check_your_agreement':
    'Não foi possível verificar seu contrato',
  'fullAuth.legal_acceptance.create': 'criar.',
  'fullAuth.legal_acceptance.i_agree_to_menta_s_terms_of_use_and_community_st':
    'Concordo com os Termos de Uso e as Normas da Comunidade da Menta e reconheço a Política de Privacidade.',
  'fullAuth.legal_acceptance.leave_legal_review':
    'Sair da análise dos documentos',
  'fullAuth.legal_acceptance.menta': 'Menta',
  'fullAuth.legal_acceptance.menta_mascot_beside_your_account_confirmation':
    'Mascote Menta ao lado da confirmação da sua conta',
  'fullAuth.legal_acceptance.try_again': 'Tente novamente',
  'fullAuth.legal_acceptance.you_can_go_back_without_agreeing_your_account_an':
    'Você pode voltar sem concordar. Sua conta e as promessas existentes permanecem disponíveis.',
  'fullAuth.login.menta': 'Menta',
  'fullAuth.notification_settings.a_test_is_already_on_the_way':
    'Um teste já está a caminho',
  'fullAuth.notification_settings.allow_notifications': 'Permitir notificações',
  'fullAuth.notification_settings.allow_notifications_first':
    'Permitir notificações primeiro',
  'fullAuth.notification_settings.back_to_settings': 'Voltar às configurações',
  'fullAuth.notification_settings.check_again_before_turning_on_proof_reminders':
    'Verifique novamente antes de ativar os lembretes de comprovação.',
  'fullAuth.notification_settings.check_notification_permission':
    'Verifique a permissão de notificação',
  'fullAuth.notification_settings.check_notification_permission_and_try_the_test_a':
    'Verifique a permissão de notificação e tente o teste novamente em alguns instantes.',
  'fullAuth.notification_settings.choice_saved': 'Escolha salva',
  'fullAuth.notification_settings.choose_daily_proof_reminders_and_updates_when_a_':
    'Escolha lembretes diários e atualizações quando uma promessa estiver terminando.',
  'fullAuth.notification_settings.choose_notifications_for_menta_then_return_here':
    'Escolha Notificações para Menta e retorne aqui.',
  'fullAuth.notification_settings.choose_the_notifications_you_want_from_menta':
    'Escolha as notificações que deseja da Menta.',
  'fullAuth.notification_settings.choose_the_notifications_you_want_from_menta_bel':
    'Escolha as notificações que deseja da Menta abaixo.',
  'fullAuth.notification_settings.choose_which_group_and_progress_updates_menta_ma':
    'Escolha quais atualizações de grupo e progresso a Menta pode enviar.',
  'fullAuth.notification_settings.confirmed_milestones_momenta_and_streak_changes':
    'Marcos confirmados, Momenta e mudanças na sequência.',
  'fullAuth.notification_settings.could_not_check_phone_notifications':
    'Não foi possível verificar as notificações do telefone',
  'fullAuth.notification_settings.could_not_load_notification_settings':
    'Não foi possível carregar as configurações de notificação.',
  'fullAuth.notification_settings.could_not_load_notification_settings_2':
    'Não foi possível carregar as configurações de notificação',
  'fullAuth.notification_settings.could_not_open_phone_settings':
    'Não foi possível abrir as configurações do telefone',
  'fullAuth.notification_settings.could_not_save_your_choice':
    'Não foi possível salvar sua escolha',
  'fullAuth.notification_settings.delivery_and_timing': 'Entrega e prazo',
  'fullAuth.notification_settings.email_choice_did_not_change':
    'A escolha do e-mail não mudou',
  'fullAuth.notification_settings.email_updates': 'Atualizações por e-mail',
  'fullAuth.notification_settings.email_updates_are_off':
    'As atualizações por e-mail estão desativadas',
  'fullAuth.notification_settings.email_updates_are_on':
    'As atualizações por e-mail estão ativadas',
  'fullAuth.notification_settings.email_updates_are_still_off':
    'As atualizações por e-mail ainda estão desativadas',
  'fullAuth.notification_settings.email_updates_are_unavailable':
    'As atualizações por e-mail não estão disponíveis',
  'fullAuth.notification_settings.if_it_does_not_save_menta_will_put_your_previous':
    'Se não salvar, a Menta restaurará sua escolha anterior.',
  'fullAuth.notification_settings.it_should_arrive_shortly_tap_it_to_return_to_not':
    'Deve chegar em breve. Toque nele para retornar às configurações de notificação.',
  'fullAuth.notification_settings.keep_notifications_off':
    'Mantenha as notificações desativadas',
  'fullAuth.notification_settings.loading_notification_settings':
    'Carregando configurações de notificação',
  'fullAuth.notification_settings.loading_your_notification_settings':
    'Carregando suas configurações de notificação.',
  'fullAuth.notification_settings.menta_can_resume_notifications_after_this_time':
    'A Menta poderá retomar as notificações após esse horário.',
  'fullAuth.notification_settings.menta_could_not_connect_this_email_safely_so_you':
    'A Menta não conseguiu conectar este e-mail com segurança, então sua autorização não foi ativada.',
  'fullAuth.notification_settings.menta_could_not_finish_notification_registration':
    'A Menta não conseguiu finalizar o registro da notificação. Tente novamente em alguns instantes.',
  'fullAuth.notification_settings.menta_does_not_send_notifications_during_these_h':
    'A Menta não envia notificações durante esse horário. Elas podem chegar depois.',
  'fullAuth.notification_settings.menta_does_not_send_notifications_during_this_lo':
    'A Menta não envia notificações durante esta janela de horário local.',
  'fullAuth.notification_settings.menta_is_checking_this_phone_and_your_active_pro':
    'A Menta está verificando este telefone e suas promessas ativas.',
  'fullAuth.notification_settings.menta_is_checking_this_phone_before_it_queues_th':
    'A Menta está verificando este telefone antes de colocar o teste na fila.',
  'fullAuth.notification_settings.menta_is_finishing_notification_setup_for_this_p':
    'A Menta está finalizando a configuração de notificação para este telefone.',
  'fullAuth.notification_settings.menta_may_remind_you_while_proof_is_due_or_a_pro':
    'A Menta pode lembrar você quando uma comprovação estiver pendente ou uma promessa estiver terminando, e aguardará durante o horário de silêncio.',
  'fullAuth.notification_settings.menta_may_send_occasional_product_news_to_your_a':
    'A Menta pode enviar novidades ocasionais sobre produtos para o e-mail da sua conta. Você pode desligar isso aqui a qualquer momento.',
  'fullAuth.notification_settings.menta_needs_a_confirmed_account_email_before_thi':
    'A Menta precisa de um e-mail de conta confirmado antes que esta escolha possa mudar.',
  'fullAuth.notification_settings.menta_product_news':
    'Novidades sobre produtos Menta',
  'fullAuth.notification_settings.menta_removed_this_email_from_product_update_del':
    'A Menta removeu este e-mail da entrega de atualização de produto.',
  'fullAuth.notification_settings.menta_will_not_send_proof_or_promise_ending_remi':
    'A Menta não enviará comprovações ou lembretes de fim de promessa, a menos que você os ative novamente.',
  'fullAuth.notification_settings.menta_will_use_this_choice_for_future_notificati':
    'A Menta usará esta escolha para notificações futuras.',
  'fullAuth.notification_settings.new_proof_to_review_review_outcomes_check_ins_an':
    'Novas comprovações para analisar, resultados de análises, check-ins e mudanças de grupo.',
  'fullAuth.notification_settings.no_notification_was_queued':
    'Nenhuma notificação foi colocada na fila.',
  'fullAuth.notification_settings.nothing_was_sent_try_again_in_a_moment':
    'Nada foi enviado. Tente novamente em alguns instantes.',
  'fullAuth.notification_settings.notification_setup_did_not_finish':
    'A configuração da notificação não foi concluída',
  'fullAuth.notification_settings.notifications': 'Notificações',
  'fullAuth.notification_settings.promise_context_title':
    'Lembretes de promessas',
  'fullAuth.notification_settings.promise_context_body':
    'Este horário de lembrete se aplica a todas as promessas ativas. Os horários seguem {timeZone}.',
  'fullAuth.notification_settings.back_to_promise': 'Voltar à promessa',
  'fullAuth.notification_settings.notifications_are_off':
    'As notificações estão desativadas',
  'fullAuth.notification_settings.notifications_are_still_off':
    'As notificações ainda estão desativadas',
  'fullAuth.notification_settings.notifications_off':
    'Notificações desativadas',
  'fullAuth.notification_settings.old_reminders_may_still_be_on_this_phone':
    'Lembretes antigos ainda podem estar neste telefone',
  'fullAuth.notification_settings.open_phone_settings':
    'Abra as configurações do telefone',
  'fullAuth.notification_settings.open_your_phone_settings_choose_menta_then_notif':
    'Abra as configurações do seu telefone, escolha Menta e, em seguida, Notificações para permitir lembretes.',
  'fullAuth.notification_settings.open_your_phone_settings_choose_menta_then_notif_2':
    'Abra as configurações do seu telefone, escolha Menta, depois Notificações e permita notificações.',
  'fullAuth.notification_settings.opening_phone_settings':
    'Abrindo as configurações do telefone',
  'fullAuth.notification_settings.optional_menta_product_news_this_is_separate_fro':
    'Novidades opcionais sobre produtos da Menta. Isso é separado das notificações da conta e de comprovações.',
  'fullAuth.notification_settings.people_and_progress': 'Pessoas e progresso',
  'fullAuth.notification_settings.phone_controls': 'Controles do telefone',
  'fullAuth.notification_settings.phone_notification_check_failed':
    'Falha na verificação de notificação por telefone',
  'fullAuth.notification_settings.phone_notification_settings':
    'Configurações de notificação por telefone',
  'fullAuth.notification_settings.preferred_time_formattedremindertime_a_proof_dea':
    'Horário preferido: {formattedReminderTime}. Um prazo de comprovação ou horário de silêncio pode alterar o horário real.',
  'fullAuth.notification_settings.preferred_time_formattedremindertime_notificatio':
    'Horário preferido: {formattedReminderTime}. As notificações estão desativadas neste telefone.',
  'fullAuth.notification_settings.preparing_a_test_notification':
    'Preparando uma notificação de teste',
  'fullAuth.notification_settings.preparing_proof_reminders':
    'Preparando lembretes de comprovação',
  'fullAuth.notification_settings.promise_reminders': 'Lembretes de promessa',
  'fullAuth.notification_settings.proof_reminders': 'Lembretes de comprovação',
  'fullAuth.notification_settings.proof_reminders_are_off':
    'Os lembretes de comprovação estão desativados',
  'fullAuth.notification_settings.proof_reminders_are_ready':
    'Os lembretes de comprovação estão prontos',
  'fullAuth.notification_settings.proof_reminders_are_ready_on_this_phone':
    'Os lembretes de comprovação estão prontos neste celular',
  'fullAuth.notification_settings.proof_reminders_saved':
    'Lembretes de comprovação salvos',
  'fullAuth.notification_settings.quiet_hours': 'Horas tranquilas',
  'fullAuth.notification_settings.quiet_hours_and_delivery':
    'Horário tranquilo e entrega',
  'fullAuth.notification_settings.quiet_hours_end':
    'Fim do horário de silêncio',
  'fullAuth.notification_settings.quiet_hours_formattedquiethours':
    'Horário de silêncio {formattedQuietHours}',
  'fullAuth.notification_settings.quiet_hours_not_saved':
    'Horas silenciosas não salvas',
  'fullAuth.notification_settings.quiet_hours_saved':
    'Horário de silêncio salvo',
  'fullAuth.notification_settings.quiet_hours_start':
    'Horário de silêncio começa',
  'fullAuth.notification_settings.reload_your_saved_notification_choices':
    'Recarregue suas opções de notificação salvas',
  'fullAuth.notification_settings.reminder_setup_did_not_finish':
    'A configuração do lembrete não foi concluída',
  'fullAuth.notification_settings.reminder_time': 'Hora do lembrete',
  'fullAuth.notification_settings.reminder_time_did_not_update_on_this_phone':
    'O horário do lembrete não foi atualizado neste telefone',
  'fullAuth.notification_settings.reviews_and_group_activity':
    'Avaliações e atividades em grupo',
  'fullAuth.notification_settings.save_quiet_hours':
    'Salvar horário de silêncio',
  'fullAuth.notification_settings.saving_quiet_hours':
    'Salvando horário de silêncio',
  'fullAuth.notification_settings.saving_your_choice': 'Salvando sua escolha',
  'fullAuth.notification_settings.saving_your_choice_2':
    'Salvando sua escolha…',
  'fullAuth.notification_settings.saving_your_email_choice':
    'Salvando sua escolha de e-mail…',
  'fullAuth.notification_settings.send_one_real_notification_to_this_signed_in_pho':
    'Envie uma notificação real para este telefone conectado.',
  'fullAuth.notification_settings.send_test_notification':
    'Enviar notificação de teste',
  'fullAuth.notification_settings.set_quiet_hours_email_and_phone_notification_opt':
    'Defina horários de silêncio, opções de notificação por e-mail e telefone.',
  'fullAuth.notification_settings.sign_in_again': 'Faça login novamente',
  'fullAuth.notification_settings.sign_in_again_to_send_a_test':
    'Faça login novamente para enviar um teste',
  'fullAuth.notification_settings.sounds_previews_focus_and_scheduled_delivery':
    'Sons, prévias, foco e entrega programada.',
  'fullAuth.notification_settings.sounds_previews_focus_and_scheduled_delivery_are':
    'Sons, visualizações, foco e entrega programada pertencem ao seu telefone.',
  'fullAuth.notification_settings.streaks_and_momenta': 'Sequências e Momenta',
  'fullAuth.notification_settings.test_notification_queued':
    'Notificação de teste na fila',
  'fullAuth.notification_settings.test_notification_was_not_queued':
    'A notificação de teste não foi colocada na fila',
  'fullAuth.notification_settings.test_notifications': 'Notificações de teste',
  'fullAuth.notification_settings.the_range_can_cross_midnight':
    'O intervalo pode ultrapassar a meia-noite.',
  'fullAuth.notification_settings.there_are_no_active_promises_to_schedule_yet_men':
    'Ainda não há promessas ativas para agendar. A Menta usará essa escolha quando você iniciar uma.',
  'fullAuth.notification_settings.this_phone_is_not_ready_yet':
    'Este telefone ainda não está pronto',
  'fullAuth.notification_settings.this_phone_is_ready_for_menta_notifications':
    'Este celular está pronto para receber notificações da Menta',
  'fullAuth.notification_settings.this_phone_may_show_a_reminder_at_your_preferred':
    'Este telefone pode mostrar um lembrete no horário de sua preferência para promessas ativas.',
  'fullAuth.notification_settings.this_phone_must_allow_menta_notifications_before':
    'Este celular precisa permitir notificações da Menta antes que um teste possa ser enviado.',
  'fullAuth.notification_settings.this_phone_will_not_show_menta_notifications_unt':
    'Este telefone não mostrará notificações da Menta até que você as ative.',
  'fullAuth.notification_settings.to_turn_them_on': 'Para ativá-los',
  'fullAuth.notification_settings.try_again': 'Tente novamente',
  'fullAuth.notification_settings.try_again_before_relying_on_notifications_from_t':
    'Tente novamente antes de confiar nas notificações deste telefone.',
  'fullAuth.notification_settings.try_again_before_turning_on_reminders_for_this_p':
    'Tente novamente antes de ativar os lembretes para este telefone.',
  'fullAuth.notification_settings.turning_off_email_updates':
    'Desativando atualizações por e-mail',
  'fullAuth.notification_settings.turning_on_email_updates':
    'Ativando atualizações por e-mail',
  'fullAuth.notification_settings.wait_one_minute_before_requesting_another_test':
    'Aguarde um minuto antes de solicitar outro teste.',
  'fullAuth.notification_settings.your_choice_is_saved_but_an_old_reminder_may_sti':
    'Sua escolha será salva, mas um lembrete antigo ainda poderá aparecer. Tente novamente.',
  'fullAuth.notification_settings.your_choice_is_saved_but_proof_reminders_are_not':
    'Sua escolha foi salva, mas os lembretes de comprovação ainda não estão prontos. Tente novamente.',
  'fullAuth.notification_settings.your_choice_is_saved_but_proof_reminders_are_not_2':
    'Sua escolha foi salva, mas os lembretes de comprovação não estão prontos neste telefone. Tente novamente.',
  'fullAuth.notification_settings.your_choices_are_saved_but_this_phone_cannot_sho':
    'Suas escolhas são salvas, mas este telefone não pode mostrar notificações da Menta até que você permita.',
  'fullAuth.notification_settings.your_current_choice_remains_authoritative_until_':
    'Sua escolha atual permanece válida até que seja salva.',
  'fullAuth.notification_settings.your_current_quiet_hours_stay_in_place_until_thi':
    'Seu horário de silêncio atual permanece em vigor até que isso seja salvo.',
  'fullAuth.notification_settings.your_menta_opt_out_is_saved_provider_removal_wil':
    'Sua desativação da Menta foi salva. A remoção do provedor será repetida na próxima vez que esta conta for conectada.',
  'fullAuth.notification_settings.your_phone_did_not_return_a_notification_setting':
    'Seu telefone não retornou uma configuração de notificação. Nenhuma permissão alterada.',
  'fullAuth.notification_settings.your_phone_now_allows_notifications':
    'Seu telefone agora permite notificações',
  'fullAuth.notification_settings.your_preferred_time_is_saved_but_this_phone_may_':
    'Seu horário preferido será salvo, mas este telefone ainda poderá usar o horário antigo. Tente novamente.',
  'fullAuth.notification_settings.your_previous_email_choice_is_still_active':
    'Sua escolha de e-mail anterior ainda está ativa.',
  'fullAuth.notification_settings.your_previous_notification_choice_is_still_activ':
    'Sua opção de notificação anterior ainda está ativa.',
  'fullAuth.notification_settings.your_previous_quiet_hours_remain_active':
    'Suas horas de silêncio anteriores permanecem ativas.',
  'fullAuth.notification_settings.your_promises_still_work_menta_will_not_ask_agai':
    'Suas promessas ainda funcionam. A Menta não perguntará novamente aqui.',
  'fullAuth.notification_settings.your_promises_still_work_this_phone_will_not_sho':
    'Suas promessas ainda funcionam. Este telefone não mostrará notificações de comprovação, revisão ou grupo.',
  'fullAuth.notification_settings.your_proof_reminder_choice_is_unchanged_your_pho':
    'Sua escolha de lembrete de comprovação permanece inalterada. Seu telefone perguntará a seguir.',
  'fullAuth.onboarding.32_character_code': 'Código de 32 caracteres',
  'fullAuth.onboarding.accountability': 'Responsabilidade',
  'fullAuth.onboarding.activation_needs_attention':
    'A ativação precisa de atenção',
  'fullAuth.onboarding.add_code_and_create': 'Adicione código e crie',
  'fullAuth.onboarding.add_it_now_or_create_your_promise_without_one_gr':
    'Adicione-o agora ou crie sua promessa sem ele. Os convites de grupo funcionam separadamente.',
  'fullAuth.onboarding.add_referral_code': 'Adicionar código de referência',
  'fullAuth.onboarding.after_it_s_created_menta_adds':
    'Depois de criado, a Menta adiciona',
  'fullAuth.onboarding.agree_and_choose_sign_in': 'Concorde e escolha o login',
  'fullAuth.onboarding.agree_and_continue': 'Aceite e continue',
  'fullAuth.onboarding.back': 'Voltar',
  'fullAuth.onboarding.back_to_backlabel': 'Voltar para {backLabel}',
  'fullAuth.onboarding.choose_a_length_you_can_genuinely_follow_through':
    'Escolha uma duração que você consiga cumprir de verdade.',
  'fullAuth.onboarding.choose_how_you_want_to_continue_your_draft_stays':
    'Escolha como deseja continuar. Seu rascunho permanece neste telefone.',
  'fullAuth.onboarding.choose_length': 'Escolha a duração',
  'fullAuth.onboarding.choose_proof': 'Escolha a comprovação',
  'fullAuth.onboarding.choose_the_proof_you_will_add_and_who_you_want_b':
    'Escolha a comprovação que você vai adicionar e quem deseja ao seu lado.',
  'fullAuth.onboarding.choose_what_you_ll_add_when_it_s_done_you_can_in':
    'Escolha o que você adicionará quando terminar. Você pode convidar pessoas para revisá-lo depois de salvá-lo.',
  'fullAuth.onboarding.complete_this_promise_and_add_a_proofname_as_pro':
    'Cumpra esta promessa e adicione uma {proofName} como comprovação.',
  'fullAuth.onboarding.confirm_the_required_documents':
    'Confirme os documentos necessários.',
  'fullAuth.onboarding.confirming_code': 'Confirmando código…',
  'fullAuth.onboarding.continue_to_referral':
    'Continuar para o código de referência',
  'fullAuth.onboarding.continue_to_save': 'Continuar e salvar',
  'fullAuth.onboarding.continue_with_apple': 'Continuar com a Apple',
  'fullAuth.onboarding.continue_with_email': 'Continuar com e-mail',
  'fullAuth.onboarding.continue_with_google': 'Continuar com o Google',
  'fullAuth.onboarding.could_not_finish_setup':
    'Não foi possível concluir a configuração',
  'fullAuth.onboarding.create_a_group': 'Crie um grupo',
  'fullAuth.onboarding.review_promise_invite': 'Revise o convite de promessa',
  'fullAuth.onboarding.promise_invite_held':
    'Seu convite de promessa continua guardado. Analise-o a seguir; participar continua sendo uma ação separada.',
  'fullAuth.onboarding.review_group_invite': 'Revise o convite do grupo',
  'fullAuth.onboarding.group_invite_held':
    'O convite do seu grupo continua guardado. Analise-o a seguir; participar continua sendo uma ação separada.',
  'fullAuth.onboarding.open_event': 'Abrir evento',
  'fullAuth.onboarding.event_held':
    'Seu evento continua guardado. Abra-o a seguir; este recibo de promessa não confirma participação.',
  'fullAuth.onboarding.create_my_group': 'Criar meu grupo',
  'fullAuth.onboarding.create_my_group_detail':
    'Sua promessa está salva. Crie seu novo grupo a seguir; nenhum grupo existe até que Menta o confirme.',
  'fullAuth.onboarding.create_it_first_menta_will_then_add':
    'Crie-o primeiro. A Menta irá então adicionar',
  'fullAuth.onboarding.create_without_a_code': 'Crie sem código',
  'fullAuth.onboarding.creating_your_first_promise':
    'Criando sua primeira promessa',
  'fullAuth.onboarding.creating_your_first_promise_2':
    'Criando sua primeira promessa…',
  'fullAuth.onboarding.days': 'dias',
  'fullAuth.onboarding.decide_what_finished_will_look_like':
    'Decida como será o resultado final.',
  'fullAuth.onboarding.do_you_have_a_referral_code':
    'Você tem um código de referência?',
  'fullAuth.onboarding.edit': 'Editar',
  'fullAuth.onboarding.every_day': 'Diariamente',
  'fullAuth.onboarding.every_day_2': '· Diariamente ·',
  'fullAuth.promise.frequency.once_a_week': 'Uma vez por semana',
  'fullAuth.onboarding.first_promise': 'Primeira promessa',
  'fullAuth.onboarding.first_promise_firstpromisecost_momenta_after_cre':
    'Primeira promessa, {firstPromiseCost} Momenta. Depois de criar, {welcomeBonus} Momenta dão as boas-vindas para escolhas posteriores.',
  'fullAuth.onboarding.free': 'grátis.',
  'fullAuth.onboarding.how_long_do_you_want_to_keep_this_promise':
    'Por quanto tempo você deseja manter essa promessa?',
  'fullAuth.onboarding.how_will_you_prove_it': 'Como você vai comprovar isso?',
  'fullAuth.onboarding.i_agree_to_menta_s_terms_of_use_and_community_st':
    'Concordo com os Termos de Uso e as Normas da Comunidade da Menta e reconheço a Política de Privacidade.',
  'fullAuth.onboarding.invite': 'Convidar',
  'fullAuth.onboarding.invite_people_after_this_promise_is_saved_member':
    'Convide pessoas depois que esta promessa for salva. Os membros podem analisar sua comprovação.',
  'fullAuth.onboarding.just_me': 'Apenas eu',
  'fullAuth.onboarding.keep_it_specific_enough_that_you_will_know_when_':
    'Mantenha-o específico o suficiente para saber quando terminar.',
  'fullAuth.onboarding.legal_confirmation_did_not_finish':
    'A confirmação legal não terminou.',
  'fullAuth.onboarding.legal_review_was_not_completed':
    'A revisão jurídica não foi concluída.',
  'fullAuth.onboarding.length': 'Duração',
  'fullAuth.onboarding.local_draft': 'Rascunho local',
  'fullAuth.onboarding.menta': 'Menta',
  'fullAuth.onboarding.menta_confirms_the_first_deadline_when_you_save':
    'A Menta confirma o primeiro prazo quando você salva.',
  'fullAuth.onboarding.menta_confirms_your_first_deadline_when_the_prom':
    'A Menta confirma seu primeiro prazo quando a promessa é criada.',
  'fullAuth.onboarding.menta_is_confirming_your_promise_and_momenta_bal':
    'A Menta está confirmando sua promessa e saldo de Momenta.',
  'fullAuth.onboarding.menta_mascot_offering_you_a_bag_of_momenta_token':
    'Mascote Menta oferecendo uma sacola com tokens Momenta',
  'fullAuth.onboarding.menta_mascot_waving_you_toward_saving_this_promi':
    'Mascote Menta acenando para você salvar esta promessa',
  'fullAuth.onboarding.menta_saved_the_promise_and_confirmed_your_accou':
    'Menta guardou a promessa e confirmou sua conta no mesmo recibo do servidor.',
  'fullAuth.onboarding.message_your_draft_is_still_here':
    '{message} Seu rascunho ainda está aqui.',
  'fullAuth.onboarding.momenta': 'Momenta',
  'fullAuth.onboarding.momenta_for_extra_promises_groups_freezes_and_it':
    'Momenta para promessas extras, grupos, congelamentos e itens.',
  'fullAuth.onboarding.momenta_for_later_choices':
    'Momenta para escolhas posteriores.',
  'fullAuth.onboarding.my_promise': 'Minha promessa',
  'fullAuth.onboarding.next_due': 'Próximo prazo',
  'fullAuth.onboarding.note': 'Observação',
  'fullAuth.onboarding.opening_email': 'Abrindo e-mail…',
  'fullAuth.onboarding.photo': 'Foto',
  'fullAuth.onboarding.preview_my_promise': 'Visualize minha promessa',
  'fullAuth.onboarding.promise_length': 'Duração da promessa',
  'fullAuth.onboarding.promise_saved_and_confirmed':
    'Promessa salva e confirmada',
  'fullAuth.onboarding.proof': 'Comprovação',
  'fullAuth.onboarding.proof_and_support': 'COMPROVAÇÃO E SUPORTE',
  'fullAuth.onboarding.proof_cadence': 'Frequência da comprovação',
  'fullAuth.onboarding.providername_sign_in_did_not_finish':
    'O login do {providerName} não foi concluído.',
  'fullAuth.onboarding.read_the_current_account_and_community_documents':
    'Leia os documentos atuais da conta e da comunidade antes de criar sua promessa.',
  'fullAuth.onboarding.record_a_short_clip': 'Grave um clipe curto.',
  'fullAuth.onboarding.referral_code': 'Código de referência',
  'fullAuth.onboarding.reopen_onboarding_before_continuing_with_email':
    'Reabra a configuração inicial antes de continuar com o e-mail.',
  'fullAuth.onboarding.restored_from_this_phone': 'Restaurado deste telefone',
  'fullAuth.onboarding.return_to_draft': 'Voltar ao rascunho',
  'fullAuth.onboarding.review_menta_s_terms': 'Revise os termos da Menta',
  'fullAuth.onboarding.review_your_promise': 'Revise sua promessa',
  'fullAuth.onboarding.save_this_promise_to_menta':
    'Guarde esta promessa na Menta.',
  'fullAuth.onboarding.save_your_promise': 'Salve sua promessa',
  'fullAuth.onboarding.schedule': 'Agendar',
  'fullAuth.onboarding.schedule_every_day': 'Todos os dias',
  'fullAuth.onboarding.show_another_example': 'Ver outro exemplo',
  'fullAuth.onboarding.sign_in_to_save_my_promise':
    'Faça login para salvar minha promessa',
  'fullAuth.onboarding.start_privately_you_can_invite_people_later':
    'Comece de forma privada. Você pode convidar pessoas mais tarde.',
  'fullAuth.onboarding.start_with_one_thing_that_matters_today':
    'Comece com algo que importa hoje.',
  'fullAuth.onboarding.stay_here_and_try_again_so_menta_can_keep_this_p':
    'Fique aqui e tente novamente para que a Menta cumpra essa promessa neste telefone.',
  'fullAuth.onboarding.stay_here_and_try_email_sign_in_again_so_menta_c':
    'Fique aqui e tente fazer login por e-mail novamente para que a Menta possa cumprir essa promessa neste telefone.',
  'fullAuth.onboarding.take_one_photo': 'Tire uma foto.',
  'fullAuth.onboarding.this_choice_sets_your_next_step_it_does_not_add_':
    'Esta escolha define seu próximo passo. Ele ainda não adiciona ninguém nem cria um grupo.',
  'fullAuth.onboarding.use_duration_days': 'Usar por {duration} dias',
  'fullAuth.onboarding.video': 'Vídeo',
  'fullAuth.onboarding.welcome_momenta': 'Boas-vindas, Momenta',
  'fullAuth.onboarding.what_s_one_thing_you_want_to_do':
    'O que você quer fazer?',
  'fullAuth.onboarding.who_will_hold_you_accountable':
    'Quem vai ajudar você a manter o compromisso?',
  'fullAuth.onboarding.write_what_happened': 'Escreva o que aconteceu.',
  'fullAuth.onboarding.you_can_review_these_choices_before_menta_saves_':
    'Você pode revisar essas opções antes que a Menta salve qualquer coisa.',
  'fullAuth.onboarding.your_account_changed': 'Sua conta mudou.',
  'fullAuth.onboarding.your_draft_could_not_be_saved_yet':
    'Ainda não foi possível salvar seu rascunho.',
  'fullAuth.onboarding.your_draft_is_private_on_this_phone_sign_in_to_k':
    'Seu rascunho é privado neste telefone. Faça login para mantê-lo.',
  'fullAuth.onboarding.your_draft_is_still_private_on_this_phone':
    'Seu rascunho ainda é privado neste telefone.',
  'fullAuth.onboarding.your_first_promise': 'SUA PRIMEIRA PROMESSA',
  'fullAuth.onboarding.for_promise': 'Para “{promise}”',
  'fullAuth.onboarding.check_ins': '{count} registros',
  'fullAuth.onboarding.your_first_promise_2': 'Sua primeira promessa',
  'fullAuth.onboarding.your_first_promise_is': 'Sua primeira promessa é',
  'fullAuth.onboarding.your_promise': 'Sua promessa',
  'fullAuth.onboarding.your_promise_2': 'SUA PROMESSA',
  'fullAuth.onboarding.your_promise_is_ready': 'Sua promessa está pronta.',
  'fullAuth.onboarding.your_promise_is_safe_confirm_the_documents_below':
    'Sua promessa está segura. Confirme os documentos abaixo antes de criá-lo.',
  'fullAuth.onboarding.your_promise_is_safe_try_again_before_continuing':
    'Sua promessa está segura. Tente novamente antes de continuar.',
  'fullAuth.onboarding.your_promise_is_still_safe_review_the_current_do':
    'Sua promessa ainda está segura. Revise os documentos atuais quando estiver pronto para continuar.',
  'fullAuth.password_recovery.change_my_password': 'Alterar minha senha',
  'fullAuth.password_recovery.choose_a_new_password': 'Escolha uma nova senha',
  'fullAuth.password_recovery.close': 'Fechar',
  'fullAuth.password_recovery.close_password_reset':
    'Fechar redefinição de senha',
  'fullAuth.password_recovery.confirm_password': 'Confirme sua senha',
  'fullAuth.password_recovery.couldn_t_change_your_password':
    'Não foi possível alterar sua senha',
  'fullAuth.password_recovery.enter_new_password': 'Digite a nova senha',
  'fullAuth.password_recovery.menta': 'Menta',
  'fullAuth.password_recovery.new_password': 'Nova Senha',
  'fullAuth.password_recovery.or_more_characters_both_entries_must_match':
    'ou mais caracteres. As duas entradas precisam ser iguais.',
  'fullAuth.password_recovery.other_signed_in_devices_may_ask_for_the_new_pass':
    'Outros dispositivos conectados podem solicitar a nova senha.',
  'fullAuth.password_recovery.password_changed': 'Senha alterada',
  'fullAuth.password_recovery.re_enter_new_password':
    'Digite novamente a nova senha',
  'fullAuth.password_recovery.request_a_new_link': 'Solicite um novo link',
  'fullAuth.password_recovery.request_a_new_link_your_draft_is_still_on_this_p':
    'Solicite um novo link. Seu rascunho ainda está neste telefone.',
  'fullAuth.password_recovery.return_to': 'Voltar para',
  'fullAuth.password_recovery.sign_in': 'Entrar',
  'fullAuth.password_recovery.sign_in_instead': 'Em vez disso, faça login',
  'fullAuth.password_recovery.this_reset_link_has_expired':
    'Este link de redefinição expirou.',
  'fullAuth.password_recovery.use': 'Usar',
  'fullAuth.password_recovery.your_password_has_been_changed':
    'Sua senha foi alterada.',
  'fullAuth.report_issue.1_open_2_tap_3_notice':
    '1. Abra… 2. Toque em… 3. Aviso…',
  'fullAuth.report_issue.add_a_screenshot': 'Adicione uma captura de tela',
  'fullAuth.report_issue.add_more_detail': 'Adicione mais detalhes',
  'fullAuth.report_issue.add_the_basics': 'Adicione o básico',
  'fullAuth.report_issue.attach_a_jpeg_png_or_webp_screenshot':
    'Anexe uma captura de tela JPEG, PNG ou WebP.',
  'fullAuth.report_issue.back_to_support': 'Voltar ao suporte',
  'fullAuth.report_issue.choose_a_screenshot_smaller_than_8_mb':
    'Escolha uma captura de tela menor que 8 MB.',
  'fullAuth.report_issue.choose_an_image': 'Escolha uma imagem',
  'fullAuth.report_issue.choose_another_report': 'Escolha outro relatório',
  'fullAuth.report_issue.choose_screenshot': 'Escolha a captura de tela',
  'fullAuth.report_issue.could_not_find_this_saved_report':
    'Não foi possível encontrar este relatório salvo',
  'fullAuth.report_issue.crash_reference': 'Referência de falha',
  'fullAuth.report_issue.expected_result_optional':
    'Resultado esperado, opcional',
  'fullAuth.report_issue.expected_result_optional_2':
    'Resultado esperado (opcional)',
  'fullAuth.report_issue.feedback_received': 'Comentários recebidos',
  'fullAuth.report_issue.feedback_required': 'Comentários obrigatórios',
  'fullAuth.report_issue.give_the_report_a_short_title_and_explain_what_h':
    'Dê um título curto ao relatório e explique o que aconteceu.',
  'fullAuth.report_issue.inappropriate': 'inadequado',
  'fullAuth.report_issue.it_is_not_saved_under_this_account_nothing_was_c':
    'Não é salvo nesta conta. Nada foi alterado.',
  'fullAuth.report_issue.keep_this_screen_open_while_you_write_or_copy_th':
    'Mantenha esta tela aberta enquanto escreve ou copie o texto antes de sair.',
  'fullAuth.report_issue.last_step': 'Última etapa',
  'fullAuth.report_issue.menta_could_not_open_your_photo_library_try_agai':
    'A Menta não conseguiu abrir sua biblioteca de fotos. Tente novamente.',
  'fullAuth.report_issue.menta_could_not_preserve_this_report_locally_kee':
    'A Menta não conseguiu preservar este relatório localmente. Mantenha esta tela aberta; nada foi entregue ao suporte.',
  'fullAuth.report_issue.menta_does_not_add_device_diagnostics_to_this_re':
    'A Menta não adiciona diagnósticos do dispositivo a este relatório.',
  'fullAuth.report_issue.menta_includes_the_item_or_screen_you_reported':
    'A Menta inclui o item ou tela que você relatou.',
  'fullAuth.report_issue.not_sent': 'não enviado',
  'fullAuth.report_issue.open': 'abrir',
  'fullAuth.report_issue.preparing_private_report_draft':
    'Preparando rascunho de relatório privado',
  'fullAuth.report_issue.proof_upload_gets_stuck':
    'O envio da comprovação trava',
  'fullAuth.report_issue.reference': 'Referência',
  'fullAuth.report_issue.remove': 'Remover',
  'fullAuth.report_issue.replace_screenshot': 'Substituir captura de tela',
  'fullAuth.report_issue.report_an_issue': 'Informar um problema',
  'fullAuth.report_issue.report_not_sent': 'Relatório não enviado',
  'fullAuth.report_issue.report_received': 'Relatório recebido',
  'fullAuth.report_issue.retry_sending_report':
    'Tente enviar novamente o relatório',
  'fullAuth.report_issue.return_to_support': 'Voltar ao suporte',
  'fullAuth.report_issue.review_feedback': 'Analisar comentários',
  'fullAuth.report_issue.review_report': 'Relatório de revisão',
  'fullAuth.report_issue.screenshot_did_not_open':
    'A captura de tela não abriu',
  'fullAuth.report_issue.screenshot_is_too_large':
    'A captura de tela é muito grande',
  'fullAuth.report_issue.screenshot_optional': 'Captura de tela (opcional)',
  'fullAuth.report_issue.selected_support_screenshot':
    'Captura de tela de suporte selecionada',
  'fullAuth.report_issue.server_confirmed': 'confirmado pelo servidor',
  'fullAuth.report_issue.share_feedback': 'Compartilhe comentários',
  'fullAuth.report_issue.short_title': 'Título curto',
  'fullAuth.report_issue.short_title_required': 'Título curto, obrigatório',
  'fullAuth.report_issue.sign_in_again_before_sending_this_private_report':
    'Faça login novamente antes de enviar este relatório privado. Nada foi enviado.',
  'fullAuth.report_issue.sign_in_required': 'É necessário fazer login',
  'fullAuth.report_issue.status': 'Status',
  'fullAuth.report_issue.steps_to_reproduce_optional':
    'Etapas para reproduzir, opcional',
  'fullAuth.report_issue.steps_to_reproduce_optional_2':
    'Etapas para reproduzir (opcional)',
  'fullAuth.report_issue.support_reference': 'Referência de suporte ·',
  'fullAuth.report_issue.this_comes_from_where_you_opened':
    '. Isso vem de onde você abriu',
  'fullAuth.report_issue.this_report_is_not_being_saved':
    'Este relatório não está sendo salvo',
  'fullAuth.report_issue.type': 'tipo:',
  'fullAuth.report_issue.we_ll_show_a_support_reference_only_after_the_re':
    'Mostraremos uma referência de suporte somente após a chegada do relatório. Se a primeira tentativa não estiver clara, Tentar novamente usa o mesmo relatório para não criar uma duplicata.',
  'fullAuth.report_issue.what_did_you_expect_menta_to_do':
    'O que você esperava que Menta fizesse?',
  'fullAuth.report_issue.what_happened': 'O que aconteceu',
  'fullAuth.report_issue.what_happened_required': 'O que aconteceu, necessário',
  'fullAuth.report_issue.what_i_would_change': 'O que eu mudaria',
  'fullAuth.report_issue.what_were_you_doing_and_what_did_menta_show':
    'O que você estava fazendo e o que Menta mostrou?',
  'fullAuth.report_issue.what_would_you_like_the_menta_team_to_know':
    'O que você gostaria que a equipe Menta soubesse?',
  'fullAuth.report_issue.will_help_support_find_the_error':
    'ajudará o suporte a encontrar o erro.',
  'fullAuth.report_issue.your_draft_stays_on_this_phone_until_you_send_it':
    'Seu rascunho permanece neste telefone até você enviá-lo.',
  'fullAuth.report_issue.your_feedback': 'Seus comentários',
  'fullAuth.report_issue.your_screenshot_will_be_sent_with_the_report_onl':
    'Sua captura de tela será enviada com o relatório. Somente a equipe de suporte autorizada pode abri-lo.',
  'fullAuth.settings.a_compatible_update_is_downloaded_and_ready':
    'Uma atualização compatível foi baixada e pronta.',
  'fullAuth.settings.account_control': 'Controle de conta',
  'fullAuth.settings.account_was_not_deleted': 'A conta não foi excluída',
  'fullAuth.settings.active_view_or_manage_your_subscription':
    'Ativo. Visualize ou gerencie sua assinatura.',
  'fullAuth.settings.ad_measurement': 'Medição de anúncios',
  'fullAuth.settings.ad_privacy_choices': 'Opções de privacidade de anúncios',
  'fullAuth.settings.ad_privacy_choices_did_not_open':
    'As opções de privacidade do anúncio não foram abertas',
  'fullAuth.settings.advanced_diagnostics': 'Diagnóstico avançado',
  'fullAuth.settings.advanced_diagnostics_are_off':
    'Os diagnósticos avançados estão desativados',
  'fullAuth.settings.advanced_diagnostics_are_on':
    'Os diagnósticos avançados estão ativados',
  'fullAuth.settings.advanced_diagnostics_are_still_off_check_your_co':
    'Os diagnósticos avançados ainda estão desativados. Verifique sua conexão e tente novamente.',
  'fullAuth.settings.ask_for_help_share_feedback_or_check_a_saved_rep':
    'Peça ajuda, compartilhe comentários ou verifique um relatório salvo.',
  'fullAuth.settings.back_to_you': 'De volta para você',
  'fullAuth.settings.before_you_delete_your_account':
    'Antes de excluir sua conta',
  'fullAuth.settings.check_for_updates': 'Verifique se há atualizações',
  'fullAuth.settings.check_your_connection_and_try_again':
    'Verifique sua conexão e tente novamente.',
  'fullAuth.settings.checking_for_updates': 'Verificando atualizações',
  'fullAuth.settings.checking_your_account': 'Verificando sua conta',
  'fullAuth.settings.checks_the_current_connection_and_known_account_':
    'Verifica novamente a conexão atual e os detalhes da conta conhecida.',
  'fullAuth.settings.close_and_reopen_menta_to_apply_the_downloaded_u':
    'Feche e reabra a Menta para aplicar a atualização baixada.',
  'fullAuth.settings.community_standards': 'Normas da Comunidade',
  'fullAuth.settings.confirmation': 'Confirmação',
  'fullAuth.settings.connect_before_deleting_your_account':
    'Conecte-se antes de excluir sua conta',
  'fullAuth.settings.connect_to_check_this_phone':
    'Conecte-se para verificar este telefone.',
  'fullAuth.settings.contact_support': 'Contate o suporte',
  'fullAuth.settings.continue_to_sign_in': 'Continuar a fazer login',
  'fullAuth.settings.could_not_check_your_account':
    'Não foi possível verificar sua conta',
  'fullAuth.settings.could_not_load_your_profile':
    'Não foi possível carregar seu perfil.',
  'fullAuth.settings.deletion_checking_body':
    'A Menta está verificando a propriedade dos grupos e o Menta Pro. Nada foi excluído.',
  'fullAuth.settings.deletion_check_unknown_body':
    'A Menta não conseguiu confirmar a propriedade dos grupos e o Menta Pro. Nada foi excluído.',
  'fullAuth.settings.deletion_check_offline_body':
    'Conecte-se e tente novamente. Nada foi excluído.',
  'fullAuth.settings.delete_shared_groups_first':
    'Exclua primeiro os grupos compartilhados',
  'fullAuth.settings.delete_shared_groups_first_body':
    'A Menta ainda não pode transferir a propriedade. Abra cada grupo abaixo e exclua-o antes de excluir sua conta.',
  'fullAuth.settings.delete_owned_group_member_one':
    '{count} outro membro. Exclua este grupo antes de excluir sua conta.',
  'fullAuth.settings.delete_owned_group_members_many':
    '{count} outros membros. Exclua este grupo antes de excluir sua conta.',
  'fullAuth.settings.deletion_group_clear':
    'Nenhum grupo de sua propriedade precisa de atenção.',
  'fullAuth.settings.deletion_group_will_be_deleted':
    'Será excluído com esta conta.',
  'fullAuth.settings.deletion_subscription_active_notice':
    'Excluir sua conta não cancela esta assinatura.',
  'fullAuth.settings.deletion_subscription_inactive':
    'Nenhum acesso ativo ao Menta Pro.',
  'fullAuth.settings.menta_pro_subscription': 'Assinatura do Menta Pro',
  'fullAuth.settings.delete_account': 'Excluir conta',
  'fullAuth.settings.delete_account_will_be_available_when_this_check':
    'Excluir conta estará disponível quando esta verificação terminar.',
  'fullAuth.settings.deletion_result_unknown':
    'Resultado de exclusão desconhecido',
  'fullAuth.settings.do_not_send_another_request_yet_check_whether_yo':
    'Não envie outra solicitação ainda. Verifique se você ainda consegue fazer login ou entre em contato com o suporte.',
  'fullAuth.settings.download_the_latest_compatible_menta_update':
    'Baixe a última atualização compatível da Menta.',
  'fullAuth.settings.extra_performance_measurements_start_now':
    'Medições extras de desempenho começam agora.',
  'fullAuth.settings.extra_performance_measurements_start_now_masked_':
    'Medições extras de desempenho começam agora. A gravação de diagnóstico mascarado começa nas telas elegíveis; reabra a Menta para aplicar todas as configurações de gravação do Sentry.',
  'fullAuth.settings.feedback_and_support': 'Comentários e suporte',
  'fullAuth.settings.for_your_privacy_account_settings_stay_hidden_un':
    'Para sua privacidade, as configurações da conta permanecem ocultas até você fazer login novamente.',
  'fullAuth.settings.help_and_feedback': 'Ajuda e comentários',
  'fullAuth.settings.how_menta_handles_your_data':
    'Como a Menta trata seus dados.',
  'fullAuth.settings.keep_current_setting': 'Manter a configuração atual',
  'fullAuth.settings.keep_my_account': 'Manter minha conta',
  'fullAuth.settings.label_did_not_open': '{label} não abriu',
  'fullAuth.settings.leave_a_review': 'Deixe uma avaliação',
  'fullAuth.settings.leave_this_device_your_menta_account_stays_activ':
    'Deixe este dispositivo. Sua conta Menta permanece ativa.',
  'fullAuth.settings.loading_account_specific_settings':
    'Carregando configurações específicas da conta',
  'fullAuth.settings.measure_whether_meta_ads_helped_someone_use_ment':
    'Avalie se os anúncios da Meta ajudaram alguém a usar a Menta.',
  'fullAuth.settings.membership': 'Assinatura',
  'fullAuth.settings.menta_cannot_check_whether_you_still_own_a_group':
    'A Menta não pode verificar se você ainda é dono de um grupo. Analise seus grupos antes de excluir a conta. Excluir a Menta não cancela o Menta Pro; gerencie a assinatura primeiro com a Apple.',
  'fullAuth.settings.menta_could_not_check_for_updates':
    'A Menta não conseguiu verificar atualizações',
  'fullAuth.settings.menta_could_not_delete_the_account_check_your_co':
    'A Menta não conseguiu excluir a conta. Verifique sua conexão e tente novamente.',
  'fullAuth.settings.menta_could_not_end_this_session_your_account_an':
    'A Menta não conseguiu encerrar esta sessão. Sua conta e visualização local permanecem inalteradas.',
  'fullAuth.settings.menta_could_not_restart':
    'A Menta não conseguiu reiniciar',
  'fullAuth.settings.menta_is_checking_for_the_latest_compatible_upda':
    'A Menta está verificando a atualização compatível mais recente.',
  'fullAuth.settings.menta_is_up_to_date': 'A Menta está atualizada',
  'fullAuth.settings.menta_pro': 'Menta Pro',
  'fullAuth.settings.menta_update_ready': 'Atualização da Menta pronta',
  'fullAuth.settings.menta_will_continue_using_its_current_safe_versi':
    'O Menta continuará usando sua versão segura atual.',
  'fullAuth.settings.needs_attention': 'Precisa de atenção',
  'fullAuth.settings.nothing_has_been_deleted': 'Nada foi excluído',
  'fullAuth.settings.nothing_was_deleted_reconnect_then_try_again':
    'Nada foi excluído. Reconecte e tente novamente.',
  'fullAuth.settings.notifications': 'Notificações',
  'fullAuth.settings.offline': 'Off-line',
  'fullAuth.settings.open_when_connected': 'Abra quando houver conexão.',
  'fullAuth.settings.opens_menta_pro_plans_purchase_restore_or_your_a':
    'Abre planos Menta Pro, compra de restauração ou seu plano ativo.',
  'fullAuth.settings.opens_sign_in_for_this_account':
    'Abre o login para esta conta.',
  'fullAuth.settings.optional_performance_measurements':
    'Medições de desempenho opcionais.',
  'fullAuth.settings.optional_performance_measurements_and_masked_dia':
    'Medições de desempenho opcionais e registro de diagnóstico mascarado.',
  'fullAuth.settings.ordinary_crash_reports_stay_on':
    'Os relatórios de falhas comuns permanecem ativados.',
  'fullAuth.settings.ordinary_crash_reports_stay_on_when_advanced_dia':
    'Os relatórios de falhas comuns permanecem ativados quando os diagnósticos avançados estão desativados.',
  'fullAuth.settings.other_settings_are_still_available_try_loading_t':
    'Outras configurações ainda estão disponíveis. Tente carregar o perfil novamente quando a conexão estiver pronta.',
  'fullAuth.settings.permanently_delete_your_account_and_menta_data':
    'Exclua permanentemente sua conta e os dados da Menta.',
  'fullAuth.settings.plans_benefits_and_restore_purchases':
    'Planos, benefícios e compras de restauração.',
  'fullAuth.settings.preferences': 'Preferências',
  'fullAuth.settings.press_restart_to_apply_the_downloaded_update':
    'Pressione Reiniciar para aplicar a atualização baixada.',
  'fullAuth.settings.privacy_and_legal': 'Privacidade e aspectos legais',
  'fullAuth.settings.privacy_policy': 'Política de Privacidade',
  'fullAuth.settings.profile_details': 'Detalhes do perfil',
  'fullAuth.settings.proof_reminders_reviews_and_group_updates':
    'Lembretes de comprovação, análises e atualizações de grupo.',
  'fullAuth.settings.read_menta_s_terms': 'Leia os termos da Menta.',
  'fullAuth.settings.reopen_menta_to_stop_diagnostic_recording_ordina':
    'Reabra a Menta para interromper a gravação do diagnóstico. Os relatórios de falhas comuns permanecem ativados.',
  'fullAuth.settings.restarting_menta': 'Reiniciando a Menta',
  'fullAuth.settings.review_choices_used_for_sponsor_videos':
    'Revise as opções usadas para vídeos de patrocinadores.',
  'fullAuth.settings.review_deletion_confirmation':
    'Revise a confirmação de exclusão',
  'fullAuth.settings.review_the_current_terms_and_when_you_accepted_t':
    'Revise os termos atuais e quando você os aceitou.',
  'fullAuth.settings.rules_for_promises_proof_and_groups':
    'Regras para promessas, comprovações e grupos.',
  'fullAuth.settings.session': 'Sessão',
  'fullAuth.settings.settings': 'Configurações',
  'fullAuth.settings.share_your_experience_and_help_others_discover_m':
    'Compartilhe sua experiência e ajude outras pessoas a descobrir Menta.',
  'fullAuth.settings.sign_in_again': 'Faça login novamente',
  'fullAuth.settings.sign_in_again_before_deleting_your_account':
    'Faça login novamente antes de excluir sua conta.',
  'fullAuth.settings.sign_in_again_to_see_settings':
    'Faça login novamente para ver as configurações.',
  'fullAuth.settings.sign_in_needed': 'É necessário fazer login',
  'fullAuth.settings.sign_out': 'sair',
  'fullAuth.settings.small_performance_impact': 'Pequeno impacto no desempenho',
  'fullAuth.settings.some_destinations_need_a_connection':
    'Alguns destinos precisam de uma conexão.',
  'fullAuth.settings.terms_of_use': 'Termos de uso',
  'fullAuth.settings.terms_you_accepted': 'Termos que você aceitou',
  'fullAuth.settings.the_downloaded_update_will_open_automatically':
    'A atualização baixada será aberta automaticamente.',
  'fullAuth.settings.the_next_screen_asks_you_to_type_delete_before_m':
    'A próxima tela pede que você digite DELETE antes que a Menta envie a solicitação.',
  'fullAuth.settings.this_can_use_a_small_amount_of_extra_processing_':
    'Isso pode consumir uma pequena quantidade extra de processamento, bateria e dados móveis enquanto a Menta está aberta. A gravação começa apenas em telas qualificadas. Reabra a Menta depois de desligá-la para interromper a gravação do Sentry.',
  'fullAuth.settings.this_device_has_the_latest_compatible_update':
    'Este dispositivo possui a atualização compatível mais recente.',
  'fullAuth.settings.to_confirm': 'confirmar',
  'fullAuth.settings.tries_to_load_the_signed_in_profile_again':
    'Tenta carregar o perfil conectado novamente.',
  'fullAuth.settings.try_again_in_a_moment_or_open_the_link_from_the_':
    'Tente novamente em alguns instantes ou abra o link na listagem da App Store.',
  'fullAuth.settings.try_again_later_optional_ads_stay_unavailable_un':
    'Tente novamente mais tarde. Os anúncios opcionais permanecem indisponíveis até que você analise essas opções.',
  'fullAuth.settings.try_connection_again': 'Tente conectar novamente',
  'fullAuth.settings.try_loading_profile_again':
    'Tente carregar o perfil novamente',
  'fullAuth.settings.try_loading_your_name_and_profile_photo_again':
    'Tente carregar seu nome e foto do perfil novamente.',
  'fullAuth.settings.try_the_account_check_again_before_you_delete_an':
    'Tente verificar a conta novamente antes de excluir qualquer coisa.',
  'fullAuth.settings.turn_off_advanced_diagnostics':
    'Desative o diagnóstico avançado',
  'fullAuth.settings.turn_on_advanced_diagnostics':
    'Ative o diagnóstico avançado',
  'fullAuth.settings.type': 'Tipo',
  'fullAuth.settings.type_delete_to_confirm_account_deletion':
    'Digite DELETE para confirmar a exclusão da conta',
  'fullAuth.settings.update_checks_are_unavailable':
    'As verificações de atualização não estão disponíveis',
  'fullAuth.settings.while_enabled_this_can_use_a_small_amount_of_ext':
    'Embora ativado, isso pode usar uma pequena quantidade extra de processamento, bateria e dados móveis enquanto a Menta estiver aberta.',
  'fullAuth.settings.you_are_still_signed_in': 'Você ainda está conectado',
  'fullAuth.settings.your_account_stays_open_until_menta_confirms_the':
    'Sua conta permanece aberta até que a Menta confirme a exclusão.',
  'fullAuth.settings.your_account_was_deleted': 'Sua conta foi excluída.',
  'fullAuth.settings.your_choice_was_not_saved': 'Sua escolha não foi salva',
  'fullAuth.settings.your_saved_settings_are_still_here':
    'Suas configurações salvas ainda estão aqui.',
  'fullAuth.settings.your_support_drafts_for_this_account_were_remove':
    'Seus rascunhos de suporte para esta conta foram removidos.',
  'fullAuth.support.change_menta_permissions_on_this_phone':
    'Alterar as permissões da Menta neste telefone',
  'fullAuth.support.check_app_and_connection':
    'Verifique o aplicativo e a conexão',
  'fullAuth.support.check_the_apple_account_used_for_the_original_pu':
    'Verifique a conta Apple usada para a compra original. Se a Apple mostrar uma cobrança, relate o problema antes de comprar novamente.',
  'fullAuth.support.checking_private_report_drafts':
    'Verificando rascunhos de relatórios privados',
  'fullAuth.support.checking_purchases': 'Verificando compras',
  'fullAuth.support.choose_what_you_need_you_can_review_everything_b':
    'Escolha o que você precisa. Você pode revisar tudo antes de enviar.',
  'fullAuth.support.connection_available': 'Conexão disponível',
  'fullAuth.support.connection_check_did_not_finish':
    'A verificação de conexão não foi concluída',
  'fullAuth.support.could_not_check_earlier_purchases':
    'Não foi possível verificar compras anteriores',
  'fullAuth.support.do_not_buy_it_again_while_this_check_continues':
    'Não compre novamente enquanto a verificação continuar.',
  'fullAuth.support.find_an_earlier_menta_pro_purchase':
    'Encontre uma compra anterior do Menta Pro',
  'fullAuth.support.hide_more_help': 'Ocultar mais ajuda',
  'fullAuth.support.looking_for_an_earlier_menta_pro_purchase':
    'Procurando uma compra anterior do Menta Pro',
  'fullAuth.support.menta_appears_offline': 'A Menta parece estar off-line',
  'fullAuth.support.menta_pro_is_active_again':
    'Menta Pro está ativo novamente',
  'fullAuth.support.menta_pro_is_still_being_checked':
    'Menta Pro ainda está sendo verificado',
  'fullAuth.support.more_help': 'Mais ajuda',
  'fullAuth.support.no_matching_purchase_was_found':
    'Nenhuma compra correspondente foi encontrada',
  'fullAuth.support.nothing_was_purchased_or_changed_check_the_conne':
    'Nada foi comprado ou alterado. Verifique a conexão e tente novamente.',
  'fullAuth.support.open_phone_settings': 'Abra as configurações do telefone',
  'fullAuth.support.opens_a_separate_support_report':
    'Abre um relatório de suporte separado.',
  'fullAuth.support.opens_sign_in_before_starting_a_private_report':
    'Abre o login antes de iniciar um relatório privado.',
  'fullAuth.support.other_help': 'Outra ajuda',
  'fullAuth.support.restore_purchases': 'Restaurar compras',
  'fullAuth.support.saved_on_this_phone_and_still_waiting_to_be_sent':
    'salvo neste telefone e ainda aguardando envio.',
  'fullAuth.support.saved_reports': 'Relatórios salvos',
  'fullAuth.support.see_app_version_connection_and_saved_proof':
    'Ver versão do app, conexão e comprovação salva',
  'fullAuth.support.share_feedback': 'Compartilhe comentários',
  'fullAuth.support.sign_in_required': 'É necessário fazer login',
  'fullAuth.support.sign_in_to_report_an_issue':
    'Faça login para relatar um problema',
  'fullAuth.support.support': 'Suporte',
  'fullAuth.support.support_drafts_stay_private_to_the_account_that_':
    'Os rascunhos de suporte permanecem privados da conta que os criou. Faça login antes de iniciar um novo relatório.',
  'fullAuth.support.this_does_not_start_a_new_purchase_or_charge_thi':
    'Isso não inicia uma nova compra nem cobra esta conta.',
  'fullAuth.support.version_appversion_savedcopy_nothing_changed_try':
    'Versão {appVersion}. {savedCopy} Nada mudou. Tente verificar novamente quando sua conexão melhorar.',
  'fullAuth.support.version_appversion_savedcopy_saved_proof_stays_o':
    'Versão {appVersion}. {savedCopy} A comprovação salva permanece neste celular até que a Menta confirme o envio.',
  'fullAuth.support.your_earlier_purchase_is_active_on_this_account':
    'Sua compra anterior está ativa nesta conta.',
  'fullAuth.system_settings.back_to_support': 'Voltar ao suporte',
  'fullAuth.system_settings.change_notification_camera_photo_or_ad_measureme':
    'Altere as permissões de notificação, câmera, foto ou medição de anúncios nas configurações do seu celular. A Menta não pode alterá-las ou confirmá-las nesta tela.',
  'fullAuth.system_settings.nothing_changed_in_menta_open_your_phone_setting':
    'Nada mudou em Menta. Abra as configurações do seu telefone manualmente e retorne ao aplicativo.',
  'fullAuth.system_settings.open_phone_settings':
    'Abra as configurações do telefone',
  'fullAuth.system_settings.opening_phone_settings_does_not_confirm_that_a_p':
    'Abrir as configurações do telefone não confirma que uma permissão foi alterada.',
  'fullAuth.system_settings.phone_settings': 'Configurações do telefone',
  'fullAuth.system_settings.phone_settings_could_not_open':
    'As configurações do telefone não puderam ser abertas',
  'fullAuth.system_settings.return_when_you_re_done': 'Volte quando terminar',
  'fullAuth.tabs_profile.active_and_past_promises':
    'Promessas ativas e passadas',
  'fullAuth.tabs_profile.active_promises': 'Promessas ativas',
  'fullAuth.tabs_profile.activepromisecount_active_promises_currentstreak':
    '{activePromiseCount} promessas ativas, sequência atual de {currentStreak} dias, {length} grupos',
  'fullAuth.tabs_profile.change_profile_photo': 'Alterar foto do perfil',
  'fullAuth.tabs_profile.choose_one_thing_to_follow_through_on_it_will_ap':
    'Escolha uma coisa para cumprir. Ela aparecerá em Hoje com a comprovação que você escolher.',
  'fullAuth.tabs_profile.create_a_promise': 'Crie uma promessa',
  'fullAuth.tabs_profile.current_reward_terms_and_your_link':
    'Termos atuais de recompensa e seu link',
  'fullAuth.tabs_profile.day_streak': 'Sequência do dia',
  'fullAuth.tabs_profile.edit_profile': 'Editar perfil',
  'fullAuth.tabs_profile.for_your_privacy_menta_hides_the_previous_accoun':
    'Para sua privacidade, a Menta oculta a conta anterior quando a sessão termina.',
  'fullAuth.tabs_profile.groups': 'Grupos',
  'fullAuth.tabs_profile.invite': 'convidar',
  'fullAuth.tabs_profile.invite_friends': 'Convide amigos',
  'fullAuth.tabs_profile.loading_your_profile': 'Carregando seu perfil',
  'fullAuth.tabs_profile.make_your_first_promise': 'Faça sua primeira promessa',
  'fullAuth.tabs_profile.menta_kept_the_last_details_saved_for_this_accou':
    'A Menta manteve os últimos detalhes salvos desta conta. Você ainda pode editar seu perfil e usar outras ações de perfil.',
  'fullAuth.tabs_profile.momenta': 'Momenta',
  'fullAuth.tabs_profile.no_promises_yet': 'Ainda não há promessas',
  'fullAuth.tabs_profile.open_saved_type_invite': 'Abrir convite {type} salvo',
  'fullAuth.tabs_profile.open_the_invite_to_review_it_before_joining':
    'Abra o convite para revisá-lo antes de entrar.',
  'fullAuth.tabs_profile.opens_your_invite_link_and_the_current_reward_te':
    'Abre o link do convite e os termos atuais da recompensa.',
  'fullAuth.tabs_profile.personal_promises': 'Promessas pessoais',
  'fullAuth.tabs_profile.profile_details_may_be_out_of_date':
    'Os detalhes do perfil podem estar desatualizados',
  'fullAuth.tabs_profile.progress_and_rewards': 'Progresso e recompensas',
  'fullAuth.tabs_profile.progress_starts_with_proof':
    'O progresso começa com uma comprovação',
  'fullAuth.tabs_profile.saved': 'Salvo',
  'fullAuth.tabs_profile.sign_in_again': 'Faça login novamente',
  'fullAuth.tabs_profile.sign_in_to_see_you': 'Faça login para ver você',
  'fullAuth.tabs_profile.streaks_and_progress_appear_after_you_send_proof':
    'As sequências e o progresso aparecem depois que você envia a comprovação de uma promessa ativa.',
  'fullAuth.tabs_profile.the_last_saved_promise_and_group_counts_are_stil':
    'A última promessa salva e as contagens de grupos ainda são mostradas. Outras ações de perfil permanecem disponíveis.',
  'fullAuth.tabs_profile.wallet_shop_and_items': 'Carteira, loja e itens',
  'fullAuth.tabs_profile.you': 'Você',
  'fullAuth.tabs_profile.your_progress_may_be_out_of_date':
    'Seu progresso pode estar desatualizado',
  'fullAuth.tabs_profile.your_rhythm': 'Seu ritmo',
} as const satisfies Pick<EnglishCatalogue, FullAuthAccountKey>;
