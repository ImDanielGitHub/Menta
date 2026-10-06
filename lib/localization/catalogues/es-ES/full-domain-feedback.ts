/** Spain Spanish copy for lower-level domain helpers that can reach a person. */
import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type FullDomainFeedbackKey = Extract<
  keyof EnglishCatalogue,
  `domain.${string}`
>;

export const fullDomainFeedbackEsES = {
  'domain.error.network':
    'Hay un problema de conexión. Comprueba tu conexión a internet y vuelve a intentarlo.',
  'domain.error.authentication': 'Tienes que iniciar sesión para continuar.',
  'domain.error.permission':
    'Hace falta un permiso para continuar. Concede los permisos necesarios.',
  'domain.error.validation': 'comprueba tu entrada e inténtelo nuevamente.',
  'domain.error.camera':
    'Se detectó un problema con la cámara. Asegúrate de que se concedan los permisos de la cámara y vuelve a intentarlo.',
  'domain.error.upload':
    'No se ha podido subir. Comprueba tu conexión y vuelve a intentarlo.',
  'domain.error.submission':
    'El envío falló. Intenta enviar tu prueba nuevamente.',
  'domain.error.review':
    'No se ha podido completar la revisión. Vuelve a intentarlo o contacta con soporte.',
  'domain.error.database':
    'Problema al sincronizar los datos. Vuelve a intentarlo en un momento.',
  'domain.error.challenge':
    'Menta no pudo actualizar esta promesa. Inténtalo de nuevo.',
  'domain.error.group':
    'No se ha podido completar la acción del grupo. Vuelve a intentarlo.',
  'domain.error.unknown': 'Algo ha fallado. Vuelve a intentarlo.',
  'domain.error.title.network': 'Error de conexión',
  'domain.error.title.authentication': 'Se requiere autenticación',
  'domain.error.title.permission': 'Permiso necesario',
  'domain.error.title.validation': 'Entrada no válida',
  'domain.error.title.camera': 'Error de cámara',
  'domain.error.title.upload': 'Error de carga',
  'domain.error.title.submission': 'Error de envío',
  'domain.error.title.review': 'Error de revisión',
  'domain.error.title.database': 'Error de sincronización',
  'domain.error.title.challenge': 'Esta promesa no se pudo actualizar',
  'domain.error.title.group': 'Error de grupo',
  'domain.error.title.unknown': 'Error',
  'domain.error.connection_tips': 'Consejos de conexión',
  'domain.error.connection_tips_body':
    'Intenta cambiar entre WiFi y datos móviles, o muévase a un área con mejor señal.',
  'domain.error.camera_permissions': 'Permisos de cámara',
  'domain.error.camera_permissions_body':
    'Asegúrate de que Menta tenga acceso a la cámara en los ajustes del dispositivo.',
  'domain.action.try_again': 'Volver a intentarlo',
  'domain.action.check_connection': 'Comprobar conexión',
  'domain.action.log_in': 'Acceso',
  'domain.action.grant_permissions': 'Conceder permisos',
  'domain.action.open_settings': 'Abrir ajustes',
  'domain.action.check_permissions': 'Verificar permisos',
  'domain.action.save_draft': 'Guardar borrador',
  'domain.action.retry_submission': 'Reintentar envío',
  'domain.action.save_for_later': 'Guardar para más tarde',
  'domain.challenge.proof_default.fitness.photo':
    'Toma una foto durante o después de tu entrenamiento que muestre lo que hizo.',
  'domain.challenge.proof_default.fitness.video':
    'Graba un breve clip del entrenamiento que completó.',
  'domain.challenge.proof_default.fitness.text':
    'Escribe qué ejercicio hiciste y durante cuánto tiempo.',
  'domain.challenge.proof_default.fitness.none':
    'Marca el entrenamiento como completo después de terminarlo. No se requiere carga.',
  'domain.challenge.proof_default.mindfulness.photo':
    'Toma una fotografía del lugar o ajustes que utilizaste para la práctica.',
  'domain.challenge.proof_default.mindfulness.video':
    'Graba una breve reflexión sobre la práctica que completaste.',
  'domain.challenge.proof_default.mindfulness.text':
    'Escribe qué práctica hiciste y durante cuánto tiempo.',
  'domain.challenge.proof_default.mindfulness.none':
    'Marca la práctica como completa después de terminarla. No se requiere carga.',
  'domain.challenge.proof_default.learning.photo':
    'Toma una fotografía de las notas, el libro o el trabajo que completó.',
  'domain.challenge.proof_default.learning.video':
    'Graba un breve clip explicando lo que aprendiste.',
  'domain.challenge.proof_default.learning.text':
    'Escribe lo que estudiaste y una cosa que aprendiste.',
  'domain.challenge.proof_default.learning.none':
    'Marca la sesión de estudio como completa después de terminarla. No se requiere carga.',
  'domain.challenge.proof_default.productivity.photo':
    'Toma una fotografía del trabajo terminado o de la lista de tareas completadas.',
  'domain.challenge.proof_default.productivity.video':
    'Graba un clip breve que muestre el trabajo que completó.',
  'domain.challenge.proof_default.productivity.text':
    'Escribe qué tareas completaste.',
  'domain.challenge.proof_default.productivity.none':
    'Marca las tareas completadas después de terminarlas. No se requiere carga.',
  'domain.challenge.proof_default.health.photo':
    'Toma una fotografía que muestre la elección saludable que hizo.',
  'domain.challenge.proof_default.health.video':
    'Graba un clip breve que describa la elección saludable que hizo.',
  'domain.challenge.proof_default.health.text':
    'Escribe qué elección saludable tomaste hoy.',
  'domain.challenge.proof_default.health.none':
    'Marca la opción saludable como completa después de tomarla. No se requiere carga.',
  'domain.challenge.proof_default.creativity.photo':
    'Toma una foto de lo que hizo o del proceso que utilizó.',
  'domain.challenge.proof_default.creativity.video':
    'Graba un breve clip de tu proceso o trabajo terminado.',
  'domain.challenge.proof_default.creativity.text':
    'Escribe lo que hiciste y cómo trabajaste en ello.',
  'domain.challenge.proof_default.creativity.none':
    'Marca el trabajo creativo como completo después de terminarlo. No se requiere carga.',
  'domain.challenge.proof_default.social.photo':
    'Con permiso, toma una fotografía del tiempo que pasaron juntos.',
  'domain.challenge.proof_default.social.video':
    'Graba una breve reflexión privada sobre el tiempo que pasaron juntos.',
  'domain.challenge.proof_default.social.text':
    'Escribe con quién pasaste tiempo y qué hicieron juntos.',
  'domain.challenge.proof_default.social.none':
    'Marca la promesa social como completa después de cumplirla. No se requiere carga.',
  'domain.challenge.proof_default.fallback.photo':
    'Toma una foto que muestre que se cumplió la promesa de hoy.',
  'domain.challenge.proof_default.fallback.video':
    'Graba un clip corto que muestre que se cumplió la promesa de hoy.',
  'domain.challenge.proof_default.fallback.text':
    'Escribe lo que completaste hoy.',
  'domain.challenge.proof_default.fallback.none':
    'Marca la promesa de hoy como completa después de cumplirla. No se requiere carga.',
  'domain.auth.user_not_authenticated': 'Usuario no autenticado',
  'domain.auth.session_validation_failed': 'La validación de la sesión falló',
  'domain.auth.no_valid_session': 'No se encontró ninguna sesión válida',
  'domain.auth.user_id_mismatch': 'El ID de usuario no coincide',
  'domain.auth.validation_failed': 'La validación de autenticación falló',
  'domain.auth.authentication_required': 'Se requiere autenticación',
  'domain.monitoring.login_again': 'inicia sesión nuevamente para continuar',
  'domain.monitoring.more_momenta':
    'Necesitas más Momenta para completar esta acción.',
  'domain.monitoring.network':
    'Error de red. Revisa tu conexión y vuelve a intentarlo.',
  'domain.monitoring.duration_range':
    'La duración debe ser entre 1 y 365 días.',
  'domain.monitoring.name_range':
    'El nombre debe tener entre 3 y 50 caracteres.',
  'domain.monitoring.invalid_values':
    'Uno o más valores no cumplen los requisitos. Revisa lo que has introducido.',
  'domain.monitoring.group_name_exists':
    'Ya existe un grupo con este nombre. Elige un nombre diferente.',
  'domain.monitoring.invite_code_exists':
    'El código de invitación ya está en uso. Vuelve a intentarlo.',
  'domain.monitoring.already_exists': 'Ya existe. Prueba con otro valor.',
  'domain.monitoring.referenced_item_missing':
    'El artículo al que se hace referencia ya no existe. Actualiza e inténtelo de nuevo.',
  'domain.monitoring.required_missing':
    'Falta información obligatoria. Rellena todos los campos.',
  'domain.monitoring.access_denied':
    'No tienes acceso para realizar esta acción.',
  'domain.monitoring.permission_denied':
    'No tienes permiso para realizar esta acción',
  'domain.monitoring.rate_limited':
    'Vas demasiado rápido. Espera un momento y vuelve a intentarlo.',
  'domain.monitoring.usage_limit':
    'Has alcanzado tu límite de uso. Actualiza a Pro para obtener más promesas y grupos, además de Momenta mensual.',
  'domain.monitoring.generic': 'Algo ha fallado. Vuelve a intentarlo',
  'domain.network.no_connection':
    'No hay conexión a internet. Comprueba tu red y vuelve a intentarlo.',
  'domain.network.request_timed_out':
    'Se ha agotado el tiempo de espera. Vuelve a intentarlo.',
  'domain.network.error':
    'Se ha producido un error de red. Comprueba tu conexión.',
  'domain.network.try_later': 'Error de red. Vuelve a intentarlo más tarde.',
  'domain.network.service_unavailable':
    'El servicio no está disponible por ahora. Vuelve a intentarlo en breve.',
  'domain.network.unknown_error': 'Error desconocido',
  'domain.network.generic_error':
    'Se ha producido un error. Vuelve a intentarlo.',
  'domain.oauth.offline':
    'Estás desconectado. Vuelve a conectarte y vuelve a intentarlo.',
  'domain.oauth.google_unavailable':
    'Iniciar sesión con Google no está disponible en esta versión de Menta. Usa el correo electrónico en tu lugar.',
  'domain.oauth.google_finish':
    'No se ha podido completar el inicio de sesión con Google. Vuelve a intentarlo.',
  'domain.oauth.apple_unavailable':
    'Iniciar sesión con Apple no está disponible en este dispositivo. Usa el correo electrónico en tu lugar.',
  'domain.oauth.apple_finish':
    'No se ha podido completar el inicio de sesión con Apple. Vuelve a intentarlo.',
  'domain.oauth.google_cancelled': 'El inicio de sesión fue cancelado',
  'domain.oauth.apple_cancelled': 'El inicio de sesión fue cancelado',
  'domain.oauth.google_failed':
    'No se pudo iniciar sesión con Google. Inténtalo de nuevo o utiliza el correo electrónico.',
  'domain.oauth.google_already_open':
    'El inicio de sesión de Google ya está abierto.',
  'domain.oauth.google_device_unavailable':
    'El inicio de sesión de Google no está disponible en este dispositivo. Usa el correo electrónico en tu lugar.',
  'domain.oauth.google_open':
    'No se pudo abrir el inicio de sesión de Google. Inténtalo de nuevo o utiliza el correo electrónico.',
  'domain.oauth.google_not_finished':
    'El inicio de sesión de Google no finalizó. Regresa a Menta e inténtalo de nuevo.',
  'domain.oauth.google_unsafe':
    'El inicio de sesión con Google no se ha podido completar de forma segura. Vuelve a empezar desde Menta.',
  'domain.oauth.google_unauthorised':
    'El inicio de sesión de Google no fue autorizado. Inténtalo de nuevo o utiliza el correo electrónico.',
  'domain.oauth.google_return':
    'No se pudo finalizar el inicio de sesión de Google. Inténtalo de nuevo o utiliza el correo electrónico.',
  'domain.oauth.apple_open':
    'No se pudo abrir el inicio de sesión de Apple. Inténtalo de nuevo o utiliza el correo electrónico.',
  'domain.oauth.apple_not_finished':
    'El inicio de sesión de Apple no finalizó. Regresa a Menta e inténtalo de nuevo.',
  'domain.oauth.apple_unsafe':
    'El inicio de sesión con Apple no se ha podido completar de forma segura. Vuelve a empezar desde Menta.',
  'domain.oauth.apple_unauthorised':
    'El inicio de sesión de Apple no fue autorizado. Inténtalo de nuevo o utiliza el correo electrónico.',
  'domain.oauth.apple_return':
    'No se pudo finalizar el inicio de sesión de Apple. Inténtalo de nuevo o utiliza el correo electrónico.',
  'domain.edge.failed':
    'Algo ha fallado con {functionName}. Vuelve a intentarlo.',
  'domain.edge.maintenance_failed':
    'La operación de mantenimiento falló. Contacta con el soporte si esto persiste.',
  'domain.edge.user_failed':
    'No se puede {displayName}. Comprueba tu conexión y vuelve a intentarlo.',
  'domain.events.saved_photo_unavailable':
    'La foto guardada ya no está disponible en este dispositivo.',
  'domain.events.saved_photo_changed':
    'La foto guardada cambió antes de poder cargarla.',
  'domain.events.photo_arrival_unknown':
    'No pudimos decir si llegó la foto. Comprueba esta foto antes de enviar otra.',
  'domain.events.photo_status_updating':
    'La foto fue enviada, pero el estado del evento aún se está actualizando.',
  'domain.events.date_format':
    'Usa AAAA-MM-DD para la fecha y HH:MM de 24 horas para la hora.',
  'domain.events.invalid_date_time': 'Elige una fecha y hora locales válidas.',
  'domain.events.future_start': 'Elige una hora de inicio en el futuro.',
  'domain.eventStore.publishing_account_changed':
    'Cambiaste de cuenta mientras Menta publicaba. Vuelve a iniciar sesión en la cuenta original y comprueba este mismo evento.',
  'domain.eventStore.event_other_account':
    'Este evento pertenece a otra cuenta iniciada. Inicia sesión como organizador antes de publicar.',
  'domain.eventStore.photo_other_account':
    'Esta foto del evento guardada pertenece a otra cuenta iniciada.',
  'domain.eventStore.checking_saved_photo':
    'Cambiaste de cuenta mientras Menta revisaba la foto guardada del evento.',
  'domain.eventStore.prepare_photo_account_changed':
    'Cambiaste de cuenta antes de que Menta pudiera preparar la foto del evento.',
  'domain.eventStore.send_photo_account_changed':
    'Cambiaste de cuenta antes de que Menta pudiera enviar la foto del evento.',
  'domain.eventStore.checking_photo_arrival':
    'Cambiaste de cuenta mientras Menta comprobaba si había llegado la foto.',
  'domain.eventStore.photo_status_updating':
    'Cambiaste de cuenta mientras se actualizaba el estado de la foto del evento.',
  'domain.eventStore.event_open_account_changed':
    'Cambiaste de cuenta mientras se abría el evento. Vuelve a intentarlo.',
  'domain.eventStore.event_load_account_changed':
    'Cambiaste de cuenta mientras se cargaba el evento. Vuelve a intentarlo.',
  'domain.eventStore.details_open_account_changed':
    'Cambiaste de cuenta mientras se abrían los datos del evento. Vuelve a intentarlo.',
  'domain.eventStore.details_load_account_changed':
    'Cambiaste de cuenta mientras se cargaban los datos del evento. Vuelve a intentarlo.',
  'domain.eventStore.album_open_account_changed':
    'Cambiaste de cuenta mientras se abría el álbum de asistentes. Vuelve a intentarlo.',
  'domain.eventStore.sign_in_album':
    'Inicia sesión para abrir el álbum de asistentes.',
  'domain.eventStore.album_load_account_changed':
    'Cambiaste de cuenta mientras se cargaba el álbum de asistentes. Vuelve a intentarlo.',
  'domain.eventStore.review_open_account_changed':
    'Cambiaste de cuenta mientras se abría la revisión del organizador. Vuelve a intentarlo.',
  'domain.eventStore.sign_in_review':
    'Inicia sesión para revisar las fotografías de los asistentes.',
  'domain.eventStore.review_load_account_changed':
    'Cambiaste de cuenta mientras se cargaba la revisión del organizador. Vuelve a intentarlo.',
  'domain.eventStore.recap_open_account_changed':
    'Cambiaste de cuenta mientras se abría el resumen del evento. Vuelve a intentarlo.',
  'domain.eventStore.sign_in_recap':
    'Inicia sesión para abrir el resumen del evento.',
  'domain.eventStore.recap_load_account_changed':
    'Cambiaste de cuenta mientras se cargaba el resumen del evento. Vuelve a intentarlo.',
  'domain.eventStore.join_start_account_changed':
    'Cambiaste de cuenta antes de empezar a unirte. Vuelve a intentarlo.',
  'domain.eventStore.join_save_account_changed':
    'Cambiaste de cuenta mientras Menta guardaba tu lugar. Vuelve a iniciar sesión y comprueba la asistencia.',
  'domain.eventStore.leave_start_account_changed':
    'Cambiaste de cuenta antes de empezar a salir. Vuelve a intentarlo.',
  'domain.eventStore.leave_update_account_changed':
    'Cambiaste de cuenta mientras Menta actualizaba tu lugar. Vuelve a iniciar sesión y comprueba la asistencia.',
  'domain.eventStore.checkin_start_account_changed':
    'Cambiaste de cuenta antes de empezar el registro. Vuelve a intentarlo.',
  'domain.eventStore.checkin_finish_account_changed':
    'Cambiaste de cuenta mientras finalizaba el registro. Vuelve a iniciar sesión y comprueba la asistencia.',
  'domain.eventStore.photo_send_start_account_changed':
    'Cambiaste de cuenta antes de enviar la foto del evento. Vuelve a intentarlo.',
  'domain.eventStore.sign_in_send_photo':
    'Inicia sesión antes de enviar una foto del evento.',
  'domain.eventStore.photo_status_check_account_changed':
    'Cambiaste de cuenta mientras se actualizaba el estado de la foto del evento. Vuelve a iniciar sesión y comprueba la foto.',
  'domain.eventStore.saved_photo_continue_account_changed':
    'Cambiaste de cuenta antes de que pudiera continuar la foto guardada del evento. Vuelve a intentarlo.',
  'domain.eventStore.sign_in_resume_photo':
    'Inicia sesión antes de reanudar la foto de un evento.',
  'domain.eventStore.saved_photo_unavailable':
    'Esa foto del evento guardada ya no está disponible en este dispositivo.',
  'domain.eventStore.saved_photo_status_account_changed':
    'Cambiaste de cuenta mientras se actualizaba el estado de la foto guardada. Vuelve a iniciar sesión y comprueba la foto.',
  'domain.eventStore.saved_photos_status_account_changed':
    'Cambiaste de cuenta mientras se actualizaban los estados de las fotos guardadas.',
  'domain.eventStore.photo_review_start_account_changed':
    'Cambiaste de cuenta antes de empezar la revisión de fotos. Vuelve a intentarlo.',
  'domain.eventStore.photo_decision_account_changed':
    'Cambiaste de cuenta mientras se actualizaba la decisión de la foto. Comprueba la foto antes de decidirte de nuevo.',
  'domain.eventStore.organiser_decision_start_account_changed':
    'Cambiaste de cuenta antes de empezar la decisión del organizador. Vuelve a intentarlo.',
  'domain.eventStore.organiser_decision_account_changed':
    'Cambiaste de cuenta mientras se actualizaba la decisión del organizador. Comprueba la foto antes de decidirte de nuevo.',
  'domain.eventStore.photo_delete_start_account_changed':
    'Cambiaste de cuenta antes de empezar a eliminar fotos. Vuelve a intentarlo.',
  'domain.eventStore.photo_delete_finish_account_changed':
    'Cambiaste de cuenta mientras finalizaba la eliminación de la foto. Comprueba si la foto sigue ahí.',
  'domain.handoff.invite_saved': 'Invitación guardada',
  'domain.handoff.referral_saved': 'Código de referencia guardado',
  'domain.handoff.invite_description':
    '{action} y Menta abrirán tu invitación guardada {inviteType}.',
  'domain.handoff.referral_login_description':
    'Si se trata de una cuenta nueva, Menta comprobará el código después de iniciar sesión. Cualquier recompensa disponible aparecerá en tu cuenta.',
  'domain.handoff.referral_signup_description':
    'Crea tu cuenta y Menta comprobará si el código califica para una recompensa.',
  'domain.handoff.referral_login_new_description':
    'Si se trata de una cuenta nueva, Menta comprobará el código después de iniciar sesión.',
  'domain.handoff.referral_finish_description':
    'Termina la configuración y Menta comprobará si el código da derecho a una recompensa.',
  'domain.handoff.referral_setup_description':
    'Crea tu cuenta y Menta comprobará el código después de la configuración.',
  'domain.handoff.next': 'Próximo',
  'domain.handoff.then': 'Entonces',
  'domain.handoff.step_one': 'Paso 1',
  'domain.handoff.step_two': 'Paso 2',
  'domain.handoff.step_three': 'Paso 3',
  'domain.handoff.promise': 'Promesa',
  'domain.handoff.invite': 'Invitar',
  'domain.handoff.account': 'Cuenta',
  'domain.handoff.sign_in_any_method': 'Inicia sesión con cualquier método',
  'domain.handoff.open_saved_invite': 'Abrir invitación guardada {inviteType}',
  'domain.handoff.sign_in_or_create': 'Iniciar sesión o crear cuenta',
  'domain.handoff.check_referral': 'Comprueba el código de referencia guardado',
  'domain.handoff.check_referral_short': 'Verificar código de referencia',
  'domain.handoff.create_account': 'Crear una cuenta',
  'domain.handoff.open_menta': 'Abrir Menta',
  'domain.handoff.continue_invite': 'Continuar desde la invitación',
  'domain.handoff.show_reward': 'Mostrar cualquier recompensa disponible',
  'domain.handoff.create_first_promise': 'Crea tu primera promesa',
  'domain.handoff.continue_menta': 'Continuar en Menta',
  'domain.handoff.saving_account': 'Guardando en tu cuenta',
  'domain.handoff.waiting_after_sign_in': 'Esperando después de iniciar sesión',
  'domain.handoff.connecting': 'Conectando',
  'domain.handoff.open_today': 'Abierto hoy',
  'domain.handoff.finish_setup': 'Terminar la configuración',
  'domain.handoff.create_your_account': 'Crea tu cuenta',
  'domain.handoff.complete_sign_in': 'Iniciar sesión completo',
  'domain.handoff.sign_in': 'Iniciar sesión',
  'domain.coach.default_promise': 'tu promesa',
  'domain.coach.default_due_time': '20:00',
  'domain.coach.proof_due': 'Se debe presentar la prueba.',
  'domain.coach.proof_due_body':
    'Añade la prueba antes de {proofDueLabel} para completar el registro de hoy.',
  'domain.coach.today_counts': 'Hoy todavía cuenta.',
  'domain.coach.hours_left': '{hours} {hourLabel} quedó para la prueba de hoy.',
  'domain.coach.add_before_day_end':
    'Añade la prueba de hoy antes de que termine el día.',
  'domain.coach.log_proof': 'Registre la prueba de hoy.',
  'domain.coach.promises_need_proof':
    '{count} {promiseLabel} aún necesitan prueba. Empieza por una.',
  'domain.coach.add_to_finish': 'Añade la prueba para terminar por hoy.',
  'domain.coach.still_time': 'Todavía hay tiempo hoy.',
  'domain.coach.proof_open_until':
    'La prueba de hoy permanecerá abierta hasta el {proofDueLabel}.',
  'domain.coach.proof_still_open': 'La prueba de hoy todavía está abierta.',
  'domain.coach.completed_add_proof':
    'Si has cumplido tu promesa, añade la prueba antes de que termine el día.',
  'domain.coach.next_small_step': 'Elige el siguiente pequeño paso.',
  'domain.coach.proof_remains_open':
    'La prueba de hoy permanece abierta hasta que termine el día.',
  'domain.coach.hour_count': '{count} {hourLabel}',
  'domain.coach.hour_count.one': '{count} hora',
  'domain.coach.hour_count.other': '{count} horas',
  'domain.coach.promise_count': '{count} {promiseLabel}',
  'domain.coach.promise_count.one': '{count} promesa',
  'domain.coach.promise_count.other': '{count} promesas',
  'domain.coach.hour': 'hora',
  'domain.coach.hours': 'horas',
  'domain.coach.promise': 'promesa',
  'domain.coach.promises': 'promesas',
  'domain.report.draft_saved': 'Borrador guardado en este teléfono',
  'domain.report.nothing_sent': 'No se ha enviado nada al soporte.',
  'domain.report.sending': 'Enviando informe',
  'domain.report.waiting_confirmation':
    'Menta está esperando a que el servidor confirme este informe.',
  'domain.report.not_sent': 'Informe no enviado',
  'domain.report.remains_on_phone':
    'Tu informe se queda en este teléfono. No se ha enviado nada al soporte.',
  'domain.report.result_unknown': 'No se sabe si se ha enviado',
  'domain.report.could_not_confirm':
    'Menta no ha podido confirmar la respuesta del servidor. Al reintentar se usa la misma referencia de informe.',
  'domain.report.received': 'Informe recibido',
  'domain.report.confirmed': 'Menta confirmó que el informe llegó al servidor.',
  'domain.commitment.move_daily': 'Muévete cada día',
  'domain.commitment.move_daily_description':
    'Muévete un rato cada día. Una caminata, ejercicio, estiramiento o deporte cuentan.',
  'domain.commitment.move_daily_promise': 'Me moveré un rato cada día.',
  'domain.commitment.move_daily_verification':
    'Envía una foto clara después de terminar. Muestra la caminata, el entrenamiento, la ruta, la colchoneta, el gimnasio o el resultado.',
  'domain.commitment.move_daily_submission':
    'Di qué hiciste hoy y cuánto tiempo estuviste en movimiento.',
  'domain.commitment.daily_movement_group': 'Grupo Muévete cada día',
  'domain.commitment.fitness': 'forma física',
  'domain.commitment.focused_study': 'Estudio concentrado',
  'domain.commitment.focused_study_description':
    'Termina una sesión de estudio concentrado cada día y anota en qué trabajaste.',
  'domain.commitment.focused_study_promise':
    'Terminaré una sesión de estudio concentrado cada día.',
  'domain.commitment.focused_study_verification':
    'Escribe lo que estudiaste, cuánto tiempo te concentraste y algo que entiendas mejor ahora.',
  'domain.commitment.focused_study_submission':
    'Añade el tema, el tiempo que le dedicaste y algo que ahora entiendas mejor.',
  'domain.commitment.learning': 'aprendizaje',
  'domain.commitment.morning_walk': 'Paseo matutino',
  'domain.commitment.morning_walk_description':
    'Da un paseo corto a primera hora del día.',
  'domain.commitment.morning_walk_promise':
    'Daré un paseo corto por la mañana.',
  'domain.commitment.morning_walk_verification':
    'Envía una foto del paseo. Una calle, un camino, unos zapatos, un reloj o el cielo son suficientes.',
  'domain.commitment.morning_walk_submission':
    'Di dónde caminaste y algo que notaste.',
  'domain.commitment.morning_walk_group': 'Grupo Paseo matutino',
  'domain.commitment.sleep_reset': 'Dormir mejor',
  'domain.commitment.sleep_reset_description':
    'Empieza a desconectar antes de dormir cada noche.',
  'domain.commitment.sleep_reset_promise':
    'Empezaré a desconectar antes de dormir.',
  'domain.commitment.sleep_reset_verification':
    'Escribe qué hiciste para desconectar y a qué hora empezaste.',
  'domain.commitment.sleep_reset_submission':
    'Añade el paso de la rutina que completaste y qué hizo que esta noche fuera más fácil o más difícil.',
  'domain.commitment.sleep_reset_group': 'Grupo Dormir mejor',
  'domain.commitment.no_sugar': 'Días sin azúcar',
  'domain.commitment.no_sugar_description':
    'Mantén una regla alimentaria clara durante siete días: nada de azúcares añadidos.',
  'domain.commitment.no_sugar_hub': 'Sin azúcar',
  'domain.commitment.no_sugar_promise': 'Hoy evitaré el azúcar añadido.',
  'domain.commitment.no_sugar_verification':
    'Escribe si cumpliste la regla y anota cualquier momento que la haya dificultado.',
  'domain.commitment.no_sugar_submission':
    'Añade el momento más difícil y lo que elegiste en su lugar.',
  'domain.commitment.no_sugar_group': 'Grupo Sin azúcar',
  'domain.commitment.creative_minutes': 'Minutos creativos',
  'domain.commitment.creative_minutes_description':
    'Dedica 20 minutos a crear o mejorar algo cada día.',
  'domain.commitment.creative_minutes_promise':
    'Dedicaré 20 minutos a crear algo.',
  'domain.commitment.creative_minutes_verification':
    'Envía una foto o captura del trabajo que hiciste o cambiaste hoy, como un borrador, un boceto, una cronología o unas notas.',
  'domain.commitment.creative_minutes_submission':
    'Di qué creaste o mejoraste durante los 20 minutos.',
  'domain.commitment.creativity': 'creatividad',
  'domain.commitment.health': 'salud',
  'domain.commitment.creative_minutes_group': 'Grupo Minutos creativos',
  'domain.intensity.flexible': 'Flexible',
  'domain.intensity.standard': 'Estándar',
  'domain.intensity.fixed': 'Fijo',
  'domain.intensity.shop_note':
    'Una extensión del plazo de 12 horas o una congelación de la racha se compran en la tienda, no se eligen aquí.',
  'domain.intensity.flexible_note':
    'Más fácil de cumplir en una semana ajetreada.',
  'domain.intensity.standard_note': 'Una promesa diaria normal.',
  'domain.intensity.fixed_note': 'La más exigente de las tres.',
  'domain.notifications.channel_updates': 'Novedades de Menta',
  'domain.notifications.channel_reminders':
    'Recordatorios antes del plazo de la prueba',
  'domain.notifications.channel_groups':
    'Registros, solicitudes de revisión y cambios de grupo',
  'domain.notifications.channel_progress':
    'Novedades de rachas, insignias, hitos y Momenta',
  'domain.notifications.channel_proof':
    'Cuando una prueba está pendiente, se acepta o hay que repetirla',
  'domain.notifications.new_milestone': 'Nuevo hito',
  'domain.notifications.group_milestone_named': '{groupName}: {milestone}',
  'domain.notifications.group_milestone_reached': 'Hito grupal alcanzado',
  'domain.notifications.proof_due': 'Prueba pendiente',
  'domain.notifications.proof_for': 'Envía la prueba de «{challengeTitle}».',
  'domain.notifications.group_milestone': 'Hito grupal alcanzado',
  'domain.notifications.group_activity': 'Nueva actividad grupal',
  'domain.notifications.group_activity_named':
    '{memberName} tiene una actualización en {groupName}',
  'domain.notifications.proof_due_for':
    'Tienes pendiente la prueba de «{challengeTitle}»',
  'domain.notifications.proof_due_promise':
    'Tienes pendiente la prueba de tu promesa',
  'domain.notifications.open_update': 'Abre Menta para ver la actualización.',
  'domain.notifications.updated': 'Actualización de Menta',
  'domain.notifications.streak_updated': 'Racha actualizada',
  'domain.notifications.streak_protected': 'Racha protegida',
  'domain.notifications.promise_started': 'Promesa iniciada',
  'domain.notifications.promise_complete': 'Promesa cumplida',
  'domain.notifications.promise_ending': 'La promesa termina pronto',
  'domain.notifications.promise_ended': 'Promesa terminada',
  'domain.notifications.review_needed': 'Hay una prueba por revisar',
  'domain.notifications.proof_waiting': 'Prueba pendiente de revisión',
  'domain.notifications.proof_approved': 'Prueba aprobada',
  'domain.notifications.proof_retry': 'Hay que repetir la prueba',
  'domain.notifications.group_update': 'Actualización de grupo',
  'domain.notifications.group_attention': 'El grupo necesita atención',
  'domain.notifications.daily_reminder': 'Recordatorio diario',
  'domain.notifications.check_in_reminder': 'Recordatorio de registro',
  'domain.notifications.badge_unlocked': 'Insignia desbloqueada',
  'domain.notifications.momenta_added': 'Momenta añadidos',
  'domain.notifications.menta_updated': 'Menta se ha actualizado',
  'domain.notifications.menta_maintenance': 'Mantenimiento de Menta',
  'domain.notifications.test': 'Notificación de prueba de Menta',
  'domain.notifications.ending_in': 'Termina en {hours} {hourLabel}',
  'domain.notifications.ending_soon': 'Termina pronto',
  'domain.notifications.group_submissions': 'Envíos del grupo',
  'domain.notifications.members': 'Miembros',
  'domain.notifications.review': 'revisión',
  'domain.notifications.reviews': 'revisiones',
  'domain.feedback.checkin.a11y': '¿Qué tal te va Menta?',
  'domain.feedback.checkin.heading': '¿Qué tal te va Menta?',
  'domain.feedback.checkin.body':
    'Cuéntanos qué te funciona o qué podría estar más claro.',
  'domain.feedback.checkin.working': 'Sí, me está funcionando',
  'domain.feedback.checkin.better': 'Algo podría estar mejor',
  'domain.feedback.checkin.not_now': 'Ahora no',
} as const satisfies Pick<EnglishCatalogue, FullDomainFeedbackKey>;
