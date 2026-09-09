import type {
  EnglishCatalogue,
  TranslationKey,
} from '@/lib/localization/en-NZ';

type FullAuthAccountKey = Extract<keyof EnglishCatalogue, `fullAuth.${string}`>;
type FullAuthSourceKey = Extract<TranslationKey, `fullAuth.source.${string}`>;
type FullAuthResidualKey = Extract<
  TranslationKey,
  `fullAuth.residual.${string}`
>;

export const fullAuthAccountDeDE = {
  'fullAuth.shared.try_again': 'Versuche es erneut',
  'fullAuth.support.untitled_report': 'Bericht ohne Titel',
  'fullAuth.onboarding.promise_setup_step_one':
    'Versprechen einrichten · 1 von 2',
  'fullAuth.onboarding.promise_setup_step_two':
    'Versprechen einrichten · 2 von 2',
  'fullAuth.component_onboarding_paperauthreset.your_account_email':
    'deine E-Mail-Adresse für das Konto',
  'fullAuth.shared.back_to_you': 'Zurück zu dir',
  'fullAuth.shared.promise': 'Versprechen',
  'fullAuth.shared.terms': 'AGB',
  'fullAuth.shared.back_to_settings': 'Zurück zu den Einstellungen',
  'fullAuth.shared.other_sign_in_options': 'Weitere Anmeldemöglichkeiten',
  'fullAuth.shared.retry_profile': 'Profil erneut versuchen',
  'fullAuth.shared.refresh_progress': 'Fortschritt aktualisieren',
  'fullAuth.shared.check_connection_again': 'Verbindung erneut prüfen',
  'fullAuth.shared.sign_in': 'Anmelden',
  'fullAuth.support.feedback': 'Rückmeldung',
  'fullAuth.support.promise_report': 'Versprechensbericht',
  'fullAuth.support.group_report': 'Gruppenbericht',
  'fullAuth.support.proof_report': 'Nachweisbericht',
  'fullAuth.support.app_issue': 'App-Problem',
  'fullAuth.support.checking_saved_proof':
    'Der auf diesem Telefon gespeicherte Nachweis wird geprüft.',
  'fullAuth.support.saved_proof_count_unavailable':
    'Anzahl gespeicherter Nachweise nicht verfügbar.',
  'fullAuth.support.no_proof_waiting':
    'Auf diesem Telefon wartet kein Nachweis.',
  'fullAuth.support.proof_count_saved':
    '{count} {proofLabel} auf diesem Telefon gespeichert.',
  'fullAuth.support.proof_is': 'Nachweis ist',
  'fullAuth.support.proofs_are': 'Nachweise sind',
  'fullAuth.support.saved_proof_waiting_to_be_sent':
    '{count} {proofLabel} auf diesem Telefon gespeichert und wartet noch auf den Versand.',
  'fullAuth.email_auth.create_account': 'Konto erstellen',
  'fullAuth.email_auth.sign_in': 'Anmelden',
  'fullAuth.email_auth.already_have_account': 'Du hast bereits ein Konto?',
  'fullAuth.email_auth.new_to_menta': 'Neu bei Menta?',
  'fullAuth.email_auth.offline_reconnect':
    'Du bist offline. Stelle die Verbindung wieder her und versuche es erneut.',
  'fullAuth.email_auth.too_many_attempts':
    'Zu viele Versuche. Warte einen Moment und versuche es dann erneut.',
  'fullAuth.email_auth.could_not_sign_in':
    'Anmeldung fehlgeschlagen. Überprüfe deine E-Mail-Adresse und dein Passwort und versuche es dann erneut.',
  'fullAuth.email_auth.could_not_create_account':
    'Dein Konto konnte nicht erstellt werden. Überprüfe deine Verbindung und versuche es dann erneut.',
  'fullAuth.email_auth.enter_password': 'Gib dein Passwort ein.',
  'fullAuth.email_auth.create_password': 'Erstelle ein Passwort.',
  'fullAuth.email_auth.confirm_your_password': 'Bestätige dein Passwort.',
  'fullAuth.email_auth.password_minimum':
    'Verwende mindestens {length} Zeichen.',
  'fullAuth.email_auth.password_mismatch': 'Passwörter stimmen nicht überein.',
  'fullAuth.email_auth.choose_username': 'Wähle einen Benutzernamen.',
  'fullAuth.email_auth.minimum_three_characters':
    'Verwende mindestens 3 Zeichen.',
  'fullAuth.email_auth.username_characters_only':
    'Verwende nur Buchstaben, Zahlen oder Unterstriche.',
  'fullAuth.email_auth.account_email':
    'Gib die E-Mail-Adresse deines Menta-Kontos ein.',
  'fullAuth.email_auth.valid_email': 'Gib eine gültige E-Mail-Adresse ein.',
  'fullAuth.email_auth.passwords_need_to_match':
    'Passwörter müssen übereinstimmen.',
  'fullAuth.password_recovery.confirm_new_password':
    'Bestätige dein neues Passwort.',
  'fullAuth.password_recovery.passwords_mismatch':
    'Die Passwörter stimmen nicht überein.',
  'fullAuth.password_recovery.minimum_password_length':
    'Verwende mindestens {length} Zeichen.',
  'fullAuth.password_recovery.could_not_change_now':
    'Wir konnten dein Passwort momentan nicht ändern.',
  'fullAuth.password_recovery.sign_in_with_new_password_draft':
    'Melde dich mit deinem neuen Passwort an und kehre dann zu deinem Entwurf zurück.',
  'fullAuth.password_recovery.sign_in_with_new_password':
    'Du kannst dich nun mit deinem neuen Passwort anmelden.',
  'fullAuth.language_settings.system_accessibility':
    'Verwende die Telefonsprache. {systemSubtitle}',
  'fullAuth.forgot_password.enter_email_tied_to_account':
    'Gib die E-Mail-Adresse ein, die mit deinem Menta-Konto verknüpft ist.',
  'fullAuth.forgot_password.enter_valid_email':
    'Gib eine gültige E-Mail-Adresse ein.',
  'fullAuth.forgot_password.could_not_send_reset_email':
    'Die E-Mail zum Zurücksetzen konnte nicht gesendet werden. Überprüfe deine Verbindung und versuche es erneut.',
  'fullAuth.password_recovery_callback.checking_secure_reset_link':
    'Dein sicherer Link zum Zurücksetzen wird überprüft …',
  'fullAuth.password_recovery_callback.reset_link_verified':
    'Link zum Zurücksetzen geprüft.',
  'fullAuth.report_issue.send_feedback': 'Rückmeldung senden',
  'fullAuth.report_issue.send_report': 'Bericht senden',
  'fullAuth.support.start_a_new_report': 'Starte einen neuen Bericht',
  'fullAuth.support.report_an_issue': 'Ein Problem melden',
  'fullAuth.notification_settings.daily_proof_reminders_and_promise_ending_updates':
    'Tägliche Nachweiserinnerungen und Updates zum Ende des Versprechens.',
  'fullAuth.notification_settings.saved_but_notifications_are_off_on_this_phone':
    'Gespeichert, aber Mitteilungen sind auf diesem Telefon deaktiviert.',
  'fullAuth.notification_settings.occasional_updates_to_email_unsubscribe_here':
    'Gelegentliche Aktualisierungen an {email}. Hier kannst du dich jederzeit abmelden.',
  'fullAuth.notification_settings.a_confirmed_account_email_is_required':
    'Eine bestätigte Konto-E-Mail-Adresse ist erforderlich.',
  'fullAuth.onboarding.menta_mascot_holding_your_first_promise':
    'Das Menta-Maskottchen hält dein erstes Versprechen',
  'fullAuth.onboarding.menta_mascot_waving_hello':
    'Menta-Maskottchen winkt zur Begrüßung',
  'fullAuth.onboarding.your_saved_draft_is_back_on_this_phone':
    'Dein gespeicherter Entwurf ist wieder auf diesem Telefon verfügbar.',
  'fullAuth.onboarding.saved_privately_on_this_phone_as_you_type':
    'Wird während deiner Eingabe privat auf diesem Telefon gespeichert.',
  'fullAuth.account_deleted.apple_instructions_did_not_open':
    'Apple-Anleitung wurde nicht geöffnet',
  'fullAuth.account_deleted.checking_account_deletion': 'Löschung des Kontos',
  'fullAuth.account_deleted.go_to_sign_in': 'Zur Anmeldung gehen',
  'fullAuth.account_deleted.if_you_used_sign_in_with_apple_remove_menta_from':
    'Wenn du „Mit Apple anmelden“ verwendet hast, entferne Menta aus den Apps, die mit deinem Apple-Konto verbunden sind. Öffne die iPhone-Einstellungen, tippe auf deinen Namen und dann auf „Mit Apple anmelden“.',
  'fullAuth.account_deleted.open_apple_support_and_search_for_manage_your_ap':
    'Öffne den Apple Support und suche nach „Verwalten deiner Apps mit ‚Mit Apple anmelden‘“.',
  'fullAuth.account_deleted.remove_apple_access': 'Apple-Zugriff entfernen',
  'fullAuth.account_deleted.see_apple_instructions': 'Apple-Anleitung anzeigen',
  'fullAuth.account_deleted.sign_in_with_apple_access_was_also_removed':
    'Der Zugang über „Mit Apple anmelden“ wurde ebenfalls entfernt.',
  'fullAuth.account_deleted.your_account_was_deleted':
    'Dein Konto wurde gelöscht',
  'fullAuth.account_deleted.your_menta_account_and_its_data_were_deleted_men':
    'Dein Menta-Konto und seine Daten wurden gelöscht. Menta hat auch die gespeicherten Daten dieses Kontos von diesem Telefon gelöscht.',
  'fullAuth.auth_required.events': 'Veranstaltungen',
  'fullAuth.auth_required.groups': 'Gruppen',
  'fullAuth.auth_required.keep_browsing': 'Weiterstöbern',
  'fullAuth.auth_required.menta': 'Menta',
  'fullAuth.auth_required.menta_records_the_review_under_your_account':
    'Menta erfasst die Prüfung in deinem Konto.',
  'fullAuth.auth_required.menta_saves_this_proof_with_the_right_promise_an':
    'Menta speichert diesen Nachweis mit dem richtigen Versprechen und der richtigen Abrechnung.',
  'fullAuth.auth_required.momenta': 'Momenta',
  'fullAuth.auth_required.proof': 'Nachweis',
  'fullAuth.auth_required.reviews': 'Prüfungen',
  'fullAuth.auth_required.sign_in': 'Anmelden',
  'fullAuth.auth_required.sign_in_to_add_proof':
    'Melde dich an, um einen Nachweis hinzuzufügen',
  'fullAuth.auth_required.sign_in_to_complete_this_action_and_return_here_':
    'Melde dich an, um diese Aktion abzuschließen, und kehre anschließend hierher zurück.',
  'fullAuth.auth_required.sign_in_to_continue':
    'Melde dich an, um fortzufahren',
  'fullAuth.auth_required.sign_in_to_continue_with_this_event':
    'Melde dich an, um mit dieser Veranstaltung fortzufahren',
  'fullAuth.auth_required.sign_in_to_join_this_group':
    'Melde dich an, um dieser Gruppe beizutreten',
  'fullAuth.auth_required.sign_in_to_review_proof':
    'Melde dich an, um den Nachweis zu prüfen',
  'fullAuth.auth_required.sign_in_to_use_momenta':
    'Melde dich an, um Momenta zu nutzen',
  'fullAuth.auth_required.your_balance_purchases_and_items_stay_with_your_':
    'Dein Guthaben, deine Einkäufe und Artikel bleiben auf deinem Konto.',
  'fullAuth.auth_required.your_invitation_and_group_activity_stay_with_you':
    'Deine Einladung und Gruppenaktivität bleiben in deinem Konto.',
  'fullAuth.auth_required.your_place_check_in_and_event_photos_are_saved_t':
    'Deine Orts-, Check-in- und Veranstaltungsfotos werden in deinem Konto gespeichert.',
  'fullAuth.auth_required.your_promises_proof_groups_and_reviews_stay_with':
    'Deine Versprechen, Nachweise, Gruppen und Prüfungen bleiben in deinem Menta-Konto.',
  'fullAuth.component_onboarding_mentasurface.hide_password':
    'Passwort verbergen',
  'fullAuth.component_onboarding_mentasurface.menta': 'Menta',
  'fullAuth.component_onboarding_mentasurface.setup': 'Einrichtung',
  'fullAuth.component_onboarding_mentasurface.show_password':
    'Passwort anzeigen',
  'fullAuth.component_onboarding_paperauthform.after_this': 'Danach',
  'fullAuth.component_onboarding_paperauthform.characters': '+ Zeichen',
  'fullAuth.component_onboarding_paperauthform.check_the_details':
    'Überprüfe die Details',
  'fullAuth.component_onboarding_paperauthform.confirm_password':
    'Passwort bestätigen',
  'fullAuth.component_onboarding_paperauthform.create_your_account':
    'Erstelle dein Konto',
  'fullAuth.component_onboarding_paperauthform.creating_your_account':
    'Dein Konto wird erstellt',
  'fullAuth.component_onboarding_paperauthform.daniel': 'Daniel',
  'fullAuth.component_onboarding_paperauthform.email': 'E-Mail',
  'fullAuth.component_onboarding_paperauthform.forgot_your_password':
    'Passwort vergessen?',
  'fullAuth.component_onboarding_paperauthform.password': 'Passwort',
  'fullAuth.component_onboarding_paperauthform.sign_in_with_email':
    'Mit E-Mail anmelden',
  'fullAuth.component_onboarding_paperauthform.signing_you_in':
    'Du wirst angemeldet',
  'fullAuth.component_onboarding_paperauthform.username': 'Benutzername',
  'fullAuth.component_onboarding_paperauthform.you_example_com':
    'you@example.com',
  'fullAuth.component_onboarding_paperauthform.you_will_return_to_your_first_promise':
    'Du wirst zu deinem ersten Versprechen zurückkehren.',
  'fullAuth.component_onboarding_paperauthform.your_promise_stays_on_this_phone_until_the_accou':
    'Dein Versprechen bleibt auf diesem Telefon, bis das Konto bereit ist.',
  'fullAuth.component_onboarding_paperauthform.your_promise_stays_on_this_phone_while_we_create':
    'Dein Versprechen bleibt auf diesem Telefon, während wir das Konto erstellen.',
  'fullAuth.component_onboarding_paperauthform.your_promise_stays_on_this_phone_while_you_sign_':
    'Dein Versprechen bleibt auf diesem Telefon, während du dich anmeldest.',
  'fullAuth.component_onboarding_paperauthmethods.choose_how_to_sign_in_your_promise_stays_on_this':
    'Wähle aus, wie du dich anmelden möchtest. Dein Versprechen bleibt auf diesem Telefon, bis die Anmeldung abgeschlossen ist.',
  'fullAuth.component_onboarding_paperauthmethods.choose_how_you_want_to_sign_in':
    'Wähle aus, wie du dich anmelden möchtest.',
  'fullAuth.component_onboarding_paperauthmethods.continue_with_apple':
    'Weiter mit Apple',
  'fullAuth.component_onboarding_paperauthmethods.continue_with_email':
    'Weiter mit E-Mail',
  'fullAuth.component_onboarding_paperauthmethods.continue_with_google':
    'Weiter mit Google',
  'fullAuth.component_onboarding_paperauthmethods.save_your_promise':
    'Versprechen speichern',
  'fullAuth.component_onboarding_paperauthmethods.see_how_menta_works':
    'Sieh, wie Menta funktioniert',
  'fullAuth.component_onboarding_paperauthmethods.sign_in_to_menta':
    'Melde dich bei Menta an',
  'fullAuth.component_onboarding_paperauthmethods.we_could_not_sign_you_in':
    'Wir konnten dich nicht anmelden',
  'fullAuth.component_onboarding_paperauthreset.back_to_sign_in':
    'Zurück zur Anmeldung',
  'fullAuth.component_onboarding_paperauthreset.check_your_email':
    'Überprüfe deine E-Mails.',
  'fullAuth.component_onboarding_paperauthreset.daniel_example_com':
    'daniel@example.com',
  'fullAuth.component_onboarding_paperauthreset.email': 'E-Mail',
  'fullAuth.component_onboarding_paperauthreset.email_sent_to':
    'E-Mail gesendet an',
  'fullAuth.component_onboarding_paperauthreset.link_valid_for_60_minutes':
    'Link gültig für 60 Minuten',
  'fullAuth.component_onboarding_paperauthreset.reset_for': 'Zurücksetzen für',
  'fullAuth.component_onboarding_paperauthreset.reset_your_password':
    'Setze dein Passwort zurück',
  'fullAuth.component_onboarding_paperauthreset.send_another_link':
    'Einen weiteren Link senden',
  'fullAuth.component_onboarding_paperauthreset.send_another_link_in_countdown':
    'Einen weiteren Link im {countdown} senden',
  'fullAuth.component_onboarding_paperauthreset.send_reset_link':
    'Link zum Zurücksetzen senden',
  'fullAuth.component_onboarding_paperauthreset.sending_your_reset_link':
    'Link zum Zurücksetzen wird gesendet',
  'fullAuth.component_onboarding_paperauthreset.use_the_latest_link':
    'Verwende den neuesten Link.',
  'fullAuth.component_onboarding_paperauthreset.use_the_link_we_just_sent_you_can_request_anothe':
    'Verwende den Link, den wir gerade gesendet haben. Du kannst einen weiteren anfordern, wenn der Timer abgelaufen ist.',
  'fullAuth.component_onboarding_paperauthreset.we_could_not_send_another_link':
    'Wir konnten keinen weiteren Link senden',
  'fullAuth.component_onboarding_paperauthreset.we_could_not_send_the_reset_link':
    'Wir konnten den Link zum Zurücksetzen nicht senden',
  'fullAuth.component_onboarding_paperauthreset.we_ll_email_you_a_secure_link_your_saved_promise':
    'Wir senden dir einen sicheren Link per E-Mail. Dein gespeichertes Versprechen bleibt auf diesem Telefon.',
  'fullAuth.component_onboarding_paperauthreset.we_re_sending_a_secure_link_to_the_address_below':
    'Wir senden einen sicheren Link an die untenstehende Adresse.',
  'fullAuth.component_onboarding_paperauthreset.we_sent_a_secure_reset_link_your_saved_promise_i':
    'Wir haben einen sicheren Link zum Zurücksetzen gesendet. Dein gespeichertes Versprechen wartet hier weiterhin.',
  'fullAuth.component_onboarding_paperauthsurface.before_you_use_the_account_you_ll_review_and_acc':
    'Bevor du das Konto verwendest, prüfst und akzeptierst du Mentas aktuelle Konto- und Community-Dokumente.',
  'fullAuth.component_onboarding_paperauthsurface.choose_sign_in_method':
    'Wähle die Anmeldemethode',
  'fullAuth.component_onboarding_paperauthsurface.community_standards':
    'Community-Standards',
  'fullAuth.component_onboarding_paperauthsurface.community_standards_did_not_open':
    'Community-Standards wurden nicht geöffnet',
  'fullAuth.component_onboarding_paperauthsurface.hide_password':
    'Passwort verbergen',
  'fullAuth.component_onboarding_paperauthsurface.keep_local_draft':
    'Lokalen Entwurf beibehalten',
  'fullAuth.component_onboarding_paperauthsurface.menta': 'Menta',
  'fullAuth.component_onboarding_paperauthsurface.menta_authentication':
    'Menta-Authentifizierung',
  'fullAuth.component_onboarding_paperauthsurface.menta_mascot':
    'Menta-Maskottchen',
  'fullAuth.component_onboarding_paperauthsurface.privacy_policy':
    'Datenschutzerklärung',
  'fullAuth.component_onboarding_paperauthsurface.privacy_policy_did_not_open':
    'Datenschutzerklärung wurde nicht geöffnet',
  'fullAuth.component_onboarding_paperauthsurface.returning_to': 'Zurück zu',
  'fullAuth.component_onboarding_paperauthsurface.show_password':
    'Passwort anzeigen',
  'fullAuth.component_onboarding_paperauthsurface.terms_did_not_open':
    'Geschäftsbedingungen wurden nicht geöffnet',
  'fullAuth.component_onboarding_paperauthsurface.terms_of_use':
    'Nutzungsbedingungen',
  'fullAuth.component_onboarding_paperauthsurface.the_provider_sheet_was_closed_before_an_account_':
    'Die Anmeldung wurde abgebrochen. Es wurde nichts erstellt oder geändert.',
  'fullAuth.component_onboarding_paperauthsurface.title_message':
    '{title} {message}',
  'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_community_standar':
    'Versuche es erneut oder besuche menta.quest/community-standards in deinem Browser.',
  'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_privacy_in_your_b':
    'Versuche es erneut oder besuche menta.quest/privacy in deinem Browser.',
  'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_terms_in_your_bro':
    'Versuche es erneut oder besuche menta.quest/terms in deinem Browser.',
  'fullAuth.component_onboarding_paperauthsurface.you_can_try_again_or_keep_working_without_signin':
    'Du kannst es erneut versuchen oder ohne Anmeldung weiterarbeiten, bis Menta es speichern muss.',
  'fullAuth.component_onboarding_paperauthsurface.you_re_still_signed_out':
    'Du bist immer noch abgemeldet.',
  'fullAuth.component_onboarding_paperauthsurface.your_local_promise_is_still_here':
    'Dein lokales Versprechen ist immer noch da',
  'fullAuth.component_settings_settingssignoutsheet.cancel': 'Abbrechen',
  'fullAuth.component_settings_settingssignoutsheet.check_the_connection_then_try_again':
    'Überprüfe die Verbindung und versuche es dann erneut.',
  'fullAuth.component_settings_settingssignoutsheet.sign_out': 'Abmelden',
  'fullAuth.component_settings_settingssignoutsheet.sign_out_did_not_finish':
    'Die Abmeldung wurde nicht abgeschlossen',
  'fullAuth.component_settings_settingssignoutsheet.try_sign_out_again':
    'Versuche, dich erneut abzumelden',
  'fullAuth.component_support_offlinesupportnotice.you_can_still_read_the_last_saved_screen_proof_a':
    'Du kannst weiterhin den zuletzt gespeicherten Bildschirm lesen. Korrektur- und Berichtsentwürfe bleiben auf diesem Telefon, bis Menta sich wieder verbindet.',
  'fullAuth.component_support_offlinesupportnotice.you_re_offline':
    'Du bist offline',
  'fullAuth.component_support_supportsurface.title_subtitle':
    '{title}. {subtitle}',
  'fullAuth.component_support_supportsurface.title_subtitle_detail':
    '{title}. {subtitle} {detail}',
  'fullAuth.edit_profile.account_required': 'Konto erforderlich',
  'fullAuth.edit_profile.back_to_you': 'Zurück zu dir',
  'fullAuth.edit_profile.cannot_edit_here': 'Kann hier nicht bearbeitet werden',
  'fullAuth.edit_profile.change_photo': 'Foto ändern',
  'fullAuth.edit_profile.choose_a_different_photo': 'Wähle ein anderes Foto.',
  'fullAuth.edit_profile.choose_a_profile_photo': 'Wähle ein Profilfoto',
  'fullAuth.edit_profile.details': 'Details',
  'fullAuth.edit_profile.display_name': 'Anzeigename',
  'fullAuth.edit_profile.edit_again': 'Erneut bearbeiten',
  'fullAuth.edit_profile.edit_profile': 'Profil bearbeiten',
  'fullAuth.edit_profile.email': 'E-Mail',
  'fullAuth.edit_profile.how_it_will_look_on_you':
    'So wird es in deinem Profil aussehen',
  'fullAuth.edit_profile.loading_your_profile': 'Profil wird geladen',
  'fullAuth.edit_profile.name': 'Name',
  'fullAuth.edit_profile.no_changes_have_been_made_try_loading_your_accou':
    'Es wurden keine Änderungen vorgenommen. Versuche erneut, dein Konto zu laden.',
  'fullAuth.edit_profile.no_photo_selected': 'Kein Foto ausgewählt',
  'fullAuth.edit_profile.nothing_changes_until_you_choose_one':
    'Es ändert sich nichts, bis du eines auswählst.',
  'fullAuth.edit_profile.photo_not_changed_photoerror':
    'Foto nicht geändert. {photoError}',
  'fullAuth.edit_profile.photo_visibility': 'Sichtbarkeit von Fotos',
  'fullAuth.edit_profile.photo_will_be_removed': 'Foto wird entfernt',
  'fullAuth.edit_profile.profile_unavailable': 'Profil nicht verfügbar',
  'fullAuth.edit_profile.profile_updated': 'Profil aktualisiert',
  'fullAuth.edit_profile.remove_photo': 'Foto entfernen',
  'fullAuth.edit_profile.save_changes': 'Änderungen speichern',
  'fullAuth.edit_profile.saving_changes': 'Änderungen werden gespeichert',
  'fullAuth.edit_profile.saving_your_changes': 'Speichern deiner Änderungen',
  'fullAuth.edit_profile.selected_not_saved': 'Ausgewählt, nicht gespeichert',
  'fullAuth.edit_profile.selected_profile_photo_in_its_final_circular_cro':
    'Ausgewähltes Profilfoto im endgültigen kreisförmigen Ausschnitt',
  'fullAuth.edit_profile.sign_in_again': 'Melde dich erneut an',
  'fullAuth.edit_profile.sign_in_again_before_editing_this_profile':
    'Melde dich erneut an, bevor du dieses Profil bearbeitest.',
  'fullAuth.edit_profile.this_is_how_the_photo_will_look_on_you_it_will_n':
    'So wird das Foto in deinem Profil aussehen. Es ändert sich erst, wenn du speicherst.',
  'fullAuth.edit_profile.try_again': 'Versuche es erneut',
  'fullAuth.edit_profile.try_saving_again': 'Versuche erneut zu speichern',
  'fullAuth.edit_profile.username': 'Benutzername',
  'fullAuth.edit_profile.usernames_can_t_be_changed_yet':
    'Benutzernamen können noch nicht geändert werden.',
  'fullAuth.edit_profile.value': '@{value}',
  'fullAuth.edit_profile.you_can_keep_reviewing_the_preview_while_menta_s':
    'Du kannst die Vorschau weiterhin ansehen, während Menta speichert.',
  'fullAuth.edit_profile.you_cannot_change_your_sign_in_email_here':
    'Du kannst deine Anmelde-E-Mail-Adresse hier nicht ändern.',
  'fullAuth.edit_profile.your_current_photo_stays_until_you_save_changes':
    'Dein aktuelles Foto bleibt erhalten, bis du die Änderungen speicherst.',
  'fullAuth.edit_profile.your_details_will_appear_when_this_check_finishe':
    'Deine Daten werden angezeigt, wenn diese Prüfung abgeschlossen ist.',
  'fullAuth.edit_profile.your_edits_are_still_here':
    'Deine Änderungen sind noch hier',
  'fullAuth.edit_profile.your_profile_has_not_changed':
    'Dein Profil hat sich nicht geändert.',
  'fullAuth.edit_profile.your_profile_has_not_changed_try_saving_again':
    'Dein Profil hat sich nicht geändert. Versuche erneut zu speichern.',
  'fullAuth.edit_profile.your_saved_name_and_photo_now_appear_across_ment':
    'Dein gespeicherter Name und dein gespeichertes Foto erscheinen nun in Menta.',
  'fullAuth.email_auth.confirm_password': 'Passwort bestätigen',
  'fullAuth.email_auth.couldn_t_create_account':
    'Konto konnte nicht erstellt werden',
  'fullAuth.email_auth.couldn_t_sign_you_in': 'Du konntest dich nicht anmelden',
  'fullAuth.email_auth.create_an_account_to_save_this_promise_to_menta':
    'Erstelle ein Konto, um dieses Versprechen an Menta zu speichern.',
  'fullAuth.email_auth.create_your_account': 'Erstelle dein Konto',
  'fullAuth.email_auth.daniel': 'Daniel',
  'fullAuth.email_auth.email': 'E-Mail',
  'fullAuth.email_auth.forgot_your_password': 'Passwort vergessen?',
  'fullAuth.email_auth.menta': 'Menta',
  'fullAuth.email_auth.other_people_may_see_this_with_your_group_activi':
    'Andere Personen können dies mit deinen Gruppenaktivitäts- und Veranstaltungsfotos sehen.',
  'fullAuth.email_auth.password': 'Passwort',
  'fullAuth.email_auth.sign_in_to_save_this_promise_to_your_menta_accou':
    'Melde dich an, um dieses Versprechen in deinem Menta-Konto zu speichern.',
  'fullAuth.email_auth.sign_in_with_email': 'Mit E-Mail anmelden',
  'fullAuth.email_auth.use_6_or_more_characters':
    'Verwende 6 oder mehr Zeichen.',
  'fullAuth.email_auth.use_an_email_you_can_access_if_you_ever_need_to_':
    'Verwende eine E-Mail-Adresse, auf die du zugreifen kannst, falls du dein Konto jemals wiederherstellen musst.',
  'fullAuth.email_auth.username': 'Benutzername',
  'fullAuth.email_auth.you_example_com': 'you@example.com',
  'fullAuth.legal_acceptance.agree_and_continue': 'Zustimmen und fortfahren',
  'fullAuth.legal_acceptance.back': 'Zurück',
  'fullAuth.legal_acceptance.before_you': 'Bevor du',
  'fullAuth.legal_acceptance.checking_the_current_legal_documents':
    'Prüfung der aktuellen rechtlichen Dokumente',
  'fullAuth.legal_acceptance.continue': 'fortfährst.',
  'fullAuth.legal_acceptance.couldn_t_check_your_agreement':
    'Deine Zustimmung konnte nicht geprüft werden',
  'fullAuth.legal_acceptance.create': 'erstellst.',
  'fullAuth.legal_acceptance.i_agree_to_menta_s_terms_of_use_and_community_st':
    'Ich stimme den Nutzungsbedingungen und Community-Standards von Menta zu und erkenne die Datenschutzrichtlinie an.',
  'fullAuth.legal_acceptance.leave_legal_review':
    'Rechtliche Prüfung verlassen',
  'fullAuth.legal_acceptance.menta': 'Menta',
  'fullAuth.legal_acceptance.menta_mascot_beside_your_account_confirmation':
    'Menta-Maskottchen neben deiner Kontobestätigung',
  'fullAuth.legal_acceptance.try_again': 'Versuche es erneut',
  'fullAuth.legal_acceptance.you_can_go_back_without_agreeing_your_account_an':
    'Du kannst ohne Zustimmung zurückgehen. Dein Konto und bestehende Versprechen bleiben verfügbar.',
  'fullAuth.login.menta': 'Menta',
  'fullAuth.notification_settings.a_test_is_already_on_the_way':
    'Eine Testmitteilung ist bereits unterwegs',
  'fullAuth.notification_settings.allow_notifications': 'Mitteilungen zulassen',
  'fullAuth.notification_settings.allow_notifications_first':
    'Zuerst Mitteilungen zulassen',
  'fullAuth.notification_settings.back_to_settings':
    'Zurück zu den Einstellungen',
  'fullAuth.notification_settings.check_again_before_turning_on_proof_reminders':
    'Überprüfe dies noch einmal, bevor du die Nachweiserinnerungen aktivierst.',
  'fullAuth.notification_settings.check_notification_permission':
    'Mitteilungsberechtigung prüfen',
  'fullAuth.notification_settings.check_notification_permission_and_try_the_test_a':
    'Überprüfe die Mitteilungsberechtigung und versuche den Test gleich noch einmal.',
  'fullAuth.notification_settings.choice_saved': 'Auswahl gespeichert',
  'fullAuth.notification_settings.choose_daily_proof_reminders_and_updates_when_a_':
    'Wähle tägliche Nachweiserinnerungen und Updates, wenn ein Versprechen endet.',
  'fullAuth.notification_settings.choose_notifications_for_menta_then_return_here':
    'Wähle „Mitteilungen für Menta“ und kehre dann hierher zurück.',
  'fullAuth.notification_settings.choose_the_notifications_you_want_from_menta':
    'Wähle die gewünschten Mitteilungen von Menta aus.',
  'fullAuth.notification_settings.choose_the_notifications_you_want_from_menta_bel':
    'Wähle unten die gewünschten Mitteilungen von Menta aus.',
  'fullAuth.notification_settings.choose_which_group_and_progress_updates_menta_ma':
    'Wähle aus, welche Gruppen- und Fortschrittsaktualisierungen Menta senden darf.',
  'fullAuth.notification_settings.confirmed_milestones_momenta_and_streak_changes':
    'Bestätigte Meilensteine, Momenta- und Tagesserienänderungen.',
  'fullAuth.notification_settings.could_not_check_phone_notifications':
    'Telefonmitteilungen konnten nicht geprüft werden',
  'fullAuth.notification_settings.could_not_load_notification_settings':
    'Mitteilungseinstellungen konnten nicht geladen werden.',
  'fullAuth.notification_settings.could_not_load_notification_settings_2':
    'Mitteilungseinstellungen konnten nicht geladen werden',
  'fullAuth.notification_settings.could_not_open_phone_settings':
    'Die Telefoneinstellungen konnten nicht geöffnet werden',
  'fullAuth.notification_settings.could_not_save_your_choice':
    'Deine Auswahl konnte nicht gespeichert werden',
  'fullAuth.notification_settings.delivery_and_timing':
    'Zustellung und Zeitpunkt',
  'fullAuth.notification_settings.email_choice_did_not_change':
    'E-Mail-Auswahl hat sich nicht geändert',
  'fullAuth.notification_settings.email_updates': 'E-Mail-Updates',
  'fullAuth.notification_settings.email_updates_are_off':
    'E-Mail-Updates sind deaktiviert',
  'fullAuth.notification_settings.email_updates_are_on':
    'E-Mail-Updates sind aktiviert',
  'fullAuth.notification_settings.email_updates_are_still_off':
    'E-Mail-Updates sind weiterhin deaktiviert',
  'fullAuth.notification_settings.email_updates_are_unavailable':
    'E-Mail-Updates sind nicht verfügbar',
  'fullAuth.notification_settings.if_it_does_not_save_menta_will_put_your_previous':
    'Wenn die Speicherung fehlschlägt, setzt Menta deine vorherige Auswahl zurück.',
  'fullAuth.notification_settings.it_should_arrive_shortly_tap_it_to_return_to_not':
    'Es sollte in Kürze eintreffen. Tippe darauf, um zu den Mitteilungseinstellungen zurückzukehren.',
  'fullAuth.notification_settings.keep_notifications_off':
    'Mitteilungen ausschalten',
  'fullAuth.notification_settings.loading_notification_settings':
    'Mitteilungseinstellungen werden geladen',
  'fullAuth.notification_settings.loading_your_notification_settings':
    'Laden deiner Mitteilungseinstellungen.',
  'fullAuth.notification_settings.menta_can_resume_notifications_after_this_time':
    'Menta kann die Mitteilungen nach dieser Zeit wieder aufnehmen.',
  'fullAuth.notification_settings.menta_could_not_connect_this_email_safely_so_you':
    'Menta konnte diese E-Mail-Adresse nicht sicher verknüpfen, daher wurde deine Einwilligung nicht aktiviert.',
  'fullAuth.notification_settings.menta_could_not_finish_notification_registration':
    'Menta konnte die Mitteilungsregistrierung nicht abschließen. Versuche es gleich noch einmal.',
  'fullAuth.notification_settings.menta_does_not_send_notifications_during_these_h':
    'Menta versendet während dieser Zeiten keine Mitteilungen; sie treffen danach ein.',
  'fullAuth.notification_settings.menta_does_not_send_notifications_during_this_lo':
    'Menta versendet in diesem lokalen Zeitfenster keine Mitteilungen.',
  'fullAuth.notification_settings.menta_is_checking_this_phone_and_your_active_pro':
    'Menta prüft dieses Telefon und deine aktiven Versprechen.',
  'fullAuth.notification_settings.menta_is_checking_this_phone_before_it_queues_th':
    'Menta prüft dieses Telefon, bevor die Testmitteilung gesendet wird.',
  'fullAuth.notification_settings.menta_is_finishing_notification_setup_for_this_p':
    'Menta richtet die Mitteilungen für dieses Telefon ein.',
  'fullAuth.notification_settings.menta_may_remind_you_while_proof_is_due_or_a_pro':
    'Menta kann dich erinnern, wenn ein Nachweis fällig ist oder ein Versprechen endet, und wartet in Ruhezeiten.',
  'fullAuth.notification_settings.menta_may_send_occasional_product_news_to_your_a':
    'Menta kann gelegentlich Produktneuigkeiten an die E-Mail-Adresse deines Kontos senden. Du kannst sie hier jederzeit deaktivieren.',
  'fullAuth.notification_settings.menta_needs_a_confirmed_account_email_before_thi':
    'Menta benötigt eine bestätigte Konto-E-Mail, bevor diese Auswahl geändert werden kann.',
  'fullAuth.notification_settings.menta_product_news':
    'Menta-Produktneuigkeiten',
  'fullAuth.notification_settings.menta_removed_this_email_from_product_update_del':
    'Menta hat diese E-Mail-Adresse aus den Produktaktualisierungen entfernt.',
  'fullAuth.notification_settings.menta_will_not_send_proof_or_promise_ending_remi':
    'Menta sendet keine Nachweis- oder Versprechenserinnerungen, es sei denn, du aktivierst diese erneut.',
  'fullAuth.notification_settings.menta_will_use_this_choice_for_future_notificati':
    'Menta wird diese Wahl für zukünftige Mitteilungen nutzen.',
  'fullAuth.notification_settings.new_proof_to_review_review_outcomes_check_ins_an':
    'Neuer Nachweis zur Prüfung, Prüfergebnisse, Check-ins und Gruppenänderungen.',
  'fullAuth.notification_settings.no_notification_was_queued':
    'Keine Mitteilung wurde zum Versand vorgemerkt.',
  'fullAuth.notification_settings.nothing_was_sent_try_again_in_a_moment':
    'Es wurde nichts gesendet. Versuche es gleich noch einmal.',
  'fullAuth.notification_settings.notification_setup_did_not_finish':
    'Die Einrichtung der Mitteilungen wurde nicht abgeschlossen',
  'fullAuth.notification_settings.notifications': 'Mitteilungen',
  'fullAuth.notification_settings.promise_context_title':
    'Erinnerungen für Versprechen',
  'fullAuth.notification_settings.promise_context_body':
    'Diese Erinnerungszeit gilt für alle aktiven Versprechen. Die Zeiten folgen {timeZone}.',
  'fullAuth.notification_settings.back_to_promise': 'Zurück zum Versprechen',
  'fullAuth.notification_settings.notifications_are_off':
    'Mitteilungen sind deaktiviert',
  'fullAuth.notification_settings.notifications_are_still_off':
    'Mitteilungen sind weiterhin deaktiviert',
  'fullAuth.notification_settings.notifications_off': 'Mitteilungen aus',
  'fullAuth.notification_settings.old_reminders_may_still_be_on_this_phone':
    'Möglicherweise befinden sich noch alte Erinnerungen auf diesem Telefon',
  'fullAuth.notification_settings.open_phone_settings':
    'Telefoneinstellungen öffnen',
  'fullAuth.notification_settings.open_your_phone_settings_choose_menta_then_notif':
    'Öffne deine Telefoneinstellungen, wähle Menta und dann Mitteilungen, um Erinnerungen zuzulassen.',
  'fullAuth.notification_settings.open_your_phone_settings_choose_menta_then_notif_2':
    'Öffne deine Telefoneinstellungen, wähle Menta, dann Mitteilungen und erlaube Mitteilungen.',
  'fullAuth.notification_settings.opening_phone_settings':
    'Telefoneinstellungen öffnen',
  'fullAuth.notification_settings.optional_menta_product_news_this_is_separate_fro':
    'Optionale Menta-Produktneuigkeiten. Dies ist unabhängig von Konto- und Nachweisbenachrichtigungen.',
  'fullAuth.notification_settings.people_and_progress':
    'Menschen und Fortschritt',
  'fullAuth.notification_settings.phone_controls': 'Telefonsteuerung',
  'fullAuth.notification_settings.phone_notification_check_failed':
    'Mitteilungseinstellung dieses Telefons konnte nicht geprüft werden',
  'fullAuth.notification_settings.phone_notification_settings':
    'Einstellungen für Telefonbenachrichtigungen',
  'fullAuth.notification_settings.preferred_time_formattedremindertime_a_proof_dea':
    'Bevorzugte Zeit: {formattedReminderTime}. Eine Nachweisfrist oder Ruhezeiten können die tatsächliche Zeit ändern.',
  'fullAuth.notification_settings.preferred_time_formattedremindertime_notificatio':
    'Bevorzugte Zeit: {formattedReminderTime}. Mitteilungen sind auf diesem Telefon deaktiviert.',
  'fullAuth.notification_settings.preparing_a_test_notification':
    'Vorbereitung einer Testmitteilung',
  'fullAuth.notification_settings.preparing_proof_reminders':
    'Nachweiserinnerungen vorbereiten',
  'fullAuth.notification_settings.promise_reminders':
    'Versprechenserinnerungen',
  'fullAuth.notification_settings.proof_reminders': 'Nachweiserinnerungen',
  'fullAuth.notification_settings.proof_reminders_are_off':
    'Nachweiserinnerungen sind deaktiviert',
  'fullAuth.notification_settings.proof_reminders_are_ready':
    'Nachweiserinnerungen sind bereit',
  'fullAuth.notification_settings.proof_reminders_are_ready_on_this_phone':
    'Nachweiserinnerungen sind auf diesem Telefon bereit',
  'fullAuth.notification_settings.proof_reminders_saved':
    'Nachweiserinnerungen gespeichert',
  'fullAuth.notification_settings.quiet_hours': 'Ruhezeiten',
  'fullAuth.notification_settings.quiet_hours_and_delivery':
    'Ruhezeiten und Zustellung',
  'fullAuth.notification_settings.quiet_hours_end': 'Die Ruhezeiten enden',
  'fullAuth.notification_settings.quiet_hours_formattedquiethours':
    'Ruhezeiten {formattedQuietHours}',
  'fullAuth.notification_settings.quiet_hours_not_saved':
    'Ruhezeiten nicht gespeichert',
  'fullAuth.notification_settings.quiet_hours_saved': 'Ruhezeiten gespeichert',
  'fullAuth.notification_settings.quiet_hours_start': 'Die Ruhezeiten beginnen',
  'fullAuth.notification_settings.reload_your_saved_notification_choices':
    'Lade deine gespeicherten Mitteilungsoptionen neu',
  'fullAuth.notification_settings.reminder_setup_did_not_finish':
    'Die Einrichtung der Erinnerung wurde nicht abgeschlossen',
  'fullAuth.notification_settings.reminder_time': 'Erinnerungszeit',
  'fullAuth.notification_settings.reminder_time_did_not_update_on_this_phone':
    'Die Erinnerungszeit wurde auf diesem Telefon nicht aktualisiert',
  'fullAuth.notification_settings.reviews_and_group_activity':
    'Prüfungen und Gruppenaktivitäten',
  'fullAuth.notification_settings.save_quiet_hours': 'Ruhezeiten speichern',
  'fullAuth.notification_settings.saving_quiet_hours':
    'Ruhezeiten werden gespeichert',
  'fullAuth.notification_settings.saving_your_choice':
    'Speichern deiner Auswahl',
  'fullAuth.notification_settings.saving_your_choice_2':
    'Speichern deiner Auswahl…',
  'fullAuth.notification_settings.saving_your_email_choice':
    'Speichern deiner E-Mail-Auswahl…',
  'fullAuth.notification_settings.send_one_real_notification_to_this_signed_in_pho':
    'Sende eine echte Mitteilung an dieses angemeldete Telefon.',
  'fullAuth.notification_settings.send_test_notification':
    'Testbenachrichtigung senden',
  'fullAuth.notification_settings.set_quiet_hours_email_and_phone_notification_opt':
    'Lege Ruhezeiten sowie Optionen für E-Mail- und Telefonbenachrichtigungen fest.',
  'fullAuth.notification_settings.sign_in_again': 'Erneut anmelden',
  'fullAuth.notification_settings.sign_in_again_to_send_a_test':
    'Melde dich erneut an, um einen Test zu senden',
  'fullAuth.notification_settings.sounds_previews_focus_and_scheduled_delivery':
    'Töne, Vorschauen, Fokus und geplante Zustellung.',
  'fullAuth.notification_settings.sounds_previews_focus_and_scheduled_delivery_are':
    'Töne, Vorschauen, Fokus und geplante Zustellung werden von deinem Telefon gesteuert.',
  'fullAuth.notification_settings.streaks_and_momenta':
    'Tagesserien und Momenta',
  'fullAuth.notification_settings.test_notification_queued':
    'Testmitteilung zum Versand vorgemerkt',
  'fullAuth.notification_settings.test_notification_was_not_queued':
    'Testmitteilung wurde nicht zum Versand vorgemerkt',
  'fullAuth.notification_settings.test_notifications': 'Testbenachrichtigungen',
  'fullAuth.notification_settings.the_range_can_cross_midnight':
    'Der Bereich kann Mitternacht überschreiten.',
  'fullAuth.notification_settings.there_are_no_active_promises_to_schedule_yet_men':
    'Zurzeit gibt es keine aktiven Versprechen, die geplant werden können. Menta verwendet diese Auswahl, sobald du eines startest.',
  'fullAuth.notification_settings.this_phone_is_not_ready_yet':
    'Dieses Telefon ist noch nicht bereit',
  'fullAuth.notification_settings.this_phone_is_ready_for_menta_notifications':
    'Dieses Telefon ist für Menta-Mitteilungen bereit',
  'fullAuth.notification_settings.this_phone_may_show_a_reminder_at_your_preferred':
    'Dieses Telefon zeigt möglicherweise zu deiner bevorzugten Zeit eine Erinnerung für aktive Versprechen an.',
  'fullAuth.notification_settings.this_phone_must_allow_menta_notifications_before':
    'Dieses Telefon muss Menta-Mitteilungen zulassen, bevor ein Test gesendet werden kann.',
  'fullAuth.notification_settings.this_phone_will_not_show_menta_notifications_unt':
    'Auf diesem Telefon werden Menta-Mitteilungen erst angezeigt, wenn du sie aktivierst.',
  'fullAuth.notification_settings.to_turn_them_on': 'Um sie einzuschalten',
  'fullAuth.notification_settings.try_again': 'Versuche es erneut',
  'fullAuth.notification_settings.try_again_before_relying_on_notifications_from_t':
    'Versuche es noch einmal, bevor du dich auf Mitteilungen von diesem Telefon verlassen kannst.',
  'fullAuth.notification_settings.try_again_before_turning_on_reminders_for_this_p':
    'Versuche es noch einmal, bevor du Erinnerungen für dieses Telefon aktivierst.',
  'fullAuth.notification_settings.turning_off_email_updates':
    'E-Mail-Updates deaktivieren',
  'fullAuth.notification_settings.turning_on_email_updates':
    'E-Mail-Updates aktivieren',
  'fullAuth.notification_settings.wait_one_minute_before_requesting_another_test':
    'Warte eine Minute, bevor du einen weiteren Test anforderst.',
  'fullAuth.notification_settings.your_choice_is_saved_but_an_old_reminder_may_sti':
    'Deine Auswahl wird gespeichert, aber eine alte Erinnerung kann weiterhin erscheinen. Versuche es erneut.',
  'fullAuth.notification_settings.your_choice_is_saved_but_proof_reminders_are_not':
    'Deine Auswahl wird gespeichert, aber die Nachweiserinnerungen sind noch nicht bereit. Versuche es erneut.',
  'fullAuth.notification_settings.your_choice_is_saved_but_proof_reminders_are_not_2':
    'Deine Auswahl wird gespeichert, aber die Nachweiserinnerungen sind auf diesem Telefon noch nicht verfügbar. Versuche es erneut.',
  'fullAuth.notification_settings.your_choices_are_saved_but_this_phone_cannot_sho':
    'Deine Auswahl wird gespeichert, aber dieses Telefon kann keine Menta-Mitteilungen anzeigen, bis du sie zulässt.',
  'fullAuth.notification_settings.your_current_choice_remains_authoritative_until_':
    'Deine aktuelle Auswahl bleibt bis zum Speichern bestehen.',
  'fullAuth.notification_settings.your_current_quiet_hours_stay_in_place_until_thi':
    'Deine aktuellen Ruhezeiten bleiben bis zur Speicherung erhalten.',
  'fullAuth.notification_settings.your_menta_opt_out_is_saved_provider_removal_wil':
    'Deine Abmeldung von Menta-Mitteilungen ist gespeichert. Die Verbindung wird erneut entfernt, wenn das Konto wieder online ist.',
  'fullAuth.notification_settings.your_phone_did_not_return_a_notification_setting':
    'Dein Telefon hat keine Einstellung für Mitteilungen gemeldet. Keine Berechtigung wurde geändert.',
  'fullAuth.notification_settings.your_phone_now_allows_notifications':
    'Auf deinem Telefon sind Mitteilungen jetzt erlaubt.',
  'fullAuth.notification_settings.your_preferred_time_is_saved_but_this_phone_may_':
    'Deine bevorzugte Zeit wird gespeichert. Dieses Telefon verwendet jedoch möglicherweise weiterhin die alte Zeit. Versuche es erneut.',
  'fullAuth.notification_settings.your_previous_email_choice_is_still_active':
    'Deine bisherige E-Mail-Auswahl ist weiterhin aktiv.',
  'fullAuth.notification_settings.your_previous_notification_choice_is_still_activ':
    'Deine bisherige Mitteilungsauswahl ist weiterhin aktiv.',
  'fullAuth.notification_settings.your_previous_quiet_hours_remain_active':
    'Deine bisherigen Ruhezeiten bleiben aktiv.',
  'fullAuth.notification_settings.your_promises_still_work_menta_will_not_ask_agai':
    'Deine Versprechen funktionieren immer noch. Menta wird hier nicht noch einmal fragen.',
  'fullAuth.notification_settings.your_promises_still_work_this_phone_will_not_sho':
    'Deine Versprechen funktionieren weiterhin. Auf diesem Telefon werden keine Nachweise, Prüfungen oder Gruppenmitteilungen angezeigt.',
  'fullAuth.notification_settings.your_proof_reminder_choice_is_unchanged_your_pho':
    'Deine Auswahl für Nachweiserinnerungen bleibt unverändert. Dein Telefon fragt dich als Nächstes danach.',
  'fullAuth.onboarding.32_character_code': '32-stelliger Code',
  'fullAuth.onboarding.accountability': 'Verbindlichkeit',
  'fullAuth.onboarding.activation_needs_attention':
    'Die Aktivierung erfordert Aufmerksamkeit',
  'fullAuth.onboarding.add_code_and_create': 'Code hinzufügen und erstellen',
  'fullAuth.onboarding.add_it_now_or_create_your_promise_without_one_gr':
    'Füge es jetzt hinzu oder erstelle dein Versprechen ohne Code. Gruppeneinladungen funktionieren separat.',
  'fullAuth.onboarding.add_referral_code': 'Empfehlungscode hinzufügen',
  'fullAuth.onboarding.after_it_s_created_menta_adds':
    'Nach der Erstellung gibt dir Menta',
  'fullAuth.onboarding.agree_and_choose_sign_in':
    'Zustimmen und Anmelden wählen',
  'fullAuth.onboarding.agree_and_continue': 'Zustimmen und fortfahren',
  'fullAuth.onboarding.back': 'Zurück',
  'fullAuth.onboarding.back_to_backlabel': 'Zurück zu {backLabel}',
  'fullAuth.onboarding.choose_a_length_you_can_genuinely_follow_through':
    'Wähle eine Länge, die du wirklich durchhalten kannst.',
  'fullAuth.onboarding.choose_how_you_want_to_continue_your_draft_stays':
    'Wähle, wie du fortfahren möchtest. Dein Entwurf bleibt auf diesem Telefon.',
  'fullAuth.onboarding.choose_length': 'Länge wählen',
  'fullAuth.onboarding.choose_proof': 'Nachweis wählen',
  'fullAuth.onboarding.choose_the_proof_you_will_add_and_who_you_want_b':
    'Wähle den Nachweis aus, den du hinzufügen möchtest, und wen du an deiner Seite haben möchtest.',
  'fullAuth.onboarding.choose_what_you_ll_add_when_it_s_done_you_can_in':
    'Wähle aus, was du hinzufügen möchtest, wenn es fertig ist. Nach dem Speichern kannst du Personen zur Prüfung einladen.',
  'fullAuth.onboarding.complete_this_promise_and_add_a_proofname_as_pro':
    'Schließe dieses Versprechen ab und füge einen Nachweis ({proofName}) hinzu, der die erledigte Aktion zeigt.',
  'fullAuth.onboarding.confirm_the_required_documents':
    'Bestätige die erforderlichen Unterlagen.',
  'fullAuth.onboarding.confirming_code': 'Bestätigungscode…',
  'fullAuth.onboarding.continue_to_referral': 'Mit der Empfehlung fortfahren',
  'fullAuth.onboarding.continue_to_save': 'Speichern fortsetzen',
  'fullAuth.onboarding.continue_with_apple': 'Weiter mit Apple',
  'fullAuth.onboarding.continue_with_email': 'Weiter mit E-Mail',
  'fullAuth.onboarding.continue_with_google': 'Weiter mit Google',
  'fullAuth.onboarding.could_not_finish_setup':
    'Einrichtung konnte nicht abgeschlossen werden',
  'fullAuth.onboarding.create_a_group': 'Erstelle eine Gruppe',
  'fullAuth.onboarding.review_promise_invite':
    'Einladung für ein Versprechen prüfen',
  'fullAuth.onboarding.promise_invite_held':
    'Deine Versprechenseinladung bleibt gespeichert. Prüfe sie als Nächstes; der Beitritt bleibt eine separate Aktion.',
  'fullAuth.onboarding.review_group_invite': 'Einladung für eine Gruppe prüfen',
  'fullAuth.onboarding.group_invite_held':
    'Deine Gruppeneinladung bleibt gespeichert. Prüfe sie als Nächstes; der Beitritt bleibt eine separate Aktion.',
  'fullAuth.onboarding.open_event': 'Veranstaltung öffnen',
  'fullAuth.onboarding.event_held':
    'Deine Veranstaltung ist weiterhin verfügbar. Öffne sie als Nächstes; diese Versprechensbestätigung ist keine Zusage zur Teilnahme.',
  'fullAuth.onboarding.create_my_group': 'Jemanden einladen',
  'fullAuth.onboarding.create_my_group_detail':
    'Dein Versprechen ist gespeichert und bleibt privat. Wähle, wie dich jemand unterstützen soll, und entscheide dann, wen du einlädst.',
  'fullAuth.onboarding.create_it_first_menta_will_then_add':
    'Erstelle es zuerst. Menta gibt dir dann',
  'fullAuth.onboarding.create_without_a_code': 'Ohne Code erstellen',
  'fullAuth.onboarding.creating_your_first_promise':
    'Erstelle dein erstes Versprechen',
  'fullAuth.onboarding.creating_your_first_promise_2':
    'Erstelle dein erstes Versprechen…',
  'fullAuth.onboarding.days': 'Tage',
  'fullAuth.onboarding.decide_what_finished_will_look_like':
    'Entscheide, wie das fertige Ergebnis aussehen soll.',
  'fullAuth.onboarding.do_you_have_a_referral_code':
    'Hast du einen Empfehlungscode?',
  'fullAuth.onboarding.edit': 'Bearbeiten',
  'fullAuth.onboarding.every_day': 'Jeden Tag',
  'fullAuth.onboarding.every_day_2': '· Jeden Tag ·',
  'fullAuth.promise.frequency.once_a_week': 'Einmal pro Woche',
  'fullAuth.onboarding.first_promise': 'Erstes Versprechen',
  'fullAuth.onboarding.first_promise_firstpromisecost_momenta_after_cre':
    'Erstes Versprechen: {firstPromiseCost} Momenta. Nach der Erstellung erhältst du {welcomeBonus} Momenta für spätere Entscheidungen.',
  'fullAuth.onboarding.free': 'kostenlos.',
  'fullAuth.onboarding.how_long_do_you_want_to_keep_this_promise':
    'Wie lange möchtest du dieses Versprechen einhalten?',
  'fullAuth.onboarding.how_will_you_prove_it': 'Wie wirst du es nachweisen?',
  'fullAuth.onboarding.i_agree_to_menta_s_terms_of_use_and_community_st':
    'Ich stimme den Nutzungsbedingungen und Community-Standards von Menta zu und erkenne die Datenschutzrichtlinie an.',
  'fullAuth.onboarding.invite': 'Einladen',
  'fullAuth.onboarding.invite_people_after_this_promise_is_saved_member':
    'Lade Menschen ein, nachdem dieses Versprechen gespeichert wurde. Mitglieder können deinen Nachweis prüfen.',
  'fullAuth.onboarding.just_me': 'Nur ich',
  'fullAuth.onboarding.keep_it_specific_enough_that_you_will_know_when_':
    'Formuliere es so konkret, dass du weißt, wann du fertig bist.',
  'fullAuth.onboarding.legal_confirmation_did_not_finish':
    'Die rechtliche Bestätigung wurde nicht abgeschlossen.',
  'fullAuth.onboarding.legal_review_was_not_completed':
    'Die rechtliche Prüfung wurde nicht abgeschlossen.',
  'fullAuth.onboarding.length': 'Länge',
  'fullAuth.onboarding.local_draft': 'Lokaler Entwurf',
  'fullAuth.onboarding.menta': 'Menta',
  'fullAuth.onboarding.menta_confirms_the_first_deadline_when_you_save':
    'Menta bestätigt die erste Frist beim Speichern.',
  'fullAuth.onboarding.menta_confirms_your_first_deadline_when_the_prom':
    'Menta bestätigt deine erste Frist, wenn das Versprechen erstellt wird.',
  'fullAuth.onboarding.menta_is_confirming_your_promise_and_momenta_bal':
    'Menta bestätigt dein Versprechen und Momenta-Gleichgewicht.',
  'fullAuth.onboarding.menta_mascot_offering_you_a_bag_of_momenta_token':
    'Das Menta-Maskottchen bietet dir Momenta an',
  'fullAuth.onboarding.menta_mascot_waving_you_toward_saving_this_promi':
    'Das Menta-Maskottchen winkt dir zu, während du dieses Versprechen speicherst.',
  'fullAuth.onboarding.menta_saved_the_promise_and_confirmed_your_accou':
    'Menta hat das Versprechen gespeichert und dein Konto bestätigt.',
  'fullAuth.onboarding.message_your_draft_is_still_here':
    '{message} Dein Entwurf ist noch hier.',
  'fullAuth.onboarding.momenta': 'Momenta',
  'fullAuth.onboarding.momenta_for_extra_promises_groups_freezes_and_it':
    'Momenta für zusätzliche Versprechen, Gruppen, Serienschutz und Gegenstände.',
  'fullAuth.onboarding.momenta_for_later_choices':
    'Momenta für spätere Entscheidungen.',
  'fullAuth.onboarding.my_promise': 'Mein Versprechen',
  'fullAuth.onboarding.next_due': 'Nächste Fälligkeit',
  'fullAuth.onboarding.note': 'Notiz',
  'fullAuth.onboarding.opening_email': 'E-Mail öffnen…',
  'fullAuth.onboarding.photo': 'Foto',
  'fullAuth.onboarding.preview_my_promise': 'Mein Versprechen ansehen',
  'fullAuth.onboarding.promise_length': 'Länge des Versprechens',
  'fullAuth.onboarding.promise_saved_and_confirmed':
    'Versprechen gespeichert und bestätigt',
  'fullAuth.onboarding.proof': 'Nachweis',
  'fullAuth.onboarding.proof_and_support': 'NACHWEIS UND HILFE',
  'fullAuth.onboarding.proof_cadence': 'Nachweisrhythmus',
  'fullAuth.onboarding.providername_sign_in_did_not_finish':
    '{providerName}-Anmeldung wurde nicht abgeschlossen.',
  'fullAuth.onboarding.read_the_current_account_and_community_documents':
    'Lies die aktuellen Konto- und Community-Dokumente, bevor du dein Versprechen erstellst.',
  'fullAuth.onboarding.record_a_short_clip': 'Nimm einen kurzen Clip auf.',
  'fullAuth.onboarding.referral_code': 'Empfehlungscode',
  'fullAuth.onboarding.reopen_onboarding_before_continuing_with_email':
    'Öffne das Onboarding erneut, bevor du mit der E-Mail fortfährst.',
  'fullAuth.onboarding.restored_from_this_phone':
    'Von diesem Telefon wiederhergestellt',
  'fullAuth.onboarding.return_to_draft': 'Zurück zum Entwurf',
  'fullAuth.onboarding.review_menta_s_terms': 'Mentas Bedingungen prüfen',
  'fullAuth.onboarding.review_your_promise': 'Prüfe dein Versprechen',
  'fullAuth.onboarding.save_this_promise_to_menta':
    'Dieses Versprechen in Menta speichern',
  'fullAuth.onboarding.save_your_promise': 'Versprechen speichern',
  'fullAuth.onboarding.schedule': 'Zeitplan',
  'fullAuth.onboarding.schedule_every_day': 'Zeitplan: jeden Tag',
  'fullAuth.onboarding.show_another_example': 'Weiteres Beispiel anzeigen',
  'fullAuth.onboarding.sign_in_to_save_my_promise':
    'Melde dich an, um mein Versprechen zu speichern',
  'fullAuth.onboarding.start_privately_you_can_invite_people_later':
    'Starte privat. Du kannst später Personen einladen.',
  'fullAuth.onboarding.start_with_one_thing_that_matters_today':
    'Beginne mit einer Sache, die heute wichtig ist.',
  'fullAuth.onboarding.stay_here_and_try_again_so_menta_can_keep_this_p':
    'Bleib hier und versuche es erneut, damit Menta dieses Versprechen auf diesem Telefon behalten kann.',
  'fullAuth.onboarding.stay_here_and_try_email_sign_in_again_so_menta_c':
    'Bleib hier und versuche es erneut mit der E-Mail-Anmeldung, damit Menta dieses Versprechen auf diesem Telefon behalten kann.',
  'fullAuth.onboarding.take_one_photo': 'Mach ein Foto.',
  'fullAuth.onboarding.this_choice_sets_your_next_step_it_does_not_add_':
    'Diese Auswahl legt deinen nächsten Schritt fest. Dabei wird noch niemand hinzugefügt und keine Gruppe erstellt.',
  'fullAuth.onboarding.use_duration_days': 'Verwende {duration} Tage',
  'fullAuth.onboarding.video': 'Video',
  'fullAuth.onboarding.welcome_momenta': 'Willkommen bei Momenta',
  'fullAuth.onboarding.what_s_one_thing_you_want_to_do': 'Was möchtest du tun?',
  'fullAuth.onboarding.who_will_hold_you_accountable':
    'Wer hilft dir, dranzubleiben?',
  'fullAuth.onboarding.write_what_happened': 'Schreibe, was passiert ist.',
  'fullAuth.onboarding.you_can_review_these_choices_before_menta_saves_':
    'Du kannst diese Auswahl prüfen, bevor Menta etwas speichert.',
  'fullAuth.onboarding.your_account_changed': 'Dein Konto hat sich geändert.',
  'fullAuth.onboarding.your_draft_could_not_be_saved_yet':
    'Dein Entwurf konnte noch nicht gespeichert werden.',
  'fullAuth.onboarding.your_draft_is_private_on_this_phone_sign_in_to_k':
    'Dein Entwurf ist auf diesem Telefon privat. Melde dich an, um ihn zu behalten.',
  'fullAuth.onboarding.your_draft_is_still_private_on_this_phone':
    'Dein Entwurf ist auf diesem Telefon noch privat.',
  'fullAuth.onboarding.your_first_promise': 'DEIN ERSTES VERSPRECHEN',
  'fullAuth.onboarding.for_promise': 'Für „{promise}“',
  'fullAuth.onboarding.check_ins': '{count} Check-ins',
  'fullAuth.onboarding.your_first_promise_2': 'Dein erstes Versprechen',
  'fullAuth.onboarding.your_first_promise_is': 'Dein erstes Versprechen ist',
  'fullAuth.onboarding.your_promise': 'Dein Versprechen',
  'fullAuth.onboarding.your_promise_2': 'DEIN VERSPRECHEN',
  'fullAuth.onboarding.your_promise_is_ready': 'Dein Versprechen ist fertig.',
  'fullAuth.onboarding.your_promise_is_safe_confirm_the_documents_below':
    'Dein Versprechen ist sicher. Bestätige die folgenden Dokumente, bevor du es erstellst.',
  'fullAuth.onboarding.your_promise_is_safe_try_again_before_continuing':
    'Dein Versprechen ist sicher. Versuche es erneut, bevor du fortfährst.',
  'fullAuth.onboarding.your_promise_is_still_safe_review_the_current_do':
    'Dein Versprechen ist weiterhin sicher. Prüfe die aktuellen Dokumente, wenn du bereit bist, fortzufahren.',
  'fullAuth.password_recovery.change_my_password': 'Mein Passwort ändern',
  'fullAuth.password_recovery.choose_a_new_password':
    'Wähle ein neues Passwort',
  'fullAuth.password_recovery.close': 'Schließen',
  'fullAuth.password_recovery.close_password_reset':
    'Passwort-Zurücksetzen schließen',
  'fullAuth.password_recovery.confirm_password': 'Passwort bestätigen',
  'fullAuth.password_recovery.couldn_t_change_your_password':
    'Dein Passwort konnte nicht geändert werden',
  'fullAuth.password_recovery.enter_new_password': 'Neues Passwort eingeben',
  'fullAuth.password_recovery.menta': 'Menta',
  'fullAuth.password_recovery.new_password': 'Neues Passwort',
  'fullAuth.password_recovery.or_more_characters_both_entries_must_match':
    'oder mehr Zeichen. Beide Einträge müssen übereinstimmen.',
  'fullAuth.password_recovery.other_signed_in_devices_may_ask_for_the_new_pass':
    'Andere angemeldete Geräte fragen ggf. nach dem neuen Passwort.',
  'fullAuth.password_recovery.password_changed': 'Passwort geändert',
  'fullAuth.password_recovery.re_enter_new_password':
    'Neues Passwort erneut eingeben',
  'fullAuth.password_recovery.request_a_new_link':
    'Fordere einen neuen Link an',
  'fullAuth.password_recovery.request_a_new_link_your_draft_is_still_on_this_p':
    'Fordere einen neuen Link an. Dein Entwurf befindet sich noch auf diesem Telefon.',
  'fullAuth.password_recovery.return_to': 'Zurück zu',
  'fullAuth.password_recovery.sign_in': 'Anmelden',
  'fullAuth.password_recovery.sign_in_instead': 'Melde dich stattdessen an',
  'fullAuth.password_recovery.this_reset_link_has_expired':
    'Dieser Link zum Zurücksetzen ist abgelaufen.',
  'fullAuth.password_recovery.use': 'Verwenden',
  'fullAuth.password_recovery.your_password_has_been_changed':
    'Dein Passwort wurde geändert.',
  'fullAuth.report_issue.1_open_2_tap_3_notice':
    '1. Öffnen … 2. Tippen … 3. Prüfen …',
  'fullAuth.report_issue.add_a_screenshot': 'Bildschirmfoto hinzufügen',
  'fullAuth.report_issue.add_more_detail': 'Weitere Details hinzufügen',
  'fullAuth.report_issue.add_the_basics': 'Füge die Grundlagen hinzu',
  'fullAuth.report_issue.attach_a_jpeg_png_or_webp_screenshot':
    'Hänge ein JPEG-, PNG- oder WebP-Bildschirmfoto an.',
  'fullAuth.report_issue.back_to_support': 'Zurück zur Hilfe',
  'fullAuth.report_issue.choose_a_screenshot_smaller_than_8_mb':
    'Wähle ein Bildschirmfoto, das kleiner als 8 MB ist.',
  'fullAuth.report_issue.choose_an_image': 'Wähle ein Bild',
  'fullAuth.report_issue.choose_another_report': 'Wähle einen anderen Bericht',
  'fullAuth.report_issue.choose_screenshot': 'Bildschirmfoto auswählen',
  'fullAuth.report_issue.could_not_find_this_saved_report':
    'Dieser gespeicherte Bericht konnte nicht gefunden werden',
  'fullAuth.report_issue.crash_reference': 'Absturzreferenz',
  'fullAuth.report_issue.expected_result_optional':
    'Erwartetes Ergebnis, optional',
  'fullAuth.report_issue.expected_result_optional_2':
    'Erwartetes Ergebnis (optional)',
  'fullAuth.report_issue.feedback_received': 'Rückmeldung erhalten',
  'fullAuth.report_issue.feedback_required': 'Rückmeldung erforderlich',
  'fullAuth.report_issue.give_the_report_a_short_title_and_explain_what_h':
    'Gib dem Bericht einen kurzen Titel und erkläre, was passiert ist.',
  'fullAuth.report_issue.inappropriate': 'unangemessen',
  'fullAuth.report_issue.it_is_not_saved_under_this_account_nothing_was_c':
    'Es wird nicht unter diesem Konto gespeichert. Es wurde nichts geändert.',
  'fullAuth.report_issue.keep_this_screen_open_while_you_write_or_copy_th':
    'Lass diesen Bildschirm geöffnet, während du schreibst, oder kopiere den Text, bevor du gehst.',
  'fullAuth.report_issue.last_step': 'Letzter Schritt',
  'fullAuth.report_issue.menta_could_not_open_your_photo_library_try_agai':
    'Menta konnte deine Fotobibliothek nicht öffnen. Versuche es erneut.',
  'fullAuth.report_issue.menta_could_not_preserve_this_report_locally_kee':
    'Menta konnte diesen Bericht nicht lokal speichern. Lass diesen Bildschirm geöffnet. Es wurde nichts an das Hilfeteam gesendet.',
  'fullAuth.report_issue.menta_does_not_add_device_diagnostics_to_this_re':
    'Menta fügt diesem Bericht keine Gerätediagnose hinzu.',
  'fullAuth.report_issue.menta_includes_the_item_or_screen_you_reported':
    'Menta enthält den von dir gemeldeten Artikel oder Bildschirm.',
  'fullAuth.report_issue.not_sent': 'nicht gesendet',
  'fullAuth.report_issue.open': 'offen',
  'fullAuth.report_issue.preparing_private_report_draft':
    'Vorbereitung eines privaten Berichtsentwurfs',
  'fullAuth.report_issue.proof_upload_gets_stuck':
    'Der Nachweis lässt sich nicht senden',
  'fullAuth.report_issue.reference': 'Referenz',
  'fullAuth.report_issue.remove': 'Entfernen',
  'fullAuth.report_issue.replace_screenshot': 'Bildschirmfoto ersetzen',
  'fullAuth.report_issue.report_an_issue': 'Ein Problem melden',
  'fullAuth.report_issue.report_not_sent': 'Bericht nicht gesendet',
  'fullAuth.report_issue.report_received': 'Bericht eingegangen',
  'fullAuth.report_issue.retry_sending_report':
    'Versuche erneut, den Bericht zu senden',
  'fullAuth.report_issue.return_to_support': 'Zurück zur Hilfe',
  'fullAuth.report_issue.review_feedback': 'Rückmeldung prüfen',
  'fullAuth.report_issue.review_report': 'Bericht prüfen',
  'fullAuth.report_issue.screenshot_did_not_open':
    'Bildschirmfoto konnte nicht geöffnet werden',
  'fullAuth.report_issue.screenshot_is_too_large': 'Bildschirmfoto ist zu groß',
  'fullAuth.report_issue.screenshot_optional': 'Bildschirmfoto (optional)',
  'fullAuth.report_issue.selected_support_screenshot':
    'Ausgewähltes Bildschirmfoto für die Hilfemeldung',
  'fullAuth.report_issue.server_confirmed': 'Bestätigt',
  'fullAuth.report_issue.share_feedback': 'Rückmeldung teilen',
  'fullAuth.report_issue.short_title': 'Kurztitel',
  'fullAuth.report_issue.short_title_required': 'Kurztitel, erforderlich',
  'fullAuth.report_issue.sign_in_again_before_sending_this_private_report':
    'Melde dich erneut an, bevor du diesen privaten Bericht sendest. Es wurde nichts gesendet.',
  'fullAuth.report_issue.sign_in_required': 'Anmeldung erforderlich',
  'fullAuth.report_issue.status': 'Status',
  'fullAuth.report_issue.steps_to_reproduce_optional':
    'Schritte zur Reproduktion, optional',
  'fullAuth.report_issue.steps_to_reproduce_optional_2':
    'Schritte zur Reproduktion (optional)',
  'fullAuth.report_issue.support_reference': 'Hilfe-Referenz ·',
  'fullAuth.report_issue.this_comes_from_where_you_opened':
    '. Dies stammt aus dem Bereich, von dem aus du dieses Formular geöffnet hast',
  'fullAuth.report_issue.this_report_is_not_being_saved':
    'Dieser Bericht wird nicht gespeichert',
  'fullAuth.report_issue.type': 'Typ:',
  'fullAuth.report_issue.we_ll_show_a_support_reference_only_after_the_re':
    'Eine Hilfe-Referenz zeigen wir erst, wenn der Bericht eingegangen ist. Wenn der erste Versuch unklar ist, verwendet „Erneut versuchen“ denselben Bericht, sodass kein Duplikat erstellt wird.',
  'fullAuth.report_issue.what_did_you_expect_menta_to_do':
    'Was hast du von Menta erwartet?',
  'fullAuth.report_issue.what_happened': 'Was ist passiert?',
  'fullAuth.report_issue.what_happened_required':
    'Was ist passiert, erforderlich',
  'fullAuth.report_issue.what_i_would_change': 'Was ich ändern würde',
  'fullAuth.report_issue.what_were_you_doing_and_what_did_menta_show':
    'Was hast du gemacht und was hat Menta gezeigt?',
  'fullAuth.report_issue.what_would_you_like_the_menta_team_to_know':
    'Was soll das Menta-Team wissen?',
  'fullAuth.report_issue.will_help_support_find_the_error':
    'hilft dem Hilfeteam, den Fehler zu finden.',
  'fullAuth.report_issue.your_draft_stays_on_this_phone_until_you_send_it':
    'Dein Entwurf bleibt auf diesem Telefon, bis du ihn sendest.',
  'fullAuth.report_issue.your_feedback': 'Deine Rückmeldung',
  'fullAuth.report_issue.your_screenshot_will_be_sent_with_the_report_onl':
    'Dein Bildschirmfoto wird mit dem Bericht versendet. Nur autorisierte Mitarbeitende können es öffnen.',
  'fullAuth.settings.a_compatible_update_is_downloaded_and_ready':
    'Ein kompatibles Update wurde geladen und ist bereit.',
  'fullAuth.settings.account_control': 'Kontoverwaltung',
  'fullAuth.settings.account_was_not_deleted': 'Konto wurde nicht gelöscht',
  'fullAuth.settings.active_view_or_manage_your_subscription':
    'Aktiv. Sieh dir dein Abonnement an oder verwalte es.',
  'fullAuth.settings.ad_measurement': 'Werbemessung',
  'fullAuth.settings.ad_privacy_choices': 'Datenschutzoptionen für Anzeigen',
  'fullAuth.settings.ad_privacy_choices_did_not_open':
    'Die Datenschutzoptionen für Anzeigen wurden nicht geöffnet',
  'fullAuth.settings.advanced_diagnostics': 'Erweiterte Diagnose',
  'fullAuth.settings.advanced_diagnostics_are_off':
    'Die erweiterte Diagnose ist deaktiviert',
  'fullAuth.settings.advanced_diagnostics_are_on':
    'Die erweiterte Diagnose ist aktiviert',
  'fullAuth.settings.advanced_diagnostics_are_still_off_check_your_co':
    'Die erweiterte Diagnose ist immer noch deaktiviert. Überprüfe deine Verbindung und versuche es erneut.',
  'fullAuth.settings.ask_for_help_share_feedback_or_check_a_saved_rep':
    'Bitte um Hilfe, gib Rückmeldung oder prüfe einen gespeicherten Bericht.',
  'fullAuth.settings.back_to_you': 'Zurück zu dir',
  'fullAuth.settings.before_you_delete_your_account':
    'Bevor du dein Konto löschst',
  'fullAuth.settings.check_for_updates': 'Auf Updates prüfen',
  'fullAuth.settings.check_your_connection_and_try_again':
    'Überprüfe deine Verbindung und versuche es erneut.',
  'fullAuth.settings.checking_for_updates': 'Suche nach Updates',
  'fullAuth.settings.checking_your_account': 'Dein Konto wird geprüft',
  'fullAuth.settings.checks_the_current_connection_and_known_account_':
    'Prüft erneut die aktuelle Verbindung und bekannte Kontodaten.',
  'fullAuth.settings.close_and_reopen_menta_to_apply_the_downloaded_u':
    'Schließe Menta und öffne sie erneut, um das geladene Update anzuwenden.',
  'fullAuth.settings.community_standards': 'Community-Standards',
  'fullAuth.settings.confirmation': 'Bestätigung',
  'fullAuth.settings.connect_before_deleting_your_account':
    'Stelle eine Verbindung her, bevor du dein Konto löschst.',
  'fullAuth.settings.connect_to_check_this_phone':
    'Stelle eine Verbindung her, um dieses Telefon zu prüfen.',
  'fullAuth.settings.contact_support': 'Hilfe kontaktieren',
  'fullAuth.settings.continue_to_sign_in': 'Mit der Anmeldung fortfahren',
  'fullAuth.settings.could_not_check_your_account':
    'Dein Konto konnte nicht geprüft werden',
  'fullAuth.settings.could_not_load_your_profile':
    'Dein Profil konnte nicht geladen werden.',
  'fullAuth.settings.deletion_checking_body':
    'Menta prüft die Gruppeninhaberschaft und Menta Pro. Es wurde nichts gelöscht.',
  'fullAuth.settings.deletion_check_unknown_body':
    'Menta konnte die Gruppeninhaberschaft und Menta Pro nicht bestätigen. Es wurde nichts gelöscht.',
  'fullAuth.settings.deletion_check_offline_body':
    'Stelle eine Verbindung her und versuche es erneut. Es wurde nichts gelöscht.',
  'fullAuth.settings.delete_shared_groups_first':
    'Geteilte Gruppen zuerst löschen',
  'fullAuth.settings.delete_shared_groups_first_body':
    'Menta kann die Inhaberschaft noch nicht übertragen. Öffne jede unten aufgeführte Gruppe und lösche sie, bevor du dein Konto löschst.',
  'fullAuth.settings.delete_owned_group_member_one':
    '{count} weiteres Mitglied. Lösche diese Gruppe, bevor du dein Konto löschst.',
  'fullAuth.settings.delete_owned_group_members_many':
    '{count} weitere Mitglieder. Lösche diese Gruppe, bevor du dein Konto löschst.',
  'fullAuth.settings.deletion_group_clear':
    'Keine eigenen Gruppen erfordern deine Aufmerksamkeit.',
  'fullAuth.settings.deletion_group_will_be_deleted':
    'Wird zusammen mit diesem Konto gelöscht.',
  'fullAuth.settings.deletion_subscription_active_notice':
    'Durch das Löschen deines Kontos wird dieses Abonnement nicht gekündigt.',
  'fullAuth.settings.deletion_subscription_inactive':
    'Keine aktive Menta-Pro-Berechtigung.',
  'fullAuth.settings.menta_pro_subscription': 'Menta-Pro-Abonnement',
  'fullAuth.settings.delete_account': 'Konto löschen',
  'fullAuth.settings.delete_account_will_be_available_when_this_check':
    'Du kannst dein Konto löschen, sobald diese Prüfung abgeschlossen ist.',
  'fullAuth.settings.deletion_result_unknown':
    'Ergebnis der Kontolöschung unbekannt',
  'fullAuth.settings.do_not_send_another_request_yet_check_whether_yo':
    'Sende noch keine weitere Anfrage. Prüfe, ob du noch angemeldet bist, oder wende dich an das Menta-Hilfeteam.',
  'fullAuth.settings.download_the_latest_compatible_menta_update':
    'Lade das neueste kompatible Menta-Update herunter.',
  'fullAuth.settings.extra_performance_measurements_start_now':
    'Zusätzliche Leistungsmessungen beginnen jetzt.',
  'fullAuth.settings.extra_performance_measurements_start_now_masked_':
    'Zusätzliche Leistungsmessungen beginnen jetzt. Eine maskierte Diagnoseaufzeichnung beginnt auf geeigneten Bildschirmen. Öffne Menta erneut, damit alle Einstellungen für die Diagnoseaufzeichnung übernommen werden.',
  'fullAuth.settings.feedback_and_support': 'Rückmeldung und Hilfe',
  'fullAuth.settings.for_your_privacy_account_settings_stay_hidden_un':
    'Aus Datenschutzgründen bleiben die Kontoeinstellungen verborgen, bis du dich erneut anmeldest.',
  'fullAuth.settings.help_and_feedback': 'Hilfe und Rückmeldung',
  'fullAuth.settings.how_menta_handles_your_data':
    'Wie Menta mit deinen Daten umgeht.',
  'fullAuth.settings.keep_current_setting': 'Aktuelle Einstellung beibehalten',
  'fullAuth.settings.keep_my_account': 'Mein Konto behalten',
  'fullAuth.settings.label_did_not_open': '{label} wurde nicht geöffnet',
  'fullAuth.settings.leave_a_review': 'Bewertung hinterlassen',
  'fullAuth.settings.leave_this_device_your_menta_account_stays_activ':
    'Verlasse dieses Gerät. Dein Menta-Konto bleibt aktiv.',
  'fullAuth.settings.loading_account_specific_settings':
    'Laden kontospezifischer Einstellungen',
  'fullAuth.settings.measure_whether_meta_ads_helped_someone_use_ment':
    'Miss, ob Meta-Anzeigen jemandem bei der Nutzung von Menta geholfen haben.',
  'fullAuth.settings.membership': 'Mitgliedschaft',
  'fullAuth.settings.menta_cannot_check_whether_you_still_own_a_group':
    'Menta kann nicht prüfen, ob du noch Inhaber einer Gruppe bist. Prüfe deine Gruppen, bevor du das Konto löschst. Durch das Löschen von Menta wird Menta Pro nicht gekündigt. Verwalte daher zunächst das Abonnement bei Apple.',
  'fullAuth.settings.menta_could_not_check_for_updates':
    'Menta konnte nicht nach Updates suchen',
  'fullAuth.settings.menta_could_not_delete_the_account_check_your_co':
    'Menta konnte das Konto nicht löschen. Überprüfe deine Verbindung und versuche es dann erneut.',
  'fullAuth.settings.menta_could_not_end_this_session_your_account_an':
    'Menta konnte diese Sitzung nicht beenden. Dein Konto und deine lokale Ansicht bleiben unverändert.',
  'fullAuth.settings.menta_could_not_restart': 'Menta konnte nicht neu starten',
  'fullAuth.settings.menta_is_checking_for_the_latest_compatible_upda':
    'Menta sucht nach dem neuesten kompatiblen Update.',
  'fullAuth.settings.menta_is_up_to_date': 'Menta ist aktuell',
  'fullAuth.settings.menta_pro': 'Menta Pro',
  'fullAuth.settings.menta_update_ready': 'Menta-Update bereit',
  'fullAuth.settings.menta_will_continue_using_its_current_safe_versi':
    'Menta wird weiterhin seine aktuelle sichere Version verwenden.',
  'fullAuth.settings.needs_attention': 'Benötigt Aufmerksamkeit',
  'fullAuth.settings.nothing_has_been_deleted': 'Es wurde nichts gelöscht',
  'fullAuth.settings.nothing_was_deleted_reconnect_then_try_again':
    'Es wurde nichts gelöscht. Stelle die Verbindung wieder her und versuche es erneut.',
  'fullAuth.settings.notifications': 'Mitteilungen',
  'fullAuth.settings.offline': 'Offline',
  'fullAuth.settings.open_when_connected':
    'Wird geöffnet, sobald eine Verbindung besteht.',
  'fullAuth.settings.opens_menta_pro_plans_purchase_restore_or_your_a':
    'Öffnet Menta-Pro-Tarife, stellt Käufe wieder her oder zeigt deinen aktiven Tarif an.',
  'fullAuth.settings.opens_sign_in_for_this_account':
    'Öffnet die Anmeldung für dieses Konto.',
  'fullAuth.settings.optional_performance_measurements':
    'Optionale Leistungsmessungen.',
  'fullAuth.settings.optional_performance_measurements_and_masked_dia':
    'Optionale Leistungsmessungen und maskierte Diagnoseaufzeichnung.',
  'fullAuth.settings.ordinary_crash_reports_stay_on':
    'Standardmäßige Absturzberichte bleiben aktiviert.',
  'fullAuth.settings.ordinary_crash_reports_stay_on_when_advanced_dia':
    'Standardmäßige Absturzberichte bleiben aktiviert, wenn die erweiterte Diagnose ausgeschaltet ist.',
  'fullAuth.settings.other_settings_are_still_available_try_loading_t':
    'Weitere Einstellungen sind weiterhin verfügbar. Versuche erneut, das Profil zu laden, wenn die Verbindung bereit ist.',
  'fullAuth.settings.permanently_delete_your_account_and_menta_data':
    'Lösche dein Konto und deine Menta-Daten dauerhaft.',
  'fullAuth.settings.plans_benefits_and_restore_purchases':
    'Pläne, Vorteile und Käufe wiederherstellen.',
  'fullAuth.settings.preferences': 'Präferenzen',
  'fullAuth.settings.press_restart_to_apply_the_downloaded_update':
    'Tippe auf „Neustart“, um das geladene Update anzuwenden.',
  'fullAuth.settings.privacy_and_legal': 'Datenschutz und Rechtliches',
  'fullAuth.settings.privacy_policy': 'Datenschutzerklärung',
  'fullAuth.settings.profile_details': 'Profildetails',
  'fullAuth.settings.proof_reminders_reviews_and_group_updates':
    'Nachweiserinnerungen, Prüfungen und Gruppenaktualisierungen.',
  'fullAuth.settings.read_menta_s_terms': 'Lies Mentas Bedingungen.',
  'fullAuth.settings.reopen_menta_to_stop_diagnostic_recording_ordina':
    'Öffne Menta erneut, um die Diagnoseaufzeichnung zu stoppen. Standardmäßige Absturzberichte bleiben aktiviert.',
  'fullAuth.settings.restarting_menta': 'Menta neu starten',
  'fullAuth.settings.review_choices_used_for_sponsor_videos':
    'Prüfoptionen für gesponserte Videos',
  'fullAuth.settings.review_deletion_confirmation':
    'Bestätigung der Löschung prüfen',
  'fullAuth.settings.review_the_current_terms_and_when_you_accepted_t':
    'Prüfe die aktuellen Bedingungen und wann du ihnen zugestimmt hast.',
  'fullAuth.settings.rules_for_promises_proof_and_groups':
    'Regeln für Versprechen, Nachweise und Gruppen.',
  'fullAuth.settings.session': 'Sitzung',
  'fullAuth.settings.settings': 'Einstellungen',
  'fullAuth.settings.share_your_experience_and_help_others_discover_m':
    'Teile deine Erfahrungen und hilf anderen, Menta zu entdecken.',
  'fullAuth.settings.sign_in_again': 'Erneut anmelden',
  'fullAuth.settings.sign_in_again_before_deleting_your_account':
    'Melde dich erneut an, bevor du dein Konto löschst.',
  'fullAuth.settings.sign_in_again_to_see_settings':
    'Melde dich erneut an, um die Einstellungen anzuzeigen.',
  'fullAuth.settings.sign_in_needed': 'Anmeldung erforderlich',
  'fullAuth.settings.sign_out': 'Abmelden',
  'fullAuth.settings.small_performance_impact':
    'Geringe Auswirkungen auf die Leistung',
  'fullAuth.settings.some_destinations_need_a_connection':
    'Einige Ziele benötigen eine Verbindung.',
  'fullAuth.settings.terms_of_use': 'Nutzungsbedingungen',
  'fullAuth.settings.terms_you_accepted': 'Bedingungen, die du akzeptiert hast',
  'fullAuth.settings.the_downloaded_update_will_open_automatically':
    'Das heruntergeladene Update wird automatisch angewendet.',
  'fullAuth.settings.the_next_screen_asks_you_to_type_delete_before_m':
    'Auf dem nächsten Bildschirm wirst du aufgefordert, DELETE einzugeben, bevor Menta die Anfrage sendet.',
  'fullAuth.settings.this_can_use_a_small_amount_of_extra_processing_':
    'Während Menta geöffnet ist, kann dies etwas zusätzliche Rechenleistung, Akku und mobile Daten verbrauchen. Die Diagnoseaufzeichnung beginnt nur auf geeigneten Bildschirmen. Öffne Menta erneut, nachdem du sie ausgeschaltet hast, um die Aufzeichnung zu stoppen.',
  'fullAuth.settings.this_device_has_the_latest_compatible_update':
    'Dieses Gerät verfügt über das neueste kompatible Update.',
  'fullAuth.settings.to_confirm': 'zur Bestätigung',
  'fullAuth.settings.tries_to_load_the_signed_in_profile_again':
    'Versucht das angemeldete Profil erneut zu laden.',
  'fullAuth.settings.try_again_in_a_moment_or_open_the_link_from_the_':
    'Versuche es gleich noch einmal oder öffne den Link im App Store-Eintrag.',
  'fullAuth.settings.try_again_later_optional_ads_stay_unavailable_un':
    'Versuche es später noch einmal. Optionale Anzeigen bleiben nicht verfügbar, bis du diese Auswahl prüfst.',
  'fullAuth.settings.try_connection_again':
    'Versuche erneut, eine Verbindung herzustellen',
  'fullAuth.settings.try_loading_profile_again':
    'Versuche erneut, das Profil zu laden',
  'fullAuth.settings.try_loading_your_name_and_profile_photo_again':
    'Versuche erneut, deinen Namen und dein Profilfoto zu laden.',
  'fullAuth.settings.try_the_account_check_again_before_you_delete_an':
    'Versuche die Kontoprüfung erneut, bevor du etwas löschst.',
  'fullAuth.settings.turn_off_advanced_diagnostics':
    'Erweiterte Diagnose deaktivieren',
  'fullAuth.settings.turn_on_advanced_diagnostics':
    'Erweiterte Diagnose aktivieren',
  'fullAuth.settings.type': 'Typ',
  'fullAuth.settings.type_delete_to_confirm_account_deletion':
    'Gib DELETE ein, um das Löschen des Kontos zu bestätigen',
  'fullAuth.settings.update_checks_are_unavailable':
    'Aktualisierungsprüfungen sind nicht verfügbar',
  'fullAuth.settings.while_enabled_this_can_use_a_small_amount_of_ext':
    'Wenn dies aktiviert ist, kann es während der Nutzung von Menta etwas zusätzliche Rechenleistung, Akku und mobile Daten verbrauchen.',
  'fullAuth.settings.you_are_still_signed_in': 'Du bist noch angemeldet',
  'fullAuth.settings.your_account_stays_open_until_menta_confirms_the':
    'Dein Konto bleibt geöffnet, bis Menta die Löschung bestätigt.',
  'fullAuth.settings.your_account_was_deleted': 'Dein Konto wurde gelöscht.',
  'fullAuth.settings.your_choice_was_not_saved':
    'Deine Auswahl wurde nicht gespeichert',
  'fullAuth.settings.your_saved_settings_are_still_here':
    'Deine gespeicherten Einstellungen sind weiterhin vorhanden.',
  'fullAuth.settings.your_support_drafts_for_this_account_were_remove':
    'Deine Entwürfe für Hilfemeldungen zu diesem Konto wurden entfernt.',
  'fullAuth.support.change_menta_permissions_on_this_phone':
    'Menta-Berechtigungen auf diesem Telefon ändern',
  'fullAuth.support.check_app_and_connection': 'App und Verbindung prüfen',
  'fullAuth.support.check_the_apple_account_used_for_the_original_pu':
    'Überprüfe das Apple-Konto, das für den ursprünglichen Kauf verwendet wurde. Wenn Apple eine Gebühr anzeigt, melde das Problem, bevor du erneut kaufst.',
  'fullAuth.support.checking_private_report_drafts':
    'Prüfung privater Berichtsentwürfe',
  'fullAuth.support.checking_purchases': 'Einkäufe prüfen',
  'fullAuth.support.choose_what_you_need_you_can_review_everything_b':
    'Wähle aus, was du brauchst. Du kannst alles vor dem Absenden prüfen.',
  'fullAuth.support.connection_available': 'Verbindung verfügbar',
  'fullAuth.support.connection_check_did_not_finish':
    'Verbindungsprüfung wurde nicht abgeschlossen',
  'fullAuth.support.could_not_check_earlier_purchases':
    'Frühere Käufe konnten nicht geprüft werden',
  'fullAuth.support.do_not_buy_it_again_while_this_check_continues':
    'Kaufe es nicht erneut, während diese Prüfung läuft.',
  'fullAuth.support.find_an_earlier_menta_pro_purchase':
    'Früheren Menta-Pro-Kauf finden',
  'fullAuth.support.hide_more_help': 'Weitere Hilfe ausblenden',
  'fullAuth.support.looking_for_an_earlier_menta_pro_purchase':
    'Nach einem früheren Menta-Pro-Kauf suchen',
  'fullAuth.support.menta_appears_offline': 'Menta erscheint offline',
  'fullAuth.support.menta_pro_is_active_again': 'Menta Pro ist wieder aktiv',
  'fullAuth.support.menta_pro_is_still_being_checked':
    'Menta Pro wird noch geprüft',
  'fullAuth.support.more_help': 'Weitere Hilfe',
  'fullAuth.support.no_matching_purchase_was_found':
    'Es wurde kein passender Kauf gefunden',
  'fullAuth.support.nothing_was_purchased_or_changed_check_the_conne':
    'Es wurde nichts gekauft oder geändert. Prüfe die Verbindung und versuche es erneut.',
  'fullAuth.support.open_phone_settings': 'Telefoneinstellungen öffnen',
  'fullAuth.support.opens_a_separate_support_report':
    'Öffnet einen separaten Hilfebericht.',
  'fullAuth.support.opens_sign_in_before_starting_a_private_report':
    'Öffnet die Anmeldung vor dem Starten eines privaten Berichts.',
  'fullAuth.support.other_help': 'Sonstige Hilfe',
  'fullAuth.support.restore_purchases': 'Einkäufe wiederherstellen',
  'fullAuth.support.saved_on_this_phone_and_still_waiting_to_be_sent':
    'auf diesem Telefon gespeichert und noch nicht versendet.',
  'fullAuth.support.saved_reports': 'Gespeicherte Berichte',
  'fullAuth.support.see_app_version_connection_and_saved_proof':
    'App-Version, Verbindung und gespeicherten Nachweis anzeigen',
  'fullAuth.support.share_feedback': 'Rückmeldung teilen',
  'fullAuth.support.sign_in_required': 'Anmeldung erforderlich',
  'fullAuth.support.sign_in_to_report_an_issue':
    'Melde dich an, um ein Problem zu melden',
  'fullAuth.support.support': 'Hilfe',
  'fullAuth.support.support_drafts_stay_private_to_the_account_that_':
    'Entwürfe für Hilfemeldungen bleiben für das Konto privat, mit dem du sie erstellt hast. Melde dich an, bevor du einen neuen Bericht beginnst.',
  'fullAuth.support.this_does_not_start_a_new_purchase_or_charge_thi':
    'Dadurch wird weder ein neuer Kauf gestartet noch dieses Konto belastet.',
  'fullAuth.support.version_appversion_savedcopy_nothing_changed_try':
    'Version {appVersion}. {savedCopy} Nichts hat sich geändert. Versuche die Prüfung erneut, wenn sich deine Verbindung verbessert.',
  'fullAuth.support.version_appversion_savedcopy_saved_proof_stays_o':
    'Version {appVersion}. {savedCopy} Der gespeicherte Nachweis bleibt auf diesem Telefon, bis Menta bestätigt, dass er gesendet wurde.',
  'fullAuth.support.your_earlier_purchase_is_active_on_this_account':
    'Dein früherer Einkauf ist auf diesem Konto aktiv.',
  'fullAuth.system_settings.back_to_support': 'Zurück zur Hilfe',
  'fullAuth.system_settings.change_notification_camera_photo_or_ad_measureme':
    'Ändere die Berechtigungen für Mitteilungen, Kamera, Fotos oder Werbemessung in deinen Telefoneinstellungen. Menta kann sie auf diesem Bildschirm nicht ändern oder bestätigen.',
  'fullAuth.system_settings.nothing_changed_in_menta_open_your_phone_setting':
    'In Menta hat sich nichts geändert. Öffne deine Telefoneinstellungen manuell und kehre dann zur App zurück.',
  'fullAuth.system_settings.open_phone_settings': 'Telefoneinstellungen öffnen',
  'fullAuth.system_settings.opening_phone_settings_does_not_confirm_that_a_p':
    'Durch das Öffnen der Telefoneinstellungen wird nicht bestätigt, dass sich eine Berechtigung geändert hat.',
  'fullAuth.system_settings.phone_settings': 'Telefoneinstellungen',
  'fullAuth.system_settings.phone_settings_could_not_open':
    'Telefoneinstellungen konnten nicht geöffnet werden',
  'fullAuth.system_settings.return_when_you_re_done':
    'Kehre zurück, wenn du fertig bist.',
  'fullAuth.tabs_profile.active_and_past_promises':
    'Aktive und vergangene Versprechen',
  'fullAuth.tabs_profile.active_promises': 'Aktive Versprechen',
  'fullAuth.tabs_profile.activepromisecount_active_promises_currentstreak':
    '{activePromiseCount} aktive Versprechen, Tagesserie über {currentStreak} Tage, {length} Gruppen',
  'fullAuth.tabs_profile.change_profile_photo': 'Profilfoto ändern',
  'fullAuth.tabs_profile.choose_one_thing_to_follow_through_on_it_will_ap':
    'Wähle eine Sache aus, die du umsetzen möchtest; sie wird in „Heute“ mit dem von dir gewählten Nachweis angezeigt.',
  'fullAuth.tabs_profile.create_a_promise': 'Erstelle ein Versprechen',
  'fullAuth.tabs_profile.current_reward_terms_and_your_link':
    'Aktuelle Prämienbedingungen und dein Link',
  'fullAuth.tabs_profile.day_streak': 'Tagesserie',
  'fullAuth.tabs_profile.edit_profile': 'Profil bearbeiten',
  'fullAuth.tabs_profile.for_your_privacy_menta_hides_the_previous_accoun':
    'Aus Datenschutzgründen verbirgt Menta das vorherige Konto, wenn die Sitzung endet.',
  'fullAuth.tabs_profile.groups': 'Gruppen',
  'fullAuth.tabs_profile.invite': 'einladen',
  'fullAuth.tabs_profile.invite_friends': 'Freunde einladen',
  'fullAuth.tabs_profile.loading_your_profile': 'Laden deines Profils',
  'fullAuth.tabs_profile.make_your_first_promise':
    'Mach dein erstes Versprechen',
  'fullAuth.tabs_profile.menta_kept_the_last_details_saved_for_this_accou':
    'Menta behält die zuletzt für dieses Konto gespeicherten Daten bei. Du kannst dein Profil weiterhin bearbeiten und andere Profilaktionen nutzen.',
  'fullAuth.tabs_profile.momenta': 'Momenta',
  'fullAuth.tabs_profile.no_promises_yet': 'Noch keine Versprechen',
  'fullAuth.tabs_profile.open_saved_type_invite':
    'Gespeicherte {type}-Einladung öffnen',
  'fullAuth.tabs_profile.open_the_invite_to_review_it_before_joining':
    'Öffne die Einladung, um sie vor dem Beitritt zu prüfen.',
  'fullAuth.tabs_profile.opens_your_invite_link_and_the_current_reward_te':
    'Öffnet deinen Einladungslink und die aktuellen Prämienbedingungen.',
  'fullAuth.tabs_profile.personal_promises': 'Persönliche Versprechen',
  'fullAuth.tabs_profile.profile_details_may_be_out_of_date':
    'Profildetails sind möglicherweise veraltet',
  'fullAuth.tabs_profile.progress_and_rewards': 'Fortschritt und Belohnungen',
  'fullAuth.tabs_profile.progress_starts_with_proof':
    'Fortschritt beginnt mit dem Nachweis',
  'fullAuth.tabs_profile.saved': 'Gespeichert',
  'fullAuth.tabs_profile.sign_in_again': 'Erneut anmelden',
  'fullAuth.tabs_profile.sign_in_to_see_you':
    'Melde dich an, um dein Profil zu sehen',
  'fullAuth.tabs_profile.streaks_and_progress_appear_after_you_send_proof':
    'Tagesserien und Fortschritt werden angezeigt, nachdem du den Nachweis für ein aktives Versprechen gesendet hast.',
  'fullAuth.tabs_profile.the_last_saved_promise_and_group_counts_are_stil':
    'Das zuletzt gespeicherte Versprechen und die Gruppenanzahl werden weiterhin angezeigt. Andere Profilaktionen bleiben verfügbar.',
  'fullAuth.tabs_profile.wallet_shop_and_items': 'Geldbörse, Shop und Artikel',
  'fullAuth.tabs_profile.you': 'Du',
  'fullAuth.tabs_profile.your_progress_may_be_out_of_date':
    'Dein Fortschritt ist möglicherweise veraltet',
  'fullAuth.tabs_profile.your_rhythm': 'Dein Rhythmus',

  // Vollständige Vorlagen für dynamische Onboarding-Texte. Sichtbare Werte
  // bleiben Platzhalter, damit die deutsche Satzstellung erhalten bleibt.
  'fullAuth.source.proof.photo': 'Foto-Nachweis',
  'fullAuth.source.proof.video': 'Video-Nachweis',
  'fullAuth.source.proof.note': 'Text-Nachweis',
  'fullAuth.source.proof.choose': 'Nachweis auswählen',
  'fullAuth.source.example.walk': 'Nach der Arbeit 20 Minuten spazieren gehen',
  'fullAuth.source.example.application': 'Die Bewerbung vor 17:00 Uhr senden',
  'fullAuth.source.example.read': 'Vor dem Schlafengehen zehn Seiten lesen',
  'fullAuth.source.validation.action_required':
    'Beschreibe die Handlung, die du nachweisen möchtest.',
  'fullAuth.source.error.account_changed':
    'Dein Konto hat sich geändert. Öffne das Onboarding erneut, um fortzufahren.',
  'fullAuth.source.error.first_promise_lookup':
    'Menta konnte nicht bestätigen, ob dein erstes Versprechen bereits existiert. Dein Entwurf ist sicher. Versuche es erneut, bevor du es erstellst.',
  'fullAuth.source.error.incomplete_activation_receipt':
    'Menta konnte die Aktivierung nicht vollständig bestätigen. Dein Entwurf ist sicher. Versuche es erneut, bevor du es erstellst.',
  'fullAuth.source.error.incomplete_recovered_promise':
    'Menta konnte die Aktivierung nicht vollständig bestätigen. Dein Entwurf ist sicher. Versuche es erneut, bevor du es erstellst.',
  'fullAuth.source.error.referral_skip_unconfirmed':
    'Menta konnte nicht bestätigen, dass du den Empfehlungsschritt übersprungen hast. Versuche es erneut, bevor du dein Versprechen erstellst.',
  'fullAuth.source.error.referral_code_mismatch':
    'Für dieses Konto ist bereits ein anderer Empfehlungscode gespeichert. Menta hat diesen Code wiederhergestellt, damit du fortfahren oder den Schritt überspringen kannst.',
  'fullAuth.source.error.referral_code_invalid':
    'Gib den 32-stelligen Code ein oder überspringe diesen Schritt.',
  'fullAuth.source.error.referral_unavailable':
    'Menta konnte den Code nicht bestätigen. Er ist weiterhin auf diesem Telefon gespeichert. Versuche es erneut, bevor du dein Versprechen erstellst.',
  'fullAuth.source.error.referral_code_not_added':
    'Dieser Code konnte deinem Konto nicht hinzugefügt werden. Überprüfe ihn oder überspringe diesen Schritt.',
  'fullAuth.source.error.referral_not_confirmed':
    'Menta konnte den gespeicherten Empfehlungscode nicht bestätigen. Versuche es erneut, bevor du dein Versprechen erstellst.',
  'fullAuth.source.verification_description':
    'Füge einen klaren Nachweis hinzu, der zeigt, dass du dein Versprechen erfüllt hast.',
  'fullAuth.source.submission_text':
    'Beschreibe, was du erledigt hast, und füge den heutigen Nachweis hinzu.',
  'fullAuth.source.error.incomplete_promise_response':
    'Die Antwort zu deinem Versprechen war unvollständig. Erstelle es nicht erneut. Öffne Menta erneut, um dieses Versprechen wiederherzustellen.',
  'fullAuth.source.error.draft_safe':
    'Dein Entwurf ist auf diesem Telefon weiterhin sicher. Versuche es erneut.',
  'fullAuth.source.error.next_step':
    'Menta konnte deinen nächsten Schritt nicht vorbereiten. Dein Versprechen ist sicher. Versuche erneut fortzufahren.',
  'fullAuth.source.error.promise_safe':
    'Dein Versprechen ist sicher. Versuche erneut fortzufahren.',
  'fullAuth.source.error.sign_in_session':
    'Die Anmeldung konnte nicht bestätigt werden.',
  'fullAuth.source.error.claim_draft':
    'Menta hat dich angemeldet, konnte deinen Entwurf aber nicht übernehmen. Öffne das Onboarding erneut, um ihn wiederherzustellen.',
  'fullAuth.source.error.confirm_documents':
    'Bestätige die erforderlichen Dokumente, bevor du fortfährst.',
  'fullAuth.source.error.provider_sign_in':
    'Die Anmeldung mit {providerName} ist fehlgeschlagen.',
  'fullAuth.source.referral.both_rewarded':
    'Du hast {referredRewardAmount} Momenta erhalten. Die Person, die dich eingeladen hat, hat {inviterRewardAmount} erhalten.',
  'fullAuth.source.referral.inviter_capped':
    'Du hast {referredRewardAmount} Momenta erhalten. Die Person, die dich eingeladen hat, hat das jährliche Prämienlimit erreicht.',
  'fullAuth.source.referral.program_disabled':
    'Deine Einladung wurde gespeichert. Prämien für Empfehlungen sind derzeit nicht aktiv.',
  'fullAuth.source.referral.already_accepted':
    'Diese Einladung wurde bereits für dein Konto gespeichert.',
  'fullAuth.source.referral.unavailable':
    'Deine Einladung ist für einen weiteren Versuch weiterhin auf diesem Telefon gespeichert.',
  'fullAuth.source.referral.accepted': 'Deine Einladung wurde gespeichert.',
  'fullAuth.source.referral.not_added':
    'Es wurde keine Empfehlungsprämie hinzugefügt.',
  'fullAuth.source.momenta.added': '{amount} hinzugefügt',
  'fullAuth.source.momenta.already_confirmed': '{amount} bereits bestätigt',
  'fullAuth.source.momenta.no_new_credit': 'Keine neue Gutschrift',
  'fullAuth.source.accountability.group_next':
    'Als Nächstes eine Gruppe erstellen',
  'fullAuth.source.accountability.group_setup_next':
    'Als Nächstes eine neue Gruppe erstellen',
  'fullAuth.source.accountability.just_me': 'Nur ich',
  'fullAuth.source.accountability.no_invitation_waiting':
    'Für dieses Konto wartet keine Einladung.',
  'fullAuth.source.accountability.invitation_and_documents_check_failed':
    'Menta konnte diese Einladung und die aktuellen Dokumente nicht prüfen.',
  'fullAuth.source.accountability.documents_need_agreement':
    'Du musst den aktuellen Dokumenten noch zustimmen.',
  'fullAuth.source.accountability.account_changed_reopen_invite':
    'Dein Konto hat sich geändert. Öffne die Einladung erneut.',
  'fullAuth.source.accountability.save_agreement_failed':
    'Menta konnte deine Zustimmung nicht speichern.',
  'fullAuth.source.accountability.invitation_changed':
    'Diese Einladung hat sich geändert. Öffne die neueste Einladung erneut.',
  'fullAuth.source.accountability.finish_setup_failed':
    'Menta konnte diese Kontoeinrichtung nicht abschließen.',
  'fullAuth.source.accountability.continue_to_invitation':
    'Weiter zur Einladung',
  'fullAuth.source.accountability.promise_invited_by':
    '{inviterName} hat dich eingeladen.',
  'fullAuth.source.accountability.event_invited':
    'Du wurdest zu „{eventTitle}“ eingeladen.',
  'fullAuth.source.accountability.continue_with_invitation':
    'Mit deiner Einladung fortfahren',
  'fullAuth.source.accountability.documents_check_failed':
    'Menta konnte die aktuellen Dokumente für dieses Konto nicht prüfen.',
  'fullAuth.source.accountability.account_setup': 'Konto einrichten',
  'fullAuth.source.accountability.setup_load_failed':
    'Einrichtung konnte nicht geladen werden',
  'fullAuth.source.accountability.invitation_unavailable':
    'Einladung nicht verfügbar',
  'fullAuth.source.accountability.start_own_promise':
    'Mit meinem eigenen Versprechen beginnen',
  'fullAuth.source.accountability.setup_then_review':
    'Schließe diese kurze Kontoeinrichtung ab und prüfe dann die Einladung. Du bist noch nicht beigetreten.',
  'fullAuth.source.accountability.agreements_current_title':
    'Deine Zustimmungen sind aktuell',
  'fullAuth.source.accountability.agreements_current_description':
    'Menta hat die aktuellen Dokumentversionen für dieses Konto bestätigt.',
  'fullAuth.source.accountability.setup_incomplete_title':
    'Die Kontoeinrichtung ist noch nicht abgeschlossen',
  'fullAuth.source.accountability.choose_reminders': 'Erinnerungen auswählen',
  'fullAuth.source.accountability.documents_load_failed_title':
    'Dokumente konnten nicht geladen werden',
  'fullAuth.source.accountability.documents_load_failed_description':
    'Dein Versprechen ist sicher. Überprüfe deine Verbindung, bevor du dich anmeldest.',
  'fullAuth.source.accountability.documents_changed_title':
    'Die Dokumente haben sich geändert',
  'fullAuth.source.accountability.documents_changed_description':
    'Prüfe die aktuellen Versionen und stimme ihnen erneut zu.',
  'fullAuth.source.accountability.documents_loading_title':
    'Die Dokumente werden noch geladen',
  'fullAuth.source.accountability.documents_loading_description':
    'Warte einen Moment und versuche es dann erneut.',
  'fullAuth.source.accountability.referral_code_format_error':
    'Überprüfe den 32-stelligen Code oder fahre ohne Empfehlungscode fort.',
  'fullAuth.source.email_confirmation.resend_offline':
    'Du bist offline. Stelle die Verbindung wieder her und sende die Bestätigung erneut.',
  'fullAuth.source.email_confirmation.resend_rate_limited':
    'Menta kann noch keine weitere E-Mail senden. Warte einen Moment und versuche es dann erneut.',
  'fullAuth.source.email_confirmation.resend_failed':
    'Menta konnte die Bestätigung nicht erneut senden. Deine Registrierung ist weiterhin ausstehend.',
  'fullAuth.source.email_confirmation.restore_failed_title':
    'Diese Registrierung konnte nicht wiederhergestellt werden',
  'fullAuth.source.email_confirmation.restore_failed_description':
    'Menta konnte die auf diesem Gerät gespeicherte E-Mail-Adresse nicht lesen. Du kannst dich trotzdem sicher anmelden.',
  'fullAuth.source.email_confirmation.expired_title':
    'Dieser Bestätigungslink ist abgelaufen',
  'fullAuth.source.email_confirmation.expired_description':
    'Dein Versprechen und deine Einladung sind weiterhin gespeichert. Lass dir unten eine neue Bestätigungs-E-Mail senden.',
  'fullAuth.source.email_confirmation.invalid_title':
    'Dieser Bestätigungslink ist ungültig',
  'fullAuth.source.email_confirmation.invalid_description':
    'Vielleicht wurde er bereits verwendet. Prüfe dieses Gerät erneut, lass die E-Mail noch einmal senden oder melde dich an.',
  'fullAuth.source.email_confirmation.account_mismatch_title':
    'Dieser Link gehört zu einem anderen Konto',
  'fullAuth.source.email_confirmation.account_mismatch_description':
    'Menta hat dein gespeichertes Versprechen oder deine Einladung keinem anderen Konto zugeordnet.',
  'fullAuth.source.email_confirmation.storage_title':
    'Lass Menta vorerst geöffnet',
  'fullAuth.source.email_confirmation.storage_description':
    'Die Bestätigungs-E-Mail wurde angefordert, aber dieses Gerät konnte den Vorgang nicht für einen späteren App-Start speichern.',
  'fullAuth.source.email_confirmation.callback_failed_title':
    'Bestätigung konnte nicht abgeschlossen werden',
  'fullAuth.source.email_confirmation.callback_failed_description':
    'Deine Registrierung ist weiterhin ausstehend. Prüfe den E-Mail-Link erneut oder lass ihn unten noch einmal senden.',
  'fullAuth.source.email_confirmation.reopen_failed_title':
    'Registrierung konnte nicht erneut geöffnet werden',
  'fullAuth.source.email_confirmation.reopen_failed_description':
    'Menta hat die ausstehende E-Mail-Adresse gespeichert, damit du dieselbe Registrierung nicht versehentlich zweimal absendest. Versuche es erneut.',
  'fullAuth.source.email_confirmation.signed_in_account_mismatch_title':
    'Ein anderes Konto ist angemeldet',
  'fullAuth.source.email_confirmation.signed_in_account_mismatch_description':
    'Menta hat diese Registrierung diesem Konto nicht zugeordnet. Melde dich vom anderen Konto ab, bevor du fortfährst.',
  'fullAuth.source.email_confirmation.no_session_title':
    'Auf diesem Gerät gibt es noch keine bestätigte Sitzung',
  'fullAuth.source.email_confirmation.no_session_description':
    'Öffne den neuesten Bestätigungslink auf diesem Gerät. Wenn du die E-Mail bereits auf einem anderen Gerät bestätigt hast, melde dich mit deinem Passwort an.',
  'fullAuth.source.email_confirmation.check_failed_title':
    'Bestätigung konnte nicht geprüft werden',
  'fullAuth.source.email_confirmation.check_failed_description':
    'Deine Registrierung ist weiterhin gespeichert. Überprüfe deine Verbindung und versuche es dann erneut.',
  'fullAuth.source.email_confirmation.resent_title':
    'Neue Bestätigung wurde gesendet',
  'fullAuth.source.email_confirmation.resent_description':
    'Prüfe {email} und öffne den neuesten Link.',
  'fullAuth.source.email_confirmation.resend_failed_title':
    'Bestätigung konnte nicht erneut gesendet werden',
  'fullAuth.source.email_confirmation.restoring':
    'Deine E-Mail-Bestätigung wird wiederhergestellt …',
  'fullAuth.source.email_confirmation.no_pending_title':
    'Keine Registrierung wartet',
  'fullAuth.source.email_confirmation.no_pending_description':
    'Auf diesem Gerät gibt es keine E-Mail-Bestätigung, die fortgesetzt werden kann. Melde dich an, wenn du bereits ein Menta-Konto hast.',
  'fullAuth.source.email_confirmation.change_email': 'E-Mail-Adresse ändern',
  'fullAuth.source.email_confirmation.heading': 'Prüfe deine E-Mails',
  'fullAuth.source.email_confirmation.instruction':
    'Öffne den neuesten Bestätigungslink von Menta auf diesem Gerät, um fortzufahren.',
  'fullAuth.source.email_confirmation.email_accessibility':
    'Bestätigungs-E-Mail {email}',
  'fullAuth.source.email_confirmation.email_label': 'Bestätigungs-E-Mail',
  'fullAuth.source.email_confirmation.saved_state_description':
    'Dein unfertiges Versprechen und alle gespeicherten Empfehlungsdaten oder Einladungen bleiben auf diesem Gerät. Menta speichert die rechtlichen Dokumentversionen und den Zeitpunkt deiner Zustimmung, prüft beides nach der Anmeldung erneut und schließt das Onboarding erst ab, wenn eine Sitzung für diese E-Mail-Adresse bestätigt ist.',
  'fullAuth.source.email_confirmation.confirmed_action':
    'Ich habe meine E-Mail-Adresse bestätigt',
  'fullAuth.source.email_confirmation.resend_countdown':
    'Erneut senden in {seconds} s',
  'fullAuth.source.email_confirmation.resend_action':
    'Bestätigung erneut senden',
  'fullAuth.source.receipt.see_today': 'In „Heute“ ansehen',
  'fullAuth.residual.paper_auth.create_account_action': 'Konto erstellen',
  'fullAuth.residual.paper_auth.creating_account_action':
    'Konto wird erstellt …',
  'fullAuth.residual.paper_auth.sign_in_action': 'Anmelden',
  'fullAuth.residual.paper_auth.signing_in_action': 'Anmeldung läuft …',
  'fullAuth.residual.paper_auth.already_have_account':
    'Du hast bereits ein Konto?',
  'fullAuth.residual.paper_auth.new_to_menta': 'Neu bei Menta?',
  'fullAuth.residual.paper_auth.choose_username':
    'Wähle den Benutzernamen, den andere in Menta sehen.',
  'fullAuth.residual.paper_auth.minimum_three_characters':
    'Verwende mindestens 3 Zeichen.',
  'fullAuth.residual.paper_auth.username_characters':
    'Verwende nur Buchstaben, Zahlen oder Unterstriche in deinem Benutzernamen.',
  'fullAuth.residual.paper_auth.account_email':
    'Gib die E-Mail-Adresse für dieses Menta-Konto ein.',
  'fullAuth.residual.paper_auth.valid_email':
    'Gib eine gültige E-Mail-Adresse ein.',
  'fullAuth.residual.paper_auth.enter_password': 'Gib dein Passwort ein.',
  'fullAuth.residual.paper_auth.create_password': 'Erstelle ein Passwort.',
  'fullAuth.residual.paper_auth.password_minimum':
    'Verwende mindestens {length} Zeichen.',
  'fullAuth.residual.paper_auth.confirm_password': 'Bestätige dein Passwort.',
  'fullAuth.residual.paper_auth.passwords_match':
    'Beide Passwortfelder müssen übereinstimmen.',
  'fullAuth.residual.paper_auth.duplicate_email':
    'Für diese E-Mail-Adresse gibt es bereits ein Menta-Konto.',
  'fullAuth.residual.paper_auth.fallback_sign_in':
    'Die Anmeldung mit diesen Daten war nicht möglich.',
  'fullAuth.residual.paper_auth.fallback_create':
    'Dieses Konto konnte nicht erstellt werden.',
  'fullAuth.residual.paper_auth.error_state':
    'Dein Versprechen ist noch da. Korrigiere das markierte Feld oder melde dich stattdessen an.',
  'fullAuth.residual.paper_auth.return_to_promise':
    'Zu deinem ersten Versprechen zurückkehren',
  'fullAuth.residual.paper_auth.switch_sign_in': 'Anmelden',
  'fullAuth.residual.paper_auth.switch_create': 'Konto erstellen',
  'fullAuth.residual.paper_reset.sending_link': 'Link wird gesendet …',
  'fullAuth.residual.paper_reset.back_to_sign_in': 'Zur Anmeldung',
  'fullAuth.residual.paper_reset.remembered_it': 'Erinnerst du dich wieder?',
  'fullAuth.residual.paper_reset.password_changes_after_link':
    'Dein Passwort ändert sich erst, wenn du den Link verwendest.',
  'fullAuth.residual.paper_reset.another_link_available':
    'Ein weiterer Link ist ab {label} verfügbar.',
  'fullAuth.residual.paper_reset.sending_another_link':
    'Weiterer Link wird gesendet …',
  'fullAuth.residual.paper_reset.send_another_link_in':
    'Weiteren Link in {countdown} senden',
  'fullAuth.residual.paper_reset.send_another_link': 'Weiteren Link senden',
  'fullAuth.residual.oauth.apple_sign_in_fallback':
    'Die Anmeldung mit Apple war nicht möglich. Versuche es erneut oder verwende deine E-Mail-Adresse.',
  'fullAuth.residual.legal.sign_in_again':
    'Melde dich erneut an, um diese Dokumente zu prüfen.',
  'fullAuth.residual.legal.load_online':
    'Die aktuellen Dokumente konnten nicht geladen werden. Versuche es erneut, bevor du ein neues Versprechen erstellst.',
  'fullAuth.residual.legal.load_offline':
    'Verbinde dich mit dem Internet, um die aktuellen Dokumente zu prüfen und zu akzeptieren.',
  'fullAuth.residual.legal.save_offline':
    'Verbinde dich mit dem Internet, um deine Zustimmung zu speichern. Offline wurde nichts gespeichert.',
  'fullAuth.residual.legal.changed':
    'Die Dokumente wurden geändert, während diese Seite geöffnet war. Prüfe die aktuellen Versionen und akzeptiere sie erneut.',
  'fullAuth.residual.legal.save_online':
    'Deine Zustimmung konnte nicht gespeichert werden. Sonst wurde nichts geändert. Versuche es erneut.',
  'fullAuth.residual.legal.save_connection':
    'Die Verbindung endete, bevor Menta deine Zustimmung speichern konnte. Stelle die Verbindung wieder her und versuche es erneut.',
  'fullAuth.residual.legal.title_continue': 'Bevor du fortfährst',
  'fullAuth.residual.legal.title_update': 'Prüfe, was sich geändert hat',
  'fullAuth.residual.legal.title_settings': 'Deine Menta-Dokumente prüfen',
  'fullAuth.residual.legal.title_create': 'Bevor du erstellst',
  'fullAuth.residual.legal.return_settings': 'Zurück zu den Einstellungen',
  'fullAuth.residual.legal.continue_create': 'Mit der Erstellung fortfahren',
  'fullAuth.residual.legal.continue_menta': 'In Menta fortfahren',
  'fullAuth.residual.legal.body_update':
    'Lies die aktualisierten Dokumente und stimme den neuen Versionen zu.',
  'fullAuth.residual.legal.body_post_auth':
    'Lies die drei kurzen Dokumente unten und stimme einmal für dieses Konto zu.',
  'fullAuth.residual.legal.body_settings':
    'Prüfe die aktuellen Dokumente für dein Konto.',
  'fullAuth.residual.legal.body_create':
    'Lies die drei kurzen Dokumente unten und stimme zu, bevor du ein Versprechen erstellst.',
  'fullAuth.residual.legal.accepted':
    'Du hast die aktuellen Dokumentversionen für dieses Konto akzeptiert.',
  'fullAuth.residual.legal.leave_blocked':
    'Du kannst gehen, ohne zuzustimmen. Dein Konto und deine vorhandenen Inhalte bleiben verfügbar. Ein neues Versprechen kannst du erst erstellen, wenn du die aktuellen Versionen akzeptierst.',
  'fullAuth.residual.legal.leave_available':
    'Du kannst gehen, ohne zuzustimmen. Dein Konto und deine vorhandenen Versprechen bleiben verfügbar.',
  'fullAuth.residual.legal.document_open_failed':
    '{label} wurde nicht geöffnet. Versuche es erneut.',
  'fullAuth.residual.notifications.sign_in_again':
    'Melde dich erneut an, um deine Mitteilungseinstellungen zu verwalten.',
  'fullAuth.residual.notifications.load_failed':
    'Deine Mitteilungseinstellungen konnten nicht geladen werden. Deine gespeicherte Auswahl bleibt unverändert.',
  'fullAuth.residual.notifications.still_apply':
    'Deine gespeicherten Mitteilungseinstellungen gelten möglicherweise weiterhin. Versuche es erneut oder kehre zu den Einstellungen zurück.',
  'fullAuth.residual.notifications.auto_save':
    'Änderungen werden automatisch gespeichert.',
  'fullAuth.residual.notifications.off_save':
    'Die Auswahl wird hier gespeichert. Mitteilungen bleiben auf diesem Telefon deaktiviert.',
  'fullAuth.residual.report.sign_in_description':
    'Melde dich erneut an, bevor du diesen Bericht öffnest. Entwürfe bleiben für das Konto, das sie erstellt hat, privat.',
  'fullAuth.residual.report.return_description':
    'Kehre zum Support zurück und starte dann einen neuen Bericht für dieses Konto.',
  'fullAuth.residual.report.sign_in_required': 'Anmeldung erforderlich',
  'fullAuth.residual.report.other_account':
    'Dieser Bericht gehört zu einem anderen Konto',
  'fullAuth.residual.report.received_content':
    'Menta hat diesen Bericht erhalten. Autorisiertes Sicherheitspersonal kann die gemeldeten Inhalte prüfen, auch aus Gruppen nur auf Einladung. Andere Mitglieder können nicht sehen, wer den Bericht erstellt hat.',
  'fullAuth.residual.report.received_feedback':
    'Der Support hat deine Rückmeldung erhalten. Deine Nachweise, deine Serie und dein Gruppenverlauf bleiben unverändert.',
  'fullAuth.residual.report.received_report':
    'Der Support hat deinen Bericht erhalten. Deine Nachweise, deine Serie und dein Gruppenverlauf bleiben unverändert, während der Bericht geprüft wird.',
  'fullAuth.residual.report.status_received': 'Erhalten',
  'fullAuth.residual.report.status_queued': 'Eingereiht',
  'fullAuth.residual.report.feedback_heading': 'Was sollen wir wissen?',
  'fullAuth.residual.report.issue_heading': 'Was ist schiefgelaufen?',
  'fullAuth.residual.report.check_heading': 'Prüfen und senden',
  'fullAuth.residual.report.feedback_description':
    'Sag uns, was funktioniert, was nicht funktioniert oder was Menta besser machen würde.',
  'fullAuth.residual.report.issue_description':
    'Sag uns, was du getan hast und was Menta angezeigt hat. Diese Angaben helfen dem Supportteam bei der Untersuchung.',
  'fullAuth.residual.report.check_description':
    'Lies alles noch einmal durch. Alles darunter ist optional.',
  'fullAuth.residual.report.screenshot_feedback':
    'Füge einen Screenshot hinzu, wenn er deine Rückmeldung erklärt.',
  'fullAuth.residual.report.screenshot_issue':
    'Füge einen Screenshot hinzu, damit der Support das Problem sehen kann.',
  'fullAuth.residual.report.feedback_label': 'Rückmeldung',
  'fullAuth.residual.report.what_happened_label': 'Was ist passiert?',
  'fullAuth.residual.report.included_feedback': 'In der Rückmeldung enthalten',
  'fullAuth.residual.report.included_report': 'Im Bericht enthalten',
  'fullAuth.residual.report.message_label': 'Nachricht',
  'fullAuth.residual.report.report_label': 'Bericht',
  'fullAuth.residual.report.form_label': 'dieses Formular',
  'fullAuth.residual.report.report_context_label': 'der Bericht',
  'fullAuth.residual.report.feedback_title': 'Menta-Rückmeldung',
  'fullAuth.residual.report.category_promise': 'Versprechen',
  'fullAuth.residual.report.category_group': 'Gruppe',
  'fullAuth.residual.report.category_proof': 'Nachweis',
  'fullAuth.residual.report.category_member': 'Mitglied',
  'fullAuth.residual.report.category_app_issue': 'App-Problem',
  'fullAuth.residual.settings.offline_value': 'Offline',
  'fullAuth.residual.settings.retry_value': 'Erneut versuchen',
  'fullAuth.residual.settings.restart_loading': 'Neustart läuft …',
  'fullAuth.residual.settings.checking_loading': 'Wird geprüft …',
  'fullAuth.residual.settings.restart_value': 'Neustart',
  'fullAuth.residual.settings.check_value': 'Prüfen',
  'fullAuth.residual.settings.loading_value': 'Wird geladen …',
  'fullAuth.residual.settings.on_value': 'An',
  'fullAuth.residual.settings.off_value': 'Aus',
  'fullAuth.residual.settings.opening_value': 'Wird geöffnet …',
  'fullAuth.residual.settings.advanced_title':
    'Erweiterte Diagnose ist aktiviert',
  'fullAuth.residual.settings.advanced_prompt': 'Erweiterte Diagnose teilen?',
  'fullAuth.residual.settings.advanced_full_body':
    'Wenn du dies aktivierst, teilt Menta stichprobenartige Leistungsmessungen mit Sentry. Die Sitzungswiedergabe von Amplitude läuft separat; Text, Eingabefelder und Bilder werden maskiert. Dadurch werden weder Werbung noch appübergreifendes Tracking aktiviert.',
  'fullAuth.residual.settings.advanced_basic_body':
    'Wenn du dies aktivierst, teilt Menta zusätzliche Leistungsmessungen mit Sentry. Dadurch werden weder Werbung noch appübergreifendes Tracking aktiviert.',
} as const satisfies Pick<EnglishCatalogue, FullAuthAccountKey> &
  Record<FullAuthSourceKey | FullAuthResidualKey, string>;
