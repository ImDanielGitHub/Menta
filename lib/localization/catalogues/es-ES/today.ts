import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type TodayKey = Extract<keyof EnglishCatalogue, `today.${string}`>;

export const todayEsES = {
  'today.progress.streak_days': '{count} días',
  'today.progress.streak_days.one': '{count} día',
  'today.progress.streak_days.other': '{count} días',
  'today.progress.day_of': 'Día {day} de {total}',
  'today.progress.day': 'Día {day}',
  'today.progress.current_streak': 'Racha actual',
  'today.progress.promise': 'Progreso de la promesa',
  'today.progress.accessibility.current_streak': 'Racha actual: {value}.',
  'today.progress.accessibility.promise': 'Progreso de la promesa: {value}.',
  'today.all_clear.due_now': 'pendientes ahora',
  'today.all_clear.accessibility.zero_due': 'No hay nada pendiente ahora.',
  'today.loading.accessibility': 'Cargando Hoy',
  'today.proof.heading': 'A continuación',
  'today.proof.solo': 'Individual',
  'today.proof.meta': '{group} · Día {day}/{total} · {status}',
  'today.proof.status.waiting_review': 'Pendiente de revisión',
  'today.proof.status.approved': 'Prueba aprobada',
  'today.proof.status.correction_requested': 'Se necesita otra prueba',
  'today.proof.status.sent': 'Prueba enviada',
  'today.proof.status.due_now': 'Prueba pendiente ahora',
  'today.proof.status.due': 'Prueba pendiente',
  'today.proof.action.view': 'Ver',
  'today.proof.action.update': 'Actualizar',
  'today.proof.action.write': 'Escribir',
  'today.proof.action.record': 'Grabar',
  'today.proof.action.add_photo': 'Añadir foto',
  'today.proof.action.add_proof': 'Añadir prueba',
  'today.proof.empty.title': 'Aún no hay promesas',
  'today.proof.empty.body':
    'Haz una promesa y tu primer seguimiento aparecerá aquí.',
  'today.proof.empty.action': 'Hacer una',
  'today.home.streak.caption': 'días seguidos',
  'today.home.streak.accessibility':
    'Mejor racha actual: {days}. {status} Muestra la racha de cada promesa.',
  'today.home.streak.accessibility_none':
    'Aún no hay racha. Muestra cómo se cuentan las rachas.',
  'today.home.streak.status_kept': 'Hoy está aprobado.',
  'today.home.streak.status_waiting':
    'La prueba de hoy está pendiente de revisión.',
  'today.home.streak.status_due': 'La prueba de hoy sigue pendiente.',
  'today.home.streak.status_risk': 'La prueba de hoy vence pronto.',
  'today.home.momenta.caption': 'Momenta',
  'today.home.momenta.accessibility': '{balance} Momenta. Abre tu cartera.',
  'today.home.momenta.accessibility_unknown':
    'Saldo de Momenta aún sin confirmar. Abre tu cartera.',
  'today.home.week.accessibility':
    'Últimos 7 días: {count} días con prueba aprobada.',
  'today.home.week.accessibility.one':
    'Últimos 7 días: {count} día con prueba aprobada.',
  'today.home.week.accessibility.other':
    'Últimos 7 días: {count} días con prueba aprobada.',
  'today.home.streaks.title': 'Tus rachas',
  'today.home.streaks.note':
    'Una racha cuenta días con prueba aprobada, no días con una promesa abierta.',
  'today.home.streaks.empty':
    'Tu primera racha empieza cuando alguien aprueba tu prueba.',
  'today.home.streaks.longest': 'Más larga: {days}',
  'today.home.streaks.row_accessibility':
    '{promise}. Racha {days}. {status}. Abre el historial.',
  'today.home.receipt.accessibility': 'Promesa de hoy. {facts}',
  'today.home.receipt.proof': 'Prueba',
  'today.home.receipt.progress': 'Progreso',
  'today.home.receipt.streak': 'Racha',
  'today.home.receipt.group': 'Grupo',
  'today.home.receipt.today': 'Hoy',
  'today.home.receipt.photo': 'Foto',
  'today.home.receipt.video': 'Vídeo',
  'today.home.receipt.note': 'Nota escrita',
  'today.home.receipt.status_saved': 'Guardada en este teléfono',
  'today.home.receipt.status_sending': 'Enviando',
  'today.home.also.detail': '{where} · {day}',
  'today.home.personal': 'Personal',
  'today.home.review_queue': 'Abrir la cola de revisión',
  'today.home.bubble.returning': 'Empieza desde donde estás.',
  'today.countdown.hours_minutes': '{hours} h {minutes} min',
  'today.countdown.hours': '{hours} h',
  'today.countdown.minutes': '{minutes} min',
  'today.countdown.left_proof': 'para añadir la prueba de hoy',
  'today.countdown.left_streak': 'para mantener tu racha de {count} días',
  'today.countdown.left_extension': 'de tu prórroga',
  'today.countdown.note_midnight': 'La prueba cuenta hasta medianoche.',
  'today.countdown.note_last_hour':
    'Después de medianoche, este día cuenta como perdido.',
  'today.countdown.note_extension':
    'La prueba cuenta hasta que termine tu prórroga.',
  'today.countdown.accessibility': '{duration} {caption}. {note}',
  'today.home.bubble.no_promises':
    '¿Qué es eso que siempre quieres hacer y no haces?',
} as const satisfies Partial<Pick<EnglishCatalogue, TodayKey>>;
