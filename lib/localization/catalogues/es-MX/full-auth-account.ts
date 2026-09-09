// Mexican Spanish catalogue for auth, onboarding, account, settings and support surfaces.
// Dynamic values stay inside the complete template so translations can reorder them.
import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type FullAuthAccountKey = Extract<keyof EnglishCatalogue, `fullAuth.${string}`>;

export const fullAuthAccountEsMX = {
  'fullAuth.shared.try_again': 'Inténtalo de nuevo.',
  'fullAuth.support.untitled_report': 'Informe sin título',
  'fullAuth.onboarding.promise_setup_step_one':
    'Configuración de la promesa · 1 de 2',
  'fullAuth.onboarding.promise_setup_step_two':
    'Configuración de la promesa · 2 de 2',
  'fullAuth.component_onboarding_paperauthreset.your_account_email':
    'tu cuenta de correo',
  'fullAuth.shared.back_to_you': 'Volver a ti',
  'fullAuth.shared.promise': 'Promesa',
  'fullAuth.shared.terms': 'Términos',
  'fullAuth.shared.back_to_settings': 'Volver a la configuración',
  'fullAuth.shared.other_sign_in_options': 'Otras opciones de inicio de sesión',
  'fullAuth.shared.retry_profile': 'Reintentar perfil',
  'fullAuth.shared.refresh_progress': 'Actualizar progreso',
  'fullAuth.shared.check_connection_again': 'Comprueba la conexión de nuevo',
  'fullAuth.shared.sign_in': 'Iniciar sesión',
  'fullAuth.support.feedback': 'Comentarios',
  'fullAuth.support.promise_report': 'Informe de la promesa',
  'fullAuth.support.group_report': 'Informe del grupo',
  'fullAuth.support.proof_report': 'Informe de prueba',
  'fullAuth.support.app_issue': 'Problema con la app',
  'fullAuth.support.checking_saved_proof':
    'Revisando la prueba guardada en este celular.',
  'fullAuth.support.saved_proof_count_unavailable':
    'No se puede consultar la cantidad de pruebas guardadas.',
  'fullAuth.support.no_proof_waiting':
    'No hay pruebas que estén esperando en este celular.',
  'fullAuth.support.proof_count_saved':
    '{count} {proofLabel} guardado en este celular.',
  'fullAuth.support.proof_is': 'La prueba es',
  'fullAuth.support.proofs_are': 'pruebas son',
  'fullAuth.support.saved_proof_waiting_to_be_sent':
    '{count} {proofLabel} guardado en este celular y todavía esperando ser enviado.',
  'fullAuth.email_auth.create_account': 'Crear cuenta',
  'fullAuth.email_auth.sign_in': 'Iniciar sesión',
  'fullAuth.email_auth.already_have_account': '¿Ya tienes una cuenta?',
  'fullAuth.email_auth.new_to_menta': '¿Eres nuevo en Menta?',
  'fullAuth.email_auth.offline_reconnect':
    'estás sin conexión. reconectar y Vuelve a intentarlo.',
  'fullAuth.email_auth.too_many_attempts':
    'Espera un momento, y luego vuelve a intentarlo.',
  'fullAuth.email_auth.could_not_sign_in':
    'No se ha podido Iniciar sesión. comprobar Tu correo y contraseña, después Vuelve a intentarlo.',
  'fullAuth.email_auth.could_not_create_account':
    'No se ha podido crear Tu cuenta. Comprueba tu conexión, después Vuelve a intentarlo.',
  'fullAuth.email_auth.enter_password': 'Ingresa tu contraseña.',
  'fullAuth.email_auth.create_password': 'Crea una contraseña.',
  'fullAuth.email_auth.confirm_your_password': 'Confirma tu contraseña.',
  'fullAuth.email_auth.password_minimum': 'Usa al menos caracteres {length}.',
  'fullAuth.email_auth.password_mismatch': 'Las contraseñas no coinciden.',
  'fullAuth.email_auth.choose_username': 'Elige un nombre de usuario.',
  'fullAuth.email_auth.minimum_three_characters': 'Usar al menos 3 caracteres.',
  'fullAuth.email_auth.username_characters_only':
    'Usar letras, números o sólo subrayas.',
  'fullAuth.email_auth.account_email': 'Ingresa tu correo de cuenta de Menta.',
  'fullAuth.email_auth.valid_email': 'Ingresa una dirección de correo válida.',
  'fullAuth.email_auth.passwords_need_to_match':
    'Las contraseñas tienen que coincidir.',
  'fullAuth.password_recovery.confirm_new_password':
    'Confirma tu nueva contraseña.',
  'fullAuth.password_recovery.passwords_mismatch':
    'Las contraseñas no coinciden.',
  'fullAuth.password_recovery.minimum_password_length':
    'Usa al menos caracteres {length}.',
  'fullAuth.password_recovery.could_not_change_now':
    'No podemos cambiar tu contraseña ahora mismo.',
  'fullAuth.password_recovery.sign_in_with_new_password_draft':
    'Inicia sesión con tu nueva contraseña, y luego vuelva a tu borrador.',
  'fullAuth.password_recovery.sign_in_with_new_password':
    'Ahora puedes iniciar sesión con tu nueva contraseña.',
  'fullAuth.language_settings.system_accessibility':
    'Usar el idioma del celular. {systemSubtitle}',
  'fullAuth.forgot_password.enter_email_tied_to_account':
    'Ingresa el correo vinculado a tu cuenta Menta.',
  'fullAuth.forgot_password.enter_valid_email':
    'Ingresa una dirección de correo válida.',
  'fullAuth.forgot_password.could_not_send_reset_email':
    'No se ha podido enviar el restablecer correo. Comprueba tu conexión y Vuelve a intentarlo.',
  'fullAuth.password_recovery_callback.checking_secure_reset_link':
    'Revisando el enlace de reset seguro...',
  'fullAuth.password_recovery_callback.reset_link_verified':
    'Reiniciar el enlace verificado.',
  'fullAuth.report_issue.send_feedback': 'Enviar comentarios',
  'fullAuth.report_issue.send_report': 'Enviar informe',
  'fullAuth.support.start_a_new_report': 'Iniciar un nuevo informe',
  'fullAuth.support.report_an_issue': 'Informe una cuestión',
  'fullAuth.notification_settings.daily_proof_reminders_and_promise_ending_updates':
    'Recordatorios diarios de pruebas y actualizaciones de finalización de promesas.',
  'fullAuth.notification_settings.saved_but_notifications_are_off_on_this_phone':
    'Guardado, pero las notificaciones están apagadas en este celular.',
  'fullAuth.notification_settings.occasional_updates_to_email_unsubscribe_here':
    'Actualizaciones ocasionales a {email}. Puedes cancelar la suscripción aquí en cualquier momento.',
  'fullAuth.notification_settings.a_confirmed_account_email_is_required':
    'Se requiere un correo de cuenta confirmado.',
  'fullAuth.onboarding.menta_mascot_holding_your_first_promise':
    'La mascota de Menta sostiene tu primera promesa',
  'fullAuth.onboarding.menta_mascot_waving_hello': 'Menta mascota saludando',
  'fullAuth.onboarding.your_saved_draft_is_back_on_this_phone':
    'Tu borrador guardado está de vuelta en este celular.',
  'fullAuth.onboarding.saved_privately_on_this_phone_as_you_type':
    'Guardado en privado en este celular como escribe.',
  'fullAuth.account_deleted.apple_instructions_did_not_open':
    'Apple instrucciones no abiertas',
  'fullAuth.account_deleted.checking_account_deletion':
    'Verificación de la eliminación de la cuenta',
  'fullAuth.account_deleted.go_to_sign_in': 'Entra.',
  'fullAuth.account_deleted.if_you_used_sign_in_with_apple_remove_menta_from':
    'Si utilizas Ingresar con Apple, eliminar Menta de las aplicaciones conectadas a tu cuenta Apple. Abrir configuración de iPhone, pulsa tu nombre, y luego iniciar sesión con Apple.',
  'fullAuth.account_deleted.open_apple_support_and_search_for_manage_your_ap':
    "abrir Apple asistencia y buscar para \'gestionar tu aplicaciones con Iniciar sesión con Apple\'.",
  'fullAuth.account_deleted.remove_apple_access': 'Eliminar el acceso Apple',
  'fullAuth.account_deleted.see_apple_instructions':
    'Ver instrucciones de Apple',
  'fullAuth.account_deleted.sign_in_with_apple_access_was_also_removed':
    'Inicia sesión con Apple también se eliminó el acceso.',
  'fullAuth.account_deleted.your_account_was_deleted': 'Tu cuenta fue borrada',
  'fullAuth.account_deleted.your_menta_account_and_its_data_were_deleted_men':
    'tu Menta cuenta y tus datos fueron eliminado. Menta también borró este de la cuenta guardado datos de este celular.',
  'fullAuth.auth_required.events': 'Eventos',
  'fullAuth.auth_required.groups': 'grupos',
  'fullAuth.auth_required.keep_browsing': 'Mantenga la navegación',
  'fullAuth.auth_required.menta': 'Menta',
  'fullAuth.auth_required.menta_records_the_review_under_your_account':
    'Menta registra la revisión bajo tu cuenta.',
  'fullAuth.auth_required.menta_saves_this_proof_with_the_right_promise_an':
    'Menta ahorra esta prueba con la promesa y la cuenta correctas.',
  'fullAuth.auth_required.momenta': 'Momenta',
  'fullAuth.auth_required.proof': 'Prueba',
  'fullAuth.auth_required.reviews': 'Reseñas',
  'fullAuth.auth_required.sign_in': 'Iniciar sesión',
  'fullAuth.auth_required.sign_in_to_add_proof':
    'Inicia sesión para añadir pruebas',
  'fullAuth.auth_required.sign_in_to_complete_this_action_and_return_here_':
    'Inicia sesión para completar esta acción y volver aquí después.',
  'fullAuth.auth_required.sign_in_to_continue': 'Inicia sesión para continuar',
  'fullAuth.auth_required.sign_in_to_continue_with_this_event':
    'Inicia sesión para continuar con este evento',
  'fullAuth.auth_required.sign_in_to_join_this_group':
    'Inicia sesión para unirse a este grupo',
  'fullAuth.auth_required.sign_in_to_review_proof':
    'Inicia sesión para revisar la prueba',
  'fullAuth.auth_required.sign_in_to_use_momenta':
    'Inicia sesión para usar Momenta',
  'fullAuth.auth_required.your_balance_purchases_and_items_stay_with_your_':
    'Tu saldo, compras y artículos se quedan con tu cuenta.',
  'fullAuth.auth_required.your_invitation_and_group_activity_stay_with_you':
    'Tu invitación y actividad grupal se mantienen con tu cuenta.',
  'fullAuth.auth_required.your_place_check_in_and_event_photos_are_saved_t':
    'Tu lugar, el registro de entrada y las fotos de tu evento se guardan en tu cuenta.',
  'fullAuth.auth_required.your_promises_proof_groups_and_reviews_stay_with':
    'Tus promesas, pruebas, grupos y revisiones se quedan con tu cuenta Menta.',
  'fullAuth.component_onboarding_mentasurface.hide_password':
    'Ocultar contraseña',
  'fullAuth.component_onboarding_mentasurface.menta': 'Menta',
  'fullAuth.component_onboarding_mentasurface.setup': 'Configuración',
  'fullAuth.component_onboarding_mentasurface.show_password':
    'Mostrar contraseña',
  'fullAuth.component_onboarding_paperauthform.after_this': 'Después de esto',
  'fullAuth.component_onboarding_paperauthform.characters': '+ caracteres',
  'fullAuth.component_onboarding_paperauthform.check_the_details':
    'Compruebe los detalles',
  'fullAuth.component_onboarding_paperauthform.confirm_password':
    'Confirma contraseña',
  'fullAuth.component_onboarding_paperauthform.create_your_account':
    'Crea tu cuenta',
  'fullAuth.component_onboarding_paperauthform.creating_your_account':
    'Creando tu cuenta',
  'fullAuth.component_onboarding_paperauthform.daniel': 'Daniel',
  'fullAuth.component_onboarding_paperauthform.email': 'Correo electrónico',
  'fullAuth.component_onboarding_paperauthform.forgot_your_password':
    '¿Olvidó tu contraseña?',
  'fullAuth.component_onboarding_paperauthform.password': 'Contraseña',
  'fullAuth.component_onboarding_paperauthform.sign_in_with_email':
    'Inicia sesión con correo',
  'fullAuth.component_onboarding_paperauthform.signing_you_in': 'Firma en ti',
  'fullAuth.component_onboarding_paperauthform.username': 'Nombre de usuario',
  'fullAuth.component_onboarding_paperauthform.you_example_com':
    'you@example.com',
  'fullAuth.component_onboarding_paperauthform.you_will_return_to_your_first_promise':
    'Volverás a tu primera promesa.',
  'fullAuth.component_onboarding_paperauthform.your_promise_stays_on_this_phone_until_the_accou':
    'Tu promesa se mantiene en este celular hasta que la cuenta esté lista.',
  'fullAuth.component_onboarding_paperauthform.your_promise_stays_on_this_phone_while_we_create':
    'Tu promesa se mantiene en este celular mientras creamos la cuenta.',
  'fullAuth.component_onboarding_paperauthform.your_promise_stays_on_this_phone_while_you_sign_':
    'Tu promesa se queda en este celular mientras te registras.',
  'fullAuth.component_onboarding_paperauthmethods.choose_how_to_sign_in_your_promise_stays_on_this':
    'Elige cómo iniciar sesión. Tu promesa se mantiene en este celular hasta que el registro termine.',
  'fullAuth.component_onboarding_paperauthmethods.choose_how_you_want_to_sign_in':
    'Elige cómo quieres iniciar sesión.',
  'fullAuth.component_onboarding_paperauthmethods.continue_with_apple':
    'Continuar con Apple',
  'fullAuth.component_onboarding_paperauthmethods.continue_with_email':
    'Continuar con el correo',
  'fullAuth.component_onboarding_paperauthmethods.continue_with_google':
    'Continuar con Google',
  'fullAuth.component_onboarding_paperauthmethods.save_your_promise':
    'Guarda tu promesa',
  'fullAuth.component_onboarding_paperauthmethods.see_how_menta_works':
    'Vea cómo funciona Menta',
  'fullAuth.component_onboarding_paperauthmethods.sign_in_to_menta':
    'Inicia sesión en Menta',
  'fullAuth.component_onboarding_paperauthmethods.we_could_not_sign_you_in':
    'No podíamos firmarte.',
  'fullAuth.component_onboarding_paperauthreset.back_to_sign_in':
    'Volver a iniciar sesión',
  'fullAuth.component_onboarding_paperauthreset.check_your_email':
    'Revisa tu correo.',
  'fullAuth.component_onboarding_paperauthreset.daniel_example_com':
    'daniel@example.com',
  'fullAuth.component_onboarding_paperauthreset.email': 'Correo electrónico',
  'fullAuth.component_onboarding_paperauthreset.email_sent_to':
    'Correo electrónico enviado a',
  'fullAuth.component_onboarding_paperauthreset.link_valid_for_60_minutes':
    'Enlace válido por 60 minutos',
  'fullAuth.component_onboarding_paperauthreset.reset_for': 'Restablecer para',
  'fullAuth.component_onboarding_paperauthreset.reset_your_password':
    'Reinicia tu contraseña',
  'fullAuth.component_onboarding_paperauthreset.send_another_link':
    'Enviar otro enlace',
  'fullAuth.component_onboarding_paperauthreset.send_another_link_in_countdown':
    'Enviar otro enlace en {countdown}',
  'fullAuth.component_onboarding_paperauthreset.send_reset_link':
    'Enviar enlace de restablecimiento',
  'fullAuth.component_onboarding_paperauthreset.sending_your_reset_link':
    'Enviar el enlace de reseteo',
  'fullAuth.component_onboarding_paperauthreset.use_the_latest_link':
    'Usa el último enlace.',
  'fullAuth.component_onboarding_paperauthreset.use_the_link_we_just_sent_you_can_request_anothe':
    'Usa el enlace que acabamos de enviar. Puedes solicitar otro cuando el temporizador termine.',
  'fullAuth.component_onboarding_paperauthreset.we_could_not_send_another_link':
    'No podíamos enviar otro enlace.',
  'fullAuth.component_onboarding_paperauthreset.we_could_not_send_the_reset_link':
    'No podíamos enviar el enlace de reseteo',
  'fullAuth.component_onboarding_paperauthreset.we_ll_email_you_a_secure_link_your_saved_promise':
    'Te enviaremos correo tú una seguro enlace. tu guardado promesa podrá mantenerse en este celular.',
  'fullAuth.component_onboarding_paperauthreset.we_re_sending_a_secure_link_to_the_address_below':
    'Estamos enviando una seguro enlace a el dirección abajo.',
  'fullAuth.component_onboarding_paperauthreset.we_sent_a_secure_reset_link_your_saved_promise_i':
    'Enviábamos un enlace de reajuste seguro.',
  'fullAuth.component_onboarding_paperauthsurface.before_you_use_the_account_you_ll_review_and_acc':
    'antes tú usar el cuenta, Vas a revisión y aceptar de Menta actual cuenta y comunidad documentos.',
  'fullAuth.component_onboarding_paperauthsurface.choose_sign_in_method':
    'Elija método de inicio de sesión',
  'fullAuth.component_onboarding_paperauthsurface.community_standards':
    'Normas comunitarias',
  'fullAuth.component_onboarding_paperauthsurface.community_standards_did_not_open':
    'No se han abierto las normas comunitarias',
  'fullAuth.component_onboarding_paperauthsurface.hide_password':
    'Ocultar contraseña',
  'fullAuth.component_onboarding_paperauthsurface.keep_local_draft':
    'Mantenga el borrador local',
  'fullAuth.component_onboarding_paperauthsurface.menta': 'Menta',
  'fullAuth.component_onboarding_paperauthsurface.menta_authentication':
    'autenticación Menta',
  'fullAuth.component_onboarding_paperauthsurface.menta_mascot':
    'Mascota de Menta',
  'fullAuth.component_onboarding_paperauthsurface.privacy_policy':
    'Política de privacidad',
  'fullAuth.component_onboarding_paperauthsurface.privacy_policy_did_not_open':
    'La política de privacidad no abrió',
  'fullAuth.component_onboarding_paperauthsurface.returning_to': 'Regresando a',
  'fullAuth.component_onboarding_paperauthsurface.show_password':
    'Mostrar contraseña',
  'fullAuth.component_onboarding_paperauthsurface.terms_did_not_open':
    'Los términos no se abren',
  'fullAuth.component_onboarding_paperauthsurface.terms_of_use':
    'Términos de uso',
  'fullAuth.component_onboarding_paperauthsurface.the_provider_sheet_was_closed_before_an_account_':
    'La hoja de proveedor se cerró antes de que se devolviera una cuenta. Nada fue creado o cambiado.',
  'fullAuth.component_onboarding_paperauthsurface.title_message':
    '{title} {message}',
  'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_community_standar':
    'Intenta de nuevo, o visita menta.quest/estándares de la comunidad en tu navegador.',
  'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_privacy_in_your_b':
    'Intenta de nuevo, o visita menta.quest/privacy en tu navegador.',
  'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_terms_in_your_bro':
    'Intenta de nuevo, o visita menta.quest/terms en tu navegador.',
  'fullAuth.component_onboarding_paperauthsurface.you_can_try_again_or_keep_working_without_signin':
    'Puedes probar de nuevo o seguir trabajando sin firmar hasta que Menta necesite guardarlo.',
  'fullAuth.component_onboarding_paperauthsurface.you_re_still_signed_out':
    'estás todavía iniciada fuera.',
  'fullAuth.component_onboarding_paperauthsurface.your_local_promise_is_still_here':
    'Tu promesa local sigue aquí.',
  'fullAuth.component_settings_settingssignoutsheet.cancel': 'Cancelar',
  'fullAuth.component_settings_settingssignoutsheet.check_the_connection_then_try_again':
    'Revisa la conexión, luego intenta de nuevo.',
  'fullAuth.component_settings_settingssignoutsheet.sign_out': '¡Apúrense!',
  'fullAuth.component_settings_settingssignoutsheet.sign_out_did_not_finish':
    'La señalización no terminó',
  'fullAuth.component_settings_settingssignoutsheet.try_sign_out_again':
    'Prueba a salir otra vez.',
  'fullAuth.component_support_offlinesupportnotice.you_can_still_read_the_last_saved_screen_proof_a':
    'Aún puedes leer la última pantalla guardada. Pruebas e informes de los borradores permanecen en este celular hasta que Menta vuelva a conectar.',
  'fullAuth.component_support_offlinesupportnotice.you_re_offline':
    'estás sin conexión',
  'fullAuth.component_support_supportsurface.title_subtitle':
    '{title}. {subtitle}',
  'fullAuth.component_support_supportsurface.title_subtitle_detail':
    '{title}. {subtitle} {detail}',
  'fullAuth.edit_profile.account_required': 'Cuenta necesaria',
  'fullAuth.edit_profile.back_to_you': 'Volver a ti',
  'fullAuth.edit_profile.cannot_edit_here': 'No puedo editar aquí',
  'fullAuth.edit_profile.change_photo': 'Cambiar foto',
  'fullAuth.edit_profile.choose_a_different_photo': 'Elige una foto diferente.',
  'fullAuth.edit_profile.choose_a_profile_photo': 'Elija una foto de perfil',
  'fullAuth.edit_profile.details': 'Detalles',
  'fullAuth.edit_profile.display_name': 'Nombre de la pantalla',
  'fullAuth.edit_profile.edit_again': 'Edita de nuevo',
  'fullAuth.edit_profile.edit_profile': 'Perfil de edición',
  'fullAuth.edit_profile.email': 'Correo electrónico',
  'fullAuth.edit_profile.how_it_will_look_on_you': '¿Cómo te va a ver?',
  'fullAuth.edit_profile.loading_your_profile': 'Carga tu perfil',
  'fullAuth.edit_profile.name': 'Nombre',
  'fullAuth.edit_profile.no_changes_have_been_made_try_loading_your_accou':
    'No se han hecho cambios. Prueba a cargar tu cuenta de nuevo.',
  'fullAuth.edit_profile.no_photo_selected':
    'No se ha seleccionado ninguna foto',
  'fullAuth.edit_profile.nothing_changes_until_you_choose_one':
    'Nada cambia hasta que elijas uno.',
  'fullAuth.edit_profile.photo_not_changed_photoerror':
    'Foto no cambiada. {photoError}',
  'fullAuth.edit_profile.photo_visibility': 'Visión de la foto',
  'fullAuth.edit_profile.photo_will_be_removed': 'La foto será eliminada',
  'fullAuth.edit_profile.profile_unavailable': 'Perfil no disponible',
  'fullAuth.edit_profile.profile_updated': 'Perfil actualizado',
  'fullAuth.edit_profile.remove_photo': 'Quitar la foto',
  'fullAuth.edit_profile.save_changes': 'Guardar cambios',
  'fullAuth.edit_profile.saving_changes': 'Cambios de ahorro',
  'fullAuth.edit_profile.saving_your_changes': 'Guardando tus cambios',
  'fullAuth.edit_profile.selected_not_saved': 'Seleccionado, no guardado',
  'fullAuth.edit_profile.selected_profile_photo_in_its_final_circular_cro':
    'Imagen seleccionada en tu corte circular final',
  'fullAuth.edit_profile.sign_in_again': 'Inicia sesión de nuevo',
  'fullAuth.edit_profile.sign_in_again_before_editing_this_profile':
    'Inicia sesión de nuevo antes de editar este perfil.',
  'fullAuth.edit_profile.this_is_how_the_photo_will_look_on_you_it_will_n':
    'Así es como la foto te mirará. No cambiará hasta que te guardes.',
  'fullAuth.edit_profile.try_again': 'Inténtalo de nuevo.',
  'fullAuth.edit_profile.try_saving_again': 'Intenta guardarte de nuevo.',
  'fullAuth.edit_profile.username': 'Nombre de usuario',
  'fullAuth.edit_profile.usernames_can_t_be_changed_yet':
    'nombres de usuario No se puede estar cambiado aún.',
  'fullAuth.edit_profile.value': '@ZTOKEN0Z {value}',
  'fullAuth.edit_profile.you_can_keep_reviewing_the_preview_while_menta_s':
    'Puedes seguir revisando la vista previa mientras Menta ahorra.',
  'fullAuth.edit_profile.you_cannot_change_your_sign_in_email_here':
    'No puede cambiar tu email de registro aquí.',
  'fullAuth.edit_profile.your_current_photo_stays_until_you_save_changes':
    'Tu foto actual se queda hasta que guarde cambios.',
  'fullAuth.edit_profile.your_details_will_appear_when_this_check_finishe':
    'Tus detalles aparecerán cuando termine este cheque.',
  'fullAuth.edit_profile.your_edits_are_still_here':
    'Tus ediciones siguen aquí',
  'fullAuth.edit_profile.your_profile_has_not_changed':
    'Tu perfil no ha cambiado.',
  'fullAuth.edit_profile.your_profile_has_not_changed_try_saving_again':
    'Tu perfil no ha cambiado. Intenta guardar de nuevo.',
  'fullAuth.edit_profile.your_saved_name_and_photo_now_appear_across_ment':
    'Tu nombre y foto guardados ahora aparecen en Menta.',
  'fullAuth.email_auth.confirm_password': 'Confirma contraseña',
  'fullAuth.email_auth.couldn_t_create_account': 'No se ha podido crear cuenta',
  'fullAuth.email_auth.couldn_t_sign_you_in': 'No se ha podido sesión tú en',
  'fullAuth.email_auth.create_an_account_to_save_this_promise_to_menta':
    'Crea una cuenta para guardar esta promesa a Menta.',
  'fullAuth.email_auth.create_your_account': 'Crea tu cuenta',
  'fullAuth.email_auth.daniel': 'Daniel',
  'fullAuth.email_auth.email': 'Correo electrónico',
  'fullAuth.email_auth.forgot_your_password': '¿Olvidó tu contraseña?',
  'fullAuth.email_auth.menta': 'Menta',
  'fullAuth.email_auth.other_people_may_see_this_with_your_group_activi':
    'Otras personas pueden ver esto con tu grupo de actividades y fotos de eventos.',
  'fullAuth.email_auth.password': 'Contraseña',
  'fullAuth.email_auth.sign_in_to_save_this_promise_to_your_menta_accou':
    'Inicia sesión para guardar esta promesa a tu cuenta Menta.',
  'fullAuth.email_auth.sign_in_with_email': 'Inicia sesión con correo',
  'fullAuth.email_auth.use_6_or_more_characters': 'Usa 6 o más caracteres.',
  'fullAuth.email_auth.use_an_email_you_can_access_if_you_ever_need_to_':
    'Usa un correo que puede acceder si alguna vez necesita recuperar tu cuenta.',
  'fullAuth.email_auth.username': 'Nombre de usuario',
  'fullAuth.email_auth.you_example_com': 'you@example.com',
  'fullAuth.legal_acceptance.agree_and_continue': 'De acuerdo y continuar',
  'fullAuth.legal_acceptance.back': 'Atrás',
  'fullAuth.legal_acceptance.before_you': 'Antes de ti',
  'fullAuth.legal_acceptance.checking_the_current_legal_documents':
    'Verificación de los documentos jurídicos actuales',
  'fullAuth.legal_acceptance.continue': 'Continúa.',
  'fullAuth.legal_acceptance.couldn_t_check_your_agreement':
    'No se ha podido Comprueba tu acuerdo',
  'fullAuth.legal_acceptance.create': 'crear.',
  'fullAuth.legal_acceptance.i_agree_to_menta_s_terms_of_use_and_community_st':
    'I aceptar a de Menta términos de usar y comunidad normas, y reconocer el privacidad política.',
  'fullAuth.legal_acceptance.leave_legal_review': 'Dejar la revisión legal',
  'fullAuth.legal_acceptance.menta': 'Menta',
  'fullAuth.legal_acceptance.menta_mascot_beside_your_account_confirmation':
    'Mascota Menta junto a la confirmación de tu cuenta',
  'fullAuth.legal_acceptance.try_again': 'Inténtalo de nuevo.',
  'fullAuth.legal_acceptance.you_can_go_back_without_agreeing_your_account_an':
    'Puedes volver sin estar de acuerdo. Tu cuenta y las promesas existentes permanecen disponibles.',
  'fullAuth.login.menta': 'Menta',
  'fullAuth.notification_settings.a_test_is_already_on_the_way':
    'Una prueba ya está en camino',
  'fullAuth.notification_settings.allow_notifications':
    'Permitir notificaciones',
  'fullAuth.notification_settings.allow_notifications_first':
    'Permitir las notificaciones primero',
  'fullAuth.notification_settings.back_to_settings':
    'Volver a la configuración',
  'fullAuth.notification_settings.check_again_before_turning_on_proof_reminders':
    'Revise de nuevo antes de encender recordatorios de pruebas.',
  'fullAuth.notification_settings.check_notification_permission':
    'Reviso del permiso de notificación',
  'fullAuth.notification_settings.check_notification_permission_and_try_the_test_a':
    'Compruebe el permiso de notificación y vuelva a probar el examen en un momento.',
  'fullAuth.notification_settings.choice_saved': 'Elección salvada',
  'fullAuth.notification_settings.choose_daily_proof_reminders_and_updates_when_a_':
    'Elige recordatorios y actualizaciones de pruebas diarias cuando una promesa termine.',
  'fullAuth.notification_settings.choose_notifications_for_menta_then_return_here':
    'Elige Notificaciones para Menta, y luego vuelve aquí.',
  'fullAuth.notification_settings.choose_the_notifications_you_want_from_menta':
    'Elija las notificaciones que desee de Menta.',
  'fullAuth.notification_settings.choose_the_notifications_you_want_from_menta_bel':
    'Elija las notificaciones que desee de Menta a continuación.',
  'fullAuth.notification_settings.choose_which_group_and_progress_updates_menta_ma':
    'Elige qué actualizaciones de grupo y progreso puede enviar Menta.',
  'fullAuth.notification_settings.confirmed_milestones_momenta_and_streak_changes':
    'Marcados confirmados, Momenta y cambios de racha.',
  'fullAuth.notification_settings.could_not_check_phone_notifications':
    'No se puede comprobar las notificaciones de celular',
  'fullAuth.notification_settings.could_not_load_notification_settings':
    'No se pudo cargar la configuración de notificación.',
  'fullAuth.notification_settings.could_not_load_notification_settings_2':
    'No se puede cargar la configuración de notificación',
  'fullAuth.notification_settings.could_not_open_phone_settings':
    'No se puede abrir la configuración del celular',
  'fullAuth.notification_settings.could_not_save_your_choice':
    'No podía guardar tu elección',
  'fullAuth.notification_settings.delivery_and_timing': 'Entrega y tiempo',
  'fullAuth.notification_settings.email_choice_did_not_change':
    'La elección de correo no cambió',
  'fullAuth.notification_settings.email_updates': 'Actualizaciones de correo',
  'fullAuth.notification_settings.email_updates_are_off':
    'Las actualizaciones de correo están apagadas',
  'fullAuth.notification_settings.email_updates_are_on':
    'Las actualizaciones de correo están en',
  'fullAuth.notification_settings.email_updates_are_still_off':
    'Las actualizaciones de correo todavía están apagadas',
  'fullAuth.notification_settings.email_updates_are_unavailable':
    'Las actualizaciones de correo no están disponibles',
  'fullAuth.notification_settings.if_it_does_not_save_menta_will_put_your_previous':
    'Si no se ahorra, Menta pondrá tu decisión anterior de vuelta.',
  'fullAuth.notification_settings.it_should_arrive_shortly_tap_it_to_return_to_not':
    'Debe llegar pronto. Pulse para volver a Configuración de Notificación.',
  'fullAuth.notification_settings.keep_notifications_off':
    'Mantenga las notificaciones fuera',
  'fullAuth.notification_settings.loading_notification_settings':
    'Configuración de notificación de carga',
  'fullAuth.notification_settings.loading_your_notification_settings':
    'Carga de la configuración de la notificación.',
  'fullAuth.notification_settings.menta_can_resume_notifications_after_this_time':
    'Menta puede reanudar las notificaciones después de este tiempo.',
  'fullAuth.notification_settings.menta_could_not_connect_this_email_safely_so_you':
    'Menta no podía conectar este correo de forma segura, por lo que tu consentimiento no estaba habilitado.',
  'fullAuth.notification_settings.menta_could_not_finish_notification_registration':
    'Menta no pudo terminar el registro de notificación. Inténtelo de nuevo en un momento.',
  'fullAuth.notification_settings.menta_does_not_send_notifications_during_these_h':
    'Menta no envía notificaciones durante estas horas. Pueden llegar después.',
  'fullAuth.notification_settings.menta_does_not_send_notifications_during_this_lo':
    'Menta no envía notificaciones durante esta ventana local.',
  'fullAuth.notification_settings.menta_is_checking_this_phone_and_your_active_pro':
    'Menta está revisando este celular y tus promesas activas.',
  'fullAuth.notification_settings.menta_is_checking_this_phone_before_it_queues_th':
    'Menta está revisando este celular antes de que cola la prueba.',
  'fullAuth.notification_settings.menta_is_finishing_notification_setup_for_this_p':
    'Menta está terminando la configuración de notificación para este celular.',
  'fullAuth.notification_settings.menta_may_remind_you_while_proof_is_due_or_a_pro':
    'Menta puede recordarte mientras la prueba es debida o una promesa está terminando, y esperará durante horas tranquilas.',
  'fullAuth.notification_settings.menta_may_send_occasional_product_news_to_your_a':
    'Menta puede enviar noticias de producto ocasional a tu cuenta de correo. Tú puede apagar esto aquí en cualquier momento.',
  'fullAuth.notification_settings.menta_needs_a_confirmed_account_email_before_thi':
    'Menta necesita un email de cuenta confirmado antes de que esta opción pueda cambiar.',
  'fullAuth.notification_settings.menta_product_news':
    'Noticias de productos Menta',
  'fullAuth.notification_settings.menta_removed_this_email_from_product_update_del':
    'Menta eliminó este correo de la entrega actualizada de productos.',
  'fullAuth.notification_settings.menta_will_not_send_proof_or_promise_ending_remi':
    'Menta no enviará recordatorios de prueba ni de fin de promesas a menos que los vuelvas a encender.',
  'fullAuth.notification_settings.menta_will_use_this_choice_for_future_notificati':
    'Menta utilizará esta opción para futuras notificaciones.',
  'fullAuth.notification_settings.new_proof_to_review_review_outcomes_check_ins_an':
    'Nuevas pruebas para revisar, resultados de revisión, registros de asistencia y cambios de grupo.',
  'fullAuth.notification_settings.no_notification_was_queued':
    'No se ha interrumpido la notificación.',
  'fullAuth.notification_settings.nothing_was_sent_try_again_in_a_moment':
    'No se envió nada, intenta de nuevo en un momento.',
  'fullAuth.notification_settings.notification_setup_did_not_finish':
    'No se ha terminado la configuración de notificación',
  'fullAuth.notification_settings.notifications': 'Notificación',
  'fullAuth.notification_settings.promise_context_title':
    'Recordatorios de promesas',
  'fullAuth.notification_settings.promise_context_body':
    'Esta hora de recordatorio se aplica a todas las promesas activas. Los horarios siguen {timeZone}.',
  'fullAuth.notification_settings.back_to_promise': 'Volver a la promesa',
  'fullAuth.notification_settings.notifications_are_off':
    'No se han notificado las notificaciones',
  'fullAuth.notification_settings.notifications_are_still_off':
    'Las notificaciones siguen sin ser',
  'fullAuth.notification_settings.notifications_off':
    'Notificaciones desactivadas',
  'fullAuth.notification_settings.old_reminders_may_still_be_on_this_phone':
    'Los viejos recordatorios pueden estar todavía en este celular',
  'fullAuth.notification_settings.open_phone_settings':
    'Configuración de celular abierta',
  'fullAuth.notification_settings.open_your_phone_settings_choose_menta_then_notif':
    'Abre la configuración del celular, selecciona Menta, luego notificaciones para permitir recordatorios.',
  'fullAuth.notification_settings.open_your_phone_settings_choose_menta_then_notif_2':
    'Abre la configuración del celular, selecciona Menta, luego notificaciones, y permita notificaciones.',
  'fullAuth.notification_settings.opening_phone_settings':
    'Ajustes del celular de apertura',
  'fullAuth.notification_settings.optional_menta_product_news_this_is_separate_fro':
    'Opcional noticias de productos Menta. Esto es separado de las notificaciones de cuenta y prueba.',
  'fullAuth.notification_settings.people_and_progress': 'Personas y progreso',
  'fullAuth.notification_settings.phone_controls': 'Controles de celular',
  'fullAuth.notification_settings.phone_notification_check_failed':
    'No se ha registrado la notificación de celular',
  'fullAuth.notification_settings.phone_notification_settings':
    'Ajustes de notificación de celular',
  'fullAuth.notification_settings.preferred_time_formattedremindertime_a_proof_dea':
    'Tiempo preferido: {formattedReminderTime}. Un plazo de prueba o horas tranquilas pueden cambiar el tiempo real.',
  'fullAuth.notification_settings.preferred_time_formattedremindertime_notificatio':
    'Tiempo preferido: {formattedReminderTime}. Las notificaciones están apagadas en este celular.',
  'fullAuth.notification_settings.preparing_a_test_notification':
    'Preparación de una notificación de prueba',
  'fullAuth.notification_settings.preparing_proof_reminders':
    'Preparación de recordatorios de pruebas',
  'fullAuth.notification_settings.promise_reminders':
    'Recordatorios de promesa',
  'fullAuth.notification_settings.proof_reminders': 'Pruebas de recordatorios',
  'fullAuth.notification_settings.proof_reminders_are_off':
    'Los recordatorios de prueba están fuera',
  'fullAuth.notification_settings.proof_reminders_are_ready':
    'Los recordatorios de prueba están listos',
  'fullAuth.notification_settings.proof_reminders_are_ready_on_this_phone':
    'Los recordatorios de prueba están listos en este celular',
  'fullAuth.notification_settings.proof_reminders_saved':
    'Pruebas de recordatorios guardadas',
  'fullAuth.notification_settings.quiet_hours': 'Horas tranquilas',
  'fullAuth.notification_settings.quiet_hours_and_delivery':
    'Horas tranquilas y entrega',
  'fullAuth.notification_settings.quiet_hours_end': 'Horas tranquilas terminan',
  'fullAuth.notification_settings.quiet_hours_formattedquiethours':
    'Horas tranquilas {formattedQuietHours}',
  'fullAuth.notification_settings.quiet_hours_not_saved':
    'Horas tranquilas no guardadas',
  'fullAuth.notification_settings.quiet_hours_saved':
    'Horas tranquilas salvadas',
  'fullAuth.notification_settings.quiet_hours_start': 'Horas tranquilas',
  'fullAuth.notification_settings.reload_your_saved_notification_choices':
    'Recarga tus opciones de notificación guardadas',
  'fullAuth.notification_settings.reminder_setup_did_not_finish':
    'La configuración de recordatorio no terminó',
  'fullAuth.notification_settings.reminder_time': 'Tiempo de recordatorio',
  'fullAuth.notification_settings.reminder_time_did_not_update_on_this_phone':
    'El tiempo de recordatorio no se actualizó en este celular',
  'fullAuth.notification_settings.reviews_and_group_activity':
    'Reseñas y actividad grupal',
  'fullAuth.notification_settings.save_quiet_hours': 'Ahorra horas tranquilas',
  'fullAuth.notification_settings.saving_quiet_hours': 'Horas tranquilas',
  'fullAuth.notification_settings.saving_your_choice': 'Guardando tu elección',
  'fullAuth.notification_settings.saving_your_choice_2':
    'Salvando tu elección...',
  'fullAuth.notification_settings.saving_your_email_choice':
    'Salvando tu elección de correo...',
  'fullAuth.notification_settings.send_one_real_notification_to_this_signed_in_pho':
    'Envía una notificación real a este celular firmado.',
  'fullAuth.notification_settings.send_test_notification':
    'Enviar notificación de prueba',
  'fullAuth.notification_settings.set_quiet_hours_email_and_phone_notification_opt':
    'Establecer horas tranquilas, opciones de notificación de correo y celular.',
  'fullAuth.notification_settings.sign_in_again': 'Inicia sesión de nuevo',
  'fullAuth.notification_settings.sign_in_again_to_send_a_test':
    'Inicia sesión de nuevo para enviar una prueba',
  'fullAuth.notification_settings.sounds_previews_focus_and_scheduled_delivery':
    'Sonidos, previsualizaciones, Focus y entrega programada.',
  'fullAuth.notification_settings.sounds_previews_focus_and_scheduled_delivery_are':
    'Sonidos, previsualizaciones, Focus y entrega programada son propiedad de tu celular.',
  'fullAuth.notification_settings.streaks_and_momenta': 'Rachas y Momenta',
  'fullAuth.notification_settings.test_notification_queued':
    'Aviso de prueba archivado',
  'fullAuth.notification_settings.test_notification_was_not_queued':
    'No se ha efectuado ninguna notificación de prueba',
  'fullAuth.notification_settings.test_notifications':
    'Notificaciones de prueba',
  'fullAuth.notification_settings.the_range_can_cross_midnight':
    'El rango puede cruzar la medianoche.',
  'fullAuth.notification_settings.there_are_no_active_promises_to_schedule_yet_men':
    'Menta no tiene ninguna promesa activa de programar aún. Menta utilizará esta opción cuando inicies una.',
  'fullAuth.notification_settings.this_phone_is_not_ready_yet':
    'Este celular no está listo todavía',
  'fullAuth.notification_settings.this_phone_is_ready_for_menta_notifications':
    'Este celular está listo para notificaciones Menta',
  'fullAuth.notification_settings.this_phone_may_show_a_reminder_at_your_preferred':
    'Este celular puede mostrar un recordatorio en tu momento preferido para las promesas activas.',
  'fullAuth.notification_settings.this_phone_must_allow_menta_notifications_before':
    'Este celular debe permitir notificaciones Menta antes de que se pueda enviar un examen.',
  'fullAuth.notification_settings.this_phone_will_not_show_menta_notifications_unt':
    'Este celular no mostrará notificaciones Menta hasta que las enciendas.',
  'fullAuth.notification_settings.to_turn_them_on': 'Para encenderlos',
  'fullAuth.notification_settings.try_again': 'Inténtalo de nuevo.',
  'fullAuth.notification_settings.try_again_before_relying_on_notifications_from_t':
    'Intente de nuevo antes de confiar en las notificaciones de este celular.',
  'fullAuth.notification_settings.try_again_before_turning_on_reminders_for_this_p':
    'Inténtalo de nuevo antes de encender recordatorios para este celular.',
  'fullAuth.notification_settings.turning_off_email_updates':
    'Apagando actualizaciones de correo',
  'fullAuth.notification_settings.turning_on_email_updates':
    'Activar actualizaciones de correo',
  'fullAuth.notification_settings.wait_one_minute_before_requesting_another_test':
    'Espera un minuto antes de solicitar otra prueba.',
  'fullAuth.notification_settings.your_choice_is_saved_but_an_old_reminder_may_sti':
    'Tu elección es salvada, pero un viejo recordatorio puede aparecer. Prueba de nuevo.',
  'fullAuth.notification_settings.your_choice_is_saved_but_proof_reminders_are_not':
    'Tu elección es salvada, pero los recordatorios de la prueba aún no están listos. Inténtelo de nuevo.',
  'fullAuth.notification_settings.your_choice_is_saved_but_proof_reminders_are_not_2':
    'Tu elección es guardada, pero los recordatorios de la prueba no están listos en este celular. Inténtelo de nuevo.',
  'fullAuth.notification_settings.your_choices_are_saved_but_this_phone_cannot_sho':
    'Tus opciones se guardan, pero este celular no puede mostrar notificaciones Menta hasta que las permita.',
  'fullAuth.notification_settings.your_current_choice_remains_authoritative_until_':
    'Tu elección actual sigue siendo autorizada hasta que esto ahorra.',
  'fullAuth.notification_settings.your_current_quiet_hours_stay_in_place_until_thi':
    'Tus horas de silencio se mantienen en tu lugar hasta que esto ahorra.',
  'fullAuth.notification_settings.your_menta_opt_out_is_saved_provider_removal_wil':
    'Tu opción de Menta se guarda. La eliminación del proveedor se reiniciará cuando esta cuenta se conecta próximamente.',
  'fullAuth.notification_settings.your_phone_did_not_return_a_notification_setting':
    'Tu celular no devolvió un ajuste de notificación.',
  'fullAuth.notification_settings.your_phone_now_allows_notifications':
    'Tu celular ahora permite notificaciones',
  'fullAuth.notification_settings.your_preferred_time_is_saved_but_this_phone_may_':
    'Tu tiempo preferido es guardado, pero este celular puede todavía usar el tiempo antiguo. Inténtelo de nuevo.',
  'fullAuth.notification_settings.your_previous_email_choice_is_still_active':
    'Tu elección previa de correo sigue activa.',
  'fullAuth.notification_settings.your_previous_notification_choice_is_still_activ':
    'Tu opción de notificación previa sigue activa.',
  'fullAuth.notification_settings.your_previous_quiet_hours_remain_active':
    'Tus horas de silencio anteriores siguen activas.',
  'fullAuth.notification_settings.your_promises_still_work_menta_will_not_ask_agai':
    'Tus promesas todavía funcionan. Menta no preguntará otra vez aquí.',
  'fullAuth.notification_settings.your_promises_still_work_this_phone_will_not_sho':
    'Tus promesas todavía funcionan. Este celular no mostrará las notificaciones de prueba, revisión o grupo.',
  'fullAuth.notification_settings.your_proof_reminder_choice_is_unchanged_your_pho':
    'Tu elección de recordatorio de prueba no cambia, tu celular preguntará después.',
  'fullAuth.onboarding.32_character_code': 'Código de 32 caracteres',
  'fullAuth.onboarding.accountability': 'Rendición de cuentas',
  'fullAuth.onboarding.activation_needs_attention':
    'La activación necesita atención',
  'fullAuth.onboarding.add_code_and_create': 'Agregar código y crear',
  'fullAuth.onboarding.add_it_now_or_create_your_promise_without_one_gr':
    'Añádalo ahora, o cree tu promesa sin uno. grupo invita a trabajar por separado.',
  'fullAuth.onboarding.add_referral_code': 'Añada código de referencia',
  'fullAuth.onboarding.after_it_s_created_menta_adds':
    'después Es creado, Menta añade',
  'fullAuth.onboarding.agree_and_choose_sign_in':
    'Acordar y elegir el registro',
  'fullAuth.onboarding.agree_and_continue': 'De acuerdo y continuar',
  'fullAuth.onboarding.back': 'Atrás',
  'fullAuth.onboarding.back_to_backlabel': 'Volver a {backLabel}',
  'fullAuth.onboarding.choose_a_length_you_can_genuinely_follow_through':
    'Elige una longitud que puedas seguir genuinamente.',
  'fullAuth.onboarding.choose_how_you_want_to_continue_your_draft_stays':
    'Elige cómo quieres continuar. Tu borrador se queda en este celular.',
  'fullAuth.onboarding.choose_length': 'Elija la longitud',
  'fullAuth.onboarding.choose_proof': 'Elija la prueba',
  'fullAuth.onboarding.choose_the_proof_you_will_add_and_who_you_want_b':
    'Elige la prueba que añadirás y a quién quieres a tu lado.',
  'fullAuth.onboarding.choose_what_you_ll_add_when_it_s_done_you_can_in':
    'elegir qué Vas a añadir cuando Es hecho. tú puede Invitar personas a revisión lo después tú guardar.',
  'fullAuth.onboarding.complete_this_promise_and_add_a_proofname_as_pro':
    'Completa esta promesa y añade un {proofName} como prueba.',
  'fullAuth.onboarding.confirm_the_required_documents':
    'Confirma los documentos necesarios.',
  'fullAuth.onboarding.confirming_code': 'Código de confirmación...',
  'fullAuth.onboarding.continue_to_referral': 'Continuar con la remisión',
  'fullAuth.onboarding.continue_to_save': 'Continuar para guardar',
  'fullAuth.onboarding.continue_with_apple': 'Continuar con Apple',
  'fullAuth.onboarding.continue_with_email': 'Continuar con el correo',
  'fullAuth.onboarding.continue_with_google': 'Continuar con Google',
  'fullAuth.onboarding.could_not_finish_setup':
    'No se puede terminar la configuración',
  'fullAuth.onboarding.create_a_group': 'Crear un grupo',
  'fullAuth.onboarding.review_promise_invite': 'Promesa de revisión invitada',
  'fullAuth.onboarding.promise_invite_held':
    'Tu invitación de promesa se mantiene. Revise el siguiente; unirse sigue siendo una acción separada.',
  'fullAuth.onboarding.review_group_invite': 'grupo de examen invitado',
  'fullAuth.onboarding.group_invite_held':
    'Tu grupo de invitación sigue siendo sostenido. Revise el siguiente; unirse sigue siendo una acción separada.',
  'fullAuth.onboarding.open_event': 'Evento abierto',
  'fullAuth.onboarding.event_held':
    'Tu evento todavía se celebra. Abrelo siguiente; este recibo de promesa no reclama participación.',
  'fullAuth.onboarding.create_my_group': 'Crear mi grupo',
  'fullAuth.onboarding.create_my_group_detail':
    'Tu promesa se salva. Crea tu nuevo grupo siguiente; ningún grupo existe hasta que Menta lo confirme.',
  'fullAuth.onboarding.create_it_first_menta_will_then_add':
    'Crealo primero. Menta añadirá',
  'fullAuth.onboarding.create_without_a_code': 'Crear sin código',
  'fullAuth.onboarding.creating_your_first_promise':
    'Creando tu primera promesa',
  'fullAuth.onboarding.creating_your_first_promise_2':
    'Creando tu primera promesa...',
  'fullAuth.onboarding.days': 'días',
  'fullAuth.onboarding.decide_what_finished_will_look_like':
    'Decidir cómo será lo que termine.',
  'fullAuth.onboarding.do_you_have_a_referral_code':
    '¿Tiene un código de referencia?',
  'fullAuth.onboarding.edit': 'Editar',
  'fullAuth.onboarding.every_day': 'Cada día',
  'fullAuth.onboarding.every_day_2': '· Todos los días ·',
  'fullAuth.promise.frequency.once_a_week': 'Una semana',
  'fullAuth.onboarding.first_promise': 'Primera promesa',
  'fullAuth.onboarding.first_promise_firstpromisecost_momenta_after_cre':
    'Primera promesa, {firstPromiseCost} Momenta. Después de la creación, {welcomeBonus} da la bienvenida a Momenta para opciones posteriores.',
  'fullAuth.onboarding.free': 'libre.',
  'fullAuth.onboarding.how_long_do_you_want_to_keep_this_promise':
    '¿Cuánto tiempo quieres cumplir esta promesa?',
  'fullAuth.onboarding.how_will_you_prove_it': '¿Cómo lo probarás?',
  'fullAuth.onboarding.i_agree_to_menta_s_terms_of_use_and_community_st':
    'I aceptar a de Menta términos de usar y comunidad normas, y reconocer el privacidad política.',
  'fullAuth.onboarding.invite': 'Invitar',
  'fullAuth.onboarding.invite_people_after_this_promise_is_saved_member':
    'Invitar a la gente después de que esta promesa sea salvada. Los miembros pueden revisar tu prueba.',
  'fullAuth.onboarding.just_me': 'Sólo yo',
  'fullAuth.onboarding.keep_it_specific_enough_that_you_will_know_when_':
    'Mantenga lo suficientemente específico que sabrás cuando esté terminado.',
  'fullAuth.onboarding.legal_confirmation_did_not_finish':
    'La confirmación legal no terminó.',
  'fullAuth.onboarding.legal_review_was_not_completed':
    'No se concluyó el examen jurídico.',
  'fullAuth.onboarding.length': 'Duración',
  'fullAuth.onboarding.local_draft': 'Proyecto de proyecto local',
  'fullAuth.onboarding.menta': 'Menta',
  'fullAuth.onboarding.menta_confirms_the_first_deadline_when_you_save':
    'Menta confirma el primer plazo cuando se ahorra.',
  'fullAuth.onboarding.menta_confirms_your_first_deadline_when_the_prom':
    'Menta confirma tu primer plazo cuando se crea la promesa.',
  'fullAuth.onboarding.menta_is_confirming_your_promise_and_momenta_bal':
    'Menta está confirmando tu promesa y el equilibrio Momenta.',
  'fullAuth.onboarding.menta_mascot_offering_you_a_bag_of_momenta_token':
    'La mascota de Menta te ofrece una bolsa de fichas Momenta',
  'fullAuth.onboarding.menta_mascot_waving_you_toward_saving_this_promi':
    'Menta Mascota te saluda para guardar esta promesa',
  'fullAuth.onboarding.menta_saved_the_promise_and_confirmed_your_accou':
    'Menta salvó la promesa y confirmó tu cuenta desde el mismo recibo del servidor.',
  'fullAuth.onboarding.message_your_draft_is_still_here':
    '{message} Tu borrador sigue aquí.',
  'fullAuth.onboarding.momenta': 'Momenta',
  'fullAuth.onboarding.momenta_for_extra_promises_groups_freezes_and_it':
    'Momenta para promesas adicionales, grupos, congelaciones y artículos.',
  'fullAuth.onboarding.momenta_for_later_choices':
    'Momenta para opciones posteriores.',
  'fullAuth.onboarding.my_promise': 'Mi promesa',
  'fullAuth.onboarding.next_due': 'Siguiente debido',
  'fullAuth.onboarding.note': 'Nota',
  'fullAuth.onboarding.opening_email': 'E-mail de apertura...',
  'fullAuth.onboarding.photo': 'Foto',
  'fullAuth.onboarding.preview_my_promise': 'Previsualizar mi promesa',
  'fullAuth.onboarding.promise_length': 'Longitud de la promesa',
  'fullAuth.onboarding.promise_saved_and_confirmed':
    'Promesa salvada y confirmada',
  'fullAuth.onboarding.proof': 'Prueba',
  'fullAuth.onboarding.proof_and_support': 'PRUEBA Y APOYO',
  'fullAuth.onboarding.proof_cadence': 'Probación de cadencia',
  'fullAuth.onboarding.providername_sign_in_did_not_finish':
    'El registro {providerName} no terminó.',
  'fullAuth.onboarding.read_the_current_account_and_community_documents':
    'Lea la cuenta actual y los documentos comunitarios antes de crear tu promesa.',
  'fullAuth.onboarding.record_a_short_clip': 'Grabar un corto clip.',
  'fullAuth.onboarding.referral_code': 'Código de referencia',
  'fullAuth.onboarding.reopen_onboarding_before_continuing_with_email':
    'Repite a bordo antes de continuar con el correo.',
  'fullAuth.onboarding.restored_from_this_phone':
    'Restaurado desde este celular',
  'fullAuth.onboarding.return_to_draft': 'Regreso al proyecto',
  'fullAuth.onboarding.review_menta_s_terms': 'revisión de Menta términos',
  'fullAuth.onboarding.review_your_promise': 'Revisa tu promesa',
  'fullAuth.onboarding.save_this_promise_to_menta':
    'Guarda esta promesa a Menta.',
  'fullAuth.onboarding.save_your_promise': 'Guarda tu promesa',
  'fullAuth.onboarding.schedule': 'Cuadro',
  'fullAuth.onboarding.schedule_every_day': 'Horario, todos los días',
  'fullAuth.onboarding.show_another_example': 'Mostrar otro ejemplo',
  'fullAuth.onboarding.sign_in_to_save_my_promise':
    'Inscríbete para guardar mi promesa',
  'fullAuth.onboarding.start_privately_you_can_invite_people_later':
    'Puedes invitar a la gente más tarde.',
  'fullAuth.onboarding.start_with_one_thing_that_matters_today':
    'Empieza con una cosa que importa hoy.',
  'fullAuth.onboarding.stay_here_and_try_again_so_menta_can_keep_this_p':
    'Quédate aquí y prueba de nuevo para que Menta pueda mantener esta promesa en este celular.',
  'fullAuth.onboarding.stay_here_and_try_email_sign_in_again_so_menta_c':
    'Quédate aquí y prueba el email de nuevo para que Menta pueda mantener esta promesa en este celular.',
  'fullAuth.onboarding.take_one_photo': 'Toma una foto.',
  'fullAuth.onboarding.this_choice_sets_your_next_step_it_does_not_add_':
    'Esta elección establece tu próximo paso. No añade a nadie o crea un grupo todavía.',
  'fullAuth.onboarding.use_duration_days': 'Usa {duration} días',
  'fullAuth.onboarding.video': 'Video',
  'fullAuth.onboarding.welcome_momenta': 'Bienvenido Momenta',
  'fullAuth.onboarding.what_s_one_thing_you_want_to_do':
    "qué\'s una cosa tú querer a hacer?",
  'fullAuth.onboarding.who_will_hold_you_accountable':
    '¿Quién te hará responsable?',
  'fullAuth.onboarding.write_what_happened': 'Escribe lo que pasó.',
  'fullAuth.onboarding.you_can_review_these_choices_before_menta_saves_':
    'Puedes revisar estas opciones antes de que Menta salve cualquier cosa.',
  'fullAuth.onboarding.your_account_changed': 'Tu cuenta cambió.',
  'fullAuth.onboarding.your_draft_could_not_be_saved_yet':
    'Tu borrador aún no se puede guardar.',
  'fullAuth.onboarding.your_draft_is_private_on_this_phone_sign_in_to_k':
    'Tu borrador es privado en este celular.',
  'fullAuth.onboarding.your_draft_is_still_private_on_this_phone':
    'Tu borrador sigue siendo privado en este celular.',
  'fullAuth.onboarding.your_first_promise': 'TU PRIMERA PROMESA',
  'fullAuth.onboarding.for_promise': 'Para «{promise}»',
  'fullAuth.onboarding.check_ins': '{count} registros',
  'fullAuth.onboarding.your_first_promise_2': 'Tu primera promesa',
  'fullAuth.onboarding.your_first_promise_is': 'Tu primera promesa es',
  'fullAuth.onboarding.your_promise': 'Tu promesa',
  'fullAuth.onboarding.your_promise_2': 'TU PROMESA',
  'fullAuth.onboarding.your_promise_is_ready': 'Tu promesa está lista.',
  'fullAuth.onboarding.your_promise_is_safe_confirm_the_documents_below':
    'Tu promesa es segura. Confirma los documentos a continuación antes de crearlo.',
  'fullAuth.onboarding.your_promise_is_safe_try_again_before_continuing':
    'Tu promesa es segura, intenta de nuevo antes de continuar.',
  'fullAuth.onboarding.your_promise_is_still_safe_review_the_current_do':
    'Tu promesa sigue siendo segura. Revisa los documentos actuales cuando esté listo para continuar.',
  'fullAuth.password_recovery.change_my_password': 'Cambiar mi contraseña',
  'fullAuth.password_recovery.choose_a_new_password':
    'Elija una nueva contraseña',
  'fullAuth.password_recovery.close': 'Cerca',
  'fullAuth.password_recovery.close_password_reset': 'Cerrar contraseña',
  'fullAuth.password_recovery.confirm_password': 'Confirma contraseña',
  'fullAuth.password_recovery.couldn_t_change_your_password':
    'No se ha podido cambiar Tu contraseña',
  'fullAuth.password_recovery.enter_new_password': 'Ingrese nueva contraseña',
  'fullAuth.password_recovery.menta': 'Menta',
  'fullAuth.password_recovery.new_password': 'Nueva contraseña',
  'fullAuth.password_recovery.or_more_characters_both_entries_must_match':
    'o más caracteres. Ambas entradas deben coincidir.',
  'fullAuth.password_recovery.other_signed_in_devices_may_ask_for_the_new_pass':
    'Otros dispositivos que se inscriban pueden solicitar la nueva contraseña.',
  'fullAuth.password_recovery.password_changed': 'Cambió la contraseña',
  'fullAuth.password_recovery.re_enter_new_password':
    'Reintroducir nueva contraseña',
  'fullAuth.password_recovery.request_a_new_link': 'Solicitar un nuevo enlace',
  'fullAuth.password_recovery.request_a_new_link_your_draft_is_still_on_this_p':
    'Tu borrador sigue en este celular.',
  'fullAuth.password_recovery.return_to': 'Regresa a',
  'fullAuth.password_recovery.sign_in': 'Iniciar sesión',
  'fullAuth.password_recovery.sign_in_instead': 'Inicia sesión en tu lugar',
  'fullAuth.password_recovery.this_reset_link_has_expired':
    'Este enlace de reajuste ha expirado.',
  'fullAuth.password_recovery.use': 'Uso',
  'fullAuth.password_recovery.your_password_has_been_changed':
    'Tu contraseña ha sido cambiada.',
  'fullAuth.report_issue.1_open_2_tap_3_notice': '1. Abierto... 2. Pulsa... 3.',
  'fullAuth.report_issue.add_a_screenshot': 'Añadir una captura de pantalla',
  'fullAuth.report_issue.add_more_detail': 'Añadir más detalles',
  'fullAuth.report_issue.add_the_basics': 'Agregue los conceptos básicos',
  'fullAuth.report_issue.attach_a_jpeg_png_or_webp_screenshot':
    'Adjunte una captura de pantalla JPEG, PNG o WebP.',
  'fullAuth.report_issue.back_to_support': 'Volver a apoyar',
  'fullAuth.report_issue.choose_a_screenshot_smaller_than_8_mb':
    'Elija una captura de pantalla más pequeña que 8 MB.',
  'fullAuth.report_issue.choose_an_image': 'Elija una imagen',
  'fullAuth.report_issue.choose_another_report': 'Elija otro informe',
  'fullAuth.report_issue.choose_screenshot': 'Elija captura de pantalla',
  'fullAuth.report_issue.could_not_find_this_saved_report':
    'No pude encontrar este informe guardado',
  'fullAuth.report_issue.crash_reference': 'Referencia Crash',
  'fullAuth.report_issue.expected_result_optional':
    'Resultado previsto, opcional',
  'fullAuth.report_issue.expected_result_optional_2':
    'Resultado previsto (opcional)',
  'fullAuth.report_issue.feedback_received': 'Revisiones recibidas',
  'fullAuth.report_issue.feedback_required': 'Comentarios necesaria',
  'fullAuth.report_issue.give_the_report_a_short_title_and_explain_what_h':
    'Dar el informe un título corto y explicar lo que pasó.',
  'fullAuth.report_issue.inappropriate': 'inapropiado',
  'fullAuth.report_issue.it_is_not_saved_under_this_account_nothing_was_c':
    'No se guarda bajo esta cuenta. Nada fue cambiado.',
  'fullAuth.report_issue.keep_this_screen_open_while_you_write_or_copy_th':
    'Mantenga esta pantalla abierta mientras escribe, o copiar el texto antes de salir.',
  'fullAuth.report_issue.last_step': 'Último paso',
  'fullAuth.report_issue.menta_could_not_open_your_photo_library_try_agai':
    'Menta no podía abrir tu biblioteca de fotos. Inténtelo de nuevo.',
  'fullAuth.report_issue.menta_could_not_preserve_this_report_locally_kee':
    'Menta no pudo preservar este informe localmente. Mantenga esta pantalla abierta; nada fue entregado para apoyar.',
  'fullAuth.report_issue.menta_does_not_add_device_diagnostics_to_this_re':
    'Menta no añade diagnósticos de dispositivos a este informe.',
  'fullAuth.report_issue.menta_includes_the_item_or_screen_you_reported':
    'Menta incluye el elemento o la pantalla que reportaste.',
  'fullAuth.report_issue.not_sent': 'no-sentido',
  'fullAuth.report_issue.open': 'abierto',
  'fullAuth.report_issue.preparing_private_report_draft':
    'Preparación del proyecto de informe privado',
  'fullAuth.report_issue.proof_upload_gets_stuck':
    'La carga de prueba se queda atrapada',
  'fullAuth.report_issue.reference': 'Referencia',
  'fullAuth.report_issue.remove': 'Retirar',
  'fullAuth.report_issue.replace_screenshot': 'Reemplazar captura de pantalla',
  'fullAuth.report_issue.report_an_issue': 'Informe una cuestión',
  'fullAuth.report_issue.report_not_sent': 'Informe no enviado',
  'fullAuth.report_issue.report_received': 'Informe recibido',
  'fullAuth.report_issue.retry_sending_report':
    'Informe de envío de reingresos',
  'fullAuth.report_issue.return_to_support': 'Regreso al apoyo',
  'fullAuth.report_issue.review_feedback': 'Revisiones de retroinformación',
  'fullAuth.report_issue.review_report': 'Informe de examen',
  'fullAuth.report_issue.screenshot_did_not_open':
    'Captura de pantalla no abrió',
  'fullAuth.report_issue.screenshot_is_too_large':
    'Captura de pantalla es demasiado grande',
  'fullAuth.report_issue.screenshot_optional': 'Captura de Pantalla (opcional)',
  'fullAuth.report_issue.selected_support_screenshot':
    'Pantallas de soporte seleccionadas',
  'fullAuth.report_issue.server_confirmed': 'servidor confirmado',
  'fullAuth.report_issue.share_feedback': 'Compartir información',
  'fullAuth.report_issue.short_title': 'Título corto',
  'fullAuth.report_issue.short_title_required': 'Título corto, requerido',
  'fullAuth.report_issue.sign_in_again_before_sending_this_private_report':
    'Inicia sesión otra vez antes de enviar este informe privado.',
  'fullAuth.report_issue.sign_in_required': 'Inscripción requerida',
  'fullAuth.report_issue.status': 'Situación',
  'fullAuth.report_issue.steps_to_reproduce_optional':
    'Pasos a reproducir, opcional',
  'fullAuth.report_issue.steps_to_reproduce_optional_2':
    'Pasos para reproducir (opcional)',
  'fullAuth.report_issue.support_reference': 'Referencia de soporte ·',
  'fullAuth.report_issue.this_comes_from_where_you_opened':
    'Esto viene de donde abriste',
  'fullAuth.report_issue.this_report_is_not_being_saved':
    'Este informe no se está guardando',
  'fullAuth.report_issue.type': 'tipo:',
  'fullAuth.report_issue.we_ll_show_a_support_reference_only_after_the_re':
    'Te enviaremos mostrar una asistencia Referencia solo después el informe llega. si el primera intento es poco claro, Vuelve a intentarlo usa el mismo informe comoí que lo podrá no crear una duplicado.',
  'fullAuth.report_issue.what_did_you_expect_menta_to_do':
    '¿Qué esperabas que Menta hiciera?',
  'fullAuth.report_issue.what_happened': '¿Qué pasó?',
  'fullAuth.report_issue.what_happened_required': 'Lo que pasó, requerido',
  'fullAuth.report_issue.what_i_would_change': 'Lo que cambiaría',
  'fullAuth.report_issue.what_were_you_doing_and_what_did_menta_show':
    '¿Qué hacías, y qué mostró Menta?',
  'fullAuth.report_issue.what_would_you_like_the_menta_team_to_know':
    '¿Qué le gustaría que el equipo de Menta lo supiera?',
  'fullAuth.report_issue.will_help_support_find_the_error':
    'ayudará a encontrar el error.',
  'fullAuth.report_issue.your_draft_stays_on_this_phone_until_you_send_it':
    'Tu borrador se queda en este celular hasta que lo envíe.',
  'fullAuth.report_issue.your_feedback': 'Tus comentarios',
  'fullAuth.report_issue.your_screenshot_will_be_sent_with_the_report_onl':
    'Tu captura de pantalla será enviada con el informe. Sólo el personal de soporte autorizado puede abrirla.',
  'fullAuth.settings.a_compatible_update_is_downloaded_and_ready':
    'Una actualización compatible se descarga y se prepara.',
  'fullAuth.settings.account_control': 'Control de la cuenta',
  'fullAuth.settings.account_was_not_deleted': 'No se suprimió la cuenta',
  'fullAuth.settings.active_view_or_manage_your_subscription':
    'Activo. Ver o gestionar tu suscripción.',
  'fullAuth.settings.ad_measurement': 'Medición de los anuncios',
  'fullAuth.settings.ad_privacy_choices': 'Opciones de privacidad de anuncios',
  'fullAuth.settings.ad_privacy_choices_did_not_open':
    'Opciones de privacidad de anuncios no se abren',
  'fullAuth.settings.advanced_diagnostics': 'Diagnóstico avanzado',
  'fullAuth.settings.advanced_diagnostics_are_off':
    'Diagnóstico avanzado está apagado',
  'fullAuth.settings.advanced_diagnostics_are_on':
    'Diagnóstico avanzado está en',
  'fullAuth.settings.advanced_diagnostics_are_still_off_check_your_co':
    'Los diagnósticos avanzados todavía están apagados. Compruebe tu conexión e inténtelo de nuevo.',
  'fullAuth.settings.ask_for_help_share_feedback_or_check_a_saved_rep':
    'Pida ayuda, comparta comentarios o compruebe un informe guardado.',
  'fullAuth.settings.back_to_you': 'Volver a ti',
  'fullAuth.settings.before_you_delete_your_account':
    'Antes de eliminar tu cuenta',
  'fullAuth.settings.check_for_updates': 'Consultar actualizaciones',
  'fullAuth.settings.check_your_connection_and_try_again':
    'Revise tu conexión e inténtelo de nuevo.',
  'fullAuth.settings.checking_for_updates': 'Comprobación de actualizaciones',
  'fullAuth.settings.checking_your_account': 'Revisando tu cuenta',
  'fullAuth.settings.checks_the_current_connection_and_known_account_':
    'Revisa la conexión actual y los detalles de la cuenta conocidos de nuevo.',
  'fullAuth.settings.close_and_reopen_menta_to_apply_the_downloaded_u':
    'Cerrar y reabrir Menta para aplicar la actualización descargada.',
  'fullAuth.settings.community_standards': 'Normas comunitarias',
  'fullAuth.settings.confirmation': 'Confirmación',
  'fullAuth.settings.connect_before_deleting_your_account':
    'Conectar antes de eliminar tu cuenta',
  'fullAuth.settings.connect_to_check_this_phone':
    'Conecta para comprobar este celular.',
  'fullAuth.settings.contact_support': 'Apoyo a los contactos',
  'fullAuth.settings.continue_to_sign_in': 'Continuar para iniciar sesión',
  'fullAuth.settings.could_not_check_your_account':
    'No podía revisar tu cuenta.',
  'fullAuth.settings.could_not_load_your_profile': 'No podía cargar tu perfil.',
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
  'fullAuth.settings.delete_account': 'Suprimir la cuenta',
  'fullAuth.settings.delete_account_will_be_available_when_this_check':
    'Eliminar cuenta estará disponible cuando termine este cheque.',
  'fullAuth.settings.deletion_result_unknown':
    'Resultado desconocido de la eliminación',
  'fullAuth.settings.do_not_send_another_request_yet_check_whether_yo':
    'No envíe otra solicitud todavía. Compruebe si todavía puede firmar, o el soporte de contacto.',
  'fullAuth.settings.download_the_latest_compatible_menta_update':
    'Descargar la última actualización compatible Menta.',
  'fullAuth.settings.extra_performance_measurements_start_now':
    'Las mediciones de rendimiento extra comienzan ahora.',
  'fullAuth.settings.extra_performance_measurements_start_now_masked_':
    'Las mediciones de rendimiento extra comienzan ahora. La grabación de diagnóstico enmascarada comienza en las pantallas elegibles; volver a abrir Menta para aplicar todos los configuración de grabación Sentry.',
  'fullAuth.settings.feedback_and_support': 'Comentarios y apoyo',
  'fullAuth.settings.for_your_privacy_account_settings_stay_hidden_un':
    'Para tu privacidad, los configuración de cuenta permanecen ocultos hasta que se inscriba de nuevo.',
  'fullAuth.settings.help_and_feedback': 'Ayuda y retroalimentación',
  'fullAuth.settings.how_menta_handles_your_data':
    'Cómo Menta maneja tus datos.',
  'fullAuth.settings.keep_current_setting': 'Mantenga el ajuste actual',
  'fullAuth.settings.keep_my_account': 'Mantenga mi cuenta',
  'fullAuth.settings.label_did_not_open': '{label} no abrió',
  'fullAuth.settings.leave_a_review': 'Dejar una valoración',
  'fullAuth.settings.leave_this_device_your_menta_account_stays_activ':
    'Tu cuenta Menta sigue activa.',
  'fullAuth.settings.loading_account_specific_settings':
    'Configuración de carga específica de cuenta',
  'fullAuth.settings.measure_whether_meta_ads_helped_someone_use_ment':
    'Medir si los anuncios Meta ayudaron a alguien a usar Menta.',
  'fullAuth.settings.membership': 'Miembros',
  'fullAuth.settings.menta_cannot_check_whether_you_still_own_a_group':
    'Menta no puede comprobar si todavía posee un grupo. Revisa tus grupos antes de eliminar la cuenta. Eliminar Menta no cancela Menta Pro, así que gestiona la suscripción con Apple primero.',
  'fullAuth.settings.menta_could_not_check_for_updates':
    'Menta no pudo comprobar las actualizaciones',
  'fullAuth.settings.menta_could_not_delete_the_account_check_your_co':
    'Menta no pudo eliminar la cuenta. Compruebe tu conexión, y luego vuelva a intentarlo.',
  'fullAuth.settings.menta_could_not_end_this_session_your_account_an':
    'Menta no pudo terminar esta sesión. Tu cuenta y tu vista local no son cambiados.',
  'fullAuth.settings.menta_could_not_restart': 'Menta no podía reiniciar',
  'fullAuth.settings.menta_is_checking_for_the_latest_compatible_upda':
    'Menta está comprobando la última actualización compatible.',
  'fullAuth.settings.menta_is_up_to_date': 'Menta está al día',
  'fullAuth.settings.menta_pro': 'Menta Pro',
  'fullAuth.settings.menta_update_ready': 'Menta Actualización listo',
  'fullAuth.settings.menta_will_continue_using_its_current_safe_versi':
    'Menta seguirá utilizando tu versión segura actual.',
  'fullAuth.settings.needs_attention': 'Necesita atención',
  'fullAuth.settings.nothing_has_been_deleted': 'Nada ha sido eliminado',
  'fullAuth.settings.nothing_was_deleted_reconnect_then_try_again':
    'Nada fue eliminado. Reconectar, luego intentarlo de nuevo.',
  'fullAuth.settings.notifications': 'Notificación',
  'fullAuth.settings.offline': 'Sin conexión',
  'fullAuth.settings.open_when_connected': 'Abren cuando estén conectados.',
  'fullAuth.settings.opens_menta_pro_plans_purchase_restore_or_your_a':
    'Abre Menta Pro planes, restauración de compras o tu plan activo.',
  'fullAuth.settings.opens_sign_in_for_this_account':
    'Abre el registro de esta cuenta.',
  'fullAuth.settings.optional_performance_measurements':
    'Mediciones de rendimiento opcionales.',
  'fullAuth.settings.optional_performance_measurements_and_masked_dia':
    'Mediciones de rendimiento opcionales y grabación de diagnóstico enmascarada.',
  'fullAuth.settings.ordinary_crash_reports_stay_on':
    'Los informes ordinarios de choque siguen.',
  'fullAuth.settings.ordinary_crash_reports_stay_on_when_advanced_dia':
    'Los informes de choque ordinarios se mantienen cuando los diagnósticos avanzados están apagados.',
  'fullAuth.settings.other_settings_are_still_available_try_loading_t':
    'Otros configuración todavía están disponibles. Intente cargar el perfil de nuevo cuando la conexión está lista.',
  'fullAuth.settings.permanently_delete_your_account_and_menta_data':
    'Eliminar permanentemente tu cuenta y datos Menta.',
  'fullAuth.settings.plans_benefits_and_restore_purchases':
    'Planes, beneficios y restaura las compras.',
  'fullAuth.settings.preferences': 'Preferencias',
  'fullAuth.settings.press_restart_to_apply_the_downloaded_update':
    'Pulse Reini para aplicar la actualización descargada.',
  'fullAuth.settings.privacy_and_legal': 'Privacidad y legal',
  'fullAuth.settings.privacy_policy': 'Política de privacidad',
  'fullAuth.settings.profile_details': 'Detalles del perfil',
  'fullAuth.settings.proof_reminders_reviews_and_group_updates':
    'Pruebas de recordatorios, revisiones y actualizaciones de grupos.',
  'fullAuth.settings.read_menta_s_terms': 'leer de Menta términos.',
  'fullAuth.settings.reopen_menta_to_stop_diagnostic_recording_ordina':
    'Reabrir Menta para detener la grabación de diagnóstico.',
  'fullAuth.settings.restarting_menta': 'Reestrellante Menta',
  'fullAuth.settings.review_choices_used_for_sponsor_videos':
    'Opciones de revisión utilizadas para los videos de los patrocinadores.',
  'fullAuth.settings.review_deletion_confirmation':
    'Confirmación de la supresión de la revisión',
  'fullAuth.settings.review_the_current_terms_and_when_you_accepted_t':
    'Revisa los términos actuales y cuando los aceptas.',
  'fullAuth.settings.rules_for_promises_proof_and_groups':
    'Reglas para promesas, pruebas y grupos.',
  'fullAuth.settings.session': 'Período de sesiones',
  'fullAuth.settings.settings': 'Ajustes',
  'fullAuth.settings.share_your_experience_and_help_others_discover_m':
    'Comparte tu experiencia y ayuda a otros a descubrir Menta.',
  'fullAuth.settings.sign_in_again': 'Inicia sesión de nuevo',
  'fullAuth.settings.sign_in_again_before_deleting_your_account':
    'Inicia sesión de nuevo antes de eliminar tu cuenta.',
  'fullAuth.settings.sign_in_again_to_see_settings':
    'Inicia sesión de nuevo para ver la configuración.',
  'fullAuth.settings.sign_in_needed': 'Inscripción necesaria',
  'fullAuth.settings.sign_out': '¡Apúrense!',
  'fullAuth.settings.small_performance_impact':
    'Impacto del rendimiento pequeño',
  'fullAuth.settings.some_destinations_need_a_connection':
    'Algunos destinos necesitan una conexión.',
  'fullAuth.settings.terms_of_use': 'Términos de uso',
  'fullAuth.settings.terms_you_accepted': 'Términos aceptados',
  'fullAuth.settings.the_downloaded_update_will_open_automatically':
    'La actualización descargada se abrirá automáticamente.',
  'fullAuth.settings.the_next_screen_asks_you_to_type_delete_before_m':
    'La siguiente pantalla le pide que escriba DELETE antes de Menta enviar la solicitud.',
  'fullAuth.settings.this_can_use_a_small_amount_of_extra_processing_':
    'Esto puede utilizar una pequeña cantidad de procesamiento adicional, batería y datos celulares mientras Menta está abierto. La grabación comienza sólo en las pantallas elegibles. Reabrir Menta después de apagarlo para detener la grabación Sentry.',
  'fullAuth.settings.this_device_has_the_latest_compatible_update':
    'Este dispositivo tiene la última actualización compatible.',
  'fullAuth.settings.to_confirm': 'confirmar',
  'fullAuth.settings.tries_to_load_the_signed_in_profile_again':
    'Intenta cargar el perfil firmado de nuevo.',
  'fullAuth.settings.try_again_in_a_moment_or_open_the_link_from_the_':
    'Intenta de nuevo en un momento, o abra el enlace desde el listado App Store.',
  'fullAuth.settings.try_again_later_optional_ads_stay_unavailable_un':
    'Intenta de nuevo más tarde. Los anuncios opcionales no están disponibles hasta que revise estas opciones.',
  'fullAuth.settings.try_connection_again': 'Prueba la conexión de nuevo',
  'fullAuth.settings.try_loading_profile_again':
    'Prueba el perfil de carga otra vez',
  'fullAuth.settings.try_loading_your_name_and_profile_photo_again':
    'Intenta cargar tu nombre y tu foto de perfil otra vez.',
  'fullAuth.settings.try_the_account_check_again_before_you_delete_an':
    'Intenta el cheque de cuenta de nuevo antes de eliminar cualquier cosa.',
  'fullAuth.settings.turn_off_advanced_diagnostics':
    'Apaga los diagnósticos avanzados',
  'fullAuth.settings.turn_on_advanced_diagnostics':
    'Activar diagnósticos avanzados',
  'fullAuth.settings.type': 'Tipo',
  'fullAuth.settings.type_delete_to_confirm_account_deletion':
    'Tipo DELETE para confirmar la eliminación de la cuenta',
  'fullAuth.settings.update_checks_are_unavailable':
    'Los cheques de actualización no están disponibles',
  'fullAuth.settings.while_enabled_this_can_use_a_small_amount_of_ext':
    'Mientras está habilitado, esto puede utilizar una pequeña cantidad de procesamiento extra, batería y datos celulares mientras Menta está abierto.',
  'fullAuth.settings.you_are_still_signed_in': 'Aún estás firmado.',
  'fullAuth.settings.your_account_stays_open_until_menta_confirms_the':
    'Tu cuenta permanece abierta hasta que Menta confirme la eliminación.',
  'fullAuth.settings.your_account_was_deleted': 'Tu cuenta fue borrada.',
  'fullAuth.settings.your_choice_was_not_saved': 'Tu elección no fue salvada',
  'fullAuth.settings.your_saved_settings_are_still_here':
    'Tus configuración guardados siguen aquí.',
  'fullAuth.settings.your_support_drafts_for_this_account_were_remove':
    'Se eliminaron los borradores de apoyo de esta cuenta.',
  'fullAuth.support.change_menta_permissions_on_this_phone':
    'Cambio de permisos Menta en este celular',
  'fullAuth.support.check_app_and_connection':
    'Verifique la aplicación y la conexión',
  'fullAuth.support.check_the_apple_account_used_for_the_original_pu':
    'Consulte la cuenta Apple utilizada para la compra original. Si Apple muestra un cargo, informe el problema antes de comprar de nuevo.',
  'fullAuth.support.checking_private_report_drafts':
    'Revisar los borradores del informe privado',
  'fullAuth.support.checking_purchases': 'Comprobación de compras',
  'fullAuth.support.choose_what_you_need_you_can_review_everything_b':
    'Puedes revisar todo antes de enviar.',
  'fullAuth.support.connection_available': 'Conexión disponible',
  'fullAuth.support.connection_check_did_not_finish':
    'Control de conexión no terminó',
  'fullAuth.support.could_not_check_earlier_purchases':
    'No podía comprobar compras anteriores',
  'fullAuth.support.do_not_buy_it_again_while_this_check_continues':
    'No lo compres de nuevo mientras este cheque continúa.',
  'fullAuth.support.find_an_earlier_menta_pro_purchase':
    'Buscar un Menta Pro comprar',
  'fullAuth.support.hide_more_help': 'Ocultar más ayuda',
  'fullAuth.support.looking_for_an_earlier_menta_pro_purchase':
    'Buscando un producto de compra Menta Pro',
  'fullAuth.support.menta_appears_offline': 'Menta aparece en línea',
  'fullAuth.support.menta_pro_is_active_again':
    'Menta Pro está activo de nuevo',
  'fullAuth.support.menta_pro_is_still_being_checked':
    'Menta Pro todavía está siendo revisado',
  'fullAuth.support.more_help': 'Más ayuda',
  'fullAuth.support.no_matching_purchase_was_found':
    'No se encontró ninguna compra coincidente',
  'fullAuth.support.nothing_was_purchased_or_changed_check_the_conne':
    'No se compró ni cambió nada. Revise la conexión e inténtelo de nuevo.',
  'fullAuth.support.open_phone_settings': 'Configuración de celular abierta',
  'fullAuth.support.opens_a_separate_support_report':
    'Abre un informe de apoyo separado.',
  'fullAuth.support.opens_sign_in_before_starting_a_private_report':
    'Abre el registro antes de iniciar un informe privado.',
  'fullAuth.support.other_help': 'Otras ayudas',
  'fullAuth.support.restore_purchases': 'Restaurar las compras',
  'fullAuth.support.saved_on_this_phone_and_still_waiting_to_be_sent':
    'guardado en este celular y todavía esperando ser enviado.',
  'fullAuth.support.saved_reports': 'Informes guardados',
  'fullAuth.support.see_app_version_connection_and_saved_proof':
    'Ver versión de la aplicación, conexión y prueba guardada',
  'fullAuth.support.share_feedback': 'Compartir información',
  'fullAuth.support.sign_in_required': 'Inscripción requerida',
  'fullAuth.support.sign_in_to_report_an_issue':
    'Inicia sesión para informar de una cuestión',
  'fullAuth.support.support': 'Apoyo',
  'fullAuth.support.support_drafts_stay_private_to_the_account_that_':
    'Los proyectos de soporte permanecen privados a la cuenta que los creó. Inicia sesión antes de iniciar un nuevo informe.',
  'fullAuth.support.this_does_not_start_a_new_purchase_or_charge_thi':
    'Esto no inicia una nueva compra o cobra esta cuenta.',
  'fullAuth.support.version_appversion_savedcopy_nothing_changed_try':
    'Versión {appVersion}. {savedCopy} Nada cambió. Prueba el cheque de nuevo cuando tu conexión mejora.',
  'fullAuth.support.version_appversion_savedcopy_saved_proof_stays_o':
    'Versión {appVersion}. {savedCopy} Estancias de prueba guardadas en este celular hasta que Menta confirme que fue enviado.',
  'fullAuth.support.your_earlier_purchase_is_active_on_this_account':
    'Tu compra anterior está activa en esta cuenta.',
  'fullAuth.system_settings.back_to_support': 'Volver a apoyar',
  'fullAuth.system_settings.change_notification_camera_photo_or_ad_measureme':
    'Cambia de notificación, cámara, foto o permisos de medición de anuncios en la configuración del celular. Menta no puede cambiarlos o confirmarlos desde esta pantalla.',
  'fullAuth.system_settings.nothing_changed_in_menta_open_your_phone_setting':
    'Nada cambió en Menta. Abre la configuración del celular manualmente, y luego vuelva a la aplicación.',
  'fullAuth.system_settings.open_phone_settings':
    'Configuración de celular abierta',
  'fullAuth.system_settings.opening_phone_settings_does_not_confirm_that_a_p':
    'La configuración del celular de apertura no confirma que un permiso cambió.',
  'fullAuth.system_settings.phone_settings': 'Ajustes del celular',
  'fullAuth.system_settings.phone_settings_could_not_open':
    'No se puede abrir la configuración del celular',
  'fullAuth.system_settings.return_when_you_re_done':
    'volver cuando estás hecho',
  'fullAuth.tabs_profile.active_and_past_promises':
    'Promesas activas y pasadas',
  'fullAuth.tabs_profile.active_promises': 'Promesas activas',
  'fullAuth.tabs_profile.activepromisecount_active_promises_currentstreak':
    '{activePromiseCount} promesas activas, {currentStreak} Day streak, {length} groups',
  'fullAuth.tabs_profile.change_profile_photo': 'Imagen del perfil',
  'fullAuth.tabs_profile.choose_one_thing_to_follow_through_on_it_will_ap':
    'Elige una cosa para seguir adelante. aparecerá en Hoy con la prueba que elijas.',
  'fullAuth.tabs_profile.create_a_promise': 'Crear una promesa',
  'fullAuth.tabs_profile.current_reward_terms_and_your_link':
    'Términos de recompensa actuales y tu enlace',
  'fullAuth.tabs_profile.day_streak': 'Día de racha',
  'fullAuth.tabs_profile.edit_profile': 'Perfil de edición',
  'fullAuth.tabs_profile.for_your_privacy_menta_hides_the_previous_accoun':
    'Para tu privacidad, Menta esconde la cuenta anterior cuando termina la sesión.',
  'fullAuth.tabs_profile.groups': 'grupos',
  'fullAuth.tabs_profile.invite': 'invitar',
  'fullAuth.tabs_profile.invite_friends': 'Invitar amigos',
  'fullAuth.tabs_profile.loading_your_profile': 'Carga tu perfil',
  'fullAuth.tabs_profile.make_your_first_promise': 'Haz tu primera promesa',
  'fullAuth.tabs_profile.menta_kept_the_last_details_saved_for_this_accou':
    'Menta mantuvo los últimos detalles guardados para esta cuenta. Todavía puedes editar tu perfil y utilizar otras acciones de perfil.',
  'fullAuth.tabs_profile.momenta': 'Momenta',
  'fullAuth.tabs_profile.no_promises_yet': 'Aún no hay promesas.',
  'fullAuth.tabs_profile.open_saved_type_invite':
    'Abrir invitación guardada de {type}',
  'fullAuth.tabs_profile.open_the_invite_to_review_it_before_joining':
    'Abre la invitación para revisarla antes de unirse.',
  'fullAuth.tabs_profile.opens_your_invite_link_and_the_current_reward_te':
    'Abre tu enlace de invitación y los términos de recompensa actuales.',
  'fullAuth.tabs_profile.personal_promises': 'Promesas personales',
  'fullAuth.tabs_profile.profile_details_may_be_out_of_date':
    'Los detalles del perfil pueden estar fuera de la fecha',
  'fullAuth.tabs_profile.progress_and_rewards': 'Progreso y recompensas',
  'fullAuth.tabs_profile.progress_starts_with_proof':
    'El progreso comienza con la prueba',
  'fullAuth.tabs_profile.saved': 'Guardado',
  'fullAuth.tabs_profile.sign_in_again': 'Inicia sesión de nuevo',
  'fullAuth.tabs_profile.sign_in_to_see_you': 'Inicia sesión para verle',
  'fullAuth.tabs_profile.streaks_and_progress_appear_after_you_send_proof':
    'Los problemas y el progreso aparecen después de enviar pruebas para una promesa activa.',
  'fullAuth.tabs_profile.the_last_saved_promise_and_group_counts_are_stil':
    'Las últimas promesas guardadas y los recuentos de grupo se muestran todavía. Otras acciones de perfil permanecen disponibles.',
  'fullAuth.tabs_profile.wallet_shop_and_items':
    'Billetera, tienda y artículos',
  'fullAuth.tabs_profile.you': 'Tú',
  'fullAuth.tabs_profile.your_progress_may_be_out_of_date':
    'Tu progreso puede estar fuera de la fecha',
  'fullAuth.tabs_profile.your_rhythm': 'Tu ritmo',
  'fullAuth.source.example.walk': 'Camina 20 minutos después del trabajo',
  'fullAuth.source.example.application':
    'Envía la solicitud antes de las 17:00',
  'fullAuth.source.example.read': 'Lee diez páginas antes de acostarte',
  'fullAuth.source.proof.photo': 'Prueba con foto',
  'fullAuth.source.proof.video': 'Prueba con video',
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
    'Menta no ha podido confirmar el código. Sigue guardado en este celular. Vuelve a intentarlo antes de crear tu promesa.',
  'fullAuth.source.error.referral_code_not_added':
    'No se ha podido añadir este código a tu cuenta. Compruébalo u omite este paso.',
  'fullAuth.source.error.referral_not_confirmed':
    'Menta no ha podido confirmar el código de invitación guardado. Vuelve a intentarlo antes de crear tu promesa.',
  'fullAuth.source.error.draft_safe':
    'Tu borrador sigue a salvo en este celular. Vuelve a intentarlo.',
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
    'Tu invitación sigue guardada en este celular para volver a intentarlo.',
  'fullAuth.source.referral.accepted': 'Tu invitación se ha registrado.',
  'fullAuth.source.referral.not_added':
    'No se ha añadido ninguna recompensa por invitación.',
  'fullAuth.source.receipt.see_today': 'Verla en Hoy',
  'fullAuth.source.accountability.just_me': 'Solo yo',
  'fullAuth.source.accountability.group_next': 'Crear un grupo después',
  'fullAuth.source.accountability.group_setup_next':
    'Crear un grupo nuevo después',
  'fullAuth.residual.oauth.apple_sign_in_fallback':
    'No se ha podido iniciar sesión con Apple. Vuelve a intentarlo o usa el correo.',
  'fullAuth.residual.paper_auth.new_to_menta': '¿Eres nuevo en Menta?',
  'fullAuth.residual.paper_auth.already_have_account': '¿Ya tienes una cuenta?',
  'fullAuth.residual.paper_auth.choose_username':
    'Elige el nombre de usuario que verán las personas en Menta.',
  'fullAuth.residual.paper_auth.minimum_three_characters':
    'Usa al menos 3 caracteres.',
  'fullAuth.residual.paper_auth.username_characters':
    'Usa solo letras, números o guiones bajos en tu nombre de usuario.',
  'fullAuth.residual.paper_auth.account_email':
    'Introduce el correo de esta cuenta de Menta.',
  'fullAuth.residual.paper_auth.valid_email': 'Introduce un correo válido.',
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
    'Este correo ya tiene una cuenta de Menta.',
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
  'fullAuth.residual.legal.return_settings': 'Volver a configuración',
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
    'Inicia sesión de nuevo para gestionar los configuración de notificaciones.',
  'fullAuth.residual.notifications.load_failed':
    'No se han podido cargar tus configuración de notificaciones. Tus opciones guardadas no han cambiado.',
  'fullAuth.residual.notifications.still_apply':
    'Tus opciones de notificaciones guardadas podrían seguir aplicándose. Vuelve a intentarlo o regresa a Ajustes.',
  'fullAuth.residual.notifications.auto_save':
    'Los cambios se guardan automáticamente.',
  'fullAuth.residual.notifications.off_save':
    'Las opciones se guardan aquí. Las notificaciones siguen desactivadas en este celular.',
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
