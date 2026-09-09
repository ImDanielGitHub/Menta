import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type TodayStateKey = Extract<keyof EnglishCatalogue, `today.state.${string}`>;

export const todayStatesEsMX = {
  'today.state.outcome.missed_day': 'el día perdido',
  'today.state.action.try_again': 'Volver a intentarlo',
  'today.state.action.see_promise': 'Ver promesa',
  'today.state.action.browse_groups': 'Explorar grupos',
  'today.state.action.make_promise': 'Crear una promesa',
  'today.state.protected.title': 'Racha protegida',
  'today.state.protected.count_continues': ' La racha continúa con {count}.',
  'today.state.protected.freeze_detail':
    'Un protector de racha cubrió el día perdido del {weekday}. El día se conserva en tu historial.{countCopy}',
  'today.state.protected.detail':
    '{weekday} quedó protegido. El día se conserva en tu historial.{countCopy}',
  'today.state.loading.title': 'Cargando Hoy.',
  'today.state.loading.detail':
    'Comprobando el estado más reciente de las pruebas y revisiones.',
  'today.state.loading.action': 'Cargando',
  'today.state.loading.last_confirmed': 'Usar el último estado confirmado',
  'today.state.offline.promise_title': 'Tu promesa sigue pendiente.',
  'today.state.offline.title': 'Se ha perdido la conexión.',
  'today.state.offline.promise_detail':
    'Puedes preparar la prueba ahora. Se enviará cuando recuperes la conexión.',
  'today.state.offline.detail':
    'Menta no puede actualizar tus promesas ahora mismo. Nada ha cambiado en este celular.',
  'today.state.offline.prepare_proof': 'Preparar prueba',
  'today.state.load_failed.refresh_title': 'No se pudo actualizar Hoy.',
  'today.state.load_failed.title': 'No se pudo cargar Hoy.',
  'today.state.load_failed.refresh_detail':
    'Se sigue mostrando el último estado confirmado. Aquí no ha cambiado el resultado de ninguna prueba ni revisión.',
  'today.state.load_failed.detail':
    'Comprueba la conexión y vuelve a intentarlo.',
  'today.state.streak.unavailable': 'No disponible',
  'today.state.streak.missed_title':
    'Has perdido un día. Vuelve a empezar hoy.',
  'today.state.streak.weekday_missed_title':
    'Faltaste el {weekday}. Vuelve a empezar hoy.',
  'today.state.streak.previous_detail':
    'La última racha terminó en {count} porque la prueba del {weekday} no llegó a tiempo. Tu historial sigue aquí.',
  'today.state.streak.missed_detail':
    'El {weekday} quedó registrado como perdido. Tu historial sigue aquí.',
  'today.state.streak.return_action': 'Volver durante un día',
  'today.state.streak.history_action': 'Ver historial de {count} días',
  'today.state.streak.history': 'Ver historial',
  'today.state.streak.previous_label': 'Racha anterior',
  'today.state.streak.new_label': 'Nueva racha',
  'today.state.streak.starts_today': 'Empieza hoy',
  'today.state.streak.supporting_note':
    'Un día basta para volver a empezar. Menta no borrará la racha anterior.',
  'today.state.returning.away_days': 'No haces un registro desde hace {count}.',
  'today.state.returning.away': 'Llevas un tiempo sin entrar.',
  'today.state.returning.title': 'Empieza desde donde estás.',
  'today.state.returning.detail':
    '{awayCopy} Nada está oculto y no te espera ninguna pantalla para hacerte sentir mal. Elige un pequeño paso para regresar.',
  'today.state.returning.action': 'Empezar de nuevo',
  'today.state.returning.history': 'Ver mi historial',
  'today.state.returning.fresh_start': 'Nuevo comienzo',
  'today.state.returning.fresh_start_value':
    'Tu historial se conserva. Tú eliges el siguiente paso.',
  'today.state.returning.supporting_note':
    'Haz una promesa más pequeña o abre el historial y retoma la última.',
  'today.state.no_promises.title': 'Aún no hay nada pendiente.',
  'today.state.no_promises.detail':
    'Crea una promesa y Menta te mostrará cada día lo que necesita tu atención.',
  'today.state.no_promises.join_group': 'Unirme a un grupo existente',
  'today.state.proof_due.text_detail':
    'Añade la nota que acordaste. Solo podéis verla tú y quien la revisa.',
  'today.state.proof_due.text_action': 'Agregar nota como prueba',
  'today.state.proof_due.video_detail':
    'Añade el video que acordaste. Solo será visible para esta promesa y quien la revisa.',
  'today.state.proof_due.video_action': 'Agregar video como prueba',
  'today.state.proof_due.photo_detail':
    'Añade la foto que acordaste. Solo será visible para esta promesa y quien la revisa.',
  'today.state.proof_due.photo_action': 'Agregar foto como prueba',
  'today.state.proof_due.risk_title': 'Hoy todavía cuenta.',
  'today.state.proof_due.streak_risk_detail':
    'Tu racha de {streak} sigue activa. Intenta agregar {proofNoun} antes de las {dueLabel}. La prueba cuenta hasta medianoche.',
  'today.state.proof_due.risk_detail':
    'Intenta agregar {proofNoun} antes de las {dueLabel}. La prueba cuenta hasta medianoche.',
  'today.state.proof_due.log_action': 'Registrar la prueba de hoy',
  'today.state.proof_due.risk_note':
    'No ha cambiado ninguna revisión ni resultado. El siguiente paso es registrar la prueba.',
  'today.state.proof_due.title': 'La prueba vence hoy.',
  'today.state.saved.unknown_title': 'Menta no pudo confirmar el envío.',
  'today.state.saved.failed_title': 'La prueba se quedó en este celular.',
  'today.state.saved.title': 'Tu prueba está a salvo aquí.',
  'today.state.saved.unknown_detail':
    'El original sigue guardado. Comprueba tu estado antes de volver a intentarlo.',
  'today.state.saved.failed_detail':
    'Revisa tu conexión y vuelve a intentarlo. El original se queda en este celular.',
  'today.state.saved.detail': 'Envíala cuando tengas conexión.',
  'today.state.saved.check_action': 'Comprobar estado de la prueba',
  'today.state.saved.retry_action': 'Volver a enviar',
  'today.state.saved.send_action': 'Enviar prueba guardada',
  'today.state.uploading.title': 'Enviando tu prueba.',
  'today.state.uploading.detail':
    'Mantén Menta abierto hasta que se confirme el envío.',
  'today.state.uploading.action': 'Enviando prueba',
  'today.state.pending.named_title': '{promise} espera revisión.',
  'today.state.pending.title': 'Tu prueba espera revisión.',
  'today.state.pending.detail':
    'Ha llegado a Menta. El resultado aparecerá aquí.',
  'today.state.pending.action': 'Ver prueba',
  'today.state.correction.title': 'Tu prueba necesita un cambio.',
  'today.state.correction.detail':
    'Añade una prueba más clara para completar el día. El original sigue guardado.',
  'today.state.correction.action': 'Actualizar prueba',
  'today.state.correction.feedback': 'Ver indicaciones',
  'today.state.review.named_title': '{name} ha enviado una prueba.',
  'today.state.review.title': 'Hay una prueba pendiente de tu revisión.',
  'today.state.review.detail':
    'Revisa la foto. Apruébala o pide un solo cambio claro. Cada revisión confirmada añade {reward} Momenta, hasta {dailyLimit} al día.',
  'today.state.review.action': 'Revisar prueba',
  'today.state.review.see_group': 'Ver grupo',
  'today.state.review.open_queue': 'Abrir lista de revisión',
  'today.state.group_risk.named_title': '{group} necesita un registro.',
  'today.state.group_risk.title': 'Un grupo necesita un registro.',
  'today.state.group_risk.named_detail':
    'Abre el grupo para ver qué está pendiente.',
  'today.state.group_risk.detail':
    'Abre el grupo para ver quién todavía necesita hacer tu registro.',
  'today.state.group_risk.action': 'Abrir grupo',
  'today.state.accepted.named_title': '{promise} está completada.',
  'today.state.accepted.title': 'Hoy está completado.',
  'today.state.accepted.detail':
    'Tu prueba se aprobó y se guardó en tu historial.',
  'today.state.accepted.named_receipt': '{promise} aprobada',
  'today.state.accepted.receipt': 'Prueba aprobada',
  'today.state.accepted.receipt_detail':
    'El resultado de hoy está confirmado en el historial de tu promesa.',
  'today.state.all_clear.review_unknown_title':
    'No hay ninguna prueba pendiente ahora mismo.',
  'today.state.all_clear.title': 'Nada requiere tu atención ahora mismo.',
  'today.state.all_clear.review_unknown_detail':
    'Menta no pudo comprobar las solicitudes de revisión. Actualiza Hoy de nuevo.',
  'today.state.all_clear.detail':
    'Vuelve cuando venza una promesa o alguien envíe una prueba.',
  'today.state.all_clear.review_status':
    'No hay ninguna prueba esperando tu revisión.',
} as const satisfies Pick<EnglishCatalogue, TodayStateKey>;
