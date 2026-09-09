import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type FullAuthAccountKey = Extract<keyof EnglishCatalogue, `fullAuth.${string}`>;

export const fullAuthAccountFrCA = {
  'fullAuth.shared.try_again': 'Réessayez',
  'fullAuth.support.untitled_report': 'rapport sans titre',
  'fullAuth.onboarding.promise_setup_step_one':
    'Configuration du promesse · 1 sur 2',
  'fullAuth.onboarding.promise_setup_step_two':
    'Configuration du promesse · 2 sur 2',
  'fullAuth.component_onboarding_paperauthreset.your_account_email':
    'votre adresse courriel de compte',
  'fullAuth.shared.back_to_you': 'Retour à vous',
  'fullAuth.shared.promise': 'Promesse',
  'fullAuth.shared.terms': 'Conditions d’utilisation',
  'fullAuth.shared.back_to_settings': 'Retour aux paramètres',
  'fullAuth.shared.other_sign_in_options': "Autres options d'authentification",
  'fullAuth.shared.retry_profile': 'Essayez de renseigner le profil',
  'fullAuth.shared.refresh_progress': 'Rafraîchir la progression',
  'fullAuth.shared.check_connection_again':
    'Assurez-vous que vous avez une connexion',
  'fullAuth.shared.sign_in': 'Se connecter',
  'fullAuth.support.feedback': 'Commentaires',
  'fullAuth.support.promise_report': 'Rapport promesse',
  'fullAuth.support.group_report': 'Rapport groupee',
  'fullAuth.support.proof_report': 'Rapport démonstration',
  'fullAuth.support.app_issue': "Problème de l'application",
  'fullAuth.support.checking_saved_proof':
    'Rapport des détails sauvegardés sur ce téléphone.',
  'fullAuth.support.saved_proof_count_unavailable':
    "Nombre d'individus non disponibles.",
  'fullAuth.support.no_proof_waiting':
    'Aucun rapport à traiter sur ce téléphone.',
  'fullAuth.support.proof_count_saved':
    '{count} {proofLabel} enregistrés sur ce téléphone.',
  'fullAuth.support.proof_is': 'la preuve est',
  'fullAuth.support.proofs_are': 'les preuves sont',
  'fullAuth.support.saved_proof_waiting_to_be_sent':
    '{count} {proofLabel} enregistrés sur ce téléphone et toujours en attente d’envoi.',
  'fullAuth.email_auth.create_account': 'Créer un compte',
  'fullAuth.email_auth.sign_in': 'Se connecter',
  'fullAuth.email_auth.already_have_account': "J'ai déjà un compte ?",
  'fullAuth.email_auth.new_to_menta': 'Je suis nouveau sur Menta?',
  'fullAuth.email_auth.offline_reconnect':
    'Vous êtes hors ligne. Reconnectez-vous et réessayez.',
  'fullAuth.email_auth.too_many_attempts':
    'De nombreux essais. Attendez une seconde, puis réessayez.',
  'fullAuth.email_auth.could_not_sign_in':
    'Impossible de vous authentifier. Vérifiez votre connexion, puis réessayez.',
  'fullAuth.email_auth.could_not_create_account':
    'Impossible de créer votre compte. Vérifiez votre connexion, puis réessayez.',
  'fullAuth.email_auth.enter_password': 'Entrez votre mot de passe.',
  'fullAuth.email_auth.create_password': 'Créer un mot de passe.',
  'fullAuth.email_auth.confirm_your_password': 'Confirmez votre mot de passe.',
  'fullAuth.email_auth.password_minimum':
    'Utilisez au moins {length} caractères.',
  'fullAuth.email_auth.password_mismatch':
    'Les mots de passe ne correspondent pas.',
  'fullAuth.email_auth.choose_username': 'Choisissez un nom d’utilisateur.',
  'fullAuth.email_auth.minimum_three_characters':
    'Utilisez au moins 3 caractères.',
  'fullAuth.email_auth.username_characters_only':
    'Utilisez uniquement des lettres, des nombres ou des underscores.',
  'fullAuth.email_auth.account_email':
    'Entrez le courriel de votre compte Menta.',
  'fullAuth.email_auth.valid_email': 'Entrez une adresse courriel valide.',
  'fullAuth.email_auth.passwords_need_to_match':
    'Les mots de passe doivent correspondre.',
  'fullAuth.password_recovery.confirm_new_password':
    'Confirmez votre nouveau mot de passe.',
  'fullAuth.password_recovery.passwords_mismatch':
    'Les mots de passe ne correspondent pas.',
  'fullAuth.password_recovery.minimum_password_length':
    'Utilisez au moins {length} caractères.',
  'fullAuth.password_recovery.could_not_change_now':
    'Nous ne pouvons pas changer votre mot de passe à ce jour.',
  'fullAuth.password_recovery.sign_in_with_new_password_draft':
    'Connectez-vous avec votre nouveau mot de passe, puis revenez à votre brouillon.',
  'fullAuth.password_recovery.sign_in_with_new_password':
    'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
  'fullAuth.language_settings.system_accessibility':
    'Utilisez le langage du téléphone. {systemSubtitle}',
  'fullAuth.forgot_password.enter_email_tied_to_account':
    'Entrez le courriel lié à votre compte Menta.',
  'fullAuth.forgot_password.enter_valid_email': 'Entrez un courriel valide.',
  'fullAuth.forgot_password.could_not_send_reset_email':
    'Nous ne pouvons pas envoyer le courriel de réinitialisation. Vérifiez votre connexion et réessayez.',
  'fullAuth.password_recovery_callback.checking_secure_reset_link':
    'Vérifiant votre lien sécurisé de réinitialisation…',
  'fullAuth.password_recovery_callback.reset_link_verified':
    'Lien de réinitialisation vérifié.',
  'fullAuth.report_issue.send_feedback': 'Envoyer une commentaires.',
  'fullAuth.report_issue.send_report': 'Envoyer un rapport.',
  'fullAuth.support.start_a_new_report': 'Commencer un nouveau rapport',
  'fullAuth.support.report_an_issue': 'Signaler un problème',
  'fullAuth.notification_settings.daily_proof_reminders_and_promise_ending_updates':
    'Alertes de vérification des promesses et des informations à venir',
  'fullAuth.notification_settings.saved_but_notifications_are_off_on_this_phone':
    'Préservé, mais les notifications sont désactivées sur ce téléphone.',
  'fullAuth.notification_settings.occasional_updates_to_email_unsubscribe_here':
    'Mises à jour occasionnelles à {email}. Désabonnez-vous ici quand vous le souhaitez.',
  'fullAuth.notification_settings.a_confirmed_account_email_is_required':
    'Un courriel de confirmation de compte est nécessaire.',
  'fullAuth.onboarding.menta_mascot_holding_your_first_promise':
    'Mascotte de Menta tenant votre premier promesse',
  'fullAuth.onboarding.menta_mascot_waving_hello':
    'Mascotte de Menta saluant le bonjour',
  'fullAuth.onboarding.your_saved_draft_is_back_on_this_phone':
    'Votre draft de votre sauvegarde est de retour sur ce téléphone.',
  'fullAuth.onboarding.saved_privately_on_this_phone_as_you_type':
    'Préservé en tant que vous écrivez sur ce téléphone.',
  'fullAuth.account_deleted.apple_instructions_did_not_open':
    "Les instructions d'Apple ne sont pas ouvertes.",
  'fullAuth.account_deleted.checking_account_deletion':
    'Vérifiant la suppression de compte',
  'fullAuth.account_deleted.go_to_sign_in': 'Ouvrir la connexion',
  'fullAuth.account_deleted.if_you_used_sign_in_with_apple_remove_menta_from':
    'Si vous avez utilisé la connexion avec Apple, retirez Menta des applications connectées à votre compte Apple. Ouvrez les paramètres, touchez votre nom, puis Connexion avec Apple.',
  'fullAuth.account_deleted.open_apple_support_and_search_for_manage_your_ap':
    "Ouvrez Apple Soutien et cherchez pour 'Gérer vos applications avec Sign in with Apple'.",
  'fullAuth.account_deleted.remove_apple_access': "Supprimer l'accès d'Apple",
  'fullAuth.account_deleted.see_apple_instructions':
    "Voir les instructions d'Apple",
  'fullAuth.account_deleted.sign_in_with_apple_access_was_also_removed':
    "Suppression d'accès à Apple a été également supprimée.",
  'fullAuth.account_deleted.your_account_was_deleted':
    'Votre compte a été supprimé',
  'fullAuth.account_deleted.your_menta_account_and_its_data_were_deleted_men':
    'Votre compte Menta et son données ont été supprimés. Menta aussi effacé cette sauvegarde de compte de données de ce téléphone.',
  'fullAuth.auth_required.events': 'Événements',
  'fullAuth.auth_required.groups': 'Groupees',
  'fullAuth.auth_required.keep_browsing': 'Passer en arrière',
  'fullAuth.auth_required.menta': 'Menta',
  'fullAuth.auth_required.menta_records_the_review_under_your_account':
    'Menta enregistre la révision à partir de votre compte.',
  'fullAuth.auth_required.menta_saves_this_proof_with_the_right_promise_an':
    'Menta enregistre cette preuve avec la promesse juste et le compte.',
  'fullAuth.auth_required.momenta': 'Momenta',
  'fullAuth.auth_required.proof': 'Preuve',
  'fullAuth.auth_required.reviews': 'Rapports',
  'fullAuth.auth_required.sign_in': "S'identifier",
  'fullAuth.auth_required.sign_in_to_add_proof':
    "S'identifier pour ajouter la preuve",
  'fullAuth.auth_required.sign_in_to_complete_this_action_and_return_here_':
    "S'identifier pour compléter cette action et revenir ici après.",
  'fullAuth.auth_required.sign_in_to_continue': "S'identifier pour continuer",
  'fullAuth.auth_required.sign_in_to_continue_with_this_event':
    "S'identifier pour continuer avec cette événement",
  'fullAuth.auth_required.sign_in_to_join_this_group':
    "S'identifier pour rejoindre ce groupee",
  'fullAuth.auth_required.sign_in_to_review_proof':
    "S'identifier pour réviser preuve",
  'fullAuth.auth_required.sign_in_to_use_momenta':
    "S'identifier pour utiliser Momenta",
  'fullAuth.auth_required.your_balance_purchases_and_items_stay_with_your_':
    'Votre solde, les achats et les objets restent avec votre compte.',
  'fullAuth.auth_required.your_invitation_and_group_activity_stay_with_you':
    'Votre invitation et les activités du groupee restent avec votre compte.',
  'fullAuth.auth_required.your_place_check_in_and_event_photos_are_saved_t':
    "Votre place, les photos d'enregistrement et les événements sont conservées à partir de votre compte.",
  'fullAuth.auth_required.your_promises_proof_groups_and_reviews_stay_with':
    'Votre promesse, les preuves, les groupees et les rapports restent avec votre compte Menta.',
  'fullAuth.component_onboarding_mentasurface.hide_password':
    'Masquer la mot de passe',
  'fullAuth.component_onboarding_mentasurface.menta': 'Menta',
  'fullAuth.component_onboarding_mentasurface.setup': 'Configuration',
  'fullAuth.component_onboarding_mentasurface.show_password':
    'Afficher le mot de passe',
  'fullAuth.component_onboarding_paperauthform.after_this': 'Après cela',
  'fullAuth.component_onboarding_paperauthform.characters': '+ Caractères',
  'fullAuth.component_onboarding_paperauthform.check_the_details':
    'Vérifier les détailss',
  'fullAuth.component_onboarding_paperauthform.confirm_password':
    'Confirmer le mot de passe',
  'fullAuth.component_onboarding_paperauthform.create_your_account':
    'Créer votre compte',
  'fullAuth.component_onboarding_paperauthform.creating_your_account':
    'Création de votre compte',
  'fullAuth.component_onboarding_paperauthform.daniel': 'Daniel',
  'fullAuth.component_onboarding_paperauthform.email': 'Courriel',
  'fullAuth.component_onboarding_paperauthform.forgot_your_password':
    'Échapper votre mot de passe ?',
  'fullAuth.component_onboarding_paperauthform.password': 'Mot de passe',
  'fullAuth.component_onboarding_paperauthform.sign_in_with_email':
    "S'identifier avec courriel",
  'fullAuth.component_onboarding_paperauthform.signing_you_in':
    'Vous identifiez',
  'fullAuth.component_onboarding_paperauthform.username': "Nom d'utilisateur",
  'fullAuth.component_onboarding_paperauthform.you_example_com':
    'vous@example.com',
  'fullAuth.component_onboarding_paperauthform.you_will_return_to_your_first_promise':
    'Vous revenez vers votre première promesse.',
  'fullAuth.component_onboarding_paperauthform.your_promise_stays_on_this_phone_until_the_accou':
    "Votre promesse restent sur ce téléphone jusqu'à ce que le compte soit prêt.",
  'fullAuth.component_onboarding_paperauthform.your_promise_stays_on_this_phone_while_we_create':
    "Votre promesse restera sur ce téléphone jusqu'à la création de l'account.",
  'fullAuth.component_onboarding_paperauthform.your_promise_stays_on_this_phone_while_you_sign_':
    "Votre promesse restera sur ce téléphone jusqu'à la saisie.",
  'fullAuth.component_onboarding_paperauthmethods.choose_how_to_sign_in_your_promise_stays_on_this':
    "Choisissez comment vous allez vous connecter. Votre promesse restera sur ce téléphone jusqu'à la fin de la connexion.",
  'fullAuth.component_onboarding_paperauthmethods.choose_how_you_want_to_sign_in':
    'Choisissez comment vous allez vous connecter.',
  'fullAuth.component_onboarding_paperauthmethods.continue_with_apple':
    'Continuer avec Apple',
  'fullAuth.component_onboarding_paperauthmethods.continue_with_email':
    'Continuer avec courriel',
  'fullAuth.component_onboarding_paperauthmethods.continue_with_google':
    'Continuer avec Google',
  'fullAuth.component_onboarding_paperauthmethods.save_your_promise':
    'Enregistrer votre promesse',
  'fullAuth.component_onboarding_paperauthmethods.see_how_menta_works':
    'Voir comment Menta fonctionne',
  'fullAuth.component_onboarding_paperauthmethods.sign_in_to_menta':
    "Sesurer d'accéder à Menta",
  'fullAuth.component_onboarding_paperauthmethods.we_could_not_sign_you_in':
    'Nous ne pouvons pas vous connecter',
  'fullAuth.component_onboarding_paperauthreset.back_to_sign_in':
    'Retour à la connexion',
  'fullAuth.component_onboarding_paperauthreset.check_your_email':
    'Vérifiez votre courriel.',
  'fullAuth.component_onboarding_paperauthreset.daniel_example_com':
    'daniel@example.com',
  'fullAuth.component_onboarding_paperauthreset.email': 'Email',
  'fullAuth.component_onboarding_paperauthreset.email_sent_to':
    'Email envoyé à',
  'fullAuth.component_onboarding_paperauthreset.link_valid_for_60_minutes':
    'Les informations restent valides pendant 60 minutes',
  'fullAuth.component_onboarding_paperauthreset.reset_for':
    'Réinitialiser pour',
  'fullAuth.component_onboarding_paperauthreset.reset_your_password':
    'Réinitialiser votre mot de passe',
  'fullAuth.component_onboarding_paperauthreset.send_another_link':
    'Envoyer une nouvelle branche',
  'fullAuth.component_onboarding_paperauthreset.send_another_link_in_countdown':
    'Envoyer une nouvelle branche après {countdown}',
  'fullAuth.component_onboarding_paperauthreset.send_reset_link':
    'Envoyer un nouveau lien',
  'fullAuth.component_onboarding_paperauthreset.sending_your_reset_link':
    'Envoi de votre nouveau lien',
  'fullAuth.component_onboarding_paperauthreset.use_the_latest_link':
    'Utilisez le dernier lien.',
  'fullAuth.component_onboarding_paperauthreset.use_the_link_we_just_sent_you_can_request_anothe':
    'Utilisez le lien que nous avons envoyé. Vous pouvez demander une autre fois que le compteur expire.',
  'fullAuth.component_onboarding_paperauthreset.we_could_not_send_another_link':
    'Nous ne pouvons pas envoyer une nouvelle branche',
  'fullAuth.component_onboarding_paperauthreset.we_could_not_send_the_reset_link':
    'Nous ne pouvons pas envoyer le lien de réinitialisation',
  'fullAuth.component_onboarding_paperauthreset.we_ll_email_you_a_secure_link_your_saved_promise':
    "Nous allons envoyer un lien sécurisé à l'adresse suivante. Votre promesse restera sur ce téléphone.",
  'fullAuth.component_onboarding_paperauthreset.we_re_sending_a_secure_link_to_the_address_below':
    "Nous envoyons un lien sécurisé à l'adresse ci-dessous.",
  'fullAuth.component_onboarding_paperauthreset.we_sent_a_secure_reset_link_your_saved_promise_i':
    'Nous avons envoyé un lien sécurisé de réinitialisation. Votre promesse restera ici.',
  'fullAuth.component_onboarding_paperauthsurface.before_you_use_the_account_you_ll_review_and_acc':
    "Avant d'utiliser l'account, vous allez examiner et accepter les documents d'account et de communauté de Menta.",
  'fullAuth.component_onboarding_paperauthsurface.choose_sign_in_method':
    'Choisissez la méthode de connexion',
  'fullAuth.component_onboarding_paperauthsurface.community_standards':
    'Politique de communauté',
  'fullAuth.component_onboarding_paperauthsurface.community_standards_did_not_open':
    "La politique de communauté n'a pas ouvert",
  'fullAuth.component_onboarding_paperauthsurface.hide_password':
    'Masquer le mot de passe',
  'fullAuth.component_onboarding_paperauthsurface.keep_local_draft':
    'Maintenir une branche locale',
  'fullAuth.component_onboarding_paperauthsurface.menta': 'Menta',
  'fullAuth.component_onboarding_paperauthsurface.menta_authentication':
    'Authentification à Menta',
  'fullAuth.component_onboarding_paperauthsurface.menta_mascot':
    'Le personnage de Menta',
  'fullAuth.component_onboarding_paperauthsurface.privacy_policy':
    'Politique de confidentialité',
  'fullAuth.component_onboarding_paperauthsurface.privacy_policy_did_not_open':
    "Politique de confidentialité n'a pas ouvert",
  'fullAuth.component_onboarding_paperauthsurface.returning_to': 'Retour à',
  'fullAuth.component_onboarding_paperauthsurface.show_password':
    'Veuillez afficher le mot de passe',
  'fullAuth.component_onboarding_paperauthsurface.terms_did_not_open':
    "Conditions d'utilisation n'ont pas ouvert",
  'fullAuth.component_onboarding_paperauthsurface.terms_of_use':
    "Conditions d'utilisation",
  'fullAuth.component_onboarding_paperauthsurface.the_provider_sheet_was_closed_before_an_account_':
    'La fenêtre du fournisseur a été fermée avant la création du compte. Réessayez ou choisissez une autre méthode.',
  'fullAuth.component_onboarding_paperauthsurface.title_message':
    '{title} {message}',
  'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_community_standar':
    'Réessayez, ouvissez Menta.quest/community-standards dans votre navigateur.',
  'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_privacy_in_your_b':
    'Réessayez, ouvissez Menta.quest/terms dans votre navigateur.',
  'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_terms_in_your_bro':
    'Réessayez, ouvissez Menta.quest/terms dans votre navigateur.',
  'fullAuth.component_onboarding_paperauthsurface.you_can_try_again_or_keep_working_without_signin':
    "Vous pouvez essayer à nouveau, ouvissez Menta.quest/terms dans votre navigateur jusqu'à ce que Menta soit besoin de sauvegarder.",
  'fullAuth.component_onboarding_paperauthsurface.you_re_still_signed_out':
    'Vous êtes toujours déconnecté.',
  'fullAuth.component_onboarding_paperauthsurface.your_local_promise_is_still_here':
    'Votre promesse locale est toujours ici',
  'fullAuth.component_settings_settingssignoutsheet.cancel': 'Annuler',
  'fullAuth.component_settings_settingssignoutsheet.check_the_connection_then_try_again':
    'Veuillez vérifier le connexions, puis réessayez.',
  'fullAuth.component_settings_settingssignoutsheet.sign_out': 'Déconnecter',
  'fullAuth.component_settings_settingssignoutsheet.sign_out_did_not_finish':
    "Déconnexion n'a pas été terminé",
  'fullAuth.component_settings_settingssignoutsheet.try_sign_out_again':
    'Essayez de déconnecter à nouveau',
  'fullAuth.component_support_offlinesupportnotice.you_can_still_read_the_last_saved_screen_proof_a':
    "Vous pouvez lire la dernière fenêtre sauvegardée. Les preuves et les éditions de la boîte de dialogue restent sur votre téléphone jusqu'à ce que vous re-connectez Menta.",
  'fullAuth.component_support_offlinesupportnotice.you_re_offline':
    'Vous êtes hors de connectivité',
  'fullAuth.component_support_supportsurface.title_subtitle':
    '{title} {subtitle}',
  'fullAuth.component_support_supportsurface.title_subtitle_detail':
    '{title} {subtitle} {detail}',
  'fullAuth.edit_profile.account_required': 'Account nécessaires',
  'fullAuth.edit_profile.back_to_you': 'Retour à Vous',
  'fullAuth.edit_profile.cannot_edit_here': 'Vous ne pouvez pas modifier ici',
  'fullAuth.edit_profile.change_photo': 'Changer photo',
  'fullAuth.edit_profile.choose_a_different_photo':
    'Choisissez une photo différente.',
  'fullAuth.edit_profile.choose_a_profile_photo': 'Choisissez un profil photo',
  'fullAuth.edit_profile.details': 'Détails',
  'fullAuth.edit_profile.display_name': "Nom d'utilisateur",
  'fullAuth.edit_profile.edit_again': 'Éditer à nouveau',
  'fullAuth.edit_profile.edit_profile': 'Modifier votre profil',
  'fullAuth.edit_profile.email': 'Courriel',
  'fullAuth.edit_profile.how_it_will_look_on_you':
    'Comment cela va paraître sur Vous',
  'fullAuth.edit_profile.loading_your_profile': 'Affichage de votre profil',
  'fullAuth.edit_profile.name': 'Nom',
  'fullAuth.edit_profile.no_changes_have_been_made_try_loading_your_accou':
    "Aucun changement n'a été fait. Essayez de sauvegarder votre compte à nouveau.",
  'fullAuth.edit_profile.no_photo_selected': 'Aucune photo a été sélectionnée',
  'fullAuth.edit_profile.nothing_changes_until_you_choose_one':
    "Aucune modification jusqu'à ce que vous choisissez une photo.",
  'fullAuth.edit_profile.photo_not_changed_photoerror':
    'Photo non modifiée. {photoError}',
  'fullAuth.edit_profile.photo_visibility': 'Véracité de la photo',
  'fullAuth.edit_profile.photo_will_be_removed': 'La photo sera supprimée',
  'fullAuth.edit_profile.profile_unavailable': "Le profil n'est pas disponible",
  'fullAuth.edit_profile.profile_updated': 'Le profil a été mis à jour',
  'fullAuth.edit_profile.remove_photo': 'Supprimer la photo',
  'fullAuth.edit_profile.save_changes': 'Enregistrer les modifications',
  'fullAuth.edit_profile.saving_changes': 'Enregistrer les modifications',
  'fullAuth.edit_profile.saving_your_changes': 'Enregistrer vos modifications',
  'fullAuth.edit_profile.selected_not_saved':
    'Sélectionné, mais non enregistré',
  'fullAuth.edit_profile.selected_profile_photo_in_its_final_circular_cro':
    'Aperçu de la photo de profil dans son cadrage circulaire final',
  'fullAuth.edit_profile.sign_in_again': 'Réauthentifier avec vous',
  'fullAuth.edit_profile.sign_in_again_before_editing_this_profile':
    'Réauthentifier avec vous avant de modifier ce profil',
  'fullAuth.edit_profile.this_is_how_the_photo_will_look_on_you_it_will_n':
    "C'est comment la photo va ressembler sur Vous. Elle ne changera pas jusqu'à ce qu'elle soit enregistrée.",
  'fullAuth.edit_profile.try_again': 'Essayez de nouveau',
  'fullAuth.edit_profile.try_saving_again': "Essayez d'enregistrer de nouveau",
  'fullAuth.edit_profile.username': "Nom d'utilisateur",
  'fullAuth.edit_profile.usernames_can_t_be_changed_yet':
    'Les noms de lutilisateur ne peuvent pas être modifiés encore.',
  'fullAuth.edit_profile.value': '@{value}',
  'fullAuth.edit_profile.you_can_keep_reviewing_the_preview_while_menta_s':
    'Vous pouvez continuer à révisioner le prévision pendant que Menta enregistre.',
  'fullAuth.edit_profile.you_cannot_change_your_sign_in_email_here':
    "Vous ne pouvez pas modifier votre adresse courriel d'identification ici.",
  'fullAuth.edit_profile.your_current_photo_stays_until_you_save_changes':
    "Votre photo actuelle reste jusqu'à ce que vous enregistrez les modifications.",
  'fullAuth.edit_profile.your_details_will_appear_when_this_check_finishe':
    'Les détails seront affichés lorsque ce test est terminé.',
  'fullAuth.edit_profile.your_edits_are_still_here':
    'Les modifications resteront ici',
  'fullAuth.edit_profile.your_profile_has_not_changed':
    "Votre profil n'a pas changé.",
  'fullAuth.edit_profile.your_profile_has_not_changed_try_saving_again':
    "Votre profil n'a pas changé. Essayez d'enregistrer de nouveau.",
  'fullAuth.edit_profile.your_saved_name_and_photo_now_appear_across_ment':
    'Votre nom et photo actuel maintenant apparaissent à travers Menta.',
  'fullAuth.email_auth.confirm_password': 'Confirmer le mot de passe',
  'fullAuth.email_auth.couldn_t_create_account':
    'Impossible de créer un compte',
  'fullAuth.email_auth.couldn_t_sign_you_in':
    "Impossible d'authentifier avec Vous",
  'fullAuth.email_auth.create_an_account_to_save_this_promise_to_menta':
    'Créez un compte pour enregistrer cette promesse à votre compte Menta.',
  'fullAuth.email_auth.create_your_account': 'Créez votre compte',
  'fullAuth.email_auth.daniel': 'daniel',
  'fullAuth.email_auth.email': 'Courriel',
  'fullAuth.email_auth.forgot_your_password': "Hasn't forgotten your password?",
  'fullAuth.email_auth.menta': 'Menta',
  'fullAuth.email_auth.other_people_may_see_this_with_your_group_activi':
    'Des personnes peuvent voir ce avec votre photo de groupee et événement.',
  'fullAuth.email_auth.password': 'Mot de passe',
  'fullAuth.email_auth.sign_in_to_save_this_promise_to_your_menta_accou':
    'Authentifier avec votre compte pour enregistrer cette promesse à votre compte Menta.',
  'fullAuth.email_auth.sign_in_with_email': 'Authentifier avec votre courriel',
  'fullAuth.email_auth.use_6_or_more_characters':
    'Utilisez de 6 à 12 caractères.',
  'fullAuth.email_auth.use_an_email_you_can_access_if_you_ever_need_to_':
    'Utilisez un courriel que vous pouvez accéder si jamais vous avez besoin de rétablir votre compte.',
  'fullAuth.email_auth.username': "nom d'utilisateur",
  'fullAuth.email_auth.you_example_com': 'vous @example.com',
  'fullAuth.legal_acceptance.agree_and_continue': 'accéder',
  'fullAuth.legal_acceptance.back': "retour à l'accueil",
  'fullAuth.legal_acceptance.before_you': 'avant vous',
  'fullAuth.legal_acceptance.checking_the_current_legal_documents':
    'Verifions les actuelles documents légaux',
  'fullAuth.legal_acceptance.continue': 'Continuer',
  'fullAuth.legal_acceptance.couldn_t_check_your_agreement':
    'la vérification des actuelles documents',
  'fullAuth.legal_acceptance.create': 'Créer',
  'fullAuth.legal_acceptance.i_agree_to_menta_s_terms_of_use_and_community_st':
    "Je suis d'accord avec les conditions d'utilisation et les normes de communauté de Menta, et j'assure l'Politique de Confidentialité.",
  'fullAuth.legal_acceptance.leave_legal_review': 'Lisez les documents légaux',
  'fullAuth.legal_acceptance.menta': 'Menta',
  'fullAuth.legal_acceptance.menta_mascot_beside_your_account_confirmation':
    "Menta, mascotte à côté de votre confirmation d'account",
  'fullAuth.legal_acceptance.try_again': 'Recommencer',
  'fullAuth.legal_acceptance.you_can_go_back_without_agreeing_your_account_an':
    'Vous pouvez revenir en arrière sans accepter. Votre compte et vos promesses existantes restent disponibles.',
  'fullAuth.login.menta': 'Menta',
  'fullAuth.notification_settings.a_test_is_already_on_the_way':
    'Un essai est déjà en cours',
  'fullAuth.notification_settings.allow_notifications':
    'Autoriser les notifications',
  'fullAuth.notification_settings.allow_notifications_first':
    "Autoriser les notifications d'abord",
  'fullAuth.notification_settings.back_to_settings': 'Retour aux paramètres',
  'fullAuth.notification_settings.check_again_before_turning_on_proof_reminders':
    'Verifiez la autorisation des notifications avant de vous engager sur les rappels de preuve.',
  'fullAuth.notification_settings.check_notification_permission':
    "Verifiez la autorisation des notifications et réessayez d'essai d'ici quelques minutes.",
  'fullAuth.notification_settings.check_notification_permission_and_try_the_test_a':
    'Choix enregistré',
  'fullAuth.notification_settings.choice_saved':
    'Choisissez des rappels de preuve journaliers et des mises à jour quand une promesse est terminée.',
  'fullAuth.notification_settings.choose_daily_proof_reminders_and_updates_when_a_':
    'Choisissez Notifications pour Menta, puis revenez ici.',
  'fullAuth.notification_settings.choose_notifications_for_menta_then_return_here':
    'Choisissez les notifications que vous voulez de Menta ci-dessous.',
  'fullAuth.notification_settings.choose_the_notifications_you_want_from_menta':
    'Choisissez les notifications que vous voulez de Menta ci-dessous.',
  'fullAuth.notification_settings.choose_the_notifications_you_want_from_menta_bel':
    'Choisissez les groupees et les mises à jour en cours que Menta peut envoyer.',
  'fullAuth.notification_settings.choose_which_group_and_progress_updates_menta_ma':
    'Confirmation des étapes et changements de Promesse Momenta',
  'fullAuth.notification_settings.confirmed_milestones_momenta_and_streak_changes':
    'Confirmation des étapes, Promesse Momenta et changements de séries',
  'fullAuth.notification_settings.could_not_check_phone_notifications':
    "Peut être impossible d'accéder à des notifications de téléphone",
  'fullAuth.notification_settings.could_not_load_notification_settings':
    'Peut être impossible de charger les paramètres de notification',
  'fullAuth.notification_settings.could_not_load_notification_settings_2':
    'Peut être impossible de charger les paramètres de notification',
  'fullAuth.notification_settings.could_not_open_phone_settings':
    "Peut être impossible d'ouvrir les paramètres de téléphone",
  'fullAuth.notification_settings.could_not_save_your_choice':
    "Peut être impossible d'enregistrer vos choix",
  'fullAuth.notification_settings.delivery_and_timing':
    'Délivrance et horaires',
  'fullAuth.notification_settings.email_choice_did_not_change':
    "Choix de l'option de délivrance n'a pas changé",
  'fullAuth.notification_settings.email_updates': 'Avis par courriel',
  'fullAuth.notification_settings.email_updates_are_off':
    'Avis par courriel désactivé',
  'fullAuth.notification_settings.email_updates_are_on':
    'Menta met envoie des actualités par courriel.',
  'fullAuth.notification_settings.email_updates_are_still_off':
    'Menta ne correspondra plus à des actualités par courriel.',
  'fullAuth.notification_settings.email_updates_are_unavailable':
    'Menta ne peut pas contacter cette courriel par sécurité.',
  'fullAuth.notification_settings.if_it_does_not_save_menta_will_put_your_previous':
    'Si cela ne sauvegarde pas, Menta mettra le choix précédent de retour.',
  'fullAuth.notification_settings.it_should_arrive_shortly_tap_it_to_return_to_not':
    'Il devrait être arrivé bientôt. Appuyez dessus pour revenir aux paramètres de notification.',
  'fullAuth.notification_settings.keep_notifications_off': 'Soyez informé.',
  'fullAuth.notification_settings.loading_notification_settings':
    "Veuillez s'occuper de vos paramètres de notification.",
  'fullAuth.notification_settings.loading_your_notification_settings':
    "Veuillez s'occuper de vos paramètres de notification.",
  'fullAuth.notification_settings.menta_can_resume_notifications_after_this_time':
    'Menta peut reprendre le notification après cette période.',
  'fullAuth.notification_settings.menta_could_not_connect_this_email_safely_so_you':
    'Menta ne peut pas se connecter à cette courriel de manière sûre, donc votre consentement ne peut pas être activé.',
  'fullAuth.notification_settings.menta_could_not_finish_notification_registration':
    'Menta ne peut pas terminer la configuration de notification. Essaie-le à nouveau en quelques minutes.',
  'fullAuth.notification_settings.menta_does_not_send_notifications_during_these_h':
    'Menta ne met pas les notifications en cours pendant ce temps-ci. Il pourraient arriver à plus tard.',
  'fullAuth.notification_settings.menta_does_not_send_notifications_during_this_lo':
    'Menta ne met pas les notifications en cours pendant ce temps-ci.',
  'fullAuth.notification_settings.menta_is_checking_this_phone_and_your_active_pro':
    'Menta est vérifiant ce téléphone et les promesses actives.',
  'fullAuth.notification_settings.menta_is_checking_this_phone_before_it_queues_th':
    'Menta est vérifiant ce téléphone avant de mettre en ordre une épreuve.',
  'fullAuth.notification_settings.menta_is_finishing_notification_setup_for_this_p':
    'Menta est terminant la configuration de notification pour ce téléphone.',
  'fullAuth.notification_settings.menta_may_remind_you_while_proof_is_due_or_a_pro':
    "Menta pourra vous rappeler pendant les périodes de progrès ou en cours d'indemnisation, et cela se produira pendant les heures calmes.",
  'fullAuth.notification_settings.menta_may_send_occasional_product_news_to_your_a':
    "Menta pourra vous envoyer des actualités de produit à votre adresse courriel. Vous pouvez l'arrêter ici à tout moment.",
  'fullAuth.notification_settings.menta_needs_a_confirmed_account_email_before_thi':
    "Menta ne demande pas d'courriel de confirmation avant cette action.",
  'fullAuth.notification_settings.menta_product_news':
    'Menta actualités de produit',
  'fullAuth.notification_settings.menta_removed_this_email_from_product_update_del':
    "Menta a annulé ce mode d'envoi de notifications.",
  'fullAuth.notification_settings.menta_will_not_send_proof_or_promise_ending_remi':
    "Menta ne met pas les notifications en cours lorsqu'une épreuve ou une promesse se terminent, et cela se produira pendant les heures calmes.",
  'fullAuth.notification_settings.menta_will_use_this_choice_for_future_notificati':
    'Menta utilisera ce choix pour les notifications futures.',
  'fullAuth.notification_settings.new_proof_to_review_review_outcomes_check_ins_an':
    "Nouvelle épreuve à révisioner, résultats de l'épreuve, évaluations du travail et changements de groupee.",
  'fullAuth.notification_settings.no_notification_was_queued':
    "Aucune notification n'a été enregistrée.",
  'fullAuth.notification_settings.nothing_was_sent_try_again_in_a_moment':
    "Menta ne fait pas de réception. Essaie d'ouvrir à nouveau.",
  'fullAuth.notification_settings.notification_setup_did_not_finish':
    "La configuration de notification ne s'est pas terminée",
  'fullAuth.notification_settings.notifications': 'Notifications',
  'fullAuth.notification_settings.promise_context_title': 'Rappels de promesse',
  'fullAuth.notification_settings.promise_context_body':
    'Cette heure de rappel s’applique à toutes les promesses actives. Les horaires suivent {timeZone}.',
  'fullAuth.notification_settings.back_to_promise': 'Retour à la promesse',
  'fullAuth.notification_settings.notifications_are_off':
    'Notifications sont fermées',
  'fullAuth.notification_settings.notifications_are_still_off':
    'Notifications sont toujours fermées',
  'fullAuth.notification_settings.notifications_off': 'Notifications fermées',
  'fullAuth.notification_settings.old_reminders_may_still_be_on_this_phone':
    "Les rappels d'épreuve ou de promesse qui ont été fermés peuvent toujours être activés sur ce téléphone",
  'fullAuth.notification_settings.open_phone_settings':
    'Ouvrez les paramètres de votre téléphone',
  'fullAuth.notification_settings.open_your_phone_settings_choose_menta_then_notif':
    'Ouvrez les paramètres de votre téléphone, choisissez Menta, puis Notifications pour permettre les rappels.',
  'fullAuth.notification_settings.open_your_phone_settings_choose_menta_then_notif_2':
    'Ouvrez les paramètres de votre téléphone, choisissez Menta, puis Notifications pour activer les notifications.',
  'fullAuth.notification_settings.opening_phone_settings':
    'Ouvrez les paramètres de votre téléphone',
  'fullAuth.notification_settings.optional_menta_product_news_this_is_separate_fro':
    "Actualités de produits facultatives. Ce ne sont pas des notifications d'accompagnement et d'épreuves.",
  'fullAuth.notification_settings.people_and_progress':
    'Personnes et progression',
  'fullAuth.notification_settings.phone_controls': 'Gestion des appareils',
  'fullAuth.notification_settings.phone_notification_check_failed':
    'Vérification de la notification des appareils échouée',
  'fullAuth.notification_settings.phone_notification_settings':
    'Défauts de notification pour le téléphone',
  'fullAuth.notification_settings.preferred_time_formattedremindertime_a_proof_dea':
    "Heure préférée: {formattedReminderTime}. Un délai de livraison ou les heures tranquilles peuvent changer l'heure réelle.",
  'fullAuth.notification_settings.preferred_time_formattedremindertime_notificatio':
    'Heure préférée: {formattedReminderTime}. Les notifications sont désactivées sur ce téléphone.',
  'fullAuth.notification_settings.preparing_a_test_notification':
    "Préparation d'une notification de test",
  'fullAuth.notification_settings.preparing_proof_reminders':
    'Préparation des rappels de preuve',
  'fullAuth.notification_settings.promise_reminders': 'Rappels de preuve',
  'fullAuth.notification_settings.proof_reminders': 'Rappels de preuve',
  'fullAuth.notification_settings.proof_reminders_are_off':
    'Rappels de preuve sont désactivés',
  'fullAuth.notification_settings.proof_reminders_are_ready':
    'Rappels de preuve sont prêts',
  'fullAuth.notification_settings.proof_reminders_are_ready_on_this_phone':
    'Rappels de preuve sont prêts sur ce téléphone',
  'fullAuth.notification_settings.proof_reminders_saved':
    'Rappels de preuve sauvegardés',
  'fullAuth.notification_settings.quiet_hours': 'Heures paisibles',
  'fullAuth.notification_settings.quiet_hours_and_delivery':
    'Heures paisibles et livraison',
  'fullAuth.notification_settings.quiet_hours_end':
    "Heures paisibles s'arrêtent",
  'fullAuth.notification_settings.quiet_hours_formattedquiethours':
    'Heures paisibles: {formattedQuietHours}',
  'fullAuth.notification_settings.quiet_hours_not_saved':
    'Heures paisibles ne sont pas sauvegardées',
  'fullAuth.notification_settings.quiet_hours_saved':
    'Heures paisibles sauvegardées',
  'fullAuth.notification_settings.quiet_hours_start':
    'Heures paisibles commencent',
  'fullAuth.notification_settings.reload_your_saved_notification_choices':
    'Réinitialisation des préférences de notification sauvegardées',
  'fullAuth.notification_settings.reminder_setup_did_not_finish':
    "Installation des paramètres de rappel ne s'est pas terminée",
  'fullAuth.notification_settings.reminder_time': 'Heure de rappel',
  'fullAuth.notification_settings.reminder_time_did_not_update_on_this_phone':
    "Heure de rappel ne s'est pas mis à jour sur ce téléphone",
  'fullAuth.notification_settings.reviews_and_group_activity':
    'Évaluations et activités de groupee',
  'fullAuth.notification_settings.save_quiet_hours':
    'Sauvegarder les heures paisibles',
  'fullAuth.notification_settings.saving_quiet_hours':
    'Sauvegarder les heures paisibles',
  'fullAuth.notification_settings.saving_your_choice': 'Sauvegarder vos choix',
  'fullAuth.notification_settings.saving_your_choice_2':
    'Sauvegarder vos choix…',
  'fullAuth.notification_settings.saving_your_email_choice':
    'Sauvegarder vos choix…',
  'fullAuth.notification_settings.send_one_real_notification_to_this_signed_in_pho':
    'Envoyez une notification réelle de test à ce téléphone signé',
  'fullAuth.notification_settings.send_test_notification':
    'Envoyez une notification de test',
  'fullAuth.notification_settings.set_quiet_hours_email_and_phone_notification_opt':
    'Set heures paisibles, courriel et options de notification de rappel.',
  'fullAuth.notification_settings.sign_in_again': 'Signer en nouveau',
  'fullAuth.notification_settings.sign_in_again_to_send_a_test':
    'Signer en nouveau pour envoyer une notification de test',
  'fullAuth.notification_settings.sounds_previews_focus_and_scheduled_delivery':
    'Sons, prévisualisations, Focus et livraison planifiée.',
  'fullAuth.notification_settings.sounds_previews_focus_and_scheduled_delivery_are':
    'Sons, prévisualisations, Focus et livraison sont propriétés de votre téléphone.',
  'fullAuth.notification_settings.streaks_and_momenta': 'Pilotes et Momenta',
  'fullAuth.notification_settings.test_notification_queued':
    'Notification de test en attente',
  'fullAuth.notification_settings.test_notification_was_not_queued':
    "Notification de test n'a pas été en attente",
  'fullAuth.notification_settings.test_notifications': 'Notifications de test',
  'fullAuth.notification_settings.the_range_can_cross_midnight':
    'Le champ de la plage peut croiser le zéro heure.',
  'fullAuth.notification_settings.there_are_no_active_promises_to_schedule_yet_men':
    "Il n'y a pas de promesses à charger actuellement à charger. Menta utilisera ce choix lorsque vous commencer un.",
  'fullAuth.notification_settings.this_phone_is_not_ready_yet':
    'Ce téléphone ne peut pas encore être prêt',
  'fullAuth.notification_settings.this_phone_is_ready_for_menta_notifications':
    'Ce téléphone est prêt pour les notifications Menta',
  'fullAuth.notification_settings.this_phone_may_show_a_reminder_at_your_preferred':
    'Ce téléphone peut montrer un rappel à votre heure préférée pour une promesse actives. ',
  'fullAuth.notification_settings.this_phone_must_allow_menta_notifications_before':
    'Ce téléphone doit permettre les notifications Menta avant de pouvoir envoyer une invitation test. ',
  'fullAuth.notification_settings.this_phone_will_not_show_menta_notifications_unt':
    "Ce téléphone ne montrera pas les notifications Menta tant que vous l'activeront. ",
  'fullAuth.notification_settings.to_turn_them_on':
    'Activer les notifications Menta',
  'fullAuth.notification_settings.try_again': 'Essayez encore',
  'fullAuth.notification_settings.try_again_before_relying_on_notifications_from_t':
    'Essayez encore avant de faire confiance aux notifications de ce téléphone. ',
  'fullAuth.notification_settings.try_again_before_turning_on_reminders_for_this_p':
    'Essayez encore avant de vous activer les rappels pour ce téléphone. ',
  'fullAuth.notification_settings.turning_off_email_updates':
    'Désactiver les mises à jour électroniques',
  'fullAuth.notification_settings.turning_on_email_updates':
    'Activer les mises à jour électroniques',
  'fullAuth.notification_settings.wait_one_minute_before_requesting_another_test':
    'Attendez une minute avant de demander une nouvelle invitation. ',
  'fullAuth.notification_settings.your_choice_is_saved_but_an_old_reminder_may_sti':
    'Votre choix est sauvegardé, mais une ancienne notification peut encore apparaître. Essayez encore.',
  'fullAuth.notification_settings.your_choice_is_saved_but_proof_reminders_are_not':
    "Votre choix est sauvegardé, mais les rappels de preuve n'ont pas encore été prêtes. Essayez encore.",
  'fullAuth.notification_settings.your_choice_is_saved_but_proof_reminders_are_not_2':
    'Votre choix est sauvegardé, mais les rappels de preuve ne sont pas prêtes sur ce téléphone. Essayez encore.',
  'fullAuth.notification_settings.your_choices_are_saved_but_this_phone_cannot_sho':
    "Votre choix est sauvegardé, mais ce téléphone ne peut pas montrer les notifications Menta jusqu'à ce qu'ils autorisent. ",
  'fullAuth.notification_settings.your_current_choice_remains_authoritative_until_':
    "Votre choix actuel reste autorité jusqu'à ce qu'il soit sauvegardé. ",
  'fullAuth.notification_settings.your_current_quiet_hours_stay_in_place_until_thi':
    "Vos heures de silence restent actives jusqu'à ce qu'ils soient sauvegardées. ",
  'fullAuth.notification_settings.your_menta_opt_out_is_saved_provider_removal_wil':
    'Votre Menta a été désactivé. Provider de Remplacement a retenté la connexion de cette compte à nouveau.',
  'fullAuth.notification_settings.your_phone_did_not_return_a_notification_setting':
    "Votre téléphone n'a pas répondu à une configuration de notification. Aucune autorisation n'a changé.",
  'fullAuth.notification_settings.your_phone_now_allows_notifications':
    'Votre téléphone peut maintenant activer les notifications',
  'fullAuth.notification_settings.your_preferred_time_is_saved_but_this_phone_may_':
    "Votre heure préférée a été sauvegardée, mais ce téléphone peut encore utiliser l'heure ancienne. Essayez encore.",
  'fullAuth.notification_settings.your_previous_email_choice_is_still_active':
    "Votre choix précédemment d'courriel est toujours actif.",
  'fullAuth.notification_settings.your_previous_notification_choice_is_still_activ':
    'Votre choix précédemment de notification est toujours actif.',
  'fullAuth.notification_settings.your_previous_quiet_hours_remain_active':
    "Votre choix précédemment d'heure de silence sont toujours en place.",
  'fullAuth.notification_settings.your_promises_still_work_menta_will_not_ask_agai':
    'Vos promesses continuent de travailler. Menta ne questionnera pas ici.',
  'fullAuth.notification_settings.your_promises_still_work_this_phone_will_not_sho':
    'Vos promesses continueront de travailler. Ce téléphone ne montrera pas les notifications de preuve, révision ou groupees. ',
  'fullAuth.notification_settings.your_proof_reminder_choice_is_unchanged_your_pho':
    "Votre choix précédemment de rappel de preuve n'a pas été changé. Votre téléphone ne vous demandera pas de rappel prochain. ",
  'fullAuth.onboarding.32_character_code': 'Code de 32 caractères',
  'fullAuth.onboarding.accountability': 'Responsabilité',
  'fullAuth.onboarding.activation_needs_attention':
    "Activer besoin d'attention",
  'fullAuth.onboarding.add_code_and_create': 'Ajouter le code et créer',
  'fullAuth.onboarding.add_it_now_or_create_your_promise_without_one_gr':
    'Ajoutez-le maintenant, ou créez votre promesse sans le.',
  'fullAuth.onboarding.add_referral_code': 'Ajoutez le code de référencement',
  'fullAuth.onboarding.after_it_s_created_menta_adds':
    "Après l'avoir créé, Menta ajoute",
  'fullAuth.onboarding.agree_and_choose_sign_in':
    "Accordez et choisissez l'entrée d'accès",
  'fullAuth.onboarding.agree_and_continue': 'Accordez et continuez',
  'fullAuth.onboarding.back': 'Retour',
  'fullAuth.onboarding.back_to_backlabel': 'Retour à {backLabel}',
  'fullAuth.onboarding.choose_a_length_you_can_genuinely_follow_through':
    'Choisissez une longueur avec laquelle vous pouvez vous tenir.',
  'fullAuth.onboarding.choose_how_you_want_to_continue_your_draft_stays':
    'Choisissez comment vous souhaitez continuer. Votre texte reste sur ce téléphone.',
  'fullAuth.onboarding.choose_length': 'Choisissez la longueur',
  'fullAuth.onboarding.choose_proof': 'Choisissez le preuves',
  'fullAuth.onboarding.choose_the_proof_you_will_add_and_who_you_want_b':
    'Choisissez les preuves que vous ajouterez et qui souhaitez que vous les accompagnez.',
  'fullAuth.onboarding.choose_what_you_ll_add_when_it_s_done_you_can_in':
    "Choisissez ce que vous ajouterez lorsque c'est terminé. Vous pouvez inviter les gens à vous examiner après vous avoir enregistré.",
  'fullAuth.onboarding.complete_this_promise_and_add_a_proofname_as_pro':
    'Terminez cette promesse et ajoutez une preuve {proofName} comme preuve.',
  'fullAuth.onboarding.confirm_the_required_documents':
    'Confirmez les documents requis.',
  'fullAuth.onboarding.confirming_code': 'Confirmez le code de verification…',
  'fullAuth.onboarding.continue_to_referral': 'Continuez à la recommandation',
  'fullAuth.onboarding.continue_to_save': 'Continuez à sauvegarder',
  'fullAuth.onboarding.continue_with_apple': 'Continuez avec Apple',
  'fullAuth.onboarding.continue_with_email': 'Continuez avec courriel',
  'fullAuth.onboarding.continue_with_google': 'Continuez avec Google',
  'fullAuth.onboarding.could_not_finish_setup':
    'Peut pas terminer le configuration',
  'fullAuth.onboarding.create_a_group': 'Créer un groupee',
  'fullAuth.onboarding.review_promise_invite': 'Revêtu de promesse invite',
  'fullAuth.onboarding.promise_invite_held':
    'Votre promesse invite est encore enregistré. Revêtu-la prochain; la participation ne reste pas à une action séparée.',
  'fullAuth.onboarding.review_group_invite': "Revêtu d'une invite de groupee",
  'fullAuth.onboarding.group_invite_held':
    'Votre invite de groupee est encore enregistré. Revêtu-la prochain; la participation ne reste pas à une action séparée.',
  'fullAuth.onboarding.open_event': "Ouvrez l'event",
  'fullAuth.onboarding.event_held':
    'Votre invite de groupee est encore enregistré. Ouvrez-la prochain; cette réception de promesse ne montre pas de participation.',
  'fullAuth.onboarding.create_my_group': 'Inviter quelqu’un',
  'fullAuth.onboarding.create_my_group_detail':
    'Votre promesse est enregistrée et reste privée. Choisissez comment une personne peut vous aider, puis décidez qui inviter.',
  'fullAuth.onboarding.create_it_first_menta_will_then_add':
    "Créez d'abord. Menta ajoutera",
  'fullAuth.onboarding.create_without_a_code': 'Créez sans un code',
  'fullAuth.onboarding.creating_your_first_promise':
    'Créer votre première promesse',
  'fullAuth.onboarding.creating_your_first_promise_2':
    'Créer votre première promesse…',
  'fullAuth.onboarding.days': 'jours',
  'fullAuth.onboarding.decide_what_finished_will_look_like':
    'Décidez ce qui sera terminé comme cela.',
  'fullAuth.onboarding.do_you_have_a_referral_code':
    'Où avez-vous un code de recommandation?',
  'fullAuth.onboarding.edit': 'Modifier',
  'fullAuth.onboarding.every_day': 'Toutes les jours',
  'fullAuth.onboarding.every_day_2': '· Tous les jours ·',
  'fullAuth.promise.frequency.once_a_week': 'Une fois par semaine',
  'fullAuth.onboarding.first_promise': 'Première promesse',
  'fullAuth.onboarding.first_promise_firstpromisecost_momenta_after_cre':
    'Première promesse : {firstPromiseCost} Momenta. Après la création, {welcomeBonus} Momenta pour vos choix ultérieurs.',
  'fullAuth.onboarding.free': 'libre.',
  'fullAuth.onboarding.how_long_do_you_want_to_keep_this_promise':
    'Durez-vous vous souhaitez garder cette promesse?',
  'fullAuth.onboarding.how_will_you_prove_it':
    'Comment voulez-vous prouver cela?',
  'fullAuth.onboarding.i_agree_to_menta_s_terms_of_use_and_community_st':
    "J'accepte les Conditions d’utilisation de l'Utilisation et les Normes de Conformité de Menta, et j'accepte les Politiques de Protection des Données.",
  'fullAuth.onboarding.invite': 'Invitez',
  'fullAuth.onboarding.invite_people_after_this_promise_is_saved_member':
    'Invitez les personnes après avoir enregistré cette promesse. Les membres peuvent vous examiner votre preuve.',
  'fullAuth.onboarding.just_me': 'Seul moi',
  'fullAuth.onboarding.keep_it_specific_enough_that_you_will_know_when_':
    "Veuillez garder la preuve spécifique à ce qu'elle sera terminée.",
  'fullAuth.onboarding.legal_confirmation_did_not_finish':
    "Confirmation légale ne s'est pas terminée.",
  'fullAuth.onboarding.legal_review_was_not_completed':
    "Examination légale n'a pas été complétée.",
  'fullAuth.onboarding.length': 'Longueur',
  'fullAuth.onboarding.local_draft': 'Draft local',
  'fullAuth.onboarding.menta': 'Menta',
  'fullAuth.onboarding.menta_confirms_the_first_deadline_when_you_save':
    'Menta confirme la première limite de temps lorsque vous enregistrez.',
  'fullAuth.onboarding.menta_confirms_your_first_deadline_when_the_prom':
    'Menta confirme votre premier délai lorsque vous créez la promesse.',
  'fullAuth.onboarding.menta_is_confirming_your_promise_and_momenta_bal':
    'Menta confirme votre promesse et Momenta équilibre.',
  'fullAuth.onboarding.menta_mascot_offering_you_a_bag_of_momenta_token':
    'Le mascot de Menta vous offre un sac de tokens de Momenta',
  'fullAuth.onboarding.menta_mascot_waving_you_toward_saving_this_promi':
    'Le mascot de Menta vous invite à sauvegarder cette promesse',
  'fullAuth.onboarding.menta_saved_the_promise_and_confirmed_your_accou':
    'Menta a sauvegardé la promesse et a confirmé votre compte depuis la même réception de la facture.',
  'fullAuth.onboarding.message_your_draft_is_still_here':
    '{message} votre draft est toujours ici.',
  'fullAuth.onboarding.momenta': 'Momenta',
  'fullAuth.onboarding.momenta_for_extra_promises_groups_freezes_and_it':
    'Momenta pour des promesses supplémentaires, des groupees, des freezes et des objets.',
  'fullAuth.onboarding.momenta_for_later_choices':
    'Momenta pour des choix ultérieurs.',
  'fullAuth.onboarding.my_promise': 'Votre promesse',
  'fullAuth.onboarding.next_due': 'Délai à venir',
  'fullAuth.onboarding.note': 'Note',
  'fullAuth.onboarding.opening_email': "Email d'ouverture…",
  'fullAuth.onboarding.photo': 'Photo',
  'fullAuth.onboarding.preview_my_promise': 'Préparez votre preuve',
  'fullAuth.onboarding.promise_length': 'Longueur de la promesse',
  'fullAuth.onboarding.promise_saved_and_confirmed':
    'Promesse sauvegardée et confirmée',
  'fullAuth.onboarding.proof': 'Preuve',
  'fullAuth.onboarding.proof_and_support': 'PREUVE ET SOUTIEN',
  'fullAuth.onboarding.proof_cadence': 'Cadence de preuve',
  'fullAuth.onboarding.providername_sign_in_did_not_finish':
    'La connexion avec {providerName} n’a pas abouti.',
  'fullAuth.onboarding.read_the_current_account_and_community_documents':
    'Lisez les documents actuels de compte et de communauté avant de créer votre promesse.',
  'fullAuth.onboarding.record_a_short_clip':
    'Enregistrez une courte séquence vidéo.',
  'fullAuth.onboarding.referral_code': "Référence de code d'invitation",
  'fullAuth.onboarding.reopen_onboarding_before_continuing_with_email':
    'Réouverture de la brève étape avant de continuer par courriel.',
  'fullAuth.onboarding.restored_from_this_phone':
    'Restauré à partir de ce téléphone',
  'fullAuth.onboarding.return_to_draft': 'Retour à la draft',
  'fullAuth.onboarding.review_menta_s_terms':
    'Examinez les Conditions d’utilisation de Menta',
  'fullAuth.onboarding.review_your_promise': 'Examinez votre promesse',
  'fullAuth.onboarding.save_this_promise_to_menta':
    'Enregistrez cette promesse à Menta.',
  'fullAuth.onboarding.save_your_promise': 'Enregistrez votre promesse',
  'fullAuth.onboarding.schedule': 'Planifier',
  'fullAuth.onboarding.schedule_every_day': 'Planifier, tous les jours',
  'fullAuth.onboarding.show_another_example': "Montrer d'autres exemples",
  'fullAuth.onboarding.sign_in_to_save_my_promise':
    'Se connecter pour enregistrer ma promesse',
  'fullAuth.onboarding.start_privately_you_can_invite_people_later':
    'Commencez en toute confidentialité. Vous pouvez inviter les personnes plus tard.',
  'fullAuth.onboarding.start_with_one_thing_that_matters_today':
    "Commencez avec quelque chose qui compte le plus pour aujourd'hui.",
  'fullAuth.onboarding.stay_here_and_try_again_so_menta_can_keep_this_p':
    'Restez ici et essayez de nouveau, afin que Menta puisse garder cette promesse sur ce téléphone.',
  'fullAuth.onboarding.stay_here_and_try_email_sign_in_again_so_menta_c':
    "Restez ici et essayez d'ouvrir une nouvelle fois l'inscription par courriel afin que Menta puisse garder cette promesse sur ce téléphone.",
  'fullAuth.onboarding.take_one_photo': 'Prenez une photo.',
  'fullAuth.onboarding.this_choice_sets_your_next_step_it_does_not_add_':
    'Cette choix défini votre prochain pas. Il ne ne ajoute pas personne ou ne crée pas de groupee encore.',
  'fullAuth.onboarding.use_duration_days': '{duration} jours',
  'fullAuth.onboarding.video': 'Vidéo',
  'fullAuth.onboarding.welcome_momenta': 'Bienvenue à Momenta',
  'fullAuth.onboarding.what_s_one_thing_you_want_to_do':
    'Quelle est une chose que vous voulez faire?',
  'fullAuth.onboarding.who_will_hold_you_accountable':
    'Qui tiendra-t-il responsable?',
  'fullAuth.onboarding.write_what_happened': "Écrivez ce qui s'est passé.",
  'fullAuth.onboarding.you_can_review_these_choices_before_menta_saves_':
    'Vous pouvez revérifier ces choix avant que Menta ne garde quelque chose.',
  'fullAuth.onboarding.your_account_changed': 'Vos paramètres ont changé.',
  'fullAuth.onboarding.your_draft_could_not_be_saved_yet':
    'Votre espace de travail ne peut pas être sauvegardé à ce moment.',
  'fullAuth.onboarding.your_draft_is_private_on_this_phone_sign_in_to_k':
    'Votre espace de travail est privé sur ce téléphone. Se connecter pour maintenir le contact.',
  'fullAuth.onboarding.your_draft_is_still_private_on_this_phone':
    'Votre espace de travail est toujours privé sur ce téléphone.',
  'fullAuth.onboarding.your_first_promise': 'Votre première promesse',
  'fullAuth.onboarding.for_promise': 'Pour « {promise} »',
  'fullAuth.onboarding.check_ins': '{count} suivis',
  'fullAuth.onboarding.your_first_promise_2': 'Votre première promesse',
  'fullAuth.onboarding.your_first_promise_is': 'Votre première promesse est',
  'fullAuth.onboarding.your_promise': 'Votre promesse',
  'fullAuth.onboarding.your_promise_2': 'Votre promesse est prête.',
  'fullAuth.onboarding.your_promise_is_ready':
    'Votre promesse est sûre. Confirmez les documents ci-dessous avant de créer.',
  'fullAuth.onboarding.your_promise_is_safe_confirm_the_documents_below':
    'Votre promesse est sûre. Réessayez avant de continuer.',
  'fullAuth.onboarding.your_promise_is_safe_try_again_before_continuing':
    'Votre promesse est toujours sûre. Rappelez-vous des documents actuels lorsque vous êtes prêts à continuer.',
  'fullAuth.onboarding.your_promise_is_still_safe_review_the_current_do':
    'Changez mon mot de passe',
  'fullAuth.password_recovery.change_my_password':
    'Choisissez un nouveau mot de passe',
  'fullAuth.password_recovery.choose_a_new_password':
    'Choisir un nouveau mot de passe',
  'fullAuth.password_recovery.close':
    'Fermer la réinitialisation du mot de passe',
  'fullAuth.password_recovery.close_password_reset':
    'Confirmez le mot de passe',
  'fullAuth.password_recovery.confirm_password':
    'Impossible de changer votre mot de passe',
  'fullAuth.password_recovery.couldn_t_change_your_password':
    'Entrez un nouveau mot de passe',
  'fullAuth.password_recovery.enter_new_password': 'Menta',
  'fullAuth.password_recovery.menta': 'Menta',
  'fullAuth.password_recovery.new_password': 'nouveau mot de passe',
  'fullAuth.password_recovery.or_more_characters_both_entries_must_match':
    'de plus de caractères. Les deux entrées doivent correspondre.',
  'fullAuth.password_recovery.other_signed_in_devices_may_ask_for_the_new_pass':
    'Les appareils connectés signés peuvent demander le nouveau mot de passe.',
  'fullAuth.password_recovery.password_changed': 'Mot de passe changé',
  'fullAuth.password_recovery.re_enter_new_password': 'Répétez le mot de passe',
  'fullAuth.password_recovery.request_a_new_link': 'Demandez une nouvelle lien',
  'fullAuth.password_recovery.request_a_new_link_your_draft_is_still_on_this_p':
    'Demandez une nouvelle lien. Votre ébauche reste sur cette machine.',
  'fullAuth.password_recovery.return_to': 'Retourner à',
  'fullAuth.password_recovery.sign_in': 'Se connecter',
  'fullAuth.password_recovery.sign_in_instead': 'Se connecter en lieu que',
  'fullAuth.password_recovery.this_reset_link_has_expired':
    'Cette lien de réinitialisation a échoué.',
  'fullAuth.password_recovery.use': 'Utilisez',
  'fullAuth.password_recovery.your_password_has_been_changed':
    'Mot de passe modifié',
  'fullAuth.report_issue.1_open_2_tap_3_notice':
    '1. Ouvrez… 2. Cliquez… 3. Notez…',
  'fullAuth.report_issue.add_a_screenshot': 'Ajoutez une capture d’écran',
  'fullAuth.report_issue.add_more_detail': 'Ajoutez plus d’informations',
  'fullAuth.report_issue.add_the_basics': 'Ajoutez les bases de données',
  'fullAuth.report_issue.attach_a_jpeg_png_or_webp_screenshot':
    'Attachez un screenshot JPEG, PNG ou WebP.',
  'fullAuth.report_issue.back_to_support': 'Retour à l’aide',
  'fullAuth.report_issue.choose_a_screenshot_smaller_than_8_mb':
    'Choisissez un screenshot plus petit que 8 Mo.',
  'fullAuth.report_issue.choose_an_image': 'Choisissez une image',
  'fullAuth.report_issue.choose_another_report': 'Choisissez un autre rapport',
  'fullAuth.report_issue.choose_screenshot': 'Choisissez le screenshot',
  'fullAuth.report_issue.could_not_find_this_saved_report':
    'Ne peut pas trouver ce rapport sauvegardé',
  'fullAuth.report_issue.crash_reference': 'Réf. d’erreur',
  'fullAuth.report_issue.expected_result_optional': 'Résultat attendu',
  'fullAuth.report_issue.expected_result_optional_2':
    'Résultat attendu (facultatif)',
  'fullAuth.report_issue.feedback_received': 'Commentaires reçu',
  'fullAuth.report_issue.feedback_required': 'Commentaires, obligatoire',
  'fullAuth.report_issue.give_the_report_a_short_title_and_explain_what_h':
    'Donnez le rapport un titre court et expliquez ce qui s’est passé.',
  'fullAuth.report_issue.inappropriate': 'inappréciable',
  'fullAuth.report_issue.it_is_not_saved_under_this_account_nothing_was_c':
    'Il ne s’agit pas de ce compte. Pas de changement.',
  'fullAuth.report_issue.keep_this_screen_open_while_you_write_or_copy_th':
    'Veuillez tenir ce panneau ouvert pendant que vous écrivez, ou copiez le texte avant de quitter.',
  'fullAuth.report_issue.last_step': 'Étape ultime',
  'fullAuth.report_issue.menta_could_not_open_your_photo_library_try_agai':
    'Menta ne peut pas ouvrir votre bibliothèque photo. Réessayez.',
  'fullAuth.report_issue.menta_could_not_preserve_this_report_locally_kee':
    'Menta ne peut pas sauvegarder ce rapport localement. Retenez ce panneau ouvert; rien ne parvient à l’aide.',
  'fullAuth.report_issue.menta_does_not_add_device_diagnostics_to_this_re':
    'Menta ne rajoute pas les diagnostics de matériel de cette report.',
  'fullAuth.report_issue.menta_includes_the_item_or_screen_you_reported':
    'Menta inclut l’élément ou la fenêtre que vous avez rapporté.',
  'fullAuth.report_issue.not_sent': 'non envoyé',
  'fullAuth.report_issue.open': 'Ouvrez',
  'fullAuth.report_issue.preparing_private_report_draft':
    'préparer un rapport privé',
  'fullAuth.report_issue.proof_upload_gets_stuck':
    'le chargement de la pièce jointe a échoué',
  'fullAuth.report_issue.reference': 'reference',
  'fullAuth.report_issue.remove': 'effacer',
  'fullAuth.report_issue.replace_screenshot': 'remplacer la capture d’écran',
  'fullAuth.report_issue.report_an_issue': 'soumettre un problème',
  'fullAuth.report_issue.report_not_sent': "le rapport n'a pas été envoyé",
  'fullAuth.report_issue.report_received': 'le rapport a été reçu',
  'fullAuth.report_issue.retry_sending_report': 'retourner à la réparation',
  'fullAuth.report_issue.return_to_support': 'revoir les commentaires',
  'fullAuth.report_issue.review_feedback': 'revoir les commentaires',
  'fullAuth.report_issue.review_report': 'revoir le rapport',
  'fullAuth.report_issue.screenshot_did_not_open':
    "la capture d’écran n'a pas ouvert",
  'fullAuth.report_issue.screenshot_is_too_large':
    'la capture d’écran est trop grande',
  'fullAuth.report_issue.screenshot_optional': 'capture d’écran (facultative)',
  'fullAuth.report_issue.selected_support_screenshot':
    'capture d’écran choisie ·',
  'fullAuth.report_issue.server_confirmed': 'confirmation du serveur',
  'fullAuth.report_issue.share_feedback': 'partager les commentaires',
  'fullAuth.report_issue.short_title': 'titre court',
  'fullAuth.report_issue.short_title_required': 'titre court (facultatif)',
  'fullAuth.report_issue.sign_in_again_before_sending_this_private_report':
    "nous devons vous signaler pour que vous signent de nouveau avant de soumettre ce rapport privé. Aucune information n'a été envoyée.",
  'fullAuth.report_issue.sign_in_required': 'signaler nécessaire',
  'fullAuth.report_issue.status': 'statut',
  'fullAuth.report_issue.steps_to_reproduce_optional':
    'pas de description du problème',
  'fullAuth.report_issue.steps_to_reproduce_optional_2':
    'pas de description du problème (facultatif)',
  'fullAuth.report_issue.support_reference': "Qu'attendiez-vous de Menta?",
  'fullAuth.report_issue.this_comes_from_where_you_opened':
    "Qu'est-ce qui est arrivé?",
  'fullAuth.report_issue.this_report_is_not_being_saved':
    "le rapport n'est pas enregistré",
  'fullAuth.report_issue.type': 'Type :',
  'fullAuth.report_issue.we_ll_show_a_support_reference_only_after_the_re':
    "Nous allons vous montrer une référence de soutien uniquement une fois que le rapport a été reçu. Si le premier essai est clair, essayez de nouveau utilise le même rapport, ce n'est pas la même demande donc il ne crée pas de duplicat.",
  'fullAuth.report_issue.what_did_you_expect_menta_to_do':
    "Qu'attendriez-vous de Menta?",
  'fullAuth.report_issue.what_happened': "Qu'est-ce qui s'est passé?",
  'fullAuth.report_issue.what_happened_required':
    "Quel que soit l'option que vous choisissez, il est impossible de changer l'expérience utilisateur de Menta en laissant le client en place.",
  'fullAuth.report_issue.what_i_would_change':
    'Que faisaient-vous, et que faisaient Menta?',
  'fullAuth.report_issue.what_were_you_doing_and_what_did_menta_show':
    'Que faire pour les Menta, nous allons aider à trouver le problème.',
  'fullAuth.report_issue.what_would_you_like_the_menta_team_to_know':
    'Votre brouillon restera sur ce téléphone jusqu’à ce que vous l’envoyiez.',
  'fullAuth.report_issue.will_help_support_find_the_error':
    'Vos commentaires aideront le soutien à trouver le problème.',
  'fullAuth.report_issue.your_draft_stays_on_this_phone_until_you_send_it':
    'Votre capture d’écran sera envoyée avec le rapport. Seul le personnel de soutien autorisé peut l’ouvrir.',
  'fullAuth.report_issue.your_feedback': 'vos commentaires',
  'fullAuth.report_issue.your_screenshot_will_be_sent_with_the_report_onl':
    'Votre capture d’écran sera envoyée avec le signalement. Seul le personnel de soutien autorisé pourra l’ouvrir.',
  'fullAuth.settings.a_compatible_update_is_downloaded_and_ready':
    'Un mise à jour compatible est téléchargée et prête.',
  'fullAuth.settings.account_control': 'Contrôle du compte',
  'fullAuth.settings.account_was_not_deleted': 'Le compte n’a pas été supprimé',
  'fullAuth.settings.active_view_or_manage_your_subscription':
    'Actif. Voir ou gérer votre abonnement.',
  'fullAuth.settings.ad_measurement':
    "Mesures d'advertising de mesure d'impact",
  'fullAuth.settings.ad_privacy_choices':
    "Choix de confidentialité de l'advertising",
  'fullAuth.settings.ad_privacy_choices_did_not_open':
    "Choix de confidentialité de l'advertising ne s'est pas ouvert",
  'fullAuth.settings.advanced_diagnostics': 'Diagnostiques avancés',
  'fullAuth.settings.advanced_diagnostics_are_off':
    'Diagnostiques avancés sont désactivés',
  'fullAuth.settings.advanced_diagnostics_are_on':
    'Diagnostiques avancés sont activés',
  'fullAuth.settings.advanced_diagnostics_are_still_off_check_your_co':
    'Diagnostiques avancés restent désactivés. Vérifiez votre connexion et réessayez.',
  'fullAuth.settings.ask_for_help_share_feedback_or_check_a_saved_rep':
    "Demandez de l'aide, partagez votre avis ou vérifiez un rapport sauvegardé.",
  'fullAuth.settings.back_to_you': 'Retour à Vous',
  'fullAuth.settings.before_you_delete_your_account':
    'Avant de supprimer votre compte',
  'fullAuth.settings.check_for_updates': 'Vérifiez pour des mises à jour',
  'fullAuth.settings.check_your_connection_and_try_again':
    'Vérifiez votre connexion et réessayez.',
  'fullAuth.settings.checking_for_updates': 'Vérifiant pour des mises à jour',
  'fullAuth.settings.checking_your_account': 'Vérifiant votre compte',
  'fullAuth.settings.checks_the_current_connection_and_known_account_':
    "Vérifiez l'état de connexion actuel et connexions connues pour le compte.",
  'fullAuth.settings.close_and_reopen_menta_to_apply_the_downloaded_u':
    'Repostez et ouvrez Menta pour appliquer la mise à jour téléchargée.',
  'fullAuth.settings.community_standards': 'Politiques de la communauté',
  'fullAuth.settings.confirmation': 'Confirmation',
  'fullAuth.settings.connect_before_deleting_your_account':
    'Retourner avant de supprimer votre compte',
  'fullAuth.settings.connect_to_check_this_phone':
    'Connectez-vous pour vérifier ce téléphone.',
  'fullAuth.settings.contact_support': 'Contactez le soutien',
  'fullAuth.settings.continue_to_sign_in': 'Continuer à vous connecter',
  'fullAuth.settings.could_not_check_your_account':
    'Peut-être impossible de vérifier votre compte',
  'fullAuth.settings.could_not_load_your_profile':
    "Peut-être impossible d'extraire votre profil.",
  'fullAuth.settings.deletion_checking_body':
    'Menta vérifie la propriété des groupes et Menta Pro. Rien n’a été supprimé.',
  'fullAuth.settings.deletion_check_unknown_body':
    'Menta n’a pas pu confirmer la propriété des groupes et Menta Pro. Rien n’a été supprimé.',
  'fullAuth.settings.deletion_check_offline_body':
    'Connectez-vous et réessayez. Rien n’a été supprimé.',
  'fullAuth.settings.delete_shared_groups_first':
    'Supprimez d’abord les groupes partagés',
  'fullAuth.settings.delete_shared_groups_first_body':
    'Menta ne peut pas encore transférer la propriété. Ouvrez chaque groupe ci-dessous et supprimez-le avant de supprimer votre compte.',
  'fullAuth.settings.delete_owned_group_member_one':
    '{count} autre membre. Supprimez ce groupe avant de supprimer votre compte.',
  'fullAuth.settings.delete_owned_group_members_many':
    '{count} autres membres. Supprimez ce groupe avant de supprimer votre compte.',
  'fullAuth.settings.deletion_group_clear':
    'Aucun groupe dont vous êtes propriétaire ne nécessite votre attention.',
  'fullAuth.settings.deletion_group_will_be_deleted':
    'Sera supprimé avec ce compte.',
  'fullAuth.settings.deletion_subscription_active_notice':
    'La suppression de votre compte n’annule pas cet abonnement.',
  'fullAuth.settings.deletion_subscription_inactive':
    'Aucun accès Menta Pro actif.',
  'fullAuth.settings.menta_pro_subscription': 'Abonnement Menta Pro',
  'fullAuth.settings.delete_account': 'Supprimer le compte',
  'fullAuth.settings.delete_account_will_be_available_when_this_check':
    'Supprimer le compte sera disponible une fois que cette vérification est finie.',
  'fullAuth.settings.deletion_result_unknown': "Resultat d'annulation inconnu",
  'fullAuth.settings.do_not_send_another_request_yet_check_whether_yo':
    'Ne pas envoyer une nouvelle demande tant que cette vérification est en cours. Vérifiez si vous pouvez encore vous connecter, ou contactez le soutien.',
  'fullAuth.settings.download_the_latest_compatible_menta_update':
    'Téléchargez la dernière mise à jour compatible de Menta.',
  'fullAuth.settings.extra_performance_measurements_start_now':
    "Mesures d'efficacité supplémentaires démarreront maintenant.",
  'fullAuth.settings.extra_performance_measurements_start_now_masked_':
    "Mesures d'efficacité supplémentaires démarreront maintenant. La prise enregistrement de diagnostic avancé commence sur les écrans eligible; Repostez pour appliquer toutes les configurations de Sentry de la prise enregistrement.",
  'fullAuth.settings.feedback_and_support': 'Commentaires et soutien',
  'fullAuth.settings.for_your_privacy_account_settings_stay_hidden_un':
    "Pour votre confidentialité, les configurations d'account restent cachées jusqu'à une nouvelle connexion.",
  'fullAuth.settings.help_and_feedback': 'Commentaires et soutien',
  'fullAuth.settings.how_menta_handles_your_data':
    'Comment Menta gère vos données.',
  'fullAuth.settings.keep_current_setting': 'Maintenir le paramètre actuel',
  'fullAuth.settings.keep_my_account': 'Restez connecté',
  'fullAuth.settings.label_did_not_open': "{label} ne s'est pas ouvert",
  'fullAuth.settings.leave_a_review': 'Évaluez les avis',
  'fullAuth.settings.leave_this_device_your_menta_account_stays_activ':
    'Quittez ce dispositif. Votre compte Menta demeure actif.',
  'fullAuth.settings.loading_account_specific_settings':
    "Chargement des paramètres d'enregistrement spécifique",
  'fullAuth.settings.measure_whether_meta_ads_helped_someone_use_ment':
    "Mesurez si les publicités de Meta ont aidé quelqu'un utiliser Menta",
  'fullAuth.settings.membership': 'Membre',
  'fullAuth.settings.menta_cannot_check_whether_you_still_own_a_group':
    "Menta ne peut pas vérifier si vous possédez encore un groupee. Vérifiez vos groupees avant de supprimer l'identité. Supprimer Menta ne supprime pas Menta Pro. Gardez la souscription en place avec Apple avant de supprimer Menta",
  'fullAuth.settings.menta_could_not_check_for_updates':
    "Menta ne peut pas s'actualiser",
  'fullAuth.settings.menta_could_not_delete_the_account_check_your_co':
    "Menta ne peut pas supprimer l'identité. Vérifiez votre connexion, puis réessayez.",
  'fullAuth.settings.menta_could_not_end_this_session_your_account_an':
    'Menta ne peut pas recharger',
  'fullAuth.settings.menta_could_not_restart': 'Menta ne peut pas charger',
  'fullAuth.settings.menta_is_checking_for_the_latest_compatible_upda':
    "Menta est en train d'attendre l'actualisation la plus récente compatible",
  'fullAuth.settings.menta_is_up_to_date': 'Menta est à jour',
  'fullAuth.settings.menta_pro': 'Menta Pro',
  'fullAuth.settings.menta_update_ready': "Menta est prêt pour l'actualisation",
  'fullAuth.settings.menta_will_continue_using_its_current_safe_versi':
    'Menta continuera à utiliser sa version sécurisée actuelle.',
  'fullAuth.settings.needs_attention': 'Trop important',
  'fullAuth.settings.nothing_has_been_deleted':
    "Aucune chose ne s'est supprimée",
  'fullAuth.settings.nothing_was_deleted_reconnect_then_try_again':
    "Aucune chose ne s'est supprimée. Rendez-vous, puis réessayez.",
  'fullAuth.settings.notifications': 'Notifications',
  'fullAuth.settings.offline': 'Hors ligne',
  'fullAuth.settings.open_when_connected': 'Ouvrez quand vous êtes connecté',
  'fullAuth.settings.opens_menta_pro_plans_purchase_restore_or_your_a':
    'Ouvrez les plans Menta, les bénéfices et le rétablissement des achats, ou votre plan actif',
  'fullAuth.settings.opens_sign_in_for_this_account':
    'Ouvrez le compte pour cette identité',
  'fullAuth.settings.optional_performance_measurements':
    'Vérifications options options',
  'fullAuth.settings.optional_performance_measurements_and_masked_dia':
    'Vérifications options options et enregistrement de diagnostic caché optionnel',
  'fullAuth.settings.ordinary_crash_reports_stay_on':
    "Aucune chose ne s'est supprimée lors de l'option de diagnostic avancé est non, les crash report ordinaires sont conservés",
  'fullAuth.settings.ordinary_crash_reports_stay_on_when_advanced_dia':
    "Aucune chose ne s'est supprimée lorsque le diagnostic avancé est non, les crash report ordinaires sont conservés",
  'fullAuth.settings.other_settings_are_still_available_try_loading_t':
    'Autres paramètres sont toujours disponibles. Rechargez le profil lorsque la connexion est prête',
  'fullAuth.settings.permanently_delete_your_account_and_menta_data':
    'Permanente suppression de votre identité et des données Menta',
  'fullAuth.settings.plans_benefits_and_restore_purchases':
    'Plans, bénéfices et rétablissement des achats',
  'fullAuth.settings.preferences': 'Options',
  'fullAuth.settings.press_restart_to_apply_the_downloaded_update':
    "Appuyez sur Rastreer pour appliquer l'actualisation téléchargée.",
  'fullAuth.settings.privacy_and_legal': 'Politique de confidentialité',
  'fullAuth.settings.privacy_policy': 'Politique de confidentialité',
  'fullAuth.settings.profile_details': 'Détails de profil',
  'fullAuth.settings.proof_reminders_reviews_and_group_updates':
    "Notifications d'authentification, avis et mises à jour des groupees.",
  'fullAuth.settings.read_menta_s_terms': 'Lisez les termes de Menta.',
  'fullAuth.settings.reopen_menta_to_stop_diagnostic_recording_ordina':
    "Rappelez-vous Menta pour arrêter l'enregistrement de diagnostic. Les crash report ordinaires sont conservés.",
  'fullAuth.settings.restarting_menta': 'Redémarrer Menta',
  'fullAuth.settings.review_choices_used_for_sponsor_videos':
    'Évaluer les choix utilisés pour les vidéos sponsor.',
  'fullAuth.settings.review_deletion_confirmation':
    'Évaluer la confirmation de supression',
  'fullAuth.settings.review_the_current_terms_and_when_you_accepted_t':
    "Évaluer les termes et conditions d'utilisation que vous avez acceptés.",
  'fullAuth.settings.rules_for_promises_proof_and_groups':
    'Règles pour les promesses, la preuve et les groupees.',
  'fullAuth.settings.session': 'Session',
  'fullAuth.settings.settings': 'Paramètres',
  'fullAuth.settings.share_your_experience_and_help_others_discover_m':
    'Partagez votre expérience et aidez les autres à découvrir Menta.',
  'fullAuth.settings.sign_in_again': "Réinitialiser l'identifiant",
  'fullAuth.settings.sign_in_again_before_deleting_your_account':
    "Réinitialiser l'identifiant avant de supprimer votre compte.",
  'fullAuth.settings.sign_in_again_to_see_settings':
    "Réinitialiser l'identifiant pour voir les paramètres.",
  'fullAuth.settings.sign_in_needed': 'Identifiants nécessaires',
  'fullAuth.settings.sign_out': 'Déconnexion',
  'fullAuth.settings.small_performance_impact': 'Impression légère',
  'fullAuth.settings.some_destinations_need_a_connection':
    'Certaines destinations nécessitent une connexion.',
  'fullAuth.settings.terms_of_use': 'Conditions d’utilisation de service',
  'fullAuth.settings.terms_you_accepted':
    'Conditions d’utilisation que vous avez acceptés',
  'fullAuth.settings.the_downloaded_update_will_open_automatically':
    "L'apport téléchargé ouvert automatiquement.",
  'fullAuth.settings.the_next_screen_asks_you_to_type_delete_before_m':
    "La prochaine écran demande de taper DELETE avant que Menta ne s'engage dans la demande.",
  'fullAuth.settings.this_can_use_a_small_amount_of_extra_processing_':
    "Ce peut utiliser une petite quantité d'effort d'application, de batterie et de données mobiles pendant que Menta est ouvert. Le recording commence uniquement sur les écrans éligibles. Recommencez Menta après avoir le désactivé pour arrêter le Sentry recording.",
  'fullAuth.settings.this_device_has_the_latest_compatible_update':
    'Ce appareil a la dernière mise à jour compatible.',
  'fullAuth.settings.to_confirm': 'Pour confirmer',
  'fullAuth.settings.tries_to_load_the_signed_in_profile_again':
    'Tentez de charger le profils signés de nouveau.',
  'fullAuth.settings.try_again_in_a_moment_or_open_the_link_from_the_':
    "Réessayez d'un moment à l'autre, ou ouvrez le lien de l'App Store.",
  'fullAuth.settings.try_again_later_optional_ads_stay_unavailable_un':
    "Réessayez plus tard. Les publicités restent indisponibles jusqu'à ce que vous réévaluez ces choix.",
  'fullAuth.settings.try_connection_again': 'Réessayez la connexion',
  'fullAuth.settings.try_loading_profile_again': 'Tentez de charger le profils',
  'fullAuth.settings.try_loading_your_name_and_profile_photo_again':
    'Tentez de charger votre nom et photo de profil de nouveau.',
  'fullAuth.settings.try_the_account_check_again_before_you_delete_an':
    'Tentez de réévaluer votre compte avant de supprimer quelque chose.',
  'fullAuth.settings.turn_off_advanced_diagnostics':
    "Désactiver l'advanced diagnostics",
  'fullAuth.settings.turn_on_advanced_diagnostics':
    "Activer l'advanced diagnostics",
  'fullAuth.settings.type': 'Type',
  'fullAuth.settings.type_delete_to_confirm_account_deletion':
    'Type DELETE pour confirmer la suppression de compte',
  'fullAuth.settings.update_checks_are_unavailable':
    'Vérification des vérifications sont indisponibles',
  'fullAuth.settings.while_enabled_this_can_use_a_small_amount_of_ext':
    "Toutefois, cela peut utiliser une petite quantité d'effort d'application, de batterie et de données mobiles pendant que Menta est ouvert.",
  'fullAuth.settings.you_are_still_signed_in': 'Vous êtes toujours connecté',
  'fullAuth.settings.your_account_stays_open_until_menta_confirms_the':
    "Votre compte reste ouvert jusqu'à ce que Menta confirme la suppression.",
  'fullAuth.settings.your_account_was_deleted': 'Votre compte a été supprimé.',
  'fullAuth.settings.your_choice_was_not_saved':
    "Votre choix n'a pas été enregistré",
  'fullAuth.settings.your_saved_settings_are_still_here':
    'Votre paramètres de sauvegarde sont toujours ici.',
  'fullAuth.settings.your_support_drafts_for_this_account_were_remove':
    'Votre soutien pour cette compte a été supprimé.',
  'fullAuth.support.change_menta_permissions_on_this_phone':
    'Changez les autorisations Menta sur ce téléphone',
  'fullAuth.support.check_app_and_connection':
    "Veillez à l'application et à la connexion",
  'fullAuth.support.check_the_apple_account_used_for_the_original_pu':
    "Veillez à l'Apple Account utilisé pour la précédente achat. Si Apple montre une charge, rappelez la suite avant d'acheter une nouvelle fois.",
  'fullAuth.support.checking_private_report_drafts':
    'Vérifier les répertoires de privés',
  'fullAuth.support.checking_purchases': 'Vérifier les achats',
  'fullAuth.support.choose_what_you_need_you_can_review_everything_b':
    "Choisissez ce que vous aimeriez. Vous pouvez examiner tout avant de l'envoyer.",
  'fullAuth.support.connection_available': 'Connexion disponible',
  'fullAuth.support.connection_check_did_not_finish':
    "La vérification de la connexion ne s'est pas terminée",
  'fullAuth.support.could_not_check_earlier_purchases':
    'Peut pas vérifier les achats plus tôt',
  'fullAuth.support.do_not_buy_it_again_while_this_check_continues':
    'Ne répondez pas à ce problème pendant cette vérification continue',
  'fullAuth.support.find_an_earlier_menta_pro_purchase':
    'Trouvez un achat Menta Pro plus tôt',
  'fullAuth.support.hide_more_help': "Désactivez plus d'aide",
  'fullAuth.support.looking_for_an_earlier_menta_pro_purchase':
    'Trouvez un achat Menta Pro plus tôt',
  'fullAuth.support.menta_appears_offline': 'Menta semble en dehors du réseau',
  'fullAuth.support.menta_pro_is_active_again': 'Menta Pro semble activé',
  'fullAuth.support.menta_pro_is_still_being_checked':
    'Menta Pro semble être en vérification',
  'fullAuth.support.more_help': "Plus d'aide",
  'fullAuth.support.no_matching_purchase_was_found':
    "Aucun achat ou modification n'a été trouvé",
  'fullAuth.support.nothing_was_purchased_or_changed_check_the_conne':
    'Tout a été acheté ou changé. Vérifiez votre connexion et réessayez plus tard.',
  'fullAuth.support.open_phone_settings':
    'Ouvrez les paramètres de votre téléphone',
  'fullAuth.support.opens_a_separate_support_report':
    'Ouvrez un rapport de soutien séparé',
  'fullAuth.support.opens_sign_in_before_starting_a_private_report':
    "Ouvrez une session d'identification avant de commencer un rapport privé",
  'fullAuth.support.other_help': "Plus d'aide",
  'fullAuth.support.restore_purchases': 'Rétablir les achats',
  'fullAuth.support.saved_on_this_phone_and_still_waiting_to_be_sent':
    'sauvegardé sur ce téléphone et attendu pour être envoyé',
  'fullAuth.support.saved_reports': 'Rapports sauvegardés',
  'fullAuth.support.see_app_version_connection_and_saved_proof':
    "Voir la version de l'application, la connexion et les preuves sauvegardées",
  'fullAuth.support.share_feedback': 'Partagez des commentaires',
  'fullAuth.support.sign_in_required': "Session d'identification nécessaire",
  'fullAuth.support.sign_in_to_report_an_issue':
    "Session d'identification pour signaler un problème",
  'fullAuth.support.support': 'Soutien',
  'fullAuth.support.support_drafts_stay_private_to_the_account_that_':
    "Les soutiens pour la version Menta ne seront pas divulgués à cette compte. C'est une session d'identification avant de commencer un nouveau rapport",
  'fullAuth.support.this_does_not_start_a_new_purchase_or_charge_thi':
    "Aucune modification n'a été faite pour Menta. Ouvrez les paramètres de votre téléphone manuellement puis revenez à l'application",
  'fullAuth.support.version_appversion_savedcopy_nothing_changed_try':
    "Version {appVersion}. {savedCopy}. Aucune modification n'a été faite. Essayez de vérifier les preuves à nouveau quand votre connexion s'améliore",
  'fullAuth.support.version_appversion_savedcopy_saved_proof_stays_o':
    "Version {appVersion}. {savedCopy}. Aucune modification n'a été faite. Les preuves sauvegardées restent sur ce téléphone jusqu'à ce que Menta confirme leur envoi",
  'fullAuth.support.your_earlier_purchase_is_active_on_this_account':
    'Votre achat plus tôt est actif sur cette compte',
  'fullAuth.system_settings.back_to_support': 'Retournez au soutien',
  'fullAuth.system_settings.change_notification_camera_photo_or_ad_measureme':
    "Changez les autorisations de notification, caméra, photo ou mesure d'adresses sur vos paramètres de téléphone. Menta ne peut pas changer ou confirmer ces autorisations depuis cette écran.",
  'fullAuth.system_settings.nothing_changed_in_menta_open_your_phone_setting':
    "Aucune modification a été faite pour Menta. Ouvrez les paramètres de votre téléphone manuellement, revenez à l'application et retournez là où vous aviez commencé à utiliser l'application.",
  'fullAuth.system_settings.open_phone_settings':
    'Ouvrez les paramètres de téléphone',
  'fullAuth.system_settings.opening_phone_settings_does_not_confirm_that_a_p':
    "L'ouverture des paramètres n'assure pas que la autorisation a changé.",
  'fullAuth.system_settings.phone_settings': 'Paramètres de téléphone',
  'fullAuth.system_settings.phone_settings_could_not_open':
    'Paramètres de téléphone ne peuvent pas être ouverts',
  'fullAuth.system_settings.return_when_you_re_done':
    'Retour quand vous en avez fini',
  'fullAuth.tabs_profile.active_and_past_promises':
    'Promesses actives et passées',
  'fullAuth.tabs_profile.active_promises': 'Promesses actives',
  'fullAuth.tabs_profile.activepromisecount_active_promises_currentstreak':
    '{activePromiseCount} promesses actives, série de {currentStreak} jours, durée de {length} jours.',
  'fullAuth.tabs_profile.change_profile_photo':
    'Modifiez votre photo de profil',
  'fullAuth.tabs_profile.choose_one_thing_to_follow_through_on_it_will_ap':
    'Choisissez une chose à tenir. Elle apparaîtra avec la preuve que vous avez choisie.',
  'fullAuth.tabs_profile.create_a_promise': 'Créez une promesse',
  'fullAuth.tabs_profile.current_reward_terms_and_your_link':
    'Règles actuelles et votre lien',
  'fullAuth.tabs_profile.day_streak': 'Suite de jours',
  'fullAuth.tabs_profile.edit_profile': 'Modifier votre profil',
  'fullAuth.tabs_profile.for_your_privacy_menta_hides_the_previous_accoun':
    'Pour votre confidentialité, Menta masque les derniers détails de ce compte. Vous pouvez toujours modifier votre profil et utiliser les autres actions du profil.',
  'fullAuth.tabs_profile.groups': 'Groupes',
  'fullAuth.tabs_profile.invite': 'Invitez',
  'fullAuth.tabs_profile.invite_friends': 'Invitez des amis',
  'fullAuth.tabs_profile.loading_your_profile': 'Chargement de votre profil',
  'fullAuth.tabs_profile.make_your_first_promise': 'Créez la première promesse',
  'fullAuth.tabs_profile.menta_kept_the_last_details_saved_for_this_accou':
    'Menta a conservé les derniers détails enregistrés pour ce compte',
  'fullAuth.tabs_profile.momenta': 'Momenta',
  'fullAuth.tabs_profile.no_promises_yet': 'Aucune promesse encore',
  'fullAuth.tabs_profile.open_saved_type_invite':
    'Ouvrez une invite sauvegardée {type}',
  'fullAuth.tabs_profile.open_the_invite_to_review_it_before_joining':
    'Ouvrez l’invitation pour l’examiner avant de la rejoindre.',
  'fullAuth.tabs_profile.opens_your_invite_link_and_the_current_reward_te':
    "Ouvrez l'invite et les règles actuelles d'attribution.",
  'fullAuth.tabs_profile.personal_promises': 'Promesses personnelles',
  'fullAuth.tabs_profile.profile_details_may_be_out_of_date':
    'Les détails personnels de profil peuvent ne pas être à jour',
  'fullAuth.tabs_profile.progress_and_rewards': 'Progression et récompenses',
  'fullAuth.tabs_profile.progress_starts_with_proof':
    'La progression commence avec une preuve',
  'fullAuth.tabs_profile.saved': 'Sauvegardé',
  'fullAuth.tabs_profile.sign_in_again': 'Reconnectez-vous',
  'fullAuth.tabs_profile.sign_in_to_see_you':
    'Connectez-vous pour voir votre profil',
  'fullAuth.tabs_profile.streaks_and_progress_appear_after_you_send_proof':
    'Les séries et la progression apparaissent après l’envoi d’une preuve pour une promesse active.',
  'fullAuth.tabs_profile.the_last_saved_promise_and_group_counts_are_stil':
    'Les dernières promesses et les groupes enregistrés sont toujours affichés. D’autres actions du profil restent disponibles.',
  'fullAuth.tabs_profile.wallet_shop_and_items':
    'Portefeuille, boutique et éléments',
  'fullAuth.tabs_profile.you': 'Vous',
  'fullAuth.tabs_profile.your_progress_may_be_out_of_date':
    'Votre progression peut ne pas être à jour',
  'fullAuth.tabs_profile.your_rhythm': 'Votre rythme',
  'fullAuth.residual.legal.accepted':
    'Vous avez accepté les versions actuelles des documents pour ce compte.',
  'fullAuth.residual.legal.body_create':
    'Lisez les trois courts documents ci-dessous, puis acceptez-les avant de créer une promesse.',
  'fullAuth.residual.legal.body_post_auth':
    'Lisez les trois courts documents ci-dessous, puis acceptez-les une fois pour ce compte.',
  'fullAuth.residual.legal.body_settings':
    'Examinez les documents actuels de votre compte.',
  'fullAuth.residual.legal.body_update':
    'Lisez les documents mis à jour, puis acceptez les nouvelles versions.',
  'fullAuth.residual.legal.changed':
    'Les documents ont changé pendant que cet écran était ouvert. Examinez les versions actuelles et acceptez-les de nouveau.',
  'fullAuth.residual.legal.continue_create': 'Continuer pour créer',
  'fullAuth.residual.legal.continue_menta': 'Continuer vers Menta',
  'fullAuth.residual.legal.document_open_failed':
    '{label} ne s’est pas ouvert. Réessayez.',
  'fullAuth.residual.legal.leave_available':
    'Vous pouvez partir sans accepter. Votre compte et vos promesses existantes restent accessibles.',
  'fullAuth.residual.legal.leave_blocked':
    'Vous pouvez partir sans accepter. Votre compte et votre contenu existant restent accessibles, mais vous ne pouvez pas créer de nouvelle promesse avant d’avoir accepté les versions actuelles.',
  'fullAuth.residual.legal.load_offline':
    'Connectez-vous à Internet pour vérifier et accepter les documents actuels.',
  'fullAuth.residual.legal.load_online':
    'Menta n’a pas pu charger les documents actuels. Réessayez avant de créer une nouvelle promesse.',
  'fullAuth.residual.legal.return_settings': 'Retour aux paramètres',
  'fullAuth.residual.legal.save_connection':
    'La connexion a pris fin avant que Menta enregistre votre accord. Reconnectez-vous et réessayez.',
  'fullAuth.residual.legal.save_offline':
    'Connectez-vous à Internet pour enregistrer votre accord. Il n’a pas été enregistré hors ligne.',
  'fullAuth.residual.legal.save_online':
    'Menta n’a pas pu enregistrer votre accord. Rien d’autre n’a changé. Réessayez.',
  'fullAuth.residual.legal.sign_in_again':
    'Reconnectez-vous pour examiner ces documents.',
  'fullAuth.residual.legal.title_continue': 'Avant de continuer',
  'fullAuth.residual.legal.title_create': 'Avant de créer',
  'fullAuth.residual.legal.title_settings': 'Examinez vos documents Menta',
  'fullAuth.residual.legal.title_update': 'Examinez les changements',
  'fullAuth.residual.notifications.auto_save':
    'Les changements sont enregistrés automatiquement.',
  'fullAuth.residual.notifications.load_failed':
    'Les paramètres de notifications n’ont pas pu être chargés. Vos choix enregistrés restent inchangés.',
  'fullAuth.residual.notifications.off_save':
    'Les choix sont enregistrés ici. Les notifications restent désactivées sur ce téléphone.',
  'fullAuth.residual.notifications.sign_in_again':
    'Reconnectez-vous pour gérer vos paramètres de notifications.',
  'fullAuth.residual.notifications.still_apply':
    'Vos choix de notifications enregistrés pourraient toujours s’appliquer. Réessayez ou retournez aux paramètres.',
  'fullAuth.residual.oauth.apple_sign_in_fallback':
    'La connexion avec Apple a échoué. Réessayez ou utilisez votre courriel.',
  'fullAuth.residual.paper_auth.account_email':
    'Entrez le courriel de ce compte Menta.',
  'fullAuth.residual.paper_auth.already_have_account':
    'Vous avez déjà un compte?',
  'fullAuth.residual.paper_auth.choose_username':
    'Choisissez le nom d’utilisateur que les gens verront dans Menta.',
  'fullAuth.residual.paper_auth.confirm_password':
    'Confirmez votre mot de passe.',
  'fullAuth.residual.paper_auth.create_account_action': 'Créer un compte',
  'fullAuth.residual.paper_auth.create_password': 'Créez un mot de passe.',
  'fullAuth.residual.paper_auth.creating_account_action': 'Création du compte…',
  'fullAuth.residual.paper_auth.duplicate_email':
    'Ce courriel est déjà associé à un compte Menta.',
  'fullAuth.residual.paper_auth.enter_password': 'Entrez votre mot de passe.',
  'fullAuth.residual.paper_auth.error_state':
    'Votre promesse est toujours là. Corrigez le champ en surbrillance ou connectez-vous plutôt.',
  'fullAuth.residual.paper_auth.fallback_create':
    'Nous n’avons pas pu créer ce compte.',
  'fullAuth.residual.paper_auth.fallback_sign_in':
    'Nous n’avons pas pu vous connecter avec ces renseignements.',
  'fullAuth.residual.paper_auth.minimum_three_characters':
    'Utilisez au moins 3 caractères.',
  'fullAuth.residual.paper_auth.new_to_menta': 'Nouveau sur Menta?',
  'fullAuth.residual.paper_auth.password_minimum':
    'Utilisez au moins {length} caractères.',
  'fullAuth.residual.paper_auth.passwords_match':
    'Les deux champs de mot de passe doivent correspondre.',
  'fullAuth.residual.paper_auth.return_to_promise':
    'Retourner à votre première promesse',
  'fullAuth.residual.paper_auth.sign_in_action': 'Se connecter',
  'fullAuth.residual.paper_auth.signing_in_action': 'Connexion…',
  'fullAuth.residual.paper_auth.switch_create': 'Créer un compte',
  'fullAuth.residual.paper_auth.switch_sign_in': 'Se connecter',
  'fullAuth.residual.paper_auth.username_characters':
    'Utilisez seulement des lettres, des chiffres ou des traits de soulignement dans votre nom d’utilisateur.',
  'fullAuth.residual.paper_auth.valid_email':
    'Entrez une adresse courriel valide.',
  'fullAuth.residual.paper_reset.another_link_available':
    'Un autre lien est disponible à {label}.',
  'fullAuth.residual.paper_reset.back_to_sign_in': 'Retour à la connexion',
  'fullAuth.residual.paper_reset.password_changes_after_link':
    'Votre mot de passe change seulement après l’utilisation du lien.',
  'fullAuth.residual.paper_reset.remembered_it': 'Vous vous en êtes souvenu?',
  'fullAuth.residual.paper_reset.send_another_link': 'Envoyer un autre lien',
  'fullAuth.residual.paper_reset.send_another_link_in':
    'Envoyer un autre lien dans {countdown}',
  'fullAuth.residual.paper_reset.sending_another_link':
    'Envoi d’un autre lien…',
  'fullAuth.residual.paper_reset.sending_link': 'Envoi du lien…',
  'fullAuth.residual.report.category_app_issue': 'Problème avec l’application',
  'fullAuth.residual.report.category_group': 'Groupe',
  'fullAuth.residual.report.category_member': 'Membre',
  'fullAuth.residual.report.category_promise': 'Promesse',
  'fullAuth.residual.report.category_proof': 'Preuve',
  'fullAuth.residual.report.check_description':
    'Relisez-le. Tout ce qui suit est facultatif.',
  'fullAuth.residual.report.check_heading': 'Vérifiez, puis envoyez',
  'fullAuth.residual.report.feedback_description':
    'Dites-nous ce qui fonctionne, ce qui ne fonctionne pas ou ce qui rendrait Menta meilleur.',
  'fullAuth.residual.report.feedback_heading': 'Que devrions-nous savoir?',
  'fullAuth.residual.report.feedback_label': 'Commentaires',
  'fullAuth.residual.report.feedback_title': 'Commentaires sur Menta',
  'fullAuth.residual.report.form_label': 'ce formulaire',
  'fullAuth.residual.report.included_feedback': 'Inclus avec les commentaires',
  'fullAuth.residual.report.included_report': 'Inclus avec le signalement',
  'fullAuth.residual.report.issue_description':
    'Dites-nous ce que vous faisiez et ce que Menta a fait. Ces détails aident l’équipe de soutien à examiner le problème.',
  'fullAuth.residual.report.issue_heading': 'Qu’est-ce qui n’a pas fonctionné?',
  'fullAuth.residual.report.message_label': 'Message',
  'fullAuth.residual.report.other_account':
    'Ce signalement appartient à un autre compte',
  'fullAuth.residual.report.received_content':
    'Menta a reçu ce signalement. Le personnel de sécurité autorisé peut examiner le contenu signalé, y compris le contenu de groupes sur invitation. Les autres membres ne peuvent pas voir qui a fait le signalement.',
  'fullAuth.residual.report.received_feedback':
    'Le soutien a reçu vos commentaires. Votre preuve, votre série et votre historique de groupe restent inchangés.',
  'fullAuth.residual.report.received_report':
    'Le soutien a reçu votre signalement. Votre preuve, votre série et votre historique de groupe restent inchangés pendant l’examen.',
  'fullAuth.residual.report.report_context_label': 'le signalement',
  'fullAuth.residual.report.report_label': 'Signaler',
  'fullAuth.residual.report.return_description':
    'Retournez au soutien, puis commencez un nouveau signalement pour ce compte.',
  'fullAuth.residual.report.screenshot_feedback':
    'Ajoutez une capture d’écran si elle aide à expliquer vos commentaires.',
  'fullAuth.residual.report.screenshot_issue':
    'Ajoutez une capture d’écran qui aide le soutien à voir le problème.',
  'fullAuth.residual.report.sign_in_description':
    'Reconnectez-vous avant d’ouvrir ce signalement. Les brouillons restent privés au compte qui les a créés.',
  'fullAuth.residual.report.sign_in_required': 'Connexion requise',
  'fullAuth.residual.report.status_queued': 'En file d’attente',
  'fullAuth.residual.report.status_received': 'Reçu',
  'fullAuth.residual.report.what_happened_label': 'Que s’est-il passé?',
  'fullAuth.residual.settings.advanced_basic_body':
    'Si vous activez cette option, Menta partage des mesures de performance supplémentaires avec Sentry. Cela n’active pas les publicités ni le suivi entre applications.',
  'fullAuth.residual.settings.advanced_full_body':
    'Si vous activez cette option, Menta partage des mesures de performance échantillonnées avec Sentry. La relecture de session Amplitude fonctionne séparément; le texte, les champs de saisie et les images sont masqués. Cela n’active pas les publicités ni le suivi entre applications.',
  'fullAuth.residual.settings.advanced_prompt':
    'Partager les diagnostics avancés?',
  'fullAuth.residual.settings.advanced_title':
    'Les diagnostics avancés sont activés',
  'fullAuth.residual.settings.check_value': 'Vérifier',
  'fullAuth.residual.settings.checking_loading': 'Vérification…',
  'fullAuth.residual.settings.loading_value': 'Chargement…',
  'fullAuth.residual.settings.off_value': 'Désactivé',
  'fullAuth.residual.settings.offline_value': 'Hors ligne',
  'fullAuth.residual.settings.on_value': 'Activé',
  'fullAuth.residual.settings.opening_value': 'Ouverture…',
  'fullAuth.residual.settings.restart_loading': 'Redémarrage…',
  'fullAuth.residual.settings.restart_value': 'Redémarrer',
  'fullAuth.residual.settings.retry_value': 'Réessayer',
  'fullAuth.source.accountability.group_next': 'Créer ensuite un groupe',
  'fullAuth.source.accountability.group_setup_next':
    'Créer ensuite un nouveau groupe',
  'fullAuth.source.accountability.just_me': 'Moi seulement',
  'fullAuth.source.error.account_changed':
    'Votre compte a changé. Rouvrez l’intégration pour continuer.',
  'fullAuth.source.error.claim_draft':
    'Menta vous a connecté, mais n’a pas pu récupérer ce brouillon. Rouvrez l’intégration pour le récupérer.',
  'fullAuth.source.error.confirm_documents':
    'Confirmez les documents requis avant de continuer.',
  'fullAuth.source.error.draft_safe':
    'Votre brouillon est toujours en sécurité sur ce téléphone. Réessayez.',
  'fullAuth.source.error.first_promise_lookup':
    'Menta n’a pas pu confirmer si votre première promesse existe déjà. Votre brouillon est en sécurité. Réessayez avant de la créer.',
  'fullAuth.source.error.incomplete_activation_receipt':
    'Menta a renvoyé un reçu d’activation incomplet. Votre brouillon est en sécurité. Réessayez avant de le créer.',
  'fullAuth.source.error.incomplete_promise_response':
    'La réponse concernant votre promesse est incomplète. Ne la créez pas de nouveau. Rouvrez Menta pour récupérer cette promesse.',
  'fullAuth.source.error.incomplete_recovered_promise':
    'Menta a renvoyé un reçu d’activation incomplet. Votre brouillon est en sécurité. Réessayez avant de le créer.',
  'fullAuth.source.error.next_step':
    'Menta n’a pas pu préparer votre prochaine étape. Votre promesse est en sécurité. Réessayez de continuer.',
  'fullAuth.source.error.promise_safe':
    'Votre promesse est en sécurité. Réessayez de continuer.',
  'fullAuth.source.error.provider_sign_in':
    'La connexion avec {providerName} a échoué.',
  'fullAuth.source.error.referral_code_invalid':
    'Entrez le code de 32 caractères ou ignorez cette étape.',
  'fullAuth.source.error.referral_code_mismatch':
    'Un autre code de recommandation est déjà enregistré pour ce compte. Menta a restauré ce code pour que vous puissiez continuer ou l’ignorer.',
  'fullAuth.source.error.referral_code_not_added':
    'Ce code n’a pas pu être ajouté à votre compte. Vérifiez-le ou ignorez cette étape.',
  'fullAuth.source.error.referral_not_confirmed':
    'Menta n’a pas pu confirmer le code de recommandation enregistré. Réessayez avant de créer votre promesse.',
  'fullAuth.source.error.referral_skip_unconfirmed':
    'Menta n’a pas pu confirmer que la recommandation a été ignorée. Réessayez avant de créer votre promesse.',
  'fullAuth.source.error.referral_unavailable':
    'Menta n’a pas pu confirmer le code. Il est toujours enregistré sur ce téléphone. Réessayez avant de créer votre promesse.',
  'fullAuth.source.error.sign_in_session':
    'La connexion n’a pas renvoyé de session authentifiée.',
  'fullAuth.source.example.application': 'Envoyer la demande avant 17 h',
  'fullAuth.source.example.read': 'Lire dix pages avant de dormir',
  'fullAuth.source.example.walk': 'Marcher 20 minutes après le travail',
  'fullAuth.source.momenta.added': 'Ajout de {amount}',
  'fullAuth.source.momenta.already_confirmed': '{amount} déjà confirmé',
  'fullAuth.source.momenta.no_new_credit': 'Aucun nouveau crédit',
  'fullAuth.source.proof.choose': 'Choisir une preuve',
  'fullAuth.source.proof.note': 'Preuve écrite',
  'fullAuth.source.proof.photo': 'Preuve photo',
  'fullAuth.source.proof.video': 'Preuve vidéo',
  'fullAuth.source.receipt.see_today': 'Voir dans Aujourd’hui',
  'fullAuth.source.referral.accepted': 'Votre invitation a été enregistrée.',
  'fullAuth.source.referral.already_accepted':
    'Cette invitation a déjà été enregistrée pour votre compte.',
  'fullAuth.source.referral.both_rewarded':
    'Vous avez reçu {referredRewardAmount} Momenta. La personne qui vous a invité a reçu {inviterRewardAmount}.',
  'fullAuth.source.referral.inviter_capped':
    'Vous avez reçu {referredRewardAmount} Momenta. La personne qui vous a invité a atteint la limite annuelle de récompenses.',
  'fullAuth.source.referral.not_added':
    'Aucune récompense de recommandation n’a été ajoutée.',
  'fullAuth.source.referral.program_disabled':
    'Votre invitation a été enregistrée. Les récompenses de recommandation sont désactivées pour le moment.',
  'fullAuth.source.referral.unavailable':
    'Votre invitation est toujours enregistrée sur ce téléphone pour une autre tentative.',
  'fullAuth.source.submission_text':
    'Dites ce que vous avez accompli et ajoutez la preuve d’aujourd’hui.',
  'fullAuth.source.validation.action_required':
    'Écrivez l’action que vous voulez prouver.',
  'fullAuth.source.verification_description':
    'Ajoutez une preuve claire qui montre que vous avez tenu votre promesse.',
} as const satisfies Pick<EnglishCatalogue, FullAuthAccountKey>;
