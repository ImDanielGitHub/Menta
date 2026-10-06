// Spain Spanish catalogue for auth, onboarding, account, settings and support surfaces.
// Dynamic values stay inside the complete template so translations can reorder them.
import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type FullAuthAccountKey = Extract<keyof EnglishCatalogue, `fullAuth.${string}`>;

export const fullAuthAccountEsES = {
  'fullAuth.tabs_profile.build_your_rhythm': 'Crea tu ritmo',
  'fullAuth.tabs_profile.rhythm_next_check_in':
    'Un registro cada vez. Abre Hoy para ver tu siguiente paso. Las pruebas pendientes de revisión aparecerán aquí cuando se acepten.',
  'fullAuth.tabs_profile.rhythm_choose_next_promise':
    'Elige algo que puedas cumplir. Tus pruebas aceptadas irán mostrando tu progreso aquí.',
  'fullAuth.tabs_profile.rhythm_open_today': 'Ir a Hoy',
  'fullAuth.tabs_profile.rhythm_view_promises': 'Ver tus promesas',
  'fullAuth.shared.try_again': 'Vuelve a intentarlo',
  'fullAuth.support.untitled_report': 'Informe sin título',
  'fullAuth.onboarding.promise_setup_step_one': 'Configurar promesa · 1 de 2',
  'fullAuth.onboarding.promise_setup_step_two': 'Configurar promesa · 2 de 2',
  'fullAuth.component_onboarding_paperauthreset.your_account_email':
    'el correo de tu cuenta',
  'fullAuth.shared.back_to_you': 'Volver a Perfil',
  'fullAuth.shared.promise': 'Promesa',
  'fullAuth.shared.terms': 'Términos',
  'fullAuth.shared.back_to_settings': 'Volver a ajustes',
  'fullAuth.shared.other_sign_in_options': 'Otras formas de iniciar sesión',
  'fullAuth.shared.retry_profile': 'Reintentar perfil',
  'fullAuth.shared.refresh_progress': 'Actualizar progreso',
  'fullAuth.shared.check_connection_again': 'Comprobar conexión de nuevo',
  'fullAuth.shared.sign_in': 'Iniciar sesión',
  'fullAuth.support.feedback': 'Comentarios',
  'fullAuth.support.promise_report': 'Informe de promesa',
  'fullAuth.support.group_report': 'Informe de grupo',
  'fullAuth.support.proof_report': 'Informe de prueba',
  'fullAuth.support.app_issue': 'Problema con la app',
  'fullAuth.support.checking_saved_proof':
    'Comprobando las pruebas guardadas en este teléfono.',
  'fullAuth.support.saved_proof_count_unavailable':
    'No se puede consultar cuántas pruebas hay guardadas.',
  'fullAuth.support.no_proof_waiting':
    'No hay ninguna prueba pendiente en este teléfono.',
  'fullAuth.support.proof_count_saved':
    '{count} {proofLabel} guardada(s) en este teléfono.',
  'fullAuth.support.proof_is': 'prueba',
  'fullAuth.support.proofs_are': 'pruebas',
  'fullAuth.support.saved_proof_waiting_to_be_sent':
    '{count} {proofLabel} guardada(s) en este teléfono y pendiente(s) de enviar.',
  'fullAuth.email_auth.create_account': 'Crear cuenta',
  'fullAuth.email_auth.sign_in': 'Iniciar sesión',
  'fullAuth.email_auth.already_have_account': '¿Ya tienes una cuenta?',
  'fullAuth.email_auth.new_to_menta': '¿Eres nuevo en Menta?',
  'fullAuth.email_auth.offline_reconnect':
    'No tienes conexión. Vuelve a conectarte e inténtalo de nuevo.',
  'fullAuth.email_auth.too_many_attempts':
    'Demasiados intentos. Espera un momento y vuelve a intentarlo.',
  'fullAuth.email_auth.could_not_sign_in':
    'No se ha podido iniciar sesión. Revisa tu correo y tu contraseña, y vuelve a intentarlo.',
  'fullAuth.email_auth.could_not_create_account':
    'No se ha podido crear tu cuenta. Comprueba tu conexión y vuelve a intentarlo.',
  'fullAuth.email_auth.enter_password': 'Introduce tu contraseña.',
  'fullAuth.email_auth.create_password': 'Crea una contraseña.',
  'fullAuth.email_auth.confirm_your_password': 'Confirma tu contraseña.',
  'fullAuth.email_auth.password_minimum': 'Usa al menos {length} caracteres.',
  'fullAuth.email_auth.password_mismatch': 'Las contraseñas no coinciden.',
  'fullAuth.email_auth.choose_username': 'Elige un nombre de usuario.',
  'fullAuth.email_auth.minimum_three_characters': 'Usa al menos 3 caracteres.',
  'fullAuth.email_auth.username_characters_only':
    'Usa solo letras, números o guiones bajos.',
  'fullAuth.email_auth.account_email':
    'Introduce el correo de tu cuenta de Menta.',
  'fullAuth.email_auth.valid_email': 'Introduce un correo electrónico válido.',
  'fullAuth.email_auth.passwords_need_to_match':
    'Las contraseñas deben coincidir.',
  'fullAuth.password_recovery.confirm_new_password':
    'Confirma tu nueva contraseña.',
  'fullAuth.password_recovery.passwords_mismatch':
    'Las contraseñas no coinciden.',
  'fullAuth.password_recovery.minimum_password_length':
    'Usa al menos {length} caracteres.',
  'fullAuth.password_recovery.could_not_change_now':
    'No hemos podido cambiar tu contraseña en este momento.',
  'fullAuth.password_recovery.sign_in_with_new_password_draft':
    'Inicia sesión con tu nueva contraseña y vuelve a tu borrador.',
  'fullAuth.password_recovery.sign_in_with_new_password':
    'Ya puedes iniciar sesión con tu nueva contraseña.',
  'fullAuth.language_settings.system_accessibility':
    'Usar el idioma del teléfono. {systemSubtitle}',
  'fullAuth.forgot_password.enter_email_tied_to_account':
    'Introduce el correo vinculado a tu cuenta de Menta.',
  'fullAuth.forgot_password.enter_valid_email':
    'Introduce un correo electrónico válido.',
  'fullAuth.forgot_password.could_not_send_reset_email':
    'No se ha podido enviar el correo para restablecer la contraseña. Comprueba tu conexión y vuelve a intentarlo.',
  'fullAuth.password_recovery_callback.checking_secure_reset_link':
    'Comprobando tu enlace seguro para restablecer la contraseña…',
  'fullAuth.password_recovery_callback.reset_link_verified':
    'Enlace verificado.',
  'fullAuth.report_issue.send_feedback': 'Enviar comentarios',
  'fullAuth.report_issue.send_report': 'Enviar informe',
  'fullAuth.support.start_a_new_report': 'Empezar un informe nuevo',
  'fullAuth.support.report_an_issue': 'Informar de un problema',
  'fullAuth.notification_settings.daily_proof_reminders_and_promise_ending_updates':
    'Recordatorios diarios de prueba y avisos cuando termina una promesa.',
  'fullAuth.notification_settings.saved_but_notifications_are_off_on_this_phone':
    'Guardado, pero las notificaciones están desactivadas en este teléfono.',
  'fullAuth.notification_settings.occasional_updates_to_email_unsubscribe_here':
    'Novedades ocasionales en {email}. Puedes darte de baja aquí cuando quieras.',
  'fullAuth.notification_settings.a_confirmed_account_email_is_required':
    'Hace falta un correo de cuenta confirmado.',
  'fullAuth.onboarding.menta_mascot_holding_your_first_promise':
    'La mascota de Menta sostiene tu primera promesa',
  'fullAuth.onboarding.menta_mascot_waving_hello': 'La mascota de Menta saluda',
  'fullAuth.onboarding.your_saved_draft_is_back_on_this_phone':
    'Tu borrador guardado vuelve a estar en este teléfono.',
  'fullAuth.onboarding.saved_privately_on_this_phone_as_you_type':
    'Se guarda de forma privada en este teléfono mientras escribes.',
  'fullAuth.account_deleted.apple_instructions_did_not_open':
    'No se han abierto las instrucciones de Apple',
  'fullAuth.account_deleted.checking_account_deletion':
    'Comprobando la eliminación de la cuenta',
  'fullAuth.account_deleted.go_to_sign_in': 'Ir a Iniciar sesión',
  'fullAuth.account_deleted.if_you_used_sign_in_with_apple_remove_menta_from':
    'Si usaste Iniciar sesión con Apple, quita Menta de las apps conectadas a tu cuenta de Apple. Abre Ajustes en el iPhone, toca tu nombre y luego Iniciar sesión con Apple.',
  'fullAuth.account_deleted.open_apple_support_and_search_for_manage_your_ap':
    'Abre el Soporte de Apple y busca «Gestionar tus apps con Iniciar sesión con Apple».',
  'fullAuth.account_deleted.remove_apple_access': 'Quitar el acceso de Apple',
  'fullAuth.account_deleted.see_apple_instructions':
    'Ver las instrucciones de Apple',
  'fullAuth.account_deleted.sign_in_with_apple_access_was_also_removed':
    'También se ha quitado el acceso de Iniciar sesión con Apple.',
  'fullAuth.account_deleted.your_account_was_deleted':
    'Tu cuenta se ha eliminado',
  'fullAuth.account_deleted.your_menta_account_and_its_data_were_deleted_men':
    'Tu cuenta de Menta y sus datos se han eliminado. Menta también ha borrado de este teléfono los datos guardados de esta cuenta.',
  'fullAuth.auth_required.events': 'Eventos',
  'fullAuth.auth_required.groups': 'Grupos',
  'fullAuth.auth_required.keep_browsing': 'Seguir explorando',
  'fullAuth.auth_required.menta': 'Menta',
  'fullAuth.auth_required.menta_records_the_review_under_your_account':
    'Menta registra la revisión en tu cuenta.',
  'fullAuth.auth_required.menta_saves_this_proof_with_the_right_promise_an':
    'Menta guarda esta prueba con la promesa y la cuenta correctas.',
  'fullAuth.auth_required.momenta': 'Momenta',
  'fullAuth.auth_required.proof': 'Prueba',
  'fullAuth.auth_required.reviews': 'Revisiones',
  'fullAuth.auth_required.sign_in': 'Iniciar sesión',
  'fullAuth.auth_required.sign_in_to_add_proof':
    'Inicia sesión para añadir la prueba',
  'fullAuth.auth_required.sign_in_to_complete_this_action_and_return_here_':
    'Inicia sesión para completar esta acción y volver aquí después.',
  'fullAuth.auth_required.sign_in_to_continue': 'Inicia sesión para continuar',
  'fullAuth.auth_required.sign_in_to_continue_with_this_event':
    'Inicia sesión para continuar con este evento',
  'fullAuth.auth_required.sign_in_to_join_this_group':
    'Inicia sesión para unirte a este grupo',
  'fullAuth.auth_required.sign_in_to_review_proof':
    'Inicia sesión para revisar la prueba',
  'fullAuth.auth_required.sign_in_to_use_momenta':
    'Inicia sesión para usar Momenta',
  'fullAuth.auth_required.your_balance_purchases_and_items_stay_with_your_':
    'Tu saldo, tus compras y tus artículos se quedan en tu cuenta.',
  'fullAuth.auth_required.your_invitation_and_group_activity_stay_with_you':
    'Tu invitación y la actividad del grupo se quedan en tu cuenta.',
  'fullAuth.auth_required.your_place_check_in_and_event_photos_are_saved_t':
    'Tu plaza, tu registro de asistencia y las fotos del evento se guardan en tu cuenta.',
  'fullAuth.auth_required.your_promises_proof_groups_and_reviews_stay_with':
    'Tus promesas, pruebas, grupos y revisiones se quedan en tu cuenta de Menta.',
  'fullAuth.component_onboarding_mentasurface.hide_password':
    'Ocultar contraseña',
  'fullAuth.component_onboarding_mentasurface.menta': 'Menta',
  'fullAuth.component_onboarding_mentasurface.setup': 'Configuración',
  'fullAuth.component_onboarding_mentasurface.show_password':
    'Mostrar contraseña',
  'fullAuth.component_onboarding_paperauthform.after_this': 'Después',
  'fullAuth.component_onboarding_paperauthform.characters': '+ caracteres',
  'fullAuth.component_onboarding_paperauthform.check_the_details':
    'Revisa los datos',
  'fullAuth.component_onboarding_paperauthform.confirm_password':
    'Confirmar contraseña',
  'fullAuth.component_onboarding_paperauthform.create_your_account':
    'Crea tu cuenta',
  'fullAuth.component_onboarding_paperauthform.creating_your_account':
    'Creando tu cuenta',
  'fullAuth.component_onboarding_paperauthform.daniel': 'Daniel',
  'fullAuth.component_onboarding_paperauthform.email': 'Correo electrónico',
  'fullAuth.component_onboarding_paperauthform.forgot_your_password':
    '¿Has olvidado tu contraseña?',
  'fullAuth.component_onboarding_paperauthform.password': 'Contraseña',
  'fullAuth.component_onboarding_paperauthform.sign_in_with_email':
    'Iniciar sesión con correo',
  'fullAuth.component_onboarding_paperauthform.signing_you_in':
    'Iniciando tu sesión',
  'fullAuth.component_onboarding_paperauthform.username': 'Nombre de usuario',
  'fullAuth.component_onboarding_paperauthform.you_example_com':
    'tu@ejemplo.com',
  'fullAuth.component_onboarding_paperauthform.you_will_return_to_your_first_promise':
    'Volverás a tu primera promesa.',
  'fullAuth.component_onboarding_paperauthform.your_promise_stays_on_this_phone_until_the_accou':
    'Tu promesa se queda en este teléfono hasta que la cuenta esté lista.',
  'fullAuth.component_onboarding_paperauthform.your_promise_stays_on_this_phone_while_we_create':
    'Tu promesa se queda en este teléfono mientras creamos la cuenta.',
  'fullAuth.component_onboarding_paperauthform.your_promise_stays_on_this_phone_while_you_sign_':
    'Tu promesa se queda en este teléfono mientras inicias sesión.',
  'fullAuth.component_onboarding_paperauthmethods.choose_how_to_sign_in_your_promise_stays_on_this':
    'Elige cómo iniciar sesión. Tu promesa se queda en este teléfono hasta que termines.',
  'fullAuth.component_onboarding_paperauthmethods.choose_how_you_want_to_sign_in':
    'Elige cómo quieres iniciar sesión.',
  'fullAuth.component_onboarding_paperauthmethods.continue_with_apple':
    'Continuar con Apple',
  'fullAuth.component_onboarding_paperauthmethods.continue_with_email':
    'Continuar con correo',
  'fullAuth.component_onboarding_paperauthmethods.continue_with_google':
    'Continuar con Google',
  'fullAuth.component_onboarding_paperauthmethods.save_your_promise':
    'Guarda tu promesa',
  'fullAuth.component_onboarding_paperauthmethods.see_how_menta_works':
    'Descubre cómo funciona Menta',
  'fullAuth.component_onboarding_paperauthmethods.sign_in_to_menta':
    'Inicia sesión en Menta',
  'fullAuth.component_onboarding_paperauthmethods.we_could_not_sign_you_in':
    'No hemos podido iniciar tu sesión',
  'fullAuth.component_onboarding_paperauthreset.back_to_sign_in':
    'Volver a iniciar sesión',
  'fullAuth.component_onboarding_paperauthreset.check_your_email':
    'Revisa tu correo.',
  'fullAuth.component_onboarding_paperauthreset.daniel_example_com':
    'daniel@example.com',
  'fullAuth.component_onboarding_paperauthreset.email': 'Correo electrónico',
  'fullAuth.component_onboarding_paperauthreset.email_sent_to':
    'Correo enviado a',
  'fullAuth.component_onboarding_paperauthreset.link_valid_for_60_minutes':
    'Enlace válido durante 60 minutos',
  'fullAuth.component_onboarding_paperauthreset.reset_for': 'Restablecer para',
  'fullAuth.component_onboarding_paperauthreset.reset_your_password':
    'Restablece tu contraseña',
  'fullAuth.component_onboarding_paperauthreset.send_another_link':
    'Enviar otro enlace',
  'fullAuth.component_onboarding_paperauthreset.send_another_link_in_countdown':
    'Enviar otro enlace en {countdown}',
  'fullAuth.component_onboarding_paperauthreset.send_reset_link':
    'Enviar enlace para restablecer',
  'fullAuth.component_onboarding_paperauthreset.sending_your_reset_link':
    'Enviando tu enlace para restablecer',
  'fullAuth.component_onboarding_paperauthreset.use_the_latest_link':
    'Usa el enlace más reciente.',
  'fullAuth.component_onboarding_paperauthreset.use_the_link_we_just_sent_you_can_request_anothe':
    'Usa el enlace que acabamos de enviarte. Podrás pedir otro cuando termine el temporizador.',
  'fullAuth.component_onboarding_paperauthreset.we_could_not_send_another_link':
    'No hemos podido enviar otro enlace',
  'fullAuth.component_onboarding_paperauthreset.we_could_not_send_the_reset_link':
    'No hemos podido enviar el enlace para restablecer',
  'fullAuth.component_onboarding_paperauthreset.we_ll_email_you_a_secure_link_your_saved_promise':
    'Te enviaremos un enlace seguro por correo. Tu promesa guardada seguirá en este teléfono.',
  'fullAuth.component_onboarding_paperauthreset.we_re_sending_a_secure_link_to_the_address_below':
    'Estamos enviando un enlace seguro a esta dirección.',
  'fullAuth.component_onboarding_paperauthreset.we_sent_a_secure_reset_link_your_saved_promise_i':
    'Te hemos enviado un enlace seguro para restablecer la contraseña. Tu promesa guardada sigue aquí.',
  'fullAuth.component_onboarding_paperauthsurface.before_you_use_the_account_you_ll_review_and_acc':
    'Antes de usar la cuenta, revisarás y aceptarás los documentos actuales de la cuenta y de la comunidad de Menta.',
  'fullAuth.component_onboarding_paperauthsurface.choose_sign_in_method':
    'Elige cómo iniciar sesión',
  'fullAuth.component_onboarding_paperauthsurface.community_standards':
    'Normas de la comunidad',
  'fullAuth.component_onboarding_paperauthsurface.community_standards_did_not_open':
    'No se han abierto las Normas de la comunidad',
  'fullAuth.component_onboarding_paperauthsurface.hide_password':
    'Ocultar contraseña',
  'fullAuth.component_onboarding_paperauthsurface.keep_local_draft':
    'Mantener el borrador local',
  'fullAuth.component_onboarding_paperauthsurface.menta': 'Menta',
  'fullAuth.component_onboarding_paperauthsurface.menta_authentication':
    'Autenticación de Menta',
  'fullAuth.component_onboarding_paperauthsurface.menta_mascot':
    'Mascota de Menta',
  'fullAuth.component_onboarding_paperauthsurface.privacy_policy':
    'Política de privacidad',
  'fullAuth.component_onboarding_paperauthsurface.privacy_policy_did_not_open':
    'No se ha abierto la Política de privacidad',
  'fullAuth.component_onboarding_paperauthsurface.returning_to': 'Volviendo a',
  'fullAuth.component_onboarding_paperauthsurface.show_password':
    'Mostrar contraseña',
  'fullAuth.component_onboarding_paperauthsurface.terms_did_not_open':
    'No se han abierto los Términos',
  'fullAuth.component_onboarding_paperauthsurface.terms_of_use':
    'Términos de uso',
  'fullAuth.component_onboarding_paperauthsurface.the_provider_sheet_was_closed_before_an_account_':
    'La ventana del proveedor se cerró antes de devolver una cuenta. No se ha creado ni cambiado nada.',
  'fullAuth.component_onboarding_paperauthsurface.title_message':
    '{title} {message}',
  'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_community_standar':
    'Vuelve a intentarlo o visita menta.quest/community-standards en tu navegador.',
  'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_privacy_in_your_b':
    'Vuelve a intentarlo o visita menta.quest/privacy en tu navegador.',
  'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_terms_in_your_bro':
    'Vuelve a intentarlo o visita menta.quest/terms en tu navegador.',
  'fullAuth.component_onboarding_paperauthsurface.you_can_try_again_or_keep_working_without_signin':
    'Puedes volver a intentarlo o seguir sin iniciar sesión hasta que Menta necesite guardarla.',
  'fullAuth.component_onboarding_paperauthsurface.you_re_still_signed_out':
    'Todavía no has iniciado sesión.',
  'fullAuth.component_onboarding_paperauthsurface.your_local_promise_is_still_here':
    'Tu promesa local sigue aquí',
  'fullAuth.component_settings_settingssignoutsheet.cancel': 'Cancelar',
  'fullAuth.component_settings_settingssignoutsheet.check_the_connection_then_try_again':
    'Comprueba la conexión y vuelve a intentarlo.',
  'fullAuth.component_settings_settingssignoutsheet.sign_out': 'Cerrar sesión',
  'fullAuth.component_settings_settingssignoutsheet.sign_out_did_not_finish':
    'No se ha podido cerrar la sesión',
  'fullAuth.component_settings_settingssignoutsheet.try_sign_out_again':
    'Volver a cerrar sesión',
  'fullAuth.component_support_offlinesupportnotice.you_can_still_read_the_last_saved_screen_proof_a':
    'Aún puedes leer la última pantalla guardada. Los borradores de pruebas e informes se quedan en este teléfono hasta que Menta se vuelva a conectar.',
  'fullAuth.component_support_offlinesupportnotice.you_re_offline':
    'estás sin conexión',
  'fullAuth.component_support_supportsurface.title_subtitle':
    '{title}. {subtitle}',
  'fullAuth.component_support_supportsurface.title_subtitle_detail':
    '{title}. {subtitle} {detail}',
  'fullAuth.edit_profile.account_required': 'Necesitas una cuenta',
  'fullAuth.edit_profile.back_to_you': 'Volver a Perfil',
  'fullAuth.edit_profile.cannot_edit_here': 'No se puede editar aquí',
  'fullAuth.edit_profile.change_photo': 'Cambiar foto',
  'fullAuth.edit_profile.choose_a_different_photo': 'Elige otra foto.',
  'fullAuth.edit_profile.choose_a_profile_photo': 'Elige una foto de perfil',
  'fullAuth.edit_profile.details': 'Datos',
  'fullAuth.edit_profile.display_name': 'Nombre visible',
  'fullAuth.edit_profile.edit_again': 'Editar de nuevo',
  'fullAuth.edit_profile.edit_profile': 'Editar perfil',
  'fullAuth.edit_profile.email': 'Correo electrónico',
  'fullAuth.edit_profile.how_it_will_look_on_you': 'Cómo se verá en tu perfil',
  'fullAuth.edit_profile.loading_your_profile': 'Cargando tu perfil',
  'fullAuth.edit_profile.name': 'Nombre',
  'fullAuth.edit_profile.no_changes_have_been_made_try_loading_your_accou':
    'No se ha hecho ningún cambio. Vuelve a cargar tu cuenta.',
  'fullAuth.edit_profile.no_photo_selected': 'No has elegido ninguna foto',
  'fullAuth.edit_profile.nothing_changes_until_you_choose_one':
    'No cambia nada hasta que elijas una.',
  'fullAuth.edit_profile.photo_not_changed_photoerror':
    'La foto no ha cambiado. {photoError}',
  'fullAuth.edit_profile.photo_visibility': 'Visibilidad de la foto',
  'fullAuth.edit_profile.photo_will_be_removed': 'Se quitará la foto',
  'fullAuth.edit_profile.profile_unavailable': 'Perfil no disponible',
  'fullAuth.edit_profile.profile_updated': 'Perfil actualizado',
  'fullAuth.edit_profile.remove_photo': 'Quitar foto',
  'fullAuth.edit_profile.save_changes': 'Guardar cambios',
  'fullAuth.edit_profile.saving_changes': 'Guardando cambios',
  'fullAuth.edit_profile.saving_your_changes': 'Guardando tus cambios',
  'fullAuth.edit_profile.selected_not_saved': 'Elegida, sin guardar',
  'fullAuth.edit_profile.photo_too_large': 'Elige una foto de menos de 5 MB.',
  'fullAuth.edit_profile.photo_type_rejected':
    'Elige una imagen JPEG, PNG o WebP para tu foto de perfil.',
  'fullAuth.edit_profile.selected_profile_photo_in_its_final_circular_cro':
    'Foto de perfil elegida con su recorte circular final',
  'fullAuth.edit_profile.sign_in_again': 'Volver a iniciar sesión',
  'fullAuth.edit_profile.sign_in_again_before_editing_this_profile':
    'Vuelve a iniciar sesión antes de editar este perfil.',
  'fullAuth.edit_profile.this_is_how_the_photo_will_look_on_you_it_will_n':
    'Así se verá la foto en tu perfil. No cambiará hasta que guardes.',
  'fullAuth.edit_profile.try_again': 'Vuelve a intentarlo',
  'fullAuth.edit_profile.try_saving_again': 'Volver a guardar',
  'fullAuth.edit_profile.username': 'Nombre de usuario',
  'fullAuth.edit_profile.usernames_can_t_be_changed_yet':
    'Todavía no se puede cambiar el nombre de usuario.',
  'fullAuth.edit_profile.value': '@{value}',
  'fullAuth.edit_profile.you_can_keep_reviewing_the_preview_while_menta_s':
    'Puedes seguir revisando la vista previa mientras Menta guarda.',
  'fullAuth.edit_profile.you_cannot_change_your_sign_in_email_here':
    'Aquí no puedes cambiar el correo con el que inicias sesión.',
  'fullAuth.edit_profile.your_current_photo_stays_until_you_save_changes':
    'Tu foto actual se mantiene hasta que guardes los cambios.',
  'fullAuth.edit_profile.your_details_will_appear_when_this_check_finishe':
    'Tus datos aparecerán cuando termine esta comprobación.',
  'fullAuth.edit_profile.your_edits_are_still_here': 'Tus cambios siguen aquí',
  'fullAuth.edit_profile.your_profile_has_not_changed':
    'Tu perfil no ha cambiado.',
  'fullAuth.edit_profile.your_profile_has_not_changed_try_saving_again':
    'Tu perfil no ha cambiado. Vuelve a guardar.',
  'fullAuth.edit_profile.your_saved_name_and_photo_now_appear_across_ment':
    'Tu nombre y tu foto guardados ya aparecen en todo Menta.',
  'fullAuth.email_auth.confirm_password': 'Confirmar contraseña',
  'fullAuth.email_auth.couldn_t_create_account':
    'No se ha podido crear la cuenta',
  'fullAuth.email_auth.couldn_t_sign_you_in':
    'No se ha podido iniciar tu sesión',
  'fullAuth.email_auth.create_an_account_to_save_this_promise_to_menta':
    'Crea una cuenta para guardar esta promesa en Menta.',
  'fullAuth.email_auth.create_your_account': 'crear Tu cuenta',
  'fullAuth.email_auth.daniel': 'daniel',
  'fullAuth.email_auth.email': 'Correo electrónico',
  'fullAuth.email_auth.forgot_your_password': '¿Has olvidado tu contraseña?',
  'fullAuth.email_auth.menta': 'Menta',
  'fullAuth.email_auth.other_people_may_see_this_with_your_group_activi':
    'Otras personas pueden verlo junto a tu actividad en grupos y tus fotos de eventos.',
  'fullAuth.email_auth.password': 'Contraseña',
  'fullAuth.email_auth.sign_in_to_save_this_promise_to_your_menta_accou':
    'Inicia sesión para guardar esta promesa en tu cuenta de Menta.',
  'fullAuth.email_auth.sign_in_with_email': 'Iniciar sesión con correo',
  'fullAuth.email_auth.use_6_or_more_characters': 'Usa 6 caracteres o más.',
  'fullAuth.email_auth.use_an_email_you_can_access_if_you_ever_need_to_':
    'Usa un correo al que tengas acceso por si alguna vez necesitas recuperar tu cuenta.',
  'fullAuth.email_auth.username': 'Nombre de usuario',
  'fullAuth.email_auth.you_example_com': 'tu@ejemplo.com',
  'fullAuth.legal_acceptance.agree_and_continue': 'Aceptar y continuar',
  'fullAuth.legal_acceptance.back': 'Atrás',
  'fullAuth.legal_acceptance.before_you': 'Antes de',
  'fullAuth.legal_acceptance.checking_the_current_legal_documents':
    'Comprobando los documentos legales actuales',
  'fullAuth.legal_acceptance.continue': 'continuar.',
  'fullAuth.legal_acceptance.couldn_t_check_your_agreement':
    'No se ha podido comprobar tu aceptación',
  'fullAuth.legal_acceptance.create': 'crear.',
  'fullAuth.legal_acceptance.i_agree_to_menta_s_terms_of_use_and_community_st':
    'Acepto los Términos de uso y las Normas de la comunidad de Menta, y reconozco la Política de privacidad.',
  'fullAuth.legal_acceptance.leave_legal_review': 'Salir de la revisión legal',
  'fullAuth.legal_acceptance.menta': 'Menta',
  'fullAuth.legal_acceptance.menta_mascot_beside_your_account_confirmation':
    'Mascota de Menta junto a la confirmación de tu cuenta',
  'fullAuth.legal_acceptance.try_again': 'Vuelve a intentarlo',
  'fullAuth.legal_acceptance.you_can_go_back_without_agreeing_your_account_an':
    'Puedes volver atrás sin aceptar. Tu cuenta y tus promesas actuales siguen disponibles.',
  'fullAuth.login.menta': 'Menta',
  'fullAuth.notification_settings.a_test_is_already_on_the_way':
    'Ya hay una notificación de prueba en camino',
  'fullAuth.notification_settings.allow_notifications':
    'Permitir notificaciones',
  'fullAuth.notification_settings.allow_notifications_first':
    'Permite primero las notificaciones',
  'fullAuth.notification_settings.back_to_settings': 'Volver a ajustes',
  'fullAuth.notification_settings.check_again_before_turning_on_proof_reminders':
    'Vuelve a comprobarlo antes de activar los recordatorios de prueba.',
  'fullAuth.notification_settings.check_notification_permission':
    'Comprobar el permiso de notificaciones',
  'fullAuth.notification_settings.check_notification_permission_and_try_the_test_a':
    'Comprueba el permiso de notificaciones y vuelve a enviar la prueba en un momento.',
  'fullAuth.notification_settings.choice_saved': 'Opción guardada',
  'fullAuth.notification_settings.choose_daily_proof_reminders_and_updates_when_a_':
    'Elige recordatorios diarios de prueba y avisos cuando una promesa esté por terminar.',
  'fullAuth.notification_settings.choose_notifications_for_menta_then_return_here':
    'Elige Notificaciones para Menta y vuelve aquí.',
  'fullAuth.notification_settings.choose_the_notifications_you_want_from_menta':
    'Elige qué notificaciones quieres recibir de Menta.',
  'fullAuth.notification_settings.choose_the_notifications_you_want_from_menta_bel':
    'Elige abajo qué notificaciones quieres recibir de Menta.',
  'fullAuth.notification_settings.choose_which_group_and_progress_updates_menta_ma':
    'Elige qué novedades de grupos y de progreso puede enviarte Menta.',
  'fullAuth.notification_settings.confirmed_milestones_momenta_and_streak_changes':
    'Hitos confirmados, Momenta y cambios en tus rachas.',
  'fullAuth.notification_settings.could_not_check_phone_notifications':
    'No se han podido comprobar las notificaciones del teléfono',
  'fullAuth.notification_settings.could_not_load_notification_settings':
    'No se han podido cargar los ajustes de notificaciones.',
  'fullAuth.notification_settings.could_not_load_notification_settings_2':
    'No se han podido cargar los ajustes de notificaciones',
  'fullAuth.notification_settings.could_not_open_phone_settings':
    'No se han podido abrir los ajustes del teléfono',
  'fullAuth.notification_settings.could_not_save_your_choice':
    'No se ha podido guardar tu opción',
  'fullAuth.notification_settings.delivery_and_timing': 'Entrega y horario',
  'fullAuth.notification_settings.email_choice_did_not_change':
    'La opción de correo no ha cambiado',
  'fullAuth.notification_settings.email_updates': 'Novedades por correo',
  'fullAuth.notification_settings.email_updates_are_off':
    'Las novedades por correo están desactivadas',
  'fullAuth.notification_settings.email_updates_are_on':
    'Las novedades por correo están activadas',
  'fullAuth.notification_settings.email_updates_are_still_off':
    'Las novedades por correo siguen desactivadas',
  'fullAuth.notification_settings.email_updates_are_unavailable':
    'Las novedades por correo no están disponibles',
  'fullAuth.notification_settings.if_it_does_not_save_menta_will_put_your_previous':
    'Si no se guarda, Menta restaurará tu opción anterior.',
  'fullAuth.notification_settings.it_should_arrive_shortly_tap_it_to_return_to_not':
    'Debería llegar enseguida. Tócala para volver a Ajustes de notificaciones.',
  'fullAuth.notification_settings.keep_notifications_off':
    'Mantener las notificaciones desactivadas',
  'fullAuth.notification_settings.loading_notification_settings':
    'Cargando ajustes de notificaciones',
  'fullAuth.notification_settings.loading_your_notification_settings':
    'Cargando tus ajustes de notificaciones.',
  'fullAuth.notification_settings.menta_can_resume_notifications_after_this_time':
    'Menta puede reanudar las notificaciones después de esta hora.',
  'fullAuth.notification_settings.menta_could_not_connect_this_email_safely_so_you':
    'Menta no ha podido conectar este correo de forma segura, así que tu consentimiento no se ha dejado activado.',
  'fullAuth.notification_settings.menta_could_not_finish_notification_registration':
    'Menta no ha podido terminar de registrar las notificaciones. Vuelve a intentarlo en un momento.',
  'fullAuth.notification_settings.menta_does_not_send_notifications_during_these_h':
    'Menta no envía notificaciones durante estas horas. Puede que lleguen después.',
  'fullAuth.notification_settings.menta_does_not_send_notifications_during_this_lo':
    'Menta no envía notificaciones durante esta franja de hora local.',
  'fullAuth.notification_settings.menta_is_checking_this_phone_and_your_active_pro':
    'Menta está comprobando este teléfono y tus promesas activas.',
  'fullAuth.notification_settings.menta_is_checking_this_phone_before_it_queues_th':
    'Menta está comprobando este teléfono antes de programar la prueba.',
  'fullAuth.notification_settings.menta_is_finishing_notification_setup_for_this_p':
    'Menta está terminando de configurar las notificaciones en este teléfono.',
  'fullAuth.notification_settings.menta_may_remind_you_while_proof_is_due_or_a_pro':
    'Menta puede recordártelo cuando toque enviar una prueba o una promesa esté por terminar, y esperará durante las horas de silencio.',
  'fullAuth.notification_settings.menta_may_send_occasional_product_news_to_your_a':
    'Menta puede enviar novedades ocasionales del producto al correo de tu cuenta. Puedes desactivarlo aquí cuando quieras.',
  'fullAuth.notification_settings.menta_needs_a_confirmed_account_email_before_thi':
    'Menta necesita un correo de cuenta confirmado para poder cambiar esta opción.',
  'fullAuth.notification_settings.menta_product_news': 'Novedades de Menta',
  'fullAuth.notification_settings.menta_removed_this_email_from_product_update_del':
    'Menta ha quitado este correo de la lista de novedades del producto.',
  'fullAuth.notification_settings.menta_will_not_send_proof_or_promise_ending_remi':
    'Menta no enviará recordatorios de prueba ni avisos de fin de promesa a menos que vuelvas a activarlos.',
  'fullAuth.notification_settings.menta_will_use_this_choice_for_future_notificati':
    'Menta usará esta opción para las próximas notificaciones.',
  'fullAuth.notification_settings.new_proof_to_review_review_outcomes_check_ins_an':
    'Pruebas nuevas por revisar, resultados de revisiones, registros de asistencia y cambios en los grupos.',
  'fullAuth.notification_settings.no_notification_was_queued':
    'No se ha programado ninguna notificación.',
  'fullAuth.notification_settings.nothing_was_sent_try_again_in_a_moment':
    'No se ha enviado nada. Vuelve a intentarlo en un momento.',
  'fullAuth.notification_settings.notification_setup_did_not_finish':
    'No se ha terminado de configurar las notificaciones',
  'fullAuth.notification_settings.notifications': 'Notificaciones',
  'fullAuth.notification_settings.promise_context_title':
    'Recordatorios de promesas',
  'fullAuth.notification_settings.promise_context_body':
    'Esta hora de recordatorio se aplica a todas las promesas activas. Los horarios siguen {timeZone}.',
  'fullAuth.notification_settings.back_to_promise': 'Volver a la promesa',
  'fullAuth.notification_settings.notifications_are_off':
    'Las notificaciones están desactivadas',
  'fullAuth.notification_settings.notifications_are_still_off':
    'Las notificaciones siguen desactivadas',
  'fullAuth.notification_settings.notifications_off':
    'Notificaciones desactivadas',
  'fullAuth.notification_settings.old_reminders_may_still_be_on_this_phone':
    'Puede que sigan quedando recordatorios antiguos en este teléfono',
  'fullAuth.notification_settings.open_phone_settings':
    'Abrir ajustes del teléfono',
  'fullAuth.notification_settings.open_your_phone_settings_choose_menta_then_notif':
    'Abre los ajustes del teléfono, elige Menta y luego Notificaciones para permitir los recordatorios.',
  'fullAuth.notification_settings.open_your_phone_settings_choose_menta_then_notif_2':
    'Abre los ajustes del teléfono, elige Menta, luego Notificaciones, y permite las notificaciones.',
  'fullAuth.notification_settings.opening_phone_settings':
    'Abriendo los ajustes del teléfono',
  'fullAuth.notification_settings.optional_menta_product_news_this_is_separate_fro':
    'Novedades opcionales de Menta. Son independientes de las notificaciones de la cuenta y de las pruebas.',
  'fullAuth.notification_settings.people_and_progress': 'Personas y progreso',
  'fullAuth.notification_settings.phone_controls': 'Controles del teléfono',
  'fullAuth.notification_settings.phone_notification_check_failed':
    'No se han podido comprobar las notificaciones del teléfono',
  'fullAuth.notification_settings.phone_notification_settings':
    'Ajustes de notificaciones del teléfono',
  'fullAuth.notification_settings.preferred_time_formattedremindertime_a_proof_dea':
    'Hora preferida: {formattedReminderTime}. El plazo de una prueba o las horas de silencio pueden cambiar la hora real.',
  'fullAuth.notification_settings.preferred_time_formattedremindertime_notificatio':
    'Hora preferida: {formattedReminderTime}. Las notificaciones están desactivadas en este teléfono.',
  'fullAuth.notification_settings.preparing_a_test_notification':
    'Preparando una notificación de prueba',
  'fullAuth.notification_settings.preparing_proof_reminders':
    'Preparando los recordatorios de prueba',
  'fullAuth.notification_settings.promise_reminders':
    'Recordatorios de promesas',
  'fullAuth.notification_settings.proof_reminders': 'Recordatorios de prueba',
  'fullAuth.notification_settings.proof_reminders_are_off':
    'Los recordatorios de prueba están desactivados',
  'fullAuth.notification_settings.proof_reminders_are_ready':
    'Los recordatorios de prueba están listos',
  'fullAuth.notification_settings.proof_reminders_are_ready_on_this_phone':
    'Los recordatorios de prueba están listos en este teléfono',
  'fullAuth.notification_settings.proof_reminders_saved':
    'Recordatorios de prueba guardados',
  'fullAuth.notification_settings.quiet_hours': 'Horas de silencio',
  'fullAuth.notification_settings.quiet_hours_and_delivery':
    'Horas de silencio y entrega',
  'fullAuth.notification_settings.quiet_hours_end':
    'Fin de las horas de silencio',
  'fullAuth.notification_settings.quiet_hours_formattedquiethours':
    'Horas de silencio {formattedQuietHours}',
  'fullAuth.notification_settings.quiet_hours_not_saved':
    'No se han guardado las horas de silencio',
  'fullAuth.notification_settings.quiet_hours_saved':
    'Horas de silencio guardadas',
  'fullAuth.notification_settings.quiet_hours_start':
    'Inicio de las horas de silencio',
  'fullAuth.notification_settings.reload_your_saved_notification_choices':
    'Volver a cargar tus opciones de notificación guardadas',
  'fullAuth.notification_settings.reminder_setup_did_not_finish':
    'No se ha terminado de configurar el recordatorio',
  'fullAuth.notification_settings.reminder_time': 'Hora del recordatorio',
  'fullAuth.notification_settings.reminder_time_did_not_update_on_this_phone':
    'La hora del recordatorio no se ha actualizado en este teléfono',
  'fullAuth.notification_settings.reviews_and_group_activity':
    'Revisiones y actividad del grupo',
  'fullAuth.notification_settings.save_quiet_hours':
    'Guardar horas de silencio',
  'fullAuth.notification_settings.saving_quiet_hours':
    'Guardando las horas de silencio',
  'fullAuth.notification_settings.saving_your_choice': 'Guardando tu opción',
  'fullAuth.notification_settings.saving_your_choice_2': 'Guardando tu opción…',
  'fullAuth.notification_settings.saving_your_email_choice':
    'Guardando tu opción de correo…',
  'fullAuth.notification_settings.send_one_real_notification_to_this_signed_in_pho':
    'Envía una notificación real a este teléfono con la sesión iniciada.',
  'fullAuth.notification_settings.send_test_notification':
    'Enviar notificación de prueba',
  'fullAuth.notification_settings.set_quiet_hours_email_and_phone_notification_opt':
    'Configura las horas de silencio y las notificaciones por correo y en el teléfono.',
  'fullAuth.notification_settings.sign_in_again': 'Volver a iniciar sesión',
  'fullAuth.notification_settings.sign_in_again_to_send_a_test':
    'Vuelve a iniciar sesión para enviar una prueba',
  'fullAuth.notification_settings.sounds_previews_focus_and_scheduled_delivery':
    'Sonidos, vistas previas, Concentración y entrega programada.',
  'fullAuth.notification_settings.sounds_previews_focus_and_scheduled_delivery_are':
    'Los sonidos, las vistas previas, Concentración y la entrega programada dependen de tu teléfono.',
  'fullAuth.notification_settings.streaks_and_momenta': 'Rachas y Momenta',
  'fullAuth.notification_settings.test_notification_queued':
    'Notificación de prueba programada',
  'fullAuth.notification_settings.test_notification_was_not_queued':
    'No se ha programado la notificación de prueba',
  'fullAuth.notification_settings.test_notifications':
    'Notificaciones de prueba',
  'fullAuth.notification_settings.the_range_can_cross_midnight':
    'La franja puede pasar de medianoche.',
  'fullAuth.notification_settings.there_are_no_active_promises_to_schedule_yet_men':
    'Todavía no hay promesas activas que programar. Menta usará esta opción cuando empieces una.',
  'fullAuth.notification_settings.this_phone_is_not_ready_yet':
    'Este teléfono aún no está listo',
  'fullAuth.notification_settings.this_phone_is_ready_for_menta_notifications':
    'Este teléfono está listo para las notificaciones de Menta',
  'fullAuth.notification_settings.this_phone_may_show_a_reminder_at_your_preferred':
    'Este teléfono puede mostrar un recordatorio a tu hora preferida para las promesas activas.',
  'fullAuth.notification_settings.this_phone_must_allow_menta_notifications_before':
    'Este teléfono tiene que permitir las notificaciones de Menta para poder enviar una prueba.',
  'fullAuth.notification_settings.this_phone_will_not_show_menta_notifications_unt':
    'Este teléfono no mostrará notificaciones de Menta hasta que las actives.',
  'fullAuth.notification_settings.to_turn_them_on': 'Para activarlas',
  'fullAuth.notification_settings.try_again': 'Vuelve a intentarlo',
  'fullAuth.notification_settings.try_again_before_relying_on_notifications_from_t':
    'Vuelve a intentarlo antes de contar con las notificaciones de este teléfono.',
  'fullAuth.notification_settings.try_again_before_turning_on_reminders_for_this_p':
    'Vuelve a intentarlo antes de activar los recordatorios en este teléfono.',
  'fullAuth.notification_settings.turning_off_email_updates':
    'Desactivando las novedades por correo',
  'fullAuth.notification_settings.turning_on_email_updates':
    'Activando las novedades por correo',
  'fullAuth.notification_settings.wait_one_minute_before_requesting_another_test':
    'Espera un minuto antes de pedir otra prueba.',
  'fullAuth.notification_settings.your_choice_is_saved_but_an_old_reminder_may_sti':
    'Tu opción se ha guardado, pero puede que aún aparezca un recordatorio antiguo. Vuelve a intentarlo.',
  'fullAuth.notification_settings.your_choice_is_saved_but_proof_reminders_are_not':
    'Tu opción se ha guardado, pero los recordatorios de prueba aún no están listos. Vuelve a intentarlo.',
  'fullAuth.notification_settings.your_choice_is_saved_but_proof_reminders_are_not_2':
    'Tu opción se ha guardado, pero los recordatorios de prueba no están listos en este teléfono. Vuelve a intentarlo.',
  'fullAuth.notification_settings.your_choices_are_saved_but_this_phone_cannot_sho':
    'Tus opciones se han guardado, pero este teléfono no puede mostrar notificaciones de Menta hasta que las permitas.',
  'fullAuth.notification_settings.your_current_choice_remains_authoritative_until_':
    'Tu opción actual sigue vigente hasta que se guarde esta.',
  'fullAuth.notification_settings.your_current_quiet_hours_stay_in_place_until_thi':
    'Tus horas de silencio actuales se mantienen hasta que se guarde el cambio.',
  'fullAuth.notification_settings.your_menta_opt_out_is_saved_provider_removal_wil':
    'Tu baja en Menta se ha guardado. La baja con el proveedor se volverá a intentar la próxima vez que esta cuenta se conecte.',
  'fullAuth.notification_settings.your_phone_did_not_return_a_notification_setting':
    'Tu teléfono no ha devuelto ningún ajuste de notificaciones. No ha cambiado ningún permiso.',
  'fullAuth.notification_settings.your_phone_now_allows_notifications':
    'Tu teléfono ya permite notificaciones',
  'fullAuth.notification_settings.your_preferred_time_is_saved_but_this_phone_may_':
    'Tu hora preferida se ha guardado, pero puede que este teléfono siga usando la anterior. Vuelve a intentarlo.',
  'fullAuth.notification_settings.your_previous_email_choice_is_still_active':
    'Tu opción de correo anterior sigue activa.',
  'fullAuth.notification_settings.your_previous_notification_choice_is_still_activ':
    'Tu opción de notificaciones anterior sigue activa.',
  'fullAuth.notification_settings.your_previous_quiet_hours_remain_active':
    'Tus horas de silencio anteriores siguen activas.',
  'fullAuth.notification_settings.your_promises_still_work_menta_will_not_ask_agai':
    'Tus promesas siguen funcionando. Menta no volverá a preguntar aquí.',
  'fullAuth.notification_settings.your_promises_still_work_this_phone_will_not_sho':
    'Tus promesas siguen funcionando. Este teléfono no mostrará notificaciones de pruebas, revisiones ni grupos.',
  'fullAuth.notification_settings.your_proof_reminder_choice_is_unchanged_your_pho':
    'Tu opción de recordatorios de prueba no ha cambiado. Tu teléfono te preguntará a continuación.',
  'fullAuth.onboarding.32_character_code': 'Código de 32 caracteres',
  'fullAuth.onboarding.accountability': 'Compromiso compartido',
  'fullAuth.onboarding.activation_needs_attention':
    'La activación necesita atención',
  'fullAuth.onboarding.add_code_and_create': 'Añadir código y crear',
  'fullAuth.onboarding.add_it_now_or_create_your_promise_without_one_gr':
    'Añádelo ahora o crea tu promesa sin código. Las invitaciones a grupos funcionan aparte.',
  'fullAuth.onboarding.add_referral_code': 'Añadir código de invitación',
  'fullAuth.onboarding.after_it_s_created_menta_adds': 'Cuando la guardes',
  'fullAuth.onboarding.agree_and_choose_sign_in':
    'Aceptar y elegir cómo iniciar sesión',
  'fullAuth.onboarding.agree_and_continue': 'Aceptar y continuar',
  'fullAuth.onboarding.back': 'Atrás',
  'fullAuth.onboarding.back_to_backlabel': 'Volver a {backLabel}',
  'fullAuth.onboarding.choose_a_length_you_can_genuinely_follow_through':
    'Elige una duración que de verdad puedas cumplir.',
  'fullAuth.onboarding.choose_how_you_want_to_continue_your_draft_stays':
    'Elige cómo quieres continuar. Tu borrador se queda en este teléfono.',
  'fullAuth.onboarding.choose_length': 'Elegir duración',
  'fullAuth.onboarding.choose_proof': 'Elegir prueba',
  'fullAuth.onboarding.choose_the_proof_you_will_add_and_who_you_want_b':
    'Elige qué prueba añadirás y a quién quieres a tu lado.',
  'fullAuth.onboarding.choose_what_you_ll_add_when_it_s_done_you_can_in':
    'Elige qué añadirás cuando lo hayas hecho.',
  'fullAuth.onboarding.complete_this_promise_and_add_a_proofname_as_pro':
    'Cumple esta promesa y añade {proofName} como prueba.',
  'fullAuth.onboarding.confirm_the_required_documents':
    'Confirma los documentos necesarios.',
  'fullAuth.onboarding.confirming_code': 'Confirmando el código…',
  'fullAuth.onboarding.continue_to_referral':
    'Continuar al código de invitación',
  'fullAuth.onboarding.continue_to_save': 'Continuar para guardar',
  'fullAuth.onboarding.continue_with_apple': 'Continuar con Apple',
  'fullAuth.onboarding.continue_with_email': 'Continuar con correo',
  'fullAuth.onboarding.continue_with_google': 'Continuar con Google',
  'fullAuth.onboarding.could_not_finish_setup':
    'No se ha podido terminar la configuración',
  'fullAuth.onboarding.create_a_group': 'Crear un grupo',
  'fullAuth.onboarding.review_promise_invite':
    'Revisar invitación a la promesa',
  'fullAuth.onboarding.promise_invite_held':
    'Tu invitación a la promesa sigue guardada. Revísala a continuación; unirte es un paso aparte.',
  'fullAuth.onboarding.review_group_invite': 'Revisar invitación al grupo',
  'fullAuth.onboarding.group_invite_held':
    'Tu invitación al grupo sigue guardada. Revísala a continuación; unirte es un paso aparte.',
  'fullAuth.onboarding.open_event': 'Abrir evento',
  'fullAuth.onboarding.event_held':
    'Tu evento sigue guardado. Ábrelo a continuación; este comprobante de la promesa no confirma tu participación.',
  'fullAuth.onboarding.create_my_group': 'Invitar a alguien',
  'fullAuth.onboarding.create_my_group_detail':
    'Guárdala primero en privado y luego elige a quién invitar.',
  'fullAuth.onboarding.create_it_first_menta_will_then_add':
    'Las promesas suelen costar Momenta. Tu primera promesa corre de nuestra cuenta. Cuando la guardes, te daremos',
  'fullAuth.onboarding.create_without_a_code': 'Crear sin código',
  'fullAuth.onboarding.creating_your_first_promise':
    'Creando tu primera promesa',
  'fullAuth.onboarding.creating_your_first_promise_2':
    'Creando tu primera promesa…',
  'fullAuth.onboarding.days': 'días',
  'fullAuth.onboarding.decide_what_finished_will_look_like':
    'Decide cómo sabrás que lo has terminado.',
  'fullAuth.onboarding.do_you_have_a_referral_code':
    '¿Tienes un código de invitación?',
  'fullAuth.onboarding.edit': 'Editar',
  'fullAuth.onboarding.every_day': 'Cada día',
  'fullAuth.onboarding.every_day_2': '· Cada día ·',
  'fullAuth.promise.frequency.once_a_week': 'Una vez a la semana',
  'fullAuth.onboarding.first_promise': 'Primera promesa',
  'fullAuth.promise.frequency.three_times_a_week': 'Tres veces por semana',
  'fullAuth.promise.frequency.custom': 'Horario personalizado',
  'fullAuth.onboarding.first_promise_firstpromisecost_momenta_after_cre':
    'Primera promesa, {firstPromiseCost} Momenta. Después de crearla, {welcomeBonus} Momenta de bienvenida para lo que elijas más adelante.',
  'fullAuth.onboarding.free': 'gratis.',
  'fullAuth.onboarding.how_long_do_you_want_to_keep_this_promise':
    '¿Durante cuánto tiempo quieres cumplir esta promesa?',
  'fullAuth.onboarding.how_will_you_prove_it':
    '¿Cómo demostrarás que lo hiciste?',
  'fullAuth.onboarding.i_agree_to_menta_s_terms_of_use_and_community_st':
    'Acepto los Términos de uso y las Normas de la comunidad de Menta, y reconozco la Política de privacidad.',
  'fullAuth.onboarding.invite': 'Invitar',
  'fullAuth.onboarding.invite_people_after_this_promise_is_saved_member':
    'Invita a personas cuando hayas guardado esta promesa. Los miembros pueden revisar tu prueba.',
  'fullAuth.onboarding.just_me': 'Solo yo',
  'fullAuth.onboarding.keep_it_specific_enough_that_you_will_know_when_':
    'Que sea lo bastante concreta para saber cuándo la has terminado.',
  'fullAuth.onboarding.legal_confirmation_did_not_finish':
    'La confirmación legal no se ha completado.',
  'fullAuth.onboarding.legal_review_was_not_completed':
    'La revisión legal no se ha completado.',
  'fullAuth.onboarding.length': 'Duración',
  'fullAuth.onboarding.local_draft': 'Borrador local',
  'fullAuth.onboarding.menta': 'Menta',
  'fullAuth.onboarding.menta_confirms_the_first_deadline_when_you_save':
    'Menta confirma el primer plazo cuando guardas.',
  'fullAuth.onboarding.menta_confirms_your_first_deadline_when_the_prom':
    'Menta confirma tu primer plazo cuando se crea la promesa.',
  'fullAuth.onboarding.menta_is_confirming_your_promise_and_momenta_bal':
    'Menta está confirmando tu promesa y tu saldo de Momenta.',
  'fullAuth.onboarding.menta_mascot_offering_you_a_bag_of_momenta_token':
    'La mascota de Menta te ofrece una bolsa de fichas de Momenta',
  'fullAuth.onboarding.menta_mascot_waving_you_toward_saving_this_promi':
    'La mascota de Menta te anima a guardar esta promesa',
  'fullAuth.onboarding.menta_saved_the_promise_and_confirmed_your_accou':
    'Menta ha guardado la promesa y ha confirmado tu cuenta con el mismo comprobante del servidor.',
  'fullAuth.onboarding.message_your_draft_is_still_here':
    '{message} Tu borrador sigue aquí.',
  'fullAuth.onboarding.momenta': 'Momenta',
  'fullAuth.onboarding.momenta_for_extra_promises_groups_freezes_and_it':
    'Momenta para promesas extra, grupos, congelaciones de racha y artículos.',
  'fullAuth.onboarding.momenta_for_later_choices': 'Momenta para empezar.',
  'fullAuth.onboarding.my_promise': 'Mi promesa',
  'fullAuth.onboarding.next_due': 'Próximo plazo',
  'fullAuth.onboarding.note': 'Nota',
  'fullAuth.onboarding.opening_email': 'Abriendo el correo…',
  'fullAuth.onboarding.photo': 'Foto',
  'fullAuth.onboarding.preview_my_promise': 'Ver mi promesa',
  'fullAuth.onboarding.promise_length': 'Duración de la promesa',
  'fullAuth.onboarding.promise_saved_and_confirmed':
    'Promesa guardada y confirmada',
  'fullAuth.onboarding.proof': 'Prueba',
  'fullAuth.onboarding.proof_and_support': 'PRUEBA Y APOYO',
  'fullAuth.onboarding.proof_cadence': 'Frecuencia de la prueba',
  'fullAuth.onboarding.providername_sign_in_did_not_finish':
    'No se ha completado el inicio de sesión con {providerName}.',
  'fullAuth.onboarding.read_the_current_account_and_community_documents':
    'Lee los documentos actuales de la cuenta y de la comunidad antes de crear tu promesa.',
  'fullAuth.onboarding.record_a_short_clip': 'Graba un vídeo corto.',
  'fullAuth.onboarding.referral_code': 'Código de invitación',
  'fullAuth.onboarding.reopen_onboarding_before_continuing_with_email':
    'Vuelve a abrir la introducción antes de continuar con el correo.',
  'fullAuth.onboarding.restored_from_this_phone': 'Recuperado de este teléfono',
  'fullAuth.onboarding.return_to_draft': 'Volver al borrador',
  'fullAuth.onboarding.review_menta_s_terms': 'Revisar los términos de Menta',
  'fullAuth.onboarding.review_your_promise': 'Revisa tu promesa',
  'fullAuth.onboarding.save_this_promise_to_menta':
    'Guarda esta promesa en Menta.',
  'fullAuth.onboarding.save_your_promise': 'Guarda tu promesa',
  'fullAuth.onboarding.schedule': 'Frecuencia',
  'fullAuth.onboarding.schedule_every_day': 'Frecuencia: cada día',
  'fullAuth.onboarding.show_another_example': 'Ver otro ejemplo',
  'fullAuth.onboarding.sign_in_to_save_my_promise':
    'Inicia sesión para guardar mi promesa',
  'fullAuth.onboarding.start_privately_you_can_invite_people_later':
    'Mantenla en privado. Puedes invitar a alguien más adelante.',
  'fullAuth.onboarding.start_with_one_thing_that_matters_today':
    'Empieza con algo que te importe hoy.',
  'fullAuth.onboarding.stay_here_and_try_again_so_menta_can_keep_this_p':
    'Quédate aquí y vuelve a intentarlo para que Menta pueda conservar esta promesa en este teléfono.',
  'fullAuth.onboarding.stay_here_and_try_email_sign_in_again_so_menta_c':
    'Quédate aquí y vuelve a intentar iniciar sesión con el correo para que Menta pueda conservar esta promesa en este teléfono.',
  'fullAuth.onboarding.take_one_photo': 'Haz una foto.',
  'fullAuth.onboarding.this_choice_sets_your_next_step_it_does_not_add_':
    'Elige cómo empezar. No se añade a nadie hasta que envíes una invitación.',
  'fullAuth.onboarding.use_duration_days': 'Usar {duration} días',
  'fullAuth.onboarding.video': 'Vídeo',
  'fullAuth.onboarding.welcome_momenta': 'Momenta de bienvenida',
  'fullAuth.onboarding.what_s_one_thing_you_want_to_do': '¿Qué quieres hacer?',
  'fullAuth.onboarding.who_will_hold_you_accountable':
    '¿Quién te ayudará a cumplirla?',
  'fullAuth.onboarding.write_what_happened': 'Escribe lo que ha pasado.',
  'fullAuth.onboarding.you_can_review_these_choices_before_menta_saves_':
    'Puedes revisar estas opciones antes de que Menta guarde nada.',
  'fullAuth.onboarding.your_account_changed': 'Tu cuenta ha cambiado.',
  'fullAuth.onboarding.your_draft_could_not_be_saved_yet':
    'Tu borrador aún no se ha podido guardar.',
  'fullAuth.onboarding.your_draft_is_private_on_this_phone_sign_in_to_k':
    'Tu borrador es privado en este teléfono. Inicia sesión para conservarlo.',
  'fullAuth.onboarding.your_draft_is_still_private_on_this_phone':
    'Tu borrador sigue siendo privado en este teléfono.',
  'fullAuth.onboarding.your_first_promise': 'TU PRIMERA PROMESA',
  'fullAuth.onboarding.for_promise': 'Para «{promise}»',
  'fullAuth.onboarding.check_ins': '{count} registros',
  'fullAuth.onboarding.your_first_promise_2': 'Tu primera promesa',
  'fullAuth.onboarding.your_first_promise_is': 'Tu primera promesa es',
  'fullAuth.onboarding.your_promise': 'Tu promesa',
  'fullAuth.onboarding.your_promise_2': 'TU PROMESA',
  'fullAuth.onboarding.your_promise_is_ready': 'Tu promesa está lista.',
  'fullAuth.onboarding.your_promise_is_safe_confirm_the_documents_below':
    'Tu promesa está a salvo. Confirma los documentos de abajo antes de crearla.',
  'fullAuth.onboarding.your_promise_is_safe_try_again_before_continuing':
    'Tu promesa está a salvo. Vuelve a intentarlo antes de continuar.',
  'fullAuth.onboarding.your_promise_is_still_safe_review_the_current_do':
    'Tu promesa sigue a salvo. Revisa los documentos actuales cuando quieras continuar.',
  'fullAuth.password_recovery.change_my_password': 'Cambiar mi contraseña',
  'fullAuth.password_recovery.choose_a_new_password':
    'Elige una contraseña nueva',
  'fullAuth.password_recovery.close': 'Cerrar',
  'fullAuth.password_recovery.close_password_reset':
    'Cerrar el restablecimiento de contraseña',
  'fullAuth.password_recovery.confirm_password': 'Confirmar contraseña',
  'fullAuth.password_recovery.couldn_t_change_your_password':
    'No se ha podido cambiar tu contraseña',
  'fullAuth.password_recovery.enter_new_password':
    'Introduce la contraseña nueva',
  'fullAuth.password_recovery.menta': 'Menta',
  'fullAuth.password_recovery.new_password': 'Contraseña nueva',
  'fullAuth.password_recovery.or_more_characters_both_entries_must_match':
    'caracteres o más. Las dos contraseñas deben coincidir.',
  'fullAuth.password_recovery.other_signed_in_devices_may_ask_for_the_new_pass':
    'Puede que otros dispositivos con la sesión iniciada te pidan la contraseña nueva.',
  'fullAuth.password_recovery.password_changed': 'Contraseña cambiada',
  'fullAuth.password_recovery.re_enter_new_password':
    'Vuelve a introducir la contraseña nueva',
  'fullAuth.password_recovery.request_a_new_link': 'Pedir un enlace nuevo',
  'fullAuth.password_recovery.request_a_new_link_your_draft_is_still_on_this_p':
    'Pide un enlace nuevo. Tu borrador sigue en este teléfono.',
  'fullAuth.password_recovery.return_to': 'Volver a',
  'fullAuth.password_recovery.sign_in': 'Iniciar sesión',
  'fullAuth.password_recovery.sign_in_instead': 'Iniciar sesión',
  'fullAuth.password_recovery.this_reset_link_has_expired':
    'Este enlace para restablecer la contraseña ha caducado.',
  'fullAuth.password_recovery.use': 'Usa',
  'fullAuth.password_recovery.your_password_has_been_changed':
    'Tu contraseña se ha cambiado.',
  'fullAuth.report_issue.1_open_2_tap_3_notice':
    '1. Abre… 2. Toca… 3. Veo que…',
  'fullAuth.report_issue.add_a_screenshot': 'Añadir una captura de pantalla',
  'fullAuth.report_issue.add_more_detail': 'Añadir más detalles',
  'fullAuth.report_issue.add_the_basics': 'Añade lo básico',
  'fullAuth.report_issue.attach_a_jpeg_png_or_webp_screenshot':
    'Adjunta una captura de pantalla en JPEG, PNG o WebP.',
  'fullAuth.report_issue.back_to_support': 'Volver a ayuda',
  'fullAuth.report_issue.choose_a_screenshot_smaller_than_8_mb':
    'Elige una captura de pantalla de menos de 8 MB.',
  'fullAuth.report_issue.choose_an_image': 'Elige una imagen',
  'fullAuth.report_issue.choose_another_report': 'Elige otro informe',
  'fullAuth.report_issue.choose_screenshot': 'Elegir captura de pantalla',
  'fullAuth.report_issue.could_not_find_this_saved_report':
    'No se ha encontrado este informe guardado',
  'fullAuth.report_issue.crash_reference': 'Referencia del fallo',
  'fullAuth.report_issue.expected_result_optional':
    'Resultado esperado, opcional',
  'fullAuth.report_issue.expected_result_optional_2':
    'Resultado esperado (opcional)',
  'fullAuth.report_issue.feedback_received': 'Comentarios recibidos',
  'fullAuth.report_issue.feedback_required': 'Comentarios, obligatorio',
  'fullAuth.report_issue.give_the_report_a_short_title_and_explain_what_h':
    'Ponle un título corto al informe y explica qué ha pasado.',
  'fullAuth.report_issue.inappropriate': 'inapropiado',
  'fullAuth.report_issue.it_is_not_saved_under_this_account_nothing_was_c':
    'No está guardado en esta cuenta. No se ha cambiado nada.',
  'fullAuth.report_issue.keep_this_screen_open_while_you_write_or_copy_th':
    'Mantén esta pantalla abierta mientras escribes o copia el texto antes de salir.',
  'fullAuth.report_issue.last_step': 'Último paso',
  'fullAuth.report_issue.menta_could_not_open_your_photo_library_try_agai':
    'Menta no ha podido abrir tu fototeca. Vuelve a intentarlo.',
  'fullAuth.report_issue.menta_could_not_preserve_this_report_locally_kee':
    'Menta no ha podido conservar este informe en el teléfono. Mantén esta pantalla abierta; no se ha enviado nada al equipo de ayuda.',
  'fullAuth.report_issue.menta_does_not_add_device_diagnostics_to_this_re':
    'Menta no añade diagnósticos del dispositivo a este informe.',
  'fullAuth.report_issue.menta_includes_the_item_or_screen_you_reported':
    'Menta incluye el elemento o la pantalla que has informado.',
  'fullAuth.report_issue.not_sent': 'no enviado',
  'fullAuth.report_issue.open': 'abierto',
  'fullAuth.report_issue.preparing_private_report_draft':
    'Preparando el borrador privado del informe',
  'fullAuth.report_issue.proof_upload_gets_stuck':
    'La subida de la prueba se queda atascada',
  'fullAuth.report_issue.reference': 'Referencia',
  'fullAuth.report_issue.remove': 'Quitar',
  'fullAuth.report_issue.replace_screenshot': 'Cambiar captura de pantalla',
  'fullAuth.report_issue.report_an_issue': 'Informar de un problema',
  'fullAuth.report_issue.report_not_sent': 'Informe no enviado',
  'fullAuth.report_issue.report_received': 'Informe recibido',
  'fullAuth.report_issue.retry_sending_report': 'Volver a enviar el informe',
  'fullAuth.report_issue.return_to_support': 'Volver a ayuda',
  'fullAuth.report_issue.review_feedback': 'Revisar comentarios',
  'fullAuth.report_issue.review_report': 'Revisar informe',
  'fullAuth.report_issue.screenshot_did_not_open':
    'No se ha abierto la captura de pantalla',
  'fullAuth.report_issue.screenshot_is_too_large':
    'La captura de pantalla es demasiado grande',
  'fullAuth.report_issue.screenshot_optional': 'Captura de pantalla (opcional)',
  'fullAuth.report_issue.selected_support_screenshot':
    'Captura de pantalla elegida para el equipo de ayuda',
  'fullAuth.report_issue.server_confirmed': 'confirmado por el servidor',
  'fullAuth.report_issue.share_feedback': 'Enviar comentarios',
  'fullAuth.report_issue.short_title': 'Título corto',
  'fullAuth.report_issue.short_title_required': 'Título corto, obligatorio',
  'fullAuth.report_issue.sign_in_again_before_sending_this_private_report':
    'Vuelve a iniciar sesión antes de enviar este informe privado. No se ha enviado nada.',
  'fullAuth.report_issue.sign_in_required': 'Tienes que iniciar sesión',
  'fullAuth.report_issue.status': 'Estado',
  'fullAuth.report_issue.steps_to_reproduce_optional':
    'Pasos para reproducirlo, opcional',
  'fullAuth.report_issue.steps_to_reproduce_optional_2':
    'Pasos para reproducirlo (opcional)',
  'fullAuth.report_issue.support_reference': 'Referencia de ayuda ·',
  'fullAuth.report_issue.this_comes_from_where_you_opened':
    '. Viene de donde lo abriste',
  'fullAuth.report_issue.this_report_is_not_being_saved':
    'Este informe no se está guardando',
  'fullAuth.report_issue.type': 'tipo:',
  'fullAuth.report_issue.we_ll_show_a_support_reference_only_after_the_re':
    'Solo mostraremos una referencia de ayuda cuando llegue el informe. Si no está claro si el primer intento ha funcionado, Vuelve a intentarlo usa el mismo informe, así que no se creará un duplicado.',
  'fullAuth.report_issue.what_did_you_expect_menta_to_do':
    '¿Qué esperabas que hiciera Menta?',
  'fullAuth.report_issue.what_happened': 'Qué pasó',
  'fullAuth.report_issue.what_happened_required': 'Qué pasó, obligatorio',
  'fullAuth.report_issue.what_i_would_change': 'Lo que cambiaría',
  'fullAuth.report_issue.what_were_you_doing_and_what_did_menta_show':
    '¿Qué estabas haciendo y qué mostró Menta?',
  'fullAuth.report_issue.what_would_you_like_the_menta_team_to_know':
    '¿Qué te gustaría contarle al equipo de Menta?',
  'fullAuth.report_issue.will_help_support_find_the_error':
    'ayudará al equipo de ayuda a encontrar el error.',
  'fullAuth.report_issue.your_draft_stays_on_this_phone_until_you_send_it':
    'Tu borrador se queda en este teléfono hasta que lo envíes.',
  'fullAuth.report_issue.your_feedback': 'Tus comentarios',
  'fullAuth.report_issue.your_screenshot_will_be_sent_with_the_report_onl':
    'Tu captura de pantalla se enviará con el informe. Solo el personal de ayuda autorizado puede abrirla.',
  'fullAuth.settings.a_compatible_update_is_downloaded_and_ready':
    'Hay una actualización compatible descargada y lista.',
  'fullAuth.settings.account_control': 'Control de la cuenta',
  'fullAuth.settings.account_was_not_deleted': 'La cuenta no se ha eliminado',
  'fullAuth.settings.active_view_or_manage_your_subscription':
    'Activa. Consulta o gestiona tu suscripción.',
  'fullAuth.settings.ad_measurement': 'Medición de anuncios',
  'fullAuth.settings.ad_privacy_choices': 'Opciones de privacidad de anuncios',
  'fullAuth.settings.ad_privacy_choices_did_not_open':
    'No se han abierto las opciones de privacidad de anuncios',
  'fullAuth.settings.advanced_diagnostics': 'Diagnóstico avanzado',
  'fullAuth.settings.advanced_diagnostics_are_off':
    'El diagnóstico avanzado está desactivado',
  'fullAuth.settings.advanced_diagnostics_are_on':
    'El diagnóstico avanzado está activado',
  'fullAuth.settings.advanced_diagnostics_are_still_off_check_your_co':
    'El diagnóstico avanzado sigue desactivado. Comprueba tu conexión y vuelve a intentarlo.',
  'fullAuth.settings.ask_for_help_share_feedback_or_check_a_saved_rep':
    'Pide ayuda, envía comentarios o consulta un informe guardado.',
  'fullAuth.settings.back_to_you': 'Volver a Perfil',
  'fullAuth.settings.before_you_delete_your_account':
    'Antes de eliminar tu cuenta',
  'fullAuth.settings.check_for_updates': 'Buscar actualizaciones',
  'fullAuth.settings.check_your_connection_and_try_again':
    'Comprueba tu conexión y vuelve a intentarlo.',
  'fullAuth.settings.checking_for_updates': 'Buscando actualizaciones',
  'fullAuth.settings.checking_your_account': 'Comprobando tu cuenta',
  'fullAuth.settings.checks_the_current_connection_and_known_account_':
    'Vuelve a comprobar la conexión actual y los datos conocidos de la cuenta.',
  'fullAuth.settings.close_and_reopen_menta_to_apply_the_downloaded_u':
    'Cierra y vuelve a abrir Menta para aplicar la actualización descargada.',
  'fullAuth.settings.community_standards': 'Normas de la comunidad',
  'fullAuth.settings.confirmation': 'Confirmación',
  'fullAuth.settings.connect_before_deleting_your_account':
    'Conéctate antes de eliminar tu cuenta',
  'fullAuth.settings.connect_to_check_this_phone':
    'Conéctate para comprobar este teléfono.',
  'fullAuth.settings.contact_support': 'Contactar con ayuda',
  'fullAuth.settings.continue_to_sign_in': 'Continuar para iniciar sesión',
  'fullAuth.settings.could_not_check_your_account':
    'No se ha podido comprobar tu cuenta',
  'fullAuth.settings.could_not_load_your_profile':
    'No se ha podido cargar tu perfil.',
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
  'fullAuth.settings.delete_account': 'Eliminar cuenta',
  'fullAuth.settings.delete_account_will_be_available_when_this_check':
    'Podrás eliminar la cuenta cuando termine esta comprobación.',
  'fullAuth.settings.deletion_result_unknown': 'No se sabe si se ha eliminado',
  'fullAuth.settings.do_not_send_another_request_yet_check_whether_yo':
    'No envíes otra solicitud todavía. Comprueba si aún puedes iniciar sesión o contacta con el equipo de ayuda.',
  'fullAuth.settings.download_the_latest_compatible_menta_update':
    'Descarga la última actualización compatible de Menta.',
  'fullAuth.settings.extra_performance_measurements_start_now':
    'Las mediciones de rendimiento adicionales empiezan ahora.',
  'fullAuth.settings.extra_performance_measurements_start_now_masked_':
    'Las mediciones de rendimiento adicionales empiezan ahora. La grabación de diagnóstico con datos ocultos empieza en las pantallas compatibles; vuelve a abrir Menta para aplicar todos los ajustes de grabación de Sentry.',
  'fullAuth.settings.feedback_and_support': 'Comentarios y ayuda',
  'fullAuth.settings.for_your_privacy_account_settings_stay_hidden_un':
    'Por tu privacidad, los ajustes de la cuenta se ocultan hasta que vuelvas a iniciar sesión.',
  'fullAuth.settings.help_and_feedback': 'Ayuda y comentarios',
  'fullAuth.settings.how_menta_handles_your_data':
    'Cómo trata Menta tus datos.',
  'fullAuth.settings.keep_current_setting': 'Mantener el ajuste actual',
  'fullAuth.settings.keep_my_account': 'Conservar mi cuenta',
  'fullAuth.settings.label_did_not_open': 'No se ha abierto {label}',
  'fullAuth.settings.leave_a_review': 'Escribir una reseña',
  'fullAuth.settings.leave_this_device_your_menta_account_stays_activ':
    'Salir en este dispositivo. Tu cuenta de Menta sigue activa.',
  'fullAuth.settings.loading_account_specific_settings':
    'Cargando los ajustes de la cuenta',
  'fullAuth.settings.measure_whether_meta_ads_helped_someone_use_ment':
    'Mide si los anuncios de Meta ayudaron a alguien a usar Menta.',
  'fullAuth.settings.membership': 'Membresía',
  'fullAuth.settings.menta_cannot_check_whether_you_still_own_a_group':
    'Menta no puede comprobar si todavía eres propietario de algún grupo. Revisa tus grupos antes de eliminar la cuenta. Eliminar Menta no cancela Menta Pro, así que gestiona antes la suscripción con Apple.',
  'fullAuth.settings.menta_could_not_check_for_updates':
    'Menta no ha podido buscar actualizaciones',
  'fullAuth.settings.menta_could_not_delete_the_account_check_your_co':
    'Menta no ha podido eliminar la cuenta. Comprueba tu conexión y vuelve a intentarlo.',
  'fullAuth.settings.menta_could_not_end_this_session_your_account_an':
    'Menta no ha podido cerrar esta sesión. Tu cuenta y la vista local no han cambiado.',
  'fullAuth.settings.menta_could_not_restart': 'Menta no ha podido reiniciarse',
  'fullAuth.settings.menta_is_checking_for_the_latest_compatible_upda':
    'Menta está buscando la última actualización compatible.',
  'fullAuth.settings.menta_is_up_to_date': 'Menta está actualizada',
  'fullAuth.settings.menta_pro': 'Menta Pro',
  'fullAuth.settings.menta_update_ready': 'Actualización de Menta lista',
  'fullAuth.settings.menta_will_continue_using_its_current_safe_versi':
    'Menta seguirá usando su versión segura actual.',
  'fullAuth.settings.needs_attention': 'Necesita atención',
  'fullAuth.settings.nothing_has_been_deleted': 'No se ha eliminado nada',
  'fullAuth.settings.nothing_was_deleted_reconnect_then_try_again':
    'No se ha eliminado nada. Vuelve a conectarte e inténtalo de nuevo.',
  'fullAuth.settings.notifications': 'Notificaciones',
  'fullAuth.settings.offline': 'Sin conexión',
  'fullAuth.settings.open_when_connected': 'Se abre cuando haya conexión.',
  'fullAuth.settings.opens_menta_pro_plans_purchase_restore_or_your_a':
    'Abre los planes de Menta Pro, la restauración de compras o tu plan activo.',
  'fullAuth.settings.opens_sign_in_for_this_account':
    'Abre el inicio de sesión de esta cuenta.',
  'fullAuth.settings.optional_performance_measurements':
    'Mediciones de rendimiento opcionales.',
  'fullAuth.settings.optional_performance_measurements_and_masked_dia':
    'Mediciones de rendimiento opcionales y grabación de diagnóstico con datos ocultos.',
  'fullAuth.settings.ordinary_crash_reports_stay_on':
    'Los informes de fallos habituales siguen activados.',
  'fullAuth.settings.ordinary_crash_reports_stay_on_when_advanced_dia':
    'Los informes de fallos habituales siguen activados aunque el diagnóstico avanzado esté desactivado.',
  'fullAuth.settings.other_settings_are_still_available_try_loading_t':
    'Los demás ajustes siguen disponibles. Vuelve a cargar el perfil cuando haya conexión.',
  'fullAuth.settings.permanently_delete_your_account_and_menta_data':
    'Elimina para siempre tu cuenta y tus datos de Menta.',
  'fullAuth.settings.plans_benefits_and_restore_purchases':
    'Planes, ventajas y restaurar compras.',
  'fullAuth.settings.preferences': 'Preferencias',
  'fullAuth.settings.press_restart_to_apply_the_downloaded_update':
    'Pulsa Reiniciar para aplicar la actualización descargada.',
  'fullAuth.settings.privacy_and_legal': 'Privacidad y aspectos legales',
  'fullAuth.settings.privacy_policy': 'Política de privacidad',
  'fullAuth.settings.profile_details': 'Datos del perfil',
  'fullAuth.settings.proof_reminders_reviews_and_group_updates':
    'Recordatorios de prueba, revisiones y novedades de los grupos.',
  'fullAuth.settings.read_menta_s_terms': 'Lee los términos de Menta.',
  'fullAuth.settings.reopen_menta_to_stop_diagnostic_recording_ordina':
    'Vuelve a abrir Menta para detener la grabación de diagnóstico. Los informes de fallos habituales siguen activados.',
  'fullAuth.settings.restarting_menta': 'Reiniciando Menta',
  'fullAuth.settings.review_choices_used_for_sponsor_videos':
    'Revisa las opciones que se usan para los vídeos de patrocinadores.',
  'fullAuth.settings.review_deletion_confirmation':
    'Revisar la confirmación de eliminación',
  'fullAuth.settings.review_the_current_terms_and_when_you_accepted_t':
    'Consulta los términos actuales y cuándo los aceptaste.',
  'fullAuth.settings.rules_for_promises_proof_and_groups':
    'Normas para promesas, pruebas y grupos.',
  'fullAuth.settings.session': 'Sesión',
  'fullAuth.settings.settings': 'Ajustes',
  'fullAuth.settings.share_your_experience_and_help_others_discover_m':
    'Comparte tu experiencia y ayuda a otras personas a descubrir Menta.',
  'fullAuth.settings.sign_in_again': 'Volver a iniciar sesión',
  'fullAuth.settings.sign_in_again_before_deleting_your_account':
    'Vuelve a iniciar sesión antes de eliminar tu cuenta.',
  'fullAuth.settings.sign_in_again_to_see_settings':
    'Vuelve a iniciar sesión para ver los ajustes.',
  'fullAuth.settings.sign_in_needed': 'Tienes que iniciar sesión',
  'fullAuth.settings.sign_out': 'Cerrar sesión',
  'fullAuth.settings.small_performance_impact':
    'Poco impacto en el rendimiento',
  'fullAuth.settings.some_destinations_need_a_connection':
    'Algunos destinos necesitan conexión.',
  'fullAuth.settings.terms_of_use': 'Términos de uso',
  'fullAuth.settings.terms_you_accepted': 'Términos que aceptaste',
  'fullAuth.settings.the_downloaded_update_will_open_automatically':
    'La actualización descargada se abrirá automáticamente.',
  'fullAuth.settings.the_next_screen_asks_you_to_type_delete_before_m':
    'En la siguiente pantalla tendrás que escribir DELETE antes de que Menta envíe la solicitud.',
  'fullAuth.settings.this_can_use_a_small_amount_of_extra_processing_':
    'Puede consumir un poco más de procesador, batería y datos móviles mientras Menta está abierta. La grabación solo empieza en las pantallas compatibles. Vuelve a abrir Menta después de desactivarlo para detener la grabación de Sentry.',
  'fullAuth.settings.this_device_has_the_latest_compatible_update':
    'Este dispositivo tiene la última actualización compatible.',
  'fullAuth.settings.to_confirm': 'para confirmar',
  'fullAuth.settings.tries_to_load_the_signed_in_profile_again':
    'Vuelve a cargar el perfil con la sesión iniciada.',
  'fullAuth.settings.try_again_in_a_moment_or_open_the_link_from_the_':
    'Vuelve a intentarlo en un momento o abre el enlace desde la ficha de la App Store.',
  'fullAuth.settings.try_again_later_optional_ads_stay_unavailable_un':
    'Vuelve a intentarlo más tarde. Los anuncios opcionales no estarán disponibles hasta que revises estas opciones.',
  'fullAuth.settings.try_connection_again': 'Volver a comprobar la conexión',
  'fullAuth.settings.try_loading_profile_again': 'Volver a cargar el perfil',
  'fullAuth.settings.try_loading_your_name_and_profile_photo_again':
    'Vuelve a cargar tu nombre y tu foto de perfil.',
  'fullAuth.settings.try_the_account_check_again_before_you_delete_an':
    'Vuelve a comprobar la cuenta antes de eliminar nada.',
  'fullAuth.settings.turn_off_advanced_diagnostics':
    'Desactivar el diagnóstico avanzado',
  'fullAuth.settings.turn_on_advanced_diagnostics':
    'Activar el diagnóstico avanzado',
  'fullAuth.settings.type': 'Escribe',
  'fullAuth.settings.type_delete_to_confirm_account_deletion':
    'Escribe DELETE para confirmar la eliminación de la cuenta',
  'fullAuth.settings.update_checks_are_unavailable':
    'No se pueden buscar actualizaciones',
  'fullAuth.settings.while_enabled_this_can_use_a_small_amount_of_ext':
    'Mientras esté activado, puede consumir un poco más de procesador, batería y datos móviles cuando Menta está abierta.',
  'fullAuth.settings.you_are_still_signed_in': 'Sigues con la sesión iniciada',
  'fullAuth.settings.your_account_stays_open_until_menta_confirms_the':
    'Tu cuenta sigue abierta hasta que Menta confirme la eliminación.',
  'fullAuth.settings.your_account_was_deleted': 'Tu cuenta se ha eliminado.',
  'fullAuth.settings.your_choice_was_not_saved': 'No se ha guardado tu opción',
  'fullAuth.settings.your_saved_settings_are_still_here':
    'Tus ajustes guardados siguen aquí.',
  'fullAuth.settings.your_support_drafts_for_this_account_were_remove':
    'Se han quitado tus borradores de ayuda de esta cuenta.',
  'fullAuth.support.change_menta_permissions_on_this_phone':
    'Cambiar los permisos de Menta en este teléfono',
  'fullAuth.support.check_app_and_connection': 'Comprobar la app y la conexión',
  'fullAuth.support.check_the_apple_account_used_for_the_original_pu':
    'Comprueba la cuenta de Apple que usaste para la compra original. Si Apple muestra un cargo, informa del problema antes de volver a comprar.',
  'fullAuth.support.checking_private_report_drafts':
    'Comprobando los borradores de informes privados',
  'fullAuth.support.checking_purchases': 'Comprobando compras',
  'fullAuth.support.choose_what_you_need_you_can_review_everything_b':
    'Elige lo que necesitas. Puedes revisarlo todo antes de enviarlo.',
  'fullAuth.support.connection_available': 'Conexión disponible',
  'fullAuth.support.connection_check_did_not_finish':
    'No se ha terminado de comprobar la conexión',
  'fullAuth.support.could_not_check_earlier_purchases':
    'No se han podido comprobar las compras anteriores',
  'fullAuth.support.do_not_buy_it_again_while_this_check_continues':
    'No vuelvas a comprarlo mientras sigue esta comprobación.',
  'fullAuth.support.find_an_earlier_menta_pro_purchase':
    'Buscar una compra anterior de Menta Pro',
  'fullAuth.support.hide_more_help': 'Ocultar más ayuda',
  'fullAuth.support.looking_for_an_earlier_menta_pro_purchase':
    'Buscando una compra anterior de Menta Pro',
  'fullAuth.support.menta_appears_offline':
    'Parece que Menta no tiene conexión',
  'fullAuth.support.menta_pro_is_active_again':
    'Menta Pro vuelve a estar activo',
  'fullAuth.support.menta_pro_is_still_being_checked':
    'Todavía se está comprobando Menta Pro',
  'fullAuth.support.more_help': 'Más ayuda',
  'fullAuth.support.no_matching_purchase_was_found':
    'No se ha encontrado ninguna compra que coincida',
  'fullAuth.support.nothing_was_purchased_or_changed_check_the_conne':
    'No se ha comprado ni cambiado nada. Comprueba la conexión y vuelve a intentarlo.',
  'fullAuth.support.open_phone_settings': 'Abrir ajustes del teléfono',
  'fullAuth.support.opens_a_separate_support_report':
    'Abre un informe de ayuda aparte.',
  'fullAuth.support.opens_sign_in_before_starting_a_private_report':
    'Abre el inicio de sesión antes de empezar un informe privado.',
  'fullAuth.support.other_help': 'Otra ayuda',
  'fullAuth.support.restore_purchases': 'Restaurar compras',
  'fullAuth.support.saved_on_this_phone_and_still_waiting_to_be_sent':
    'guardado(s) en este teléfono y pendiente(s) de enviar.',
  'fullAuth.support.saved_reports': 'Informes guardados',
  'fullAuth.support.see_app_version_connection_and_saved_proof':
    'Ver la versión de la app, la conexión y las pruebas guardadas',
  'fullAuth.support.share_feedback': 'Enviar comentarios',
  'fullAuth.support.sign_in_required': 'Tienes que iniciar sesión',
  'fullAuth.support.sign_in_to_report_an_issue':
    'Inicia sesión para informar de un problema',
  'fullAuth.support.support': 'Ayuda',
  'fullAuth.support.support_drafts_stay_private_to_the_account_that_':
    'Los borradores de ayuda son privados de la cuenta que los creó. Inicia sesión antes de empezar un informe nuevo.',
  'fullAuth.support.this_does_not_start_a_new_purchase_or_charge_thi':
    'No inicia una compra nueva ni hace ningún cargo a esta cuenta.',
  'fullAuth.support.version_appversion_savedcopy_nothing_changed_try':
    'Versión {appVersion}. {savedCopy} No ha cambiado nada. Vuelve a comprobarlo cuando mejore tu conexión.',
  'fullAuth.support.version_appversion_savedcopy_saved_proof_stays_o':
    'Versión {appVersion}. {savedCopy} Las pruebas guardadas se quedan en este teléfono hasta que Menta confirme que se han enviado.',
  'fullAuth.support.your_earlier_purchase_is_active_on_this_account':
    'Tu compra anterior está activa en esta cuenta.',
  'fullAuth.system_settings.back_to_support': 'Volver a ayuda',
  'fullAuth.system_settings.change_notification_camera_photo_or_ad_measureme':
    'Cambia los permisos de notificaciones, cámara, fotos o medición de anuncios en los ajustes del teléfono. Menta no puede cambiarlos ni confirmarlos desde esta pantalla.',
  'fullAuth.system_settings.nothing_changed_in_menta_open_your_phone_setting':
    'No ha cambiado nada en Menta. Abre los ajustes del teléfono manualmente y vuelve a la app.',
  'fullAuth.system_settings.open_phone_settings': 'Abrir ajustes del teléfono',
  'fullAuth.system_settings.opening_phone_settings_does_not_confirm_that_a_p':
    'Abrir los ajustes del teléfono no confirma que haya cambiado un permiso.',
  'fullAuth.system_settings.phone_settings': 'Ajustes del teléfono',
  'fullAuth.system_settings.phone_settings_could_not_open':
    'No se han podido abrir los ajustes del teléfono',
  'fullAuth.system_settings.return_when_you_re_done': 'Vuelve cuando termines',
  'fullAuth.tabs_profile.active_and_past_promises':
    'Promesas activas y pasadas',
  'fullAuth.tabs_profile.active_promises': 'Promesas activas',
  'fullAuth.tabs_profile.activepromisecount_active_promises_currentstreak':
    '{activePromiseCount} promesas activas, racha de {currentStreak} días, {length} grupos',
  'fullAuth.tabs_profile.change_profile_photo': 'Cambiar foto de perfil',
  'fullAuth.tabs_profile.choose_one_thing_to_follow_through_on_it_will_ap':
    'Elige una cosa que quieras cumplir. Aparecerá en Hoy con la prueba que elijas.',
  'fullAuth.tabs_profile.create_a_promise': 'Crear una promesa',
  'fullAuth.tabs_profile.current_reward_terms_and_your_link':
    'Condiciones actuales de la recompensa y tu enlace',
  'fullAuth.tabs_profile.day_streak': 'Días de racha',
  'fullAuth.tabs_profile.edit_profile': 'Editar perfil',
  'fullAuth.tabs_profile.for_your_privacy_menta_hides_the_previous_accoun':
    'Por tu privacidad, Menta oculta la cuenta anterior cuando termina la sesión.',
  'fullAuth.tabs_profile.groups': 'Grupos',
  'fullAuth.tabs_profile.invite': 'invitar',
  'fullAuth.tabs_profile.invite_friends': 'Invitar amigos',
  'fullAuth.tabs_profile.loading_your_profile': 'Cargando tu perfil',
  'fullAuth.tabs_profile.make_your_first_promise': 'Haz tu primera promesa',
  'fullAuth.tabs_profile.menta_kept_the_last_details_saved_for_this_accou':
    'Menta ha conservado los últimos datos guardados de esta cuenta. Aún puedes editar tu perfil y usar las demás opciones del perfil.',
  'fullAuth.tabs_profile.momenta': 'Momenta',
  'fullAuth.tabs_profile.no_promises_yet': 'Aún no hay promesas',
  'fullAuth.tabs_profile.open_saved_type_invite':
    'Abrir invitación guardada: {type}',
  'fullAuth.tabs_profile.open_the_invite_to_review_it_before_joining':
    'Abre la invitación para revisarla antes de unirte.',
  'fullAuth.tabs_profile.opens_your_invite_link_and_the_current_reward_te':
    'Abre tu enlace de invitación y las condiciones actuales de la recompensa.',
  'fullAuth.tabs_profile.personal_promises': 'Promesas personales',
  'fullAuth.tabs_profile.profile_details_may_be_out_of_date':
    'Puede que los datos del perfil no estén actualizados',
  'fullAuth.tabs_profile.progress_and_rewards': 'Progreso y recompensas',
  'fullAuth.tabs_profile.progress_starts_with_proof':
    'El progreso empieza con una prueba',
  'fullAuth.tabs_profile.saved': 'Guardado',
  'fullAuth.tabs_profile.sign_in_again': 'Volver a iniciar sesión',
  'fullAuth.tabs_profile.sign_in_to_see_you':
    'Inicia sesión para ver tu perfil',
  'fullAuth.tabs_profile.streaks_and_progress_appear_after_you_send_proof':
    'Las rachas y el progreso aparecen cuando envías una prueba de una promesa activa.',
  'fullAuth.tabs_profile.the_last_saved_promise_and_group_counts_are_stil':
    'Se siguen mostrando los últimos recuentos guardados de promesas y grupos. Las demás opciones del perfil siguen disponibles.',
  'fullAuth.tabs_profile.wallet_shop_and_items': 'Cartera, tienda y artículos',
  'fullAuth.tabs_profile.you': 'Perfil',
  'fullAuth.tabs_profile.your_progress_may_be_out_of_date':
    'Puede que tu progreso no esté actualizado',
  'fullAuth.tabs_profile.your_rhythm': 'Tu ritmo',
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
  'fullAuth.residual.report.feedback_privacy':
    'Tus comentarios y cualquier captura que elijas llegan en privado al equipo de Menta.',
  'fullAuth.residual.report.feedback_send_helper':
    'Envía cuando estés listo. Puedes volver y cambiar lo que quieras.',
  'fullAuth.residual.report.category_promise': 'Promesa',
  'fullAuth.residual.report.category_group': 'Grupo',
  'fullAuth.residual.report.category_proof': 'Prueba',
  'fullAuth.residual.report.category_member': 'Miembro',
  'fullAuth.residual.report.category_app_issue': 'Problema de la aplicación',
  'fullAuth.tabs_profile.since': 'Cumpliendo promesas desde {month}',
  'fullAuth.tabs_profile.stat_day_streak': 'días de racha',
  'fullAuth.tabs_profile.stat_best_streak': 'mejor racha',
  'fullAuth.tabs_profile.stat_days_kept': 'días cumplidos',
  'fullAuth.tabs_profile.stat_day_one': 'Día 1',
  'fullAuth.tabs_profile.stat_starts_today': 'empieza hoy',
  'fullAuth.tabs_profile.stats_accessibility':
    '{current}. Mejor racha: {best} días. {kept} días cumplidos.',
  'fullAuth.tabs_profile.month_kept': '{count} cumplidos',
  'fullAuth.tabs_profile.month_frozen': '{count} protegidos',
  'fullAuth.tabs_profile.month_missed': '{count} perdidos',
  'fullAuth.tabs_profile.month_empty': 'Aquí se irán llenando tus días',
  'fullAuth.tabs_profile.day_kept': '{day}: cumplido',
  'fullAuth.tabs_profile.day_frozen':
    '{day}: cubierto por una congelación de racha',
  'fullAuth.tabs_profile.day_missed': '{day}: perdido',
  'fullAuth.tabs_profile.day_today': '{day}: hoy',
  'fullAuth.tabs_profile.invite_title': 'Trae a alguien a Menta',
  'fullAuth.tabs_profile.invite_reward':
    'Cada uno recibe {amount} Momenta cuando haga su primera promesa.',
  'fullAuth.tabs_profile.invite_body':
    'Las promesas se cumplen mejor con alguien al lado.',
  'fullAuth.tabs_profile.invite_action': 'Invitar a alguien',
  'fullAuth.tabs_profile.active_count': '{count} activas',
  'fullAuth.tabs_profile.invite_accessibility': '{title}. {body}',
} as const satisfies Pick<EnglishCatalogue, FullAuthAccountKey>;
