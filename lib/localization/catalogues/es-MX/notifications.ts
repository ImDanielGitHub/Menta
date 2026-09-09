import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type NotificationsKey = Extract<
  keyof EnglishCatalogue,
  `notifications.${string}`
>;

export const notificationsEsMX = {
  'notifications.topbar.back': 'Volver',
  'notifications.topbar.context': 'Opcional',
  'notifications.topbar.title': 'Notificaciones',
  'notifications.education.title':
    '¿Quieres recibir recordatorios de tus promesas?',
  'notifications.education.body':
    'Menta puede recordarte cuando se acerque la fecha límite de una prueba y cuando alguien envíe una prueba para revisión. Después, tu celular te pedirá permiso.',
  'notifications.education.proof_due.title': '“La prueba vence pronto”',
  'notifications.education.proof_due.body':
    'Cuando una promesa se acerca a tu fecha límite',
  'notifications.education.review.title': '“Una prueba necesita tu revisión”',
  'notifications.education.review.body':
    'Cuando alguien envía una prueba para una promesa compartida',
  'notifications.action.turn_on': 'Activar recordatorios',
  'notifications.action.continue_without': 'Continuar sin recordatorios',
  'notifications.action.open_settings': 'Abrir la configuración del celular',
  'notifications.action.retry': 'Intentar configurar recordatorios de nuevo',
  'notifications.action.back_to_settings':
    'Volver a la configuración de notificaciones',
  'notifications.permission_prompt.hint':
    'Abre la solicitud de permiso para notificaciones de tu celular',
  'notifications.permission_off.title': 'Sin recordatorios por ahora',
  'notifications.permission_off.body':
    'Tus promesas siguen funcionando. Revisa Hoy para ver qué tienes pendiente o activa los recordatorios después en Perfil.',
  'notifications.permission_off.later.title': 'Activarlos después',
  'notifications.permission_off.later.body':
    'Abre Perfil y luego Notificaciones.',
  'notifications.registration_pending.title':
    'Los recordatorios todavía no están listos',
  'notifications.registration_pending.body':
    'Inténtalo de nuevo antes de depender de los recordatorios, o continúa y actívalos después.',
  'notifications.phone.title': 'Notificaciones del celular',
  'notifications.phone.allowed': 'Las notificaciones están permitidas',
  'notifications.phone.allowed_by_phone': 'Permitidas por este celular',
  'notifications.status.on': 'Activadas',
  'notifications.menta.title': 'Recordatorios de Menta',
  'notifications.menta.not_connected': 'Este celular todavía no está conectado',
  'notifications.menta.connected': 'Este celular está conectado',
  'notifications.status.checking': 'Revisando…',
  'notifications.status.not_ready': 'No están listas',
  'notifications.status.ready': 'Listas',
  'notifications.granted.title':
    'Este celular está listo para las notificaciones de Menta',
  'notifications.granted.body':
    'Elige qué recordatorios quieres recibir en la configuración de notificaciones.',
  'notifications.notice.setup_failed.title':
    'No terminamos de configurar los recordatorios',
  'notifications.notice.setup_failed.body':
    'Inténtalo de nuevo o continúa sin recordatorios.',
  'notifications.notice.still_off.title':
    'Las notificaciones siguen desactivadas',
  'notifications.notice.still_off.body':
    'Tus promesas siguen funcionando. Menta no volverá a pedirte permiso aquí.',
  'notifications.notice.allowed.title':
    'Tu celular ya permite las notificaciones',
  'notifications.notice.allowed.body':
    'Menta está terminando de configurar los recordatorios para este celular.',
  'notifications.notice.check_failed.title':
    'No pudimos revisar la configuración de notificaciones',
  'notifications.notice.continue_later.body':
    'Puedes continuar sin recordatorios e intentarlo de nuevo después.',
  'notifications.notice.sign_in.title':
    'Inicia sesión para configurar los recordatorios',
  'notifications.notice.sign_in.body':
    'Menta necesita una cuenta para guardar las preferencias de recordatorios de este celular.',
  'notifications.notice.prompt_failed.title':
    'No pudimos abrir la solicitud de permiso para notificaciones',
  'notifications.notice.settings_opening.title':
    'Se está abriendo la configuración del celular',
  'notifications.notice.settings_opening.body':
    'Elige si Menta puede enviar notificaciones y luego regresa aquí.',
  'notifications.notice.settings_failed.title':
    'No pudimos abrir la configuración',
  'notifications.notice.settings_failed.body':
    'Abre la configuración del celular, elige Menta y luego Notificaciones para cambiar este permiso.',
  'notifications.onboarding.title': 'No te pierdas el momento.',
  'notifications.onboarding.body':
    'Menta necesita permiso para enviarte recordatorios cuando venza una prueba o alguien necesite que la revises.',
  'notifications.onboarding.trust':
    'Solo los recordatorios que elijas. Puedes cambiarlo cuando quieras.',
  'notifications.onboarding.card.title': 'Prueba pendiente en 30 min',
  'notifications.onboarding.card.body': 'Lo prometiste. Termina con fuerza.',
  'notifications.onboarding.action.turn_on': 'Activar notificaciones',
  'notifications.onboarding.action.not_now': 'Ahora no',
  'notifications.onboarding.permission_off.title': 'No pasa nada.',
  'notifications.onboarding.permission_off.body':
    'Menta funciona sin notificaciones. Puedes activar los recordatorios más tarde desde Configuración.',
  'notifications.onboarding.permission_off.action': 'Continuar',
  'notifications.onboarding.permission_off.settings': 'Abrir configuración',
  'notifications.onboarding.granted.title': 'Todo listo.',
  'notifications.onboarding.granted.body':
    'Menta terminará de conectar los recordatorios después de que inicies sesión.',
  'notifications.onboarding.granted.action': 'Continuar para iniciar sesión',
  'notifications.onboarding.card.accessibility':
    'Vista previa de una notificación de Menta. Prueba pendiente en 30 minutos. Lo prometiste. Termina con fuerza.',
} as const satisfies Pick<EnglishCatalogue, NotificationsKey>;
