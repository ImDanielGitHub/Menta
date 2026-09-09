import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type FullAuthAccountKey = Extract<keyof EnglishCatalogue, `fullAuth.${string}`>;

export const fullAuthAccountFrFR = {
  'fullAuth.shared.try_again': 'Réessayer',
  'fullAuth.support.untitled_report': 'Rapport sans titre',
  'fullAuth.onboarding.promise_setup_step_one':
    'Configuration de la promesse · 1 sur 2',
  'fullAuth.onboarding.promise_setup_step_two':
    'Configuration de la promesse · 2 sur 2',
  'fullAuth.component_onboarding_paperauthreset.your_account_email':
    'votre adresse e‑mail de compte',
  'fullAuth.shared.back_to_you': 'Retour à Vous',
  'fullAuth.shared.promise': 'Promesse',
  'fullAuth.shared.terms': 'Conditions',
  'fullAuth.shared.back_to_settings': 'Retour aux réglages',
  'fullAuth.shared.other_sign_in_options': 'Autres options de connexion',
  'fullAuth.shared.retry_profile': 'Réessayer le profil',
  'fullAuth.shared.refresh_progress': 'Actualiser la progression',
  'fullAuth.shared.check_connection_again': 'Vérifier à nouveau la connexion',
  'fullAuth.shared.sign_in': 'Se connecter',
  'fullAuth.support.feedback': 'Commentaires',
  'fullAuth.support.promise_report': 'Rapport de promesse',
  'fullAuth.support.group_report': 'Rapport de groupe',
  'fullAuth.support.proof_report': 'Rapport de preuve',
  'fullAuth.support.app_issue': "Problème d'application",
  'fullAuth.support.checking_saved_proof':
    'Vérification de la preuve enregistrée sur ce téléphone.',
  'fullAuth.support.saved_proof_count_unavailable':
    'Nombre de preuves enregistrées indisponible.',
  'fullAuth.support.no_proof_waiting':
    "Aucune preuve n'est en attente sur ce téléphone.",
  'fullAuth.support.proof_count_saved':
    '{count} {proofLabel} enregistrés sur ce téléphone.',
  'fullAuth.support.proof_is': 'la preuve est',
  'fullAuth.support.proofs_are': 'les preuves sont',
  'fullAuth.support.saved_proof_waiting_to_be_sent':
    "{count} {proofLabel} enregistrés sur ce téléphone et toujours en attente d'envoi.",
  'fullAuth.email_auth.create_account': 'Créer un compte',
  'fullAuth.email_auth.sign_in': 'Se connecter',
  'fullAuth.email_auth.already_have_account': 'Vous avez déjà un compte ?',
  'fullAuth.email_auth.new_to_menta': 'Nouveau sur Menta ?',
  'fullAuth.email_auth.offline_reconnect':
    'Vous êtes hors ligne. Reconnectez‑vous et réessayez.',
  'fullAuth.email_auth.too_many_attempts':
    'Trop de tentatives. Attendez un moment, puis réessayez.',
  'fullAuth.email_auth.could_not_sign_in':
    'Impossible de se connecter. Vérifiez votre adresse e‑mail et votre mot de passe, puis réessayez.',
  'fullAuth.email_auth.could_not_create_account':
    'Impossible de créer votre compte. Vérifiez votre connexion, puis réessayez.',
  'fullAuth.email_auth.enter_password': 'Saisissez votre mot de passe.',
  'fullAuth.email_auth.create_password': 'Créez un mot de passe.',
  'fullAuth.email_auth.confirm_your_password': 'Confirmez votre mot de passe.',
  'fullAuth.email_auth.password_minimum':
    'Utilisez au moins {length} caractères.',
  'fullAuth.email_auth.password_mismatch':
    'Les mots de passe ne correspondent pas.',
  'fullAuth.email_auth.choose_username': "Choisissez un nom d'utilisateur.",
  'fullAuth.email_auth.minimum_three_characters':
    'Utilisez au moins 3 caractères.',
  'fullAuth.email_auth.username_characters_only':
    'Utilisez uniquement des lettres, chiffres ou tirets bas.',
  'fullAuth.email_auth.account_email':
    "Saisissez l'e‑mail de votre compte Menta.",
  'fullAuth.email_auth.valid_email': 'Saisissez une adresse e‑mail valide.',
  'fullAuth.email_auth.passwords_need_to_match':
    'Les mots de passe doivent correspondre.',
  'fullAuth.password_recovery.confirm_new_password':
    'Confirmez votre nouveau mot de passe.',
  'fullAuth.password_recovery.passwords_mismatch':
    'Les mots de passe ne correspondent pas.',
  'fullAuth.password_recovery.minimum_password_length':
    'Utilisez au moins {length} caractères.',
  'fullAuth.password_recovery.could_not_change_now':
    'Nous ne pouvons pas changer votre mot de passe pour le moment.',
  'fullAuth.password_recovery.sign_in_with_new_password_draft':
    'Connectez‑vous avec votre nouveau mot de passe, puis revenez à votre brouillon.',
  'fullAuth.password_recovery.sign_in_with_new_password':
    'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
  'fullAuth.language_settings.system_accessibility':
    'Utiliser la langue du téléphone. {systemSubtitle}',
  'fullAuth.forgot_password.enter_email_tied_to_account':
    "Saisissez l'e‑mail associé à votre compte Menta.",
  'fullAuth.forgot_password.enter_valid_email':
    'Saisissez une adresse e‑mail valide.',
  'fullAuth.forgot_password.could_not_send_reset_email':
    "Impossible d'envoyer l'e‑mail de réinitialisation. Vérifiez votre connexion et réessayez.",
  'fullAuth.password_recovery_callback.checking_secure_reset_link':
    'Vérification de votre lien sécurisé de réinitialisation…',
  'fullAuth.password_recovery_callback.reset_link_verified':
    'Lien de réinitialisation vérifié.',
  'fullAuth.report_issue.send_feedback': 'Envoyer des commentaires',
  'fullAuth.report_issue.send_report': 'Envoyer le rapport',
  'fullAuth.support.start_a_new_report': 'Commencer un nouveau rapport',
  'fullAuth.support.report_an_issue': 'Signaler un problème',
  'fullAuth.notification_settings.daily_proof_reminders_and_promise_ending_updates':
    'Rappels quotidiens de preuve et notifications de fin de promesse.',
  'fullAuth.notification_settings.saved_but_notifications_are_off_on_this_phone':
    'Enregistré, mais les notifications sont désactivées sur ce téléphone.',
  'fullAuth.notification_settings.occasional_updates_to_email_unsubscribe_here':
    'Mises à jour occasionnelles à {email}. Vous pouvez vous désabonner à tout moment ici.',
  'fullAuth.notification_settings.a_confirmed_account_email_is_required':
    'Une adresse e‑mail de compte confirmée est requise.',
  'fullAuth.onboarding.menta_mascot_holding_your_first_promise':
    'Mascotte Menta tenant votre première promesse',
  'fullAuth.onboarding.menta_mascot_waving_hello':
    'Mascotte Menta vous faisant signe',
  'fullAuth.onboarding.your_saved_draft_is_back_on_this_phone':
    'Votre brouillon enregistré est de nouveau présent sur ce téléphone.',
  'fullAuth.onboarding.saved_privately_on_this_phone_as_you_type':
    'Enregistré en privé sur ce téléphone pendant que vous tapez.',
  'fullAuth.account_deleted.apple_instructions_did_not_open':
    'Les instructions Apple ne se sont pas ouvertes',
  'fullAuth.account_deleted.checking_account_deletion':
    'Vérification de la suppression du compte',
  'fullAuth.account_deleted.go_to_sign_in': 'Aller à la connexion',
  'fullAuth.account_deleted.if_you_used_sign_in_with_apple_remove_menta_from':
    'Si vous avez utilisé « Se connecter avec Apple », retirez Menta des applications liées à votre compte Apple. Ouvrez les Réglages iPhone, touchez votre nom, puis Se connecter avec Apple.',
  'fullAuth.account_deleted.open_apple_support_and_search_for_manage_your_ap':
    'Ouvrez l’assistance Apple et recherchez « Gérer vos apps avec Connexion avec Apple ».',
  'fullAuth.account_deleted.remove_apple_access': "Supprimer l'accès Apple",
  'fullAuth.account_deleted.see_apple_instructions':
    'Voir les instructions Apple',
  'fullAuth.account_deleted.sign_in_with_apple_access_was_also_removed':
    "L'accès Se connecter avec Apple a également été supprimé.",
  'fullAuth.account_deleted.your_account_was_deleted':
    'Votre compte a été supprimé',
  'fullAuth.account_deleted.your_menta_account_and_its_data_were_deleted_men':
    'Votre compte Menta et ses données ont été supprimés. Menta a également effacé les données enregistrées de ce téléphone.',
  'fullAuth.auth_required.events': 'Évènements',
  'fullAuth.auth_required.groups': 'Groupes',
  'fullAuth.auth_required.keep_browsing': 'Continuer à naviguer',
  'fullAuth.auth_required.menta': 'Menta',
  'fullAuth.auth_required.menta_records_the_review_under_your_account':
    'Menta enregistre la revue sous votre compte.',
  'fullAuth.auth_required.menta_saves_this_proof_with_the_right_promise_an':
    'Menta enregistre cette preuve avec la bonne promesse et le bon compte.',
  'fullAuth.auth_required.momenta': 'Momenta',
  'fullAuth.auth_required.proof': 'Preuve',
  'fullAuth.auth_required.reviews': 'Revues',
  'fullAuth.auth_required.sign_in': 'Se connecter',
  'fullAuth.auth_required.sign_in_to_add_proof':
    'Se connecter pour ajouter une preuve',
  'fullAuth.auth_required.sign_in_to_complete_this_action_and_return_here_':
    'Se connecter pour terminer cette action et revenir ici ensuite.',
  'fullAuth.auth_required.sign_in_to_continue': 'Se connecter pour continuer',
  'fullAuth.auth_required.sign_in_to_continue_with_this_event':
    'Se connecter pour continuer avec cet évènement',
  'fullAuth.auth_required.sign_in_to_join_this_group':
    'Se connecter pour rejoindre ce groupe',
  'fullAuth.auth_required.sign_in_to_review_proof':
    'Se connecter pour examiner la preuve',
  'fullAuth.auth_required.sign_in_to_use_momenta':
    'Se connecter pour utiliser Momenta',
  'fullAuth.auth_required.your_balance_purchases_and_items_stay_with_your_':
    'Votre solde, vos achats et vos objets restent associés à votre compte.',
  'fullAuth.auth_required.your_invitation_and_group_activity_stay_with_you':
    'Votre invitation et votre activité de groupe restent associées à votre compte.',
  'fullAuth.auth_required.your_place_check_in_and_event_photos_are_saved_t':
    "Votre lieu, vos check‑ins et photos d'événement sont enregistrés sur votre compte.",
  'fullAuth.auth_required.your_promises_proof_groups_and_reviews_stay_with':
    'Vos promesses, preuves, groupes et revues restent associés à votre compte Menta.',
  'fullAuth.component_onboarding_mentasurface.hide_password':
    'Masquer le mot de passe',
  'fullAuth.component_onboarding_mentasurface.menta': 'Menta',
  'fullAuth.component_onboarding_mentasurface.setup': 'Configuration',
  'fullAuth.component_onboarding_mentasurface.show_password':
    'Afficher le mot de passe',
  'fullAuth.component_onboarding_paperauthform.after_this': 'Après cela',
  'fullAuth.component_onboarding_paperauthform.characters': '+ caractères',
  'fullAuth.component_onboarding_paperauthform.check_the_details':
    'Vérifier les détails',
  'fullAuth.component_onboarding_paperauthform.confirm_password':
    'Confirmer le mot de passe',
  'fullAuth.component_onboarding_paperauthform.create_your_account':
    'Créer votre compte',
  'fullAuth.component_onboarding_paperauthform.creating_your_account':
    'Création de votre compte',
  'fullAuth.component_onboarding_paperauthform.daniel': 'Daniel',
  'fullAuth.component_onboarding_paperauthform.email': 'E‑mail',
  'fullAuth.component_onboarding_paperauthform.forgot_your_password':
    'Mot de passe oublié ?',
  'fullAuth.component_onboarding_paperauthform.password': 'Mot de passe',
  'fullAuth.component_onboarding_paperauthform.sign_in_with_email':
    'Se connecter avec e‑mail',
  'fullAuth.component_onboarding_paperauthform.signing_you_in':
    'Connexion en cours',
  'fullAuth.component_onboarding_paperauthform.username': "Nom d'utilisateur",
  'fullAuth.component_onboarding_paperauthform.you_example_com':
    'vous@exemple.com',
  'fullAuth.component_onboarding_paperauthform.you_will_return_to_your_first_promise':
    'Vous reviendrez à votre première promesse.',
  'fullAuth.component_onboarding_paperauthform.your_promise_stays_on_this_phone_until_the_accou':
    "Votre promesse reste sur ce téléphone jusqu'à ce que le compte soit prêt.",
  'fullAuth.component_onboarding_paperauthform.your_promise_stays_on_this_phone_while_we_create':
    'Votre promesse reste sur ce téléphone pendant que nous créons le compte.',
  'fullAuth.component_onboarding_paperauthform.your_promise_stays_on_this_phone_while_you_sign_':
    'Votre promesse reste sur ce téléphone pendant que vous vous connectez.',
  'fullAuth.component_onboarding_paperauthmethods.choose_how_to_sign_in_your_promise_stays_on_this':
    "Choisissez comment vous connecter. Votre promesse reste sur ce téléphone jusqu'à la fin de la connexion.",
  'fullAuth.component_onboarding_paperauthmethods.choose_how_you_want_to_sign_in':
    'Choisissez comment vous voulez vous connecter.',
  'fullAuth.component_onboarding_paperauthmethods.continue_with_apple':
    'Continuer avec Apple',
  'fullAuth.component_onboarding_paperauthmethods.continue_with_email':
    'Continuer avec e‑mail',
  'fullAuth.component_onboarding_paperauthmethods.continue_with_google':
    'Continuer avec Google',
  'fullAuth.component_onboarding_paperauthmethods.save_your_promise':
    'Enregistrer votre promesse',
  'fullAuth.component_onboarding_paperauthmethods.see_how_menta_works':
    'Voir comment Menta fonctionne',
  'fullAuth.component_onboarding_paperauthmethods.sign_in_to_menta':
    'Se connecter à Menta',
  'fullAuth.component_onboarding_paperauthmethods.we_could_not_sign_you_in':
    "Nous n'avons pas pu vous connecter",
  'fullAuth.component_onboarding_paperauthreset.back_to_sign_in':
    'Retour à la connexion',
  'fullAuth.component_onboarding_paperauthreset.check_your_email':
    'Vérifiez votre e‑mail.',
  'fullAuth.component_onboarding_paperauthreset.daniel_example_com':
    'daniel@exemple.com',
  'fullAuth.component_onboarding_paperauthreset.email': 'E‑mail',
  'fullAuth.component_onboarding_paperauthreset.email_sent_to':
    'E‑mail envoyé à',
  'fullAuth.component_onboarding_paperauthreset.link_valid_for_60_minutes':
    'Lien valable 60 minutes',
  'fullAuth.component_onboarding_paperauthreset.reset_for':
    'Réinitialiser pour',
  'fullAuth.component_onboarding_paperauthreset.reset_your_password':
    'Réinitialisez votre mot de passe',
  'fullAuth.component_onboarding_paperauthreset.send_another_link':
    'Envoyer un autre lien',
  'fullAuth.component_onboarding_paperauthreset.send_another_link_in_countdown':
    'Envoyer un autre lien dans {countdown}',
  'fullAuth.component_onboarding_paperauthreset.send_reset_link':
    'Envoyer le lien de réinitialisation',
  'fullAuth.component_onboarding_paperauthreset.sending_your_reset_link':
    'Envoi du lien de réinitialisation',
  'fullAuth.component_onboarding_paperauthreset.use_the_latest_link':
    'Utilisez le dernier lien.',
  'fullAuth.component_onboarding_paperauthreset.use_the_link_we_just_sent_you_can_request_anothe':
    "Utilisez le lien que nous venons d'envoyer. Vous pouvez demander un autre quand le minuteur se terminera.",
  'fullAuth.component_onboarding_paperauthreset.we_could_not_send_another_link':
    "Nous n'avons pas pu envoyer un autre lien",
  'fullAuth.component_onboarding_paperauthreset.we_could_not_send_the_reset_link':
    "Nous n'avons pas pu envoyer le lien de réinitialisation",
  'fullAuth.component_onboarding_paperauthreset.we_ll_email_you_a_secure_link_your_saved_promise':
    'Nous allons vous envoyer par e‑mail un lien sécurisé. Votre promesse enregistrée restera sur ce téléphone.',
  'fullAuth.component_onboarding_paperauthreset.we_re_sending_a_secure_link_to_the_address_below':
    "Nous envoyons un lien sécurisé à l'adresse ci‑dessous.",
  'fullAuth.component_onboarding_paperauthreset.we_sent_a_secure_reset_link_your_saved_promise_i':
    'Nous avons envoyé un lien sécurisé de réinitialisation. Votre promesse enregistrée attend toujours ici.',
  'fullAuth.component_onboarding_paperauthsurface.before_you_use_the_account_you_ll_review_and_acc':
    "Avant d'utiliser le compte, vous verrez et accepterez les documents actuels de compte et de communauté de Menta.",
  'fullAuth.component_onboarding_paperauthsurface.choose_sign_in_method':
    'Choisir la méthode de connexion',
  'fullAuth.component_onboarding_paperauthsurface.community_standards':
    'Règles de la communauté',
  'fullAuth.component_onboarding_paperauthsurface.community_standards_did_not_open':
    'Les règles de la communauté ne se sont pas ouvertes',
  'fullAuth.component_onboarding_paperauthsurface.hide_password':
    'Masquer le mot de passe',
  'fullAuth.component_onboarding_paperauthsurface.keep_local_draft':
    'Conserver le brouillon local',
  'fullAuth.component_onboarding_paperauthsurface.menta': 'Menta',
  'fullAuth.component_onboarding_paperauthsurface.menta_authentication':
    'Authentification Menta',
  'fullAuth.component_onboarding_paperauthsurface.menta_mascot':
    'Mascotte Menta',
  'fullAuth.component_onboarding_paperauthsurface.privacy_policy':
    'Politique de confidentialité',
  'fullAuth.component_onboarding_paperauthsurface.privacy_policy_did_not_open':
    "La politique de confidentialité ne s'est pas ouverte",
  'fullAuth.component_onboarding_paperauthsurface.returning_to': 'Retour à',
  'fullAuth.component_onboarding_paperauthsurface.show_password':
    'Afficher le mot de passe',
  'fullAuth.component_onboarding_paperauthsurface.terms_did_not_open':
    'Les conditions ne se sont pas ouvertes',
  'fullAuth.component_onboarding_paperauthsurface.terms_of_use':
    "Conditions d'utilisation",
  'fullAuth.component_onboarding_paperauthsurface.the_provider_sheet_was_closed_before_an_account_':
    "La fenêtre du fournisseur a été fermée avant le retour d'un compte. Aucun compte n'a été créé ou modifié.",
  'fullAuth.component_onboarding_paperauthsurface.title_message':
    '{title} {message}',
  'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_community_standar':
    'Réessayer, ou visiter menta.quest/community-standards dans votre navigateur.',
  'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_privacy_in_your_b':
    'Réessayer, ou visiter menta.quest/privacy dans votre navigateur.',
  'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_terms_in_your_bro':
    'Réessayer, ou visiter menta.quest/terms dans votre navigateur.',
  'fullAuth.component_onboarding_paperauthsurface.you_can_try_again_or_keep_working_without_signin':
    "Vous pouvez réessayer ou continuer sans vous connecter tant que Menta n'a pas besoin d'enregistrer.",
  'fullAuth.component_onboarding_paperauthsurface.you_re_still_signed_out':
    'Vous êtes toujours déconnecté.',
  'fullAuth.component_onboarding_paperauthsurface.your_local_promise_is_still_here':
    'Votre promesse locale est toujours ici',
  'fullAuth.component_settings_settingssignoutsheet.cancel': 'Annuler',
  'fullAuth.component_settings_settingssignoutsheet.check_the_connection_then_try_again':
    'Vérifiez la connexion, puis réessayez.',
  'fullAuth.component_settings_settingssignoutsheet.sign_out': 'Déconnexion',
  'fullAuth.component_settings_settingssignoutsheet.sign_out_did_not_finish':
    "La déconnexion ne s'est pas terminée",
  'fullAuth.component_settings_settingssignoutsheet.try_sign_out_again':
    'Réessayer de se déconnecter',
  'fullAuth.component_support_offlinesupportnotice.you_can_still_read_the_last_saved_screen_proof_a':
    "Vous pouvez toujours lire le dernier écran enregistré. Les brouillons de preuve et de rapport restent sur ce téléphone jusqu'à ce que Menta se reconnecte.",
  'fullAuth.component_support_offlinesupportnotice.you_re_offline':
    'Vous êtes hors ligne',
  'fullAuth.component_support_supportsurface.title_subtitle':
    '{title}. {subtitle}',
  'fullAuth.component_support_supportsurface.title_subtitle_detail':
    '{title}. {subtitle} {detail}',
  'fullAuth.edit_profile.account_required': 'Compte requis',
  'fullAuth.edit_profile.back_to_you': 'Retour à Vous',
  'fullAuth.edit_profile.cannot_edit_here': 'Impossible de modifier ici',
  'fullAuth.edit_profile.change_photo': 'Changer la photo',
  'fullAuth.edit_profile.choose_a_different_photo':
    'Choisissez une autre photo.',
  'fullAuth.edit_profile.choose_a_profile_photo':
    'Choisissez une photo de profil',
  'fullAuth.edit_profile.details': 'Détails',
  'fullAuth.edit_profile.display_name': "Nom d'affichage",
  'fullAuth.edit_profile.edit_again': 'Modifier à nouveau',
  'fullAuth.edit_profile.edit_profile': 'Modifier le profil',
  'fullAuth.edit_profile.email': 'E‑mail',
  'fullAuth.edit_profile.how_it_will_look_on_you':
    'Comment cela apparaîtra sur Vous',
  'fullAuth.edit_profile.loading_your_profile': 'Chargement de votre profil',
  'fullAuth.edit_profile.name': 'Nom',
  'fullAuth.edit_profile.no_changes_have_been_made_try_loading_your_accou':
    "Aucun changement n'a été effectué. Essayez de recharger votre compte.",
  'fullAuth.edit_profile.no_photo_selected': 'Aucune photo sélectionnée',
  'fullAuth.edit_profile.nothing_changes_until_you_choose_one':
    "Rien ne change tant que vous n'avez pas choisi une photo.",
  'fullAuth.edit_profile.photo_not_changed_photoerror':
    'Photo non modifiée. {photoError}',
  'fullAuth.edit_profile.photo_visibility': 'Visibilité de la photo',
  'fullAuth.edit_profile.photo_will_be_removed': 'La photo sera supprimée',
  'fullAuth.edit_profile.profile_unavailable': 'Profil indisponible',
  'fullAuth.edit_profile.profile_updated': 'Profil mis à jour',
  'fullAuth.edit_profile.remove_photo': 'Supprimer la photo',
  'fullAuth.edit_profile.save_changes': 'Enregistrer les modifications',
  'fullAuth.edit_profile.saving_changes': 'Enregistrement des modifications',
  'fullAuth.edit_profile.saving_your_changes':
    'Enregistrement de vos modifications',
  'fullAuth.edit_profile.selected_not_saved': 'Sélectionné, non enregistré',
  'fullAuth.edit_profile.selected_profile_photo_in_its_final_circular_cro':
    'Photo de profil sélectionnée dans son recadrage circulaire final',
  'fullAuth.edit_profile.sign_in_again': 'Se reconnecter',
  'fullAuth.edit_profile.sign_in_again_before_editing_this_profile':
    'Se reconnecter avant de modifier ce profil.',
  'fullAuth.edit_profile.this_is_how_the_photo_will_look_on_you_it_will_n':
    "Voici comment la photo apparaîtra sur Vous. Elle ne changera pas tant que vous n'enregistrerez pas.",
  'fullAuth.edit_profile.try_again': 'Réessayer',
  'fullAuth.edit_profile.try_saving_again': "Réessayer d'enregistrer",
  'fullAuth.edit_profile.username': "Nom d'utilisateur",
  'fullAuth.edit_profile.usernames_can_t_be_changed_yet':
    "Les noms d'utilisateur ne peuvent pas être modifiés pour le moment.",
  'fullAuth.edit_profile.value': '@{value}',
  'fullAuth.edit_profile.you_can_keep_reviewing_the_preview_while_menta_s':
    "Vous pouvez continuer d'examiner l'aperçu pendant que Menta enregistre.",
  'fullAuth.edit_profile.you_cannot_change_your_sign_in_email_here':
    'Vous ne pouvez pas changer votre e‑mail de connexion ici.',
  'fullAuth.edit_profile.your_current_photo_stays_until_you_save_changes':
    "Votre photo actuelle reste tant que vous n'enregistrez pas les changements.",
  'fullAuth.edit_profile.your_details_will_appear_when_this_check_finishe':
    'Vos détails apparaîtront quand cette vérification sera terminée.',
  'fullAuth.edit_profile.your_edits_are_still_here':
    'Vos modifications sont toujours présentes',
  'fullAuth.edit_profile.your_profile_has_not_changed':
    "Votre profil n'a pas changé.",
  'fullAuth.edit_profile.your_profile_has_not_changed_try_saving_again':
    "Votre profil n'a pas changé. Réessayez d'enregistrer.",
  'fullAuth.edit_profile.your_saved_name_and_photo_now_appear_across_ment':
    'Votre nom et votre photo enregistrés apparaissent désormais partout dans Menta.',
  'fullAuth.email_auth.confirm_password': 'Confirmer le mot de passe',
  'fullAuth.email_auth.couldn_t_create_account':
    'Impossible de créer le compte',
  'fullAuth.email_auth.couldn_t_sign_you_in': 'Impossible de vous connecter',
  'fullAuth.email_auth.create_an_account_to_save_this_promise_to_menta':
    'Créez un compte pour enregistrer cette promesse sur Menta.',
  'fullAuth.email_auth.create_your_account': 'Créer votre compte',
  'fullAuth.email_auth.daniel': 'daniel',
  'fullAuth.email_auth.email': 'E‑mail',
  'fullAuth.email_auth.forgot_your_password': 'Mot de passe oublié ?',
  'fullAuth.email_auth.menta': 'Menta',
  'fullAuth.email_auth.other_people_may_see_this_with_your_group_activi':
    "D'autres personnes peuvent voir cela avec votre activité de groupe et vos photos d'événement.",
  'fullAuth.email_auth.password': 'Mot de passe',
  'fullAuth.email_auth.sign_in_to_save_this_promise_to_your_menta_accou':
    'Connectez‑vous pour enregistrer cette promesse sur votre compte Menta.',
  'fullAuth.email_auth.sign_in_with_email': 'Se connecter avec e‑mail',
  'fullAuth.email_auth.use_6_or_more_characters':
    'Utilisez 6 caractères ou plus.',
  'fullAuth.email_auth.use_an_email_you_can_access_if_you_ever_need_to_':
    'Utilisez une adresse e‑mail à laquelle vous pouvez accéder en cas de récupération de compte.',
  'fullAuth.email_auth.username': "Nom d'utilisateur",
  'fullAuth.email_auth.you_example_com': 'vous@exemple.com',
  'fullAuth.legal_acceptance.agree_and_continue': 'Accepter et continuer',
  'fullAuth.legal_acceptance.back': 'Retour',
  'fullAuth.legal_acceptance.before_you': 'Avant vous',
  'fullAuth.legal_acceptance.checking_the_current_legal_documents':
    'Vérification des documents légaux actuels',
  'fullAuth.legal_acceptance.continue': 'continuer.',
  'fullAuth.legal_acceptance.couldn_t_check_your_agreement':
    'Impossible de vérifier votre accord',
  'fullAuth.legal_acceptance.create': 'créer.',
  'fullAuth.legal_acceptance.i_agree_to_menta_s_terms_of_use_and_community_st':
    "J'accepte les Conditions d'utilisation et les Règles de la communauté de Menta, et je reconnais la Politique de confidentialité.",
  'fullAuth.legal_acceptance.leave_legal_review': 'Quitter la revue légale',
  'fullAuth.legal_acceptance.menta': 'Menta',
  'fullAuth.legal_acceptance.menta_mascot_beside_your_account_confirmation':
    'Mascotte Menta à côté de la confirmation de votre compte',
  'fullAuth.legal_acceptance.try_again': 'Réessayer',
  'fullAuth.legal_acceptance.you_can_go_back_without_agreeing_your_account_an':
    'Vous pouvez revenir sans accepter. Votre compte et vos promesses existantes restent disponibles.',
  'fullAuth.login.menta': 'Menta',
  'fullAuth.notification_settings.a_test_is_already_on_the_way':
    'Un test est déjà en cours',
  'fullAuth.notification_settings.allow_notifications':
    'Autoriser les notifications',
  'fullAuth.notification_settings.allow_notifications_first':
    "Autoriser d'abord les notifications",
  'fullAuth.notification_settings.back_to_settings': 'Retour aux réglages',
  'fullAuth.notification_settings.check_again_before_turning_on_proof_reminders':
    "Vérifiez à nouveau avant d'activer les rappels de preuve.",
  'fullAuth.notification_settings.check_notification_permission':
    "Vérifier l'autorisation de notification",
  'fullAuth.notification_settings.check_notification_permission_and_try_the_test_a':
    "Vérifiez l'autorisation de notification et réessayez le test dans un instant.",
  'fullAuth.notification_settings.choice_saved': 'Choix enregistré',
  'fullAuth.notification_settings.choose_daily_proof_reminders_and_updates_when_a_':
    "Choisir des rappels quotidiens de preuve et des mises à jour lorsqu'une promesse se termine.",
  'fullAuth.notification_settings.choose_notifications_for_menta_then_return_here':
    'Choisissez « Notifications » pour Menta, puis revenez ici.',
  'fullAuth.notification_settings.choose_the_notifications_you_want_from_menta':
    'Choisissez les notifications que vous désirez de Menta.',
  'fullAuth.notification_settings.choose_the_notifications_you_want_from_menta_bel':
    'Choisissez les notifications que vous désirez de Menta ci‑dessous.',
  'fullAuth.notification_settings.choose_which_group_and_progress_updates_menta_ma':
    'Choisissez quels groupes et quelles mises à jour de progression Menta peut vous envoyer.',
  'fullAuth.notification_settings.confirmed_milestones_momenta_and_streak_changes':
    'Étapes confirmées, Momenta et variations de séries.',
  'fullAuth.notification_settings.could_not_check_phone_notifications':
    'Impossible de vérifier les notifications du téléphone',
  'fullAuth.notification_settings.could_not_load_notification_settings':
    'Impossible de charger les réglages de notification.',
  'fullAuth.notification_settings.could_not_load_notification_settings_2':
    'Impossible de charger les réglages de notification',
  'fullAuth.notification_settings.could_not_open_phone_settings':
    "Impossible d'ouvrir les réglages du téléphone",
  'fullAuth.notification_settings.could_not_save_your_choice':
    "Impossible d'enregistrer votre choix",
  'fullAuth.notification_settings.delivery_and_timing': 'Livraison et horaire',
  'fullAuth.notification_settings.email_choice_did_not_change':
    "Le choix d'e‑mail n'a pas changé",
  'fullAuth.notification_settings.email_updates': 'Mises à jour par e‑mail',
  'fullAuth.notification_settings.email_updates_are_off':
    'Les mises à jour par e‑mail sont désactivées',
  'fullAuth.notification_settings.email_updates_are_on':
    'Les mises à jour par e‑mail sont activées',
  'fullAuth.notification_settings.email_updates_are_still_off':
    'Les mises à jour par e‑mail sont toujours désactivées',
  'fullAuth.notification_settings.email_updates_are_unavailable':
    'Les mises à jour par e‑mail sont indisponibles',
  'fullAuth.notification_settings.if_it_does_not_save_menta_will_put_your_previous':
    "Si l'enregistrement échoue, Menta rétablira votre choix précédent.",
  'fullAuth.notification_settings.it_should_arrive_shortly_tap_it_to_return_to_not':
    'Cela devrait arriver sous peu. Touchez pour revenir aux réglages de notification.',
  'fullAuth.notification_settings.keep_notifications_off':
    'Laisser les notifications désactivées',
  'fullAuth.notification_settings.loading_notification_settings':
    'Chargement des réglages de notification',
  'fullAuth.notification_settings.loading_your_notification_settings':
    'Chargement de vos réglages de notification.',
  'fullAuth.notification_settings.menta_can_resume_notifications_after_this_time':
    'Menta pourra reprendre les notifications après ce moment.',
  'fullAuth.notification_settings.menta_could_not_connect_this_email_safely_so_you':
    "Menta n'a pas pu connecter cet e‑mail en toute sécurité, votre consentement n'a donc pas été conservé.",
  'fullAuth.notification_settings.menta_could_not_finish_notification_registration':
    "Menta n'a pas pu finaliser l'enregistrement de notification. Réessayez dans un instant.",
  'fullAuth.notification_settings.menta_does_not_send_notifications_during_these_h':
    "Menta n'envoie pas de notifications pendant ces heures. Elles peuvent arriver après.",
  'fullAuth.notification_settings.menta_does_not_send_notifications_during_this_lo':
    "Menta n'envoie pas de notifications durant cette plage horaire locale.",
  'fullAuth.notification_settings.menta_is_checking_this_phone_and_your_active_pro':
    'Menta vérifie ce téléphone et vos promesses actives.',
  'fullAuth.notification_settings.menta_is_checking_this_phone_before_it_queues_th':
    'Menta vérifie ce téléphone avant de placer le test dans la file.',
  'fullAuth.notification_settings.menta_is_finishing_notification_setup_for_this_p':
    'Menta finalise la configuration de notification pour ce téléphone.',
  'fullAuth.notification_settings.menta_may_remind_you_while_proof_is_due_or_a_pro':
    "Menta pourra vous rappeler tant que la preuve est attendue ou qu'une promesse se termine, et attendra pendant les heures de silence.",
  'fullAuth.notification_settings.menta_may_send_occasional_product_news_to_your_a':
    'Menta pourra envoyer occasionnellement des actualités produit à votre e‑mail de compte. Vous pouvez désactiver cela à tout moment ici.',
  'fullAuth.notification_settings.menta_needs_a_confirmed_account_email_before_thi':
    "Menta a besoin d'un e‑mail de compte confirmé avant que ce choix puisse être modifié.",
  'fullAuth.notification_settings.menta_product_news':
    'Actualités produit Menta',
  'fullAuth.notification_settings.menta_removed_this_email_from_product_update_del':
    'Menta a retiré cet e‑mail de la diffusion des actualités produit.',
  'fullAuth.notification_settings.menta_will_not_send_proof_or_promise_ending_remi':
    "Menta n'enverra pas de rappels de preuve ou de fin de promesse tant que vous ne les avez pas réactivés.",
  'fullAuth.notification_settings.menta_will_use_this_choice_for_future_notificati':
    'Menta utilisera ce choix pour les notifications futures.',
  'fullAuth.notification_settings.new_proof_to_review_review_outcomes_check_ins_an':
    'Nouvelle preuve à examiner, résultats de revues, check‑ins et changements de groupe.',
  'fullAuth.notification_settings.no_notification_was_queued':
    "Aucune notification n'a été placée en file.",
  'fullAuth.notification_settings.nothing_was_sent_try_again_in_a_moment':
    "Rien n'a été envoyé. Réessayez dans un instant.",
  'fullAuth.notification_settings.notification_setup_did_not_finish':
    "La configuration des notifications ne s'est pas terminée",
  'fullAuth.notification_settings.notifications': 'Notifications',
  'fullAuth.notification_settings.promise_context_title': 'Rappels de promesse',
  'fullAuth.notification_settings.promise_context_body':
    'Cette heure de rappel s’applique à toutes les promesses actives. Les horaires suivent {timeZone}.',
  'fullAuth.notification_settings.back_to_promise': 'Retour à la promesse',
  'fullAuth.notification_settings.notifications_are_off':
    'Les notifications sont désactivées',
  'fullAuth.notification_settings.notifications_are_still_off':
    'Les notifications sont toujours désactivées',
  'fullAuth.notification_settings.notifications_off':
    'Notifications désactivées',
  'fullAuth.notification_settings.old_reminders_may_still_be_on_this_phone':
    'Les anciens rappels peuvent encore être actifs sur ce téléphone',
  'fullAuth.notification_settings.open_phone_settings':
    'Ouvrir les réglages du téléphone',
  'fullAuth.notification_settings.open_your_phone_settings_choose_menta_then_notif':
    'Ouvrez les réglages du téléphone, choisissez Menta, puis Notifications pour autoriser les rappels.',
  'fullAuth.notification_settings.open_your_phone_settings_choose_menta_then_notif_2':
    'Ouvrez les réglages du téléphone, choisissez Menta, puis Notifications, et autorisez les notifications.',
  'fullAuth.notification_settings.opening_phone_settings':
    'Ouverture des réglages du téléphone',
  'fullAuth.notification_settings.optional_menta_product_news_this_is_separate_fro':
    'Actualités produit optionnelles de Menta. Cela est séparé des notifications de compte et de preuve.',
  'fullAuth.notification_settings.people_and_progress':
    'Personnes et progression',
  'fullAuth.notification_settings.phone_controls': 'Contrôles du téléphone',
  'fullAuth.notification_settings.phone_notification_check_failed':
    'Échec de la vérification des notifications du téléphone',
  'fullAuth.notification_settings.phone_notification_settings':
    'Réglages de notification du téléphone',
  'fullAuth.notification_settings.preferred_time_formattedremindertime_a_proof_dea':
    "Heure préférée : {formattedReminderTime}. Une date limite de preuve ou les heures de silence peuvent modifier l'heure réelle.",
  'fullAuth.notification_settings.preferred_time_formattedremindertime_notificatio':
    'Heure préférée : {formattedReminderTime}. Les notifications sont désactivées sur ce téléphone.',
  'fullAuth.notification_settings.preparing_a_test_notification':
    "Préparation d'une notification de test",
  'fullAuth.notification_settings.preparing_proof_reminders':
    'Préparation des rappels de preuve',
  'fullAuth.notification_settings.promise_reminders': 'Rappels de promesse',
  'fullAuth.notification_settings.proof_reminders': 'Rappels de preuve',
  'fullAuth.notification_settings.proof_reminders_are_off':
    'Les rappels de preuve sont désactivés',
  'fullAuth.notification_settings.proof_reminders_are_ready':
    'Les rappels de preuve sont prêts',
  'fullAuth.notification_settings.proof_reminders_are_ready_on_this_phone':
    'Les rappels de preuve sont prêts sur ce téléphone',
  'fullAuth.notification_settings.proof_reminders_saved':
    'Rappels de preuve enregistrés',
  'fullAuth.notification_settings.quiet_hours': 'Heures de silence',
  'fullAuth.notification_settings.quiet_hours_and_delivery':
    'Heures de silence et livraison',
  'fullAuth.notification_settings.quiet_hours_end': 'Fin des heures de silence',
  'fullAuth.notification_settings.quiet_hours_formattedquiethours':
    'Heures de silence {formattedQuietHours}',
  'fullAuth.notification_settings.quiet_hours_not_saved':
    'Heures de silence non enregistrées',
  'fullAuth.notification_settings.quiet_hours_saved':
    'Heures de silence enregistrées',
  'fullAuth.notification_settings.quiet_hours_start':
    'Début des heures de silence',
  'fullAuth.notification_settings.reload_your_saved_notification_choices':
    'Recharger vos choix de notification enregistrés',
  'fullAuth.notification_settings.reminder_setup_did_not_finish':
    "La configuration du rappel ne s'est pas terminée",
  'fullAuth.notification_settings.reminder_time': 'Heure du rappel',
  'fullAuth.notification_settings.reminder_time_did_not_update_on_this_phone':
    "L'heure du rappel n'a pas été mise à jour sur ce téléphone",
  'fullAuth.notification_settings.reviews_and_group_activity':
    'Revues et activité de groupe',
  'fullAuth.notification_settings.save_quiet_hours':
    'Enregistrer les heures de silence',
  'fullAuth.notification_settings.saving_quiet_hours':
    'Enregistrement des heures de silence',
  'fullAuth.notification_settings.saving_your_choice':
    'Enregistrement de votre choix',
  'fullAuth.notification_settings.saving_your_choice_2':
    'Enregistrement de votre choix…',
  'fullAuth.notification_settings.saving_your_email_choice':
    'Enregistrement de votre choix e‑mail…',
  'fullAuth.notification_settings.send_one_real_notification_to_this_signed_in_pho':
    'Envoyer une vraie notification à ce téléphone connecté.',
  'fullAuth.notification_settings.send_test_notification':
    'Envoyer une notification de test',
  'fullAuth.notification_settings.set_quiet_hours_email_and_phone_notification_opt':
    'Définir les heures de silence, le choix e‑mail et les options de notification du téléphone.',
  'fullAuth.notification_settings.sign_in_again': 'Se reconnecter',
  'fullAuth.notification_settings.sign_in_again_to_send_a_test':
    'Se reconnecter pour envoyer un test',
  'fullAuth.notification_settings.sounds_previews_focus_and_scheduled_delivery':
    'Sons, aperçus, mode Concentration et diffusion planifiée.',
  'fullAuth.notification_settings.sounds_previews_focus_and_scheduled_delivery_are':
    'Les sons, aperçus, le mode Concentration et la diffusion planifiée sont gérés par votre téléphone.',
  'fullAuth.notification_settings.streaks_and_momenta': 'Séries et Momenta',
  'fullAuth.notification_settings.test_notification_queued':
    'Notification de test placée en file',
  'fullAuth.notification_settings.test_notification_was_not_queued':
    "La notification de test n'a pas été placée en file",
  'fullAuth.notification_settings.test_notifications': 'Notifications de test',
  'fullAuth.notification_settings.the_range_can_cross_midnight':
    'La plage peut traverser minuit.',
  'fullAuth.notification_settings.there_are_no_active_promises_to_schedule_yet_men':
    'Aucune promesse active à programmer pour le moment. Menta utilisera ce choix lorsque vous en créerez une.',
  'fullAuth.notification_settings.this_phone_is_not_ready_yet':
    "Ce téléphone n'est pas encore prêt",
  'fullAuth.notification_settings.this_phone_is_ready_for_menta_notifications':
    'Ce téléphone est prêt pour les notifications Menta',
  'fullAuth.notification_settings.this_phone_may_show_a_reminder_at_your_preferred':
    'Ce téléphone peut afficher un rappel à votre heure préférée pour les promesses actives.',
  'fullAuth.notification_settings.this_phone_must_allow_menta_notifications_before':
    'Ce téléphone doit autoriser les notifications Menta avant de pouvoir envoyer un test.',
  'fullAuth.notification_settings.this_phone_will_not_show_menta_notifications_unt':
    "Ce téléphone n'affichera pas les notifications Menta tant que vous ne les activerez pas.",
  'fullAuth.notification_settings.to_turn_them_on': 'Pour les activer',
  'fullAuth.notification_settings.try_again': 'Réessayer',
  'fullAuth.notification_settings.try_again_before_relying_on_notifications_from_t':
    'Réessayez avant de compter sur les notifications de ce téléphone.',
  'fullAuth.notification_settings.try_again_before_turning_on_reminders_for_this_p':
    "Réessayez avant d'activer les rappels sur ce téléphone.",
  'fullAuth.notification_settings.turning_off_email_updates':
    'Désactiver les mises à jour par e‑mail',
  'fullAuth.notification_settings.turning_on_email_updates':
    'Activer les mises à jour par e‑mail',
  'fullAuth.notification_settings.wait_one_minute_before_requesting_another_test':
    'Attendez une minute avant de demander un autre test.',
  'fullAuth.notification_settings.your_choice_is_saved_but_an_old_reminder_may_sti':
    'Votre choix est enregistré, mais un ancien rappel peut encore apparaître. Réessayez.',
  'fullAuth.notification_settings.your_choice_is_saved_but_proof_reminders_are_not':
    'Votre choix est enregistré, mais les rappels de preuve ne sont pas encore prêts. Réessayez.',
  'fullAuth.notification_settings.your_choice_is_saved_but_proof_reminders_are_not_2':
    'Votre choix est enregistré, mais les rappels de preuve ne sont pas prêts sur ce téléphone. Réessayez.',
  'fullAuth.notification_settings.your_choices_are_saved_but_this_phone_cannot_sho':
    'Vos choix sont enregistrés, mais ce téléphone ne peut pas afficher les notifications Menta tant que vous ne les autorisez pas.',
  'fullAuth.notification_settings.your_current_choice_remains_authoritative_until_':
    "Votre choix actuel demeure autoritaire jusqu'à ce que cela soit enregistré.",
  'fullAuth.notification_settings.your_current_quiet_hours_stay_in_place_until_thi':
    "Vos heures de silence actuelles restent en place jusqu'à ce que cela soit enregistré.",
  'fullAuth.notification_settings.your_menta_opt_out_is_saved_provider_removal_wil':
    'Votre désinscription de Menta est enregistrée. La suppression du fournisseur sera réessayée lorsque ce compte se reconnectera.',
  'fullAuth.notification_settings.your_phone_did_not_return_a_notification_setting':
    "Votre téléphone n'a pas renvoyé un paramètre de notification. Aucune autorisation n'a été modifiée.",
  'fullAuth.notification_settings.your_phone_now_allows_notifications':
    'Votre téléphone autorise désormais les notifications',
  'fullAuth.notification_settings.your_preferred_time_is_saved_but_this_phone_may_':
    "Votre heure préférée est enregistrée, mais ce téléphone peut encore utiliser l'ancienne heure. Réessayez.",
  'fullAuth.notification_settings.your_previous_email_choice_is_still_active':
    'Votre précédent choix e‑mail est toujours actif.',
  'fullAuth.notification_settings.your_previous_notification_choice_is_still_activ':
    'Votre précédent choix de notification est toujours actif.',
  'fullAuth.notification_settings.your_previous_quiet_hours_remain_active':
    'Vos précédentes heures de silence restent actives.',
  'fullAuth.notification_settings.your_promises_still_work_menta_will_not_ask_agai':
    'Vos promesses fonctionnent toujours. Menta ne vous demandera plus ici.',
  'fullAuth.notification_settings.your_promises_still_work_this_phone_will_not_sho':
    "Vos promesses fonctionnent toujours. Ce téléphone n'affichera pas les notifications de preuve, de revue ou de groupe.",
  'fullAuth.notification_settings.your_proof_reminder_choice_is_unchanged_your_pho':
    'Votre choix de rappel de preuve reste inchangé. Votre téléphone vous le demandera à nouveau.',
  'fullAuth.onboarding.32_character_code': 'Code de 32 caractères',
  'fullAuth.onboarding.accountability': 'Responsabilité',
  'fullAuth.onboarding.activation_needs_attention':
    "L'activation nécessite votre attention",
  'fullAuth.onboarding.add_code_and_create': 'Ajouter le code et créer',
  'fullAuth.onboarding.add_it_now_or_create_your_promise_without_one_gr':
    'Ajoutez‑le maintenant, ou créez votre promesse sans code. Les invitations de groupe fonctionnent séparément.',
  'fullAuth.onboarding.add_referral_code': 'Ajouter un code de parrainage',
  'fullAuth.onboarding.after_it_s_created_menta_adds':
    'Après création, Menta ajoute',
  'fullAuth.onboarding.agree_and_choose_sign_in':
    'Accepter et choisir la connexion',
  'fullAuth.onboarding.agree_and_continue': 'Accepter et continuer',
  'fullAuth.onboarding.back': 'Retour',
  'fullAuth.onboarding.back_to_backlabel': 'Retour à {backLabel}',
  'fullAuth.onboarding.choose_a_length_you_can_genuinely_follow_through':
    'Choisissez une durée que vous pouvez réellement tenir.',
  'fullAuth.onboarding.choose_how_you_want_to_continue_your_draft_stays':
    'Choisissez comment continuer. Votre brouillon reste sur ce téléphone.',
  'fullAuth.onboarding.choose_length': 'Choisir la durée',
  'fullAuth.onboarding.choose_proof': 'Choisir la preuve',
  'fullAuth.onboarding.choose_the_proof_you_will_add_and_who_you_want_b':
    'Choisissez la preuve que vous ajouterez et qui vous accompagnera.',
  'fullAuth.onboarding.choose_what_you_ll_add_when_it_s_done_you_can_in':
    "Choisissez ce que vous ajouterez une fois terminé. Vous pourrez inviter des personnes à le réviser après l'enregistrement.",
  'fullAuth.onboarding.complete_this_promise_and_add_a_proofname_as_pro':
    'Complétez cette promesse et ajoutez un(e) {proofName} comme preuve.',
  'fullAuth.onboarding.confirm_the_required_documents':
    'Confirmez les documents requis.',
  'fullAuth.onboarding.confirming_code': 'Confirmation du code…',
  'fullAuth.onboarding.continue_to_referral': 'Passer au parrainage',
  'fullAuth.onboarding.continue_to_save': 'Continuer pour enregistrer',
  'fullAuth.onboarding.continue_with_apple': 'Continuer avec Apple',
  'fullAuth.onboarding.continue_with_email': 'Continuer avec e‑mail',
  'fullAuth.onboarding.continue_with_google': 'Continuer avec Google',
  'fullAuth.onboarding.could_not_finish_setup':
    'Impossible de terminer la configuration',
  'fullAuth.onboarding.create_a_group': 'Créer un groupe',
  'fullAuth.onboarding.review_promise_invite':
    'Examiner l’invitation de promesse',
  'fullAuth.onboarding.promise_invite_held':
    'Votre invitation de promesse est toujours en attente. Examinez‑la ensuite ; la rejoindre reste une action distincte.',
  'fullAuth.onboarding.review_group_invite': 'Examiner l’invitation de groupe',
  'fullAuth.onboarding.group_invite_held':
    'Votre invitation de groupe est toujours en attente. Examinez‑la ensuite ; la rejoindre reste une action distincte.',
  'fullAuth.onboarding.open_event': 'Ouvrir l’évènement',
  'fullAuth.onboarding.event_held':
    'Votre évènement est toujours en attente. Ouvrez‑le ensuite ; ce reçu de promesse ne constitue pas une participation.',
  'fullAuth.onboarding.create_my_group': 'Inviter quelqu’un',
  'fullAuth.onboarding.create_my_group_detail':
    'Votre promesse est enregistrée et reste privée. Choisissez comment une personne peut vous aider, puis décidez qui inviter.',
  'fullAuth.onboarding.create_it_first_menta_will_then_add':
    "Créez‑le d'abord. Menta ajoutera ensuite",
  'fullAuth.onboarding.create_without_a_code': 'Créer sans code',
  'fullAuth.onboarding.creating_your_first_promise':
    'Création de votre première promesse',
  'fullAuth.onboarding.creating_your_first_promise_2':
    'Création de votre première promesse…',
  'fullAuth.onboarding.days': 'jours',
  'fullAuth.onboarding.decide_what_finished_will_look_like':
    'Décidez à quoi ressemblera la finition.',
  'fullAuth.onboarding.do_you_have_a_referral_code':
    'Avez‑vous un code de parrainage ?',
  'fullAuth.onboarding.edit': 'Modifier',
  'fullAuth.onboarding.every_day': 'Tous les jours',
  'fullAuth.onboarding.every_day_2': '· Tous les jours ·',
  'fullAuth.promise.frequency.once_a_week': 'Une fois par semaine',
  'fullAuth.onboarding.first_promise': 'Première promesse',
  'fullAuth.onboarding.first_promise_firstpromisecost_momenta_after_cre':
    'Première promesse, {firstPromiseCost} Momenta. Après création, {welcomeBonus} Momenta de bienvenue pour des choix ultérieurs.',
  'fullAuth.onboarding.free': 'gratuit.',
  'fullAuth.onboarding.how_long_do_you_want_to_keep_this_promise':
    'Combien de temps souhaitez‑vous garder cette promesse ?',
  'fullAuth.onboarding.how_will_you_prove_it': 'Comment la prouver ?',
  'fullAuth.onboarding.i_agree_to_menta_s_terms_of_use_and_community_st':
    "J'accepte les Conditions d'utilisation et les Règles de la communauté de Menta, et je reconnais la Politique de confidentialité.",
  'fullAuth.onboarding.invite': 'Inviter',
  'fullAuth.onboarding.invite_people_after_this_promise_is_saved_member':
    "Invitez des personnes après l'enregistrement de cette promesse. Les membres peuvent examiner votre preuve.",
  'fullAuth.onboarding.just_me': 'Juste moi',
  'fullAuth.onboarding.keep_it_specific_enough_that_you_will_know_when_':
    "Soyez assez précis pour savoir quand c'est terminé.",
  'fullAuth.onboarding.legal_confirmation_did_not_finish':
    "La confirmation légale ne s'est pas terminée.",
  'fullAuth.onboarding.legal_review_was_not_completed':
    "La vérification légale n'a pas été complétée.",
  'fullAuth.onboarding.length': 'Durée',
  'fullAuth.onboarding.local_draft': 'Brouillon local',
  'fullAuth.onboarding.menta': 'Menta',
  'fullAuth.onboarding.menta_confirms_the_first_deadline_when_you_save':
    'Menta confirme la première échéance lorsque vous enregistrez.',
  'fullAuth.onboarding.menta_confirms_your_first_deadline_when_the_prom':
    'Menta confirme votre première échéance lorsque la promesse est créée.',
  'fullAuth.onboarding.menta_is_confirming_your_promise_and_momenta_bal':
    'Menta confirme votre promesse et votre solde Momenta.',
  'fullAuth.onboarding.menta_mascot_offering_you_a_bag_of_momenta_token':
    'Mascotte Menta vous offrant un sac de jetons Momenta',
  'fullAuth.onboarding.menta_mascot_waving_you_toward_saving_this_promi':
    'Mascotte Menta vous invitant à enregistrer cette promesse',
  'fullAuth.onboarding.menta_saved_the_promise_and_confirmed_your_accou':
    'Menta a enregistré la promesse et confirmé votre compte depuis le même reçu serveur.',
  'fullAuth.onboarding.message_your_draft_is_still_here':
    '{message} Votre brouillon est toujours ici.',
  'fullAuth.onboarding.momenta': 'Momenta',
  'fullAuth.onboarding.momenta_for_extra_promises_groups_freezes_and_it':
    'Momenta pour promesses supplémentaires, groupes, suspensions et objets.',
  'fullAuth.onboarding.momenta_for_later_choices':
    'Momenta pour des choix ultérieurs.',
  'fullAuth.onboarding.my_promise': 'Ma promesse',
  'fullAuth.onboarding.next_due': 'Prochaine échéance',
  'fullAuth.onboarding.note': 'Note',
  'fullAuth.onboarding.opening_email': 'Ouverture du e‑mail…',
  'fullAuth.onboarding.photo': 'Photo',
  'fullAuth.onboarding.preview_my_promise': 'Aperçu de ma promesse',
  'fullAuth.onboarding.promise_length': 'Durée de la promesse',
  'fullAuth.onboarding.promise_saved_and_confirmed':
    'Promesse enregistrée et confirmée',
  'fullAuth.onboarding.proof': 'Preuve',
  'fullAuth.onboarding.proof_and_support': 'PREUVE ET SUPPORT',
  'fullAuth.onboarding.proof_cadence': 'Fréquence de la preuve',
  'fullAuth.onboarding.providername_sign_in_did_not_finish':
    '{providerName} connexion non terminée.',
  'fullAuth.onboarding.read_the_current_account_and_community_documents':
    'Lisez les documents actuels de compte et de communauté avant de créer votre promesse.',
  'fullAuth.onboarding.record_a_short_clip': 'Enregistrez un court extrait.',
  'fullAuth.onboarding.referral_code': 'Code de parrainage',
  'fullAuth.onboarding.reopen_onboarding_before_continuing_with_email':
    "Rouvrez l'accueil avant de continuer avec l'e‑mail.",
  'fullAuth.onboarding.restored_from_this_phone':
    'Restauré depuis ce téléphone',
  'fullAuth.onboarding.return_to_draft': 'Revenir au brouillon',
  'fullAuth.onboarding.review_menta_s_terms':
    'Examiner les conditions de Menta',
  'fullAuth.onboarding.review_your_promise': 'Examinez votre promesse',
  'fullAuth.onboarding.save_this_promise_to_menta':
    'Enregistrez cette promesse sur Menta.',
  'fullAuth.onboarding.save_your_promise': 'Enregistrez votre promesse',
  'fullAuth.onboarding.schedule': 'Calendrier',
  'fullAuth.onboarding.schedule_every_day': 'Calendrier, Tous les jours',
  'fullAuth.onboarding.show_another_example': 'Montrer un autre exemple',
  'fullAuth.onboarding.sign_in_to_save_my_promise':
    'Se connecter pour enregistrer ma promesse',
  'fullAuth.onboarding.start_privately_you_can_invite_people_later':
    'Commencer en privé. Vous pourrez inviter des personnes plus tard.',
  'fullAuth.onboarding.start_with_one_thing_that_matters_today':
    "Commencez avec une chose qui compte aujourd'hui.",
  'fullAuth.onboarding.stay_here_and_try_again_so_menta_can_keep_this_p':
    'Restez ici et réessayez afin que Menta puisse conserver cette promesse sur ce téléphone.',
  'fullAuth.onboarding.stay_here_and_try_email_sign_in_again_so_menta_c':
    'Restez ici et réessayez la connexion par e‑mail afin que Menta puisse conserver cette promesse sur ce téléphone.',
  'fullAuth.onboarding.take_one_photo': 'Prenez une photo.',
  'fullAuth.onboarding.this_choice_sets_your_next_step_it_does_not_add_':
    "Ce choix définit votre prochaine étape. Il n'ajoute ni personne ni groupe pour le moment.",
  'fullAuth.onboarding.use_duration_days': 'Utiliser {duration} jours',
  'fullAuth.onboarding.video': 'Vidéo',
  'fullAuth.onboarding.welcome_momenta': 'Bienvenue Momenta',
  'fullAuth.onboarding.what_s_one_thing_you_want_to_do':
    'Quelle est la chose que vous voulez faire ?',
  'fullAuth.onboarding.who_will_hold_you_accountable':
    'Qui vous tiendra responsable ?',
  'fullAuth.onboarding.write_what_happened': "Écrivez ce qui s'est passé.",
  'fullAuth.onboarding.you_can_review_these_choices_before_menta_saves_':
    "Vous pouvez vérifier ces choix avant que Menta n'enregistre quoi que ce soit.",
  'fullAuth.onboarding.your_account_changed': 'Votre compte a changé.',
  'fullAuth.onboarding.your_draft_could_not_be_saved_yet':
    "Votre brouillon n'a pas pu être enregistré pour le moment.",
  'fullAuth.onboarding.your_draft_is_private_on_this_phone_sign_in_to_k':
    'Votre brouillon est privé sur ce téléphone. Connectez‑vous pour le garder.',
  'fullAuth.onboarding.your_draft_is_still_private_on_this_phone':
    'Votre brouillon est toujours privé sur ce téléphone.',
  'fullAuth.onboarding.your_first_promise': 'VOTRE PREMIÈRE PROMESSE',
  'fullAuth.onboarding.for_promise': 'Pour « {promise} »',
  'fullAuth.onboarding.check_ins': '{count} suivis',
  'fullAuth.onboarding.your_first_promise_2': 'Votre première promesse',
  'fullAuth.onboarding.your_first_promise_is': 'Votre première promesse est',
  'fullAuth.onboarding.your_promise': 'Votre promesse',
  'fullAuth.onboarding.your_promise_2': 'VOTRE PROMESSE',
  'fullAuth.onboarding.your_promise_is_ready': 'Votre promesse est prête.',
  'fullAuth.onboarding.your_promise_is_safe_confirm_the_documents_below':
    'Votre promesse est en sécurité. Confirmez les documents ci-dessous avant de la créer.',
  'fullAuth.onboarding.your_promise_is_safe_try_again_before_continuing':
    'Votre promesse est en sécurité. Réessayez avant de continuer.',
  'fullAuth.onboarding.your_promise_is_still_safe_review_the_current_do':
    'Votre promesse est toujours en sécurité. Consultez les documents actuels quand vous serez prêt à poursuivre.',
  'fullAuth.password_recovery.change_my_password': 'Changer mon mot de passe',
  'fullAuth.password_recovery.choose_a_new_password':
    'Choisir un nouveau mot de passe',
  'fullAuth.password_recovery.close': 'Fermer',
  'fullAuth.password_recovery.close_password_reset':
    'Fermer la réinitialisation du mot de passe',
  'fullAuth.password_recovery.confirm_password': 'Confirmer le mot de passe',
  'fullAuth.password_recovery.couldn_t_change_your_password':
    'Impossible de changer votre mot de passe',
  'fullAuth.password_recovery.enter_new_password':
    'Saisissez le nouveau mot de passe',
  'fullAuth.password_recovery.menta': 'Menta',
  'fullAuth.password_recovery.new_password': 'Nouveau mot de passe',
  'fullAuth.password_recovery.or_more_characters_both_entries_must_match':
    'ou plus caractères. Les deux champs doivent correspondre.',
  'fullAuth.password_recovery.other_signed_in_devices_may_ask_for_the_new_pass':
    "D'autres appareils connectés peuvent demander le nouveau mot de passe.",
  'fullAuth.password_recovery.password_changed': 'Mot de passe changé',
  'fullAuth.password_recovery.re_enter_new_password':
    'Ressaisissez le nouveau mot de passe',
  'fullAuth.password_recovery.request_a_new_link': 'Demander un nouveau lien',
  'fullAuth.password_recovery.request_a_new_link_your_draft_is_still_on_this_p':
    'Demander un nouveau lien. Votre brouillon est toujours sur ce téléphone.',
  'fullAuth.password_recovery.return_to': 'Retour à',
  'fullAuth.password_recovery.sign_in': 'Se connecter',
  'fullAuth.password_recovery.sign_in_instead': 'Se connecter à la place',
  'fullAuth.password_recovery.this_reset_link_has_expired':
    'Ce lien de réinitialisation a expiré.',
  'fullAuth.password_recovery.use': 'Utiliser',
  'fullAuth.password_recovery.your_password_has_been_changed':
    'Votre mot de passe a été changé.',
  'fullAuth.report_issue.1_open_2_tap_3_notice':
    '1. Ouvrir… 2. Toucher… 3. Avis…',
  'fullAuth.report_issue.add_a_screenshot': "Ajouter une capture d'écran",
  'fullAuth.report_issue.add_more_detail': 'Ajouter plus de détails',
  'fullAuth.report_issue.add_the_basics': 'Ajouter les bases',
  'fullAuth.report_issue.attach_a_jpeg_png_or_webp_screenshot':
    "Joindre une capture d'écran JPEG, PNG ou WebP.",
  'fullAuth.report_issue.back_to_support': 'Retour au support',
  'fullAuth.report_issue.choose_a_screenshot_smaller_than_8_mb':
    "Choisissez une capture d'écran de moins de 8 Mo.",
  'fullAuth.report_issue.choose_an_image': 'Choisir une image',
  'fullAuth.report_issue.choose_another_report': 'Choisir un autre rapport',
  'fullAuth.report_issue.choose_screenshot': "Choisir la capture d'écran",
  'fullAuth.report_issue.could_not_find_this_saved_report':
    'Impossible de trouver ce rapport enregistré',
  'fullAuth.report_issue.crash_reference': 'Référence du plantage',
  'fullAuth.report_issue.expected_result_optional':
    'Résultat attendu, optionnel',
  'fullAuth.report_issue.expected_result_optional_2':
    'Résultat attendu (optionnel)',
  'fullAuth.report_issue.feedback_received': 'Commentaires reçus',
  'fullAuth.report_issue.feedback_required': 'Commentaires, requis',
  'fullAuth.report_issue.give_the_report_a_short_title_and_explain_what_h':
    "Donnez un titre court au rapport et expliquez ce qui s'est produit.",
  'fullAuth.report_issue.inappropriate': 'inapproprié',
  'fullAuth.report_issue.it_is_not_saved_under_this_account_nothing_was_c':
    "Il n'est pas enregistré sous ce compte. Aucun changement n'a été effectué.",
  'fullAuth.report_issue.keep_this_screen_open_while_you_write_or_copy_th':
    'Laissez cet écran ouvert pendant que vous écrivez, ou copiez le texte avant de quitter.',
  'fullAuth.report_issue.last_step': 'Dernière étape',
  'fullAuth.report_issue.menta_could_not_open_your_photo_library_try_agai':
    "Menta n'a pas pu ouvrir votre bibliothèque de photos. Réessayez.",
  'fullAuth.report_issue.menta_could_not_preserve_this_report_locally_kee':
    "Menta n'a pas pu conserver ce rapport localement. Gardez cet écran ouvert ; rien n'a été envoyé au support.",
  'fullAuth.report_issue.menta_does_not_add_device_diagnostics_to_this_re':
    "Menta n'ajoute pas de diagnostiques d'appareil à ce rapport.",
  'fullAuth.report_issue.menta_includes_the_item_or_screen_you_reported':
    "Menta inclut l'élément ou l'écran que vous avez signalé.",
  'fullAuth.report_issue.not_sent': 'non‑envoyé',
  'fullAuth.report_issue.open': 'ouvert',
  'fullAuth.report_issue.preparing_private_report_draft':
    'Préparation du brouillon de rapport privé',
  'fullAuth.report_issue.proof_upload_gets_stuck':
    'Le téléchargement de la preuve se bloque',
  'fullAuth.report_issue.reference': 'Référence',
  'fullAuth.report_issue.remove': 'Supprimer',
  'fullAuth.report_issue.replace_screenshot': "Remplacer la capture d'écran",
  'fullAuth.report_issue.report_an_issue': 'Signaler un problème',
  'fullAuth.report_issue.report_not_sent': 'Rapport non envoyé',
  'fullAuth.report_issue.report_received': 'Rapport reçu',
  'fullAuth.report_issue.retry_sending_report':
    "Réessayer d'envoyer le rapport",
  'fullAuth.report_issue.return_to_support': 'Retour au support',
  'fullAuth.report_issue.review_feedback': 'Examiner les commentaires',
  'fullAuth.report_issue.review_report': 'Examiner le rapport',
  'fullAuth.report_issue.screenshot_did_not_open':
    "La capture d'écran ne s'est pas ouverte",
  'fullAuth.report_issue.screenshot_is_too_large':
    "La capture d'écran est trop grande",
  'fullAuth.report_issue.screenshot_optional': "Capture d'écran (optionnelle)",
  'fullAuth.report_issue.selected_support_screenshot':
    "Capture d'écran de support sélectionnée",
  'fullAuth.report_issue.server_confirmed': 'confirmé par le serveur',
  'fullAuth.report_issue.share_feedback': 'Partager les commentaires',
  'fullAuth.report_issue.short_title': 'Titre court',
  'fullAuth.report_issue.short_title_required': 'Titre court, requis',
  'fullAuth.report_issue.sign_in_again_before_sending_this_private_report':
    "Se reconnecter avant d'envoyer ce rapport privé. Aucun rapport n'a été envoyé.",
  'fullAuth.report_issue.sign_in_required': 'Connexion requise',
  'fullAuth.report_issue.status': 'Statut',
  'fullAuth.report_issue.steps_to_reproduce_optional':
    'Étapes pour reproduire, optionnel',
  'fullAuth.report_issue.steps_to_reproduce_optional_2':
    'Étapes pour reproduire (optionnel)',
  'fullAuth.report_issue.support_reference': 'Référence du support ·',
  'fullAuth.report_issue.this_comes_from_where_you_opened':
    ". Cela provient de l'emplacement où vous avez ouvert",
  'fullAuth.report_issue.this_report_is_not_being_saved':
    "Ce rapport n'est pas en cours d'enregistrement",
  'fullAuth.report_issue.type': 'type :',
  'fullAuth.report_issue.we_ll_show_a_support_reference_only_after_the_re':
    "Nous afficherons une référence de support uniquement après l'arrivée du rapport. Si la première tentative est peu claire, Réessayer utilise le même rapport sans créer de doublon.",
  'fullAuth.report_issue.what_did_you_expect_menta_to_do':
    "Qu'attendiez‑vous de Menta ?",
  'fullAuth.report_issue.what_happened': "Ce qui s'est passé",
  'fullAuth.report_issue.what_happened_required': "Ce qui s'est passé, requis",
  'fullAuth.report_issue.what_i_would_change': 'Ce que je changerais',
  'fullAuth.report_issue.what_were_you_doing_and_what_did_menta_show':
    'Que faisiez‑vous, et que vous a montré Menta ?',
  'fullAuth.report_issue.what_would_you_like_the_menta_team_to_know':
    "Que souhaiteriez‑vous que l'équipe Menta sache ?",
  'fullAuth.report_issue.will_help_support_find_the_error':
    "aidera le support à trouver l'erreur.",
  'fullAuth.report_issue.your_draft_stays_on_this_phone_until_you_send_it':
    "Votre brouillon reste sur ce téléphone jusqu'à ce que vous l'envoyiez.",
  'fullAuth.report_issue.your_feedback': 'Vos commentaires',
  'fullAuth.report_issue.your_screenshot_will_be_sent_with_the_report_onl':
    "Votre capture d'écran sera envoyée avec le rapport. Seul le personnel de support autorisé peut l'ouvrir.",
  'fullAuth.settings.a_compatible_update_is_downloaded_and_ready':
    'Une mise à jour compatible a été téléchargée et est prête.',
  'fullAuth.settings.account_control': 'Gestion du compte',
  'fullAuth.settings.account_was_not_deleted': "Le compte n'a pas été supprimé",
  'fullAuth.settings.active_view_or_manage_your_subscription':
    'Actif. Voir ou gérer votre abonnement.',
  'fullAuth.settings.ad_measurement': 'Mesure publicitaire',
  'fullAuth.settings.ad_privacy_choices':
    'Choix de confidentialité publicitaire',
  'fullAuth.settings.ad_privacy_choices_did_not_open':
    'Les choix de confidentialité publicitaire ne se sont pas ouverts',
  'fullAuth.settings.advanced_diagnostics': 'Diagnostics avancés',
  'fullAuth.settings.advanced_diagnostics_are_off':
    'Les diagnostics avancés sont désactivés',
  'fullAuth.settings.advanced_diagnostics_are_on':
    'Les diagnostics avancés sont activés',
  'fullAuth.settings.advanced_diagnostics_are_still_off_check_your_co':
    'Les diagnostics avancés restent désactivés. Vérifiez votre connexion et réessayez.',
  'fullAuth.settings.ask_for_help_share_feedback_or_check_a_saved_rep':
    "Demandez de l'aide, partagez vos commentaires ou consultez un rapport enregistré.",
  'fullAuth.settings.back_to_you': 'Retour à Vous',
  'fullAuth.settings.before_you_delete_your_account':
    'Avant de supprimer votre compte',
  'fullAuth.settings.check_for_updates': 'Vérifier les mises à jour',
  'fullAuth.settings.check_your_connection_and_try_again':
    'Vérifiez votre connexion et réessayez.',
  'fullAuth.settings.checking_for_updates': 'Recherche de mises à jour',
  'fullAuth.settings.checking_your_account': 'Vérification de votre compte',
  'fullAuth.settings.checks_the_current_connection_and_known_account_':
    'Vérifie une nouvelle fois la connexion actuelle et les informations connues du compte.',
  'fullAuth.settings.close_and_reopen_menta_to_apply_the_downloaded_u':
    'Fermez et rouvrez Menta pour appliquer la mise à jour téléchargée.',
  'fullAuth.settings.community_standards': 'Règles de la communauté',
  'fullAuth.settings.confirmation': 'Confirmation',
  'fullAuth.settings.connect_before_deleting_your_account':
    'Connectez‑vous avant de supprimer votre compte',
  'fullAuth.settings.connect_to_check_this_phone':
    'Connectez‑vous pour vérifier ce téléphone.',
  'fullAuth.settings.contact_support': 'Contacter le support',
  'fullAuth.settings.continue_to_sign_in': 'Continuer vers la connexion',
  'fullAuth.settings.could_not_check_your_account':
    'Impossible de vérifier votre compte',
  'fullAuth.settings.could_not_load_your_profile':
    'Impossible de charger votre profil.',
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
    'Supprimer le compte sera disponible lorsque cette vérification sera terminée.',
  'fullAuth.settings.deletion_result_unknown':
    'Résultat de la suppression inconnu',
  'fullAuth.settings.do_not_send_another_request_yet_check_whether_yo':
    "N'envoyez pas encore une autre requête. Vérifiez si vous pouvez toujours vous connecter, ou contactez le support.",
  'fullAuth.settings.download_the_latest_compatible_menta_update':
    'Téléchargez la dernière mise à jour compatible de Menta.',
  'fullAuth.settings.extra_performance_measurements_start_now':
    'Des mesures de performance supplémentaires démarrent maintenant.',
  'fullAuth.settings.extra_performance_measurements_start_now_masked_':
    "Des mesures de performance supplémentaires démarrent maintenant. L'enregistrement diagnostique masqué démarre sur les écrans concernées ; rouvrez Menta pour appliquer tous les réglages d'enregistrement Sentry.",
  'fullAuth.settings.feedback_and_support': 'Commentaires et support',
  'fullAuth.settings.for_your_privacy_account_settings_stay_hidden_un':
    "Pour votre confidentialité, les réglages de compte restent cachés jusqu'à une nouvelle connexion.",
  'fullAuth.settings.help_and_feedback': 'Aide et commentaires',
  'fullAuth.settings.how_menta_handles_your_data':
    'Comment Menta gère vos données.',
  'fullAuth.settings.keep_current_setting': 'Conserver le réglage actuel',
  'fullAuth.settings.keep_my_account': 'Conserver mon compte',
  'fullAuth.settings.label_did_not_open': "{label} ne s'est pas ouvert",
  'fullAuth.settings.leave_a_review': 'Laisser un avis',
  'fullAuth.settings.leave_this_device_your_menta_account_stays_activ':
    'Laisser cet appareil. Votre compte Menta reste actif.',
  'fullAuth.settings.loading_account_specific_settings':
    'Chargement des réglages spécifiques au compte',
  'fullAuth.settings.measure_whether_meta_ads_helped_someone_use_ment':
    "Mesurer si les publicités Meta ont aidé quelqu'un à utiliser Menta.",
  'fullAuth.settings.membership': 'Abonnement',
  'fullAuth.settings.menta_cannot_check_whether_you_still_own_a_group':
    "Menta ne peut pas vérifier si vous possédez toujours un groupe. Vérifiez vos groupes avant de supprimer le compte. Supprimer Menta ne résilie pas Menta Pro, gérez l'abonnement via Apple d'abord.",
  'fullAuth.settings.menta_could_not_check_for_updates':
    "Menta n'a pas pu vérifier les mises à jour",
  'fullAuth.settings.menta_could_not_delete_the_account_check_your_co':
    "Menta n'a pas pu supprimer le compte. Vérifiez votre connexion, puis réessayez.",
  'fullAuth.settings.menta_could_not_end_this_session_your_account_an':
    "Menta n'a pas pu terminer cette session. Votre compte et votre vue locale demeurent inchangés.",
  'fullAuth.settings.menta_could_not_restart': "Menta n'a pas pu redémarrer",
  'fullAuth.settings.menta_is_checking_for_the_latest_compatible_upda':
    'Menta recherche la dernière mise à jour compatible.',
  'fullAuth.settings.menta_is_up_to_date': 'Menta est à jour',
  'fullAuth.settings.menta_pro': 'Menta Pro',
  'fullAuth.settings.menta_update_ready': 'Mise à jour de Menta prête',
  'fullAuth.settings.menta_will_continue_using_its_current_safe_versi':
    "Menta continuera d'utiliser sa version sûre actuelle.",
  'fullAuth.settings.needs_attention': 'Nécessite une attention',
  'fullAuth.settings.nothing_has_been_deleted': "Rien n'a été supprimé",
  'fullAuth.settings.nothing_was_deleted_reconnect_then_try_again':
    "Rien n'a été supprimé. Reconnectez‑vous, puis réessayez.",
  'fullAuth.settings.notifications': 'Notifications',
  'fullAuth.settings.offline': 'Hors ligne',
  'fullAuth.settings.open_when_connected': "Ouvrir lorsqu'il y a connexion.",
  'fullAuth.settings.opens_menta_pro_plans_purchase_restore_or_your_a':
    'Ouvre les plans Menta Pro, achat, restauration ou votre abonnement actif.',
  'fullAuth.settings.opens_sign_in_for_this_account':
    'Ouvre la connexion pour ce compte.',
  'fullAuth.settings.optional_performance_measurements':
    'Mesures de performance optionnelles.',
  'fullAuth.settings.optional_performance_measurements_and_masked_dia':
    'Mesures de performance optionnelles et enregistrement diagnostique masqué.',
  'fullAuth.settings.ordinary_crash_reports_stay_on':
    'Les rapports de crash ordinaires restent actifs.',
  'fullAuth.settings.ordinary_crash_reports_stay_on_when_advanced_dia':
    'Les rapports de crash ordinaires restent actifs lorsque les diagnostics avancés sont désactivés.',
  'fullAuth.settings.other_settings_are_still_available_try_loading_t':
    'Les autres réglages sont toujours disponibles. Essayez de recharger le profil lorsque la connexion sera prête.',
  'fullAuth.settings.permanently_delete_your_account_and_menta_data':
    'Supprimer définitivement votre compte et les données Menta.',
  'fullAuth.settings.plans_benefits_and_restore_purchases':
    'Plans, avantages et restauration des achats.',
  'fullAuth.settings.preferences': 'Préférences',
  'fullAuth.settings.press_restart_to_apply_the_downloaded_update':
    'Appuyez sur Redémarrer pour appliquer la mise à jour téléchargée.',
  'fullAuth.settings.privacy_and_legal': 'Vie privée et juridique',
  'fullAuth.settings.privacy_policy': 'Politique de confidentialité',
  'fullAuth.settings.profile_details': 'Détails du profil',
  'fullAuth.settings.proof_reminders_reviews_and_group_updates':
    'Rappels de preuve, revues et mises à jour de groupe.',
  'fullAuth.settings.read_menta_s_terms': 'Lire les conditions de Menta.',
  'fullAuth.settings.reopen_menta_to_stop_diagnostic_recording_ordina':
    "Rouvrez Menta pour arrêter l'enregistrement diagnostique. Les rapports de crash ordinaires restent actifs.",
  'fullAuth.settings.restarting_menta': 'Redémarrage de Menta',
  'fullAuth.settings.review_choices_used_for_sponsor_videos':
    'Examiner les choix utilisés pour les vidéos sponsors.',
  'fullAuth.settings.review_deletion_confirmation':
    'Examiner la confirmation de suppression',
  'fullAuth.settings.review_the_current_terms_and_when_you_accepted_t':
    "Examinez les conditions actuelles et la date d'acceptation.",
  'fullAuth.settings.rules_for_promises_proof_and_groups':
    'Règles sur les promesses, preuves et groupes.',
  'fullAuth.settings.session': 'Session',
  'fullAuth.settings.settings': 'Réglages',
  'fullAuth.settings.share_your_experience_and_help_others_discover_m':
    'Partagez votre expérience et aidez les autres à découvrir Menta.',
  'fullAuth.settings.sign_in_again': 'Se reconnecter',
  'fullAuth.settings.sign_in_again_before_deleting_your_account':
    'Se reconnecter avant de supprimer votre compte.',
  'fullAuth.settings.sign_in_again_to_see_settings':
    'Se reconnecter pour voir les réglages.',
  'fullAuth.settings.sign_in_needed': 'Connexion requise',
  'fullAuth.settings.sign_out': 'Déconnexion',
  'fullAuth.settings.small_performance_impact': 'Impact de performance faible',
  'fullAuth.settings.some_destinations_need_a_connection':
    'Certaines destinations nécessitent une connexion.',
  'fullAuth.settings.terms_of_use': "Conditions d'utilisation",
  'fullAuth.settings.terms_you_accepted': 'Conditions que vous avez acceptées',
  'fullAuth.settings.the_downloaded_update_will_open_automatically':
    "La mise à jour téléchargée s'ouvrira automatiquement.",
  'fullAuth.settings.the_next_screen_asks_you_to_type_delete_before_m':
    "L’écran suivant vous demande de taper DELETE avant que Menta n'envoie la requête.",
  'fullAuth.settings.this_can_use_a_small_amount_of_extra_processing_':
    'Cela peut consommer une petite quantité de ressources supplémentaires, de batterie et de données mobiles tant que Menta reste ouvert. L’enregistrement démarre uniquement sur les écrans concernés. Rouvrez Menta après l’avoir désactivé pour arrêter l’enregistrement Sentry.',
  'fullAuth.settings.this_device_has_the_latest_compatible_update':
    'Cet appareil possède la dernière mise à jour compatible.',
  'fullAuth.settings.to_confirm': 'à confirmer',
  'fullAuth.settings.tries_to_load_the_signed_in_profile_again':
    'Essaie de recharger le profil connecté.',
  'fullAuth.settings.try_again_in_a_moment_or_open_the_link_from_the_':
    "Réessayez dans un instant, ou ouvrez le lien depuis la page de l'App Store.",
  'fullAuth.settings.try_again_later_optional_ads_stay_unavailable_un':
    "Réessayez plus tard. Les publicités optionnelles restent indisponibles jusqu'à ce que vous revoyiez ces choix.",
  'fullAuth.settings.try_connection_again': 'Réessayer la connexion',
  'fullAuth.settings.try_loading_profile_again':
    'Réessayer de charger le profil',
  'fullAuth.settings.try_loading_your_name_and_profile_photo_again':
    'Réessayer de charger votre nom et votre photo de profil à nouveau.',
  'fullAuth.settings.try_the_account_check_again_before_you_delete_an':
    'Recommencez la vérification du compte avant de supprimer quoi que ce soit.',
  'fullAuth.settings.turn_off_advanced_diagnostics':
    'Désactiver les diagnostics avancés',
  'fullAuth.settings.turn_on_advanced_diagnostics':
    'Activer les diagnostics avancés',
  'fullAuth.settings.type': 'Type',
  'fullAuth.settings.type_delete_to_confirm_account_deletion':
    'Tapez DELETE pour confirmer la suppression du compte',
  'fullAuth.settings.update_checks_are_unavailable':
    'Les vérifications de mise à jour sont indisponibles',
  'fullAuth.settings.while_enabled_this_can_use_a_small_amount_of_ext':
    'Lorsque activé, cela peut consommer une petite quantité de ressources supplémentaires, de batterie et de données mobiles tant que Menta reste ouvert.',
  'fullAuth.settings.you_are_still_signed_in': 'Vous êtes toujours connecté',
  'fullAuth.settings.your_account_stays_open_until_menta_confirms_the':
    "Votre compte reste ouvert jusqu'à ce que Menta confirme la suppression.",
  'fullAuth.settings.your_account_was_deleted': 'Votre compte a été supprimé.',
  'fullAuth.settings.your_choice_was_not_saved':
    "Votre choix n'a pas pu être enregistré",
  'fullAuth.settings.your_saved_settings_are_still_here':
    'Vos réglages enregistrés sont toujours présents.',
  'fullAuth.settings.your_support_drafts_for_this_account_were_remove':
    'Vos brouillons de support pour ce compte ont été supprimés.',
  'fullAuth.support.change_menta_permissions_on_this_phone':
    'Modifier les autorisations Menta sur ce téléphone',
  'fullAuth.support.check_app_and_connection':
    "Vérifier l'application et la connexion",
  'fullAuth.support.check_the_apple_account_used_for_the_original_pu':
    "Vérifiez le compte Apple utilisé pour l'achat original. Si Apple indique une facturation, signalez le problème avant d'acheter à nouveau.",
  'fullAuth.support.checking_private_report_drafts':
    'Vérification des brouillons de rapports privés',
  'fullAuth.support.checking_purchases': 'Vérification des achats',
  'fullAuth.support.choose_what_you_need_you_can_review_everything_b':
    "Choisissez ce dont vous avez besoin. Vous pouvez tout examiner avant l'envoi.",
  'fullAuth.support.connection_available': 'Connexion disponible',
  'fullAuth.support.connection_check_did_not_finish':
    "La vérification de la connexion ne s'est pas terminée",
  'fullAuth.support.could_not_check_earlier_purchases':
    'Impossible de vérifier les achats précédents',
  'fullAuth.support.do_not_buy_it_again_while_this_check_continues':
    "N'achetez pas à nouveau tant que cette vérification se poursuit.",
  'fullAuth.support.find_an_earlier_menta_pro_purchase':
    'Trouver un achat Menta Pro antérieur',
  'fullAuth.support.hide_more_help': "Masquer plus d'aide",
  'fullAuth.support.looking_for_an_earlier_menta_pro_purchase':
    "Recherche d'un achat Menta Pro antérieur",
  'fullAuth.support.menta_appears_offline': 'Menta apparaît hors ligne',
  'fullAuth.support.menta_pro_is_active_again':
    'Menta Pro est de nouveau actif',
  'fullAuth.support.menta_pro_is_still_being_checked':
    'Menta Pro est encore en cours de vérification',
  'fullAuth.support.more_help': "Plus d'aide",
  'fullAuth.support.no_matching_purchase_was_found':
    "Aucun achat correspondant n'a été trouvé",
  'fullAuth.support.nothing_was_purchased_or_changed_check_the_conne':
    'Aucun achat ou modification détecté. Vérifiez la connexion et réessayez.',
  'fullAuth.support.open_phone_settings': 'Ouvrir les réglages du téléphone',
  'fullAuth.support.opens_a_separate_support_report':
    'Ouvre un rapport de support distinct.',
  'fullAuth.support.opens_sign_in_before_starting_a_private_report':
    'Ouvre la connexion avant de commencer un rapport privé.',
  'fullAuth.support.other_help': 'Autre aide',
  'fullAuth.support.restore_purchases': 'Restaurer les achats',
  'fullAuth.support.saved_on_this_phone_and_still_waiting_to_be_sent':
    "enregistré sur ce téléphone et toujours en attente d'envoi.",
  'fullAuth.support.saved_reports': 'Rapports enregistrés',
  'fullAuth.support.see_app_version_connection_and_saved_proof':
    "Voir la version de l'app, la connexion et les preuves enregistrées",
  'fullAuth.support.share_feedback': 'Partager des commentaires',
  'fullAuth.support.sign_in_required': 'Connexion nécessaire',
  'fullAuth.support.sign_in_to_report_an_issue':
    'Se connecter pour signaler un problème',
  'fullAuth.support.support': 'Support',
  'fullAuth.support.support_drafts_stay_private_to_the_account_that_':
    'Les brouillons de support restent privés au compte qui les a créés. Connectez‑vous avant de lancer un nouveau rapport.',
  'fullAuth.support.this_does_not_start_a_new_purchase_or_charge_thi':
    'Cela ne débute pas un nouvel achat ou ne facture pas ce compte.',
  'fullAuth.support.version_appversion_savedcopy_nothing_changed_try':
    "Version {appVersion}. {savedCopy} Aucun changement. Relancez la vérification quand votre connexion s'améliorera.",
  'fullAuth.support.version_appversion_savedcopy_saved_proof_stays_o':
    "Version {appVersion}. {savedCopy} La preuve enregistrée reste sur ce téléphone jusqu'à ce que Menta confirme son envoi.",
  'fullAuth.support.your_earlier_purchase_is_active_on_this_account':
    'Votre achat antérieur est actif sur ce compte.',
  'fullAuth.system_settings.back_to_support': 'Retour au support',
  'fullAuth.system_settings.change_notification_camera_photo_or_ad_measureme':
    "Modifiez les autorisations de notification, d'appareil photo, de photo ou de mesure publicitaire dans les réglages de votre téléphone. Menta ne peut pas les modifier ou les confirmer depuis cet écran.",
  'fullAuth.system_settings.nothing_changed_in_menta_open_your_phone_setting':
    "Aucun changement dans Menta. Ouvrez les réglages du téléphone manuellement, puis revenez à l'app.",
  'fullAuth.system_settings.open_phone_settings':
    'Ouvrir les réglages du téléphone',
  'fullAuth.system_settings.opening_phone_settings_does_not_confirm_that_a_p':
    "Ouvrir les réglages du téléphone ne confirme pas qu'une autorisation a changé.",
  'fullAuth.system_settings.phone_settings': 'Réglages du téléphone',
  'fullAuth.system_settings.phone_settings_could_not_open':
    "Impossible d'ouvrir les réglages du téléphone",
  'fullAuth.system_settings.return_when_you_re_done':
    'Revenez quand vous avez fini',
  'fullAuth.tabs_profile.active_and_past_promises':
    'Promesses actives et passées',
  'fullAuth.tabs_profile.active_promises': 'Promesses actives',
  'fullAuth.tabs_profile.activepromisecount_active_promises_currentstreak':
    '{activePromiseCount} promesses actives, série de {currentStreak} jours, {length} groupes',
  'fullAuth.tabs_profile.change_profile_photo': 'Changer la photo du profil',
  'fullAuth.tabs_profile.choose_one_thing_to_follow_through_on_it_will_ap':
    "Choisissez une chose à accomplir. Elle apparaîtra dans Aujourd'hui avec la preuve que vous choisissez.",
  'fullAuth.tabs_profile.create_a_promise': 'Créer une promesse',
  'fullAuth.tabs_profile.current_reward_terms_and_your_link':
    'Conditions de récompense actuelles et votre lien',
  'fullAuth.tabs_profile.day_streak': 'Série de jours',
  'fullAuth.tabs_profile.edit_profile': 'Modifier le profil',
  'fullAuth.tabs_profile.for_your_privacy_menta_hides_the_previous_accoun':
    'Pour votre confidentialité, Menta masque le compte précédent lorsque la session se termine.',
  'fullAuth.tabs_profile.groups': 'Groupes',
  'fullAuth.tabs_profile.invite': 'inviter',
  'fullAuth.tabs_profile.invite_friends': 'Inviter des amis',
  'fullAuth.tabs_profile.loading_your_profile': 'Chargement de votre profil',
  'fullAuth.tabs_profile.make_your_first_promise':
    'Faites votre première promesse',
  'fullAuth.tabs_profile.menta_kept_the_last_details_saved_for_this_accou':
    "Menta a conservé les derniers détails enregistrés pour ce compte. Vous pouvez toujours modifier votre profil et utiliser d'autres actions de profil.",
  'fullAuth.tabs_profile.momenta': 'Momenta',
  'fullAuth.tabs_profile.no_promises_yet': 'Aucune promesse pour le moment',
  'fullAuth.tabs_profile.open_saved_type_invite': 'Ouvrir {type} enregistré',
  'fullAuth.tabs_profile.open_the_invite_to_review_it_before_joining':
    "Ouvrez l'invitation pour la réviser avant de rejoindre.",
  'fullAuth.tabs_profile.opens_your_invite_link_and_the_current_reward_te':
    "Ouvre votre lien d'invitation et les conditions de récompense actuelles.",
  'fullAuth.tabs_profile.personal_promises': 'Promesses personnelles',
  'fullAuth.tabs_profile.profile_details_may_be_out_of_date':
    'Les détails du profil peuvent être obsolètes',
  'fullAuth.tabs_profile.progress_and_rewards': 'Progression et récompenses',
  'fullAuth.tabs_profile.progress_starts_with_proof':
    'La progression commence avec la preuve',
  'fullAuth.tabs_profile.saved': 'Enregistré',
  'fullAuth.tabs_profile.sign_in_again': 'Se reconnecter',
  'fullAuth.tabs_profile.sign_in_to_see_you': 'Connectez‑vous pour voir Vous',
  'fullAuth.tabs_profile.streaks_and_progress_appear_after_you_send_proof':
    "Les séries et la progression apparaissent après que vous avez envoyé la preuve d'une promesse active.",
  'fullAuth.tabs_profile.the_last_saved_promise_and_group_counts_are_stil':
    'Le dernier compte promesse et le nombre de groupes restent affichés. Les autres actions du profil restent disponibles.',
  'fullAuth.tabs_profile.wallet_shop_and_items':
    'Portefeuille, boutique et objets',
  'fullAuth.tabs_profile.you': 'Vous',
  'fullAuth.tabs_profile.your_progress_may_be_out_of_date':
    'Votre progression peut être obsolète',
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
  'fullAuth.residual.legal.return_settings': 'Retour aux réglages',
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
    'Les réglages de notifications n’ont pas pu être chargés. Vos choix enregistrés restent inchangés.',
  'fullAuth.residual.notifications.off_save':
    'Les choix sont enregistrés ici. Les notifications restent désactivées sur ce téléphone.',
  'fullAuth.residual.notifications.sign_in_again':
    'Reconnectez-vous pour gérer vos réglages de notifications.',
  'fullAuth.residual.notifications.still_apply':
    'Vos choix de notifications enregistrés pourraient toujours s’appliquer. Réessayez ou retournez aux réglages.',
  'fullAuth.residual.oauth.apple_sign_in_fallback':
    'La connexion avec Apple a échoué. Réessayez ou utilisez votre e-mail.',
  'fullAuth.residual.paper_auth.account_email':
    'Entrez le e-mail de ce compte Menta.',
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
    'Ce e-mail est déjà associé à un compte Menta.',
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
    'Entrez une adresse e-mail valide.',
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
    'Dites-nous ce que vous faisiez et ce que Menta a fait. Ces détails aident l’équipe de support à examiner le problème.',
  'fullAuth.residual.report.issue_heading': 'Qu’est-ce qui n’a pas fonctionné?',
  'fullAuth.residual.report.message_label': 'Message',
  'fullAuth.residual.report.other_account':
    'Ce signalement appartient à un autre compte',
  'fullAuth.residual.report.received_content':
    'Menta a reçu ce signalement. Le personnel de sécurité autorisé peut examiner le contenu signalé, y compris le contenu de groupes sur invitation. Les autres membres ne peuvent pas voir qui a fait le signalement.',
  'fullAuth.residual.report.received_feedback':
    'Le support a reçu vos commentaires. Votre preuve, votre série et votre historique de groupe restent inchangés.',
  'fullAuth.residual.report.received_report':
    'Le support a reçu votre signalement. Votre preuve, votre série et votre historique de groupe restent inchangés pendant l’examen.',
  'fullAuth.residual.report.report_context_label': 'le signalement',
  'fullAuth.residual.report.report_label': 'Signaler',
  'fullAuth.residual.report.return_description':
    'Retournez au support, puis commencez un nouveau signalement pour ce compte.',
  'fullAuth.residual.report.screenshot_feedback':
    'Ajoutez une capture d’écran si elle aide à expliquer vos commentaires.',
  'fullAuth.residual.report.screenshot_issue':
    'Ajoutez une capture d’écran qui aide le support à voir le problème.',
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
