import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type NotificationsKey = Extract<
  keyof EnglishCatalogue,
  `notifications.${string}`
>;

export const notificationsEsES = {
  'notifications.topbar.back': 'Atrás',
  'notifications.topbar.context': 'Opcional',
  'notifications.topbar.title': 'Notificaciones',
  'notifications.education.title':
    '¿Quieres recibir recordatorios de tus promesas?',
  'notifications.education.body':
    'Menta puede avisarte antes de que venza el plazo para enviar la prueba y cuando alguien envíe una prueba para que la revises. A continuación, tu teléfono te pedirá permiso.',
  'notifications.education.proof_due.title': '«La prueba vence pronto»',
  'notifications.education.proof_due.body':
    'Cuando se acerca el plazo de una promesa',
  'notifications.education.review.title':
    '«Hay una prueba pendiente de revisión»',
  'notifications.education.review.body':
    'Cuando alguien envía una prueba de una promesa compartida',
  'notifications.action.turn_on': 'Activar recordatorios',
  'notifications.action.continue_without': 'Continuar sin recordatorios',
  'notifications.action.open_settings': 'Abrir los ajustes del teléfono',
  'notifications.action.retry': 'Volver a configurar los recordatorios',
  'notifications.action.back_to_settings':
    'Volver a los ajustes de notificaciones',
  'notifications.permission_prompt.hint':
    'Abre la solicitud de permiso para notificaciones de tu teléfono',
  'notifications.permission_off.title': 'Sin recordatorios por ahora',
  'notifications.permission_off.body':
    'Tus promesas siguen funcionando. Consulta Hoy para ver qué tienes pendiente o activa los recordatorios más adelante en Perfil.',
  'notifications.permission_off.later.title': 'Actívalos más adelante',
  'notifications.permission_off.later.body':
    'Abre Perfil y luego Notificaciones.',
  'notifications.registration_pending.title':
    'Los recordatorios aún no están listos',
  'notifications.registration_pending.body':
    'Vuelve a intentarlo antes de depender de los recordatorios o continúa y actívalos más adelante.',
  'notifications.phone.title': 'Notificaciones del teléfono',
  'notifications.phone.allowed': 'Las notificaciones están permitidas',
  'notifications.phone.allowed_by_phone': 'Permitidas por este teléfono',
  'notifications.status.on': 'Activadas',
  'notifications.menta.title': 'Recordatorios de Menta',
  'notifications.menta.not_connected': 'Este dispositivo aún no está conectado',
  'notifications.menta.connected': 'Este dispositivo está conectado',
  'notifications.status.checking': 'Comprobando…',
  'notifications.status.not_ready': 'No están listos',
  'notifications.status.ready': 'Listos',
  'notifications.granted.title':
    'Este teléfono ya puede recibir notificaciones de Menta',
  'notifications.granted.body':
    'Elige qué recordatorios quieres recibir en los ajustes de notificaciones.',
  'notifications.notice.setup_failed.title':
    'No se terminó de configurar los recordatorios',
  'notifications.notice.setup_failed.body':
    'Vuelve a intentarlo o continúa sin recordatorios.',
  'notifications.notice.still_off.title':
    'Las notificaciones siguen desactivadas',
  'notifications.notice.still_off.body':
    'Tus promesas siguen funcionando. Menta no volverá a pedírtelo aquí.',
  'notifications.notice.allowed.title':
    'Tu teléfono ya permite las notificaciones',
  'notifications.notice.allowed.body':
    'Menta está terminando de configurar los recordatorios en este teléfono.',
  'notifications.notice.check_failed.title':
    'No se pudo comprobar el ajuste de notificaciones',
  'notifications.notice.continue_later.body':
    'Puedes continuar sin recordatorios y volver a intentarlo más adelante.',
  'notifications.notice.sign_in.title':
    'Inicia sesión para configurar recordatorios',
  'notifications.notice.sign_in.body':
    'Menta necesita una cuenta para guardar las preferencias de recordatorios de este teléfono.',
  'notifications.notice.prompt_failed.title':
    'No se pudo abrir la solicitud de notificaciones',
  'notifications.notice.settings_opening.title':
    'Se están abriendo los ajustes del teléfono',
  'notifications.notice.settings_opening.body':
    'Elige si Menta puede enviar notificaciones y después vuelve aquí.',
  'notifications.notice.settings_failed.title':
    'No se pudieron abrir los ajustes',
  'notifications.notice.settings_failed.body':
    'Abre los ajustes del teléfono, elige Menta y después Notificaciones para cambiar este permiso.',
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
    'Menta funciona sin notificaciones. Puedes activar los recordatorios más tarde desde Ajustes.',
  'notifications.onboarding.permission_off.action': 'Continuar',
  'notifications.onboarding.permission_off.settings': 'Abrir ajustes',
  'notifications.onboarding.granted.title': 'Todo listo.',
  'notifications.onboarding.granted.body':
    'Menta terminará de conectar los recordatorios después de que inicies sesión.',
  'notifications.onboarding.granted.action': 'Continuar para iniciar sesión',
  'notifications.onboarding.card.accessibility':
    'Vista previa de una notificación de Menta. Prueba pendiente en 30 minutos. Lo prometiste. Termina con fuerza.',
} as const satisfies Pick<EnglishCatalogue, NotificationsKey>;
