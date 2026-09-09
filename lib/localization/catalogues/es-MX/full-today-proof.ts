import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type FullTodayProofKey = Extract<
  keyof EnglishCatalogue,
  `todayProof.${string}`
>;

/** Spanish (Spain) copy for the Today, promise, proof, and review flow. */
/**
 * Mantén aquí los mensajes completos. Los títulos de promesas, nombres y
 * comentarios de revisión dinámicos se pasan a `t`, no forman parte de las
 * frases traducidas.
 */
export const fullTodayProofEsMX = {
  'todayProof.notifications.daily_bonus': 'Bonificación por logros diarios',
  'todayProof.notifications.maintenance': 'Mantenimiento de rutina',
  'todayProof.today.accountability': 'Hoy la rendición de cuentas',
  'todayProof.today.active': 'activo',
  'todayProof.today.loading_more': 'Cargando más de Hoy',
  'todayProof.today.create_new': 'Crea algo nuevo',
  'todayProof.today.new': 'Nuevo',
  'todayProof.today.ledger_accessibility': '{title}. {detail}',
  'todayProof.today.submission_accessibility': '{promise}, {status}',
  'todayProof.today.group_needs_checkin': 'Se necesitan {count} seguimientos',
  'todayProof.today.group_needs_checkin.one': 'Se necesita {count} seguimiento',
  'todayProof.today.group_needs_checkin.other':
    'Se necesitan {count} seguimientos',
  'todayProof.today.open_group_due':
    'Abre el grupo para ver lo que está pendiente',
  'todayProof.today.open_review_queue': 'Abrir la lista de revisión',
  'todayProof.today.loading_home': 'Inicio de Hoy',
  'todayProof.today.home_unverified': 'Hoy no se pudo verificar.',
  'todayProof.today.last_update': 'Mostrando tu última actualización',
  'todayProof.today.last_update_detail':
    'Menta no pudo actualizar esta lista. Se siguen mostrando las últimas promesas cargadas.',
  'todayProof.today.loading_accessibility': 'Cargando más de Hoy',
  'todayProof.today.local_proof_drafts': 'Borradores de prueba locales',
  'todayProof.today.all_clear_accessibility_with_review':
    '0 vence ahora. {status}',
  'todayProof.today.protected_accessibility': 'Racha protegida. {detail}',
  'todayProof.group.reminders_unavailable': 'Recordatorios no disponibles',
  'todayProof.group.nudge_unavailable_detail':
    'Menta aún no puede autorizar al destinatario y devolver un recibo de entrega verificado.',
  'todayProof.group.no_proof_submitted': 'Aún no se han presentado pruebas',
  'todayProof.group.pending_detail': '{media} · aún no cuenta',
  'todayProof.group.send_clearer':
    'Envía una prueba más clara para terminar hoy',
  'todayProof.group.new_proof_needed': 'Se necesita una nueva prueba',
  'todayProof.group.needs_clearer': 'Necesita una prueba más clara',
  'todayProof.today.layout_classified': 'Diseño de la aplicación clasificado',
  'todayProof.today.more': 'Más hoy',
  'todayProof.today.stale_snapshot':
    'Mostrando la última instantánea confirmada. Ninguna prueba o resultado de revisión ha cambiado aquí.',
  'todayProof.today.risk_checked': '{count} de {total} se han registrado',
  'todayProof.today.risk_due': '{count} seguimientos aún pendientes',
  'todayProof.today.risk_due.one': 'Aún falta {count} seguimiento',
  'todayProof.today.risk_due.other': 'Aún faltan {count} seguimientos',
  'todayProof.today.risk_title': '{count} seguimientos pendientes en {group}',
  'todayProof.today.risk_title.one': 'Falta {count} seguimiento en {group}',
  'todayProof.today.risk_title.other': 'Faltan {count} seguimientos en {group}',
  'todayProof.today.group_due': '{group} tiene que realizar el seguimiento',
  'todayProof.today.review_one': 'Revisa la prueba de {name}',
  'todayProof.today.review_many': 'Revisar las pruebas {count}',
  'todayProof.today.review_many.one': 'Revisar la prueba {count}',
  'todayProof.today.review_many.other': 'Revisar las pruebas {count}',
  'todayProof.today.status_due': 'Prueba debida',
  'todayProof.today.status_pending': 'Pendiente de revisión',
  'todayProof.today.status_approved': 'Aprobado',
  'todayProof.today.status_correction': 'Corrección necesaria',
  'todayProof.create.photo_video': 'Foto o video',
  'todayProof.create.photo_video_note':
    'Mejor cuando es necesario ver la acción o el resultado completado.',
  'todayProof.create.text': 'prueba de texto',
  'todayProof.create.text_note':
    'Lo mejor para un breve seguimiento por escrito.',
  'todayProof.create.promise_question': '¿Qué promesass?',
  'todayProof.create.promise_question_detail':
    'Nombra la acción diaria y di exactamente lo que cuenta como hecho.',
  'todayProof.create.proof_question': 'Elige la prueba',
  'todayProof.create.proof_solo_detail':
    'Elige lo que enviará cuando venza esta promesa.',
  'todayProof.create.proof_group_detail':
    'Dígales a los revisores del grupo lo que necesitan ver o leer.',
  'todayProof.create.flexibility_question': 'Elige flexibilidad',
  'todayProof.create.flexibility_detail':
    'Decide cuánto puede cambiar el horario después de comenzar.',
  'todayProof.create.review_question': 'Comprueba tu promesa',
  'todayProof.create.review_detail':
    'Revise la promesa, la prueba y el cronograma antes de crearlo.',
  'todayProof.create.choose_proof': 'Elige prueba',
  'todayProof.create.choose_schedule': 'Elige horario',
  'todayProof.create.review_promise': 'Promesa de revisión',
  'todayProof.create.create_promise': 'crear promesa',
  'todayProof.create.check_today': 'Verifica hoy primero',
  'todayProof.create.choose_return': 'Elige un nuevo comienzo',
  'todayProof.create.your_promise': 'tu promesa',
  'todayProof.create.name_promise': 'Nombra la promesa',
  'todayProof.create.name_promise_detail':
    'Usa al menos tres caracteres para que esta promesa sea fácil de encontrar más adelante.',
  'todayProof.create.say_what_counts': 'Di lo que cuenta',
  'todayProof.create.say_what_counts_detail':
    'Añade la regla diaria para que quede claro lo que significa hecho.',
  'todayProof.create.describe_proof': 'Describe la prueba',
  'todayProof.create.describe_proof_detail':
    'Escriba lo que debe mostrar la prueba antes de que empieza esta promesa.',
  'todayProof.create.session_expired': 'La sesión expiró',
  'todayProof.create.short_name': 'Usa al menos tres caracteres.',
  'todayProof.create.short_rule':
    'Añade la regla diaria antes de crear esta promesa.',
  'todayProof.create.cost_unconfirmed':
    'No se pudo confirmar el coste de la promesa.',
  'todayProof.create.cost_unconfirmed_detail':
    'Menta no creó la promesa ni gastó Momenta. Comprueba tu conexión y vuelve a intentarlo.',
  'todayProof.create.more_momenta': 'Se necesita más Momenta',
  'todayProof.create.promise_created': 'Promesa creada',
  'todayProof.create.draft_not_saved': 'Borrador no guardado',
  'todayProof.create.sign_in_again':
    'Inicia sesión de nuevo antes de abandonar esta promesa.',
  'todayProof.create.draft_not_saved_detail':
    'Menta no pudo guardar este borrador en este celular. Quédate aquí e inténtalo de nuevo.',
  'todayProof.create.start_rule_solo':
    'Nombra la acción y decide la cantidad mínima que contarás como hecha cada día.',
  'todayProof.create.start_rule_group':
    'Nombra la acción y decide la cantidad mínima que tú y el grupo consideraréis hecha cada día.',
  'todayProof.create.use_template': 'Usa una plantilla',
  'todayProof.create.start_common': 'Partir de una promesa común.',
  'todayProof.create.proof_show_required': '¿Qué debería mostrar la prueba? *',
  'todayProof.create.proof_show': '¿Qué debería mostrar la prueba?',
  'todayProof.create.proof_required_hint':
    'Obligatorio. Usa al menos {count} caracteres para describir la prueba.',
  'todayProof.create.proof_minimum':
    'Usa al menos {count} caracteres para describir la prueba.',
  'todayProof.create.photo_example':
    'Una foto de la caminata, del gimnasio, del escritorio o del resultado.',
  'todayProof.create.proof_rule':
    'Escribe la regla que quieres que cumpla la prueba.',
  'todayProof.create.proof_rule_label': 'regla de prueba',
  'todayProof.create.proof_rule_placeholder':
    'Describe lo que la prueba debe mostrar o decir.',
  'todayProof.create.self_review_rule':
    'Deja clara la regla antes de comenzar. Tu prueba cuenta cuando la envías.',
  'todayProof.create.group_proof_rule':
    'Dígales a los revisores del grupo qué confirma que esto se hizo.',
  'todayProof.create.prompt_optional':
    'Aviso mostrado en el seguimiento (opcional)',
  'todayProof.create.prompt_placeholder':
    'Añade una breve instrucción que la gente mira antes de enviar',
  'todayProof.create.prompt_helper':
    'Mantén esto como un recordatorio práctico para la persona que envía la prueba.',
  'todayProof.create.prompt': 'Aviso mostrado en el seguimiento',
  'todayProof.create.prompt_example':
    'Ejemplo: ¿Qué hiciste y por cuánto tiempo?',
  'todayProof.create.edit_wording': 'Editar la redacción de la promesa',
  'todayProof.create.proof_type': 'Tipo de prueba',
  'todayProof.create.proof_counts': '¿Qué cuenta como prueba?',
  'todayProof.create.confirming': 'Confirmando…',
  'todayProof.create.length': 'Longitud',
  'todayProof.create.proof_type_daily': 'Prueba {type}, diaria',
  'todayProof.create.private_send':
    'Esta promesa es privada. Tu prueba cuenta cuando la envías.',
  'todayProof.create.group_review_rule':
    'Los miembros del grupo comparan la prueba con esta regla.',
  'todayProof.create.promise_label': 'Promesa',
  'todayProof.create.title_placeholder':
    'por ejemplo, caminata matutina antes del trabajo',
  'todayProof.create.title_helper':
    'Nombra la acción para que la reconozcas cuando aparezca en Hoy.',
  'todayProof.create.what_counts': '¿Qué cuenta?',
  'todayProof.create.description_placeholder':
    '¿Qué harás cada día y qué se considera hecho?',
  'todayProof.create.description_helper':
    'Las reglas específicas son más fáciles de seguir y de revisar.',
  'todayProof.create.loading_groups': 'Cargando tus grupos...',
  'todayProof.create.keep_solo': 'mantenlo solo',
  'todayProof.create.private_streak':
    'Privado. Tu prueba cuenta cuando la envías y se hace seguimiento de tu racha.',
  'todayProof.create.start_solo': 'Empieza solo por ahora',
  'todayProof.create.start_solo_detail':
    'No necesitas un grupo para comenzar. Haga una promesa personal ahora y luego cree una promesa grupal más adelante si la revisión compartida le resulta útil.',
  'todayProof.create.private_promise':
    'Una promesa privada donde la prueba cuenta cuando la envías.',
  'todayProof.create.want_group': '¿Quieres un grupo más tarde?',
  'todayProof.create.finish_first':
    'Primero termina esta configuración. Puedes crear o unirte a un grupo después.',
  'todayProof.create.selected_rules': 'Reglas de grupo seleccionadas',
  'todayProof.create.target': '{percent}% objetivo',
  'todayProof.create.days_with_proof': 'Días con prueba',
  'todayProof.create.misses_allowed': 'Errores permitidos',
  'todayProof.create.day_unit': '{count} día',
  'todayProof.create.days_unit': '{count} días',
  'todayProof.create.group_policy':
    'Este grupo tiene como objetivo realizar pruebas el {percent}% de los días y permite {count} perder días seguidos.',
  'todayProof.create.personal_policy':
    'Esta promesa es sólo para ti. Elige un horario que aún pueda mantener en un día ajetreado.',
  'todayProof.create.choose_group_policy':
    'Elige un grupo para ver tus reglas antes de crear la promesa.',
  'todayProof.create.group_commitment': '{count} compromiso grupal del día',
  'todayProof.create.back_from_creation':
    'De regreso de la creación de promesas',
  'todayProof.create.restoring_draft': 'Restaurando este borrador...',
  'todayProof.create.nothing_created': 'Aún no se ha creado nada.',
  'todayProof.create.sign_in': 'Iniciar sesión',
  'todayProof.create.save_exit': 'Guardar borrador y salir',
  'todayProof.create.creating': 'Creando tu promesa...',
  'todayProof.create.keep_open':
    'Mantén esta pantalla abierta hasta que se guarde.',
  'todayProof.create.draft_restored': 'Borrador restaurado',
  'todayProof.create.private_on_phone':
    'Sigue siendo privado en este celular hasta que lo crees.',
  'todayProof.create.check_today_before':
    'Consulta hoy antes de empezar de nuevo.',
  'todayProof.create.missing_after_refresh':
    'Si la promesa sigue sin aparecer después de actualizar Hoy, empieza una nueva.',
  'todayProof.create.start_new': 'Iniciar una nueva promesa',
  'todayProof.create.restoring': 'Restaurando…',
  'todayProof.create.template_picker': 'Selector de plantillas',
  'todayProof.create.close_templates': 'Cerrar plantillas',
  'todayProof.create.use_selected_template': 'Usar plantilla seleccionada',
  'todayProof.create.write_own': 'Escribe mi propia promesa',
  'todayProof.create.write_promise': 'escribe una promesa',
  'todayProof.create.group_saved': 'Promesa de grupo guardada',
  'todayProof.create.promise_saved': 'Promesa guardada',
  'todayProof.create.group_saved_detail':
    'Se guardan las reglas de prueba y revisión. Invita a las personas cuando el grupo esté listo.',
  'todayProof.create.promise_saved_detail':
    'Publique la primera prueba cuando esté listo para comenzar.',
  'todayProof.create.view_created': 'Ver promesa creada',
  'todayProof.create.first_due': 'primer vencimiento',
  'todayProof.create.schedule_saved': 'Horario guardado',
  'todayProof.create.group_members_review':
    'Revisión de los miembros del grupo.',
  'todayProof.create.proof_counts_when_sent':
    'La prueba cuenta cuando se envía',
  'todayProof.create.group_members': 'Miembros del grupo',
  'todayProof.create.only_you': 'Sólo tu',
  'todayProof.create.open_promise': 'abre mi promesa',
  'todayProof.create.open_group': 'grupo',
  'todayProof.create.post_first_proof': 'Publicar la primera prueba',
  'todayProof.create.back_today': 'Volver a hoy',
  'todayProof.create.invite_people': 'invitar gente',
  'todayProof.create.set_reminder': 'Establecer un recordatorio',
  'todayProof.solo.back': 'Volver',
  'todayProof.solo.items': 'Tus artículos',
  'todayProof.solo.items_hint': 'Abre los potenciadores y estilos que posees.',
  'todayProof.solo.create_personal': 'Crea una promesa personal',
  'todayProof.solo.heading': 'Promesas personales',
  'todayProof.solo.detail': 'Regístrese hoy o revise lo que ha completado.',
  'todayProof.solo.no_active': 'Sin promesas activas',
  'todayProof.solo.no_past': 'Sin promesas pasadas',
  'todayProof.solo.completed_under_past':
    'Tus promesas completadas todavía están disponibles en Historial.',
  'todayProof.solo.create_private':
    'Cree una promesa privada cuando esté listo para comenzar.',
  'todayProof.solo.ended':
    'Las promesas aparecen aquí una vez finalizado tu plazo confirmado.',
  'todayProof.solo.view_past': 'Ver promesas pasadas',
  'todayProof.solo.create': 'Crea una promesa',
  'todayProof.solo.showing_last_update': 'Mostrando tu última actualización',
  'todayProof.solo.load_failed':
    'Las promesas personales no se pudieron cargar.',
  'todayProof.solo.loading_accessibility': 'Cargando tus promesas personales',
  'todayProof.solo.loading': 'Cargando tus promesas...',
  'todayProof.solo.no_personal': 'No tienes promesas personales.',
  'todayProof.solo.no_personal_detail':
    'Una promesa personal es una acción a la que te compromesass, con una prueba fotográfica cada vez que la realizas. Revisas tu propia prueba.',
  'todayProof.solo.create_group': 'Haz una promesa con un grupo.',
  'todayProof.solo.active_count': 'Activo {count}',
  'todayProof.solo.past_count': 'Historial {count}',
  'todayProof.solo.no_streak': 'Aún no hay racha',
  'todayProof.solo.recent_proof': 'Prueba reciente',
  'todayProof.solo.view_promise': 'Ver promesa',
  'todayProof.solo.log_entry': 'Registra la entrada de hoy',
  'todayProof.solo.check_in': 'Regístrese hoy',
  'todayProof.solo.view_correction': 'Ver corrección',
  'todayProof.solo.view_today_proof': 'Ver la prueba de hoy',
  'todayProof.solo.proof_history': 'Historial de pruebas',
  'todayProof.solo.text_proof': 'prueba de texto',
  'todayProof.solo.video_proof': 'Prueba de video',
  'todayProof.solo.photo_proof': 'Prueba fotográfica',
  'todayProof.solo.past_promise': 'Promesa pasada',
  'todayProof.solo.no_current_streak': 'Sin racha actual',
  'todayProof.solo.open_promise': 'promesa abierta',
  'todayProof.solo.open_full_promise': 'Abrir promesa completa',
  'todayProof.solo.due_today': 'Vencimiento hoy',
  'todayProof.solo.waiting_review': 'Esperando revisión',
  'todayProof.solo.needs_retry': 'Necesita volver a intentarlo',
  'todayProof.solo.open_accessibility': 'Abrir {promise}',
  'todayProof.solo.open_hint':
    'Muestra la acción de prueba, el historial y el cronograma de hoy.',
  'todayProof.solo.promise_meta': '{days}-promesa del día · {proof} · Privado',
  'todayProof.solo.completed': 'Terminado',
  'todayProof.solo.past': 'Historial',
  'todayProof.solo.streak': 'Racha de {count} días',
  'todayProof.solo.freezes_left': '{count} congelaciones disponibles',
  'todayProof.solo.freezes_left.one': '{count} congelación disponible',
  'todayProof.solo.freezes_left.other': '{count} congelaciones disponibles',
  'todayProof.streak.freezes_left': '{count} congelaciones disponibles',
  'todayProof.streak.freezes_left.one': '{count} congelación disponible',
  'todayProof.streak.freezes_left.other': '{count} congelaciones disponibles',
  'todayProof.solo.selected_promise': 'Promesa seleccionada',
  'todayProof.solo.promise_meta_short': '{days} promesa del día · {proof}',
  'todayProof.solo.current_streak': 'Racha actual de {count}-día',
  'todayProof.solo.accepted': 'Aceptado',
  'todayProof.promise.time_unavailable': 'Hora no disponible',
  'todayProof.promise.date_unavailable': 'Fecha no disponible',
  'todayProof.promise.sent_recently': 'Enviado recientemente',
  'todayProof.promise.sent_just_now': 'Enviado hace un momento',
  'todayProof.promise.day_outcome': 'Resultado del día',
  'todayProof.promise.invite_copied': 'Invitación copiada',
  'todayProof.promise.invite_copied_detail':
    'El código de promesa está listo para pegarse.',
  'todayProof.promise.copy_failed': 'Copia fallida',
  'todayProof.promise.copy_failed_detail':
    'El código de invitación todavía está visible aquí. Intenta copiar de nuevo.',
  'todayProof.promise.share_failed': 'Compartir falló',
  'todayProof.promise.share_failed_detail':
    'Menta no pudo abrir la menú para compartir. Copia el código o inténtalo de nuevo.',
  'todayProof.promise.close_invite': 'Cerrar promesa invitación modal',
  'todayProof.promise.copy_invite': 'Copiar código de invitación',
  'todayProof.promise.copy_code': 'Copiar código',
  'todayProof.promise.share_invite': 'Compartir invitación',
  'todayProof.promise.actions': 'Acciones de promesa',
  'todayProof.promise.refresh_failed':
    'No se pueden actualizar los detalles de la promesa.',
  'todayProof.promise.refresh_data_failed':
    'No se pueden actualizar los datos.',
  'todayProof.promise.unsupported_proof':
    'Este método de prueba aún no se admite aquí.',
  'todayProof.promise.solo_no_invite':
    'Las promesas individuales no utilizan enlaces de invitación.',
  'todayProof.promise.invite_unavailable':
    'Menta no pudo preparar un código de invitación. Nada cambió.',
  'todayProof.promise.try_later': 'Inténtalo de nuevo más tarde.',
  'todayProof.promise.boost_failed': 'La activación del impulso falló:',
  'todayProof.promise.boost_failed_detail':
    'Menta no pudo confirmar si se agregó tiempo. Verifica de nuevo antes de usar otra extensión.',
  'todayProof.promise.waiting_review': 'Esperando revisión',
  'todayProof.promise.waiting_review_detail':
    'Tu prueba se ha enviado. No es necesario enviarla dos veces.',
  'todayProof.promise.done_today': 'Hecho hoy',
  'todayProof.promise.done_today_detail':
    'Hoy está registrado. Si alguien necesita una revisión, esa es la siguiente acción útil.',
  'todayProof.promise.send_clearer': 'Enviar pruebas más claras',
  'todayProof.promise.checkin_needed': 'Es necesario registrarse',
  'todayProof.promise.checkin_needed_detail':
    'Envía una prueba clara antes de que cierre el día.',
  'todayProof.promise.proof_due': 'Prueba entregada hoy',
  'todayProof.promise.proof_due_detail':
    'Haz la acción y luego envía una prueba clara.',
  'todayProof.promise.join_to_start': 'Únete para empezar',
  'todayProof.promise.join_to_start_detail':
    'Únete primero, luego envía pruebas con todos los demás.',
  'todayProof.promise.no_peer_review': 'Sin revisión por pares',
  'todayProof.promise.join': 'Únete a la promesa',
  'todayProof.promise.complete': 'Promesa completa',
  'todayProof.promise.ended': 'Promesa terminada',
  'todayProof.promise.status_unavailable': 'Estado de prueba no disponible',
  'todayProof.promise.submit_clearer': 'Presentar pruebas más claras',
  'todayProof.promise.submit': 'Enviar prueba',
  'todayProof.promise.review': 'Prueba de revisión',
  'todayProof.promise.done_for_today': 'hecho por hoy',
  'todayProof.promise.retry_detail':
    'Un reintento no restablece toda la promesa. Envía prueba que muestre claramente la acción completada.',
  'todayProof.promise.today_counts':
    'Hoy todavía cuenta. Ningún resultado cambia hasta que se resuelva la prueba.',
  'todayProof.promise.reviewed_by': 'Revisado por',
  'todayProof.promise.only_you': 'Sólo tu',
  'todayProof.promise.group_members': 'Miembros del grupo',
  'todayProof.promise.invite_only': 'Sólo invitación',
  'todayProof.promise.not_checked': 'No comprobado',
  'todayProof.promise.just_you': 'solo tu',
  'todayProof.promise.left': 'promesa izquierda',
  'todayProof.promise.left_detail': 'Dejaste esta promesa.',
  'todayProof.promise.deleted': 'La promesa fue eliminada.',
  'todayProof.promise.not_changed':
    'La promesa no fue cambiada. inténtalo de nuevo.',
  'todayProof.promise.result_not_confirmed_title': 'Resultado no confirmado',
  'todayProof.promise.not_changed_title': 'Promesa sin cambios',
  'todayProof.promise.check_status': 'Revisar estado',
  'todayProof.promise.check_action_unavailable':
    'Menta aún no puede revisar esta acción. Actualiza la promesa antes de volver a intentarlo.',
  'todayProof.promise.leave_result_unknown':
    'Menta no pudo confirmar si saliste de esta promesa. Revisa su estado antes de volver a intentarlo.',
  'todayProof.promise.leave_check_unavailable':
    'Menta aún no puede revisar si saliste de esta promesa. Actualiza la promesa antes de volver a intentarlo.',
  'todayProof.promise.result_mismatch':
    'Menta no pudo asociar este resultado con la promesa. Revisa su estado antes de volver a intentarlo.',
  'todayProof.promise.confirmation_mismatch':
    'Menta no pudo asociar esta confirmación con la promesa. Revisa su estado antes de volver a intentarlo.',
  'todayProof.promise.leave_receipt_mismatch':
    'Menta no pudo asociar el resultado de salida con esta promesa. Revisa la promesa antes de volver a intentarlo.',
  'todayProof.promise.already_left':
    'Menta confirmó que ya habías salido de esta promesa.',
  'todayProof.promise.delete_result_unknown':
    'Menta no pudo confirmar si esta promesa se eliminó. Revisa su estado antes de volver a intentarlo.',
  'todayProof.promise.delete_check_unavailable':
    'Menta aún no puede revisar si esta promesa se eliminó. Actualiza tus promesas antes de volver a intentarlo.',
  'todayProof.promise.delete_status_unavailable':
    'Menta no pudo revisar si esta promesa se eliminó. Actualiza tus promesas antes de volver a intentarlo.',
  'todayProof.promise.delete_question': '¿Eliminar esta promesa?',
  'todayProof.promise.leave_question': '¿Dejar esta promesa?',
  'todayProof.promise.delete': 'Eliminar promesa',
  'todayProof.promise.leave': 'dejar promesa',
  'todayProof.promise.delete_detail':
    'Elimina esta promesa, el historial de pruebas, los enlaces de invitación y el contexto de revisión. Sin deshacer.',
  'todayProof.promise.leave_detail':
    'Deja de enviar pruebas aquí. La prueba existente permanece en el historial de promesas.',
  'todayProof.promise.details': 'Detalles de la promesa',
  'todayProof.promise.proof_rule_detail':
    'Muestre la acción completada con suficiente claridad para el revisor nombrado.',
  'todayProof.promise.proof_unavailable':
    'Esa prueba no está disponible en esta promesa.',
  'todayProof.promise.rules_schedule': 'Reglas y horario',
  'todayProof.promise.rules_schedule_detail':
    'Qué cuenta, cuándo vence y quién lo revisa.',
  'todayProof.promise.how_works': 'Cómo funciona esta promesa',
  'todayProof.promise.your_proof': 'tu prueba',
  'todayProof.promise.no_proof_you': 'Aún no hay pruebas tuyas',
  'todayProof.promise.other_proof': 'Prueba de otros miembros',
  'todayProof.promise.no_other_proof': 'Aún no hay pruebas de otros miembros',
  'todayProof.promise.other_proof_detail':
    'Tus seguimientos aprobados y pendientes aparecerán aquí.',
  'todayProof.promise.preparing_invite': 'Preparando invitación…',
  'todayProof.promise.open_review_queue': 'Abrir lista de revisión',
  'todayProof.promise.report': 'Promesa de informe',
  'todayProof.promise.reminder_question': '¿Quieres un recordatorio?',
  'todayProof.promise.reminder_detail':
    'Menta puede recordártelo antes de que venza esta promesa.',
  'todayProof.promise.remind_about': 'Recuérdame esta promesa',
  'todayProof.promise.remind_detail':
    'Envía un recordatorio antes de que venza la prueba.',
  'todayProof.promise.set_reminders': 'Configurar recordatorios',
  'todayProof.promise.without_reminders': 'Continuar sin recordatorios',
  'todayProof.promise.invite_question': '¿Invitar a alguien a esta promesa?',
  'todayProof.promise.invite_detail':
    'Pueden leer la vista previa antes de decidir unirse.',
  'todayProof.promise.link_copied': 'Enlace de invitación copiado',
  'todayProof.promise.link_copied_detail':
    'Pega el enlace donde quieras invitarlos.',
  'todayProof.promise.link_not_copied': 'El enlace no fue copiado.',
  'todayProof.promise.link_not_copied_detail':
    'La invitación no ha cambiado. Intenta copiar de nuevo o omítalo por ahora.',
  'todayProof.promise.skip': 'Saltar por ahora',
  'todayProof.promise.people': 'Gente',
  'todayProof.promise.joined': '{count} se unió',
  'todayProof.promise.joined_one': '{count} se unió',
  'todayProof.promise.private': 'promesa privada',
  'todayProof.promise.private_only': 'Solo tú puedes ver esta promesa.',
  'todayProof.promise.no_people': 'Nadie se ha unido todavía.',
  'todayProof.promise.private_proof':
    'Tu prueba permanece privada y cuenta cuando la envías.',
  'todayProof.promise.share_ready':
    'Comparte la invitación cuando estés listo.',
  'todayProof.promise.joined_on': 'Se unió a {date}',
  'todayProof.promise.day_streak': 'Racha de días {count}',
  'todayProof.promise.loading_people': 'Cargando gente prometida',
  'todayProof.promise.opening_invite': 'Invitación de apertura',
  'todayProof.promise.recent_proof': 'Prueba reciente',
  'todayProof.promise.proof_log': 'Registro de prueba',
  'todayProof.promise.no_proof': 'Aún no hay pruebas',
  'todayProof.promise.checkins_appear': 'Tus registros aparecerán aquí.',
  'todayProof.promise.proof_history': 'Historial de pruebas',
  'todayProof.promise.submit_appears': 'Envía la prueba y aparecerá aquí.',
  'todayProof.promise.out_of_date':
    'El historial de pruebas puede estar desactualizado',
  'todayProof.promise.checking_history':
    'Comprobación del historial de pruebas en busca de actualizaciones',
  'todayProof.promise.loading_history': 'Cargando historial de pruebas',
  'todayProof.promise.all': 'Todo',
  'todayProof.promise.close_submissions': 'Cerrar envíos',
  'todayProof.promise.no_accepted': 'No se aceptan pruebas',
  'todayProof.promise.accepted_appears':
    'Los seguimientos aceptados aparecerán aquí.',
  'todayProof.promise.nothing_waiting': 'No hay nada esperando revisión.',
  'todayProof.promise.waiting_appears':
    'Los nuevos registros aparecerán aquí mientras se revisan.',
  'todayProof.promise.no_retry': 'Ninguna prueba necesita otro intento',
  'todayProof.promise.retry_appears':
    'La prueba enviada con una nota de revisión aparecerá aquí.',
  'todayProof.promise.checking_history_updates':
    'Comprobación del historial de pruebas en busca de actualizaciones',
  'todayProof.promise.loading_history_short': 'Cargando historial de pruebas',
  'todayProof.proof.open_exact': 'Abre esta prueba exacta',
  'todayProof.proof.video_unavailable_short':
    'La prueba en video no está disponible temporalmente.',
  'todayProof.proof.loading_video': 'Cargando prueba de video',
  'todayProof.proof.close_exact': 'Cerrar prueba exacta',
  'todayProof.proof.exact_photo': 'Prueba fotográfica exacta',
  'todayProof.proof.written_unavailable':
    'La prueba escrita no está disponible.',
  'todayProof.proof.preview_unavailable_detail':
    'La vista previa de la prueba no está disponible temporalmente.',
  'todayProof.proof.review_note': 'Nota de revisión',
  'todayProof.proof.done': 'Hecho',
  'todayProof.proof.state_approved': 'Aprobado',
  'todayProof.proof.state_waiting': 'Esperando revisión',
  'todayProof.proof.state_retry': 'Necesita otro intento',
  'todayProof.proof.approved_by': 'Aprobado por {name}',
  'todayProof.proof.waiting_for': 'Esperando {name}',
  'todayProof.promise.video_proof': 'Prueba de video',
  'todayProof.promise.watch_full_screen': 'Ver en pantalla completa',
  'todayProof.promise.text_proof': 'prueba de texto',
  'todayProof.promise.photo_proof': 'Prueba fotográfica',
  'todayProof.promise.needs_retry': 'Necesita otro intento',
  'todayProof.promise.updated': 'Promesa actualizada',
  'todayProof.promise.updated_accessibility': 'Promesa actualizada. {detail}',
  'todayProof.promise.notice': 'aviso de promesa',
  'todayProof.promise.refresh_promise': 'No se pudo actualizar la promesa',
  'todayProof.promise.complete_action_failed': 'No se pudo completar eso',
  'todayProof.promise.try_again': 'Intentar otra vez',
  'todayProof.promise.video_unavailable': 'Vídeo no disponible',
  'todayProof.promise.video_unavailable_detail':
    'Este video de prueba no está disponible en este momento. Inténtalo de nuevo desde la página de promesa.',
  'todayProof.promise.cannot_open_video': 'No se pudo abrir el video',
  'todayProof.promise.cannot_open_video_detail':
    'Tu dispositivo no pudo abrir este video de prueba. Inténtalo de nuevo desde la página de promesa.',
  'todayProof.promise.open_video_error':
    'Algo salió mal al abrir este video de prueba. Inténtalo de nuevo en un momento.',
  'todayProof.promise.open_video': 'Abrir prueba de video',
  'todayProof.promise.close_video': 'Cerrar video',
  'todayProof.promise.open_device_player':
    'Abrir en el reproductor del dispositivo',
  'todayProof.promise.open_video_detail': 'Abre este video de prueba',
  'todayProof.promise.device_player_detail':
    'Menta abrirá el video en el reproductor de tu dispositivo para que puedas revisar la prueba.',
  'todayProof.proof.hold_to_send': 'Espera para enviar',
  'todayProof.proof.keep_holding': 'Sigue aguantando...',
  'todayProof.proof.release_cancel': 'Suelte o deslícese para cancelar',
  'todayProof.proof.send_one_tap': 'Enviar con un toque',
  'todayProof.proof.keep_holding_sentence': 'Sigue presionando para enviar.',
  'todayProof.proof.send': 'Enviar prueba',
  'todayProof.proof.send_detail': 'Toque para enviar esta prueba ahora.',
  'todayProof.proof.send_now': 'Envía esta prueba ahora.',
  'todayProof.proof.hold_detail':
    'Mantén pulsado durante uno coma tres segundos para enviar. Suelta temprano o deslícese para cancelar.',
  'todayProof.proof.ready': 'Listo para enviar',
  'todayProof.proof.single_tap':
    'Envía esta prueba con un solo toque en lugar de mantenerla presionada.',
  'todayProof.proof.percent_held': '{count} porcentaje retenido',
  'todayProof.proof.hold_accessibility_hint':
    'Mantén pulsado durante uno coma tres segundos para enviar. Suelta temprano o deslícese para cancelar.',
  'todayProof.proof.open_full': 'Prueba abierta a la vista completa',
  'todayProof.proof.photo_preview': 'Vista previa de la foto de prueba',
  'todayProof.proof.video_preview': 'Vista previa de prueba de video',
  'todayProof.proof.text_preview': 'Vista previa de prueba de texto',
  'todayProof.proof.open_full_view': 'Abrir vista completa',
  'todayProof.proof.report_issue': 'Informar un problema',
  'todayProof.proof.private_full': 'Vista completa de prueba privada',
  'todayProof.proof.private_full_detail': 'Prueba privada a la vista',
  'todayProof.proof.sending': 'Envío de prueba',
  'todayProof.proof.meta': '{type} · {time}',
  'todayProof.proof.private': 'prueba privada',
  'todayProof.proof.close': 'Cerrar',
  'todayProof.proof.write': 'Escribe tu prueba',
  'todayProof.proof.write_detail':
    'Describe lo que hiciste para que el revisor pueda comprobarlo.',
  'todayProof.proof.record': 'Graba tu prueba',
  'todayProof.proof.record_detail':
    'Asegúrate de que el revisor pueda ver claramente lo que hizo.',
  'todayProof.proof.take_photo': 'Toma una foto de prueba',
  'todayProof.proof.take_photo_detail':
    'Toma una foto que muestre claramente lo que hiciste.',
  'todayProof.proof.saved_detail':
    'Este borrador se guarda en este celular. Ábralo cuando esté listo para enviar.',
  'todayProof.proof.uploading_detail':
    'Puedes salir de esta pantalla. Menta seguirá intentándolo mientras la aplicación esté abierta y en línea.',
  'todayProof.proof.sent_detail': 'Menta recibió tu prueba de esta promesa.',
  'todayProof.proof.pending_detail':
    'Tu prueba está esperando revisión. No es necesario que lo envíes de nuevo.',
  'todayProof.proof.accepted_detail':
    'Tu prueba fue aprobada y ahora cuenta para la promesa de hoy.',
  'todayProof.proof.unknown_detail':
    'No pudimos confirmar si se envió la prueba. Comprueba tu estado antes de volver a intentarlo.',
  'todayProof.proof.failed_detail':
    'No se envió prueba. Comprueba tu conexión y vuelve a intentarlo. Tu borrador permanece aquí si se guardó localmente.',
  'todayProof.proof.share_accepted':
    'Mi prueba de la promesa de hoy fue aprobada en Menta.',
  'todayProof.proof.share_pending':
    'Envié la prueba de hoy a Menta. Está a la espera de revisión.',
  'todayProof.proof.receipt': 'Prueba',
  'todayProof.proof.share_title': 'recibo de prueba de menta',
  'todayProof.proof.ad_break': 'Pausa publicitaria siguiente',
  'todayProof.proof.ad_break_detail':
    'Es posible que aparezca un anuncio breve después de dejar este recibo. No cambiará tu comprobante ni tu saldo de Momenta.',
  'todayProof.proof.share_opened': 'Menú para compartir abierto',
  'todayProof.proof.share_opened_detail':
    'Elige una aplicación y envía allí el recibo para terminar.',
  'todayProof.proof.share_failed': 'Compartir falló',
  'todayProof.proof.share_failed_detail':
    'El recibo todavía está aquí. Intenta compartir de nuevo cuando el dispositivo esté listo.',
  'todayProof.proof.share_progress': 'progreso mental',
  'todayProof.proof.milestone_message': 'Llegué a {count} días en Menta.',
  'todayProof.proof.share_progress_detail':
    'Solo se comparte el mensaje de progreso. Tu prueba permanece privada.',
  'todayProof.proof.share_result_failed':
    'Tu resultado del día {count} todavía está aquí. Intenta compartir de nuevo más tarde.',
  'todayProof.proof.view_promise': 'Ver promesa',
  'todayProof.proof.open_saved': 'Abrir prueba guardada',
  'todayProof.proof.resume': 'Reanudar envío',
  'todayProof.proof.close_receipt': 'Cerrar recibo',
  'todayProof.proof.review_someone': 'Revisar a alguien más',
  'todayProof.proof.check_status': 'Verificar el estado de la prueba',
  'todayProof.proof.back': 'Atrás',
  'todayProof.proof.share_receipt': 'Compartir recibo de prueba',
  'todayProof.proof.recovery_title': 'Empezar de nuevo hoy',
  'todayProof.proof.recovery_detail':
    'El día perdido queda en tu historial. Esta prueba cuenta sólo después de la aprobación.',
  'todayProof.proof.text_placeholder':
    'Caminé 20 minutos después del trabajo a las 6:10 p.m.',
  'todayProof.proof.text_helper':
    'Incluye lo que hiciste, cuándo lo hiciste y un detalle claro.',
  'todayProof.proof.text_label': 'La prueba de hoy',
  'todayProof.proof.hold_label': 'Espera para enviar prueba',
  'todayProof.proof.hold_holding': 'Sigue presionando para enviar...',
  'todayProof.review.loading': 'Revisar la carga de pruebas',
  'todayProof.review.reviews': 'Reseñas',
  'todayProof.review.opening_proof': 'Prueba de apertura',
  'todayProof.review.opening_video_proof':
    'Apertura de evidencia de prueba de video',
  'todayProof.review.filter_all': 'Todo',
  'todayProof.review.filter_pending': 'Pendiente',
  'todayProof.review.filter_approved': 'Aprobado',
  'todayProof.review.filter_rejected': 'Necesita otro intento',
  'todayProof.review.unknown_status': 'Estado desconocido',
  'todayProof.review.action_not_visible': 'Acción no visible',
  'todayProof.review.too_unclear': 'Demasiado confuso para revisar',
  'todayProof.review.does_not_match_rule': 'No coincide con la regla de prueba',
  'todayProof.review.why_retry': '¿Por qué deberían intentarlo de nuevo?',
  'todayProof.review.reason_prompt':
    'Elige una razón. Una vez enviada, esta revisión no se puede deshacer, pero {name} puede enviar una prueba nueva.',
  'todayProof.review.unknown_user': 'Usuario desconocido',
  'todayProof.review.fair_decision':
    'Tu prueba espera una decisión justa. Nadie más tiene pruebas listas para que las revises todavía.',
  'todayProof.review.none_waiting':
    'No hay envíos esperando revisión. Aquí aparecerá una nueva prueba con el contexto que necesitas.',
  'todayProof.review.none_approved':
    'Aún no hay pruebas aprobadas en esta vista. Los envíos aprobados se recopilarán aquí.',
  'todayProof.review.none_retry':
    'No es necesario rehacer ninguna prueba. Por lo general, eso significa que las presentaciones han sido lo suficientemente claras.',
  'todayProof.review.nothing':
    'Nada que mostrar todavía. Tire para actualizar si esperaba pruebas de esta promesa.',
  'todayProof.review.back_board': 'volver al tablero',
  'todayProof.review.back_today': 'Volver a hoy',
  'todayProof.review.error_detail':
    'Las revisiones no se cargaron. Tira para actualizar y vuelve a intentarlo.',
  'todayProof.review.group_reviews': 'Revisiones grupales',
  'todayProof.review.promise_reviews': 'Reseñas de promesas',
  'todayProof.review.queue': 'Lista de revisión',
  'todayProof.review.nothing_else': 'Nada más que revisar todavía',
  'todayProof.review.no_submissions': 'No hay envíos para revisar',
  'todayProof.review.reward_unconfirmed':
    'Se guardó la decisión de prueba, pero no se confirmó la recompensa.',
  'todayProof.review.reward_failed':
    'La decisión de prueba se guardó, pero no se pudo confirmar la recompensa.',
  'todayProof.review.decision_unconfirmed':
    'Menta no pudo confirmar el resultado de la revisión.',
  'todayProof.review.incomplete_receipt':
    'Menta recibió un recibo de revisión incompleto.',
  'todayProof.review.reward_already_logged':
    'Esta recompensa de revisión ya se registró.',
  'todayProof.review.reward_added_amount': '+{amount} Momenta añadido',
  'todayProof.review.reward_added':
    'Tu recompensa por revisión ya fue añadida.',
  'todayProof.review.checking_reward':
    'Comprobando la recompensa de tu revisión...',
  'todayProof.review.show_all': 'Mostrar todas las pruebas',
  'todayProof.review.review_next': 'Revisar la siguiente prueba ({count})',
  'todayProof.review.changed': 'Revisión cambiada',
  'todayProof.review.reload_title': 'Recarga esta prueba',
  'todayProof.review.changed_detail':
    'Cambió mientras lo revisabas. No se envió nada. Vuelve a cargarlo antes de decidirte.',
  'todayProof.review.changed_detail_with_note':
    'Cambió mientras lo revisabas. No se envió nada. Vuelve a cargarlo antes de decidirte. Tu nota de corrección no enviada: {note}',
  'todayProof.review.current_status': 'Estado actual: {status}',
  'todayProof.review.filter_accessibility': 'Mostrar pruebas {status}',
  'todayProof.review.back_queue': 'volver a la cola',
  'todayProof.review.unsent_note':
    'Tu nota de corrección no enviada permanecerá aquí hasta que recargues o abandones la lista.',
  'todayProof.review.reload': 'Recargar prueba',
  'todayProof.review.saved': 'Revisión guardada',
  'todayProof.review.approved_receipt': 'Se aprobó la prueba de {name}.',
  'todayProof.review.retry_receipt': '{name} puede enviar de nuevo.',
  'todayProof.review.approved_detail':
    '{promise} ahora puede contar esta prueba.',
  'todayProof.review.feedback_sent':
    'Tus comentarios fueron enviados. La prueba original queda registrada.',
  'todayProof.review.cleared': 'Ver cola despejada',
  'todayProof.review.see_group': 'Ver grupo',
  'todayProof.review.approve_or_clearer':
    'Aprueba esta prueba o solicita una más clara',
  'todayProof.review.pending_count': '{count} esperando revisión',
  'todayProof.review.pending_action_with_more':
    '{action} · {count} más esperando',
  'todayProof.review.no_waiting': 'No hay pruebas esperando revisión',
  'todayProof.review.report': 'Reportar esta prueba',
  'todayProof.review.report_hint':
    'Abre un formulario de informe vinculado a este envío.',
  'todayProof.review.not_saved': 'Revisión no guardada',
  'todayProof.review.not_saved_detail':
    '{error} Nada cambió. Comprueba la prueba y vuelve a intentarlo.',
  'todayProof.review.show_all_submissions': 'Mostrar todos los envíos',
  'todayProof.review.ask_new': 'Solicitar nueva prueba',
  'todayProof.review.reject': 'Rechazar envío',
  'todayProof.review.approve': 'aprobar prueba',
  'todayProof.review.approve_submission': 'Aprobar envío',
  'todayProof.review.match_promise': '¿Esta prueba coincide con la promesa?',
  'todayProof.review.choose_reason': 'Elige una razón',
  'todayProof.review.reason_detail':
    'Elige los comentarios que hagan que la siguiente prueba sea más fácil de juzgar.',
  'todayProof.review.keep_reviewing': 'Sigue revisando',
  'todayProof.review.sending_retry': 'Enviar nota de reintento',
  'todayProof.review.send_retry': 'Enviar nota de reintento',
  'todayProof.review.close_reasons': 'Cerrar motivos de rechazo',
  'todayProof.review.review': 'Prueba de revisión',
  'todayProof.review.text_checkin': 'Registro de texto',
  'todayProof.review.checked_in': '{name} registrado',
  'todayProof.review.submitted': '{promise} · enviado {time}',
  'todayProof.review.select_hint': 'Selecciona esta prueba para tu revisión',
  'todayProof.review.media_meta': '{promise} · {type} · {time}',
  'todayProof.review.review_action': 'Revisar',
  'todayProof.review.no_written': 'No se adjuntó ninguna prueba escrita.',
  'todayProof.review.preview_unavailable': 'Vista previa no disponible',
  'todayProof.review.play_full': 'Reproducir o abrir pantalla completa',
  'todayProof.review.tap_zoom': 'Toca para hacer zoom',
  'todayProof.review.participant_note': 'Nota del participante',
  'todayProof.review.feedback': 'Revisar comentarios',
  'todayProof.review.queue_cleared': 'Cola despejada',
  'todayProof.review.no_waiting_short':
    'Ninguna prueba está pendiente de revisión.',
  'todayProof.review.video_submitted': 'Prueba de video enviada para revisión',
  'todayProof.review.open_again':
    'Intenta abrirlo de nuevo. No se ha guardado ninguna decisión de revisión.',
  'todayProof.review.could_not_open': 'No pudimos abrir esta prueba.',
  'todayProof.review.return_to_promise': 'volver a la promesa',
  'todayProof.review.back_reviews': 'Volver a revisiones',
  'todayProof.review.refresh_needed':
    'La lista de revisión necesita una actualización',
  'todayProof.streak.missed_day': 'el dia perdido',
  'todayProof.streak.missed_day_title': 'Se perdió {day}.',
  'todayProof.streak.no_proof_counted':
    'No se cuentan pruebas para {day}. Tu racha anterior finalizó en {streak} y tu historial aún está aquí.',
  'todayProof.streak.previous_days': '{count} día',
  'todayProof.streak.previous_days_other': '{count} días',
  'todayProof.streak.history_action': 'Ver el historial del día {count}',
  'todayProof.streak.missed': 'día perdido',
  'todayProof.streak.missed_day_label': 'Día perdido · {day}',
  'todayProof.streak.day_was_missed': 'Se perdió un día.',
  'todayProof.streak.ready_again': 'Listo para un nuevo seguimiento',
  'todayProof.streak.start_today': 'Empezar de nuevo hoy',
  'todayProof.streak.proof_due': 'La prueba aún debe entregarse hoy',
  'todayProof.streak.at_risk_detail':
    'Añade la prueba antes de que termina hoy.',
  'todayProof.streak.at_risk_copy':
    'Añade la prueba antes de que termina hoy. {streakSentence} {freezeSentence}',
  'todayProof.streak.at_risk_streak': 'Tu racha de {count} días sigue activa.',
  'todayProof.streak.at_risk_freezes':
    'Tienes {count} congelaciones disponibles.',
  'todayProof.streak.at_risk_freezes.one':
    'Tienes {count} congelación disponible.',
  'todayProof.streak.at_risk_freezes.other':
    'Tienes {count} congelaciones disponibles.',
  'todayProof.streak.queued_detail':
    'La prueba está guardada en este celular, pero no se ha enviado. No cuenta hasta que Menta la reciba y la aprueba.',
  'todayProof.streak.add_proof': 'Añadir prueba',
  'todayProof.streak.view_freezes': 'Ver congelaciones',
  'todayProof.streak.open_inventory': 'Abrir inventario',
  'todayProof.streak.extension_ends': 'La extensión termina en',
  'todayProof.streak.reminder_in': 'Recordatorio en',
  'todayProof.streak.proof_counts': 'La prueba cuenta para',
  'todayProof.streak.until_extension': 'hasta que termina la prórroga',
  'todayProof.streak.to_reminder': 'recordar',
  'todayProof.streak.until_midnight': 'hasta medianoche',
  'todayProof.streak.previous_streak': 'Racha anterior',
  'todayProof.streak.today': 'Hoy',
  'todayProof.streak.ready_new_checkin': 'Listo para un nuevo seguimiento',
  'todayProof.streak.recovery_note':
    'Un nuevo registro inicia la siguiente racha. La prueba de hoy cuenta después de la aprobación.',
  'todayProof.streak.current': 'Racha actual',
  'todayProof.streak.longest': 'más largo',
  'todayProof.streak.promise_goal': 'Meta prometida',
  'todayProof.streak.next_target': 'próximo objetivo',
  'todayProof.streak.goal_reached': '{count} días · alcanzado',
  'todayProof.streak.target_days': '{count} días',
  'todayProof.streak.day': '{count} día',
  'todayProof.streak.days': '{count} días',
  'todayProof.streak.status_waiting': 'Esperando revisión',
  'todayProof.streak.status_requested': 'Nueva prueba solicitada',
  'todayProof.streak.status_approved': 'Prueba aprobada hoy',
  'todayProof.streak.status_sent': 'Prueba enviada hoy',
  'todayProof.streak.status_after_approval':
    'Comienza una nueva racha tras la aprobación',
  'todayProof.streak.target_reached': '{label} {count} días alcanzados.',
  'todayProof.streak.target_accessibility': '{label} {count} días.',
  'todayProof.streak.card_summary_accessibility':
    'Racha actual {current} días. Días {longest} más largos. {target} {status}.',
  'todayProof.streak.minutes': '{count} minutos',
  'todayProof.streak.minute': '{count} minuto',
  'todayProof.streak.hero_accessibility': '{eyebrow} {remaining}. {helper}',
  'todayProof.streak.card_accessibility': '{eyebrow} {remaining}. {helper}',
  'todayProof.streak.promise_countdown_helper': '{promise} · {helper}.',
  'todayProof.streak.remaining_with_suffix': '{duration} {suffix}',
  'todayProof.streak.on': 'En',
  'todayProof.streak.off': 'Apagado',
  'todayProof.streak.reminders': 'Recordatorios de prueba',
  'todayProof.streak.preferred_time': 'Hora preferida: {time}',
  'todayProof.streak.reminders_off':
    'Los recordatorios de prueba están desactivados',
  'todayProof.streak.reminders_paused':
    'Recordatorios en pausa durante {hours} horas.',
  'todayProof.streak.remind_in': 'Recordármelo en horas {hours}',
  'todayProof.streak.freeze_title': 'La racha se congela',
  'todayProof.streak.open_items': 'Artículos abiertos',
  'todayProof.streak.freeze_accessibility':
    'La racha se congela. {available}. Menta usa uno automáticamente después de un día perdido elegible.',
  'todayProof.streak.freeze_copy':
    'Un día protegido aparece aquí sólo después de que Menta confirma el resultado. La presentación de pruebas hoy no utiliza el congelamiento. {grant}',
  'todayProof.streak.challenge_not_found': 'Reto no encontrado',
  'todayProof.streak.already_checked_in': 'Ya me registré hoy',
  'todayProof.streak.within_grace_period': 'Dentro del periodo de gracia',
  'todayProof.streak.freeze_used':
    '¡Se utilizó congelación de rachas! Quedan {count}.',
  'todayProof.streak.no_freezes':
    'No hay congelaciones disponibles. La racha se restablecerá en el próximo envío.',
  'todayProof.streak.no_recent_checkin':
    'No se encontró ningún seguimiento reciente',
  'todayProof.streak.check_error': 'Error al comprobar el estado de la racha',
  'todayProof.streak.deadline_note':
    'Una fecha límite de prueba o un horario de silencio pueden cambiar la hora de envío real.',
  'todayProof.streak.default_time': '8:00 pm',
  'todayProof.creation.create_hub': 'Crear centro',
  'todayProof.creation.header': 'Crear',
  'todayProof.creation.what_create': '¿Qué quieres crear?',
  'todayProof.creation.create_intro':
    'Inicia una promesa para ti mismo o construya una con un grupo.',
  'todayProof.creation.create_promise_detail':
    'Establece una acción, un plazo y la prueba que utilizarás.',
  'todayProof.creation.join_public': 'Únete a una promesa pública',
  'todayProof.creation.join_public_detail':
    'Elige una promesa compartida con una fecha de finalización establecida.',
  'todayProof.creation.with_group': 'Crear con un grupo',
  'todayProof.creation.with_group_detail':
    'Elige un grupo antes de establecer la promesa.',
  'todayProof.creation.how_work': 'Cómo funcionan las promesas',
  'todayProof.creation.choose_group_first': 'Elige un grupo primero.',
  'todayProof.creation.choose_group_first_detail':
    'Tu borrador aún es privado. Elige o crea un grupo antes de que tus miembros puedan revisar tu prueba.',
  'todayProof.creation.choose_group': 'Elige un grupo',
  'todayProof.creation.keep_personal': 'Mantén esto personal',
  'todayProof.creation.title': 'Crea una promesa o únete a otros.',
  'todayProof.creation.subtitle':
    'Las promesas en solitario se mantienen en privado. Las promesas grupales comparten el progreso con las personas que elijas.',
  'todayProof.creation.close_hub': 'Cerrar crear centro',
  'todayProof.creation.create_options': 'Crear opciones',
  'todayProof.creation.group_promise': 'Añade una promesa a tu grupo',
  'todayProof.creation.group_promise_detail':
    'Comparta el estado de la promesa y la prueba con el grupo.',
  'todayProof.creation.create_group': 'Crear un grupo',
  'todayProof.creation.create_group_detail':
    'Invite a las personas a un espacio compartido para hacer promesas y pruebas.',
  'todayProof.creation.solo_promise': 'Haz una promesa en solitario',
  'todayProof.creation.solo_promise_detail':
    'Mantenlo en privado y elige la prueba tú mismo.',
  'todayProof.creation.saved_invite': 'Abrir invitación guardada',
  'todayProof.creation.saved_invite_detail':
    'El código {code} está guardado en este celular.',
  'todayProof.creation.join_invite': 'Unirse con invitación',
  'todayProof.creation.join_invite_detail':
    'Introduce o escanea un código de invitación.',
  'todayProof.creation.browse_events': 'Explorar eventos',
  'todayProof.creation.browse_events_detail':
    'Encuentre un evento público al que unirse.',
  'todayProof.promise.invite_not_confirmed': 'Invitación no confirmada',
  'todayProof.promise.invite_still_available':
    'Menta no puede confirmar que se haya enviado la invitación. La invitación sigue disponible aquí si quieres copiarla o volver más tarde.',
  'todayProof.residual.share_promise': 'compartir promesa',
  'todayProof.residual.waiting': 'Espera',
  'todayProof.residual.redo': 'Rehacer',
  'todayProof.residual.due': 'Pendiente',
  'todayProof.residual.open': 'Abierto',
  'todayProof.residual.window': 'Ventana',
  'todayProof.residual.schedule': 'Cronograma',
  'todayProof.residual.visibility': 'Visibilidad',
  'todayProof.residual.reminder': 'Recordatorio',
  'todayProof.residual.open_proof_recovery': 'Recuperación de prueba abierta',
  'todayProof.residual.not_counted_yet': 'Aún no contado',
  'todayProof.residual.the_saved_proof_remains_on_this_device_until_menta_confirms_the_':
    'La prueba guardada permanece en este dispositivo hasta que Menta confirme la recepción del servidor.',
  'todayProof.residual.view_proof_history': 'Ver historial de pruebas',
  'todayProof.residual.start_today_s_proof': 'Comienza la prueba de hoy',
  'todayProof.residual.check_again': 'comprobar de nuevo',
  'todayProof.residual.no_new_proof_was_started':
    'No se inició ninguna nueva prueba.',
  'todayProof.residual.check_the_current_server_status_before_sending_or_retrying_proof':
    'Verifica el estado actual del servidor antes de enviar o volver a intentar la prueba.',
  'todayProof.residual.a_previous_day_was_protected':
    'Un día anterior estaba protegido.',
  'todayProof.residual.the_protected_day_remains_in_proof_history_today_still_needs_its':
    'El día protegido permanece en el historial de pruebas. Hoy todavía se necesita tu propia prueba.',
  'todayProof.residual.status': 'Estado',
  'todayProof.residual.preparing_invite': 'Preparando invitación...',
  'todayProof.residual.checking': 'Comprobando…',
  'todayProof.residual.adding_time': 'Agregando tiempo…',
  'todayProof.residual.add_12_hours': 'Añadir 12 horas',
  'todayProof.residual.keep_current_due_time':
    'Mantener el tiempo de vencimiento actualizado',
  'todayProof.residual.support': 'Apoyo',
  'todayProof.residual.checking_streak_state':
    'Comprobando el estado de la racha',
  'todayProof.residual.network_request_failed_before_a_response_arrived':
    'La solicitud de red falló antes de que llegara una respuesta',
  'todayProof.residual.momenta': 'momentos',
  'todayProof.residual.creating_promise': 'Creando promesa...',
  'todayProof.residual.change': 'Cambiar',
  'todayProof.residual.starter_templates': 'Plantillas de inicio',
  'todayProof.residual.choose_one_then_edit_the_promise_and_proof_rule':
    'Elige uno y luego edite la regla de promesa y prueba.',
  'todayProof.residual.clear_template': 'Borrar plantilla',
  'todayProof.residual.templates_are_unavailable':
    'Las plantillas no están disponibles.',
  'todayProof.residual.no_template_was_applied_your_promise_details_and_proof_rule_stay':
    'No se aplicó ninguna plantilla. Los detalles de tu promesa y la regla de prueba permanecen exactamente como están.',
  'todayProof.residual.saved_to_your_account': 'Guardado en tu cuenta',
  'todayProof.residual.checking_for_updates': 'Buscando actualizaciones...',
  'todayProof.residual.edit_promise_words': 'Editar palabras de promesa',
  'todayProof.residual.edit_words': 'Editar palabras',
  'todayProof.residual.who_takes_part': 'quien participa',
  'todayProof.residual.edit_who_takes_part': 'Editar quién participa',
  'todayProof.residual.edit': 'Editar',
  'todayProof.residual.edit_proof_requirements': 'Editar requisitos de prueba',
  'todayProof.residual.proof_schedule': 'Calendario de pruebas',
  'todayProof.residual.edit_proof_schedule': 'Editar programa de pruebas',
  'todayProof.residual.how_many_days_should_this_last':
    '¿Cuántos días debería durar esto?',
  'todayProof.residual.choose_a_length_you_can_realistically_finish':
    'Elige una longitud que pueda terminar de manera realista.',
  'todayProof.residual.custom_window': 'Ventana personalizada',
  'todayProof.residual.or_enter_your_own_number_of_days':
    'O ingresa tu propio número de días',
  'todayProof.residual.duration_must_be_365_days_or_less':
    'La duración debe ser de 365 días o menos.',
  'todayProof.residual.use_1_365_days': 'Usa 1-365 días.',
  'todayProof.residual.choose_how_strict_the_schedule_should_be':
    'Elige qué tan estricto debe ser el horario',
  'todayProof.residual.the_options_change_the_target_and_the_number_of_missed_days_allo':
    'Las opciones cambian el objetivo y la cantidad de días perdidos permitidos. Elige uno que pueda mantener durante una semana ocupada.',
  'todayProof.residual.proof_target': 'Objetivo de prueba',
  'todayProof.residual.you_can_change_this_later_if_the_schedule_no_longer_works_for_yo':
    'Puedes cambiar esto más tarde si el horario ya no te funciona.',
  'todayProof.residual.let_other_people_find_this_promise':
    'Deja que otras personas encuentren esta promesa.',
  'todayProof.residual.people_can_find_and_join_it_each_person_s_proof_counts_when_they':
    'La gente puede encontrarla y unirse. La prueba de cada persona cuenta cuando la envía.',
  'todayProof.residual.people_outside_the_group_can_find_and_join_this_promise':
    'Personas ajenas al grupo pueden encontrar y unirse a esta promesa.',
  'todayProof.residual.d': 'd',
  'todayProof.residual.this_week': 'Esta semana',
  'todayProof.residual.proof_this_week': 'Prueba esta semana',
  'todayProof.residual.progress': 'Progreso',
  'todayProof.residual.day_resets_in': 'El día se reinicia en',
  'todayProof.residual.until_reset': 'hasta reiniciar',
  'todayProof.residual.confirmed_streak_milestone_receipt':
    'Recibo de hito de racha confirmado',
  'todayProof.residual.reward': 'Premio',
  'todayProof.residual.streak_freeze': 'Congelación de rachas',
  'todayProof.residual.added_to_your_inventory_for_keeping_this_streak':
    'Añadido a tu inventario por mantener esta racha',
  'todayProof.residual.if_you_share': 'si compartes',
  'todayProof.residual.your_proof_stays_private': 'Tu prueba permanece privada',
  'todayProof.residual.share_milestone': 'Compartir hito',
  'todayProof.residual.loading_promise_details':
    'Cargando detalles de la promesa',
  'todayProof.residual.visible_to': 'Visible para',
  'todayProof.residual.your_proof_is_waiting_for_a_reviewer':
    'Tu prueba está esperando un revisor.',
  'todayProof.residual.this_day_counts_only_after_approval':
    'Este día cuenta sólo después de la aprobación.',
  'todayProof.residual.proof_details_are_unavailable':
    'Los detalles de la prueba no están disponibles',
  'todayProof.residual.who_reviews': '¿Quién revisa?',
  'todayProof.residual.no_history_yet': 'Aún no hay historial',
  'todayProof.residual.proof_and_confirmed_day_outcomes_will_appear_here':
    'La prueba y los resultados del día confirmado aparecerán aquí.',
  'todayProof.residual.newest_first': 'Lo nuevo primero',
  'todayProof.residual.load_earlier_proof': 'Cargar prueba anterior',
  'todayProof.residual.rules_and_people': 'Reglas y personas',
  'todayProof.residual.what_counts': 'que cuenta',
  'todayProof.residual.proof_receipt': 'Recibo de prueba',
  'todayProof.residual.days_approved': 'Días aprobados',
  'todayProof.residual.share_result': 'Compartir resultado',
  'todayProof.residual.make_another_promise': 'hacer otra promesa',
  'todayProof.residual.this_promise_isn_t_available':
    'Esta promesa no está disponible.',
  'todayProof.residual.try_again_before_submitting_or_reviewing_proof':
    'Inténtalo de nuevo antes de enviar o revisar pruebas.',
  'todayProof.residual.report_a_problem': 'Informar un problema',
  'todayProof.residual.invite_preview': 'INVITACIÓN VISTA PREVIA',
  'todayProof.residual.copy_invite_link': 'Copiar enlace de invitación',
  'todayProof.residual.your_promise': 'TU PROMESA',
  'todayProof.residual.type_your_promise': 'Escribe tu promesa...',
  'todayProof.residual.daily_minimum': 'MÍNIMO DIARIO',
  'todayProof.residual.daily_minimum_2': 'Mínimo diario',
  'todayProof.residual.describe_what_counts_as_done':
    'Describe lo que se considera hecho...',
  'todayProof.residual.proof_should_show': 'LA PRUEBA DEBE MOSTRAR',
  'todayProof.residual.on_time': 'A tiempo',
  'todayProof.residual.missed_2': 'Omitido',
  'todayProof.residual.recent_check_ins': 'Registros recientes',
  'todayProof.residual.logged': 'registrado',
  'todayProof.residual.today_stays_open_until_you_check_in':
    'Hoy sigue abierto hasta que hagas el seguimiento.',
  'todayProof.residual.sign_in_again': 'Iniciar sesión de nuevo',
  'todayProof.residual.your_session_ended_before_menta_could_start_this_promise_sign_in':
    'Tu sesión terminó antes de que Menta pudiera comenzar esta promesa. Inicia sesión y vuelve aquí antes de volver a intentarlo.',
  'todayProof.residual.creation_result_unknown':
    'Resultado de creación desconocido',
  'todayProof.residual.menta_did_not_receive_a_final_answer_we_cannot_say_whether_this_':
    'Menta no recibió una respuesta final. No podemos decir si esta promesa comenzó, así que consulta Hoy antes de enviarla de nuevo.',
  'todayProof.residual.promise_not_created': 'Promesa no creada',
  'todayProof.residual.sign_in_to_return': 'Inicia sesión para regresar',
  'todayProof.residual.this_promise_needs_your_account_before_menta_can_show_its_proof_':
    'Esta promesa necesita tu cuenta antes de que Menta pueda mostrar tu estado de prueba y revisión.',
  'todayProof.residual.promise_not_available_to_this_account':
    'Promesa no disponible para esta cuenta',
  'todayProof.residual.menta_could_not_confirm_that_this_account_can_open_the_promise_a':
    'Menta no pudo confirmar que esta cuenta pueda abrir la promesa. Solicita acceso al propietario o vuelve a Hoy.',
  'todayProof.residual.promise_unavailable': 'Promesa no disponible',
  'todayProof.residual.this_promise_could_not_be_found_for_the_current_account_it_may_h':
    'Esta promesa no se pudo encontrar para la cuenta actual. Es posible que haya finalizado, se haya eliminado o no esté disponible para ti.',
  'todayProof.residual.promise_unavailable_offline':
    'Promesa no disponible sin conexión',
  'todayProof.residual.menta_cannot_confirm_the_latest_promise_proof_or_review_state_wi':
    'Menta no puede confirmar la última promesa, prueba o estado de revisión sin una conexión. Aquí no se ha marcado nada como completo.',
  'todayProof.residual.promise_could_not_load': 'La promesa no se pudo cargar',
  'todayProof.residual.menta_could_not_refresh_this_promise_retry_before_acting_on_a_mi':
    'Menta no pudo renovar esta promesa. Vuelve a intentarlo antes de actuar sobre una prueba faltante o un estado de revisión.',
  'todayProof.residual.what_to_change': 'que cambiar',
  'todayProof.residual.your_last_check_in_needs_a_clearer_follow_up_before_the_day_clos':
    'Tu último seguimiento necesita un seguimiento más claro antes de que cierre el día.',
  'todayProof.residual.saved_on_this_phone': 'Guardado en este celular',
  'todayProof.residual.your_draft_stays_on_this_phone_open_menta_when_you_are_online_to':
    'Tu borrador permanece en este celular. Abre Menta cuando estés en línea para reanudar el envío.',
  'todayProof.residual.proof_sent': 'Prueba enviada',
  'todayProof.residual.your_proof_is_in_but_it_does_not_count_yet_it_counts_after_a_rev':
    'Tu prueba está aquí, pero aún no cuenta. Cuenta cuando un revisor la acepte y no es necesario volver a enviarla.',
  'todayProof.residual.proof_approved': 'Prueba aprobada',
  'todayProof.residual.it_now_counts_for_today_s_promise':
    'Ahora cuenta para la promesa de hoy.',
  'todayProof.residual.we_couldn_t_confirm_the_send':
    'No pudimos confirmar el envío.',
  'todayProof.residual.menta_could_not_confirm_whether_your_proof_was_sent_your_origina':
    'Menta no pudo confirmar si se envió tu prueba. Tu original todavía está guardado en este celular. Comprueba tu estado antes de volver a enviar.',
  'todayProof.residual.not_sent': 'No enviado',
  'todayProof.residual.check_your_connection_then_try_again':
    'Verifica tu conexión y vuelve a intentarlo.',
  'todayProof.residual.reward_summary':
    'Mantener esta racha paga alrededor de {reward} Momenta, más una congelación a los 7 y 30 días.',
  'todayProof.milestone.reached': 'Se alcanzó el día del hito {count}.',
  'todayProof.milestone.reached.one': 'Llegaste al día {count}.',
  'todayProof.milestone.reached.other': 'Llegaste a {count} días.',
  'todayProof.milestone.reward': '+{reward} Momentas',
  'todayProof.streak.day_count': 'Racha de {count} días',
  'todayProof.streak.day_count.one': 'Racha de {count} día',
  'todayProof.streak.day_count.other': 'Racha de {count} días',
  'todayProof.streak.best_count': 'Mejor: {count} días',
  'todayProof.streak.best_count.one': 'Mejor: {count} día',
  'todayProof.streak.best_count.other': 'Mejor: {count} días',
  'todayProof.streak.progress': '{completed} de {total} días',
  'todayProof.promise.proof_type_approval':
    '{proofType} · un día cuenta sólo después de que se aprueba la prueba',
  'todayProof.promise.extend_question': '¿Añadir 12 horas a {promise}?',
  'todayProof.promise.extension_cost': 'Esto utiliza un {item}.',
  'todayProof.promise.active_for': 'Activo para {duration}',
  'todayProof.promise.available_count': '{count} disponible',
  'todayProof.create.step_progress': 'Paso {current} de {total}',
  'todayProof.residual.missed_day_summary':
    '{count} días perdidos. Tu próximo seguimiento aceptado inicia una nueva racha.',
  'todayProof.residual.missed_day_summary.one':
    '{count} día perdido. Tu próximo seguimiento aceptado inicia una nueva racha.',
  'todayProof.residual.missed_day_summary.other':
    '{count} días perdidos. Tu próximo seguimiento aceptado inicia una nueva racha.',
  'todayProof.correction.title_note': 'Una nota más clara y listo.',
  'todayProof.correction.detail_note':
    'Añade una nota más clara para terminar hoy.',
  'todayProof.correction.action_note': 'Añade una nota más clara',
  'todayProof.correction.title_photo': 'Una foto más clara y listo.',
  'todayProof.correction.detail_photo':
    'Añade una foto más clara para terminar hoy.',
  'todayProof.correction.action_photo': 'Añade una foto más clara',
  'todayProof.correction.title_video': 'Un video más claro y listo.',
  'todayProof.correction.detail_video':
    'Añade un video más claro para terminar hoy.',
  'todayProof.correction.action_video': 'Añade un video más claro',
  'todayProof.correction.title_proof': 'Una prueba más clara y listo.',
  'todayProof.correction.detail_proof':
    'Añade pruebas más claras para terminar hoy.',
  'todayProof.correction.action_proof': 'Añade pruebas más claras',
  'todayProof.residual.delivery_not_confirmed': 'Entrega no confirmada',
  'todayProof.residual.promise_status_unavailable':
    'Estado de la promesa no disponible',
  'todayProof.residual.proof_still_saved_on_this_phone':
    'Tu prueba sigue guardada en este celular.',
  'todayProof.residual.nothing_saved_on_this_phone_was_changed':
    'No ha cambiado nada de lo guardado en este celular.',
  'todayProof.residual.proof_receive_not_confirmed':
    'No hemos confirmado que se haya recibido.',
  'todayProof.residual.latest_promise_details_not_confirmed':
    'No hemos podido confirmar los datos más recientes de la promesa.',
  'todayProof.source.creation.failed':
    'Menta no ha podido iniciar esta promesa.',
  'todayProof.source.history.approved': '{media} aprobada',
  'todayProof.source.history.needs_another_try':
    '{media} necesita otro intento',
  'todayProof.source.lifecycle.due': 'Prueba pendiente',
  'todayProof.source.lifecycle.saved': 'Guardada en este dispositivo',
  'todayProof.source.lifecycle.uploading': 'Enviando prueba',
  'todayProof.source.lifecycle.sent': 'Prueba enviada',
  'todayProof.source.lifecycle.pending': 'Pendiente de revisión',
  'todayProof.source.lifecycle.accepted': 'Prueba aceptada',
  'todayProof.source.lifecycle.correction':
    'La prueba necesita una respuesta más clara',
  'todayProof.source.lifecycle.unknown':
    'No hemos podido confirmar el resultado',
  'todayProof.source.lifecycle.failed': 'La prueba no se ha enviado',
  'todayProof.source.media.text': 'Prueba escrita',
  'todayProof.source.media.video': 'Vídeo',
  'todayProof.source.media.photo': 'Foto',
  'todayProof.source.media.proof': 'Prueba',
  'todayProof.source.promise.submission_time_unavailable':
    'Hora de envío no disponible',
  'todayProof.source.relative.sent_minutes': 'Enviada hace {count} minutos',
  'todayProof.source.relative.sent_minutes.one': 'Enviada hace {count} minuto',
  'todayProof.source.relative.sent_minutes.other':
    'Enviada hace {count} minutos',
  'todayProof.source.relative.sent_hours': 'Enviada hace {count} horas',
  'todayProof.source.relative.sent_hours.one': 'Enviada hace {count} hora',
  'todayProof.source.relative.sent_hours.other': 'Enviada hace {count} horas',
  'todayProof.source.relative.sent_weekday': 'Enviada {weekday}',
  'todayProof.source.outcome.missed':
    'La prueba no se recibió antes de la fecha límite. La racha anterior terminó en {streak}.',
  'todayProof.source.outcome.protected_freeze':
    'Un protector de racha ha protegido este día. La racha se ha mantenido en {streak}.',
  'todayProof.source.outcome.protected':
    'Este día ha quedado protegido. La racha se ha mantenido en {streak}.',
  'todayProof.source.review.changed_detail_with_note_preserved':
    'Ha cambiado mientras la revisabas. No se ha enviado nada. Vuelve a cargarla antes de decidir. Tu nota de corrección sin enviar permanecerá aquí hasta que la cargues o salgas de la cola. Nota: {note}',
  'todayProof.source.review.item_accessibility':
    'Prueba de {name} para {promise}',
  'todayProof.source.streak.day_unit': 'día',
  'todayProof.source.streak.days_unit': 'días',
  'todayProof.source.streak.day_streak_unit': 'racha de días',
  'todayProof.source.streak.minute_unit': 'minuto',
  'todayProof.source.streak.minutes_unit': 'minutos',
  'todayProof.source.verification.missing_promise':
    'Faltan datos de la promesa. Vuelve a abrirla desde la pantalla de la promesa.',
  'todayProof.source.verification.unsupported_type':
    'Este tipo de prueba aún no se admite aquí. Vuelve a abrir la promesa para continuar.',
  'todayProof.source.accountability.previous_proof': 'Pruebas anteriores',
  'todayProof.source.accountability.only_you': 'Solo tú',
  'todayProof.source.accountability.visibility_mixed':
    'Solo tú y las personas de cada promesa',
  'todayProof.profile.approved_proof_count': 'Pruebas aprobadas: {count}',
  'todayProof.streak.reminder_row_accessibility':
    'Recordatorios de pruebas. {detail}. Preferencia: {status}.',
} as const satisfies Pick<EnglishCatalogue, FullTodayProofKey>;
