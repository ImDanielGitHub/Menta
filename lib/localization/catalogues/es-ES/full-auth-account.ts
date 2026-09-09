// Spain Spanish catalogue for auth, onboarding, account, settings and support surfaces.
// Dynamic values stay inside the complete template so translations can reorder them.
import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type FullAuthAccountKey = Extract<keyof EnglishCatalogue, `fullAuth.${string}`>;

export const fullAuthAccountEsES = {
  'fullAuth.shared.try_again': 'Vuelve a intentarlo',
  'fullAuth.support.untitled_report': 'sin título informe',
  'fullAuth.onboarding.promise_setup_step_one': 'promesa Ajustes · 1 de 2',
  'fullAuth.onboarding.promise_setup_step_two': 'promesa Ajustes · 2 de 2',
  'fullAuth.component_onboarding_paperauthreset.your_account_email':
    'Tu cuenta correo electrónico',
  'fullAuth.shared.back_to_you': 'Volver a tú',
  'fullAuth.shared.promise': 'promesa',
  'fullAuth.shared.terms': 'términos',
  'fullAuth.shared.back_to_settings': 'Volver a ajustes',
  'fullAuth.shared.other_sign_in_options': 'otra inicio de sesión opciones',
  'fullAuth.shared.retry_profile': 'reintentar perfil',
  'fullAuth.shared.refresh_progress': 'actualizar progreso',
  'fullAuth.shared.check_connection_again': 'comprobar conexión de nuevo',
  'fullAuth.shared.sign_in': 'Iniciar sesión',
  'fullAuth.support.feedback': 'comentarios',
  'fullAuth.support.promise_report': 'promesa informe',
  'fullAuth.support.group_report': 'grupo informe',
  'fullAuth.support.proof_report': 'prueba informe',
  'fullAuth.support.app_issue': 'aplicación problema',
  'fullAuth.support.checking_saved_proof':
    'comprobando guardado prueba en este teléfono.',
  'fullAuth.support.saved_proof_count_unavailable':
    'guardado-prueba cantidad no disponible.',
  'fullAuth.support.no_proof_waiting':
    'no prueba es esperando en este teléfono.',
  'fullAuth.support.proof_count_saved':
    '{count} {proofLabel} guardado en este teléfono.',
  'fullAuth.support.proof_is': 'prueba es',
  'fullAuth.support.proofs_are': 'pruebas son',
  'fullAuth.support.saved_proof_waiting_to_be_sent':
    '{count} {proofLabel} guardado en este teléfono y todavía esperando a estar enviado.',
  'fullAuth.email_auth.create_account': 'crear cuenta',
  'fullAuth.email_auth.sign_in': 'Iniciar sesión',
  'fullAuth.email_auth.already_have_account': '¿Ya tienes una cuenta?',
  'fullAuth.email_auth.new_to_menta': '¿Eres nuevo en Menta?',
  'fullAuth.email_auth.offline_reconnect':
    'estás sin conexión. reconectar y Vuelve a intentarlo.',
  'fullAuth.email_auth.too_many_attempts':
    'demasiado muchos intentos. espera una momento, después Vuelve a intentarlo.',
  'fullAuth.email_auth.could_not_sign_in':
    'No se ha podido Iniciar sesión. comprobar Tu correo electrónico y contraseña, después Vuelve a intentarlo.',
  'fullAuth.email_auth.could_not_create_account':
    'No se ha podido crear Tu cuenta. Comprueba tu conexión, después Vuelve a intentarlo.',
  'fullAuth.email_auth.enter_password': 'introducir Tu contraseña.',
  'fullAuth.email_auth.create_password': 'crear una contraseña.',
  'fullAuth.email_auth.confirm_your_password': 'confirmar Tu contraseña.',
  'fullAuth.email_auth.password_minimum': 'Usa al menos {length} caracteres.',
  'fullAuth.email_auth.password_mismatch': 'contraseñcomo hacer no coincidir.',
  'fullAuth.email_auth.choose_username': 'elegir una nombre de usuario.',
  'fullAuth.email_auth.minimum_three_characters': 'Usa al menos 3 caracteres.',
  'fullAuth.email_auth.username_characters_only':
    'usar letras, números, o guiones bajos solo.',
  'fullAuth.email_auth.account_email':
    'introducir tu Menta cuenta correo electrónico.',
  'fullAuth.email_auth.valid_email':
    'introducir una válido correo electrónico dirección.',
  'fullAuth.email_auth.passwords_need_to_match':
    'contraseñcomo necesita a coincidir.',
  'fullAuth.password_recovery.confirm_new_password':
    'confirmar tu nuevo contraseña.',
  'fullAuth.password_recovery.passwords_mismatch':
    'el contraseñcomo hacer no coincidir.',
  'fullAuth.password_recovery.minimum_password_length':
    'Usa al menos {length} caracteres.',
  'fullAuth.password_recovery.could_not_change_now':
    'No hemos podido cambiar Tu contraseña correcta ahora.',
  'fullAuth.password_recovery.sign_in_with_new_password_draft':
    'Iniciar sesión con tu nuevo contraseña, después Vuelve a tu borrador.',
  'fullAuth.password_recovery.sign_in_with_new_password':
    'tú puede ahora Iniciar sesión con tu nuevo contraseña.',
  'fullAuth.language_settings.system_accessibility':
    'usar teléfono idioma. {systemSubtitle}',
  'fullAuth.forgot_password.enter_email_tied_to_account':
    'introducir el correo electrónico asociado a tu Menta cuenta.',
  'fullAuth.forgot_password.enter_valid_email':
    'introducir una válido correo electrónico dirección.',
  'fullAuth.forgot_password.could_not_send_reset_email':
    'No se ha podido enviar el restablecer correo electrónico. Comprueba tu conexión y Vuelve a intentarlo.',
  'fullAuth.password_recovery_callback.checking_secure_reset_link':
    'comprobando tu seguro restablecer enlace…',
  'fullAuth.password_recovery_callback.reset_link_verified':
    'restablecer enlace verificado.',
  'fullAuth.report_issue.send_feedback': 'enviar comentarios',
  'fullAuth.report_issue.send_report': 'enviar informe',
  'fullAuth.support.start_a_new_report': 'empezar una nuevo informe',
  'fullAuth.support.report_an_issue': 'informe un problema',
  'fullAuth.notification_settings.daily_proof_reminders_and_promise_ending_updates':
    'diario prueba recordatorios y promesa-final actualizaciones.',
  'fullAuth.notification_settings.saved_but_notifications_are_off_on_this_phone':
    'guardado, pero notificaciones son desactivadas en este teléfono.',
  'fullAuth.notification_settings.occasional_updates_to_email_unsubscribe_here':
    'ocasionales actualizaciones a {email}. cancelar la suscripción aquí a cualquier tiempo.',
  'fullAuth.notification_settings.a_confirmed_account_email_is_required':
    'una confirmado cuenta correo electrónico es obligatorio.',
  'fullAuth.onboarding.menta_mascot_holding_your_first_promise':
    'mascota de Menta sujetando tu primera promesa',
  'fullAuth.onboarding.menta_mascot_waving_hello':
    'mascota de Menta saludando hola',
  'fullAuth.onboarding.your_saved_draft_is_back_on_this_phone':
    'tu guardado borrador es atrás en este teléfono.',
  'fullAuth.onboarding.saved_privately_on_this_phone_as_you_type':
    'guardado de forma privada en este teléfono como tú tipo.',
  'fullAuth.account_deleted.apple_instructions_did_not_open':
    'Apple instrucciones se no abrir',
  'fullAuth.account_deleted.checking_account_deletion':
    'comprobando cuenta Eliminación',
  'fullAuth.account_deleted.go_to_sign_in': 'Ir a Iniciar sesión',
  'fullAuth.account_deleted.if_you_used_sign_in_with_apple_remove_menta_from':
    'si tú usado Iniciar sesión con Apple, Eliminar Menta de el aplicaciones conectado a tu cuenta de Apple. Abre los ajustes del iPhone, toca tu nombre, después Iniciar sesión con Apple.',
  'fullAuth.account_deleted.open_apple_support_and_search_for_manage_your_ap':
    "abrir Apple asistencia y buscar para 'gestionar tu aplicaciones con Iniciar sesión con Apple'.",
  'fullAuth.account_deleted.remove_apple_access': 'Eliminar Apple acceso',
  'fullAuth.account_deleted.see_apple_instructions':
    'Ver las instrucciones de Apple',
  'fullAuth.account_deleted.sign_in_with_apple_access_was_also_removed':
    'Iniciar sesión con Apple acceso fue también Eliminard.',
  'fullAuth.account_deleted.your_account_was_deleted':
    'Tu cuenta fue eliminado',
  'fullAuth.account_deleted.your_menta_account_and_its_data_were_deleted_men':
    'tu Menta cuenta y tus datos fueron eliminado. Menta también borró este de la cuenta guardado datos de este teléfono.',
  'fullAuth.auth_required.events': 'Eventos',
  'fullAuth.auth_required.groups': 'Grupos',
  'fullAuth.auth_required.keep_browsing': 'conservar navegación',
  'fullAuth.auth_required.menta': 'Menta',
  'fullAuth.auth_required.menta_records_the_review_under_your_account':
    'Menta registra el revisión en Tu cuenta.',
  'fullAuth.auth_required.menta_saves_this_proof_with_the_right_promise_an':
    'Menta guarda este prueba con el correcta promesa y cuenta.',
  'fullAuth.auth_required.momenta': 'Momenta',
  'fullAuth.auth_required.proof': 'prueba',
  'fullAuth.auth_required.reviews': 'Revisiones',
  'fullAuth.auth_required.sign_in': 'Iniciar sesión',
  'fullAuth.auth_required.sign_in_to_add_proof':
    'Inicia sesión en añadir prueba',
  'fullAuth.auth_required.sign_in_to_complete_this_action_and_return_here_':
    'Inicia sesión en completar este acción y volver aquí después.',
  'fullAuth.auth_required.sign_in_to_continue': 'Inicia sesión en continuar',
  'fullAuth.auth_required.sign_in_to_continue_with_this_event':
    'Inicia sesión en continuar con este evento',
  'fullAuth.auth_required.sign_in_to_join_this_group':
    'Inicia sesión en unirse este grupo',
  'fullAuth.auth_required.sign_in_to_review_proof':
    'Inicia sesión en revisión prueba',
  'fullAuth.auth_required.sign_in_to_use_momenta':
    'Inicia sesión en usar Momenta',
  'fullAuth.auth_required.your_balance_purchases_and_items_stay_with_your_':
    'tu saldo, compras y artículos mantenerse con Tu cuenta.',
  'fullAuth.auth_required.your_invitation_and_group_activity_stay_with_you':
    'tu invitación y grupo actividad mantenerse con Tu cuenta.',
  'fullAuth.auth_required.your_place_check_in_and_event_photos_are_saved_t':
    'tu sitio, comprobar-in y evento fotos son guardado a Tu cuenta.',
  'fullAuth.auth_required.your_promises_proof_groups_and_reviews_stay_with':
    'Tu promesas, prueba, Grupos y Revisiones mantenerse con tu Menta cuenta.',
  'fullAuth.component_onboarding_mentasurface.hide_password':
    'ocultar contraseña',
  'fullAuth.component_onboarding_mentasurface.menta': 'Menta',
  'fullAuth.component_onboarding_mentasurface.setup': 'Ajustes',
  'fullAuth.component_onboarding_mentasurface.show_password':
    'mostrar contraseña',
  'fullAuth.component_onboarding_paperauthform.after_this': 'después este',
  'fullAuth.component_onboarding_paperauthform.characters': '+ caracteres',
  'fullAuth.component_onboarding_paperauthform.check_the_details':
    'Comprueba los detalles',
  'fullAuth.component_onboarding_paperauthform.confirm_password':
    'confirmar contraseña',
  'fullAuth.component_onboarding_paperauthform.create_your_account':
    'crear Tu cuenta',
  'fullAuth.component_onboarding_paperauthform.creating_your_account':
    'creando Tu cuenta',
  'fullAuth.component_onboarding_paperauthform.daniel': 'Daniel',
  'fullAuth.component_onboarding_paperauthform.email': 'correo electrónico',
  'fullAuth.component_onboarding_paperauthform.forgot_your_password':
    'olvidado Tu contraseña?',
  'fullAuth.component_onboarding_paperauthform.password': 'contraseña',
  'fullAuth.component_onboarding_paperauthform.sign_in_with_email':
    'Iniciar sesión con correo electrónico',
  'fullAuth.component_onboarding_paperauthform.signing_you_in':
    'Iniciando tu sesión',
  'fullAuth.component_onboarding_paperauthform.username': 'nombre de usuario',
  'fullAuth.component_onboarding_paperauthform.you_example_com':
    'you@example.com',
  'fullAuth.component_onboarding_paperauthform.you_will_return_to_your_first_promise':
    'tú podrá Vuelve a tu primera promesa.',
  'fullAuth.component_onboarding_paperauthform.your_promise_stays_on_this_phone_until_the_accou':
    'Tu promesa sigue en este teléfono hasta el cuenta es listo.',
  'fullAuth.component_onboarding_paperauthform.your_promise_stays_on_this_phone_while_we_create':
    'Tu promesa sigue en este teléfono mientras nosotros crear el cuenta.',
  'fullAuth.component_onboarding_paperauthform.your_promise_stays_on_this_phone_while_you_sign_':
    'Tu promesa sigue en este teléfono mientras tú Iniciar sesión.',
  'fullAuth.component_onboarding_paperauthmethods.choose_how_to_sign_in_your_promise_stays_on_this':
    'Elige cómo a Iniciar sesión. Tu promesa sigue en este teléfono hasta inicio de sesión termina.',
  'fullAuth.component_onboarding_paperauthmethods.choose_how_you_want_to_sign_in':
    'Elige cómo tú querer a Iniciar sesión.',
  'fullAuth.component_onboarding_paperauthmethods.continue_with_apple':
    'continuar con Apple',
  'fullAuth.component_onboarding_paperauthmethods.continue_with_email':
    'continuar con correo electrónico',
  'fullAuth.component_onboarding_paperauthmethods.continue_with_google':
    'continuar con Google',
  'fullAuth.component_onboarding_paperauthmethods.save_your_promise':
    'guardar Tu promesa',
  'fullAuth.component_onboarding_paperauthmethods.see_how_menta_works':
    'Descubre cómo funciona Menta',
  'fullAuth.component_onboarding_paperauthmethods.sign_in_to_menta':
    'Inicia sesión en Menta',
  'fullAuth.component_onboarding_paperauthmethods.we_could_not_sign_you_in':
    'No hemos podido sesión tú en',
  'fullAuth.component_onboarding_paperauthreset.back_to_sign_in':
    'Volver a Iniciar sesión',
  'fullAuth.component_onboarding_paperauthreset.check_your_email':
    'comprobar Tu correo electrónico.',
  'fullAuth.component_onboarding_paperauthreset.daniel_example_com':
    'daniel@example.com',
  'fullAuth.component_onboarding_paperauthreset.email': 'correo electrónico',
  'fullAuth.component_onboarding_paperauthreset.email_sent_to':
    'correo electrónico enviado a',
  'fullAuth.component_onboarding_paperauthreset.link_valid_for_60_minutes':
    'enlace válido para 60 minutos',
  'fullAuth.component_onboarding_paperauthreset.reset_for': 'restablecer para',
  'fullAuth.component_onboarding_paperauthreset.reset_your_password':
    'restablecer Tu contraseña',
  'fullAuth.component_onboarding_paperauthreset.send_another_link':
    'enviar otro enlace',
  'fullAuth.component_onboarding_paperauthreset.send_another_link_in_countdown':
    'Envía otro enlace dentro de {countdown}',
  'fullAuth.component_onboarding_paperauthreset.send_reset_link':
    'enviar restablecer enlace',
  'fullAuth.component_onboarding_paperauthreset.sending_your_reset_link':
    'enviando tu restablecer enlace',
  'fullAuth.component_onboarding_paperauthreset.use_the_latest_link':
    'usar el más reciente enlace.',
  'fullAuth.component_onboarding_paperauthreset.use_the_link_we_just_sent_you_can_request_anothe':
    'usar el enlace nosotros solo enviado. tú puede solicitar otro cuando el temporizador termina.',
  'fullAuth.component_onboarding_paperauthreset.we_could_not_send_another_link':
    'No hemos podido enviar otro enlace',
  'fullAuth.component_onboarding_paperauthreset.we_could_not_send_the_reset_link':
    'No hemos podido enviar el restablecer enlace',
  'fullAuth.component_onboarding_paperauthreset.we_ll_email_you_a_secure_link_your_saved_promise':
    'Te enviaremos correo electrónico tú una seguro enlace. tu guardado promesa podrá mantenerse en este teléfono.',
  'fullAuth.component_onboarding_paperauthreset.we_re_sending_a_secure_link_to_the_address_below':
    'Estamos enviando una seguro enlace a el dirección abajo.',
  'fullAuth.component_onboarding_paperauthreset.we_sent_a_secure_reset_link_your_saved_promise_i':
    'nosotros enviado una seguro restablecer enlace. tu guardado promesa es todavía esperando aquí.',
  'fullAuth.component_onboarding_paperauthsurface.before_you_use_the_account_you_ll_review_and_acc':
    'antes tú usar el cuenta, Vas a revisión y aceptar de Menta actual cuenta y comunidad documentos.',
  'fullAuth.component_onboarding_paperauthsurface.choose_sign_in_method':
    'elegir inicio de sesión método',
  'fullAuth.component_onboarding_paperauthsurface.community_standards':
    'comunidad normas',
  'fullAuth.component_onboarding_paperauthsurface.community_standards_did_not_open':
    'comunidad normas se no abrir',
  'fullAuth.component_onboarding_paperauthsurface.hide_password':
    'ocultar contraseña',
  'fullAuth.component_onboarding_paperauthsurface.keep_local_draft':
    'conservar Borrador local',
  'fullAuth.component_onboarding_paperauthsurface.menta': 'Menta',
  'fullAuth.component_onboarding_paperauthsurface.menta_authentication':
    'Autenticación de Menta',
  'fullAuth.component_onboarding_paperauthsurface.menta_mascot':
    'mascota de Menta',
  'fullAuth.component_onboarding_paperauthsurface.privacy_policy':
    'privacidad política',
  'fullAuth.component_onboarding_paperauthsurface.privacy_policy_did_not_open':
    'privacidad política se no abrir',
  'fullAuth.component_onboarding_paperauthsurface.returning_to': 'volviendo a',
  'fullAuth.component_onboarding_paperauthsurface.show_password':
    'mostrar contraseña',
  'fullAuth.component_onboarding_paperauthsurface.terms_did_not_open':
    'términos se no abrir',
  'fullAuth.component_onboarding_paperauthsurface.terms_of_use':
    'términos de usar',
  'fullAuth.component_onboarding_paperauthsurface.the_provider_sheet_was_closed_before_an_account_':
    'el proveedor hoja fue cerrada antes un cuenta fue devuelta. nada fue creado o cambiado.',
  'fullAuth.component_onboarding_paperauthsurface.title_message':
    '{title} {message}',
  'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_community_standar':
    'Vuelve a intentarlo, o visita menta.comunidad/comunidad-normas en tu navegador.',
  'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_privacy_in_your_b':
    'Vuelve a intentarlo, o visita menta.comunidad/privacidad en tu navegador.',
  'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_terms_in_your_bro':
    'Vuelve a intentarlo, o visita menta.comunidad/términos en tu navegador.',
  'fullAuth.component_onboarding_paperauthsurface.you_can_try_again_or_keep_working_without_signin':
    'tú puede Vuelve a intentarlo o conservar trabajando sin iniciando sesión en hasta Menta necesita a guardar lo.',
  'fullAuth.component_onboarding_paperauthsurface.you_re_still_signed_out':
    'estás todavía iniciada fuera.',
  'fullAuth.component_onboarding_paperauthsurface.your_local_promise_is_still_here':
    'tu local promesa es todavía aquí',
  'fullAuth.component_settings_settingssignoutsheet.cancel': 'cancelar',
  'fullAuth.component_settings_settingssignoutsheet.check_the_connection_then_try_again':
    'Comprueba los conexión, después Vuelve a intentarlo.',
  'fullAuth.component_settings_settingssignoutsheet.sign_out': 'sesión fuera',
  'fullAuth.component_settings_settingssignoutsheet.sign_out_did_not_finish':
    'sesión-fuera se no terminar',
  'fullAuth.component_settings_settingssignoutsheet.try_sign_out_again':
    'intenta sesión fuera de nuevo',
  'fullAuth.component_support_offlinesupportnotice.you_can_still_read_the_last_saved_screen_proof_a':
    'tú puede todavía leer el última guardado pantalla. prueba y informe borradores mantenerse en este teléfono hasta Menta se reconecta.',
  'fullAuth.component_support_offlinesupportnotice.you_re_offline':
    'estás sin conexión',
  'fullAuth.component_support_supportsurface.title_subtitle':
    '{title}. {subtitle}',
  'fullAuth.component_support_supportsurface.title_subtitle_detail':
    '{title}. {subtitle} {detail}',
  'fullAuth.edit_profile.account_required': 'cuenta obligatorio',
  'fullAuth.edit_profile.back_to_you': 'Volver a tú',
  'fullAuth.edit_profile.cannot_edit_here': 'no puede editar aquí',
  'fullAuth.edit_profile.change_photo': 'cambiar foto',
  'fullAuth.edit_profile.choose_a_different_photo':
    'elegir una diferente foto.',
  'fullAuth.edit_profile.choose_a_profile_photo': 'elegir una perfil foto',
  'fullAuth.edit_profile.details': 'detalles',
  'fullAuth.edit_profile.display_name': 'mostrar nombre',
  'fullAuth.edit_profile.edit_again': 'editar de nuevo',
  'fullAuth.edit_profile.edit_profile': 'editar perfil',
  'fullAuth.edit_profile.email': 'correo electrónico',
  'fullAuth.edit_profile.how_it_will_look_on_you':
    'cómo lo podrá aspecto en tú',
  'fullAuth.edit_profile.loading_your_profile': 'cargando Tu perfil',
  'fullAuth.edit_profile.name': 'nombre',
  'fullAuth.edit_profile.no_changes_have_been_made_try_loading_your_accou':
    'no cambios tiene sido hecho. intenta cargando Tu cuenta de nuevo.',
  'fullAuth.edit_profile.no_photo_selected': 'no foto seleccionada',
  'fullAuth.edit_profile.nothing_changes_until_you_choose_one':
    'nada cambios hasta tú elegir una.',
  'fullAuth.edit_profile.photo_not_changed_photoerror':
    'foto no cambiado. {photoError}',
  'fullAuth.edit_profile.photo_visibility': 'foto visibilidad',
  'fullAuth.edit_profile.photo_will_be_removed': 'foto podrá estar Eliminard',
  'fullAuth.edit_profile.profile_unavailable': 'perfil no disponible',
  'fullAuth.edit_profile.profile_updated': 'perfil actualizado',
  'fullAuth.edit_profile.remove_photo': 'Eliminar foto',
  'fullAuth.edit_profile.save_changes': 'guardar cambios',
  'fullAuth.edit_profile.saving_changes': 'guardando cambios',
  'fullAuth.edit_profile.saving_your_changes': 'guardando tu cambios',
  'fullAuth.edit_profile.selected_not_saved': 'seleccionada, no guardado',
  'fullAuth.edit_profile.selected_profile_photo_in_its_final_circular_cro':
    'seleccionada perfil foto en tus final circular recorte',
  'fullAuth.edit_profile.sign_in_again': 'Iniciar sesión de nuevo',
  'fullAuth.edit_profile.sign_in_again_before_editing_this_profile':
    'Iniciar sesión de nuevo antes editando este perfil.',
  'fullAuth.edit_profile.this_is_how_the_photo_will_look_on_you_it_will_n':
    'este es cómo el foto podrá aspecto en tú. lo podrá no cambiar hasta tú guardar.',
  'fullAuth.edit_profile.try_again': 'Vuelve a intentarlo',
  'fullAuth.edit_profile.try_saving_again': 'intenta guardando de nuevo',
  'fullAuth.edit_profile.username': 'nombre de usuario',
  'fullAuth.edit_profile.usernames_can_t_be_changed_yet':
    'nombres de usuario No se puede estar cambiado aún.',
  'fullAuth.edit_profile.value': '@{value}',
  'fullAuth.edit_profile.you_can_keep_reviewing_the_preview_while_menta_s':
    'tú puede conservar revisando el vista previa mientras Menta guarda.',
  'fullAuth.edit_profile.you_cannot_change_your_sign_in_email_here':
    'tú no puede cambiar tu inicio de sesión correo electrónico aquí.',
  'fullAuth.edit_profile.your_current_photo_stays_until_you_save_changes':
    'tu actual foto sigue hasta tú guardar cambios.',
  'fullAuth.edit_profile.your_details_will_appear_when_this_check_finishe':
    'tu detalles podrá aparecer cuando este comprobar termina.',
  'fullAuth.edit_profile.your_edits_are_still_here':
    'tu cambios son todavía aquí',
  'fullAuth.edit_profile.your_profile_has_not_changed':
    'Tu perfil ha no cambiado.',
  'fullAuth.edit_profile.your_profile_has_not_changed_try_saving_again':
    'Tu perfil ha no cambiado. intenta guardando de nuevo.',
  'fullAuth.edit_profile.your_saved_name_and_photo_now_appear_across_ment':
    'tu guardado nombre y foto ahora aparecer en todo Menta.',
  'fullAuth.email_auth.confirm_password': 'confirmar contraseña',
  'fullAuth.email_auth.couldn_t_create_account': 'No se ha podido crear cuenta',
  'fullAuth.email_auth.couldn_t_sign_you_in': 'No se ha podido sesión tú en',
  'fullAuth.email_auth.create_an_account_to_save_this_promise_to_menta':
    'crear un cuenta a guardar este promesa a Menta.',
  'fullAuth.email_auth.create_your_account': 'crear Tu cuenta',
  'fullAuth.email_auth.daniel': 'daniel',
  'fullAuth.email_auth.email': 'correo electrónico',
  'fullAuth.email_auth.forgot_your_password': 'olvidado Tu contraseña?',
  'fullAuth.email_auth.menta': 'Menta',
  'fullAuth.email_auth.other_people_may_see_this_with_your_group_activi':
    'otra personas puede ver este con tu grupo actividad y evento fotos.',
  'fullAuth.email_auth.password': 'contraseña',
  'fullAuth.email_auth.sign_in_to_save_this_promise_to_your_menta_accou':
    'Inicia sesión en guardar este promesa a tu Menta cuenta.',
  'fullAuth.email_auth.sign_in_with_email':
    'Iniciar sesión con correo electrónico',
  'fullAuth.email_auth.use_6_or_more_characters': 'usar 6 o más caracteres.',
  'fullAuth.email_auth.use_an_email_you_can_access_if_you_ever_need_to_':
    'usar un correo electrónico tú puede acceso si tú alguna vez necesita a recuperar Tu cuenta.',
  'fullAuth.email_auth.username': 'nombre de usuario',
  'fullAuth.email_auth.you_example_com': 'you@example.com',
  'fullAuth.legal_acceptance.agree_and_continue': 'aceptar y continuar',
  'fullAuth.legal_acceptance.back': 'atrás',
  'fullAuth.legal_acceptance.before_you': 'antes tú',
  'fullAuth.legal_acceptance.checking_the_current_legal_documents':
    'comprobando el actual legal documentos',
  'fullAuth.legal_acceptance.continue': 'continuar.',
  'fullAuth.legal_acceptance.couldn_t_check_your_agreement':
    'No se ha podido Comprueba tu acuerdo',
  'fullAuth.legal_acceptance.create': 'crear.',
  'fullAuth.legal_acceptance.i_agree_to_menta_s_terms_of_use_and_community_st':
    'I aceptar a de Menta términos de usar y comunidad normas, y reconocer el privacidad política.',
  'fullAuth.legal_acceptance.leave_legal_review': 'dejar legal revisión',
  'fullAuth.legal_acceptance.menta': 'Menta',
  'fullAuth.legal_acceptance.menta_mascot_beside_your_account_confirmation':
    'mascota de Menta junto a Tu cuenta Confirmación',
  'fullAuth.legal_acceptance.try_again': 'Vuelve a intentarlo',
  'fullAuth.legal_acceptance.you_can_go_back_without_agreeing_your_account_an':
    'tú puede ir atrás sin aceptando. Tu cuenta y existente promesas mantenerse disponible.',
  'fullAuth.login.menta': 'Menta',
  'fullAuth.notification_settings.a_test_is_already_on_the_way':
    'una prueba es ya en el forma',
  'fullAuth.notification_settings.allow_notifications':
    'permitir notificaciones',
  'fullAuth.notification_settings.allow_notifications_first':
    'permitir notificaciones primera',
  'fullAuth.notification_settings.back_to_settings': 'Volver a ajustes',
  'fullAuth.notification_settings.check_again_before_turning_on_proof_reminders':
    'comprobar de nuevo antes activando en prueba recordatorios.',
  'fullAuth.notification_settings.check_notification_permission':
    'comprobar notificación permiso',
  'fullAuth.notification_settings.check_notification_permission_and_try_the_test_a':
    'comprobar notificación permiso y intenta el prueba de nuevo en una momento.',
  'fullAuth.notification_settings.choice_saved': 'opción guardado',
  'fullAuth.notification_settings.choose_daily_proof_reminders_and_updates_when_a_':
    'elegir diario prueba recordatorios y actualizaciones cuando una promesa es final.',
  'fullAuth.notification_settings.choose_notifications_for_menta_then_return_here':
    'elegir notificaciones para Menta, después volver aquí.',
  'fullAuth.notification_settings.choose_the_notifications_you_want_from_menta':
    'elegir el notificaciones tú querer de Menta.',
  'fullAuth.notification_settings.choose_the_notifications_you_want_from_menta_bel':
    'elegir el notificaciones tú querer de Menta abajo.',
  'fullAuth.notification_settings.choose_which_group_and_progress_updates_menta_ma':
    'elegir que grupo y progreso actualizaciones Menta puede enviar.',
  'fullAuth.notification_settings.confirmed_milestones_momenta_and_streak_changes':
    'confirmado hitos, Momenta y racha cambios.',
  'fullAuth.notification_settings.could_not_check_phone_notifications':
    'No se ha podido comprobar teléfono notificaciones',
  'fullAuth.notification_settings.could_not_load_notification_settings':
    'No se ha podido cargar notificación ajustes.',
  'fullAuth.notification_settings.could_not_load_notification_settings_2':
    'No se ha podido cargar notificación ajustes',
  'fullAuth.notification_settings.could_not_open_phone_settings':
    'No se ha podido abrir teléfono ajustes',
  'fullAuth.notification_settings.could_not_save_your_choice':
    'No se ha podido Guarda tu opción',
  'fullAuth.notification_settings.delivery_and_timing': 'entrega y momento',
  'fullAuth.notification_settings.email_choice_did_not_change':
    'correo electrónico opción se no cambiar',
  'fullAuth.notification_settings.email_updates':
    'correo electrónico actualizaciones',
  'fullAuth.notification_settings.email_updates_are_off':
    'correo electrónico actualizaciones son desactivadas',
  'fullAuth.notification_settings.email_updates_are_on':
    'correo electrónico actualizaciones son en',
  'fullAuth.notification_settings.email_updates_are_still_off':
    'correo electrónico actualizaciones son todavía desactivadas',
  'fullAuth.notification_settings.email_updates_are_unavailable':
    'correo electrónico actualizaciones son no disponible',
  'fullAuth.notification_settings.if_it_does_not_save_menta_will_put_your_previous':
    'si lo hace no guardar, Menta podrá poner tu anterior opción atrás.',
  'fullAuth.notification_settings.it_should_arrive_shortly_tap_it_to_return_to_not':
    'lo debería llegar en breve. toca lo a Vuelve a notificación ajustes.',
  'fullAuth.notification_settings.keep_notifications_off':
    'conservar notificaciones desactivadas',
  'fullAuth.notification_settings.loading_notification_settings':
    'cargando notificación ajustes',
  'fullAuth.notification_settings.loading_your_notification_settings':
    'cargando tu notificación ajustes.',
  'fullAuth.notification_settings.menta_can_resume_notifications_after_this_time':
    'Menta puede reanudar notificaciones después este tiempo.',
  'fullAuth.notification_settings.menta_could_not_connect_this_email_safely_so_you':
    'Menta No se ha podido conectar este correo electrónico de forma segura, comoí que tu consentimiento fue no restantes activadas.',
  'fullAuth.notification_settings.menta_could_not_finish_notification_registration':
    'Menta No se ha podido terminar notificación registro. Vuelve a intentarlo en una momento.',
  'fullAuth.notification_settings.menta_does_not_send_notifications_during_these_h':
    'Menta hace no enviar notificaciones durante estos horas. ellos puede llegar después.',
  'fullAuth.notification_settings.menta_does_not_send_notifications_during_this_lo':
    'Menta hace no enviar notificaciones durante este hora local ventana.',
  'fullAuth.notification_settings.menta_is_checking_this_phone_and_your_active_pro':
    'Menta es comprobando este teléfono y tu activa promesas.',
  'fullAuth.notification_settings.menta_is_checking_this_phone_before_it_queues_th':
    'Menta es comprobando este teléfono antes lo colas el prueba.',
  'fullAuth.notification_settings.menta_is_finishing_notification_setup_for_this_p':
    'Menta es terminando notificación Ajustes para este teléfono.',
  'fullAuth.notification_settings.menta_may_remind_you_while_proof_is_due_or_a_pro':
    'Menta puede recordar tú mientras prueba es pendiente o una promesa es final, y podrá espera durante silencio horas.',
  'fullAuth.notification_settings.menta_may_send_occasional_product_news_to_your_a':
    'Menta puede enviar ocasionales novedades del producto a Tu cuenta correo electrónico. tú puede activar este desactivadas aquí a cualquier tiempo.',
  'fullAuth.notification_settings.menta_needs_a_confirmed_account_email_before_thi':
    'Menta necesita una confirmado cuenta correo electrónico antes este opción puede cambiar.',
  'fullAuth.notification_settings.menta_product_news':
    'Menta novedades del producto',
  'fullAuth.notification_settings.menta_removed_this_email_from_product_update_del':
    'Menta Eliminard este correo electrónico de product-actualización entrega.',
  'fullAuth.notification_settings.menta_will_not_send_proof_or_promise_ending_remi':
    'Menta podrá no enviar prueba o promesa-final recordatorios a menos que tú activar los en de nuevo.',
  'fullAuth.notification_settings.menta_will_use_this_choice_for_future_notificati':
    'Menta podrá usar este opción para futuro notificaciones.',
  'fullAuth.notification_settings.new_proof_to_review_review_outcomes_check_ins_an':
    'nuevo prueba a revisión, revisión resultados, comprobar-ins y grupo cambios.',
  'fullAuth.notification_settings.no_notification_was_queued':
    'no notificación fue en cola.',
  'fullAuth.notification_settings.nothing_was_sent_try_again_in_a_moment':
    'nada fue enviado. Vuelve a intentarlo en una momento.',
  'fullAuth.notification_settings.notification_setup_did_not_finish':
    'notificación Ajustes se no terminar',
  'fullAuth.notification_settings.notifications': 'notificaciones',
  'fullAuth.notification_settings.promise_context_title':
    'Recordatorios de promesas',
  'fullAuth.notification_settings.promise_context_body':
    'Esta hora de recordatorio se aplica a todas las promesas activas. Los horarios siguen {timeZone}.',
  'fullAuth.notification_settings.back_to_promise': 'Volver a la promesa',
  'fullAuth.notification_settings.notifications_are_off':
    'notificaciones son desactivadas',
  'fullAuth.notification_settings.notifications_are_still_off':
    'notificaciones son todavía desactivadas',
  'fullAuth.notification_settings.notifications_off':
    'notificaciones desactivadas',
  'fullAuth.notification_settings.old_reminders_may_still_be_on_this_phone':
    'antiguo recordatorios puede todavía estar en este teléfono',
  'fullAuth.notification_settings.open_phone_settings':
    'abrir teléfono ajustes',
  'fullAuth.notification_settings.open_your_phone_settings_choose_menta_then_notif':
    'Abre tus teléfono ajustes, elegir Menta, después notificaciones a permitir recordatorios.',
  'fullAuth.notification_settings.open_your_phone_settings_choose_menta_then_notif_2':
    'Abre tus teléfono ajustes, elegir Menta, después notificaciones, y permitir notificaciones.',
  'fullAuth.notification_settings.opening_phone_settings':
    'abriendo teléfono ajustes',
  'fullAuth.notification_settings.optional_menta_product_news_this_is_separate_fro':
    'opcional Menta novedades del producto. este es separada de cuenta y prueba notificaciones.',
  'fullAuth.notification_settings.people_and_progress': 'personas y progreso',
  'fullAuth.notification_settings.phone_controls': 'teléfono controles',
  'fullAuth.notification_settings.phone_notification_check_failed':
    'teléfono notificación comprobar fallido',
  'fullAuth.notification_settings.phone_notification_settings':
    'teléfono notificación ajustes',
  'fullAuth.notification_settings.preferred_time_formattedremindertime_a_proof_dea':
    'preferido tiempo: {formattedReminderTime}. una prueba fecha límite o silencio horas puede cambiar el actual tiempo.',
  'fullAuth.notification_settings.preferred_time_formattedremindertime_notificatio':
    'preferido tiempo: {formattedReminderTime}. notificaciones son desactivadas en este teléfono.',
  'fullAuth.notification_settings.preparing_a_test_notification':
    'preparando una prueba notificación',
  'fullAuth.notification_settings.preparing_proof_reminders':
    'preparando prueba recordatorios',
  'fullAuth.notification_settings.promise_reminders': 'promesa recordatorios',
  'fullAuth.notification_settings.proof_reminders': 'prueba recordatorios',
  'fullAuth.notification_settings.proof_reminders_are_off':
    'prueba recordatorios son desactivadas',
  'fullAuth.notification_settings.proof_reminders_are_ready':
    'prueba recordatorios son listo',
  'fullAuth.notification_settings.proof_reminders_are_ready_on_this_phone':
    'prueba recordatorios son listo en este teléfono',
  'fullAuth.notification_settings.proof_reminders_saved':
    'prueba recordatorios guardado',
  'fullAuth.notification_settings.quiet_hours': 'silencio horas',
  'fullAuth.notification_settings.quiet_hours_and_delivery':
    'silencio horas y entrega',
  'fullAuth.notification_settings.quiet_hours_end': 'silencio horas terminar',
  'fullAuth.notification_settings.quiet_hours_formattedquiethours':
    'silencio horas {formattedQuietHours}',
  'fullAuth.notification_settings.quiet_hours_not_saved':
    'silencio horas no guardado',
  'fullAuth.notification_settings.quiet_hours_saved': 'silencio horas guardado',
  'fullAuth.notification_settings.quiet_hours_start': 'silencio horas empezar',
  'fullAuth.notification_settings.reload_your_saved_notification_choices':
    'recargar tu guardado notificación opciones',
  'fullAuth.notification_settings.reminder_setup_did_not_finish':
    'recordatorio Ajustes se no terminar',
  'fullAuth.notification_settings.reminder_time': 'recordatorio tiempo',
  'fullAuth.notification_settings.reminder_time_did_not_update_on_this_phone':
    'recordatorio tiempo se no actualización en este teléfono',
  'fullAuth.notification_settings.reviews_and_group_activity':
    'Revisiones y grupo actividad',
  'fullAuth.notification_settings.save_quiet_hours': 'guardar silencio horas',
  'fullAuth.notification_settings.saving_quiet_hours':
    'guardando silencio horas',
  'fullAuth.notification_settings.saving_your_choice': 'guardando tu opción',
  'fullAuth.notification_settings.saving_your_choice_2': 'guardando tu opción…',
  'fullAuth.notification_settings.saving_your_email_choice':
    'guardando Tu correo electrónico opción…',
  'fullAuth.notification_settings.send_one_real_notification_to_this_signed_in_pho':
    'enviar una real notificación a este iniciada-in teléfono.',
  'fullAuth.notification_settings.send_test_notification':
    'enviar prueba notificación',
  'fullAuth.notification_settings.set_quiet_hours_email_and_phone_notification_opt':
    'establecer silencio horas, correo electrónico y teléfono notificación opciones.',
  'fullAuth.notification_settings.sign_in_again': 'Iniciar sesión de nuevo',
  'fullAuth.notification_settings.sign_in_again_to_send_a_test':
    'Iniciar sesión de nuevo a enviar una prueba',
  'fullAuth.notification_settings.sounds_previews_focus_and_scheduled_delivery':
    'suena, pRevisiones, concentración y Horariod entrega.',
  'fullAuth.notification_settings.sounds_previews_focus_and_scheduled_delivery_are':
    'suena, pRevisiones, concentración y Horariod entrega son propiedad por tu teléfono.',
  'fullAuth.notification_settings.streaks_and_momenta': 'rachas y Momenta',
  'fullAuth.notification_settings.test_notification_queued':
    'prueba notificación en cola',
  'fullAuth.notification_settings.test_notification_was_not_queued':
    'prueba notificación fue no en cola',
  'fullAuth.notification_settings.test_notifications': 'prueba notificaciones',
  'fullAuth.notification_settings.the_range_can_cross_midnight':
    'el intervalo puede cross medianoche.',
  'fullAuth.notification_settings.there_are_no_active_promises_to_schedule_yet_men':
    'ahí son no activa promesas a Horario aún. Menta podrá usar este opción cuando tú empezar una.',
  'fullAuth.notification_settings.this_phone_is_not_ready_yet':
    'este teléfono es no listo aún',
  'fullAuth.notification_settings.this_phone_is_ready_for_menta_notifications':
    'este teléfono es listo para Menta notificaciones',
  'fullAuth.notification_settings.this_phone_may_show_a_reminder_at_your_preferred':
    'este teléfono puede mostrar una recordatorio a tu preferido tiempo para activa promesas.',
  'fullAuth.notification_settings.this_phone_must_allow_menta_notifications_before':
    'este teléfono debe permitir Menta notificaciones antes una prueba puede estar enviado.',
  'fullAuth.notification_settings.this_phone_will_not_show_menta_notifications_unt':
    'este teléfono podrá no mostrar Menta notificaciones hasta tú activar los en.',
  'fullAuth.notification_settings.to_turn_them_on': 'a activar los en',
  'fullAuth.notification_settings.try_again': 'Vuelve a intentarlo',
  'fullAuth.notification_settings.try_again_before_relying_on_notifications_from_t':
    'Vuelve a intentarlo antes depender en notificaciones de este teléfono.',
  'fullAuth.notification_settings.try_again_before_turning_on_reminders_for_this_p':
    'Vuelve a intentarlo antes activando en recordatorios para este teléfono.',
  'fullAuth.notification_settings.turning_off_email_updates':
    'activando desactivadas correo electrónico actualizaciones',
  'fullAuth.notification_settings.turning_on_email_updates':
    'activando en correo electrónico actualizaciones',
  'fullAuth.notification_settings.wait_one_minute_before_requesting_another_test':
    'espera una minuto antes solicitando otro prueba.',
  'fullAuth.notification_settings.your_choice_is_saved_but_an_old_reminder_may_sti':
    'tu opción es guardado, pero un antiguo recordatorio puede todavía aparecer. Vuelve a intentarlo.',
  'fullAuth.notification_settings.your_choice_is_saved_but_proof_reminders_are_not':
    'tu opción es guardado, pero prueba recordatorios son no listo aún. Vuelve a intentarlo.',
  'fullAuth.notification_settings.your_choice_is_saved_but_proof_reminders_are_not_2':
    'tu opción es guardado, pero prueba recordatorios son no listo en este teléfono. Vuelve a intentarlo.',
  'fullAuth.notification_settings.your_choices_are_saved_but_this_phone_cannot_sho':
    'tu opciones son guardado, pero este teléfono no puede mostrar Menta notificaciones hasta tú permitir los.',
  'fullAuth.notification_settings.your_current_choice_remains_authoritative_until_':
    'tu actual opción permanece autorizada hasta este guarda.',
  'fullAuth.notification_settings.your_current_quiet_hours_stay_in_place_until_thi':
    'tu actual silencio horas mantenerse en sitio hasta este guarda.',
  'fullAuth.notification_settings.your_menta_opt_out_is_saved_provider_removal_wil':
    'tu Menta opt-fuera es guardado. proveedor eliminación podrá reintentar cuando este cuenta siguiente se conecta.',
  'fullAuth.notification_settings.your_phone_did_not_return_a_notification_setting':
    'tu teléfono se no volver una notificación ajuste. no permiso cambiado.',
  'fullAuth.notification_settings.your_phone_now_allows_notifications':
    'tu teléfono ahora permite notificaciones',
  'fullAuth.notification_settings.your_preferred_time_is_saved_but_this_phone_may_':
    'tu preferido tiempo es guardado, pero este teléfono puede todavía usar el antiguo tiempo. Vuelve a intentarlo.',
  'fullAuth.notification_settings.your_previous_email_choice_is_still_active':
    'tu anterior correo electrónico opción es todavía activa.',
  'fullAuth.notification_settings.your_previous_notification_choice_is_still_activ':
    'tu anterior notificación opción es todavía activa.',
  'fullAuth.notification_settings.your_previous_quiet_hours_remain_active':
    'tu anterior silencio horas permanecer activa.',
  'fullAuth.notification_settings.your_promises_still_work_menta_will_not_ask_agai':
    'Tu promesas todavía funciona. Menta podrá no pedir de nuevo aquí.',
  'fullAuth.notification_settings.your_promises_still_work_this_phone_will_not_sho':
    'Tu promesas todavía funciona. este teléfono podrá no mostrar prueba, revisión o grupo notificaciones.',
  'fullAuth.notification_settings.your_proof_reminder_choice_is_unchanged_your_pho':
    'tu prueba recordatorio opción es sin cambios. tu teléfono podrá pedir siguiente.',
  'fullAuth.onboarding.32_character_code': '32-carácter código',
  'fullAuth.onboarding.accountability': 'Responsabilidad compartida',
  'fullAuth.onboarding.activation_needs_attention':
    'La activación requiere atención',
  'fullAuth.onboarding.add_code_and_create': 'añadir código y crear',
  'fullAuth.onboarding.add_it_now_or_create_your_promise_without_one_gr':
    'añadir lo ahora, o crear Tu promesa sin una. grupo Invitars funciona por separado.',
  'fullAuth.onboarding.add_referral_code': 'añadir referencia código',
  'fullAuth.onboarding.after_it_s_created_menta_adds':
    'después Es creado, Menta añade',
  'fullAuth.onboarding.agree_and_choose_sign_in':
    'aceptar y elegir inicio de sesión',
  'fullAuth.onboarding.agree_and_continue': 'aceptar y continuar',
  'fullAuth.onboarding.back': 'atrás',
  'fullAuth.onboarding.back_to_backlabel': 'Volver a {backLabel}',
  'fullAuth.onboarding.choose_a_length_you_can_genuinely_follow_through':
    'elegir una Duración tú puede de verdad seguir hasta el final en.',
  'fullAuth.onboarding.choose_how_you_want_to_continue_your_draft_stays':
    'Elige cómo tú querer a continuar. tu borrador sigue en este teléfono.',
  'fullAuth.onboarding.choose_length': 'elegir Duración',
  'fullAuth.onboarding.choose_proof': 'elegir prueba',
  'fullAuth.onboarding.choose_the_proof_you_will_add_and_who_you_want_b':
    'elegir el prueba tú podrá añadir y quién tú querer junto a tú.',
  'fullAuth.onboarding.choose_what_you_ll_add_when_it_s_done_you_can_in':
    'elegir qué Vas a añadir cuando Es hecho. tú puede Invitar personas a revisión lo después tú guardar.',
  'fullAuth.onboarding.complete_this_promise_and_add_a_proofname_as_pro':
    'completar este promesa y añadir una {proofName} como prueba.',
  'fullAuth.onboarding.confirm_the_required_documents':
    'confirmar el obligatorio documentos.',
  'fullAuth.onboarding.confirming_code': 'confirmando código…',
  'fullAuth.onboarding.continue_to_referral': 'continuar a referencia',
  'fullAuth.onboarding.continue_to_save': 'continuar a guardar',
  'fullAuth.onboarding.continue_with_apple': 'continuar con Apple',
  'fullAuth.onboarding.continue_with_email': 'continuar con correo electrónico',
  'fullAuth.onboarding.continue_with_google': 'continuar con Google',
  'fullAuth.onboarding.could_not_finish_setup':
    'No se ha podido terminar Ajustes',
  'fullAuth.onboarding.create_a_group': 'crear una grupo',
  'fullAuth.onboarding.review_promise_invite': 'revisión promesa Invitar',
  'fullAuth.onboarding.promise_invite_held':
    'Tu promesa Invitar es todavía reservada. revisión lo siguiente; unirse permanece una separada acción.',
  'fullAuth.onboarding.review_group_invite': 'revisión grupo Invitar',
  'fullAuth.onboarding.group_invite_held':
    'tu grupo Invitar es todavía reservada. revisión lo siguiente; unirse permanece una separada acción.',
  'fullAuth.onboarding.open_event': 'abrir evento',
  'fullAuth.onboarding.event_held':
    'tu evento es todavía reservada. abrir lo siguiente; este promesa recibo hace no afirmar participación.',
  'fullAuth.onboarding.create_my_group': 'Invitar a alguien',
  'fullAuth.onboarding.create_my_group_detail':
    'Tu promesa está guardada y sigue siendo privada. Elige cómo puede ayudarte otra persona y decide a quién invitar.',
  'fullAuth.onboarding.create_it_first_menta_will_then_add':
    'crear lo primera. Menta podrá después añadir',
  'fullAuth.onboarding.create_without_a_code': 'crear sin una código',
  'fullAuth.onboarding.creating_your_first_promise':
    'creando tu primera promesa',
  'fullAuth.onboarding.creating_your_first_promise_2':
    'creando tu primera promesa…',
  'fullAuth.onboarding.days': 'dícomo',
  'fullAuth.onboarding.decide_what_finished_will_look_like':
    'decidir qué terminado podrá aspecto como.',
  'fullAuth.onboarding.do_you_have_a_referral_code':
    'hacer tú tiene una referencia código?',
  'fullAuth.onboarding.edit': 'editar',
  'fullAuth.onboarding.every_day': 'cada día',
  'fullAuth.onboarding.every_day_2': '· cada día ·',
  'fullAuth.promise.frequency.once_a_week': 'una vez una semana',
  'fullAuth.onboarding.first_promise': 'primera promesa',
  'fullAuth.onboarding.first_promise_firstpromisecost_momenta_after_cre':
    'primera promesa, {firstPromiseCost} Momenta. después creación, {welcomeBonus} Momenta de bienvenida para más adelante opciones.',
  'fullAuth.onboarding.free': 'Gratis.',
  'fullAuth.onboarding.how_long_do_you_want_to_keep_this_promise':
    'cómo tiempo hacer tú querer a conservar este promesa?',
  'fullAuth.onboarding.how_will_you_prove_it': 'cómo podrá tú demostrar lo?',
  'fullAuth.onboarding.i_agree_to_menta_s_terms_of_use_and_community_st':
    'I aceptar a de Menta términos de usar y comunidad normas, y reconocer el privacidad política.',
  'fullAuth.onboarding.invite': 'Invitar',
  'fullAuth.onboarding.invite_people_after_this_promise_is_saved_member':
    'Invitar personas después este promesa es guardado. miembros puede revisión tu prueba.',
  'fullAuth.onboarding.just_me': 'solo mí',
  'fullAuth.onboarding.keep_it_specific_enough_that_you_will_know_when_':
    'conservar lo específico suficiente esa tú podrá saber cuando lo es terminado.',
  'fullAuth.onboarding.legal_confirmation_did_not_finish':
    'legal Confirmación se no terminar.',
  'fullAuth.onboarding.legal_review_was_not_completed':
    'legal revisión fue no completado.',
  'fullAuth.onboarding.length': 'Duración',
  'fullAuth.onboarding.local_draft': 'Borrador local',
  'fullAuth.onboarding.menta': 'Menta',
  'fullAuth.onboarding.menta_confirms_the_first_deadline_when_you_save':
    'Menta confirma el primera fecha límite cuando tú guardar.',
  'fullAuth.onboarding.menta_confirms_your_first_deadline_when_the_prom':
    'Menta confirma tu primera fecha límite cuando el promesa es creado.',
  'fullAuth.onboarding.menta_is_confirming_your_promise_and_momenta_bal':
    'Menta es confirmando Tu promesa y Momenta saldo.',
  'fullAuth.onboarding.menta_mascot_offering_you_a_bag_of_momenta_token':
    'mascota de Menta ofreciendo tú una bolsa de Momenta fichas',
  'fullAuth.onboarding.menta_mascot_waving_you_toward_saving_this_promi':
    'mascota de Menta saludando tú para guardando este promesa',
  'fullAuth.onboarding.menta_saved_the_promise_and_confirmed_your_accou':
    'Menta guardado el promesa y confirmado Tu cuenta de el mismo servidor recibo.',
  'fullAuth.onboarding.message_your_draft_is_still_here':
    '{message} tu borrador es todavía aquí.',
  'fullAuth.onboarding.momenta': 'Momenta',
  'fullAuth.onboarding.momenta_for_extra_promises_groups_freezes_and_it':
    'Momenta para adicional promesas, Grupos, Gratiszes y artículos.',
  'fullAuth.onboarding.momenta_for_later_choices':
    'Momenta para más adelante opciones.',
  'fullAuth.onboarding.my_promise': 'mi promesa',
  'fullAuth.onboarding.next_due': 'siguiente pendiente',
  'fullAuth.onboarding.note': 'nota',
  'fullAuth.onboarding.opening_email': 'abriendo correo electrónico…',
  'fullAuth.onboarding.photo': 'foto',
  'fullAuth.onboarding.preview_my_promise': 'vista previa mi promesa',
  'fullAuth.onboarding.promise_length': 'promesa Duración',
  'fullAuth.onboarding.promise_saved_and_confirmed':
    'promesa guardado y confirmado',
  'fullAuth.onboarding.proof': 'prueba',
  'fullAuth.onboarding.proof_and_support': 'prueba y asistencia',
  'fullAuth.onboarding.proof_cadence': 'prueba frecuencia',
  'fullAuth.onboarding.providername_sign_in_did_not_finish':
    '{providerName} inicio de sesión se no terminar.',
  'fullAuth.onboarding.read_the_current_account_and_community_documents':
    'leer el actual cuenta y comunidad documentos antes tú crear Tu promesa.',
  'fullAuth.onboarding.record_a_short_clip': 'grabar una corto vídeo.',
  'fullAuth.onboarding.referral_code': 'referencia código',
  'fullAuth.onboarding.reopen_onboarding_before_continuing_with_email':
    'volver a abrir primeros pasos antes continuando con correo electrónico.',
  'fullAuth.onboarding.restored_from_this_phone': 'restaurado de este teléfono',
  'fullAuth.onboarding.return_to_draft': 'Vuelve a borrador',
  'fullAuth.onboarding.review_menta_s_terms': 'revisión de Menta términos',
  'fullAuth.onboarding.review_your_promise': 'revisión Tu promesa',
  'fullAuth.onboarding.save_this_promise_to_menta':
    'guardar este promesa a Menta.',
  'fullAuth.onboarding.save_your_promise': 'guardar Tu promesa',
  'fullAuth.onboarding.schedule': 'Horario',
  'fullAuth.onboarding.schedule_every_day': 'Horario, cada día',
  'fullAuth.onboarding.show_another_example': 'mostrar otro ejemplo',
  'fullAuth.onboarding.sign_in_to_save_my_promise':
    'Inicia sesión en guardar mi promesa',
  'fullAuth.onboarding.start_privately_you_can_invite_people_later':
    'empezar de forma privada. tú puede Invitar personas más adelante.',
  'fullAuth.onboarding.start_with_one_thing_that_matters_today':
    'empezar con una cosa esa importa hoy.',
  'fullAuth.onboarding.stay_here_and_try_again_so_menta_can_keep_this_p':
    'mantenerse aquí y Vuelve a intentarlo comoí que Menta puede conservar este promesa en este teléfono.',
  'fullAuth.onboarding.stay_here_and_try_email_sign_in_again_so_menta_c':
    'mantenerse aquí y intenta correo electrónico inicio de sesión de nuevo comoí que Menta puede conservar este promesa en este teléfono.',
  'fullAuth.onboarding.take_one_photo': 'hacer una foto.',
  'fullAuth.onboarding.this_choice_sets_your_next_step_it_does_not_add_':
    'este opción establece tu siguiente paso. lo hace no añadir nadie o crear una grupo aún.',
  'fullAuth.onboarding.use_duration_days': 'usar {duration} dícomo',
  'fullAuth.onboarding.video': 'vídeo',
  'fullAuth.onboarding.welcome_momenta': 'Momenta de bienvenida',
  'fullAuth.onboarding.what_s_one_thing_you_want_to_do':
    "qué's una cosa tú querer a hacer?",
  'fullAuth.onboarding.who_will_hold_you_accountable':
    'quién podrá mantener pulsado tú responsable?',
  'fullAuth.onboarding.write_what_happened': 'Escribe lo que ha ocurrido.',
  'fullAuth.onboarding.you_can_review_these_choices_before_menta_saves_':
    'tú puede revisión estos opciones antes Menta guarda nada.',
  'fullAuth.onboarding.your_account_changed': 'Tu cuenta cambiado.',
  'fullAuth.onboarding.your_draft_could_not_be_saved_yet':
    'tu borrador No se ha podido estar guardado aún.',
  'fullAuth.onboarding.your_draft_is_private_on_this_phone_sign_in_to_k':
    'tu borrador es privada en este teléfono. Inicia sesión en conservar lo.',
  'fullAuth.onboarding.your_draft_is_still_private_on_this_phone':
    'tu borrador es todavía privada en este teléfono.',
  'fullAuth.onboarding.your_first_promise': 'tu primera promesa',
  'fullAuth.onboarding.for_promise': 'Para «{promise}»',
  'fullAuth.onboarding.check_ins': '{count} registros',
  'fullAuth.onboarding.your_first_promise_2': 'tu primera promesa',
  'fullAuth.onboarding.your_first_promise_is': 'tu primera promesa es',
  'fullAuth.onboarding.your_promise': 'Tu promesa',
  'fullAuth.onboarding.your_promise_2': 'Tu promesa',
  'fullAuth.onboarding.your_promise_is_ready': 'Tu promesa es listo.',
  'fullAuth.onboarding.your_promise_is_safe_confirm_the_documents_below':
    'Tu promesa es seguro. confirmar el documentos abajo antes tú crear lo.',
  'fullAuth.onboarding.your_promise_is_safe_try_again_before_continuing':
    'Tu promesa es seguro. Vuelve a intentarlo antes de continuar.',
  'fullAuth.onboarding.your_promise_is_still_safe_review_the_current_do':
    'Tu promesa es todavía seguro. revisión el actual documentos cuando tú son listo a continuar.',
  'fullAuth.password_recovery.change_my_password': 'cambiar mi contraseña',
  'fullAuth.password_recovery.choose_a_new_password':
    'elegir una nuevo contraseña',
  'fullAuth.password_recovery.close': 'cerrar',
  'fullAuth.password_recovery.close_password_reset':
    'cerrar contraseña restablecer',
  'fullAuth.password_recovery.confirm_password': 'confirmar contraseña',
  'fullAuth.password_recovery.couldn_t_change_your_password':
    'No se ha podido cambiar Tu contraseña',
  'fullAuth.password_recovery.enter_new_password':
    'introducir nuevo contraseña',
  'fullAuth.password_recovery.menta': 'Menta',
  'fullAuth.password_recovery.new_password': 'nuevo contraseña',
  'fullAuth.password_recovery.or_more_characters_both_entries_must_match':
    'o más caracteres. ambos entradas debe coincidir.',
  'fullAuth.password_recovery.other_signed_in_devices_may_ask_for_the_new_pass':
    'otra iniciada-in dispositivos puede pedir para el nuevo contraseña.',
  'fullAuth.password_recovery.password_changed': 'contraseña cambiado',
  'fullAuth.password_recovery.re_enter_new_password':
    'Re-enter nuevo contraseña',
  'fullAuth.password_recovery.request_a_new_link': 'solicitar una nuevo enlace',
  'fullAuth.password_recovery.request_a_new_link_your_draft_is_still_on_this_p':
    'solicitar una nuevo enlace. tu borrador es todavía en este teléfono.',
  'fullAuth.password_recovery.return_to': 'Vuelve a',
  'fullAuth.password_recovery.sign_in': 'Iniciar sesión',
  'fullAuth.password_recovery.sign_in_instead': 'Iniciar sesión en tu lugar',
  'fullAuth.password_recovery.this_reset_link_has_expired':
    'este restablecer enlace ha caducado.',
  'fullAuth.password_recovery.use': 'usar',
  'fullAuth.password_recovery.your_password_has_been_changed':
    'Tu contraseña ha sido cambiado.',
  'fullAuth.report_issue.1_open_2_tap_3_notice': '1. abrir… 2. toca… 3. aviso…',
  'fullAuth.report_issue.add_a_screenshot': 'añadir una captura de pantalla',
  'fullAuth.report_issue.add_more_detail': 'añadir más detalle',
  'fullAuth.report_issue.add_the_basics': 'añadir el conceptos básicos',
  'fullAuth.report_issue.attach_a_jpeg_png_or_webp_screenshot':
    'adjuntar una JPEG, PNG, o WebP captura de pantalla.',
  'fullAuth.report_issue.back_to_support': 'Volver a asistencia',
  'fullAuth.report_issue.choose_a_screenshot_smaller_than_8_mb':
    'elegir una captura de pantalla más pequeño que 8 MB.',
  'fullAuth.report_issue.choose_an_image': 'elegir un imagen',
  'fullAuth.report_issue.choose_another_report': 'elegir otro informe',
  'fullAuth.report_issue.choose_screenshot': 'elegir captura de pantalla',
  'fullAuth.report_issue.could_not_find_this_saved_report':
    'No se ha podido buscar este guardado informe',
  'fullAuth.report_issue.crash_reference': 'Referencia del fallo',
  'fullAuth.report_issue.expected_result_optional':
    'esperado resultado, opcional',
  'fullAuth.report_issue.expected_result_optional_2':
    'esperado resultado (opcional)',
  'fullAuth.report_issue.feedback_received': 'comentarios recibido',
  'fullAuth.report_issue.feedback_required': 'comentarios, obligatorio',
  'fullAuth.report_issue.give_the_report_a_short_title_and_explain_what_h':
    'dar el informe una corto título y explicar Qué ha ocurrido.',
  'fullAuth.report_issue.inappropriate': 'Inapropiado',
  'fullAuth.report_issue.it_is_not_saved_under_this_account_nothing_was_c':
    'lo es no guardado en este cuenta. nada fue cambiado.',
  'fullAuth.report_issue.keep_this_screen_open_while_you_write_or_copy_th':
    'conservar este pantalla abrir mientras tú escribir, o copia el texto antes saliendo.',
  'fullAuth.report_issue.last_step': 'Último paso',
  'fullAuth.report_issue.menta_could_not_open_your_photo_library_try_agai':
    'Menta No se ha podido Abre tus foto biblioteca. Vuelve a intentarlo.',
  'fullAuth.report_issue.menta_could_not_preserve_this_report_locally_kee':
    'Menta No se ha podido conservar este informe locally. conservar este pantalla abrir; nada fue entregado a asistencia.',
  'fullAuth.report_issue.menta_does_not_add_device_diagnostics_to_this_re':
    'Menta hace no añadir dispositivo diagnósticos a este informe.',
  'fullAuth.report_issue.menta_includes_the_item_or_screen_you_reported':
    'Menta incluye el artículo o pantalla tú informado.',
  'fullAuth.report_issue.not_sent': 'not-enviado',
  'fullAuth.report_issue.open': 'abrir',
  'fullAuth.report_issue.preparing_private_report_draft':
    'preparando privada informe borrador',
  'fullAuth.report_issue.proof_upload_gets_stuck':
    'prueba subir obtiene atascado',
  'fullAuth.report_issue.reference': 'Referencia',
  'fullAuth.report_issue.remove': 'Eliminar',
  'fullAuth.report_issue.replace_screenshot': 'reemplazar captura de pantalla',
  'fullAuth.report_issue.report_an_issue': 'informe un problema',
  'fullAuth.report_issue.report_not_sent': 'informe no enviado',
  'fullAuth.report_issue.report_received': 'informe recibido',
  'fullAuth.report_issue.retry_sending_report': 'reintentar enviando informe',
  'fullAuth.report_issue.return_to_support': 'Vuelve a asistencia',
  'fullAuth.report_issue.review_feedback': 'revisión comentarios',
  'fullAuth.report_issue.review_report': 'revisión informe',
  'fullAuth.report_issue.screenshot_did_not_open':
    'captura de pantalla se no abrir',
  'fullAuth.report_issue.screenshot_is_too_large':
    'captura de pantalla es demasiado grande',
  'fullAuth.report_issue.screenshot_optional': 'captura de pantalla (opcional)',
  'fullAuth.report_issue.selected_support_screenshot':
    'seleccionada asistencia captura de pantalla',
  'fullAuth.report_issue.server_confirmed': 'servidor-confirmado',
  'fullAuth.report_issue.share_feedback': 'compartir comentarios',
  'fullAuth.report_issue.short_title': 'corto título',
  'fullAuth.report_issue.short_title_required': 'corto título, obligatorio',
  'fullAuth.report_issue.sign_in_again_before_sending_this_private_report':
    'Iniciar sesión de nuevo antes enviando este privada informe. nada fue enviado.',
  'fullAuth.report_issue.sign_in_required': 'Iniciar sesión obligatorio',
  'fullAuth.report_issue.status': 'Estado',
  'fullAuth.report_issue.steps_to_reproduce_optional':
    'pasos a reproducir, opcional',
  'fullAuth.report_issue.steps_to_reproduce_optional_2':
    'pasos a reproducir (opcional)',
  'fullAuth.report_issue.support_reference': 'asistencia Referencia ·',
  'fullAuth.report_issue.this_comes_from_where_you_opened':
    '. este llega de donde tú abierto',
  'fullAuth.report_issue.this_report_is_not_being_saved':
    'este informe es no siendo guardado',
  'fullAuth.report_issue.type': 'tipo:',
  'fullAuth.report_issue.we_ll_show_a_support_reference_only_after_the_re':
    'Te enviaremos mostrar una asistencia Referencia solo después el informe llega. si el primera intento es poco claro, Vuelve a intentarlo usa el mismo informe comoí que lo podrá no crear una duplicado.',
  'fullAuth.report_issue.what_did_you_expect_menta_to_do':
    'qué se tú esperar Menta a hacer?',
  'fullAuth.report_issue.what_happened': 'Qué ha ocurrido',
  'fullAuth.report_issue.what_happened_required':
    'Qué ha ocurrido, obligatorio',
  'fullAuth.report_issue.what_i_would_change': 'qué I podría cambiar',
  'fullAuth.report_issue.what_were_you_doing_and_what_did_menta_show':
    'qué fueron tú haciendo, y qué se Menta mostrar?',
  'fullAuth.report_issue.what_would_you_like_the_menta_team_to_know':
    'qué podría tú como el Menta equipo a saber?',
  'fullAuth.report_issue.will_help_support_find_the_error':
    'podrá ayuda asistencia buscar el error.',
  'fullAuth.report_issue.your_draft_stays_on_this_phone_until_you_send_it':
    'tu borrador sigue en este teléfono hasta tú enviar lo.',
  'fullAuth.report_issue.your_feedback': 'tu comentarios',
  'fullAuth.report_issue.your_screenshot_will_be_sent_with_the_report_onl':
    'tu captura de pantalla podrá estar enviado con el informe. solo autorizado asistencia personal puede abrir lo.',
  'fullAuth.settings.a_compatible_update_is_downloaded_and_ready':
    'una compatible actualización es descargado y listo.',
  'fullAuth.settings.account_control': 'cuenta control',
  'fullAuth.settings.account_was_not_deleted': 'cuenta fue no eliminado',
  'fullAuth.settings.active_view_or_manage_your_subscription':
    'activa. ver o gestionar tu suscripción.',
  'fullAuth.settings.ad_measurement': 'Medición de anuncios',
  'fullAuth.settings.ad_privacy_choices': 'anuncio privacidad opciones',
  'fullAuth.settings.ad_privacy_choices_did_not_open':
    'anuncio privacidad opciones se no abrir',
  'fullAuth.settings.advanced_diagnostics': 'Diagnóstico avanzado',
  'fullAuth.settings.advanced_diagnostics_are_off':
    'Diagnóstico avanzado son desactivadas',
  'fullAuth.settings.advanced_diagnostics_are_on':
    'Diagnóstico avanzado son en',
  'fullAuth.settings.advanced_diagnostics_are_still_off_check_your_co':
    'Diagnóstico avanzado son todavía desactivadas. Comprueba tu conexión y Vuelve a intentarlo.',
  'fullAuth.settings.ask_for_help_share_feedback_or_check_a_saved_rep':
    'pedir para ayuda, compartir comentarios o comprobar una guardado informe.',
  'fullAuth.settings.back_to_you': 'Volver a tú',
  'fullAuth.settings.before_you_delete_your_account':
    'antes tú eliminar Tu cuenta',
  'fullAuth.settings.check_for_updates': 'comprobar para actualizaciones',
  'fullAuth.settings.check_your_connection_and_try_again':
    'Comprueba tu conexión y Vuelve a intentarlo.',
  'fullAuth.settings.checking_for_updates': 'comprobando para actualizaciones',
  'fullAuth.settings.checking_your_account': 'comprobando Tu cuenta',
  'fullAuth.settings.checks_the_current_connection_and_known_account_':
    'comprobaciones el actual conexión y conocido cuenta detalles de nuevo.',
  'fullAuth.settings.close_and_reopen_menta_to_apply_the_downloaded_u':
    'cerrar y volver a abrir Menta a aplicar el descargado actualización.',
  'fullAuth.settings.community_standards': 'comunidad normas',
  'fullAuth.settings.confirmation': 'Confirmación',
  'fullAuth.settings.connect_before_deleting_your_account':
    'conectar antes eliminando Tu cuenta',
  'fullAuth.settings.connect_to_check_this_phone':
    'conectar a comprobar este teléfono.',
  'fullAuth.settings.contact_support': 'contactar asistencia',
  'fullAuth.settings.continue_to_sign_in': 'continuar a Iniciar sesión',
  'fullAuth.settings.could_not_check_your_account':
    'No se ha podido comprobar Tu cuenta',
  'fullAuth.settings.could_not_load_your_profile':
    'No se ha podido cargar Tu perfil.',
  'fullAuth.settings.deletion_checking_body':
    'Menta está comprobando la propiedad de los grupos y Menta Pro. No se ha eliminado nada.',
  'fullAuth.settings.deletion_check_unknown_body':
    'Menta no pudo confirmar la propiedad de los grupos y Menta Pro. No se ha eliminado nada.',
  'fullAuth.settings.deletion_check_offline_body':
    'Conéctate y vuelve a intentarlo. No se ha eliminado nada.',
  'fullAuth.settings.delete_shared_groups_first':
    'Elimina primero los grupos compartidos',
  'fullAuth.settings.delete_shared_groups_first_body':
    'Menta todavía no puede transferir la propiedad. Abre cada grupo de abajo y elimínalo antes de eliminar tu cuenta.',
  'fullAuth.settings.delete_owned_group_member_one':
    '{count} miembro más. Elimina este grupo antes de eliminar tu cuenta.',
  'fullAuth.settings.delete_owned_group_members_many':
    '{count} miembros más. Elimina este grupo antes de eliminar tu cuenta.',
  'fullAuth.settings.deletion_group_clear':
    'Ningún grupo de tu propiedad requiere atención.',
  'fullAuth.settings.deletion_group_will_be_deleted':
    'Se eliminará junto con esta cuenta.',
  'fullAuth.settings.deletion_subscription_active_notice':
    'Eliminar tu cuenta no cancela esta suscripción.',
  'fullAuth.settings.deletion_subscription_inactive':
    'No hay ningún acceso activo a Menta Pro.',
  'fullAuth.settings.menta_pro_subscription': 'Suscripción a Menta Pro',
  'fullAuth.settings.delete_account': 'eliminar cuenta',
  'fullAuth.settings.delete_account_will_be_available_when_this_check':
    'eliminar cuenta podrá estar disponible cuando este comprobar termina.',
  'fullAuth.settings.deletion_result_unknown':
    'Resultado de eliminación desconocido',
  'fullAuth.settings.do_not_send_another_request_yet_check_whether_yo':
    'hacer no enviar otro solicitar aún. comprobar si tú puede todavía Iniciar sesión, o contactar asistencia.',
  'fullAuth.settings.download_the_latest_compatible_menta_update':
    'descargar el más reciente compatible Menta actualización.',
  'fullAuth.settings.extra_performance_measurements_start_now':
    'adicional rendimiento mediciones empezar ahora.',
  'fullAuth.settings.extra_performance_measurements_start_now_masked_':
    'adicional rendimiento mediciones empezar ahora. oculto diagnóstico grabación empieza en que cumple los requisitos pantallas; volver a abrir Menta a aplicar todo Sentry grabación ajustes.',
  'fullAuth.settings.feedback_and_support': 'comentarios y asistencia',
  'fullAuth.settings.for_your_privacy_account_settings_stay_hidden_un':
    'para tu privacidad, cuenta ajustes mantenerse oculto hasta tú Iniciar sesión de nuevo.',
  'fullAuth.settings.help_and_feedback': 'ayuda y comentarios',
  'fullAuth.settings.how_menta_handles_your_data':
    'cómo Menta gestiona tu datos.',
  'fullAuth.settings.keep_current_setting': 'conservar actual ajuste',
  'fullAuth.settings.keep_my_account': 'conservar mi cuenta',
  'fullAuth.settings.label_did_not_open': '{label} se no abrir',
  'fullAuth.settings.leave_a_review': 'dejar una revisión',
  'fullAuth.settings.leave_this_device_your_menta_account_stays_activ':
    'dejar este dispositivo. tu Menta cuenta sigue activa.',
  'fullAuth.settings.loading_account_specific_settings':
    'cargando account-específico ajustes',
  'fullAuth.settings.measure_whether_meta_ads_helped_someone_use_ment':
    'medir si metadatos anuncios ayudado alguien usar Menta.',
  'fullAuth.settings.membership': 'Membresía',
  'fullAuth.settings.menta_cannot_check_whether_you_still_own_a_group':
    'Menta no puede comprobar si tú todavía propio una grupo. revisión tu Grupos antes eliminando el cuenta. eliminando Menta hace no cancelar Menta Pro, comoí que gestionar el suscripción con Apple primera.',
  'fullAuth.settings.menta_could_not_check_for_updates':
    'Menta No se ha podido comprobar para actualizaciones',
  'fullAuth.settings.menta_could_not_delete_the_account_check_your_co':
    'Menta No se ha podido eliminar el cuenta. Comprueba tu conexión, después Vuelve a intentarlo.',
  'fullAuth.settings.menta_could_not_end_this_session_your_account_an':
    'Menta No se ha podido terminar este Sesión. Tu cuenta y local ver son sin cambios.',
  'fullAuth.settings.menta_could_not_restart':
    'Menta No se ha podido reiniciar',
  'fullAuth.settings.menta_is_checking_for_the_latest_compatible_upda':
    'Menta es comprobando para el más reciente compatible actualización.',
  'fullAuth.settings.menta_is_up_to_date': 'Menta es arriba a fecha',
  'fullAuth.settings.menta_pro': 'Menta Pro',
  'fullAuth.settings.menta_update_ready': 'Menta actualización listo',
  'fullAuth.settings.menta_will_continue_using_its_current_safe_versi':
    'Menta podrá continuar usando tus actual seguro versión.',
  'fullAuth.settings.needs_attention': 'Requiere atención',
  'fullAuth.settings.nothing_has_been_deleted': 'nada ha sido eliminado',
  'fullAuth.settings.nothing_was_deleted_reconnect_then_try_again':
    'nada fue eliminado. reconectar, después Vuelve a intentarlo.',
  'fullAuth.settings.notifications': 'notificaciones',
  'fullAuth.settings.offline': 'sin conexión',
  'fullAuth.settings.open_when_connected': 'abrir cuando conectado.',
  'fullAuth.settings.opens_menta_pro_plans_purchase_restore_or_your_a':
    'abre Menta Pro planes, compra restaurar, o tu activa plan.',
  'fullAuth.settings.opens_sign_in_for_this_account':
    'abre inicio de sesión para este cuenta.',
  'fullAuth.settings.optional_performance_measurements':
    'opcional rendimiento mediciones.',
  'fullAuth.settings.optional_performance_measurements_and_masked_dia':
    'opcional rendimiento mediciones y oculto diagnóstico grabación.',
  'fullAuth.settings.ordinary_crash_reports_stay_on':
    'normal fallo informes mantenerse en.',
  'fullAuth.settings.ordinary_crash_reports_stay_on_when_advanced_dia':
    'normal fallo informes mantenerse en cuando Diagnóstico avanzado son desactivadas.',
  'fullAuth.settings.other_settings_are_still_available_try_loading_t':
    'otra ajustes son todavía disponible. intenta cargando el perfil de nuevo cuando el conexión es listo.',
  'fullAuth.settings.permanently_delete_your_account_and_menta_data':
    'permanentemente eliminar Tu cuenta y Menta datos.',
  'fullAuth.settings.plans_benefits_and_restore_purchases':
    'planes, ventajas y Restaurar compras.',
  'fullAuth.settings.preferences': 'Preferencias',
  'fullAuth.settings.press_restart_to_apply_the_downloaded_update':
    'pulsa reiniciar a aplicar el descargado actualización.',
  'fullAuth.settings.privacy_and_legal': 'privacidad y legal',
  'fullAuth.settings.privacy_policy': 'privacidad política',
  'fullAuth.settings.profile_details': 'perfil detalles',
  'fullAuth.settings.proof_reminders_reviews_and_group_updates':
    'prueba recordatorios, Revisiones y grupo actualizaciones.',
  'fullAuth.settings.read_menta_s_terms': 'leer de Menta términos.',
  'fullAuth.settings.reopen_menta_to_stop_diagnostic_recording_ordina':
    'volver a abrir Menta a detener diagnóstico grabación. normal fallo informes mantenerse en.',
  'fullAuth.settings.restarting_menta': 'Reiniciando Menta',
  'fullAuth.settings.review_choices_used_for_sponsor_videos':
    'revisión opciones usado para patrocinador vídeos.',
  'fullAuth.settings.review_deletion_confirmation':
    'revisión Eliminación Confirmación',
  'fullAuth.settings.review_the_current_terms_and_when_you_accepted_t':
    'revisión el actual términos y cuando tú aceptado los.',
  'fullAuth.settings.rules_for_promises_proof_and_groups':
    'normas para promesas, prueba y Grupos.',
  'fullAuth.settings.session': 'Sesión',
  'fullAuth.settings.settings': 'ajustes',
  'fullAuth.settings.share_your_experience_and_help_others_discover_m':
    'compartir tu experiencia y ayuda otros descubrir Menta.',
  'fullAuth.settings.sign_in_again': 'Iniciar sesión de nuevo',
  'fullAuth.settings.sign_in_again_before_deleting_your_account':
    'Iniciar sesión de nuevo antes eliminando Tu cuenta.',
  'fullAuth.settings.sign_in_again_to_see_settings':
    'Iniciar sesión de nuevo a ver ajustes.',
  'fullAuth.settings.sign_in_needed': 'inicio de sesión necesario',
  'fullAuth.settings.sign_out': 'sesión fuera',
  'fullAuth.settings.small_performance_impact':
    'Impacto leve en el rendimiento',
  'fullAuth.settings.some_destinations_need_a_connection':
    'algunos destinos necesita una conexión.',
  'fullAuth.settings.terms_of_use': 'términos de usar',
  'fullAuth.settings.terms_you_accepted': 'términos tú aceptado',
  'fullAuth.settings.the_downloaded_update_will_open_automatically':
    'el descargado actualización podrá abrir automáticamente.',
  'fullAuth.settings.the_next_screen_asks_you_to_type_delete_before_m':
    'el siguiente pantalla pide tú a tipo eliminar antes Menta envía el solicitar.',
  'fullAuth.settings.this_can_use_a_small_amount_of_extra_processing_':
    'este puede usar una leve cantidad de adicional procesando, batería y móvil datos mientras Menta es abrir. grabación empieza solo en que cumple los requisitos pantallas. volver a abrir Menta después activando lo desactivadas a detener Sentry grabación.',
  'fullAuth.settings.this_device_has_the_latest_compatible_update':
    'este dispositivo ha el más reciente compatible actualización.',
  'fullAuth.settings.to_confirm': 'a confirmar',
  'fullAuth.settings.tries_to_load_the_signed_in_profile_again':
    'intenta a cargar el iniciada-in perfil de nuevo.',
  'fullAuth.settings.try_again_in_a_moment_or_open_the_link_from_the_':
    'Vuelve a intentarlo en una momento, o Abre los enlace de el aplicación tienda ficha.',
  'fullAuth.settings.try_again_later_optional_ads_stay_unavailable_un':
    'Vuelve a intentarlo más adelante. opcional anuncios mantenerse no disponible hasta tú revisión estos opciones.',
  'fullAuth.settings.try_connection_again': 'intenta conexión de nuevo',
  'fullAuth.settings.try_loading_profile_again':
    'intenta cargando perfil de nuevo',
  'fullAuth.settings.try_loading_your_name_and_profile_photo_again':
    'intenta cargando tu nombre y perfil foto de nuevo.',
  'fullAuth.settings.try_the_account_check_again_before_you_delete_an':
    'intenta el cuenta comprobar de nuevo antes tú eliminar nada.',
  'fullAuth.settings.turn_off_advanced_diagnostics':
    'activar desactivadas Diagnóstico avanzado',
  'fullAuth.settings.turn_on_advanced_diagnostics':
    'activar en Diagnóstico avanzado',
  'fullAuth.settings.type': 'tipo',
  'fullAuth.settings.type_delete_to_confirm_account_deletion':
    'tipo eliminar a confirmar cuenta Eliminación',
  'fullAuth.settings.update_checks_are_unavailable':
    'actualización comprobaciones son no disponible',
  'fullAuth.settings.while_enabled_this_can_use_a_small_amount_of_ext':
    'mientras activadas, este puede usar una leve cantidad de adicional procesando, batería y móvil datos mientras Menta es abrir.',
  'fullAuth.settings.you_are_still_signed_in': 'tú son todavía iniciada en',
  'fullAuth.settings.your_account_stays_open_until_menta_confirms_the':
    'Tu cuenta sigue abrir hasta Menta confirma el Eliminación.',
  'fullAuth.settings.your_account_was_deleted': 'Tu cuenta fue eliminado.',
  'fullAuth.settings.your_choice_was_not_saved': 'tu opción fue no guardado',
  'fullAuth.settings.your_saved_settings_are_still_here':
    'tu guardado ajustes son todavía aquí.',
  'fullAuth.settings.your_support_drafts_for_this_account_were_remove':
    'tu asistencia borradores para este cuenta fueron Eliminard.',
  'fullAuth.support.change_menta_permissions_on_this_phone':
    'cambiar Menta permisos en este teléfono',
  'fullAuth.support.check_app_and_connection':
    'comprobar aplicación y conexión',
  'fullAuth.support.check_the_apple_account_used_for_the_original_pu':
    'Comprueba los cuenta de Apple usado para el original compra. si Apple muestra una carga, informe el problema antes comprando de nuevo.',
  'fullAuth.support.checking_private_report_drafts':
    'comprobando privada informe borradores',
  'fullAuth.support.checking_purchases': 'comprobando compras',
  'fullAuth.support.choose_what_you_need_you_can_review_everything_b':
    'elegir qué tú necesita. tú puede revisión todo antes enviando.',
  'fullAuth.support.connection_available': 'conexión disponible',
  'fullAuth.support.connection_check_did_not_finish':
    'conexión comprobar se no terminar',
  'fullAuth.support.could_not_check_earlier_purchases':
    'No se ha podido comprobar anterior compras',
  'fullAuth.support.do_not_buy_it_again_while_this_check_continues':
    'hacer no comprar lo de nuevo mientras este comprobar continues.',
  'fullAuth.support.find_an_earlier_menta_pro_purchase':
    'buscar un anterior Menta Pro compra',
  'fullAuth.support.hide_more_help': 'ocultar más ayuda',
  'fullAuth.support.looking_for_an_earlier_menta_pro_purchase':
    'Looking para un anterior Menta Pro compra',
  'fullAuth.support.menta_appears_offline': 'Menta appears sin conexión',
  'fullAuth.support.menta_pro_is_active_again': 'Menta Pro es activa de nuevo',
  'fullAuth.support.menta_pro_is_still_being_checked':
    'Menta Pro es todavía siendo checked',
  'fullAuth.support.more_help': 'más ayuda',
  'fullAuth.support.no_matching_purchase_was_found':
    'no matching compra fue found',
  'fullAuth.support.nothing_was_purchased_or_changed_check_the_conne':
    'nada fue purchased o cambiado. Comprueba los conexión y Vuelve a intentarlo.',
  'fullAuth.support.open_phone_settings': 'abrir teléfono ajustes',
  'fullAuth.support.opens_a_separate_support_report':
    'abre una separada asistencia informe.',
  'fullAuth.support.opens_sign_in_before_starting_a_private_report':
    'abre inicio de sesión antes iniciando una privada informe.',
  'fullAuth.support.other_help': 'otra ayuda',
  'fullAuth.support.restore_purchases': 'Restaurar compras',
  'fullAuth.support.saved_on_this_phone_and_still_waiting_to_be_sent':
    'guardado en este teléfono y todavía esperando a estar enviado.',
  'fullAuth.support.saved_reports': 'guardado informes',
  'fullAuth.support.see_app_version_connection_and_saved_proof':
    'ver aplicación versión, conexión y guardado prueba',
  'fullAuth.support.share_feedback': 'compartir comentarios',
  'fullAuth.support.sign_in_required': 'Iniciar sesión obligatorio',
  'fullAuth.support.sign_in_to_report_an_issue':
    'Inicia sesión en informe un problema',
  'fullAuth.support.support': 'asistencia',
  'fullAuth.support.support_drafts_stay_private_to_the_account_that_':
    'asistencia borradores mantenerse privada a el cuenta esa creado los. Iniciar sesión antes iniciando una nuevo informe.',
  'fullAuth.support.this_does_not_start_a_new_purchase_or_charge_thi':
    'este hace no empezar una nuevo compra o carga este cuenta.',
  'fullAuth.support.version_appversion_savedcopy_nothing_changed_try':
    'versión {appVersion}. {savedCopy} nada cambiado. intenta el comprobar de nuevo cuando tu conexión improves.',
  'fullAuth.support.version_appversion_savedcopy_saved_proof_stays_o':
    'versión {appVersion}. {savedCopy} guardado prueba sigue en este teléfono hasta Menta confirma lo fue enviado.',
  'fullAuth.support.your_earlier_purchase_is_active_on_this_account':
    'tu anterior compra es activa en este cuenta.',
  'fullAuth.system_settings.back_to_support': 'Volver a asistencia',
  'fullAuth.system_settings.change_notification_camera_photo_or_ad_measureme':
    'cambiar notificación, camera, foto, o Medición de anuncios permisos en tu teléfono ajustes. Menta no puede cambiar o confirmar los de este pantalla.',
  'fullAuth.system_settings.nothing_changed_in_menta_open_your_phone_setting':
    'nada cambiado en Menta. Abre tus teléfono ajustes manually, después Vuelve a el aplicación.',
  'fullAuth.system_settings.open_phone_settings': 'abrir teléfono ajustes',
  'fullAuth.system_settings.opening_phone_settings_does_not_confirm_that_a_p':
    'abriendo teléfono ajustes hace no confirmar esa una permiso cambiado.',
  'fullAuth.system_settings.phone_settings': 'teléfono ajustes',
  'fullAuth.system_settings.phone_settings_could_not_open':
    'teléfono ajustes No se ha podido abrir',
  'fullAuth.system_settings.return_when_you_re_done':
    'volver cuando estás hecho',
  'fullAuth.tabs_profile.active_and_past_promises': 'activa y past promesas',
  'fullAuth.tabs_profile.active_promises': 'activa promesas',
  'fullAuth.tabs_profile.activepromisecount_active_promises_currentstreak':
    '{activePromiseCount} activa promesas, {currentStreak} día racha, {length} Grupos',
  'fullAuth.tabs_profile.change_profile_photo': 'cambiar perfil foto',
  'fullAuth.tabs_profile.choose_one_thing_to_follow_through_on_it_will_ap':
    'elegir una cosa a seguir hasta el final en. lo podrá aparecer en hoy con el prueba tú elegir.',
  'fullAuth.tabs_profile.create_a_promise': 'crear una promesa',
  'fullAuth.tabs_profile.current_reward_terms_and_your_link':
    'actual recompensa términos y tu enlace',
  'fullAuth.tabs_profile.day_streak': 'día racha',
  'fullAuth.tabs_profile.edit_profile': 'editar perfil',
  'fullAuth.tabs_profile.for_your_privacy_menta_hides_the_previous_accoun':
    'para tu privacidad, Menta oculta el anterior cuenta cuando el Sesión termina.',
  'fullAuth.tabs_profile.groups': 'Grupos',
  'fullAuth.tabs_profile.invite': 'Invitar',
  'fullAuth.tabs_profile.invite_friends': 'Invitar amigos',
  'fullAuth.tabs_profile.loading_your_profile': 'cargando Tu perfil',
  'fullAuth.tabs_profile.make_your_first_promise': 'Make tu primera promesa',
  'fullAuth.tabs_profile.menta_kept_the_last_details_saved_for_this_accou':
    'Menta kept el última detalles guardado para este cuenta. tú puede todavía editar Tu perfil y usar otra perfil acciones.',
  'fullAuth.tabs_profile.momenta': 'Momenta',
  'fullAuth.tabs_profile.no_promises_yet': 'no promesas aún',
  'fullAuth.tabs_profile.open_saved_type_invite':
    'abrir guardado {type} Invitar',
  'fullAuth.tabs_profile.open_the_invite_to_review_it_before_joining':
    'Abre los Invitar a revisión lo antes unirse.',
  'fullAuth.tabs_profile.opens_your_invite_link_and_the_current_reward_te':
    'abre tu Invitar enlace y el actual recompensa términos.',
  'fullAuth.tabs_profile.personal_promises': 'Promesas personales',
  'fullAuth.tabs_profile.profile_details_may_be_out_of_date':
    'perfil detalles puede estar fuera de fecha',
  'fullAuth.tabs_profile.progress_and_rewards': 'progreso y rewards',
  'fullAuth.tabs_profile.progress_starts_with_proof':
    'progreso empieza con prueba',
  'fullAuth.tabs_profile.saved': 'guardado',
  'fullAuth.tabs_profile.sign_in_again': 'Iniciar sesión de nuevo',
  'fullAuth.tabs_profile.sign_in_to_see_you': 'Inicia sesión en ver tú',
  'fullAuth.tabs_profile.streaks_and_progress_appear_after_you_send_proof':
    'rachas y progreso aparecer después tú enviar prueba para un activa promesa.',
  'fullAuth.tabs_profile.the_last_saved_promise_and_group_counts_are_stil':
    'el última guardado promesa y grupo counts son todavía mostrado. otra perfil acciones permanecer disponible.',
  'fullAuth.tabs_profile.wallet_shop_and_items': 'cartera, tienda y artículos',
  'fullAuth.tabs_profile.you': 'tú',
  'fullAuth.tabs_profile.your_progress_may_be_out_of_date':
    'tu progreso puede estar fuera de fecha',
  'fullAuth.tabs_profile.your_rhythm': 'tu rhythm',
  'fullAuth.source.example.walk': 'Camina 20 minutos después del trabajo',
  'fullAuth.source.example.application':
    'Envía la solicitud antes de las 17:00',
  'fullAuth.source.example.read': 'Lee diez páginas antes de acostarte',
  'fullAuth.source.proof.photo': 'Prueba con foto',
  'fullAuth.source.proof.video': 'Prueba con vídeo',
  'fullAuth.source.proof.note': 'Prueba con nota',
  'fullAuth.source.proof.choose': 'Elegir prueba',
  'fullAuth.source.validation.action_required':
    'Escribe la acción que quieres demostrar.',
  'fullAuth.source.verification_description':
    'Añade una prueba clara que demuestre que has cumplido la promesa.',
  'fullAuth.source.submission_text':
    'Di qué has completado y añade la prueba de hoy.',
  'fullAuth.source.error.account_changed':
    'Tu cuenta ha cambiado. Vuelve a abrir el inicio para continuar.',
  'fullAuth.source.error.first_promise_lookup':
    'Menta no ha podido confirmar si ya existe tu primera promesa. Tu borrador está a salvo. Vuelve a intentarlo antes de crearla.',
  'fullAuth.source.error.incomplete_activation_receipt':
    'Menta ha devuelto un recibo de activación incompleto. Tu borrador está a salvo. Vuelve a intentarlo antes de crearla.',
  'fullAuth.source.error.incomplete_recovered_promise':
    'Menta ha devuelto un recibo de activación incompleto. Tu borrador está a salvo. Vuelve a intentarlo antes de crearla.',
  'fullAuth.source.error.referral_skip_unconfirmed':
    'Menta no ha podido confirmar que has omitido la invitación. Vuelve a intentarlo antes de crear tu promesa.',
  'fullAuth.source.error.referral_code_mismatch':
    'Ya hay otro código de invitación guardado para esta cuenta. Menta ha recuperado ese código para que puedas continuar u omitir este paso.',
  'fullAuth.source.error.referral_code_invalid':
    'Introduce el código de 32 caracteres u omite este paso.',
  'fullAuth.source.error.referral_unavailable':
    'Menta no ha podido confirmar el código. Sigue guardado en este teléfono. Vuelve a intentarlo antes de crear tu promesa.',
  'fullAuth.source.error.referral_code_not_added':
    'No se ha podido añadir este código a tu cuenta. Compruébalo u omite este paso.',
  'fullAuth.source.error.referral_not_confirmed':
    'Menta no ha podido confirmar el código de invitación guardado. Vuelve a intentarlo antes de crear tu promesa.',
  'fullAuth.source.error.draft_safe':
    'Tu borrador sigue a salvo en este teléfono. Vuelve a intentarlo.',
  'fullAuth.source.error.incomplete_promise_response':
    'La respuesta de tu promesa está incompleta. No la crees de nuevo. Vuelve a abrir Menta para recuperarla.',
  'fullAuth.source.error.next_step':
    'Menta no ha podido preparar el siguiente paso. Tu promesa está a salvo. Vuelve a continuar.',
  'fullAuth.source.error.promise_safe':
    'Tu promesa está a salvo. Vuelve a continuar.',
  'fullAuth.source.error.sign_in_session':
    'El inicio de sesión no ha devuelto una sesión autenticada.',
  'fullAuth.source.error.claim_draft':
    'Menta ha iniciado tu sesión, pero no ha podido recuperar este borrador. Vuelve a abrir el inicio para recuperarlo.',
  'fullAuth.source.error.confirm_documents':
    'Confirma los documentos necesarios antes de continuar.',
  'fullAuth.source.error.provider_sign_in':
    '{providerName}: el inicio de sesión ha fallado.',
  'fullAuth.source.momenta.added': '{amount} añadidos',
  'fullAuth.source.momenta.already_confirmed': '{amount} ya confirmados',
  'fullAuth.source.momenta.no_new_credit': 'No hay crédito nuevo',
  'fullAuth.source.referral.already_accepted':
    'Esta invitación ya está registrada en tu cuenta.',
  'fullAuth.source.referral.both_rewarded':
    'Has recibido {referredRewardAmount} Momenta. La persona que te invitó ha recibido {inviterRewardAmount}.',
  'fullAuth.source.referral.inviter_capped':
    'Has recibido {referredRewardAmount} Momenta. La persona que te invitó ha alcanzado el límite anual de recompensas.',
  'fullAuth.source.referral.program_disabled':
    'Tu invitación está registrada. Las recompensas por invitación no están activas ahora mismo.',
  'fullAuth.source.referral.unavailable':
    'Tu invitación sigue guardada en este teléfono para volver a intentarlo.',
  'fullAuth.source.referral.accepted': 'Tu invitación se ha registrado.',
  'fullAuth.source.referral.not_added':
    'No se ha añadido ninguna recompensa por invitación.',
  'fullAuth.source.receipt.see_today': 'Verla en Hoy',
  'fullAuth.source.accountability.just_me': 'Solo yo',
  'fullAuth.source.accountability.group_next': 'Crear un grupo después',
  'fullAuth.source.accountability.group_setup_next':
    'Crear un grupo nuevo después',
  'fullAuth.residual.oauth.apple_sign_in_fallback':
    'No se ha podido iniciar sesión con Apple. Vuelve a intentarlo o usa el correo electrónico.',
  'fullAuth.residual.paper_auth.new_to_menta': '¿Eres nuevo en Menta?',
  'fullAuth.residual.paper_auth.already_have_account': '¿Ya tienes una cuenta?',
  'fullAuth.residual.paper_auth.choose_username':
    'Elige el nombre de usuario que verán las personas en Menta.',
  'fullAuth.residual.paper_auth.minimum_three_characters':
    'Usa al menos 3 caracteres.',
  'fullAuth.residual.paper_auth.username_characters':
    'Usa solo letras, números o guiones bajos en tu nombre de usuario.',
  'fullAuth.residual.paper_auth.account_email':
    'Introduce el correo electrónico de esta cuenta de Menta.',
  'fullAuth.residual.paper_auth.valid_email':
    'Introduce un correo electrónico válido.',
  'fullAuth.residual.paper_auth.enter_password': 'Introduce tu contraseña.',
  'fullAuth.residual.paper_auth.create_password': 'Crea una contraseña.',
  'fullAuth.residual.paper_auth.password_minimum':
    'Usa al menos {length} caracteres.',
  'fullAuth.residual.paper_auth.confirm_password': 'Confirma tu contraseña.',
  'fullAuth.residual.paper_auth.passwords_match':
    'Los dos campos de contraseña deben coincidir.',
  'fullAuth.residual.paper_auth.create_account_action': 'Crear cuenta',
  'fullAuth.residual.paper_auth.creating_account_action': 'Creando cuenta…',
  'fullAuth.residual.paper_auth.sign_in_action': 'Iniciar sesión',
  'fullAuth.residual.paper_auth.signing_in_action': 'Iniciando sesión…',
  'fullAuth.residual.paper_auth.duplicate_email':
    'Este correo electrónico ya tiene una cuenta de Menta.',
  'fullAuth.residual.paper_auth.fallback_sign_in':
    'No hemos podido iniciar sesión con esos datos.',
  'fullAuth.residual.paper_auth.fallback_create':
    'No hemos podido crear esa cuenta.',
  'fullAuth.residual.paper_auth.error_state':
    'Tu promesa sigue aquí. Corrige el campo marcado o inicia sesión.',
  'fullAuth.residual.paper_auth.return_to_promise':
    'Volver a mi primera promesa',
  'fullAuth.residual.paper_auth.switch_sign_in': 'Iniciar sesión',
  'fullAuth.residual.paper_auth.switch_create': 'Crear cuenta',
  'fullAuth.residual.paper_reset.sending_link': 'Enviando enlace…',
  'fullAuth.residual.paper_reset.back_to_sign_in': 'Volver a iniciar sesión',
  'fullAuth.residual.paper_reset.remembered_it': '¿Lo has recordado?',
  'fullAuth.residual.paper_reset.password_changes_after_link':
    'Tu contraseña solo cambia después de usar el enlace.',
  'fullAuth.residual.paper_reset.another_link_available':
    'Hay otro enlace disponible en {label}.',
  'fullAuth.residual.paper_reset.sending_another_link': 'Enviando otro enlace…',
  'fullAuth.residual.paper_reset.send_another_link_in':
    'Enviar otro enlace dentro de {countdown}',
  'fullAuth.residual.paper_reset.send_another_link': 'Enviar otro enlace',
  'fullAuth.residual.legal.sign_in_again':
    'Inicia sesión de nuevo para revisar estos documentos.',
  'fullAuth.residual.legal.load_online':
    'Menta no ha podido cargar los documentos actuales. Vuelve a intentarlo antes de crear una promesa.',
  'fullAuth.residual.legal.load_offline':
    'Conéctate a internet para comprobar y aceptar los documentos actuales.',
  'fullAuth.residual.legal.save_offline':
    'Conéctate a internet para guardar tu acuerdo. No se ha guardado sin conexión.',
  'fullAuth.residual.legal.save_connection':
    'La conexión terminó antes de que Menta guardara tu acuerdo. Vuelve a conectarte e inténtalo de nuevo.',
  'fullAuth.residual.legal.save_online':
    'Menta no ha podido guardar tu acuerdo. No ha cambiado nada más. Vuelve a intentarlo.',
  'fullAuth.residual.legal.title_continue': 'Antes de continuar',
  'fullAuth.residual.legal.title_update': 'Revisa qué ha cambiado',
  'fullAuth.residual.legal.title_settings': 'Revisa tus documentos de Menta',
  'fullAuth.residual.legal.title_create': 'Antes de crearla',
  'fullAuth.residual.legal.return_settings': 'Volver a ajustes',
  'fullAuth.residual.legal.continue_create': 'Continuar para crearla',
  'fullAuth.residual.legal.continue_menta': 'Continuar a Menta',
  'fullAuth.residual.legal.changed':
    'Los documentos han cambiado mientras esta pantalla estaba abierta. Revisa las versiones actuales y vuelve a aceptarlas.',
  'fullAuth.residual.legal.body_update':
    'Lee los documentos actualizados y acepta las nuevas versiones.',
  'fullAuth.residual.legal.body_settings':
    'Revisa los documentos actuales de tu cuenta.',
  'fullAuth.residual.legal.body_post_auth':
    'Lee los tres documentos breves y acéptalos una vez para esta cuenta.',
  'fullAuth.residual.legal.body_create':
    'Lee los tres documentos breves y acéptalos antes de crear una promesa.',
  'fullAuth.residual.legal.accepted':
    'Has aceptado las versiones actuales de los documentos para esta cuenta.',
  'fullAuth.residual.legal.leave_blocked':
    'Puedes salir sin aceptar. Tu cuenta y el contenido existente seguirán disponibles, pero no podrás crear una promesa hasta aceptar las versiones actuales.',
  'fullAuth.residual.legal.leave_available':
    'Puedes salir sin aceptar. Tu cuenta y las promesas existentes seguirán disponibles.',
  'fullAuth.residual.legal.document_open_failed':
    '{label} no se ha abierto. Vuelve a intentarlo.',
  'fullAuth.residual.notifications.sign_in_again':
    'Inicia sesión de nuevo para gestionar los ajustes de notificaciones.',
  'fullAuth.residual.notifications.load_failed':
    'No se han podido cargar tus ajustes de notificaciones. Tus opciones guardadas no han cambiado.',
  'fullAuth.residual.notifications.still_apply':
    'Tus opciones de notificaciones guardadas podrían seguir aplicándose. Vuelve a intentarlo o regresa a Ajustes.',
  'fullAuth.residual.notifications.auto_save':
    'Los cambios se guardan automáticamente.',
  'fullAuth.residual.notifications.off_save':
    'Las opciones se guardan aquí. Las notificaciones siguen desactivadas en este teléfono.',
  'fullAuth.residual.settings.offline_value': 'Sin conexión',
  'fullAuth.residual.settings.retry_value': 'Volver a intentarlo',
  'fullAuth.residual.settings.checking_loading': 'Comprobando…',
  'fullAuth.residual.settings.restart_loading': 'Reiniciando…',
  'fullAuth.residual.settings.check_value': 'Comprobar',
  'fullAuth.residual.settings.loading_value': 'Cargando…',
  'fullAuth.residual.settings.on_value': 'Activadas',
  'fullAuth.residual.settings.off_value': 'Desactivadas',
  'fullAuth.residual.settings.opening_value': 'Abriendo…',
  'fullAuth.residual.settings.restart_value': 'Reiniciar',
  'fullAuth.residual.settings.advanced_title':
    'Los diagnósticos avanzados están activados',
  'fullAuth.residual.settings.advanced_prompt':
    '¿Compartir diagnósticos avanzados?',
  'fullAuth.residual.settings.advanced_full_body':
    'Si activas esta opción, Menta compartirá mediciones de rendimiento de muestra con Sentry. La reproducción de sesiones de Amplitude funciona por separado; el texto, los campos de entrada y las imágenes se ocultan. Esto no activa los anuncios ni el seguimiento entre aplicaciones.',
  'fullAuth.residual.settings.advanced_basic_body':
    'Si activas esta opción, Menta compartirá mediciones de rendimiento adicionales con Sentry. Esto no activa los anuncios ni el seguimiento entre aplicaciones.',
  'fullAuth.residual.report.sign_in_description':
    'Inicia sesión de nuevo antes de abrir este informe. Los borradores son privados para la cuenta que los creó.',
  'fullAuth.residual.report.return_description':
    'Vuelve a Soporte y empieza un informe nuevo para esta cuenta.',
  'fullAuth.residual.report.sign_in_required': 'Es necesario iniciar sesión',
  'fullAuth.residual.report.other_account':
    'Este informe pertenece a otra cuenta',
  'fullAuth.residual.report.received_content':
    'Menta ha recibido este informe. El personal de seguridad autorizado puede revisar el contenido denunciado, incluido el de grupos solo con invitación. Los demás miembros no podrán ver quién lo ha denunciado.',
  'fullAuth.residual.report.received_feedback':
    'Soporte ha recibido tus comentarios. Tu prueba, racha e historial de grupos no han cambiado.',
  'fullAuth.residual.report.received_report':
    'Soporte ha recibido tu informe. Tu prueba, racha e historial de grupos no han cambiado mientras espera revisión.',
  'fullAuth.residual.report.status_received': 'Recibido',
  'fullAuth.residual.report.status_queued': 'En cola',
  'fullAuth.residual.report.feedback_heading': '¿Qué deberíamos saber?',
  'fullAuth.residual.report.issue_heading': '¿Qué ha ocurrido?',
  'fullAuth.residual.report.check_heading': 'Compruébalo y envíalo',
  'fullAuth.residual.report.feedback_description':
    'Cuéntanos qué funciona, qué no o qué haría mejor Menta.',
  'fullAuth.residual.report.issue_description':
    'Cuéntanos qué estabas haciendo y qué hizo Menta. Estos datos ayudan al equipo de soporte a investigarlo.',
  'fullAuth.residual.report.check_description':
    'Léelo de nuevo. Todo lo que aparece debajo es opcional.',
  'fullAuth.residual.report.screenshot_feedback':
    'Añade una captura si ayuda a explicar tus comentarios.',
  'fullAuth.residual.report.screenshot_issue':
    'Añade una captura que ayude a soporte a ver el problema.',
  'fullAuth.residual.report.what_happened_label': '¿Qué ha ocurrido?',
  'fullAuth.residual.report.included_feedback': 'Incluido con los comentarios',
  'fullAuth.residual.report.included_report': 'Incluido con el informe',
  'fullAuth.residual.report.message_label': 'Mensaje',
  'fullAuth.residual.report.report_label': 'Informe',
  'fullAuth.residual.report.form_label': 'este formulario',
  'fullAuth.residual.report.report_context_label': 'el informe',
  'fullAuth.residual.report.feedback_label': 'Comentarios',
  'fullAuth.residual.report.feedback_title': 'Comentarios sobre Menta',
  'fullAuth.residual.report.category_promise': 'Promesa',
  'fullAuth.residual.report.category_group': 'Grupo',
  'fullAuth.residual.report.category_proof': 'Prueba',
  'fullAuth.residual.report.category_member': 'Miembro',
  'fullAuth.residual.report.category_app_issue': 'Problema de la aplicación',
} as const satisfies Pick<EnglishCatalogue, FullAuthAccountKey>;
