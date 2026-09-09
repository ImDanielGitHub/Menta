import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type TodayKey = Extract<keyof EnglishCatalogue, `today.${string}`>;

export const todayEsMX = {
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
  'today.proof.action.add_photo': 'Agregar foto',
  'today.proof.action.add_proof': 'Agregar prueba',
  'today.proof.empty.title': 'Aún no hay promesas',
  'today.proof.empty.body':
    'Crea una promesa y tu primer registro aparecerá aquí.',
  'today.proof.empty.action': 'Crear una',
} as const satisfies Partial<Pick<EnglishCatalogue, TodayKey>>;
